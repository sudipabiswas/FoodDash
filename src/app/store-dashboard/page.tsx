"use client";

import { useState, useEffect } from "react";
import { DollarSign, ShoppingBag, Package, Star, TrendingUp } from "lucide-react";
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

  const stats = data?.stats || [];
  const icons = [DollarSign, ShoppingBag, Package, Star];
  const colors = ["text-green-600", "text-blue-600", "text-purple-600", "text-orange-600"];
  const bgs = ["bg-green-100", "bg-blue-100", "bg-purple-100", "bg-orange-100"];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">Overview</h1>
        <p className="text-muted-foreground mt-1">Real-time performance analytics for your restaurant.</p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat: any, i: number) => {
          const Icon = icons[i] || TrendingUp;
          return (
            <Link 
              key={stat.name} 
              href={stat.link || "#"}
              className="p-6 bg-card border rounded-3xl space-y-4 hover:shadow-xl hover:border-primary/20 transition-all group"
            >
              <div className={`w-12 h-12 ${bgs[i]} ${colors[i]} rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform`}>
                 <Icon className="h-6 w-6" />
              </div>
              <div>
                 <p className="text-sm text-muted-foreground font-medium">{stat.name}</p>
                 <div className="flex items-baseline gap-2">
                    <h3 className="text-2xl font-bold">{stat.value}</h3>
                    <span className={`text-xs font-bold ${stat.growth.startsWith("-") ? "text-destructive" : "text-green-600"}`}>
                       {stat.growth}
                    </span>
                 </div>
              </div>
            </Link>
          );
        })}
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
           {/* Revenue Chart */}
           <div className="bg-card border rounded-[2.5rem] p-8 space-y-6">
              <div className="flex items-center justify-between mb-4">
                 <h2 className="text-xl font-bold">Revenue Trends</h2>
                 <div className="flex items-center gap-2 px-3 py-1 bg-muted rounded-lg text-xs font-bold">
                    <TrendingUp className="h-3.5 w-3.5 text-primary" />
                    Last 7 Days
                 </div>
              </div>
              <div className="h-[300px] w-full">
                 <ResponsiveContainer width="100%" height="100%">
                   <AreaChart data={data?.chartData || []}>
                     <defs>
                       <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                         <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.1}/>
                         <stop offset="95%" stopColor="var(--primary)" stopOpacity={0}/>
                       </linearGradient>
                     </defs>
                     <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                     <XAxis 
                       dataKey="name" 
                       axisLine={false} 
                       tickLine={false} 
                       tick={{fill: 'var(--muted-foreground)', fontSize: 12}} 
                       dy={10}
                     />
                     <YAxis 
                       axisLine={false} 
                       tickLine={false} 
                       tick={{fill: 'var(--muted-foreground)', fontSize: 12}} 
                     />
                     <Tooltip 
                       contentStyle={{borderRadius: '1rem', border: '1px solid var(--border)', backgroundColor: 'var(--card)'}}
                     />
                     <Area 
                       type="monotone" 
                       dataKey="sales" 
                       stroke="var(--primary)" 
                       strokeWidth={3}
                       fillOpacity={1} 
                       fill="url(#colorSales)" 
                     />
                   </AreaChart>
                 </ResponsiveContainer>
              </div>
           </div>

           {/* Recent Orders Section */}
           <div className="bg-card border rounded-[2.5rem] overflow-hidden">
              <div className="p-8 border-b flex justify-between items-center">
                 <h2 className="text-xl font-bold">Recent Orders</h2>
                 <Link href="/store-dashboard/orders" className="text-xs font-bold text-primary hover:underline">View All</Link>
              </div>
              <div className="overflow-x-auto">
                 <table className="w-full text-left">
                    <thead>
                       <tr className="border-b bg-muted/30">
                          <th className="px-8 py-4 text-xs font-bold uppercase text-muted-foreground tracking-widest">Customer</th>
                          <th className="px-8 py-4 text-xs font-bold uppercase text-muted-foreground tracking-widest">Status</th>
                          <th className="px-8 py-4 text-xs font-bold uppercase text-muted-foreground tracking-widest text-right">Amount</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y">
                       {data?.recentOrders?.length === 0 ? (
                         <tr><td colSpan={3} className="p-8 text-center text-muted-foreground">No recent orders</td></tr>
                       ) : (
                         data?.recentOrders?.map((order: any) => (
                           <tr key={order.id} className="hover:bg-muted/10 transition-colors">
                              <td className="px-8 py-4">
                                 <p className="font-bold text-sm">{order.customer?.name}</p>
                                 <p className="text-[10px] text-muted-foreground">#{order.id.slice(-6).toUpperCase()}</p>
                              </td>
                              <td className="px-8 py-4">
                                 <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${
                                    order.status === 'DELIVERED' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                                 }`}>
                                    {order.status}
                                 </span>
                              </td>
                              <td className="px-8 py-4 text-right font-bold text-sm text-primary">${order.totalPrice.toFixed(2)}</td>
                           </tr>
                         ))
                       )}
                    </tbody>
                 </table>
              </div>
           </div>
        </div>

        <div className="space-y-8 h-fit">
           {/* Popular Items / Active Items */}
           <div className="bg-card border rounded-[2.5rem] p-8 space-y-6">
              <h2 className="text-xl font-bold">Popular Items</h2>
              <div className="space-y-6">
                 {data?.popularItems?.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">No data yet</p>
                 ) : (
                    data?.popularItems?.map((item: any) => (
                       <div key={item.id} className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl bg-primary/5 flex items-center justify-center text-primary">
                             <Package className="h-6 w-6" />
                          </div>
                          <div className="flex-1 min-w-0">
                             <p className="font-bold text-sm truncate">{item.name}</p>
                             <p className="text-xs text-muted-foreground">{item._count.items} sold</p>
                          </div>
                          <div className="text-right">
                             <p className="font-bold text-sm">${item.price}</p>
                          </div>
                       </div>
                    ))
                 )}
              </div>
           </div>

           {/* Review Option (Recent Reviews) */}
           <div className="bg-card border rounded-[2.5rem] p-8 space-y-6">
              <div className="flex items-center justify-between">
                 <h2 className="text-xl font-bold">Recent Reviews</h2>
                 <Link href="/store-dashboard/analytics" className="text-xs font-bold text-primary hover:underline">All</Link>
              </div>
              <div className="space-y-6">
                 {data?.recentReviews?.length === 0 ? (
                    <div className="py-8 text-center">
                       <Star className="h-8 w-8 text-muted-foreground mx-auto opacity-10" />
                       <p className="text-xs text-muted-foreground mt-2">No reviews yet</p>
                    </div>
                 ) : (
                    data?.recentReviews?.map((review: any) => (
                       <div key={review.id} className="space-y-2 p-4 bg-muted/20 rounded-2xl">
                          <div className="flex items-center justify-between">
                             <p className="font-bold text-xs">{review.customer?.name}</p>
                             <div className="flex gap-0.5">
                                {[1, 2, 3, 4, 5].map((s) => (
                                   <Star key={s} className={`h-2.5 w-2.5 ${s <= review.rating ? "fill-orange-400 text-orange-400" : "text-muted-foreground/20"}`} />
                                ))}
                             </div>
                          </div>
                          <p className="text-[10px] text-muted-foreground italic line-clamp-2">"{review.comment}"</p>
                          {review.ownerReply ? (
                             <p className="text-[9px] text-primary font-bold">✓ Replied</p>
                          ) : (
                             <Link href="/store-dashboard/analytics" className="text-[9px] font-bold text-primary hover:underline flex items-center gap-1 mt-1">
                                Reply now →
                             </Link>
                          )}
                       </div>
                    ))
                 )}
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
