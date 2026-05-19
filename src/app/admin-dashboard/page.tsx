"use client";

import { useEffect, useState } from "react";
import { 
  TrendingUp, 
  DollarSign, 
  ShoppingBag, 
  Store, 
  Users, 
  ArrowUpRight, 
  Clock, 
  ShieldAlert,
  Loader2
} from "lucide-react";
import Link from "next/link";
import dynamic from "next/dynamic";

// Dynamically import Recharts to avoid SSR hydration mismatches
const ResponsiveContainer = dynamic(() => import("recharts").then(m => m.ResponsiveContainer), { ssr: false });
const AreaChart = dynamic(() => import("recharts").then(m => m.AreaChart), { ssr: false });
const Area = dynamic(() => import("recharts").then(m => m.Area), { ssr: false });
const XAxis = dynamic(() => import("recharts").then(m => m.XAxis), { ssr: false });
const YAxis = dynamic(() => import("recharts").then(m => m.YAxis), { ssr: false });
const CartesianGrid = dynamic(() => import("recharts").then(m => m.CartesianGrid), { ssr: false });
const Tooltip = dynamic(() => import("recharts").then(m => m.Tooltip), { ssr: false });
const Legend = dynamic(() => import("recharts").then(m => m.Legend), { ssr: false });
const PieChart = dynamic(() => import("recharts").then(m => m.PieChart), { ssr: false });
const Pie = dynamic(() => import("recharts").then(m => m.Pie), { ssr: false });
const Cell = dynamic(() => import("recharts").then(m => m.Cell), { ssr: false });

interface DashboardData {
  stats: {
    totalRevenue: number;
    platformEarnings: number;
    totalOrdersCount: number;
    userStats: {
      total: number;
      customers: number;
      storeOwners: number;
      deliveryMen: number;
      admins: number;
    };
    storeStats: {
      total: number;
      active: number;
      suspended: number;
    };
  };
  salesTrend: Array<{
    date: string;
    revenue: number;
    orders: number;
    commission: number;
  }>;
  recentOrders: Array<{
    id: string;
    totalPrice: number;
    status: string;
    createdAt: string;
    customer: { name: string; email: string };
    store: { name: string };
  }>;
  recentUsers: Array<{
    id: string;
    name: string | null;
    email: string;
    role: string;
    createdAt: string;
  }>;
  recentStores: Array<{
    id: string;
    name: string;
    active: boolean;
    createdAt: string;
    owner: { name: string | null; email: string };
  }>;
}

const COLORS = ["#3b82f6", "#a855f7", "#eab308", "#ef4444"];

export default function AdminDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch("/api/admin/stats");
        if (!res.ok) throw new Error("Failed to load statistics");
        const json = await res.json();
        setData(json);
      } catch (err: any) {
        setError(err.message || "An unexpected error occurred");
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-2">
        <Loader2 className="h-10 w-10 text-primary animate-spin" />
        <p className="text-muted-foreground font-medium text-sm">Aggregating platform metrics...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="border border-destructive/20 bg-destructive/10 text-destructive p-6 rounded-2xl flex items-start gap-4">
        <ShieldAlert className="h-6 w-6 shrink-0 mt-0.5" />
        <div>
          <h3 className="font-bold text-lg">Error Loading Dashboard</h3>
          <p className="text-sm mt-1">{error || "Could not retrieve statistics."}</p>
        </div>
      </div>
    );
  }

  const { stats, salesTrend, recentOrders, recentUsers, recentStores } = data;

  // Prepare Pie Chart Data
  const pieData = [
    { name: "Customers", value: stats.userStats.customers },
    { name: "Store Owners", value: stats.userStats.storeOwners },
    { name: "Riders", value: stats.userStats.deliveryMen },
    { name: "Admins", value: stats.userStats.admins },
  ].filter(item => item.value > 0);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">System Overview</h1>
        <p className="text-muted-foreground mt-1">Real-time statistics and administrative summary of FoodDash.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Card 1: Total Revenue */}
        <div className="bg-card border rounded-3xl p-6 relative overflow-hidden group hover:shadow-xl transition-all duration-300">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Gross Revenue</span>
            <div className="p-3 bg-blue-500/10 rounded-2xl text-blue-500 group-hover:scale-110 transition-transform">
              <DollarSign className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-black">${stats.totalRevenue.toLocaleString()}</h3>
            <p className="text-xs text-muted-foreground mt-1">Gross transaction value from all stores</p>
          </div>
          <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-indigo-600" />
        </div>

        {/* Card 2: Commission Earnings */}
        <div className="bg-card border rounded-3xl p-6 relative overflow-hidden group hover:shadow-xl transition-all duration-300">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Platform Commission (10%)</span>
            <div className="p-3 bg-emerald-500/10 rounded-2xl text-emerald-500 group-hover:scale-110 transition-transform">
              <TrendingUp className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-black text-emerald-600">${stats.platformEarnings.toLocaleString()}</h3>
            <p className="text-xs text-muted-foreground mt-1">Calculated commission fee from food items</p>
          </div>
          <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-teal-600" />
        </div>

        {/* Card 3: Orders Count */}
        <div className="bg-card border rounded-3xl p-6 relative overflow-hidden group hover:shadow-xl transition-all duration-300">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Total Orders</span>
            <div className="p-3 bg-purple-500/10 rounded-2xl text-purple-500 group-hover:scale-110 transition-transform">
              <ShoppingBag className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-black">{stats.totalOrdersCount.toLocaleString()}</h3>
            <p className="text-xs text-muted-foreground mt-1">Orders processed across the platform</p>
          </div>
          <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 to-fuchsia-600" />
        </div>

        {/* Card 4: Stores & Users Count */}
        <div className="bg-card border rounded-3xl p-6 relative overflow-hidden group hover:shadow-xl transition-all duration-300">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Active Entities</span>
            <div className="p-3 bg-amber-500/10 rounded-2xl text-amber-500 group-hover:scale-110 transition-transform">
              <Store className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-black">{stats.storeStats.active} Stores</h3>
            <p className="text-xs text-muted-foreground mt-1">Out of {stats.storeStats.total} registered stores ({stats.userStats.total} total users)</p>
          </div>
          <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-amber-500 to-orange-600" />
        </div>
      </div>

      {/* Recharts Graphs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Trend Graph */}
        <div className="bg-card border rounded-3xl p-6 lg:col-span-2 space-y-4">
          <div>
            <h3 className="font-bold text-lg">Sales & Commission Trends</h3>
            <p className="text-xs text-muted-foreground">Daily platform volume and net commission earnings (last 7 days)</p>
          </div>
          <div className="h-72 w-full">
            {salesTrend.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={salesTrend}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorCommission" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                  <XAxis dataKey="date" tickLine={false} style={{ fontSize: '11px', fill: '#888' }} />
                  <YAxis tickLine={false} axisLine={false} style={{ fontSize: '11px', fill: '#888' }} />
                  <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }} />
                  <Legend verticalAlign="top" height={36} iconType="circle" style={{ fontSize: '12px' }} />
                  <Area name="Gross Revenue ($)" type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorRevenue)" />
                  <Area name="Commission Fee ($)" type="monotone" dataKey="commission" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorCommission)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground text-sm">No sales data recorded in the last 7 days.</div>
            )}
          </div>
        </div>

        {/* Right Pie Graph */}
        <div className="bg-card border rounded-3xl p-6 flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-lg">User Base Distribution</h3>
            <p className="text-xs text-muted-foreground">Distribution ratios of user accounts across platform roles</p>
          </div>
          <div className="h-56 w-full relative flex items-center justify-center">
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-muted-foreground text-sm">No users found.</div>
            )}
            <div className="absolute flex flex-col items-center justify-center">
              <span className="text-3xl font-extrabold">{stats.userStats.total}</span>
              <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Total Accounts</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 text-xs mt-4">
            {pieData.map((item, idx) => (
              <div key={item.name} className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                <span className="text-muted-foreground truncate">{item.name}:</span>
                <span className="font-bold">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Activity Section */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Recent Orders List (col-span-2) */}
        <div className="bg-card border rounded-3xl p-6 xl:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-lg">Recent Order Activity</h3>
            <span className="text-xs px-2.5 py-1 bg-muted rounded-full font-medium flex items-center gap-1">
              <Clock className="h-3 w-3" /> Live
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="border-b text-muted-foreground font-medium">
                  <th className="pb-3 font-semibold">Store</th>
                  <th className="pb-3 font-semibold">Customer</th>
                  <th className="pb-3 font-semibold">Price</th>
                  <th className="pb-3 font-semibold">Status</th>
                  <th className="pb-3 font-semibold">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {recentOrders.length > 0 ? (
                  recentOrders.map((o) => (
                    <tr key={o.id} className="group hover:bg-muted/30 transition-colors">
                      <td className="py-3.5 pr-2 font-bold">{o.store.name}</td>
                      <td className="py-3.5 pr-2">
                        <p className="font-medium text-foreground">{o.customer.name || "Customer"}</p>
                        <p className="text-xs text-muted-foreground">{o.customer.email}</p>
                      </td>
                      <td className="py-3.5 pr-2 font-bold text-foreground">${o.totalPrice.toFixed(2)}</td>
                      <td className="py-3.5 pr-2">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                          o.status === "DELIVERED" ? "bg-emerald-500/10 text-emerald-600" :
                          o.status === "CANCELLED" ? "bg-destructive/10 text-destructive" :
                          "bg-blue-500/10 text-blue-600"
                        }`}>
                          {o.status}
                        </span>
                      </td>
                      <td className="py-3.5 text-muted-foreground text-xs">
                        {new Date(o.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-muted-foreground">No orders placed yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right list: Recent Stores */}
        <div className="bg-card border rounded-3xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-lg">New Store Registration</h3>
            <Link href="/admin-dashboard/stores" className="text-xs text-primary font-bold hover:underline flex items-center gap-0.5">
              Manage <ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="space-y-4">
            {recentStores.length > 0 ? (
              recentStores.map((s) => (
                <div key={s.id} className="flex items-center justify-between gap-4 p-3 bg-muted/20 border rounded-2xl hover:bg-muted/40 transition-colors group">
                  <div className="min-w-0">
                    <p className="font-bold truncate text-sm">{s.name}</p>
                    <p className="text-xs text-muted-foreground truncate">Owner: {s.owner.name || "N/A"} ({s.owner.email})</p>
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${s.active ? "bg-emerald-500/10 text-emerald-600" : "bg-destructive/10 text-destructive"}`}>
                    {s.active ? "ACTIVE" : "SUSPENDED"}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-sm text-center text-muted-foreground py-8">No stores registered yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
