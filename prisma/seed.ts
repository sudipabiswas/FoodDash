import { PrismaClient } from "../src/generated/prisma";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // Clear existing data
  await prisma.review.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.coupon.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.store.deleteMany();
  await prisma.user.deleteMany();

  const hashedPassword = await bcrypt.hash("password123", 10);

  // Create Users
  const admin = await prisma.user.create({
    data: {
      email: "admin@fooddash.com",
      password: hashedPassword,
      name: "Super Admin",
      role: "ADMIN",
    },
  });

  const owner = await prisma.user.create({
    data: {
      email: "owner@burgerking.com",
      password: hashedPassword,
      name: "John Owner",
      role: "STORE_OWNER",
    },
  });

  // Create Store
  const store = await prisma.store.create({
    data: {
      name: "Burger King",
      description: "Home of the Whopper. Flame-grilled beef and more.",
      ownerId: owner.id,
      active: true,
    },
  });

  // Create Category
  const category = await prisma.category.create({
    data: {
      name: "Burgers",
      storeId: store.id,
    },
  });

  // Create Products
  await prisma.product.createMany({
    data: [
      { name: "Whopper", price: 6.99, description: "The legendary Whopper.", categoryId: category.id, storeId: store.id },
      { name: "Cheese Burger", price: 4.99, description: "Classic cheese burger.", categoryId: category.id, storeId: store.id },
      { name: "Chicken Royale", price: 5.99, description: "Tender chicken breast.", categoryId: category.id, storeId: store.id },
    ],
  });

  console.log("Seed data created successfully!");
  console.log("Admin:", admin.email);
  console.log("Store Owner:", owner.email);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
