import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { orderId } = await req.json();

    if (!orderId) {
      return NextResponse.json({ error: "Order ID is required" }, { status: 400 });
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: { customerId: true, status: true }
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Only allow cancellation if the order belongs to the user and is still PENDING
    if (order.customerId !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized to cancel this order" }, { status: 403 });
    }

    if (order.status !== "PENDING") {
      return NextResponse.json({ error: "Order cannot be cancelled as it is already being processed" }, { status: 400 });
    }

    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: { status: "CANCELLED" }
    });

    return NextResponse.json(updatedOrder);
  } catch (error) {
    console.error("Failed to cancel order:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
