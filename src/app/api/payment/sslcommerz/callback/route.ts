import "@/lib/logger"; // Ensure global console masking is initialized
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { encrypt } from "@/lib/encryption";
import { logPaymentEvent } from "@/lib/audit";

export async function POST(req: Request) {
  const url = new URL(req.url);
  const statusParam = url.searchParams.get("status");
  const intentId = url.searchParams.get("intentId");
  const transactionId = url.searchParams.get("txnId");

  const storeId = process.env.SSLCOMMERZ_STORE_ID;
  const storePassword = process.env.SSLCOMMERZ_STORE_PASSWORD;
  const isSandbox = process.env.SSLCOMMERZ_IS_SANDBOX !== "false";
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  // Parse form parameters sent by SSLCOMMERZ POST request
  let bodyParams: Record<string, string> = {};
  try {
    const formData = await req.formData();
    formData.forEach((value, key) => {
      bodyParams[key] = value.toString();
    });
  } catch (err) {
    console.error("Error parsing callback form data:", err);
    return NextResponse.redirect(`${appUrl}/orders?failed=true&error=InvalidCallbackData`, 303);
  }

  const {
    status: gatewayStatus,
    tran_id: gatewayTxnId,
    val_id: valId,
    amount: gatewayAmount,
    card_type: cardBrand,
    card_no: maskedCardNumber,
    error: gatewayError,
  } = bodyParams;

  try {
    // 1. Fetch matching transaction & intent
    const transaction = await prisma.paymentTransaction.findFirst({
      where: {
        id: transactionId || undefined,
        gatewayTxnId: gatewayTxnId,
      },
      include: {
        intent: {
          include: {
            orders: true,
          },
        },
      },
    });

    if (!transaction) {
      console.error(`Transaction not found for txnId: ${transactionId}, gatewayTxnId: ${gatewayTxnId}`);
      return NextResponse.redirect(`${appUrl}/orders?failed=true&error=TransactionNotFound`, 303);
    }

    const intent = transaction.intent;
    const actor = intent.userId;

    // Handle Failures or Cancellations early
    if (statusParam === "fail" || statusParam === "cancel" || gatewayStatus === "FAILED" || gatewayStatus === "CANCELLED") {
      await prisma.$transaction([
        prisma.paymentTransaction.update({
          where: { id: transaction.id },
          data: {
            status: "FAILED",
            gatewayResponseCode: gatewayStatus || "FAILED",
            rawPayloadEncrypted: encrypt(JSON.stringify(bodyParams)),
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
        action: `TRANSACTION_${gatewayStatus || "FAILED"}`,
        entity: "PaymentTransaction",
        before: transaction,
        after: { status: "FAILED", gatewayError },
      });

      return NextResponse.redirect(`${appUrl}/orders?failed=true&error=${gatewayStatus || "FAILED"}`, 303);
    }

    // 2. Server-to-Server Validation with SSLCOMMERZ
    if (!storeId || !storePassword) {
      throw new Error("SSLCOMMERZ store credentials not configured on server.");
    }

    const validationUrl = isSandbox
      ? `https://sandbox.sslcommerz.com/validator/api/valid.php?val_id=${valId}&store_id=${storeId}&store_passwd=${storePassword}&format=json`
      : `https://securepay.sslcommerz.com/validator/api/valid.php?val_id=${valId}&store_id=${storeId}&store_passwd=${storePassword}&format=json`;

    const validationResponse = await fetch(validationUrl);
    const validationData = await validationResponse.json();

    if (validationData.status !== "VALID" && validationData.status !== "VALIDATED") {
      throw new Error(validationData.error || `Server-side validation returned status ${validationData.status}`);
    }

    // Double check verification details (amount and currency matches database totals)
    const dbAmount = intent.amount;
    const verifiedAmount = parseFloat(validationData.amount);

    // Accept slight precision delta (+/- 0.05 BDT)
    if (Math.abs(dbAmount - verifiedAmount) > 0.05) {
      throw new Error(`Transaction amount mismatch. Database: ${dbAmount}, Gateway: ${verifiedAmount}`);
    }

    // Extract masked card details
    const last4 = maskedCardNumber ? maskedCardNumber.slice(-4) : null;

    // 3. Mark everything PAID in a single database transaction
    await prisma.$transaction([
      prisma.paymentTransaction.update({
        where: { id: transaction.id },
        data: {
          status: "SUCCESS",
          maskedCardLast4: last4,
          cardBrand: cardBrand || validationData.card_type,
          gatewayResponseCode: validationData.status,
          rawPayloadEncrypted: encrypt(JSON.stringify(validationData)),
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
      action: "TRANSACTION_SUCCESS",
      entity: "PaymentTransaction",
      before: transaction,
      after: {
        status: "SUCCESS",
        gatewayTxnId: transaction.gatewayTxnId,
        amount: verifiedAmount,
      },
    });

    // Redirect to Order History page with success parameters
    return NextResponse.redirect(`${appUrl}/orders?success=true`, 303);
  } catch (error: any) {
    console.error("SSLCOMMERZ Callback processing failed:", error);
    
    // Attempt to mark transaction as FAILED on error
    try {
      if (transactionId) {
        await prisma.paymentTransaction.update({
          where: { id: transactionId },
          data: { status: "FAILED", gatewayResponseCode: error.message },
        });
      }
    } catch (dbErr) {
      console.error("Failed to mark transaction failed in catch block:", dbErr);
    }

    return NextResponse.redirect(`${appUrl}/orders?failed=true&error=ValidationFailed`, 303);
  }
}
