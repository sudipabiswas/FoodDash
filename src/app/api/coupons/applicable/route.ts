import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { storeIds } = await req.json();

    if (!storeIds || !Array.isArray(storeIds)) {
      return NextResponse.json({ error: "Store IDs are required" }, { status: 400 });
    }

    const coupons = await prisma.coupon.findMany({
      where: {
        isActive: true,
        expiryDate: { gte: new Date() },
        OR: [
          { storeId: { in: storeIds } },
          { storeId: null }
        ]
      },
      include: {
        store: {
          select: { name: true }
        }
      }
    });

    return NextResponse.json(coupons);
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
