import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();

  if (!session?.user?.id || (session.user as any).role !== "DELIVERY_MAN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const orders = await prisma.order.findMany({
      where: {
        status: "ACCEPTED", // Store has accepted it
        deliveryManId: null, // No rider assigned yet
      },
      include: {
        store: {
          select: { name: true, image: true, deliveryCharge: true }
        },
        items: {
          include: { product: true }
        }
      },
      orderBy: { createdAt: "desc" }
    });

    return NextResponse.json(orders);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 });
  }
}
