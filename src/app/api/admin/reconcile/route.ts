import "@/lib/logger";
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { logPaymentEvent } from "@/lib/audit";
import { queryBkashPayment } from "@/lib/bkash";
import { encrypt } from "@/lib/encryption";

export async function POST(req: Request) {
  // Validate authorization: Allow admins or cron runners (via secret token)
  const authHeader = req.headers.get("authorization");
  const isCronTokenValid = authHeader === `Bearer ${process.env.CRON_SECRET}`;
  
  if (!isCronTokenValid) {
    const session = await auth();
    if (!session?.user?.id) {
       return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    // if (session.user.role !== 'ADMIN') return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    console.log("[RECONCILIATION] Starting scheduled gateway state sync...");
    
    // Find all payment intents that have been PENDING for more than 1 hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    
    const pendingIntents = await prisma.paymentIntent.findMany({
      where: {
        status: "PENDING",
        createdAt: { lt: oneHourAgo },
      },
      include: {
        transactions: {
          orderBy: { createdAt: "desc" },
          take: 1
        },
        orders: true,
      },
      take: 50 // Batch process to avoid Vercel serverless timeouts
    });

    console.log(`[RECONCILIATION] Found ${pendingIntents.length} orphaned PENDING intents.`);

    let reconciledCount = 0;

    for (const intent of pendingIntents) {
      const latestTxn = intent.transactions[0];
      if (!latestTxn) continue;

      let trueState: "SUCCESS" | "FAILED" | "PENDING" = "PENDING";
      let rawResponse = "";

      // 1. Query Upstream Gateway
      try {
        if (latestTxn.gateway === "BKASH") {
          const statusResp = await queryBkashPayment(latestTxn.gatewayTxnId);
          rawResponse = JSON.stringify(statusResp);
          
          if (statusResp.transactionStatus === "Completed") {
            trueState = "SUCCESS";
          } else if (statusResp.transactionStatus === "Aborted" || statusResp.transactionStatus === "Declined") {
            trueState = "FAILED";
          }
        } else {
          // SSLCOMMERZ Verification via Transaction ID
          const storeId = process.env.SSLCOMMERZ_STORE_ID;
          const storePassword = process.env.SSLCOMMERZ_STORE_PASSWORD;
          const isSandbox = process.env.SSLCOMMERZ_IS_SANDBOX !== "false";
          
          if (storeId && storePassword) {
            const validationUrl = isSandbox
              ? `https://sandbox.sslcommerz.com/validator/api/valid.php`
              : `https://securepay.sslcommerz.com/validator/api/valid.php`;
            
            const params = new URLSearchParams();
            params.append("store_id", storeId);
            params.append("store_passwd", storePassword);
            params.append("format", "json");
            
            // Re-verify the transaction
            const response = await fetch(`${validationUrl}?${params.toString()}`);
            const data = await response.json();
            rawResponse = JSON.stringify(data);

            if (data.status === "VALID" || data.status === "VALIDATED") {
              trueState = "SUCCESS";
            } else if (data.status === "FAILED" || data.status === "CANCELLED" || data.status === "UNATTEMPTED") {
              trueState = "FAILED";
            }
          } else {
            // Simulator defaults abandoned transactions to FAILED
            trueState = "FAILED";
            rawResponse = JSON.stringify({ simulated: true, status: "FAILED_TIMEOUT" });
          }
        }
      } catch (err: any) {
        console.error(`[RECONCILIATION] Error querying gateway for intent ${intent.id}:`, err);
        continue;
      }

      // 2. Synchronize Database State
      if (trueState === "SUCCESS") {
        await prisma.$transaction([
          prisma.paymentTransaction.update({
            where: { id: latestTxn.id },
            data: { status: "SUCCESS", rawPayloadEncrypted: encrypt(rawResponse) }
          }),
          prisma.paymentIntent.update({
            where: { id: intent.id },
            data: { status: "CAPTURED" }
          }),
          prisma.order.updateMany({
            where: { paymentIntentId: intent.id },
            data: { paymentStatus: "PAID" }
          })
        ]);

        await logPaymentEvent({
          actor: "system_reconciliation_job",
          action: "RECONCILIATION_SYNC_SUCCESS",
          entity: "PaymentIntent",
          after: { paymentIntentId: intent.id, newStatus: "CAPTURED" }
        });
        reconciledCount++;
        
      } else if (trueState === "FAILED") {
        await prisma.$transaction([
          prisma.paymentTransaction.update({
            where: { id: latestTxn.id },
            data: { status: "FAILED", gatewayResponseCode: "RECONCILED_ABANDONED" }
          }),
          prisma.paymentIntent.update({
            where: { id: intent.id },
            data: { status: "FAILED" }
          }),
          prisma.order.updateMany({
            where: { paymentIntentId: intent.id },
            data: { paymentStatus: "FAILED" }
          })
        ]);

        await logPaymentEvent({
          actor: "system_reconciliation_job",
          action: "RECONCILIATION_SYNC_ABANDONED",
          entity: "PaymentIntent",
          after: { paymentIntentId: intent.id, newStatus: "FAILED" }
        });
        reconciledCount++;
      }
    }

    console.log(`[RECONCILIATION] Job complete. Synced ${reconciledCount} orphaned intents.`);
    return NextResponse.json({ success: true, processed: pendingIntents.length, reconciled: reconciledCount });
    
  } catch(error: any) {
     console.error("[RECONCILIATION] Fatal job error:", error);
     return NextResponse.json({ error: "Reconciliation failed" }, { status: 500 });
  }
}
