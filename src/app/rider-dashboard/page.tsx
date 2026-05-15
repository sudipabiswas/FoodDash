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
  AlertCircle,
  TrendingUp,
  Award,
  Wallet,
  ArrowRight
} from "lucide-react";
import toast from "react-hot-toast";

export default function RiderDashboard() {
  const [availableOrders, setAvailableOrders] = useState<any[]>([]);
  const [myTasks, setMyTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("available"); // available, active, completed
  const [isMounted, setIsMounted] = useState(false);
  const [distances, setDistances] = useState<Record<string, string>>({});

  useEffect(() => {
    setIsMounted(true);
    fetchOrders();
    const interval = setInterval(fetchOrders, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (availableOrders.length > 0) {
      const newDistances = { ...distances };
      availableOrders.forEach(order => {
        if (!newDistances[order.id]) {
          newDistances[order.id] = `${(Math.random() * 5 + 1).toFixed(1)} km`;
        }
      });
      setDistances(newDistances);
    }
  }, [availableOrders]);

  const fetchOrders = async () => {
    try {
      const [availRes, tasksRes] = await Promise.all([
        fetch("/api/rider/orders/available"),
        fetch("/api/rider/orders/my-tasks")
      ]);
      
      if (availRes.ok) {
        const data = await availRes.json();
        setAvailableOrders(Array.isArray(data) ? data : []);
      }
      if (tasksRes.ok) {
        const data = await tasksRes.json();
        setMyTasks(Array.isArray(data) ? data : []);
      }
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
        toast.success("Mission accepted! Let's go.");
        fetchOrders();
        setActiveTab("active");
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to claim mission");
      }
    } catch (err) {
      toast.error("Connectivity issue");
    }
  };

  const handleCancelAssignment = async (orderId: string) => {
    if (!confirm("Release this mission? It will be available for other riders.")) return;

    try {
      const res = await fetch("/api/rider/orders/cancel-assignment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId }),
      });

      if (res.ok) {
        toast.success("Mission released");
        fetchOrders();
      } else {
        toast.error("Failed to release");
      }
    } catch (err) {
      toast.error("Action failed");
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
        toast.success(`Status: ${status.replace(/_/g, ' ')}`);
        fetchOrders();
      } else {
        toast.error("Update failed");
      }
    } catch (err) {
      toast.error("Connectivity issue");
    }
  };

  const activeOrders = Array.isArray(myTasks) ? myTasks.filter(o => o.status !== "DELIVERED" && o.status !== "CANCELLED") : [];
  const completedOrders = Array.isArray(myTasks) ? myTasks.filter(o => o.status === "DELIVERED") : [];
  const totalEarnings = completedOrders.reduce((sum, o) => sum + (Number(o.deliveryCharge ?? o.store?.deliveryCharge) || 0), 0);

  if (!isMounted || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0f172a]">
        <div className="relative">
          <div className="h-24 w-24 rounded-full border-t-4 border-primary animate-spin"></div>
          <Bike className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-8 w-8 text-primary animate-bounce" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-200 selection:bg-primary/30">
      {/* Mesh Gradient Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-primary/20 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute top-[20%] -right-[5%] w-[30%] h-[30%] bg-blue-500/10 blur-[100px] rounded-full" />
        <div className="absolute -bottom-[10%] left-[20%] w-[50%] h-[50%] bg-indigo-500/10 blur-[150px] rounded-full" />
      </div>

      <div className="relative z-10">
        {/* Header Section */}
        <header className="pt-16 pb-8 px-6">
          <div className="container mx-auto max-w-6xl">
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-black uppercase tracking-[0.2em]">
                  <TrendingUp className="h-3 w-3" />
                  Rider Online
                </div>
                <h1 className="text-5xl font-black tracking-tighter text-white">
                  Fleet <span className="text-primary italic">Command</span>
                </h1>
                <p className="text-slate-400 font-medium text-lg">Fuel your day, deliver the joy.</p>
              </div>

              <div className="grid grid-cols-2 sm:flex items-center gap-4">
                <div className="flex flex-col items-end gap-1 px-6 py-4 bg-white/5 border border-white/10 rounded-[2rem] backdrop-blur-xl hover:bg-white/10 transition-colors">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                    <Wallet className="h-3 w-3" /> Total Earnings
                  </p>
                  <p className="text-3xl font-black text-white">${totalEarnings.toFixed(2)}</p>
                </div>
                <div className="flex flex-col items-end gap-1 px-6 py-4 bg-primary/10 border border-primary/20 rounded-[2rem] backdrop-blur-xl">
                  <p className="text-[10px] font-black text-primary/70 uppercase tracking-widest flex items-center gap-2">
                    <Award className="h-3 w-3" /> Level 1 Rider
                  </p>
                  <p className="text-3xl font-black text-primary">{completedOrders.length}</p>
                </div>
              </div>
            </div>

            {/* Tab Navigation */}
            <div className="flex flex-wrap gap-3 mt-12 p-2 bg-white/5 border border-white/10 rounded-[2.5rem] backdrop-blur-md w-fit">
              {[
                { id: "available", label: "Marketplace", count: availableOrders.length, icon: Package, color: "bg-primary" },
                { id: "active", label: "Current Missions", count: activeOrders.length, icon: Navigation, color: "bg-blue-500" },
                { id: "completed", label: "Archive", count: completedOrders.length, icon: CheckCircle2, color: "bg-green-500" }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative flex items-center gap-3 px-8 py-4 rounded-[2rem] font-black text-sm transition-all duration-300 ${
                    activeTab === tab.id 
                    ? "bg-white text-black shadow-[0_10px_40px_-10px_rgba(255,255,255,0.3)] scale-105" 
                    : "text-slate-400 hover:text-white hover:bg-white/5"
                  }`}
                >
                  <tab.icon className={`h-4 w-4 ${activeTab === tab.id ? "text-primary" : "text-slate-500"}`} />
                  {tab.label}
                  {tab.count > 0 && (
                    <span className={`flex items-center justify-center min-w-[22px] h-[22px] px-1.5 rounded-full text-[10px] font-black ${
                      activeTab === tab.id ? "bg-black text-white" : "bg-white/10 text-slate-400"
                    }`}>
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </header>

        {/* Content Section */}
        <main className="container mx-auto max-w-6xl px-6 pb-24">
          {activeTab === "available" && (
            <div className="grid gap-8">
              {availableOrders.length === 0 ? (
                <div className="bg-white/5 border border-white/10 border-dashed rounded-[3rem] p-32 text-center space-y-6 backdrop-blur-sm">
                   <div className="relative w-24 h-24 mx-auto">
                      <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full animate-pulse" />
                      <Clock className="relative h-24 w-24 text-primary/40 mx-auto" />
                   </div>
                   <div className="space-y-2">
                     <h3 className="text-3xl font-black text-white">Radio Silence</h3>
                     <p className="text-slate-400 max-w-md mx-auto font-medium">New missions will appear here as soon as they are beamed up from restaurants.</p>
                   </div>
                </div>
              ) : (
                <div className="grid lg:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  {availableOrders.map(order => (
                    <div key={order.id} className="group relative bg-white/5 border border-white/10 rounded-[3rem] p-10 hover:bg-white/10 hover:border-white/20 hover:shadow-[0_20px_80px_-20px_rgba(0,0,0,0.5)] transition-all duration-500 overflow-hidden">
                       <div className="absolute top-0 right-0 p-8">
                          <div className="bg-primary/20 text-primary px-4 py-2 rounded-2xl font-black text-xs uppercase tracking-widest border border-primary/20 group-hover:scale-110 transition-transform">
                             ${(Number(order.deliveryCharge ?? order.store?.deliveryCharge) || 0).toFixed(2)}
                          </div>
                       </div>

                       <div className="space-y-8">
                          <div className="flex items-center gap-5">
                             <div className="w-16 h-16 bg-white/10 rounded-[1.5rem] flex items-center justify-center group-hover:rotate-6 transition-transform">
                                <Truck className="h-8 w-8 text-primary" />
                             </div>
                             <div>
                                <h4 className="text-2xl font-black text-white tracking-tight">{order.store?.name}</h4>
                                <div className="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase tracking-widest">
                                   <Package className="h-3 w-3" />
                                   {order.items?.length || 0} Items • #{order.id.slice(-6).toUpperCase()}
                                </div>
                             </div>
                          </div>

                          <div className="space-y-6">
                             <div className="flex items-start gap-4 p-6 bg-black/40 rounded-[2rem] border border-white/5">
                                <MapPin className="h-6 w-6 text-primary mt-1" />
                                <div className="space-y-1">
                                   <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Target Location</p>
                                   <p className="font-bold text-white leading-relaxed">{order.deliveryAddress}</p>
                                   <p className="text-[10px] text-primary font-black flex items-center gap-1.5 uppercase tracking-wider mt-2">
                                      <Navigation className="h-3 w-3" />
                                      {distances[order.id] || "Calculating..."} away
                                   </p>
                                </div>
                             </div>

                             <div className="grid grid-cols-2 gap-4">
                                <div className="p-5 bg-white/5 rounded-[1.5rem] border border-white/5">
                                   <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Items</p>
                                   <p className="font-black text-white text-lg">
                                      {order.items?.slice(0, 1).map((i: any) => i.product?.name)}
                                      {order.items?.length > 1 && <span className="text-slate-500 text-sm"> +{order.items.length - 1} more</span>}
                                   </p>
                                </div>
                                <div className="p-5 bg-white/5 rounded-[1.5rem] border border-white/5">
                                   <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Bill</p>
                                   <p className="font-black text-white text-lg">${(Number(order.totalPrice) || 0).toFixed(2)}</p>
                                </div>
                             </div>
                          </div>

                          <div className="flex items-center gap-3 pt-4">
                             <button 
                               onClick={() => handleAcceptOrder(order.id)}
                               className="flex-1 py-5 bg-white text-black rounded-[1.5rem] font-black text-sm hover:scale-[1.02] active:scale-[0.98] transition-all shadow-[0_15px_40px_-10px_rgba(255,255,255,0.4)]"
                             >
                                Initiate Mission
                             </button>
                             <button className="w-16 h-16 bg-white/5 text-slate-400 rounded-[1.5rem] flex items-center justify-center hover:bg-white/10 hover:text-white transition-all group/btn">
                                <ArrowRight className="h-6 w-6 group-hover:translate-x-1 transition-transform" />
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
            <div className="space-y-8">
              {activeOrders.length === 0 ? (
                <div className="bg-white/5 border border-white/10 border-dashed rounded-[3rem] p-32 text-center space-y-6 backdrop-blur-sm">
                   <Navigation className="h-24 w-24 text-slate-700 mx-auto" />
                   <div className="space-y-2">
                     <h3 className="text-3xl font-black text-white">No Active Missions</h3>
                     <p className="text-slate-400 max-w-md mx-auto font-medium">Your tactical display is clear. Head to the Marketplace to pick up a new contract.</p>
                   </div>
                </div>
              ) : (
                <div className="grid gap-12 animate-in fade-in slide-in-from-bottom-8 duration-700">
                  {activeOrders.map(order => (
                    <div key={order.id} className="group relative bg-[#1e293b] border border-primary/30 rounded-[4rem] overflow-hidden shadow-2xl shadow-primary/5">
                       <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-transparent via-primary to-transparent opacity-50" />
                       
                       <div className="p-12 space-y-12">
                          <div className="flex flex-col lg:flex-row justify-between gap-8 lg:items-center">
                             <div className="flex items-center gap-6">
                                <div className="w-20 h-20 bg-primary/20 rounded-[2rem] flex items-center justify-center border border-primary/20 shadow-[0_0_40px_rgba(249,115,22,0.1)]">
                                   <Bike className="h-10 w-10 text-primary animate-pulse" />
                                </div>
                                <div className="space-y-1">
                                   <div className="flex items-center gap-3">
                                      <span className="px-4 py-1.5 bg-primary text-black rounded-full text-[10px] font-black uppercase tracking-[0.2em] shadow-lg shadow-primary/20">
                                         {order.status.replace(/_/g, ' ')}
                                      </span>
                                      <span className="font-black text-slate-500 tracking-wider">#{order.id.slice(-6).toUpperCase()}</span>
                                   </div>
                                   <h4 className="text-3xl font-black text-white">{order.store?.name}</h4>
                                </div>
                             </div>

                             <div className="flex items-center gap-6">
                                <div className="text-right">
                                   <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Contract Value</p>
                                   <p className="text-4xl font-black text-white">${(Number(order.deliveryCharge ?? order.store?.deliveryCharge) || 0).toFixed(2)}</p>
                                </div>
                                {order.status === "ACCEPTED" && (
                                  <button 
                                    onClick={() => handleCancelAssignment(order.id)}
                                    className="px-8 py-4 bg-red-500/10 text-red-500 border border-red-500/20 rounded-[1.5rem] font-black text-xs uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all shadow-lg shadow-red-500/5"
                                  >
                                    Release
                                  </button>
                                )}
                             </div>
                          </div>

                          <div className="grid md:grid-cols-2 gap-8">
                             <div className="group/loc relative p-8 bg-slate-900/50 rounded-[2.5rem] border border-white/5 hover:border-primary/20 transition-all">
                                <div className="absolute top-8 right-8 w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                                   <Package className="h-6 w-6 text-primary" />
                                </div>
                                <div className="space-y-4">
                                   <h5 className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">Pickup Point</h5>
                                   <div className="space-y-2">
                                      <p className="text-2xl font-black text-white">{order.store?.name}</p>
                                      <p className="text-slate-400 font-medium leading-relaxed">{order.store?.address || "Ready for pickup at restaurant"}</p>
                                   </div>
                                </div>
                             </div>

                             <div className="group/loc relative p-8 bg-slate-900/50 rounded-[2.5rem] border border-white/5 hover:border-primary/20 transition-all">
                                <div className="absolute top-8 right-8 w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                                   <MapPin className="h-6 w-6 text-primary" />
                                </div>
                                <div className="space-y-4">
                                   <h5 className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">Drop Zone</h5>
                                   <div className="space-y-2">
                                      <p className="text-2xl font-black text-white">{order.customer?.name}</p>
                                      <p className="text-slate-400 font-medium leading-relaxed">{order.deliveryAddress}</p>
                                   </div>
                                </div>
                             </div>
                          </div>

                          <div className="space-y-8">
                             <div className="flex items-center gap-4">
                                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                                <h5 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Operational Phase</h5>
                                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                             </div>
                             
                             <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                {[
                                  { status: "ACCEPTED", label: "Confirmed", icon: CheckCircle2 },
                                  { status: "PREPARING", label: "In Kitchen", icon: Clock },
                                  { status: "OUT_FOR_DELIVERY", label: "On Road", icon: Bike },
                                  { status: "DELIVERED", label: "Complete", icon: Award }
                                ].map((step) => {
                                  const isActive = order.status === step.status;
                                  return (
                                    <button
                                      key={step.status}
                                      onClick={() => handleUpdateStatus(order.id, step.status)}
                                      disabled={isActive}
                                      className={`group/step relative flex flex-col items-center gap-4 p-8 rounded-[2.5rem] border-2 transition-all duration-500 ${
                                        isActive 
                                        ? "bg-white border-white text-black shadow-[0_20px_50px_-10px_rgba(255,255,255,0.4)] scale-105 z-10" 
                                        : "bg-slate-900/40 border-white/5 text-slate-500 hover:border-white/20 hover:bg-slate-800"
                                      }`}
                                    >
                                       <div className={`p-4 rounded-2xl transition-colors ${isActive ? "bg-black/5" : "bg-white/5 group-hover/step:bg-white/10"}`}>
                                          <step.icon className={`h-8 w-8 ${isActive ? "text-primary" : "text-slate-600"}`} />
                                       </div>
                                       <span className="text-[10px] font-black uppercase tracking-widest">{step.label}</span>
                                    </button>
                                  );
                                })}
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
            <div className="animate-in fade-in duration-500">
               {completedOrders.length === 0 ? (
                 <div className="bg-white/5 border border-white/10 border-dashed rounded-[3rem] p-32 text-center space-y-6 backdrop-blur-sm">
                    <Award className="h-24 w-24 text-slate-800 mx-auto" />
                    <h3 className="text-3xl font-black text-white">Honor Roll Empty</h3>
                    <p className="text-slate-400 max-w-md mx-auto font-medium">Your historical records are waiting for their first entry. Start delivering to build your legacy.</p>
                 </div>
               ) : (
                 <div className="bg-white/5 border border-white/10 rounded-[3rem] overflow-hidden backdrop-blur-md">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left">
                         <thead>
                            <tr className="bg-white/5 border-b border-white/10">
                               <th className="px-10 py-8 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Mission ID</th>
                               <th className="px-10 py-8 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Origin</th>
                               <th className="px-10 py-8 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Revenue</th>
                               <th className="px-10 py-8 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Timestamp</th>
                            </tr>
                         </thead>
                         <tbody className="divide-y divide-white/5">
                            {completedOrders.map(order => (
                              <tr key={order.id} className="hover:bg-white/10 transition-all group">
                                 <td className="px-10 py-8 font-black text-white tracking-widest text-sm uppercase">#{order.id.slice(-6)}</td>
                                 <td className="px-10 py-8">
                                    <div className="flex items-center gap-3">
                                       <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                                          <Package className="h-4 w-4 text-primary" />
                                       </div>
                                       <span className="font-bold text-slate-300">{order.store?.name}</span>
                                    </div>
                                 </td>
                                 <td className="px-10 py-8 font-black text-primary text-lg">${(Number(order.deliveryCharge ?? order.store?.deliveryCharge) || 0).toFixed(2)}</td>
                                 <td className="px-10 py-8 text-slate-500 text-sm font-black uppercase tracking-wider">{new Date(order.createdAt).toLocaleDateString()}</td>
                              </tr>
                            ))}
                         </tbody>
                      </table>
                    </div>
                 </div>
               )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
