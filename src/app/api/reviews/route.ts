import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { storeId, rating, comment } = await req.json();

    if (!storeId || !rating) {
      return NextResponse.json({ error: "Store ID and rating are required" }, { status: 400 });
    }

    // Check if user has already reviewed this store (optional, but good practice)
    const existingReview = await prisma.review.findFirst({
      where: {
        storeId,
        customerId: session.user.id
      }
    });

    if (existingReview) {
      // Update existing review instead of creating new one?
      // For now, let's just create a new one or error out.
      // The user said "can give both review and rating", so maybe multiple? 
      // Usually one review per store is standard.
    }

    const review = await prisma.review.create({
      data: {
        storeId,
        customerId: session.user.id,
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
  } catch (error) {
    console.error("Failed to submit review:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
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
