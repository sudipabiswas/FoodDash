"use client";

import { useState, useEffect } from "react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend
} from "recharts";
import { TrendingUp, Users, ShoppingCart, DollarSign, Calendar, MessageSquare, Star } from "lucide-react";

export default function AnalyticsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [range, setRange] = useState("weekly");

  useEffect(() => {
    fetchData();
  }, [range]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/store/stats?range=${range}`);
      const json = await res.json();
      if (res.ok) setData(json);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleReply = async (reviewId: string, replyText: string) => {
    try {
      const res = await fetch("/api/store/reviews/reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reviewId, reply: replyText }),
      });
      if (res.ok) {
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const downloadReport = (format: string) => {
    if (!data?.revenueDetails) return;
    
    const headers = ["Order ID", "Date", "Status", "Revenue"];
    const rows = data.revenueDetails.map((item: any) => [
      item.id,
      new Date(item.date).toLocaleDateString(),
      item.status,
      item.amount.toFixed(2)
    ]);

    const content = [headers, ...rows].map(row => row.join(",")).join("\n");
    const blob = new Blob([content], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', `revenue_report_${range}_${new Date().toISOString().split('T')[0]}.${format === 'xlsx' ? 'csv' : format}`);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8"];

  const categoryData = [
    { name: "Burgers", value: 400 },
    { name: "Beverages", value: 300 },
    { name: "Desserts", value: 200 },
    { name: "Sides", value: 278 },
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Business Analytics</h1>
          <p className="text-muted-foreground mt-1">Deep dive into your restaurant's performance data.</p>
        </div>
        <div className="flex gap-4">
           <div className="flex gap-1 bg-muted p-1 rounded-xl">
              <button 
                onClick={() => setActiveTab("overview")}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                  activeTab === "overview" ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Overview
              </button>
              <button 
                onClick={() => setActiveTab("reviews")}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                  activeTab === "reviews" ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Customer Reviews
              </button>
           </div>
           
           {activeTab === "overview" && (
             <div className="flex gap-1 bg-muted p-1 rounded-xl">
                <button 
                  onClick={() => setRange("weekly")}
                  className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                    range === "weekly" ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Weekly
                </button>
                <button 
                  onClick={() => setRange("monthly")}
                  className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                    range === "monthly" ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Monthly
                </button>
             </div>
           )}
        </div>
      </div>

      {activeTab === "overview" ? (
        <>
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Revenue Line Chart */}
            <div className="bg-card border rounded-[2.5rem] p-8 space-y-6">
               <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold flex items-center gap-2">
                     <TrendingUp className="h-5 w-5 text-primary" /> Sales Performance ({range === "weekly" ? "7 Days" : "30 Days"})
                  </h2>
               </div>
               {loading ? (
                 <div className="h-[300px] flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                 </div>
               ) : (
                 <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                       <LineChart data={data?.chartData || []}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10}} dy={10} interval={range === "monthly" ? 4 : 0} />
                          <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12}} />
                          <Tooltip contentStyle={{borderRadius: '1rem', border: '1px solid var(--border)'}} />
                          <Legend />
                          <Line type="monotone" dataKey="sales" stroke="var(--primary)" strokeWidth={4} dot={range === "weekly" ? {r: 6, fill: 'var(--primary)'} : false} activeDot={{r: 8}} />
                       </LineChart>
                    </ResponsiveContainer>
                 </div>
               )}
            </div>

            {/* Category Distribution Pie Chart */}
            <div className="bg-card border rounded-[2.5rem] p-8 space-y-6">
               <h2 className="text-xl font-bold flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5 text-primary" /> Category Distribution
               </h2>
               <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                     <PieChart>
                        <Pie
                          data={categoryData}
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {categoryData.map((entry: any, index: number) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend verticalAlign="bottom" height={36}/>
                     </PieChart>
                  </ResponsiveContainer>
               </div>
            </div>
          </div>

          <div className="grid sm:grid-cols-4 gap-6">
             <div className="p-6 bg-card border rounded-[2rem] space-y-2">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Today's Revenue</p>
                <h3 className="text-2xl font-extrabold">${data?.periodSummary?.daily?.toFixed(2) || "0.00"}</h3>
             </div>
             <div className="p-6 bg-card border rounded-[2rem] space-y-2">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Weekly Revenue</p>
                <h3 className="text-2xl font-extrabold">${data?.periodSummary?.weekly?.toFixed(2) || "0.00"}</h3>
             </div>
             <div className="p-6 bg-card border rounded-[2rem] space-y-2">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Monthly Revenue</p>
                <h3 className="text-2xl font-extrabold">${data?.periodSummary?.monthly?.toFixed(2) || "0.00"}</h3>
             </div>
             <div className="p-6 bg-primary text-primary-foreground rounded-[2rem] space-y-4 flex flex-col justify-center">
                <p className="text-xs font-bold uppercase tracking-widest opacity-80">Reports</p>
                <div className="flex gap-2">
                   <button 
                     onClick={() => downloadReport('csv')}
                     className="flex-1 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-[10px] font-bold transition-colors"
                   >
                     CSV
                   </button>
                   <button 
                     onClick={() => downloadReport('xlsx')}
                     className="flex-1 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-[10px] font-bold transition-colors"
                   >
                     XLSX
                   </button>
                   <button 
                     onClick={() => window.print()}
                     className="flex-1 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-[10px] font-bold transition-colors"
                   >
                     PDF
                   </button>
                </div>
             </div>
          </div>

          <div className="bg-card border rounded-[2.5rem] overflow-hidden">
             <div className="p-8 border-b bg-muted/30 flex justify-between items-center">
                <h2 className="text-xl font-bold">Revenue Breakdown by Order</h2>
                <DollarSign className="h-5 w-5 text-primary" />
             </div>
             <div className="overflow-x-auto">
                <table className="w-full text-left">
                   <thead>
                      <tr className="border-b">
                         <th className="px-8 py-4 text-xs font-bold uppercase text-muted-foreground">Order ID</th>
                         <th className="px-8 py-4 text-xs font-bold uppercase text-muted-foreground">Date</th>
                         <th className="px-8 py-4 text-xs font-bold uppercase text-muted-foreground">Status</th>
                         <th className="px-8 py-4 text-xs font-bold uppercase text-muted-foreground text-right">Revenue</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y">
                      {data?.revenueDetails?.length === 0 ? (
                        <tr>
                           <td colSpan={4} className="px-8 py-12 text-center text-muted-foreground">No revenue data available.</td>
                        </tr>
                      ) : (
                        data?.revenueDetails?.map((item: any) => (
                          <tr key={item.id} className="hover:bg-muted/20 transition-colors">
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
                        ))
                      )}
                   </tbody>
                </table>
             </div>
          </div>
        </>
      ) : (
        <div className="space-y-6">
           {data?.recentReviews?.length === 0 ? (
              <div className="bg-card border rounded-[2.5rem] p-12 text-center">
                 <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto opacity-20" />
                 <p className="mt-4 text-muted-foreground font-medium">No reviews found for this period.</p>
              </div>
           ) : (
              data?.recentReviews?.map((review: any) => (
                <div key={review.id} className="bg-card border rounded-[2.5rem] p-8 space-y-6 shadow-sm">
                   <div className="flex justify-between items-start">
                      <div className="flex items-center gap-4">
                         <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                            <Users className="h-6 w-6 text-primary" />
                         </div>
                         <div>
                            <p className="font-bold text-lg">{review.customer?.name}</p>
                            <p className="text-xs text-muted-foreground">{new Date(review.createdAt).toLocaleDateString()}</p>
                         </div>
                      </div>
                      <div className="flex gap-1">
                         {[1, 2, 3, 4, 5].map((star) => (
                            <Star 
                               key={star} 
                               className={`h-5 w-5 ${star <= review.rating ? "fill-orange-400 text-orange-400" : "text-muted-foreground/20"}`} 
                            />
                         ))}
                      </div>
                   </div>

                   <p className="p-6 bg-muted/30 rounded-2xl italic text-foreground/80">"{review.comment}"</p>

                   {review.ownerReply ? (
                     <div className="ml-8 p-4 bg-primary/5 border-l-4 border-primary rounded-r-xl">
                        <p className="text-xs font-bold text-primary uppercase mb-1">Your Reply</p>
                        <p className="text-sm">{review.ownerReply}</p>
                     </div>
                   ) : (
                     <ReplySection reviewId={review.id} onReply={handleReply} />
                   )}
                </div>
              ))
           )}
        </div>
      )}

      <div className="grid sm:grid-cols-3 gap-6">
         <div className="p-8 bg-primary/5 border border-primary/10 rounded-[2rem] space-y-2">
            <p className="text-xs font-bold text-primary uppercase tracking-widest">Avg. Order Value</p>
            <h3 className="text-3xl font-extrabold">{data?.detailedStats?.avgOrderValue || "$0.00"}</h3>
            <p className="text-xs text-green-600 font-bold">Per order average</p>
         </div>
         <div className="p-8 bg-blue-50 border border-blue-100 rounded-[2rem] space-y-2">
            <p className="text-xs font-bold text-blue-600 uppercase tracking-widest">Customer Growth</p>
            <h3 className="text-3xl font-extrabold">{data?.detailedStats?.newCustomers || "0"}</h3>
            <p className="text-xs text-blue-600 font-bold">Unique customers in period</p>
         </div>
         <div className="p-8 bg-purple-50 border border-purple-100 rounded-[2rem] space-y-2">
            <p className="text-xs font-bold text-purple-600 uppercase tracking-widest">Order Success Rate</p>
            <h3 className="text-3xl font-extrabold">{data?.detailedStats?.successRate || "100%"}</h3>
            <p className={`text-xs font-bold ${parseFloat(data?.detailedStats?.successRate || "100") > 95 ? "text-green-600" : "text-orange-600"}`}>
               {parseFloat(data?.detailedStats?.successRate || "100") > 95 ? "Excellent performance" : "Needs attention"}
            </p>
         </div>
      </div>
    </div>
  );
}

function ReplySection({ reviewId, onReply }: { reviewId: string, onReply: any }) {
  const [show, setShow] = useState(false);
  const [text, setText] = useState("");

  if (!show) return (
    <button onClick={() => setShow(true)} className="text-sm font-bold text-primary hover:underline flex items-center gap-2">
       <MessageSquare className="h-4 w-4" /> Reply to customer
    </button>
  );

  return (
    <div className="space-y-3">
       <textarea 
          className="w-full p-4 rounded-xl border bg-background text-sm outline-none focus:ring-2 focus:ring-primary/20"
          placeholder="Type your response..."
          rows={3}
          value={text}
          onChange={(e) => setText(e.target.value)}
       />
       <div className="flex justify-end gap-2">
          <button onClick={() => setShow(false)} className="px-4 py-2 text-sm font-bold text-muted-foreground">Cancel</button>
          <button 
             onClick={() => { onReply(reviewId, text); setShow(false); }}
             className="px-6 py-2 bg-primary text-primary-foreground text-sm font-bold rounded-xl shadow-lg"
          >
             Send Reply
          </button>
       </div>
    </div>
  );
}
