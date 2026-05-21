import { prisma } from "@/lib/prisma";

interface RateLimitParams {
  userId?: string;
  ip?: string | null;
  action?: string;
  limit?: number;
  windowSeconds?: number;
}

export async function checkRateLimit({
  userId,
  ip,
  action = "PAYMENT_INTENT_CREATED",
  limit = 5,
  windowSeconds = 60,
}: RateLimitParams): Promise<{ allowed: boolean; remaining: number }> {
  const since = new Date(Date.now() - windowSeconds * 1000);

  try {
    // 1. Check user-level rate limits
    if (userId) {
      const userCount = await prisma.auditLog.count({
        where: {
          actor: userId,
          action,
          timestamp: { gte: since },
        },
      });

      if (userCount >= limit) {
        return { allowed: false, remaining: 0 };
      }
      return { allowed: true, remaining: limit - userCount };
    }

    // 2. Check IP-level rate limits
    if (ip) {
      const ipCount = await prisma.auditLog.count({
        where: {
          ip,
          action,
          timestamp: { gte: since },
        },
      });

      if (ipCount >= limit) {
        return { allowed: false, remaining: 0 };
      }
      return { allowed: true, remaining: limit - ipCount };
    }
  } catch (error) {
    console.error("Rate limiter check failed, allowing request as fallback:", error);
  }

  return { allowed: true, remaining: limit };
}

export async function checkCardRateLimit(
  last4: string,
  limit = 3,
  windowSeconds = 300
): Promise<boolean> {
  if (!last4) return true;
  const since = new Date(Date.now() - windowSeconds * 1000);

  try {
    const cardCount = await prisma.paymentTransaction.count({
      where: {
        maskedCardLast4: last4,
        createdAt: { gte: since },
      },
    });

    return cardCount < limit;
  } catch (error) {
    console.error("Card rate limit check failed:", error);
    return true; // fail-open so payments are not blocked on db errors
  }
}
