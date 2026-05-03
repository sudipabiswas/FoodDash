import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const session = await auth();
  if (!session || (session.user as any).role !== "STORE_OWNER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const store = await prisma.store.findFirst({
    where: { ownerId: session.user?.id },
  });

  if (!store) {
    return NextResponse.json({ error: "Store not found" }, { status: 404 });
  }

  const reviews = await prisma.review.findMany({
    where: { storeId: store.id },
    orderBy: { createdAt: "desc" },
    include: {
      customer: {
        select: {
          name: true,
          email: true
        }
      }
    }
  });

  return NextResponse.json(reviews);
}
