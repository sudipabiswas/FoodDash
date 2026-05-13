import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const coupons = [
    {
      code: "WELCOME50",
      discount: 50,
      type: "PERCENTAGE",
      expiryDate: new Date("2026-12-31"),
      isActive: true
    },
    {
      code: "FREEDEL20",
      discount: 20,
      type: "FIXED",
      expiryDate: new Date("2026-12-31"),
      isActive: true
    },
    {
      code: "BURGER20",
      discount: 20,
      type: "PERCENTAGE",
      expiryDate: new Date("2026-12-31"),
      isActive: true
    }
  ];

  for (const c of coupons) {
    await prisma.coupon.upsert({
      where: { code: c.code },
      update: c,
      create: c
    });
  }
  console.log("Global coupons synced to DB");
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
