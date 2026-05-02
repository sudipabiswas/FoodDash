import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
export async function GET() {
  const session = await auth();

  if (!session || (session.user as any).role !== "STORE_OWNER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const store = await prisma.store.findFirst({
    where: { ownerId: session.user?.id },
    include: { coupons: true }
  });

  if (!store) {
    return NextResponse.json({ error: "Store not found" }, { status: 404 });
  }

  return NextResponse.json({ coupons: store.coupons, storeId: store.id });
}

export async function POST(req: Request) {
  const session = await auth();

  if (!session || (session.user as any).role !== "STORE_OWNER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { code, discount, type, expiryDate, storeId } = await req.json();

    const coupon = await prisma.coupon.create({
      data: {
        code: code.toUpperCase(),
        discount: parseFloat(discount),
        type, // PERCENTAGE or FIXED
        expiryDate: new Date(expiryDate),
        storeId,
        isActive: true
      },
    });

    return NextResponse.json(coupon);
  } catch (error: any) {
    console.error("Coupon creation error:", error);
    if (error.code === 'P2002') {
       return NextResponse.json({ error: "Coupon code already exists" }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const session = await auth();
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!session || (session.user as any).role !== "STORE_OWNER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!id) {
    return NextResponse.json({ error: "Coupon ID required" }, { status: 400 });
  }

  try {
    await prisma.coupon.delete({
      where: { id },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
