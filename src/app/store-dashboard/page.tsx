"use client";

import { useState, useEffect } from "react";
import { 
  TrendingUp, 
  DollarSign, 
  ShoppingBag, 
  Package, 
  Star,
  Plus,
  Download,
  ArrowRight
} from "lucide-react";
import Link from "next/link";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from "recharts";

export default function StoreDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch("/api/store/stats");
        const json = await res.json();
        if (res.ok) setData(json);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const exportToCSV = (filename: string, rows: any[]) => {
    if (!rows.length) return;
    const headers = Object.keys(rows[0]);
    const csvContent = [
      headers.join(","),
      ...rows.map(row => headers.map(fieldName => JSON.stringify(row[fieldName])).join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportRevenue = () => {
    if (!data?.recentOrders || data.recentOrders.length === 0) {
      alert("No revenue data available to export.");
      return;
    }
    const reportData = data.recentOrders.map((r: any) => ({
      OrderID: r.id,
      Date: new Date(r.createdAt).toLocaleDateString(),
      Status: r.status,
      Revenue: r.totalPrice.toFixed(2)
    }));
    exportToCSV(`Revenue_Report_${new Date().toISOString().split('T')[0]}.csv`, reportData);
  };

  const handleExportInventory = () => {
    if (!data?.popularItems || data.popularItems.length === 0) {
      alert("No inventory data available to export.");
      return;
    }
    const reportData = data.popularItems.map((item: any) => ({
      ProductName: item.name,
      Price: item.price,
      Orders: item._count.orderItems,
      CreatedAt: new Date(item.createdAt).toLocaleDateString()
    }));
    exportToCSV(`Inventory_Report_${new Date().toISOString().split('T')[0]}.csv`, reportData);
  };

  const handleAcceptOrder = async (orderId: string) => {
    try {
      const res = await fetch("/api/store/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, status: "ACCEPTED" }),
      });
      if (res.ok) {
        // Refresh data
        const refreshRes = await fetch("/api/store/stats");
        const json = await refreshRes.json();
        if (refreshRes.ok) setData(json);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const stats = data?.stats || [];
  const icons = [DollarSign, ShoppingBag, Package, Star];
  const colors = ["text-emerald-600", "text-blue-600", "text-violet-600", "text-amber-600"];
  const bgs = ["bg-emerald-100", "bg-blue-100", "bg-violet-100", "bg-amber-100"];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-4xl font-black tracking-tight bg-gradient-to-r from-foreground to-foreground/50 bg-clip-text text-transparent">
             Welcome Back, Owner
          </h1>
          <p className="text-muted-foreground mt-1 flex items-center gap-2">
             <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
             Store is live and taking orders
          </p>
        </div>
        <div className="flex items-center gap-3">
           <button 
             onClick={handleExportRevenue}
             className="flex items-center gap-2 px-4 py-2 bg-card border rounded-2xl text-sm font-bold hover:shadow-md transition-all"
           >
              <Download className="h-4 w-4" /> Export Report
           </button>
           <Link 
             href="/store-dashboard/products"
             className="flex items-center gap-2 px-5 py-2 bg-primary text-primary-foreground rounded-2xl text-sm font-bold shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all"
           >
              <Plus className="h-4 w-4" /> New Product
           </Link>
        </div>
      </div>

      {/* Stats Grid with Interactive Cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat: any, i: number) => {
          const Icon = icons[i] || TrendingUp;
          return (
            <Link 
              key={stat.name} 
              href={stat.link || "#"}
              className="group relative p-6 bg-card border rounded-[2.5rem] overflow-hidden hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 block"
            >
              <div className={`absolute top-0 right-0 w-32 h-32 -mr-8 -mt-8 ${bgs[i]} opacity-10 rounded-full group-hover:scale-150 transition-transform duration-500`} />
              
              <div className="relative space-y-4">
                <div className={`w-12 h-12 ${bgs[i]} ${colors[i]} rounded-2xl flex items-center justify-center group-hover:rotate-6 transition-transform`}>
                   <Icon className="h-6 w-6" />
                </div>
                <div>
                   <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{stat.name}</p>
                   <div className="flex items-end gap-2 mt-1">
                      <h3 className="text-3xl font-black">{stat.value}</h3>
                      <span className={`text-xs font-black mb-1 px-2 py-0.5 rounded-full ${
                        stat.growth.startsWith("-") ? "bg-red-100 text-red-600" : "bg-emerald-100 text-emerald-600"
                      }`}>
                         {stat.growth}
                      </span>
                   </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-12 gap-8">
        
        {/* Revenue Performance - Large interactive chart */}
        <div className="lg:col-span-8 space-y-8">
           <div className="bg-card border rounded-[3rem] p-10 shadow-sm relative overflow-hidden group">
              <div className="flex items-center justify-between mb-8">
                 <div>
                    <h2 className="text-2xl font-bold">Revenue Insights</h2>
                    <p className="text-sm text-muted-foreground">Earnings performance over the last week</p>
                 </div>
                 <select className="bg-muted px-4 py-2 rounded-xl text-xs font-bold border-none outline-none focus:ring-2 focus:ring-primary/20">
                    <option>Last 7 Days</option>
                    <option>Last 30 Days</option>
                 </select>
              </div>
              
              <div className="h-[350px] w-full">
                 <ResponsiveContainer width="100%" height="100%">
                   <AreaChart data={data?.chartData || []}>
                     <defs>
                       <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                         <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.3}/>
                         <stop offset="95%" stopColor="var(--primary)" stopOpacity={0}/>
                       </linearGradient>
                     </defs>
                     <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" opacity={0.5} />
                     <XAxis 
                        dataKey="name" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{fill: 'var(--muted-foreground)', fontSize: 12, fontWeight: 600}} 
                        dy={15} 
                     />
                     <YAxis 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{fill: 'var(--muted-foreground)', fontSize: 12, fontWeight: 600}} 
                     />
                     <Tooltip 
                        contentStyle={{
                          borderRadius: '1.5rem', 
                          border: 'none', 
                          backgroundColor: 'var(--card)',
                          boxShadow: '0 25px 50px -12px rgba(0,0,0,0.15)'
                        }} 
                        cursor={{ stroke: 'var(--primary)', strokeWidth: 2, strokeDasharray: '5 5' }}
                     />
                     <Area 
                        type="monotone" 
                        dataKey="sales" 
                        stroke="var(--primary)" 
                        strokeWidth={4} 
                        fillOpacity={1} 
                        fill="url(#colorSales)" 
                        animationDuration={2000}
                     />
                   </AreaChart>
                 </ResponsiveContainer>
              </div>
           </div>

           {/* Live Order Management - New Interactive Section */}
           <div className="bg-card border rounded-[3rem] p-10 shadow-sm">
              <div className="flex items-center justify-between mb-8">
                 <h2 className="text-2xl font-bold flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-orange-500 animate-ping" />
                    Pending Orders
                 </h2>
                 <Link href="/store-dashboard/orders" className="text-xs font-bold text-primary hover:underline">Manage All Orders →</Link>
              </div>
              <div className="grid gap-4">
                 {data?.recentOrders?.slice(0, 3).map((order: any) => (
                    <div key={order.id} className="group flex items-center justify-between p-6 bg-muted/30 rounded-3xl border border-transparent hover:border-primary/20 hover:bg-card transition-all">
                       <div className="flex items-center gap-5">
                          <div className="w-14 h-14 bg-white dark:bg-zinc-800 rounded-2xl flex items-center justify-center shadow-sm border">
                             <Package className="h-6 w-6 text-muted-foreground" />
                          </div>
                          <div>
                             <p className="font-bold">Order #{order.id.slice(-6).toUpperCase()}</p>
                             <p className="text-xs text-muted-foreground">{new Date(order.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} • {order.status}</p>
                          </div>
                       </div>
                       <div className="flex items-center gap-6">
                          <div className="text-right">
                             <p className="font-black text-lg text-primary">${order.totalPrice.toFixed(2)}</p>
                             <p className="text-[10px] text-muted-foreground font-bold">PREPAID</p>
                          </div>
                          <button 
                            onClick={() => handleAcceptOrder(order.id)}
                            className="px-6 py-2 bg-foreground text-background rounded-xl text-xs font-bold hover:scale-105 transition-transform active:scale-95"
                          >
                             Accept Order
                          </button>
                       </div>
                    </div>
                 ))}
              </div>
           </div>
        </div>

        {/* Sidebar Insights */}
        <div className="lg:col-span-4 space-y-8">
           {/* Popular Items - Visual progress style */}
           <div className="bg-card border rounded-[3rem] p-10 shadow-sm space-y-8">
              <h2 className="text-2xl font-bold">Top Sellers</h2>
              <div className="space-y-8">
                 {data?.popularItems?.map((item: any, i: number) => (
                    <div key={item.id} className="space-y-3">
                       <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                             <span className="text-xs font-black text-muted-foreground opacity-30">0{i+1}</span>
                             <p className="font-bold text-sm">{item.name}</p>
                          </div>
                          <p className="text-xs font-bold">${item.price}</p>
                       </div>
                       <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                          <div 
                             className={`h-full ${colors[i % colors.length].replace('text', 'bg')} transition-all duration-1000`} 
                             style={{ width: `${Math.min(100, (item._count.orderItems / 10) * 100)}%` }} 
                          />
                       </div>
                       <p className="text-[10px] text-muted-foreground font-bold flex justify-between uppercase">
                          <span>{item._count.orderItems} orders</span>
                          <span className="text-emerald-600">Growth: +12%</span>
                       </p>
                    </div>
                 ))}
              </div>
              <button 
                onClick={handleExportInventory}
                className="w-full py-4 bg-muted/50 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-muted transition-colors"
              >
                 Full Inventory Reports
              </button>
           </div>

           {/* Quick Feedback Card */}
           <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-[3rem] p-10 text-white shadow-xl shadow-indigo-500/20 relative overflow-hidden group">
              <div className="absolute -right-4 -bottom-4 w-40 h-40 bg-white/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700" />
              <div className="relative space-y-6">
                 <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md">
                    <Star className="h-6 w-6 fill-white" />
                 </div>
                 <div>
                    <h3 className="text-xl font-bold">Recent Reviews</h3>
                    <p className="text-white/70 text-sm mt-1">You have 3 new reviews to reply to.</p>
                 </div>
                 <Link href="/store-dashboard/analytics" className="inline-flex items-center gap-2 bg-white text-indigo-600 px-6 py-2 rounded-xl text-xs font-bold hover:shadow-lg transition-all active:scale-95">
                    View & Reply <ArrowRight className="h-3 w-3" />
                 </Link>
              </div>
           </div>
        </div>

      </div>
    </div>
  );
}
