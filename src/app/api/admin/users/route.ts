import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await auth();
    if (!session || (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const users = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        _count: {
          select: {
            orders: true,
            deliveryOrders: true,
            stores: true,
            reviews: true,
          },
        },
      },
    });

    return NextResponse.json(users);
  } catch (err: any) {
    console.error("Failed to fetch users for admin:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
