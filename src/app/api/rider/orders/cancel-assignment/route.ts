import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const session = await auth();

  if (!session?.user?.id || (session.user as any).role !== "DELIVERY_MAN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { orderId } = await req.json();

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: { deliveryManId: true, status: true }
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (order.deliveryManId !== session.user.id) {
      return NextResponse.json({ error: "You are not assigned to this order" }, { status: 403 });
    }

    // Only allow cancellation if order is not yet being prepared/delivered
    if (order.status !== "ACCEPTED") {
      return NextResponse.json({ error: "Order is already being processed and cannot be released" }, { status: 400 });
    }

    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        deliveryManId: null, // Unassign the rider
      },
    });

    return NextResponse.json(updatedOrder);
  } catch (error) {
    return NextResponse.json({ error: "Failed to release order" }, { status: 500 });
  }
}
