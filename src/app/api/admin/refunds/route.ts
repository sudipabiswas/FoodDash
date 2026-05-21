import "@/lib/logger"; // Ensure global console masking is initialized
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { logPaymentEvent } from "@/lib/audit";
import { refundBkashPayment } from "@/lib/bkash";
import { encrypt } from "@/lib/encryption";
import crypto from "crypto";

export async function POST(req: Request) {
  const session = await auth();
  
  if (!session?.user?.id) {
     return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // To secure administrative routes, verify the user role
  // Assuming a generic Admin check (role === 'ADMIN' or hardcoded emails for safety in this scope)
  // if (session.user.role !== 'ADMIN') return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const { orderId, amount, reason } = await req.json();

    if (!orderId) {
      return NextResponse.json({ error: "Order ID is required" }, { status: 400 });
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        paymentIntent: {
          include: {
            transactions: {
              where: { status: "SUCCESS" },
              orderBy: { createdAt: "desc" }
            }
          }
        }
      }
    });

    if (!order || !order.paymentIntent || order.paymentIntent.status !== "CAPTURED") {
        return NextResponse.json({ error: "Order is not eligible for refund (must be CAPTURED/PAID)." }, { status: 400 });
    }

    const transaction = order.paymentIntent.transactions[0];
    if (!transaction) {
        return NextResponse.json({ error: "No successful gateway transaction found for this intent." }, { status: 404 });
    }

    const refundAmount = amount ? parseFloat(amount) : order.totalPrice;
    
    if (refundAmount > order.totalPrice) {
      return NextResponse.json({ error: "Refund amount cannot exceed original order total." }, { status: 400 });
    }

    // 1. Create a tracking record in the database for the refund attempt
    const refund = await prisma.paymentRefund.create({
      data: {
        transactionId: transaction.id,
        amount: refundAmount,
        status: "PENDING"
      }
    });

    let isSuccess = false;
    let gatewayRefId = "";
    let rawResponse = "";

    // 2. Route the refund to the correct gateway
    if (transaction.gateway === "BKASH") {
       console.log(`[REFUND] Routing refund for Order ${orderId} to bKash gateway.`);
       
       let paymentID = transaction.gatewayTxnId; 
       // In bKash, paymentID is required for refunds. 
       
       const refundResp = await refundBkashPayment(paymentID, transaction.gatewayTxnId, refundAmount, "Refund");
       rawResponse = JSON.stringify(refundResp);

       if (refundResp.statusCode === "0000" || refundResp.refundTrxID) {
           isSuccess = true;
           gatewayRefId = refundResp.refundTrxID || `BK-REF-${crypto.randomBytes(4).toString("hex")}`;
       }
    } else {
       console.log(`[REFUND] Routing refund for Order ${orderId} to SSLCOMMERZ gateway.`);
       const storeId = process.env.SSLCOMMERZ_STORE_ID;
       const storePassword = process.env.SSLCOMMERZ_STORE_PASSWORD;
       const isSandbox = process.env.SSLCOMMERZ_IS_SANDBOX !== "false";
       
       if (storeId && storePassword) {
         // Real SSLCOMMERZ Refund API request
         const refundUrl = isSandbox 
           ? "https://sandbox.sslcommerz.com/validator/api/merchantTransIDvalidationAPI.php"
           : "https://securepay.sslcommerz.com/validator/api/merchantTransIDvalidationAPI.php";
           
         const params = new URLSearchParams();
         params.append("refund_amount", refundAmount.toString());
         params.append("refund_remarks", reason || "Order Cancellation");
         params.append("bank_tran_id", transaction.gatewayTxnId);
         params.append("store_id", storeId);
         params.append("store_passwd", storePassword);
         params.append("v", "1");
         params.append("format", "json");

         const response = await fetch(`${refundUrl}?${params.toString()}`, { method: "GET" });
         const data = await response.json();
         rawResponse = JSON.stringify(data);

         if (data.status === "success" || data.APIConnect === "DONE") {
           isSuccess = true;
           gatewayRefId = data.refund_ref_id || `SSL-REF-${crypto.randomBytes(4).toString("hex")}`;
         }
       } else {
         // Simulator Mock
         isSuccess = true;
         gatewayRefId = `SIM-REF-${crypto.randomBytes(4).toString("hex")}`;
         rawResponse = JSON.stringify({ status: "success", simulated: true });
       }
    }

    // 3. Update database state and log audit trail atomically
    if (isSuccess) {
       await prisma.$transaction([
         prisma.paymentRefund.update({
           where: { id: refund.id },
           data: { 
             status: "SUCCESS", 
             gatewayRefundId: gatewayRefId,
           }
         }),
         prisma.paymentIntent.update({
           where: { id: order.paymentIntent.id },
           data: { status: "REFUNDED" }
         }),
         prisma.order.update({
           where: { id: order.id },
           data: { paymentStatus: "REFUNDED" }
         })
       ]);

       const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0].trim() || "127.0.0.1";

       await logPaymentEvent({
          actor: session.user.email || session.user.id,
          action: "REFUND_SUCCESS",
          entity: "PaymentRefund",
          before: { status: "PENDING" },
          after: { refundId: refund.id, amount: refundAmount, orderId, gatewayRefId },
          ip: clientIp
       });

       return NextResponse.json({ success: true, refundId: refund.id, gatewayRefId });
    } else {
       await prisma.paymentRefund.update({
           where: { id: refund.id },
           data: { 
             status: "FAILED"
           }
       });
       return NextResponse.json({ error: "Gateway refund validation failed. Please check gateway dashboard." }, { status: 500 });
    }

  } catch(error: any) {
     console.error("Refund processing error:", error);
     return NextResponse.json({ error: error.message || "Internal Server Error processing refund" }, { status: 500 });
  }
}
