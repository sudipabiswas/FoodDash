import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const orders = await prisma.order.findMany({
    take: 5,
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      totalPrice: true,
      deliveryCharge: true,
      status: true,
      store: { select: { name: true, deliveryCharge: true } }
    }
  });

  console.log("Recent Orders:");
  console.dir(orders, { depth: null });
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
