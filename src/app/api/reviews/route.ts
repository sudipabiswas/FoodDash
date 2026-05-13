import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { orderId, rating, comment } = await req.json();

    if (!orderId || !rating) {
      return NextResponse.json({ error: "Order ID and rating are required" }, { status: 400 });
    }

    // Verify order exists, belongs to customer, and is DELIVERED
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { review: true }
    });

    if (!order || order.customerId !== session.user.id) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (order.status !== "DELIVERED") {
      return NextResponse.json({ error: "You can only review delivered orders" }, { status: 400 });
    }

    if (order.review) {
      return NextResponse.json({ error: "You have already reviewed this order" }, { status: 400 });
    }

    const review = await prisma.review.create({
      data: {
        storeId: order.storeId,
        customerId: session.user.id,
        orderId: order.id,
        rating: Number(rating),
        comment
      },
      include: {
        customer: {
          select: {
            name: true,
            email: true
          }
        }
      }
    });

    return NextResponse.json(review);
  } catch (error: any) {
    console.error("Failed to submit review:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}



export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const storeId = searchParams.get("storeId");

  if (!storeId) {
    return NextResponse.json({ error: "Store ID is required" }, { status: 400 });
  }

  try {
    const reviews = await prisma.review.findMany({
      where: { storeId },
      include: {
        customer: {
          select: {
            name: true,
            email: true
          }
        }
      },
      orderBy: { createdAt: "desc" }
    });

    return NextResponse.json(reviews);
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
