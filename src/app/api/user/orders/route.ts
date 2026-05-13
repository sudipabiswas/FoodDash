import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 111 });
  }

  try {
    const orders = await prisma.order.findMany({
      where: {
        customerId: session.user.id,
      },
      include: {
        store: {
          select: {
            name: true,
            image: true,
          },
        },
        items: {
          include: {
            product: {
              select: {
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(orders);
  } catch (error) {
    console.error("Failed to fetch user orders:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { items, deliveryAddress, paymentMethod, couponCode } = await req.json();

    if (!items || items.length === 0 || !deliveryAddress) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Group items by their actual storeId fetched from the database for security and correctness
    const productIds = items.map((i: any) => i.id);
    const dbProducts = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, storeId: true }
    });

    const itemsByStore: Record<string, any[]> = {};
    items.forEach((item: any) => {
      const dbProduct = dbProducts.find(p => p.id === item.id);
      const actualStoreId = dbProduct?.storeId || item.storeId;
      
      if (!itemsByStore[actualStoreId]) {
        itemsByStore[actualStoreId] = [];
      }
      itemsByStore[actualStoreId].push({
        ...item,
        storeId: actualStoreId // Ensure we use the correct one
      });
    });

    const storeIds = Object.keys(itemsByStore);
    const createdOrders = [];

    for (const storeId of storeIds) {
      const storeItems = itemsByStore[storeId];
      let discount = 0;
      let couponId = null;

      // Handle coupon for this specific store order
      if (couponCode) {
        const coupon = await prisma.coupon.findFirst({
          where: {
            code: couponCode,
            isActive: true,
            expiryDate: { gte: new Date() },
            OR: [
              { storeId: storeId },
              { storeId: null }
            ]
          }
        });

        if (coupon) {
          couponId = coupon.id;
          const subtotal = storeItems.reduce((sum: number, item: any) => sum + item.price * item.quantity, 0);
          if (coupon.type === "PERCENTAGE") {
            discount = (subtotal * coupon.discount) / 100;
          } else {
            // If fixed amount, and it's a multi-store order, we might need a policy.
            // For now, apply it to the first eligible store found.
            discount = coupon.discount;
          }
        }
      }

      const store = await prisma.store.findUnique({
        where: { id: storeId },
        select: { deliveryCharge: true }
      });

      const deliveryCharge = store?.deliveryCharge || 0;
      const subtotal = storeItems.reduce((sum: number, item: any) => sum + item.price * item.quantity, 0);
      const totalPrice = subtotal + deliveryCharge - discount;

      const order = await prisma.order.create({
        data: {
          customerId: session.user.id,
          storeId,
          deliveryAddress,
          paymentMethod,
          couponId,
          discount,
          totalPrice: Math.max(0, totalPrice),
          deliveryCharge,
          items: {
            create: storeItems.map((item: any) => ({
              productId: item.id,
              quantity: item.quantity,
              price: item.price,
            })),
          },
        },
      });
      createdOrders.push(order);
    }

    return NextResponse.json(createdOrders);
  } catch (error) {
    console.error("Failed to place orders:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}


