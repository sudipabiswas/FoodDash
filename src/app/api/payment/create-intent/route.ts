import "@/lib/logger"; // Ensure global console masking is initialized
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { logPaymentEvent } from "@/lib/audit";
import { checkRateLimit } from "@/lib/rate-limit";
import { isSslcommerzHealthy } from "@/lib/circuit-breaker";
import { createBkashPaymentSession } from "@/lib/bkash";
import crypto from "crypto";

export async function POST(req: Request) {
  const session = await auth();
  if (!session || !session.user || !session.user.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 1. HARD REQUIREMENT: Idempotency-Key header is mandatory
  const idempotencyKey = req.headers.get("idempotency-key");
  if (!idempotencyKey) {
    return NextResponse.json({ error: "Idempotency-Key header is required" }, { status: 400 });
  }

  // Get Client IP for Rate Limiting
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

    const { orderIds, preferredGateway } = await req.json();
    if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
      return NextResponse.json({ error: "Invalid orders parameter" }, { status: 400 });
    }

    // Fetch matching orders
    const orders = await prisma.order.findMany({
      where: {
        id: { in: orderIds },
        customerId: session.user.id,
      },
    });

    if (orders.length === 0) {
      return NextResponse.json({ error: "Orders not found" }, { status: 404 });
    }

    const totalAmount = orders.reduce((sum, order) => sum + order.totalPrice, 0);

    const storeId = process.env.SSLCOMMERZ_STORE_ID;
    const storePassword = process.env.SSLCOMMERZ_STORE_PASSWORD;
    const isSandbox = process.env.SSLCOMMERZ_IS_SANDBOX !== "false";
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    // 3. HARD REQUIREMENT: Idempotence check on key
    let paymentIntent = await prisma.paymentIntent.findUnique({
      where: { idempotencyKey },
      include: {
        transactions: true,
      },
    });

    if (paymentIntent) {
      if (paymentIntent.amount !== totalAmount || paymentIntent.userId !== session.user.id) {
        return NextResponse.json({ error: "Idempotency key parameter mismatch." }, { status: 409 });
      }

      if (paymentIntent.status === "CAPTURED" || paymentIntent.status === "SETTLED") {
        return NextResponse.json({
          success: true,
          message: "Payment already captured for this session.",
          status: paymentIntent.status,
        });
      }

      if (paymentIntent.gatewayUrl) {
        console.log(`[IDEMPOTENCY] Found existing session for key ${idempotencyKey}. Returning cached gatewayUrl.`);
        return NextResponse.json({
          gatewayUrl: paymentIntent.gatewayUrl,
        });
      }
    } else {
      // Create new intent
      paymentIntent = await prisma.paymentIntent.create({
        data: {
          userId: session.user.id,
          amount: totalAmount,
          currency: "BDT",
          status: "CREATED",
          idempotencyKey,
          orders: {
            connect: orderIds.map((id) => ({ id })),
          },
        },
        include: {
          transactions: true,
        },
      });

      await logPaymentEvent({
        actor: session.user.email || session.user.id,
        action: "PAYMENT_INTENT_CREATED",
        entity: "PaymentIntent",
        after: paymentIntent,
        ip,
      });
    }

    // Fallback path: If credentials are not set, return simulated gateway response
    if (!storeId || !storePassword) {
      return NextResponse.json({
        simulator: true,
        paymentIntentId: paymentIntent.id,
        amount: totalAmount,
        currency: "BDT",
      });
    }

    // 4. HARD REQUIREMENT: Circuit Breaker gateway routing
    const primaryHealthy = preferredGateway === "BKASH" ? false : await isSslcommerzHealthy();
    let gatewayUrl = "";

    if (primaryHealthy) {
      try {
        console.log("[PAYMENT_ROUTER] SSLCOMMERZ primary gateway is healthy. Initiating session...");
        const sslcommerzEndpoint = isSandbox
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
        params.append("total_amount", totalAmount.toString());
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
        params.append("product_name", `FoodDash Orders #${orders.map(o => o.id.substring(0, 4)).join(", ")}`);
        params.append("product_category", "Food");
        params.append("product_profile", "general");

        const response = await fetch(sslcommerzEndpoint, {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: params.toString(),
        });

        const data = await response.json();

        if (data.status !== "SUCCESS") {
          throw new Error(data.failedreason || "Gateway session creation failed.");
        }

        gatewayUrl = data.GatewayPageURL;

        // Update database states
        await prisma.$transaction([
          prisma.paymentIntent.update({
            where: { id: paymentIntent.id },
            data: { 
              status: "PENDING",
              gatewayUrl: gatewayUrl,
            },
          }),
        ]);

        await logPaymentEvent({
          actor: session.user.email || session.user.id,
          action: "PAYMENT_INTENT_PENDING",
          entity: "PaymentIntent",
          after: { paymentIntentId: paymentIntent.id, gatewayTxnId },
          ip,
        });

        return NextResponse.json({ gatewayUrl });

      } catch (err: any) {
        console.error("[PAYMENT_ROUTER] SSLCOMMERZ session failed. Attempting failover to bKash:", err);
        // Track the failure to feed the circuit breaker
        await prisma.paymentTransaction.create({
          data: {
            intentId: paymentIntent.id,
            gateway: "SSLCOMMERZ",
            gatewayTxnId: `TXN-ERR-${crypto.randomBytes(6).toString("hex").toUpperCase()}`,
            status: "FAILED",
            gatewayResponseCode: err.message || "CONNECTION_ERROR",
          },
        });
        // Continue to fallback below
      }
    }

    // fallback / circuit-breaker tripped destination: bKash Tokenized Checkout
    console.log("[PAYMENT_ROUTER] Routing payment request to fallback bKash tokenized gateway.");
    const bkashTxnId = `TXN-BK-${crypto.randomBytes(8).toString("hex").toUpperCase()}`;
    
    // Create bKash transaction
    const bkashTransaction = await prisma.paymentTransaction.create({
      data: {
        intentId: paymentIntent.id,
        gateway: "BKASH",
        gatewayTxnId: bkashTxnId,
        status: "PENDING",
      },
    });

    const bkashSession = await createBkashPaymentSession(totalAmount, bkashTxnId, appUrl);
    gatewayUrl = bkashSession.bkashURL;

    // Cache redirection URL and move intent to pending
    await prisma.paymentIntent.update({
      where: { id: paymentIntent.id },
      data: {
        status: "PENDING",
        gatewayUrl,
      },
    });

    await logPaymentEvent({
      actor: session.user.email || session.user.id,
      action: "PAYMENT_INTENT_PENDING_FALLBACK",
      entity: "PaymentIntent",
      after: { paymentIntentId: paymentIntent.id, gatewayTxnId: bkashTxnId, gateway: "BKASH" },
      ip,
    });

    return NextResponse.json({ gatewayUrl });

  } catch (error: any) {
    console.error("Payment intent routing failed:", error);
    return NextResponse.json({ error: error.message || "Failed to initialize payment router" }, { status: 500 });
  }
}
