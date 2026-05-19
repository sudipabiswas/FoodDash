import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await auth();
    if (!session || (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 1. Core Platform Stats
    // Active orders (excludes CANCELLED)
    const activeOrders = await prisma.order.findMany({
      where: {
        status: {
          not: "CANCELLED",
        },
      },
      select: {
        totalPrice: true,
        deliveryCharge: true,
      },
    });

    const totalOrdersCount = await prisma.order.count();
    
    // Revenue calculations (commission = 10% of food cost)
    let totalRevenue = 0;
    let platformEarnings = 0;
    activeOrders.forEach(o => {
      totalRevenue += o.totalPrice;
      const foodTotal = Math.max(0, o.totalPrice - o.deliveryCharge);
      platformEarnings += foodTotal * 0.10;
    });

    // 2. Users grouped by role
    const users = await prisma.user.findMany({
      select: {
        role: true,
      },
    });

    const userStats = {
      total: users.length,
      customers: users.filter(u => u.role === "CUSTOMER").length,
      storeOwners: users.filter(u => u.role === "STORE_OWNER").length,
      deliveryMen: users.filter(u => u.role === "DELIVERY_MAN").length,
      admins: users.filter(u => u.role === "ADMIN").length,
    };

    // 3. Stores active/suspended
    const totalStores = await prisma.store.count();
    const activeStores = await prisma.store.count({ where: { active: true } });
    const suspendedStores = totalStores - activeStores;

    // 4. Daily sales & orders (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentDailyOrders = await prisma.order.findMany({
      where: {
        createdAt: {
          gte: sevenDaysAgo,
        },
        status: {
          not: "CANCELLED",
        },
      },
      select: {
        createdAt: true,
        totalPrice: true,
        deliveryCharge: true,
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    // Group by date string (YYYY-MM-DD)
    const dailyMap = new Map<string, { date: string; revenue: number; orders: number; commission: number }>();
    
    // Seed last 7 days
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];
      dailyMap.set(dateStr, { date: dateStr, revenue: 0, orders: 0, commission: 0 });
    }

    recentDailyOrders.forEach(o => {
      const dateStr = o.createdAt.toISOString().split("T")[0];
      if (dailyMap.has(dateStr)) {
        const current = dailyMap.get(dateStr)!;
        const foodTotal = Math.max(0, o.totalPrice - o.deliveryCharge);
        current.revenue = parseFloat((current.revenue + o.totalPrice).toFixed(2));
        current.orders += 1;
        current.commission = parseFloat((current.commission + foodTotal * 0.10).toFixed(2));
      }
    });

    const salesTrend = Array.from(dailyMap.values());

    // 5. Recent Activities lists
    const recentOrders = await prisma.order.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: {
        customer: { select: { name: true, email: true } },
        store: { select: { name: true } },
      },
    });

    const recentUsers = await prisma.user.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      select: { id: true, name: true, email: true, role: true, createdAt: true },
    });

    const recentStores = await prisma.store.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: {
        owner: { select: { name: true, email: true } },
      },
    });

    return NextResponse.json({
      stats: {
        totalRevenue: parseFloat(totalRevenue.toFixed(2)),
        platformEarnings: parseFloat(platformEarnings.toFixed(2)),
        totalOrdersCount,
        userStats,
        storeStats: {
          total: totalStores,
          active: activeStores,
          suspended: suspendedStores,
        },
      },
      salesTrend,
      recentOrders,
      recentUsers,
      recentStores,
    });
  } catch (err: any) {
    console.error("Failed to load admin stats API:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
