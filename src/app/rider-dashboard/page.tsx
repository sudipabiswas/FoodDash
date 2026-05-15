"use client";

import { useState, useEffect, useRef } from "react";
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
  ArrowRight,
  Bell,
  Star,
  Power,
  Phone,
  MoreVertical,
  Map as MapIcon,
  ShieldCheck,
  Zap,
  Target
} from "lucide-react";
import toast from "react-hot-toast";
import { useSession } from "next-auth/react";

export default function RiderDashboard() {
  const { data: session } = useSession();
  const [availableOrders, setAvailableOrders] = useState<any[]>([]);
  const [myTasks, setMyTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("home"); // home, earnings, performance
  const [isOnline, setIsOnline] = useState(true);
  const [isBusy, setIsBusy] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [distances, setDistances] = useState<Record<string, { pickup: string, drop: string, time: string }>>({});
  const [timers, setTimers] = useState<Record<string, number>>({});

  useEffect(() => {
    setIsMounted(true);
    fetchOrders();
    const interval = setInterval(fetchOrders, 10000); // Faster refresh for "Gig" feel
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (availableOrders.length > 0) {
      const newDistances = { ...distances };
      const newTimers = { ...timers };
      availableOrders.forEach(order => {
        if (!newDistances[order.id]) {
          newDistances[order.id] = {
            pickup: `${(Math.random() * 2 + 0.5).toFixed(1)} km`,
            drop: `${(Math.random() * 5 + 1).toFixed(1)} km`,
            time: `${Math.floor(Math.random() * 15 + 15)} min`
          };
          newTimers[order.id] = 15; // 15 second timer
        }
      });
      setDistances(newDistances);
      setTimers(newTimers);
    }
  }, [availableOrders]);

  // Handle timers
  useEffect(() => {
    const timerId = setInterval(() => {
      setTimers(prev => {
        const next = { ...prev };
        Object.keys(next).forEach(id => {
          if (next[id] > 0) next[id] -= 1;
        });
        return next;
      });
    }, 1000);
    return () => clearInterval(timerId);
  }, []);

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
        toast.success("Order accepted! Head to restaurant.");
        fetchOrders();
      } else {
        const data = await res.json();
        toast.error(data.error || "Missed it!");
      }
    } catch (err) {
      toast.error("Connectivity issue");
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
        toast.success(`Status updated: ${status.replace(/_/g, ' ')}`);
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
  const todayEarnings = completedOrders.filter(o => new Date(o.createdAt).toDateString() === new Date().toDateString())
                                      .reduce((sum, o) => sum + (Number(o.deliveryCharge ?? o.store?.deliveryCharge) || 0), 0);
  const weekEarnings = completedOrders.reduce((sum, o) => sum + (Number(o.deliveryCharge ?? o.store?.deliveryCharge) || 0), 0);

  if (!isMounted || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="animate-bounce">
          <Bike className="h-12 w-12 text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      {/* 1. Top Bar (Status + Identity) */}
      <div className="sticky top-0 z-50 bg-white border-b shadow-sm px-6 py-4">
        <div className="container mx-auto max-w-lg flex items-center justify-between">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center border shadow-inner">
                <Bike className="h-5 w-5 text-primary" />
             </div>
             <div>
                <h3 className="font-black text-sm text-slate-900 flex items-center gap-1">
                   {session?.user?.name || "Rider"} <span className="text-yellow-500 flex items-center text-[10px]"><Star className="h-3 w-3 fill-current" /> 4.7</span>
                </h3>
                <div className="flex items-center gap-2">
                   <button 
                     onClick={() => setIsOnline(!isOnline)}
                     className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider transition-all ${
                       isOnline ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                     }`}
                   >
                      <div className={`w-1.5 h-1.5 rounded-full ${isOnline ? "bg-green-500 animate-pulse" : "bg-red-500"}`} />
                      {isOnline ? "Online" : "Offline"}
                   </button>
                   <button 
                     onClick={() => setIsBusy(!isBusy)}
                     className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider transition-all ${
                       isBusy ? "bg-orange-100 text-orange-700 border-orange-200" : "bg-slate-100 text-slate-500 border-transparent"
                     } border`}
                   >
                      Busy Mode
                   </button>
                </div>
             </div>
          </div>
          <div className="flex items-center gap-3">
             <button className="relative w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center hover:bg-slate-100 transition-all">
                <Bell className="h-5 w-5 text-slate-600" />
                {availableOrders.length > 0 && isOnline && (
                   <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
                )}
             </button>
             <button onClick={() => setActiveTab("earnings")} className="flex items-center gap-2 bg-primary/10 px-4 py-2 rounded-2xl border border-primary/20 hover:bg-primary/20 transition-all">
                <Wallet className="h-4 w-4 text-primary" />
                <span className="font-black text-primary text-sm">${todayEarnings.toFixed(0)}</span>
             </button>
          </div>
        </div>
      </div>

      <div className="container mx-auto max-w-lg p-6 space-y-6">
        
        {/* 6. Map Mini View (Optional but powerful) */}
        {isOnline && activeOrders.length === 0 && (
          <div className="relative h-32 w-full bg-slate-200 rounded-[2rem] overflow-hidden border shadow-inner">
             <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?auto=format&fit=crop&q=80&w=1000')] bg-cover opacity-50 contrast-125 saturate-0" />
             <div className="absolute inset-0 bg-primary/5" />
             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                <div className="relative">
                   <div className="absolute -inset-4 bg-primary/20 blur-xl rounded-full animate-ping" />
                   <div className="relative w-8 h-8 bg-primary rounded-full border-4 border-white shadow-xl flex items-center justify-center">
                      <Bike className="h-4 w-4 text-white" />
                   </div>
                </div>
             </div>
             <div className="absolute bottom-3 left-6 flex items-center gap-2">
                <div className="px-3 py-1 bg-white/90 backdrop-blur rounded-full text-[10px] font-black text-slate-800 shadow-sm flex items-center gap-1.5">
                   <Target className="h-3 w-3 text-primary" /> Dhaka City Zone
                </div>
             </div>
          </div>
        )}

        {/* 2. Main Screen = Order Feed (Core Section) */}
        {!isOnline ? (
          <div className="bg-white border rounded-[3rem] p-12 text-center space-y-4 shadow-xl shadow-slate-200/50 animate-in fade-in zoom-in-95 duration-500">
             <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-100">
                <Power className="h-10 w-10 text-red-500" />
             </div>
             <h2 className="text-2xl font-black text-slate-900">You're Offline</h2>
             <p className="text-slate-500 font-medium">Go Online to receive new order requests in your area.</p>
             <button 
               onClick={() => setIsOnline(true)}
               className="w-full py-5 bg-primary text-primary-foreground rounded-[2rem] font-black text-lg shadow-xl shadow-primary/30 hover:scale-[1.02] active:scale-[0.98] transition-all"
             >
                Go Online
             </button>
          </div>
        ) : activeOrders.length > 0 ? (
          /* 3. Active Delivery Section */
          <div className="space-y-6">
             {activeOrders.map(order => (
               <div key={order.id} className="bg-white border-2 border-primary/20 rounded-[3rem] overflow-hidden shadow-2xl shadow-primary/5 animate-in slide-in-from-right duration-500">
                  <div className="bg-primary p-8 text-white">
                     <div className="flex justify-between items-center mb-6">
                        <div className="flex items-center gap-3">
                           <div className="px-3 py-1 bg-white/20 rounded-full text-[10px] font-black uppercase tracking-widest">
                              Mission Active
                           </div>
                           <span className="font-black text-white/70">#{order.id.slice(-6).toUpperCase()}</span>
                        </div>
                        <div className="font-black text-2xl">${(Number(order.deliveryCharge ?? order.store?.deliveryCharge) || 0).toFixed(2)}</div>
                     </div>

                     {/* Step Tracker */}
                     <div className="flex items-center justify-between px-2 mb-2">
                        {[
                          { status: "ACCEPTED", icon: StoreIcon },
                          { status: "PREPARING", icon: Clock },
                          { status: "OUT_FOR_DELIVERY", icon: Bike },
                          { status: "DELIVERED", icon: CheckCircle2 }
                        ].map((step, idx, arr) => {
                          const steps = ["ACCEPTED", "PREPARING", "OUT_FOR_DELIVERY", "DELIVERED"];
                          const currentIdx = steps.indexOf(order.status);
                          const isActive = currentIdx >= idx;
                          return (
                            <div key={step.status} className="flex items-center flex-1 last:flex-none">
                               <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                                 isActive ? "bg-white text-primary" : "bg-white/20 text-white/50"
                               }`}>
                                  {isActive ? <CheckCircle2 className="h-4 w-4" /> : <div className="w-1.5 h-1.5 rounded-full bg-current" />}
                               </div>
                               {idx < arr.length - 1 && (
                                 <div className={`h-1 flex-1 mx-2 rounded-full ${currentIdx > idx ? "bg-white" : "bg-white/20"}`} />
                               )}
                            </div>
                          );
                        })}
                     </div>
                     <div className="flex justify-between px-2 text-[8px] font-black uppercase tracking-widest text-white/60">
                        <span>Confirm</span>
                        <span>Prepare</span>
                        <span>Pickup</span>
                        <span>Deliver</span>
                     </div>
                  </div>

                  <div className="p-8 space-y-8">
                     <div className="space-y-6">
                        <div className="flex items-start gap-4">
                           <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-500">
                              <Package className="h-5 w-5" />
                           </div>
                           <div className="flex-1">
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Pickup From</p>
                              <h4 className="font-black text-lg leading-tight">{order.store?.name}</h4>
                              <div className="flex gap-2 mt-3">
                                 <button className="flex-1 py-3 bg-slate-100 text-slate-900 rounded-xl font-bold text-xs flex items-center justify-center gap-2">
                                    <Phone className="h-3 w-3" /> Call Shop
                                 </button>
                                 <button className="flex-1 py-3 bg-slate-100 text-slate-900 rounded-xl font-bold text-xs flex items-center justify-center gap-2">
                                    <Navigation className="h-3 w-3" /> Navigate
                                 </button>
                              </div>
                           </div>
                        </div>

                        <div className="flex items-start gap-4">
                           <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-500">
                              <MapPin className="h-5 w-5" />
                           </div>
                           <div className="flex-1">
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Deliver To</p>
                              <h4 className="font-black text-lg leading-tight">{order.customer?.name}</h4>
                              <p className="text-xs font-medium text-slate-500 mt-1">{order.deliveryAddress}</p>
                              <div className="flex gap-2 mt-3">
                                 <button className="flex-1 py-3 bg-slate-100 text-slate-900 rounded-xl font-bold text-xs flex items-center justify-center gap-2">
                                    <Phone className="h-3 w-3" /> Call Customer
                                 </button>
                                 <button className="flex-1 py-3 bg-slate-100 text-slate-900 rounded-xl font-bold text-xs flex items-center justify-center gap-2">
                                    <Navigation className="h-3 w-3" /> Navigate
                                 </button>
                              </div>
                           </div>
                        </div>
                     </div>

                     <div className="pt-8 border-t border-dashed">
                        {order.status === "ACCEPTED" && (
                           <button 
                             onClick={() => handleUpdateStatus(order.id, "PREPARING")}
                             className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:scale-[1.02] transition-all"
                           >
                             Confirming Arrival
                           </button>
                        )}
                        {order.status === "PREPARING" && (
                           <button 
                             onClick={() => handleUpdateStatus(order.id, "OUT_FOR_DELIVERY")}
                             className="w-full py-5 bg-primary text-primary-foreground rounded-2xl font-black text-sm uppercase tracking-widest hover:scale-[1.02] transition-all shadow-xl shadow-primary/20"
                           >
                             Mark as Picked Up
                           </button>
                        )}
                        {order.status === "OUT_FOR_DELIVERY" && (
                           <button 
                             onClick={() => handleUpdateStatus(order.id, "DELIVERED")}
                             className="w-full py-5 bg-green-500 text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:scale-[1.02] transition-all shadow-xl shadow-green-500/20"
                           >
                             Confirm Delivery
                           </button>
                        )}
                        {order.status === "ACCEPTED" && (
                           <button 
                             onClick={() => handleCancelAssignment(order.id)}
                             className="w-full mt-4 py-3 text-red-500 font-black text-[10px] uppercase tracking-widest"
                           >
                             Release Order
                           </button>
                        )}
                     </div>
                  </div>
               </div>
             ))}
          </div>
        ) : (
          /* Incoming Order Feed */
          <div className="space-y-6">
             <div className="flex items-center justify-between px-2">
                <h2 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Live Order Feed</h2>
                <div className="flex items-center gap-1">
                   <div className="w-1 h-1 bg-primary rounded-full animate-ping" />
                   <span className="text-[9px] font-black text-primary uppercase">Searching...</span>
                </div>
             </div>

             {availableOrders.length === 0 ? (
               <div className="bg-white border border-dashed rounded-[3rem] p-16 text-center space-y-4">
                  <div className="relative w-16 h-16 mx-auto">
                     <div className="absolute inset-0 bg-primary/10 rounded-full animate-ping" />
                     <Clock className="relative h-16 w-16 text-primary/20 mx-auto" />
                  </div>
                  <h3 className="text-xl font-black text-slate-900 tracking-tight">Looking for orders...</h3>
                  <p className="text-slate-500 text-sm font-medium">Keep the app open and stay in the zone to receive the next job offer.</p>
               </div>
             ) : (
               <div className="space-y-4">
                  {availableOrders.map(order => {
                    const timer = timers[order.id] || 0;
                    if (timer <= 0) return null;

                    return (
                      <div key={order.id} className="relative bg-white border border-slate-200 rounded-[2.5rem] p-6 shadow-lg shadow-slate-200/50 hover:border-primary/30 transition-all animate-in slide-in-from-right duration-500">
                         {/* Expiry Timer Bar */}
                         <div className="absolute top-0 left-8 right-8 h-1 bg-slate-100 rounded-full overflow-hidden">
                            <div 
                              className={`h-full transition-all duration-1000 ${timer < 5 ? "bg-red-500" : "bg-primary"}`}
                              style={{ width: `${(timer / 15) * 100}%` }}
                            />
                         </div>

                         <div className="flex justify-between items-start pt-2">
                            <div className="flex items-center gap-3">
                               <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center border">
                                  <Truck className="h-6 w-6 text-slate-400" />
                               </div>
                               <div>
                                  <h4 className="font-black text-lg leading-tight text-slate-900">{order.store?.name}</h4>
                                  <div className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                     {order.items?.length || 0} Items • <span className="text-primary">{timer}s left</span>
                                  </div>
                               </div>
                            </div>
                            <div className="text-right">
                               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Earn</p>
                               <p className="text-2xl font-black text-green-600">${(Number(order.deliveryCharge ?? order.store?.deliveryCharge) || 0).toFixed(2)}</p>
                            </div>
                         </div>

                         <div className="grid grid-cols-3 gap-3 my-6">
                            <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                               <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Pickup</p>
                               <p className="font-black text-xs text-slate-900">{distances[order.id]?.pickup || "1.2 km"}</p>
                            </div>
                            <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                               <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Drop</p>
                               <p className="font-black text-xs text-slate-900">{distances[order.id]?.drop || "3.5 km"}</p>
                            </div>
                            <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                               <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Est. Time</p>
                               <p className="font-black text-xs text-slate-900">{distances[order.id]?.time || "25 min"}</p>
                            </div>
                         </div>

                         <div className="flex items-center gap-3">
                            <button 
                              onClick={() => handleAcceptOrder(order.id)}
                              className="flex-[2] py-4 bg-primary text-primary-foreground rounded-2xl font-black text-sm uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-primary/20"
                            >
                               Accept
                            </button>
                            <button className="flex-1 py-4 bg-slate-100 text-slate-400 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-slate-200 hover:text-slate-600 transition-all">
                               Decline
                            </button>
                         </div>
                      </div>
                    );
                  })}
               </div>
             )}
          </div>
        )}

        {/* 4. Earnings Snapshot (Mini Dashboard) */}
        <div className="bg-slate-900 text-white rounded-[3rem] p-10 space-y-8 shadow-2xl shadow-slate-900/30 overflow-hidden relative">
           <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 blur-[60px] rounded-full -mr-16 -mt-16" />
           <div className="flex justify-between items-start relative z-10">
              <div>
                 <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em] mb-2">Today's Earnings</p>
                 <h3 className="text-5xl font-black text-white tracking-tighter">${todayEarnings.toFixed(2)}</h3>
              </div>
              <div className="bg-white/10 p-3 rounded-2xl">
                 <Wallet className="h-6 w-6 text-primary" />
              </div>
           </div>

           <div className="grid grid-cols-2 gap-6 relative z-10">
              <div className="space-y-1">
                 <p className="text-[9px] font-black text-white/30 uppercase tracking-widest">This Week</p>
                 <p className="text-xl font-black text-white/90">${weekEarnings.toFixed(2)}</p>
              </div>
              <div className="space-y-1 text-right">
                 <p className="text-[9px] font-black text-white/30 uppercase tracking-widest">Completed</p>
                 <p className="text-xl font-black text-white/90">{completedOrders.length}</p>
              </div>
              <div className="space-y-1">
                 <p className="text-[9px] font-black text-white/30 uppercase tracking-widest">Pending Payout</p>
                 <p className="text-xl font-black text-primary">$50.00</p>
              </div>
              <div className="flex items-end justify-end">
                 <button className="px-4 py-2 bg-primary text-primary-foreground rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-105 transition-all">
                    Withdraw
                 </button>
              </div>
           </div>
        </div>

        {/* 8. Performance Highlights */}
        <div className="grid grid-cols-2 gap-4">
           <div className="bg-white border rounded-[2rem] p-6 space-y-4">
              <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-500">
                 <Zap className="h-5 w-5" />
              </div>
              <div>
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">On-Time %</p>
                 <p className="text-2xl font-black text-slate-900">98.2%</p>
              </div>
           </div>
           <div className="bg-white border rounded-[2rem] p-6 space-y-4">
              <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center text-green-500">
                 <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Safety Score</p>
                 <p className="text-2xl font-black text-slate-900">4.9</p>
              </div>
           </div>
        </div>

      </div>

      {/* Bottom Nav Mock */}
      <div className="fixed bottom-0 inset-x-0 bg-white border-t px-8 py-4 z-50">
         <div className="container mx-auto max-w-lg flex items-center justify-between">
            <button className="flex flex-col items-center gap-1 text-primary">
               <Bike className="h-6 w-6" />
               <span className="text-[8px] font-black uppercase tracking-widest">Home</span>
            </button>
            <button className="flex flex-col items-center gap-1 text-slate-400">
               <TrendingUp className="h-6 w-6" />
               <span className="text-[8px] font-black uppercase tracking-widest">Growth</span>
            </button>
            <button className="flex flex-col items-center gap-1 text-slate-400">
               <Award className="h-6 w-6" />
               <span className="text-[8px] font-black uppercase tracking-widest">Badge</span>
            </button>
            <button className="flex flex-col items-center gap-1 text-slate-400">
               <MoreVertical className="h-6 w-6" />
               <span className="text-[8px] font-black uppercase tracking-widest">More</span>
            </button>
         </div>
      </div>
    </div>
  );
}

// Internal Helper
function StoreIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7" />
      <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
      <path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4" />
      <path d="M2 7h20" />
      <path d="M22 7v3a2 2 0 0 1-2 2v0a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 16 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 12 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 8 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 4 12v0a2 2 0 0 1-2-2V7" />
    </svg>
  );
}
