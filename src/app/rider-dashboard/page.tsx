"use client";

import { useState, useEffect } from "react";
import { 
  Bike, 
  Package, 
  MapPin, 
  CheckCircle2, 
  Clock, 
  DollarSign, 
  ChevronRight,
  Truck,
  Navigation,
  AlertCircle
} from "lucide-react";
import toast from "react-hot-toast";

export default function RiderDashboard() {
  const [availableOrders, setAvailableOrders] = useState<any[]>([]);
  const [myTasks, setMyTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("available"); // available, active, completed

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const fetchOrders = async () => {
    try {
      const [availRes, tasksRes] = await Promise.all([
        fetch("/api/rider/orders/available"),
        fetch("/api/rider/orders/my-tasks")
      ]);
      
      if (availRes.ok) setAvailableOrders(await availRes.json());
      if (tasksRes.ok) setMyTasks(await tasksRes.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptOrder = async (orderId: string) => {
    try {
      const res = await fetch("/api/rider/orders/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId }),
      });

      if (res.ok) {
        toast.success("Order claimed! Go to active tasks.");
        fetchOrders();
        setActiveTab("active");
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to claim order");
      }
    } catch (err) {
      toast.error("An error occurred");
    }
  };

  const handleUpdateStatus = async (orderId: string, status: string) => {
    try {
      const res = await fetch("/api/rider/orders/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, status }),
      });

      if (res.ok) {
        toast.success(`Status updated to ${status}`);
        fetchOrders();
      } else {
        toast.error("Failed to update status");
      }
    } catch (err) {
      toast.error("An error occurred");
    }
  };

  const activeOrders = myTasks.filter(o => o.status !== "DELIVERED" && o.status !== "CANCELLED");
  const completedOrders = myTasks.filter(o => o.status === "DELIVERED");
  const totalEarnings = completedOrders.reduce((sum, o) => sum + (o.deliveryCharge || 0), 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <div className="bg-background border-b pt-12 pb-6 px-4">
        <div className="container mx-auto max-w-5xl">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-primary/10 rounded-3xl flex items-center justify-center">
                 <Bike className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-black tracking-tight">Rider Dashboard</h1>
                <p className="text-muted-foreground font-medium">Ready to deliver smiles today?</p>
              </div>
            </div>
            
            <div className="flex items-center gap-6 bg-card border p-4 rounded-3xl shadow-sm">
               <div className="text-right">
                  <p className="text-xs font-black text-muted-foreground uppercase tracking-widest">Total Earnings</p>
                  <p className="text-2xl font-black text-primary">${totalEarnings.toFixed(2)}</p>
               </div>
               <div className="w-px h-10 bg-border" />
               <div className="text-right">
                  <p className="text-xs font-black text-muted-foreground uppercase tracking-widest">Completed</p>
                  <p className="text-2xl font-black">{completedOrders.length}</p>
               </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex gap-2 mt-10 bg-muted/50 p-1.5 rounded-2xl w-fit">
            {[
              { id: "available", label: "Available", count: availableOrders.length, icon: Package },
              { id: "active", label: "My Tasks", count: activeOrders.length, icon: Navigation },
              { id: "completed", label: "History", count: completedOrders.length, icon: CheckCircle2 }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all ${
                  activeTab === tab.id 
                  ? "bg-background text-primary shadow-sm ring-1 ring-black/5" 
                  : "text-muted-foreground hover:bg-background/50"
                }`}
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
                {tab.count > 0 && (
                  <span className={`ml-1 px-2 py-0.5 rounded-full text-[10px] ${
                    activeTab === tab.id ? "bg-primary text-primary-foreground" : "bg-muted-foreground/20"
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="container mx-auto max-w-5xl px-4 py-8">
        {activeTab === "available" && (
          <div className="space-y-6">
            {availableOrders.length === 0 ? (
              <div className="bg-card border border-dashed rounded-[3rem] p-20 text-center space-y-4">
                 <Clock className="h-16 w-16 text-muted-foreground/20 mx-auto animate-pulse" />
                 <h3 className="text-xl font-bold">Waiting for new orders...</h3>
                 <p className="text-muted-foreground max-w-xs mx-auto text-sm">New orders will appear here as soon as restaurants accept them.</p>
              </div>
            ) : (
              <div className="grid gap-6">
                {availableOrders.map(order => (
                  <div key={order.id} className="bg-card border rounded-[2.5rem] p-8 hover:shadow-xl hover:shadow-primary/5 transition-all">
                     <div className="flex flex-col md:flex-row justify-between gap-8">
                        <div className="flex-1 space-y-6">
                           <div className="flex items-center gap-4">
                              <div className="w-12 h-12 bg-muted rounded-2xl flex items-center justify-center">
                                 <Truck className="h-6 w-6 text-muted-foreground" />
                              </div>
                              <div>
                                 <h4 className="font-black text-lg">{order.store?.name}</h4>
                                 <p className="text-sm text-muted-foreground font-medium">{order.items.length} Items • #{order.id.slice(-6).toUpperCase()}</p>
                              </div>
                           </div>

                           <div className="space-y-4">
                              <div className="flex items-start gap-3">
                                 <MapPin className="h-5 w-5 text-primary mt-0.5" />
                                 <div>
                                    <p className="text-xs font-black text-muted-foreground uppercase tracking-widest">Delivery To</p>
                                    <p className="font-bold text-sm">{order.deliveryAddress}</p>
                                    <p className="text-[10px] text-primary font-bold mt-0.5 flex items-center gap-1">
                                       <Navigation className="h-3 w-3" />
                                       {Math.floor(Math.random() * 5 + 1)}.{Math.floor(Math.random() * 9)} km away
                                    </p>
                                 </div>
                              </div>

                              <div className="bg-muted/50 p-4 rounded-2xl border border-dashed">
                                 <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-2">Order Items</p>
                                 <div className="space-y-1.5">
                                    {order.items.map((item: any) => (
                                       <div key={item.id} className="flex justify-between text-xs font-medium">
                                          <span>{item.quantity}x {item.product.name}</span>
                                       </div>
                                    ))}
                                 </div>
                              </div>

                              <div className="flex items-center gap-6">
                                 <div className="flex items-center gap-3">
                                    <DollarSign className="h-5 w-5 text-green-600" />
                                    <div>
                                       <p className="text-xs font-black text-muted-foreground uppercase tracking-widest">Your Pay</p>
                                       <p className="font-bold text-green-600">${(order.deliveryCharge || 5).toFixed(2)}</p>
                                    </div>
                                 </div>
                                 <div className="flex items-center gap-3">
                                    <Package className="h-5 w-5 text-muted-foreground" />
                                    <div>
                                       <p className="text-xs font-black text-muted-foreground uppercase tracking-widest">Bill Total</p>
                                       <p className="font-bold text-sm">${order.totalAmount.toFixed(2)}</p>
                                    </div>
                                 </div>
                              </div>
                           </div>
                        </div>

                        <div className="flex flex-col justify-center gap-3 w-full md:w-48">
                           <button 
                             onClick={() => handleAcceptOrder(order.id)}
                             className="w-full py-4 bg-primary text-primary-foreground rounded-2xl font-black text-sm hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-primary/20"
                           >
                              Accept Order
                           </button>
                           <button className="w-full py-4 bg-muted text-muted-foreground rounded-2xl font-bold text-sm hover:bg-muted/80 transition-all">
                              Decline
                           </button>
                        </div>
                     </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "active" && (
          <div className="space-y-6">
            {activeOrders.length === 0 ? (
              <div className="bg-card border border-dashed rounded-[3rem] p-20 text-center space-y-4">
                 <Navigation className="h-16 w-16 text-muted-foreground/20 mx-auto" />
                 <h3 className="text-xl font-bold">No active tasks</h3>
                 <p className="text-muted-foreground max-w-xs mx-auto text-sm">Accept an order from the "Available" tab to start delivery.</p>
              </div>
            ) : (
              <div className="grid gap-8">
                {activeOrders.map(order => (
                  <div key={order.id} className="bg-card border-2 border-primary/20 rounded-[2.5rem] overflow-hidden shadow-xl shadow-primary/5">
                     <div className="bg-primary/5 p-8 border-b border-primary/10">
                        <div className="flex justify-between items-center">
                           <div className="flex items-center gap-3">
                              <div className="px-3 py-1 bg-primary text-primary-foreground rounded-full text-[10px] font-black uppercase tracking-widest">
                                 {order.status}
                              </div>
                              <span className="font-black text-muted-foreground">#{order.id.slice(-6).toUpperCase()}</span>
                           </div>
                           <p className="font-black text-primary text-xl">${(order.deliveryCharge || 5).toFixed(2)}</p>
                        </div>
                     </div>

                     <div className="p-8 space-y-8">
                        <div className="grid md:grid-cols-2 gap-8">
                           <div className="space-y-4">
                              <h5 className="text-xs font-black text-muted-foreground uppercase tracking-widest">Restaurant</h5>
                              <div className="flex items-center gap-4 p-4 bg-muted/30 rounded-3xl border border-dashed">
                                 <div className="w-12 h-12 bg-background rounded-xl border flex items-center justify-center">
                                    <Package className="h-6 w-6 text-primary" />
                                 </div>
                                 <div>
                                    <p className="font-black">{order.store?.name}</p>
                                    <p className="text-xs text-muted-foreground">Pick up here</p>
                                 </div>
                              </div>
                           </div>

                           <div className="space-y-4">
                              <h5 className="text-xs font-black text-muted-foreground uppercase tracking-widest">Customer</h5>
                              <div className="flex items-center gap-4 p-4 bg-muted/30 rounded-3xl border border-dashed">
                                 <div className="w-12 h-12 bg-background rounded-xl border flex items-center justify-center">
                                    <MapPin className="h-6 w-6 text-primary" />
                                 </div>
                                 <div>
                                    <p className="font-black">{order.customer?.name}</p>
                                    <p className="text-xs text-muted-foreground truncate max-w-[150px]">{order.deliveryAddress}</p>
                                 </div>
                              </div>
                           </div>
                        </div>

                        <div className="pt-8 border-t border-dashed">
                           <h5 className="text-xs font-black text-muted-foreground uppercase tracking-widest mb-6">Update Progress</h5>
                           <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                              {[
                                { status: "ACCEPTED", label: "Confirmed", icon: CheckCircle2 },
                                { status: "PREPARING", label: "Preparing", icon: Clock },
                                { status: "OUT_FOR_DELIVERY", label: "Pick Up", icon: Bike },
                                { status: "DELIVERED", label: "Delivered", icon: CheckCircle2 }
                              ].map((step) => (
                                <button
                                  key={step.status}
                                  onClick={() => handleUpdateStatus(order.id, step.status)}
                                  disabled={order.status === step.status}
                                  className={`flex flex-col items-center gap-3 p-4 rounded-[1.5rem] border-2 transition-all ${
                                    order.status === step.status 
                                    ? "bg-primary border-primary text-primary-foreground shadow-lg shadow-primary/20 scale-105" 
                                    : "bg-background border-border hover:border-primary/30 hover:bg-primary/5"
                                  }`}
                                >
                                   <step.icon className="h-6 w-6" />
                                   <span className="text-[10px] font-black uppercase tracking-tight">{step.label}</span>
                                </button>
                              ))}
                           </div>
                        </div>
                     </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "completed" && (
          <div className="space-y-6">
             {completedOrders.length === 0 ? (
               <div className="bg-card border border-dashed rounded-[3rem] p-20 text-center space-y-4">
                  <CheckCircle2 className="h-16 w-16 text-muted-foreground/20 mx-auto" />
                  <h3 className="text-xl font-bold">No completed deliveries</h3>
                  <p className="text-muted-foreground max-w-xs mx-auto text-sm">Your delivery history will appear here once you've completed some tasks.</p>
               </div>
             ) : (
               <div className="bg-card border rounded-[2.5rem] overflow-hidden shadow-sm">
                  <table className="w-full text-left">
                     <thead>
                        <tr className="bg-muted/50 border-b">
                           <th className="px-8 py-5 text-xs font-black text-muted-foreground uppercase tracking-widest">Order</th>
                           <th className="px-8 py-5 text-xs font-black text-muted-foreground uppercase tracking-widest">Store</th>
                           <th className="px-8 py-5 text-xs font-black text-muted-foreground uppercase tracking-widest">Earnings</th>
                           <th className="px-8 py-5 text-xs font-black text-muted-foreground uppercase tracking-widest">Date</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y">
                        {completedOrders.map(order => (
                          <tr key={order.id} className="hover:bg-muted/20 transition-colors">
                             <td className="px-8 py-6 font-bold text-sm">#{order.id.slice(-6).toUpperCase()}</td>
                             <td className="px-8 py-6 font-bold text-sm">{order.store?.name}</td>
                             <td className="px-8 py-6 font-black text-primary">${(order.deliveryCharge || 5).toFixed(2)}</td>
                             <td className="px-8 py-6 text-muted-foreground text-sm font-medium">{new Date(order.createdAt).toLocaleDateString()}</td>
                          </tr>
                        ))}
                     </tbody>
                  </table>
               </div>
             )}
          </div>
        )}
      </div>
    </div>
  );
}
