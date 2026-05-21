import "@/lib/logger"; // Ensure global console masking is initialized
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { logPaymentEvent } from "@/lib/audit";
import { checkRateLimit, checkCardRateLimit } from "@/lib/rate-limit";
import { isSslcommerzHealthy } from "@/lib/circuit-breaker";
import { createBkashPaymentSession } from "@/lib/bkash";
import { NextResponse } from "next/server";
import crypto from "crypto";

export async function POST(
  req: Request,
  props: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 1. HARD REQUIREMENT: Enforce Idempotency-Key header on payment retry endpoint
  const idempotencyKey = req.headers.get("idempotency-key");
  if (!idempotencyKey) {
    return NextResponse.json({ error: "Idempotency-Key header is required" }, { status: 400 });
  }

  const params = await props.params;
  const orderId = params.id;

  // Get client IP for rate limiting
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() || 
             req.headers.get("x-real-ip") || 
             "127.0.0.1";

  try {
    // 2. HARD REQUIREMENT: Rate limiting per user and per IP
    const userLimit = await checkRateLimit({
      userId: session.user.id,
      action: "PAYMENT_INTENT_CREATED",
      limit: 5,
      windowSeconds: 60,
    });
    if (!userLimit.allowed) {
      return NextResponse.json({ error: "Rate limit exceeded. Please try again later." }, { status: 429 });
    }

    const ipLimit = await checkRateLimit({
      ip,
      action: "PAYMENT_INTENT_CREATED",
      limit: 10,
      windowSeconds: 60,
    });
    if (!ipLimit.allowed) {
      return NextResponse.json({ error: "Rate limit exceeded by IP. Please try again later." }, { status: 429 });
    }

    // Fetch the order to verify ownership
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        customer: true,
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (order.customerId !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized access to order" }, { status: 403 });
    }

    if (order.paymentStatus === "PAID") {
      return NextResponse.json({ error: "Order has already been paid" }, { status: 400 });
    }

    // Try to parse request body
    let body: any = {};
    try {
      body = await req.json();
    } catch {
      // Empty body is acceptable
    }

    const { cardNumber, cardholderName, expiryDate, cvv, otp, preferredGateway } = body;

    // 3. HARD REQUIREMENT: Rate limit per card-last4 to block carding attacks on submission
    if (cardNumber) {
      const last4 = cardNumber.replace(/\s/g, "").slice(-4);
      const cardAllowed = await checkCardRateLimit(last4, 3, 300);
      if (!cardAllowed) {
        return NextResponse.json({ error: "Card transaction limit exceeded. Please try another card." }, { status: 429 });
      }
    }

    const storeId = process.env.SSLCOMMERZ_STORE_ID;
    const storePassword = process.env.SSLCOMMERZ_STORE_PASSWORD;
    const isSandbox = process.env.SSLCOMMERZ_IS_SANDBOX !== "false";
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    // 4. HARD REQUIREMENT: Idempotency recovery checking
    let paymentIntent = await prisma.paymentIntent.findUnique({
      where: { idempotencyKey },
      include: { transactions: true },
    });

    if (paymentIntent) {
      if (paymentIntent.amount !== order.totalPrice || paymentIntent.userId !== session.user.id) {
        return NextResponse.json({ error: "Idempotency key parameter mismatch." }, { status: 409 });
      }

      if (paymentIntent.status === "CAPTURED" || paymentIntent.status === "SETTLED") {
        return NextResponse.json({
          success: true,
          message: "Order already paid in this session.",
          status: paymentIntent.status,
        });
      }

      if (paymentIntent.gatewayUrl && !cardNumber) {
        console.log(`[IDEMPOTENCY] Found existing retry session for key ${idempotencyKey}. Returning cached gatewayUrl.`);
        return NextResponse.json({
          gatewayUrl: paymentIntent.gatewayUrl,
        });
      }
    } else {
      // Create new intent linked to order
      paymentIntent = await prisma.paymentIntent.create({
        data: {
          userId: session.user.id,
          amount: order.totalPrice,
          currency: "BDT",
          status: "CREATED",
          idempotencyKey,
          orders: {
            connect: { id: orderId },
          },
        },
        include: { transactions: true },
      });

      // Update order with payment intent reference
      await prisma.order.update({
        where: { id: orderId },
        data: { paymentIntentId: paymentIntent.id },
      });

      await logPaymentEvent({
        actor: session.user.email || session.user.id,
        action: "PAYMENT_RETRY_INTENT_CREATED",
        entity: "PaymentIntent",
        after: { paymentIntentId: paymentIntent.id, orderId },
        ip,
      });
    }

    // FALLBACK PATH: If SSLCOMMERZ credentials are not configured, handle mock credentials
    if (!storeId || !storePassword) {
      if (cardNumber && otp) {
        if (otp !== "123456") {
          await prisma.$transaction([
            prisma.paymentIntent.update({
              where: { id: paymentIntent.id },
              data: { status: "FAILED" },
            }),
            prisma.order.update({
              where: { id: orderId },
              data: { paymentStatus: "FAILED" },
            }),
          ]);
          return NextResponse.json({ error: "Incorrect OTP verification code" }, { status: 400 });
        }

        // Complete mock checkout transaction
        const last4Digits = cardNumber.replace(/\s/g, "").slice(-4);
        const cardBrandDetected = cardNumber.startsWith("4") ? "VISA" : "MASTERCARD";

        const mockGatewayTxn = `TXN-MOCK-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;

        await prisma.$transaction([
          prisma.paymentIntent.update({
            where: { id: paymentIntent.id },
            data: { status: "CAPTURED" },
          }),
          prisma.order.update({
            where: { id: orderId },
            data: { paymentStatus: "PAID" },
          }),
          prisma.paymentTransaction.create({
            data: {
              intentId: paymentIntent.id,
              gateway: "SIMULATOR",
              gatewayTxnId: mockGatewayTxn,
              status: "SUCCESS",
              maskedCardLast4: last4Digits,
              cardBrand: cardBrandDetected,
            },
          }),
        ]);

        await logPaymentEvent({
          actor: session.user.email || session.user.id,
          action: "SIMULATED_RETRY_SUCCESS",
          entity: "PaymentIntent",
          after: { orderId, transactionId: mockGatewayTxn },
          ip,
        });

        return NextResponse.json({
          success: true,
          message: "Simulated payment retry processed successfully.",
        });
      }

      // Return simulator info
      return NextResponse.json({
        simulator: true,
        paymentIntentId: paymentIntent.id,
        amount: order.totalPrice,
        currency: "BDT",
      });
    }

    // 5. HARD REQUIREMENT: Circuit Breaker gateway routing
    const primaryHealthy = preferredGateway === "BKASH" ? false : await isSslcommerzHealthy();
    let gatewayUrl = "";

    if (primaryHealthy) {
      try {
        console.log("[PAYMENT_ROUTER] SSLCOMMERZ retry is healthy. Initiating session...");
        const sslEndpoint = isSandbox
          ? "https://sandbox.sslcommerz.com/gwprocess/v4/api.php"
          : "https://securepay.sslcommerz.com/gwprocess/v4/api.php";

        const gatewayTxnId = `TXN-${crypto.randomBytes(8).toString("hex").toUpperCase()}`;
        const transaction = await prisma.paymentTransaction.create({
          data: {
            intentId: paymentIntent.id,
            gateway: "SSLCOMMERZ",
            gatewayTxnId,
            status: "PENDING",
          },
        });

        const params = new URLSearchParams();
        params.append("store_id", storeId);
        params.append("store_passwd", storePassword);
        params.append("total_amount", order.totalPrice.toString());
        params.append("currency", "BDT");
        params.append("tran_id", gatewayTxnId);
        params.append("success_url", `${appUrl}/api/payment/sslcommerz/callback?status=success&intentId=${paymentIntent.id}&txnId=${transaction.id}`);
        params.append("fail_url", `${appUrl}/api/payment/sslcommerz/callback?status=fail&intentId=${paymentIntent.id}&txnId=${transaction.id}`);
        params.append("cancel_url", `${appUrl}/api/payment/sslcommerz/callback?status=cancel&intentId=${paymentIntent.id}&txnId=${transaction.id}`);
        params.append("ipn_url", `${appUrl}/api/payment/sslcommerz/ipn`);
        
        // Customer Info
        params.append("cus_name", session.user.name || "Customer");
        params.append("cus_email", session.user.email || "customer@fooddash.com");
        params.append("cus_phone", "01700000000");
        params.append("cus_add1", "Dhaka, Bangladesh");
        params.append("cus_city", "Dhaka");
        params.append("cus_country", "Bangladesh");
        
        // Product Info
        params.append("shipping_method", "NO");
        params.append("num_of_item", "1");
        params.append("product_name", `FoodDash Order #${orderId.substring(0, 8)}`);
        params.append("product_category", "Food");
        params.append("product_profile", "general");

        const response = await fetch(sslEndpoint, {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: params.toString(),
        });

        const data = await response.json();

        if (data.status !== "SUCCESS") {
          throw new Error(data.failedreason || "Gateway session creation failed.");
        }

        gatewayUrl = data.GatewayPageURL;

        await prisma.paymentIntent.update({
          where: { id: paymentIntent.id },
          data: { 
            status: "PENDING",
            gatewayUrl,
          },
        });

        return NextResponse.json({ gatewayUrl });

      } catch (err: any) {
        console.error("[PAYMENT_ROUTER] SSLCOMMERZ session failed for retry. Fallback to bKash:", err);
        await prisma.paymentTransaction.create({
          data: {
            intentId: paymentIntent.id,
            gateway: "SSLCOMMERZ",
            gatewayTxnId: `TXN-ERR-${crypto.randomBytes(6).toString("hex").toUpperCase()}`,
            status: "FAILED",
            gatewayResponseCode: err.message || "CONNECTION_ERROR",
          },
        });
      }
    }

    // fallback retry destination: bKash Tokenized Checkout
    console.log("[PAYMENT_ROUTER] Routing retry payment request to fallback bKash tokenized gateway.");
    const bkashTxnId = `TXN-BK-${crypto.randomBytes(8).toString("hex").toUpperCase()}`;

    const bkashTransaction = await prisma.paymentTransaction.create({
      data: {
        intentId: paymentIntent.id,
        gateway: "BKASH",
        gatewayTxnId: bkashTxnId,
        status: "PENDING",
      },
    });

    const bkashSession = await createBkashPaymentSession(order.totalPrice, bkashTxnId, appUrl);
    gatewayUrl = bkashSession.bkashURL;

    await prisma.paymentIntent.update({
      where: { id: paymentIntent.id },
      data: {
        status: "PENDING",
        gatewayUrl,
      },
    });

    await logPaymentEvent({
      actor: session.user.email || session.user.id,
      action: "PAYMENT_RETRY_PENDING_FALLBACK",
      entity: "PaymentIntent",
      after: { paymentIntentId: paymentIntent.id, gatewayTxnId: bkashTxnId, gateway: "BKASH" },
      ip,
    });

    return NextResponse.json({ gatewayUrl });

  } catch (error: any) {
    console.error("Order payment retry transaction failed:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
