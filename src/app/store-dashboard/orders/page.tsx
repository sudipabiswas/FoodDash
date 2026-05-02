"use client";

import { useState, useEffect } from "react";
import { 
  ShoppingBag, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  ChevronRight, 
  User,
  Search,
  Filter
} from "lucide-react";

export default function StoreOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("ALL");

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const res = await fetch("/api/store/orders");
      const data = await res.json();
      if (res.ok) setOrders(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (orderId: string, status: string) => {
    try {
      const res = await fetch("/api/store/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, status }),
      });
      if (res.ok) fetchOrders();
    } catch (err) {
      console.error(err);
    }
  };

  const filteredOrders = filter === "ALL" 
    ? orders 
    : orders.filter((o: any) => o.status === filter);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Orders</h1>
          <p className="text-muted-foreground mt-1">Manage incoming and past restaurant orders.</p>
        </div>
        
        <div className="flex items-center gap-2 bg-muted p-1 rounded-xl">
           {["ALL", "PENDING", "ACCEPTED", "DELIVERED"].map((f) => (
             <button
               key={f}
               onClick={() => setFilter(f)}
               className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                 filter === f ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground"
               }`}
             >
               {f}
             </button>
           ))}
        </div>
      </div>

      <div className="bg-card border rounded-[2.5rem] overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-muted/30 border-b">
                <th className="px-8 py-6 text-xs font-bold uppercase tracking-widest text-muted-foreground">Order ID</th>
                <th className="px-8 py-6 text-xs font-bold uppercase tracking-widest text-muted-foreground">Customer</th>
                <th className="px-8 py-6 text-xs font-bold uppercase tracking-widest text-muted-foreground">Status</th>
                <th className="px-8 py-6 text-xs font-bold uppercase tracking-widest text-muted-foreground">Total</th>
                <th className="px-8 py-6 text-xs font-bold uppercase tracking-widest text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-8 py-12 text-center text-muted-foreground">
                    No orders found.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order: any) => (
                  <tr key={order.id} className="group hover:bg-muted/20 transition-colors">
                    <td className="px-8 py-6">
                       <span className="font-mono text-sm font-bold text-primary">#{order.id.slice(-6).toUpperCase()}</span>
                    </td>
                    <td className="px-8 py-6">
                       <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                             <User className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                             <p className="text-sm font-bold">{order.customer?.name}</p>
                             <p className="text-xs text-muted-foreground">{order.customer?.email}</p>
                          </div>
                       </div>
                    </td>
                    <td className="px-8 py-6">
                       <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                         order.status === "DELIVERED" ? "bg-green-100 text-green-700" :
                         order.status === "PENDING" ? "bg-orange-100 text-orange-700" :
                         "bg-blue-100 text-blue-700"
                       }`}>
                          {order.status}
                       </div>
                    </td>
                    <td className="px-8 py-6 font-extrabold">${order.totalPrice.toFixed(2)}</td>
                    <td className="px-8 py-6">
                       <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          {order.status === "PENDING" && (
                            <button 
                              onClick={() => updateStatus(order.id, "ACCEPTED")}
                              className="p-2 hover:bg-primary/10 text-primary rounded-lg transition-colors"
                              title="Accept Order"
                            >
                              <CheckCircle2 className="h-5 w-5" />
                            </button>
                          )}
                          {order.status === "ACCEPTED" && (
                            <button 
                              onClick={() => updateStatus(order.id, "DELIVERED")}
                              className="p-2 hover:bg-green-100 text-green-600 rounded-lg transition-colors"
                              title="Mark Delivered"
                            >
                              <CheckCircle2 className="h-5 w-5" />
                            </button>
                          )}
                          <button className="p-2 hover:bg-muted rounded-lg transition-colors">
                             <ChevronRight className="h-5 w-5" />
                          </button>
                       </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
