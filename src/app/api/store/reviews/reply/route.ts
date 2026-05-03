import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const session = await auth();
  if (!session || (session.user as any).role !== "STORE_OWNER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { reviewId, reply } = await req.json();

  if (!reviewId || !reply) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const store = await prisma.store.findFirst({
    where: { ownerId: session.user?.id },
  });

  if (!store) {
    return NextResponse.json({ error: "Store not found" }, { status: 404 });
  }

  // Verify review belongs to this store
  const review = await prisma.review.findFirst({
    where: { id: reviewId, storeId: store.id }
  });

  if (!review) {
    return NextResponse.json({ error: "Review not found" }, { status: 404 });
  }

  const updatedReview = await prisma.review.update({
    where: { id: reviewId },
    data: { ownerReply: reply }
  });

  return NextResponse.json(updatedReview);
}
