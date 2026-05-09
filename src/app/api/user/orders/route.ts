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
    const { items, storeId, deliveryAddress, paymentMethod, couponCode } = await req.json();

    if (!items || items.length === 0 || !storeId || !deliveryAddress) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    let discount = 0;
    let couponId = null;

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
        // Calculate subtotal for discount
        const subtotal = items.reduce((sum: number, item: any) => sum + item.price * item.quantity, 0);
        if (coupon.type === "PERCENTAGE") {
          discount = (subtotal * coupon.discount) / 100;
        } else {
          discount = coupon.discount;
        }
      }
    }

    const store = await prisma.store.findUnique({
      where: { id: storeId },
      select: { deliveryCharge: true }
    });

    const deliveryCharge = store?.deliveryCharge || 0;
    const subtotal = items.reduce((sum: number, item: any) => sum + item.price * item.quantity, 0);
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
          create: items.map((item: any) => ({
            productId: item.id,
            quantity: item.quantity,
            price: item.price,
          })),
        },
      },
    });

    return NextResponse.json(order);
  } catch (error) {
    console.error("Failed to place order:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

