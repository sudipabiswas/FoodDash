import "@/lib/logger"; // Ensure global console masking is initialized
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { encrypt } from "@/lib/encryption";
import { logPaymentEvent } from "@/lib/audit";

export async function POST(req: Request) {
  const storeId = process.env.SSLCOMMERZ_STORE_ID;
  const storePassword = process.env.SSLCOMMERZ_STORE_PASSWORD;
  const isSandbox = process.env.SSLCOMMERZ_IS_SANDBOX !== "false";

  // Parse webhook form data parameters
  let bodyParams: Record<string, string> = {};
  try {
    const formData = await req.formData();
    formData.forEach((value, key) => {
      bodyParams[key] = value.toString();
    });
  } catch (err) {
    console.error("Error parsing SSLCOMMERZ IPN body:", err);
    return NextResponse.json({ error: "Invalid webhook payload" }, { status: 400 });
  }

  const {
    status: gatewayStatus,
    tran_id: gatewayTxnId,
    val_id: valId,
    amount: gatewayAmount,
    card_type: cardBrand,
    card_no: maskedCardNumber,
  } = bodyParams;

  if (!gatewayTxnId || !valId) {
    return NextResponse.json({ error: "Missing required transaction fields" }, { status: 400 });
  }

  try {
    // 1. Fetch matching transaction record
    const transaction = await prisma.paymentTransaction.findUnique({
      where: { gatewayTxnId },
      include: {
        intent: {
          include: {
            orders: true,
          },
        },
      },
    });

    if (!transaction) {
      console.error(`IPN transaction not found for gatewayTxnId: ${gatewayTxnId}`);
      return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
    }

    // 2. IDEMPOTENCY: Check if the transaction was already settled
    if (transaction.status === "SUCCESS") {
      console.log(`IPN ignored: Transaction ${gatewayTxnId} is already marked SUCCESS.`);
      return NextResponse.json({ received: true, status: "already_processed" });
    }

    const intent = transaction.intent;
    const actor = intent.userId;

    // Handle failures and cancellations
    if (gatewayStatus === "FAILED" || gatewayStatus === "CANCELLED") {
      await prisma.$transaction([
        prisma.paymentTransaction.update({
          where: { id: transaction.id },
          data: {
            status: "FAILED",
            gatewayResponseCode: gatewayStatus,
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
        action: `IPN_TRANSACTION_${gatewayStatus}`,
        entity: "PaymentTransaction",
        before: transaction,
        after: { status: "FAILED" },
      });

      return NextResponse.json({ received: true, status: "failed_updated" });
    }

    // 3. Server-to-Server Validation of IPN payload
    if (!storeId || !storePassword) {
      return NextResponse.json({ error: "SSLCOMMERZ credentials missing" }, { status: 500 });
    }

    const validationUrl = isSandbox
      ? `https://sandbox.sslcommerz.com/validator/api/valid.php?val_id=${valId}&store_id=${storeId}&store_passwd=${storePassword}&format=json`
      : `https://securepay.sslcommerz.com/validator/api/valid.php?val_id=${valId}&store_id=${storeId}&store_passwd=${storePassword}&format=json`;

    const validationResponse = await fetch(validationUrl);
    const validationData = await validationResponse.json();

    if (validationData.status !== "VALID" && validationData.status !== "VALIDATED") {
      return NextResponse.json({ error: "Invalid webhook validation response" }, { status: 400 });
    }

    // Double check amounts
    const dbAmount = intent.amount;
    const verifiedAmount = parseFloat(validationData.amount);

    if (Math.abs(dbAmount - verifiedAmount) > 0.05) {
      console.error(`IPN Amount Mismatch. DB: ${dbAmount}, Gateway: ${verifiedAmount}`);
      return NextResponse.json({ error: "Amount verification mismatch" }, { status: 400 });
    }

    // Extract masked card details
    const last4 = maskedCardNumber ? maskedCardNumber.slice(-4) : null;

    // 4. Mark PAID in database
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
      action: "IPN_TRANSACTION_SUCCESS",
      entity: "PaymentTransaction",
      before: transaction,
      after: {
        status: "SUCCESS",
        gatewayTxnId: transaction.gatewayTxnId,
        amount: verifiedAmount,
      },
    });

    return NextResponse.json({ received: true, status: "verified_success" });
  } catch (error: any) {
    console.error("SSLCOMMERZ IPN webhook processing failed:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
