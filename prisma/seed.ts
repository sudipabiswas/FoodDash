import { PrismaClient } from "@prisma/client";
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
      latitude: 23.8103,
      longitude: 90.4125,
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

  // Create Customers
  const customer1 = await prisma.user.create({
    data: {
      email: "alex@example.com",
      password: hashedPassword,
      name: "Alex Johnson",
      role: "CUSTOMER",
    },
  });

  const customer2 = await prisma.user.create({
    data: {
      email: "sarah@example.com",
      password: hashedPassword,
      name: "Sarah Miller",
      role: "CUSTOMER",
    },
  });

  // Get Products for Orders
  const dbProducts = await prisma.product.findMany({ where: { storeId: store.id } });

  // Create Orders
  const order1 = await prisma.order.create({
    data: {
      customerId: customer1.id,
      storeId: store.id,
      totalPrice: 18.97,
      status: "DELIVERED",
      deliveryAddress: "123 Maple St, Springfield",
      deliveryLat: 23.8200,
      deliveryLng: 90.4200,
      items: {
        create: [
          { productId: dbProducts[0].id, quantity: 2, price: 6.99 },
          { productId: dbProducts[1].id, quantity: 1, price: 4.99 },
        ]
      }
    }
  });

  const order2 = await prisma.order.create({
    data: {
      customerId: customer2.id,
      storeId: store.id,
      totalPrice: 11.98,
      status: "DELIVERED",
      deliveryAddress: "456 Oak Ave, Springfield",
      deliveryLat: 23.8050,
      deliveryLng: 90.4100,
      items: {
        create: [
          { productId: dbProducts[2].id, quantity: 2, price: 5.99 },
        ]
      }
    }
  });

  const order3 = await prisma.order.create({
    data: {
      customerId: customer1.id,
      storeId: store.id,
      totalPrice: 6.99,
      status: "PENDING",
      deliveryAddress: "123 Maple St, Springfield",
      deliveryLat: 23.8150,
      deliveryLng: 90.4050,
      items: {
        create: [
          { productId: dbProducts[0].id, quantity: 1, price: 6.99 },
        ]
      }
    }
  });

  // Create Reviews
  await prisma.review.createMany({
    data: [
      {
        customerId: customer1.id,
        storeId: store.id,
        rating: 5,
        comment: "The Whopper was amazing as always! Fast delivery.",
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
      },
      {
        customerId: customer2.id,
        storeId: store.id,
        rating: 4,
        comment: "Good food, but the fries were a bit cold.",
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
      },
      {
        customerId: customer1.id,
        storeId: store.id,
        rating: 5,
        comment: "Excellent service and quality.",
        ownerReply: "Thank you Alex! We appreciate your loyalty.",
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2), // 2 days ago
      }
    ]
  });

  console.log("Seed data created successfully!");
  console.log("Admin:", admin.email);
  console.log("Store Owner:", owner.email);
  console.log("Customer 1:", customer1.email);
  console.log("Customer 2:", customer2.email);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
