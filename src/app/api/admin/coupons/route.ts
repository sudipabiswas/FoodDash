import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// GET global coupons
export async function GET() {
  try {
    const session = await auth();
    if (!session || (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const globalCoupons = await prisma.coupon.findMany({
      where: {
        storeId: null,
      },
      orderBy: {
        expiryDate: "desc",
      },
    });

    return NextResponse.json(globalCoupons);
  } catch (err: any) {
    console.error("Failed to fetch global coupons:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// POST new global coupon
export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session || (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { code, discount, type, expiryDate } = await req.json();

    if (!code || !discount || !expiryDate) {
      return NextResponse.json(
        { error: "Missing required fields (code, discount, expiryDate)" },
        { status: 400 }
      );
    }

    // Check if code already exists
    const existing = await prisma.coupon.findUnique({
      where: { code: code.toUpperCase().trim() },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Coupon code already exists" },
        { status: 400 }
      );
    }

    const newCoupon = await prisma.coupon.create({
      data: {
        code: code.toUpperCase().trim(),
        discount: parseFloat(discount),
        type: type || "PERCENTAGE",
        expiryDate: new Date(expiryDate),
        storeId: null, // null marks it as system-wide / global
        isActive: true,
      },
    });

    return NextResponse.json(newCoupon, { status: 201 });
  } catch (err: any) {
    console.error("Failed to create global coupon:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
