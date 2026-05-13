import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log("Attempting to add missing columns manually...");
  try {
    // Add orderId to Review table
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "Review" ADD COLUMN IF NOT EXISTS "orderId" TEXT;
    `);
    console.log("Column 'orderId' added to 'Review' (or already exists).");

    // Add unique constraint
    await prisma.$executeRawUnsafe(`
      CREATE UNIQUE INDEX IF NOT EXISTS "Review_orderId_key" ON "Review"("orderId");
    `);
    console.log("Unique index added to 'Review.orderId'.");

  } catch (error) {
    console.error("Failed to update database schema:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
