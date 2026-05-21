import { prisma } from "@/lib/prisma";

interface LogPaymentParams {
  actor: string;         // Email or User ID of the action creator
  action: string;        // Action description (e.g. PAYMENT_INTENT_CREATED)
  entity: string;        // Database entity affected (e.g. PaymentIntent)
  before?: any;          // State before action
  after?: any;           // State after action
  ip?: string | null;    // Client IP address
}

export async function logPaymentEvent({
  actor,
  action,
  entity,
  before = null,
  after = null,
  ip = null,
}: LogPaymentParams) {
  try {
    await prisma.auditLog.create({
      data: {
        actor,
        action,
        entity,
        before: before ? JSON.stringify(before) : null,
        after: after ? JSON.stringify(after) : null,
        ip,
      },
    });
  } catch (error) {
    // Fail-safe logging so payments don't block on logger failures
    console.error("Audit logger encountered an error writing log:", error);
  }
}
