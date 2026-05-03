import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const session = await auth();
  const { searchParams } = new URL(req.url);
  const range = searchParams.get("range") || "weekly"; // weekly or monthly

  if (!session || (session.user as any).role !== "STORE_OWNER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const store = await prisma.store.findFirst({
    where: { ownerId: session.user?.id },
  });

  if (!store) {
    return NextResponse.json({ error: "Store not found" }, { status: 404 });
  }

  const daysToFetch = range === "monthly" ? 30 : 7;
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - daysToFetch);
  
  const prevStartDate = new Date();
  prevStartDate.setDate(prevStartDate.getDate() - (daysToFetch * 2));

  // Fetch current period orders
  const currentOrders = await prisma.order.findMany({
    where: { 
      storeId: store.id,
      createdAt: { gte: startDate }
    },
  });

  // Fetch previous period orders for growth calculation
  const prevOrders = await prisma.order.findMany({
    where: { 
      storeId: store.id,
      createdAt: { 
        gte: prevStartDate,
        lt: startDate
      }
    },
  });

  const products = await prisma.product.count({
    where: { storeId: store.id },
  });

  // Calculate Rating
  const reviews = await prisma.review.findMany({
    where: { storeId: store.id },
    select: { rating: true }
  });
  const avgRating = reviews.length > 0 
    ? (reviews.reduce((sum: number, r: any) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : "0.0";

  const totalRevenue = currentOrders.reduce((sum: number, order: any) => sum + order.totalPrice, 0);
  const prevRevenue = prevOrders.reduce((sum: number, order: any) => sum + order.totalPrice, 0);
  
  const revenueGrowth = prevRevenue === 0 ? (totalRevenue > 0 ? "+100%" : "0%") : 
    `${(((totalRevenue - prevRevenue) / prevRevenue) * 100).toFixed(0)}%`;
  
  const ordersGrowth = prevOrders.length === 0 ? (currentOrders.length > 0 ? "+100%" : "0%") : 
    `${(((currentOrders.length - prevOrders.length) / prevOrders.length) * 100).toFixed(0)}%`;

  const totalOrders = currentOrders.length;
  const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
  
  // Unique customers in current period
  const uniqueCustomers = new Set(currentOrders.map((o: any) => o.customerId)).size;
  
  // Success rate (Delivered / Total)
  const deliveredOrders = currentOrders.filter((o: any) => o.status === "DELIVERED").length;
  const successRate = totalOrders > 0 ? (deliveredOrders / totalOrders) * 100 : 100;

  // Group orders by day for chart
  const days = Array.from({ length: daysToFetch }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (daysToFetch - 1 - i));
    return d.toISOString().split("T")[0];
  });

  const chartData = days.map((date: string) => {
    const dayOrders = currentOrders.filter((o: any) => o.createdAt.toISOString().split("T")[0] === date);
    return {
      name: range === "monthly" 
        ? new Date(date).toLocaleDateString("en-US", { day: "numeric", month: "short" })
        : new Date(date).toLocaleDateString("en-US", { weekday: "short" }),
      sales: dayOrders.reduce((sum: number, o: any) => sum + o.totalPrice, 0),
    };
  });

  const recentReviews = await prisma.review.findMany({
    where: { storeId: store.id },
    take: 5,
    orderBy: { createdAt: "desc" },
    include: { customer: { select: { name: true } } }
  });

  return NextResponse.json({
    stats: [
      { name: "Total Revenue", value: `$${totalRevenue.toFixed(2)}`, growth: revenueGrowth.startsWith("-") ? revenueGrowth : `+${revenueGrowth}`, link: "/store-dashboard/analytics" },
      { name: "Total Orders", value: totalOrders.toString(), growth: ordersGrowth.startsWith("-") ? ordersGrowth : `+${ordersGrowth}`, link: "/store-dashboard/orders" },
      { name: "Active Products", value: products.toString(), growth: "Stable", link: "/store-dashboard/products" },
      { name: "Customer Rating", value: avgRating, growth: `(${reviews.length} reviews)`, link: "/store-dashboard/analytics" },
    ],
    detailedStats: {
       avgOrderValue: `$${avgOrderValue.toFixed(2)}`,
       newCustomers: uniqueCustomers.toString(),
       successRate: `${successRate.toFixed(1)}%`
    },
    chartData,
    recentReviews,
    revenueDetails: currentOrders.map((o: any) => ({
       id: o.id,
       date: o.createdAt,
       customer: o.customerId, // Could join for name if needed
       amount: o.totalPrice,
       status: o.status
    })).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    periodSummary: {
       daily: currentOrders.filter(o => new Date(o.createdAt).toDateString() === new Date().toDateString()).reduce((sum, o) => sum + o.totalPrice, 0),
       weekly: currentOrders.reduce((sum, o) => sum + o.totalPrice, 0),
       monthly: totalRevenue // assuming range handles this
    }
  });
}
