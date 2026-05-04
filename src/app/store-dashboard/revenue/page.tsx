"use client";

import { useState, useEffect } from "react";
import { DollarSign } from "lucide-react";

export default function RevenuePage() {
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

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Revenue Breakdown</h1>
          <p className="text-muted-foreground mt-1">Detailed view of your revenue by order.</p>
        </div>
        <div className="flex gap-4">
          <div className="flex gap-1 bg-muted p-1 rounded-xl">
             <button 
               onClick={() => setRange("daily")}
               className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                 range === "daily" ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground"
               }`}
             >
               Daily
             </button>
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
      </div>

      <div className="grid sm:grid-cols-4 gap-6">
         <div className="p-6 bg-card border rounded-[2rem] space-y-2">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Selected Period</p>
            <h3 className="text-2xl font-extrabold">
              ${data?.periodSummary?.[range]?.toFixed(2) || "0.00"}
            </h3>
         </div>
         <div className="p-6 bg-primary text-primary-foreground rounded-[2rem] space-y-4 flex flex-col justify-center sm:col-span-3">
            <p className="text-xs font-bold uppercase tracking-widest opacity-80">Download Report for {range.toUpperCase()}</p>
            <div className="flex gap-2">
               <button 
                 onClick={() => downloadReport('csv')}
                 className="flex-1 py-3 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-bold transition-colors"
               >
                 Export as CSV
               </button>
               <button 
                 onClick={() => downloadReport('xlsx')}
                 className="flex-1 py-3 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-bold transition-colors"
               >
                 Export as XLSX
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
                  {loading ? (
                    <tr>
                       <td colSpan={4} className="px-8 py-12 text-center text-muted-foreground">
                         <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                       </td>
                    </tr>
                  ) : data?.revenueDetails?.length === 0 ? (
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
