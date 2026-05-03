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

  const handleReply = async (reviewId: string, reply: string) => {
    try {
      const res = await fetch("/api/store/reviews/reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reviewId, reply }),
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
  const colors = ["text-green-600", "text-blue-600", "text-purple-600", "text-orange-600"];
  const bgs = ["bg-green-100", "bg-blue-100", "bg-purple-100", "bg-orange-100"];

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Store Dashboard</h1>
          <p className="text-muted-foreground mt-1">Manage your revenue, orders, and customer feedback.</p>
        </div>
        <Link href="/store-dashboard/analytics" className="px-6 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-bold shadow-lg hover:opacity-90 transition-opacity">
           View Full Analytics
        </Link>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat: any, i: number) => {
          const Icon = icons[i] || TrendingUp;
          return (
            <div 
              key={stat.name} 
              className="p-6 bg-card border rounded-3xl space-y-4 hover:shadow-xl transition-all group"
            >
              <div className={`w-12 h-12 ${bgs[i]} ${colors[i]} rounded-2xl flex items-center justify-center`}>
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
            </div>
          );
        })}
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
           {/* Revenue Chart */}
           <div className="bg-card border rounded-[2.5rem] p-8 space-y-6">
              <div className="flex items-center justify-between mb-4">
                 <h2 className="text-xl font-bold">Revenue Performance</h2>
                 <div className="flex items-center gap-2 px-3 py-1 bg-muted rounded-lg text-xs font-bold">
                    <TrendingUp className="h-3.5 w-3.5 text-primary" />
                    7-Day Trend
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
                     <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: 'var(--muted-foreground)', fontSize: 12}} dy={10} />
                     <YAxis axisLine={false} tickLine={false} tick={{fill: 'var(--muted-foreground)', fontSize: 12}} />
                     <Tooltip contentStyle={{borderRadius: '1rem', border: '1px solid var(--border)', backgroundColor: 'var(--card)'}} />
                     <Area type="monotone" dataKey="sales" stroke="var(--primary)" strokeWidth={3} fillOpacity={1} fill="url(#colorSales)" />
                   </AreaChart>
                 </ResponsiveContainer>
              </div>
           </div>

           {/* Detailed Revenue Table */}
           <div className="bg-card border rounded-[2.5rem] overflow-hidden">
              <div className="p-8 border-b flex justify-between items-center">
                 <h2 className="text-xl font-bold">Revenue Breakdown</h2>
                 <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Detailed Earnings</p>
              </div>
              <div className="overflow-x-auto">
                 <table className="w-full text-left">
                    <thead>
                       <tr className="border-b bg-muted/30">
                          <th className="px-8 py-4 text-xs font-bold uppercase text-muted-foreground">Order ID</th>
                          <th className="px-8 py-4 text-xs font-bold uppercase text-muted-foreground">Date</th>
                          <th className="px-8 py-4 text-xs font-bold uppercase text-muted-foreground">Status</th>
                          <th className="px-8 py-4 text-xs font-bold uppercase text-muted-foreground text-right">Revenue</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y">
                       {data?.revenueDetails?.slice(0, 8).map((item: any) => (
                         <tr key={item.id} className="hover:bg-muted/10 transition-colors">
                            <td className="px-8 py-4 font-mono text-xs">#{item.id.slice(-8).toUpperCase()}</td>
                            <td className="px-8 py-4 text-sm text-muted-foreground">{new Date(item.date).toLocaleDateString()}</td>
                            <td className="px-8 py-4">
                               <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${
                                  item.status === 'DELIVERED' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                               }`}>
                                  {item.status}
                               </span>
                            </td>
                            <td className="px-8 py-4 text-right font-bold text-primary">${item.amount.toFixed(2)}</td>
                         </tr>
                       ))}
                    </tbody>
                 </table>
              </div>
           </div>
        </div>

        <div className="space-y-8">
           {/* Active Items (Popular Items) */}
           <div className="bg-card border rounded-[2.5rem] p-8 space-y-6">
              <h2 className="text-xl font-bold flex items-center gap-2">
                 <Package className="h-5 w-5 text-primary" /> Active Items
              </h2>
              <div className="space-y-6">
                 {data?.popularItems?.map((item: any) => (
                    <div key={item.id} className="flex items-center gap-4 p-3 hover:bg-muted/30 rounded-2xl transition-colors">
                       <div className="w-12 h-12 rounded-xl bg-primary/5 flex items-center justify-center text-primary">
                          <Package className="h-6 w-6" />
                       </div>
                       <div className="flex-1 min-w-0">
                          <p className="font-bold text-sm truncate">{item.name}</p>
                          <p className="text-xs text-muted-foreground">{item._count.items} units sold</p>
                       </div>
                       <div className="text-right">
                          <p className="font-bold text-sm text-primary">${item.price}</p>
                       </div>
                    </div>
                 ))}
              </div>
           </div>

           {/* Customer Reviews (Review Option) */}
           <div className="bg-card border rounded-[2.5rem] p-8 space-y-6">
              <h2 className="text-xl font-bold flex items-center gap-2">
                 <Star className="h-5 w-5 text-orange-400" /> Customer Feedback
              </h2>
              <div className="space-y-6">
                 {data?.recentReviews?.slice(0, 3).map((review: any) => (
                    <div key={review.id} className="space-y-3 p-4 bg-muted/20 rounded-[2rem]">
                       <div className="flex items-center justify-between">
                          <p className="font-bold text-sm">{review.customer?.name}</p>
                          <div className="flex gap-0.5">
                             {[1, 2, 3, 4, 5].map((s) => (
                                <Star key={s} className={`h-3 w-3 ${s <= review.rating ? "fill-orange-400 text-orange-400" : "text-muted-foreground/20"}`} />
                             ))}
                          </div>
                       </div>
                       <p className="text-xs text-muted-foreground italic">"{review.comment}"</p>
                       
                       {review.ownerReply ? (
                          <div className="p-3 bg-primary/5 border-l-2 border-primary rounded-r-xl">
                             <p className="text-[10px] font-bold text-primary uppercase mb-1">Your Reply</p>
                             <p className="text-xs text-foreground/80">{review.ownerReply}</p>
                          </div>
                       ) : (
                          <DashboardReply reviewId={review.id} onReply={handleReply} />
                       )}
                    </div>
                 ))}
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}

function DashboardReply({ reviewId, onReply }: { reviewId: string, onReply: any }) {
  const [text, setText] = useState("");
  const [show, setShow] = useState(false);

  if (!show) return (
    <button onClick={() => setShow(true)} className="text-[11px] font-bold text-primary hover:underline">
       Reply to customer →
    </button>
  );

  return (
    <div className="space-y-2 mt-2">
       <textarea 
          className="w-full p-3 rounded-xl border bg-background text-xs outline-none focus:ring-2 focus:ring-primary/20"
          placeholder="Write your reply..."
          rows={2}
          value={text}
          onChange={(e) => setText(e.target.value)}
       />
       <div className="flex justify-end gap-2">
          <button onClick={() => setShow(false)} className="text-[10px] font-bold text-muted-foreground">Cancel</button>
          <button 
             onClick={() => { onReply(reviewId, text); setShow(false); }}
             className="px-4 py-1.5 bg-primary text-primary-foreground text-[10px] font-bold rounded-lg shadow-md"
          >
             Send
          </button>
       </div>
    </div>
  );
}
