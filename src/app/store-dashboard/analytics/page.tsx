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
import { TrendingUp, Users, ShoppingCart, DollarSign, Calendar } from "lucide-react";

export default function AnalyticsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
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

  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8"];

  const categoryData = [
    { name: "Burgers", value: 400 },
    { name: "Beverages", value: 300 },
    { name: "Desserts", value: 200 },
    { name: "Sides", value: 278 },
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Business Analytics</h1>
          <p className="text-muted-foreground mt-1">Deep dive into your restaurant's performance data.</p>
        </div>
        <div className="flex gap-2 bg-muted p-1 rounded-xl">
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
      </div>

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
