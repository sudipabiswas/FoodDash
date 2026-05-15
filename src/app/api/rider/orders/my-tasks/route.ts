import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();

  if (!session?.user?.id || session.user.role !== "DELIVERY_MAN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const orders = await prisma.order.findMany({
      where: {
        deliveryManId: session.user.id,
      },
      include: {
        store: {
          select: { name: true, image: true, deliveryCharge: true }
        },
        customer: {
          select: { name: true, email: true }
        },
        items: {
          include: { product: true }
        }
      },
      orderBy: { updatedAt: "desc" }
    });

    return NextResponse.json(orders);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch tasks" }, { status: 500 });
  }
}
