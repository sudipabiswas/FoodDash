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
        <div className="lg:col-span-2 bg-card border rounded-3xl p-8 space-y-6">
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

        <div className="bg-card border rounded-3xl p-8 space-y-6">
           <h2 className="text-xl font-bold">Popular Items</h2>
           <div className="space-y-6">
              {[1, 2, 3].map((i: number) => (
                <div key={i} className="flex items-center gap-4">
                   <div className="w-16 h-16 rounded-2xl bg-muted overflow-hidden flex items-center justify-center">
                      <Package className="h-8 w-8 text-muted-foreground/50" />
                   </div>
                   <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm truncate">Premium Item {i}</p>
                      <p className="text-xs text-muted-foreground">High performance</p>
                   </div>
                   <div className="text-right">
                      <p className="font-bold text-sm">Top Seller</p>
                      <p className="text-[10px] text-green-600 font-bold">+5.2%</p>
                   </div>
                </div>
              ))}
           </div>
           <Link 
             href="/store-dashboard/analytics" 
             className="inline-block w-full py-3 border rounded-2xl text-sm font-bold hover:bg-muted transition-colors mt-4 text-center"
           >
              View Analytics
           </Link>
        </div>
      </div>
    </div>
  );
}
