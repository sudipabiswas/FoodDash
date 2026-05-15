import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const products = await prisma.product.findMany({
    take: 10,
    select: { id: true, name: true, price: true }
  });

  console.log("Recent Products:");
  console.dir(products, { depth: null });
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
