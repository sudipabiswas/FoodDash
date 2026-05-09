import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { code, storeId } = await req.json();

    if (!code) {
      return NextResponse.json({ error: "Coupon code is required" }, { status: 400 });
    }

    const coupon = await prisma.coupon.findFirst({
      where: {
        code: code,
        isActive: true,
        expiryDate: { gte: new Date() },
        OR: [
          { storeId: storeId },
          { storeId: null }
        ]
      }
    });

    if (!coupon) {
      return NextResponse.json({ error: "Invalid or expired coupon" }, { status: 404 });
    }

    return NextResponse.json(coupon);
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
