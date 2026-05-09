import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const stores = await prisma.store.findMany({
    select: {
      name: true,
      mainCategories: true,
    },
  });
  console.log("Stores and their categories:", JSON.stringify(stores, null, 2));

  const burgersCount = await prisma.store.count({
    where: {
      mainCategories: { has: "Burgers" }
    }
  });
  console.log("Burgers count in DB:", burgersCount);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
