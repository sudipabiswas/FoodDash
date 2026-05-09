import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const stores = await prisma.store.findMany({
    include: { owner: true }
  });
  console.log(JSON.stringify(stores, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
