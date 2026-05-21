import "@/lib/logger"; // Ensure global console masking is initialized
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { encrypt } from "@/lib/encryption";
import { logPaymentEvent } from "@/lib/audit";
import { executeBkashPayment } from "@/lib/bkash";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const statusParam = url.searchParams.get("status");
  const paymentID = url.searchParams.get("paymentID");
  const tranId = url.searchParams.get("tran_id");

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  if (!tranId) {
    console.error("bKash callback missing tran_id query parameter.");
    return NextResponse.redirect(`${appUrl}/orders?failed=true&error=MissingTxnId`, 303);
  }

  try {
    // 1. Fetch matching transaction record
    const transaction = await prisma.paymentTransaction.findUnique({
      where: { gatewayTxnId: tranId },
      include: {
        intent: {
          include: {
            orders: true,
          },
        },
      },
    });

    if (!transaction) {
      console.error(`bKash callback transaction not found: ${tranId}`);
      return NextResponse.redirect(`${appUrl}/orders?failed=true&error=TransactionNotFound`, 303);
    }

    // IDEMPOTENCY: Check if transaction was already processed
    if (transaction.status === "SUCCESS") {
      return NextResponse.redirect(`${appUrl}/orders?success=true`, 303);
    }

    const intent = transaction.intent;
    const actor = intent.userId;

    // Handle Failures or Cancellations
    if (statusParam === "cancel" || statusParam === "failure") {
      await prisma.$transaction([
        prisma.paymentTransaction.update({
          where: { id: transaction.id },
          data: {
            status: "FAILED",
            gatewayResponseCode: statusParam.toUpperCase(),
          },
        }),
        prisma.paymentIntent.update({
          where: { id: intent.id },
          data: { status: "FAILED" },
        }),
        prisma.order.updateMany({
          where: { paymentIntentId: intent.id },
          data: { paymentStatus: "FAILED" },
        }),
      ]);

      await logPaymentEvent({
        actor,
        action: `BKASH_TRANSACTION_${statusParam.toUpperCase()}`,
        entity: "PaymentTransaction",
        before: transaction,
        after: { status: "FAILED" },
      });

      return NextResponse.redirect(`${appUrl}/orders?failed=true&error=Bkash${statusParam}`, 303);
    }

    if (!paymentID) {
      throw new Error("Missing paymentID parameter for verification.");
    }

    // 2. Server-side payment execution with bKash API
    const executionData = await executeBkashPayment(paymentID);

    if (executionData.statusCode !== "0000") {
      await prisma.$transaction([
        prisma.paymentTransaction.update({
          where: { id: transaction.id },
          data: {
            status: "FAILED",
            gatewayResponseCode: executionData.statusCode,
            rawPayloadEncrypted: encrypt(JSON.stringify(executionData)),
          },
        }),
        prisma.paymentIntent.update({
          where: { id: intent.id },
          data: { status: "FAILED" },
        }),
        prisma.order.updateMany({
          where: { paymentIntentId: intent.id },
          data: { paymentStatus: "FAILED" },
        }),
      ]);

      throw new Error(executionData.statusMessage || `bKash execute failed: ${executionData.statusCode}`);
    }

    // Extract wallet/phone digits
    const walletNo = executionData.customerMsisdn || "";
    const maskedMobile = walletNo.length > 4 ? walletNo.slice(-4) : "bKash";

    // 3. Mark PAID in a single database transaction
    await prisma.$transaction([
      prisma.paymentTransaction.update({
        where: { id: transaction.id },
        data: {
          status: "SUCCESS",
          maskedCardLast4: maskedMobile,
          cardBrand: "BKASH",
          gatewayResponseCode: executionData.statusCode,
          rawPayloadEncrypted: encrypt(JSON.stringify(executionData)),
        },
      }),
      prisma.paymentIntent.update({
        where: { id: intent.id },
        data: { status: "CAPTURED" },
      }),
      prisma.order.updateMany({
        where: { paymentIntentId: intent.id },
        data: { paymentStatus: "PAID" },
      }),
    ]);

    await logPaymentEvent({
      actor,
      action: "BKASH_TRANSACTION_SUCCESS",
      entity: "PaymentTransaction",
      before: transaction,
      after: {
        status: "SUCCESS",
        gatewayTxnId: transaction.gatewayTxnId,
        amount: intent.amount,
      },
    });

    return NextResponse.redirect(`${appUrl}/orders?success=true`, 303);
  } catch (error: any) {
    console.error("bKash callback verification error:", error);
    return NextResponse.redirect(`${appUrl}/orders?failed=true&error=VerificationFailed`, 303);
  }
}
