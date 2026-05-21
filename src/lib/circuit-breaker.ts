import { prisma } from "./prisma";

const FAIL_THRESHOLD = 3;
const COOLDOWN_WINDOW_SECONDS = 60;

/**
 * Checks if the primary payment gateway (SSLCOMMERZ) is currently healthy.
 * If failures exceed the threshold within the time window, returns false.
 */
export async function isSslcommerzHealthy(): Promise<boolean> {
  const since = new Date(Date.now() - COOLDOWN_WINDOW_SECONDS * 1000);

  try {
    const failureCount = await prisma.paymentTransaction.count({
      where: {
        gateway: "SSLCOMMERZ",
        status: "FAILED",
        createdAt: { gte: since },
      },
    });

    if (failureCount >= FAIL_THRESHOLD) {
      console.warn(
        `[CIRCUIT BREAKER] SSLCOMMERZ has failed ${failureCount} times in the last ${COOLDOWN_WINDOW_SECONDS}s. Tripping breaker!`
      );
      return false;
    }
  } catch (error) {
    console.error("Error checking circuit breaker status, assuming healthy:", error);
  }

  return true;
}
