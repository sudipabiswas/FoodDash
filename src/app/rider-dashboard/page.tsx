"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
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
  Target,
  Settings,
  ClipboardList
} from "lucide-react";
import toast from "react-hot-toast";
import { useSession, signOut } from "next-auth/react";
import dynamic from "next/dynamic";
import { calculateDistance } from "@/lib/distance";

const MapTracker = dynamic(() => import("@/components/map/MapTracker"), { ssr: false });

function RiderDashboardContent() {
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const router = useRouter();
  const tabParam = searchParams.get("tab");
  
  const [availableOrders, setAvailableOrders] = useState<any[]>([]);
  const [myTasks, setMyTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(tabParam || "home");
  const [period, setPeriod] = useState("daily");
  
  // Live GPS — starts with Dhaka fallback, gets replaced by real coords once browser grants permission
  const [riderPos, setRiderPos] = useState<[number, number]>([23.8120, 90.4100]);
  const [gpsStatus, setGpsStatus] = useState<"acquiring" | "live" | "denied" | "fallback">("acquiring");
  const [gpsAccuracy, setGpsAccuracy] = useState<number | null>(null);
  const [distances, setDistances] = useState<Record<string, { pickup: number, drop: number, total: number, allowance: number }>>({});
  const [timers, setTimers] = useState<Record<string, number>>({});

  useEffect(() => {
    if (tabParam && tabParam !== activeTab) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    router.push(`/rider-dashboard?tab=${tab}`, { scroll: false });
  };
  const [isOnline, setIsOnline] = useState(true);
  const [isBusy, setIsBusy] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    fetchOrders();
    const interval = setInterval(fetchOrders, 10000);

    // --- Live GPS tracking ---
    if (!navigator.geolocation) {
      setGpsStatus("fallback");
    } else {
      const watchId = navigator.geolocation.watchPosition(
        (pos) => {
          setRiderPos([pos.coords.latitude, pos.coords.longitude]);
          setGpsAccuracy(Math.round(pos.coords.accuracy));
          setGpsStatus("live");
        },
        (err) => {
          console.warn("GPS error:", err.message);
          setGpsStatus(err.code === 1 ? "denied" : "fallback");
        },
        { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 }
      );
      return () => {
        clearInterval(interval);
        navigator.geolocation.clearWatch(watchId);
      };
    }

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (availableOrders.length > 0 || myTasks.length > 0) {
      const newDistances = { ...distances };
      const newTimers = { ...timers };
      
      const allOrders = [...availableOrders, ...myTasks];
      
      allOrders.forEach(order => {
        // Always recalculate pickup distance (depends on live riderPos)
        const storeLat = order.store?.latitude;
        const storeLng = order.store?.longitude;
        const custLat = order.deliveryLat;
        const custLng = order.deliveryLng;

        let pickupDist = 0;
        let dropDist = 0;

        if (storeLat && storeLng) {
          pickupDist = calculateDistance(riderPos[0], riderPos[1], storeLat, storeLng);
        }
        if (storeLat && storeLng && custLat && custLng) {
          dropDist = calculateDistance(storeLat, storeLng, custLat, custLng);
        }

        const totalDist = pickupDist + dropDist;
        const calculatedAllowance = Math.max(2.5, totalDist * 1.5);

        newDistances[order.id] = {
          pickup: pickupDist,
          drop: dropDist,
          total: totalDist,
          allowance: calculatedAllowance
        };
        newTimers[order.id] = timers[order.id] ?? 100;
      });
      setDistances(newDistances);
      setTimers(newTimers);
    }
  }, [availableOrders, myTasks, riderPos]);

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
      setLoading(false);
    } catch (err) {
      console.error(err);
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
        toast.success("Mission Accepted! Ride safe.");
        fetchOrders();
      } else {
        toast.error("Someone else grabbed it!");
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
                                      .reduce((sum, o) => sum + (distances[o.id]?.allowance || 2.50), 0);
  const weekEarnings = completedOrders.reduce((sum, o) => sum + (distances[o.id]?.allowance || 2.50), 0);

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
      <div className="container mx-auto max-w-lg p-6 space-y-6">
        
        {activeTab === "home" && (
          <>
            {/* 1. Top Bar (Status + Identity) */}
            <div className="flex items-center justify-between mb-8">
               <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-slate-100 rounded-full flex items-center justify-center border-2 border-white shadow-xl relative group">
                     <Bike className="h-6 w-6 text-primary" />
                     <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-white rounded-full flex items-center justify-center shadow-md">
                        <div className={`w-3 h-3 rounded-full ${isOnline ? "bg-green-500 animate-pulse" : "bg-red-500"}`} />
                     </div>
                  </div>
                  <div>
                     <div className="flex items-center gap-2">
                        <h1 className="text-xl font-black text-slate-900 tracking-tight">{session?.user?.name || "Rider"}</h1>
                        <div className="flex items-center gap-1 px-2 py-0.5 bg-yellow-400/10 rounded-full">
                           <Star className="h-3 w-3 text-yellow-400 fill-current" />
                           <span className="text-[10px] font-black text-yellow-600">4.7</span>
                        </div>
                     </div>
                     <div className="flex items-center gap-2 mt-1">
                        <button 
                          onClick={() => setIsOnline(!isOnline)}
                          className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest transition-all ${isOnline ? "bg-green-500/10 text-green-600" : "bg-red-500/10 text-red-600"}`}
                        >
                           ● {isOnline ? "Online" : "Offline"}
                        </button>
                        <button 
                          onClick={() => setIsBusy(!isBusy)}
                          className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest transition-all ${isBusy ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-400"}`}
                        >
                           Busy Mode
                        </button>
                     </div>
                  </div>
               </div>
               <div className="flex items-center gap-3">
                  <button className="p-3 bg-white border rounded-full text-slate-400 hover:text-slate-900 transition-all shadow-lg shadow-slate-200/50 relative">
                     <Bell className="h-6 w-6" />
                     {availableOrders.length > 0 && isOnline && (
                        <div className="absolute top-3 right-3 w-2.5 h-2.5 bg-primary border-2 border-white rounded-full" />
                     )}
                  </button>
                  <button 
                    onClick={() => setActiveTab("growth")}
                    className="flex items-center gap-3 px-5 py-3 bg-primary/10 rounded-full border border-primary/20 shadow-lg shadow-primary/5 transition-all active:scale-95 group"
                  >
                     <Wallet className="h-5 w-5 text-primary group-hover:rotate-12 transition-transform" />
                     <span className="font-black text-primary text-sm tracking-tight">${todayEarnings.toFixed(0)}</span>
                  </button>
               </div>
            </div>

            {/* 2. Mini Map / Zone Awareness */}
            <div className="relative h-64 bg-slate-100 rounded-[3rem] border-4 border-white shadow-2xl overflow-hidden mb-10 z-0">
               {activeOrders.length > 0 ? (
                 <MapTracker 
                   riderPos={riderPos} 
                   storePos={activeOrders[0].store?.latitude ? [activeOrders[0].store.latitude, activeOrders[0].store.longitude] : undefined}
                   customerPos={activeOrders[0].deliveryLat ? [activeOrders[0].deliveryLat, activeOrders[0].deliveryLng] : undefined}
                 />
               ) : (
                 <MapTracker riderPos={riderPos} />
               )}
               {/* GPS Status Badge */}
               <div className="absolute bottom-4 left-4 z-[400] flex flex-col gap-2">
                 {gpsStatus === "live" && (
                   <div className="px-3 py-1.5 bg-green-500 rounded-full flex items-center gap-1.5 shadow-lg">
                     <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                     <span className="text-[9px] font-black text-white uppercase tracking-widest">GPS Live</span>
                     {gpsAccuracy && <span className="text-[8px] text-white/80 font-bold">±{gpsAccuracy}m</span>}
                   </div>
                 )}
                 {gpsStatus === "acquiring" && (
                   <div className="px-3 py-1.5 bg-amber-500 rounded-full flex items-center gap-1.5 shadow-lg">
                     <div className="w-1.5 h-1.5 bg-white rounded-full animate-ping" />
                     <span className="text-[9px] font-black text-white uppercase tracking-widest">Acquiring GPS…</span>
                   </div>
                 )}
                 {gpsStatus === "denied" && (
                   <div className="px-3 py-1.5 bg-red-500 rounded-full flex items-center gap-1.5 shadow-lg">
                     <span className="text-[9px] font-black text-white uppercase tracking-widest">⚠ GPS Denied</span>
                   </div>
                 )}
                 {gpsStatus === "fallback" && (
                   <div className="px-3 py-1.5 bg-slate-600 rounded-full flex items-center gap-1.5 shadow-lg">
                     <span className="text-[9px] font-black text-white uppercase tracking-widest">Fallback Location</span>
                   </div>
                 )}
               </div>
               {/* Live coords */}
               {gpsStatus === "live" && (
                 <div className="absolute top-4 right-4 z-[400] px-3 py-1.5 bg-black/60 backdrop-blur rounded-xl">
                   <span className="text-[8px] font-mono text-green-300">
                     {riderPos[0].toFixed(4)}, {riderPos[1].toFixed(4)}
                   </span>
                 </div>
               )}
            </div>

            {/* 3. Live Feed Header */}
            <div className="flex justify-between items-center mb-6 px-2">
               <div className="space-y-1">
                  <h2 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Live Order Feed</h2>
                  <div className="flex items-center gap-1">
                     <div className="w-1 h-1 bg-primary rounded-full animate-ping" />
                     <span className="text-[9px] font-black text-primary uppercase">Searching...</span>
                  </div>
               </div>
            </div>

            {/* Main Screen Content */}
            {!isOnline ? (
              <div className="bg-white border rounded-[3rem] p-12 text-center space-y-4 shadow-xl shadow-slate-200/50">
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
              <div className="space-y-6">
                 {activeOrders.map(order => (
                   <div key={order.id} className="bg-white border-2 border-primary/20 rounded-[3rem] overflow-hidden shadow-2xl shadow-primary/5">
                      <div className="bg-primary p-8 text-white">
                         <div className="flex justify-between items-center mb-6">
                            <div className="flex items-center gap-3">
                               <div className="px-3 py-1 bg-white/20 rounded-full text-[10px] font-black uppercase tracking-widest">
                                  Mission Active
                               </div>
                               <span className="font-black text-white/70">#{order.id.slice(-6).toUpperCase()}</span>
                            </div>
                            <div className="text-right">
                               <div className="font-black text-2xl">${distances[order.id]?.allowance?.toFixed(2) || "2.50"}</div>
                               <div className="text-[10px] font-black text-white/70 uppercase tracking-widest">Allowance</div>
                            </div>
                         </div>
                         <div className="flex items-center justify-between px-2 mb-2">
                            {["ACCEPTED", "PREPARING", "OUT_FOR_DELIVERY", "DELIVERED"].map((status, idx, arr) => {
                              const steps = ["ACCEPTED", "PREPARING", "OUT_FOR_DELIVERY", "DELIVERED"];
                              const currentIdx = steps.indexOf(order.status);
                              const isActive = currentIdx >= idx;
                              return (
                                <div key={status} className="flex items-center flex-1 last:flex-none">
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
                            <span>Confirm</span><span>Prepare</span><span>Pickup</span><span>Deliver</span>
                         </div>
                      </div>
                      <div className="p-8 space-y-8">
                         <div className="space-y-6">
                            <div className="flex items-start gap-4">
                               <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-500"><Package className="h-5 w-5" /></div>
                               <div className="flex-1">
                                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Pickup From</p>
                                  <div className="flex justify-between items-center">
                                    <h4 className="font-black text-lg leading-tight">{order.store?.name}</h4>
                                    <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded-full">{distances[order.id]?.pickup?.toFixed(1) || "..."} km</span>
                                  </div>
                                  <div className="flex gap-2 mt-3">
                                     <button className="flex-1 py-3 bg-slate-100 text-slate-900 rounded-xl font-bold text-xs flex items-center justify-center gap-2"><Phone className="h-3 w-3" /> Call Shop</button>
                                     <button className="flex-1 py-3 bg-slate-100 text-slate-900 rounded-xl font-bold text-xs flex items-center justify-center gap-2"><Navigation className="h-3 w-3" /> Navigate</button>
                                  </div>
                               </div>
                            </div>
                            <div className="flex items-start gap-4">
                               <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-500"><MapPin className="h-5 w-5" /></div>
                               <div className="flex-1">
                                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Deliver To</p>
                                  <div className="flex justify-between items-start gap-4">
                                    <h4 className="font-black text-lg leading-tight">{order.customer?.name}</h4>
                                    <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded-full whitespace-nowrap">{distances[order.id]?.drop?.toFixed(1) || "..."} km</span>
                                  </div>
                                  <p className="text-xs font-medium text-slate-500 mt-1">{order.deliveryAddress}</p>
                                  <div className="flex gap-2 mt-3">
                                     <button className="flex-1 py-3 bg-slate-100 text-slate-900 rounded-xl font-bold text-xs flex items-center justify-center gap-2"><Phone className="h-3 w-3" /> Call Customer</button>
                                     <button className="flex-1 py-3 bg-slate-100 text-slate-900 rounded-xl font-bold text-xs flex items-center justify-center gap-2"><Navigation className="h-3 w-3" /> Navigate</button>
                                  </div>
                               </div>
                            </div>
                         </div>
                         <div className="pt-8 border-t border-dashed">
                            {order.status === "ACCEPTED" && (
                               <button onClick={() => handleUpdateStatus(order.id, "PREPARING")} className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:scale-[1.02] transition-all">Confirming Arrival</button>
                            )}
                            {order.status === "PREPARING" && (
                               <button onClick={() => handleUpdateStatus(order.id, "OUT_FOR_DELIVERY")} className="w-full py-5 bg-primary text-primary-foreground rounded-2xl font-black text-sm uppercase tracking-widest hover:scale-[1.02] transition-all shadow-xl shadow-primary/20">Mark as Picked Up</button>
                            )}
                            {order.status === "OUT_FOR_DELIVERY" && (
                               <button onClick={() => handleUpdateStatus(order.id, "DELIVERED")} className="w-full py-5 bg-green-500 text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:scale-[1.02] transition-all shadow-xl shadow-green-500/20">Confirm Delivery</button>
                            )}
                            {order.status === "ACCEPTED" && (
                               <button onClick={() => handleCancelAssignment(order.id)} className="w-full mt-4 py-3 text-red-500 font-black text-[10px] uppercase tracking-widest">Release Order</button>
                            )}
                         </div>
                      </div>
                   </div>
                 ))}
              </div>
            ) : (
              <div className="space-y-4">
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
                   availableOrders.map(order => {
                     const timer = timers[order.id] || 0;
                     return (
                       <div key={order.id} className="relative bg-white border border-slate-200 rounded-[2.5rem] p-6 shadow-lg shadow-slate-200/50 hover:border-primary/30 transition-all">
                          <div className="absolute top-0 left-8 right-8 h-1 bg-slate-100 rounded-full overflow-hidden">
                             <div className={`h-full transition-all duration-1000 ${timer < 10 ? "bg-red-500" : "bg-primary"}`} style={{ width: `${timer}%` }} />
                          </div>
                          <div className="flex justify-between items-start pt-2">
                             <div className="flex items-center gap-3">
                                <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center border"><Truck className="h-6 w-6 text-slate-400" /></div>
                                <div>
                                   <h4 className="font-black text-lg leading-tight text-slate-900">{order.store?.name}</h4>
                                   <div className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 uppercase tracking-widest">{order.items?.length || 0} Items • <span className="text-primary">{timer}s left</span></div>
                                </div>
                             </div>
                             <div className="text-right">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Earn</p>
                                <p className="text-2xl font-black text-green-600">${distances[order.id]?.allowance?.toFixed(2) || "2.50"}</p>
                             </div>
                          </div>
                          <div className="grid grid-cols-3 gap-3 my-6">
                             <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100"><p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Pickup</p><p className="font-black text-xs text-slate-900">{distances[order.id]?.pickup?.toFixed(1) || "0.0"} km</p></div>
                             <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100"><p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Drop</p><p className="font-black text-xs text-slate-900">{distances[order.id]?.drop?.toFixed(1) || "0.0"} km</p></div>
                             <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100"><p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Total</p><p className="font-black text-xs text-slate-900">{distances[order.id]?.total?.toFixed(1) || "0.0"} km</p></div>
                          </div>
                          <div className="flex items-center gap-3">
                             <button onClick={() => handleAcceptOrder(order.id)} className="flex-[2] py-4 bg-primary text-primary-foreground rounded-2xl font-black text-sm uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-primary/20">Accept</button>
                             <button className="flex-1 py-4 bg-slate-100 text-slate-400 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-slate-200 transition-all">Decline</button>
                          </div>
                       </div>
                     );
                   })
                 )}
              </div>
            )}

            <div className="bg-slate-900 text-white rounded-[3rem] p-10 space-y-8 shadow-2xl shadow-slate-900/30 overflow-hidden relative">
               <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 blur-[60px] rounded-full -mr-16 -mt-16" />
               <div className="flex justify-between items-start relative z-10">
                  <div>
                     <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em] mb-2">Today's Earnings</p>
                     <h3 className="text-5xl font-black text-white tracking-tighter">${todayEarnings.toFixed(2)}</h3>
                  </div>
                  <div className="bg-white/10 p-3 rounded-2xl"><Wallet className="h-6 w-6 text-primary" /></div>
               </div>
               <div className="grid grid-cols-2 gap-6 relative z-10">
                  <div className="space-y-1"><p className="text-[9px] font-black text-white/30 uppercase tracking-widest">This Week</p><p className="text-xl font-black text-white/90">${weekEarnings.toFixed(2)}</p></div>
                  <div className="space-y-1 text-right"><p className="text-[9px] font-black text-white/30 uppercase tracking-widest">Completed</p><p className="text-xl font-black text-white/90">{completedOrders.length}</p></div>
               </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
               <div className="bg-white border rounded-[2rem] p-6 space-y-4">
                  <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-500"><Zap className="h-5 w-5" /></div>
                  <div><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">On-Time %</p><p className="text-2xl font-black text-slate-900">98.2%</p></div>
               </div>
               <div className="bg-white border rounded-[2rem] p-6 space-y-4">
                  <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center text-green-500"><ShieldCheck className="h-5 w-5" /></div>
                  <div><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Safety Score</p><p className="text-2xl font-black text-slate-900">4.9</p></div>
               </div>
            </div>
          </>
        )}

        {activeTab === "growth" && (
           <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex bg-slate-100 p-1.5 rounded-[2rem] border">
                 {["daily", "weekly", "monthly"].map(p => (
                   <button key={p} onClick={() => setPeriod(p)} className={`flex-1 py-3 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${period === p ? "bg-white text-slate-900 shadow-sm" : "text-slate-400 hover:text-slate-600"}`}>{p}</button>
                 ))}
              </div>
              <div className="bg-white border rounded-[3rem] p-10 space-y-8 shadow-xl shadow-slate-200/50">
                 <div className="flex justify-between items-start">
                    <div>
                       <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">{period} Net Income</h2>
                       <p className="text-5xl font-black text-slate-900 tracking-tighter">${period === "daily" ? todayEarnings.toFixed(2) : period === "weekly" ? weekEarnings.toFixed(2) : (weekEarnings * 4.2).toFixed(2)}</p>
                    </div>
                    <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center"><TrendingUp className="h-6 w-6 text-primary" /></div>
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                    <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100"><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Deliveries</p><p className="text-2xl font-black text-slate-900">{period === "daily" ? completedOrders.filter(o => new Date(o.createdAt).toDateString() === new Date().toDateString()).length : completedOrders.length}</p></div>
                    <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100"><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Incentives</p><p className="text-2xl font-black text-green-600">$0.00</p></div>
                 </div>
                 <button 
                   onClick={() => toast.success("Withdrawal request sent to bank!")}
                   className="w-full py-5 bg-slate-900 text-white rounded-[2rem] font-black text-sm uppercase tracking-widest shadow-xl shadow-slate-900/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
                 >
                    Withdraw to Bank
                 </button>
              </div>
              <div className="bg-white border rounded-[3rem] p-8 space-y-6 shadow-xl shadow-slate-200/50">
                 <div className="flex justify-between items-center px-2"><h3 className="font-black text-slate-900 uppercase tracking-widest text-xs">Recent Income</h3><TrendingUp className="h-4 w-4 text-green-500" /></div>
                 <div className="space-y-4">
                    {completedOrders.slice(0, 5).map(o => (
                       <div key={o.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                          <div className="flex items-center gap-3">
                             <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center border text-slate-400"><Package className="h-5 w-5" /></div>
                             <div><p className="font-black text-slate-900 text-sm">{o.store?.name}</p><p className="text-[10px] text-slate-500 font-bold uppercase">{new Date(o.createdAt).toLocaleDateString()}</p></div>
                          </div>
                          <p className="font-black text-green-600">+${(Number(o.deliveryCharge ?? o.store?.deliveryCharge) || 0).toFixed(2)}</p>
                       </div>
                    ))}
                 </div>
              </div>
           </div>
        )}

        {activeTab === "dutyrecord" && (
           <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="bg-white border rounded-[3rem] p-8 space-y-6 shadow-xl shadow-slate-200/50">
                 <div className="flex justify-between items-center px-2">
                    <h3 className="font-black text-slate-900 uppercase tracking-widest text-xs">Past Deliveries</h3>
                    <div className="px-3 py-1 bg-slate-100 rounded-full text-[10px] font-black text-slate-500 uppercase tracking-widest">{completedOrders.length} Total</div>
                 </div>
                 
                 {completedOrders.length === 0 ? (
                    <div className="py-12 text-center text-slate-400 font-medium">No deliveries completed yet.</div>
                 ) : (
                    <div className="space-y-4">
                       {completedOrders.map(o => (
                          <div key={o.id} className="p-5 bg-slate-50 rounded-[2rem] border border-slate-100 space-y-4 hover:border-slate-300 transition-colors">
                             <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                   <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center border shadow-sm text-slate-500">
                                      <Package className="h-5 w-5" />
                                   </div>
                                   <div>
                                      <p className="font-black text-slate-900">{o.store?.name}</p>
                                      <p className="text-[10px] font-bold text-slate-500 uppercase">{new Date(o.createdAt).toLocaleString()}</p>
                                   </div>
                                </div>
                                <div className="text-right">
                                   <span className="font-bold text-lg">${distances[o.id]?.allowance?.toFixed(2) || "2.50"}</span>
                                </div>
                             </div>
                             <div className="flex justify-between items-center text-xs text-slate-500 font-medium">
                                <span>Est. Distance</span>
                                <span>{distances[o.id]?.total?.toFixed(1) || "0.0"} km</span>
                             </div>
                             <div className="flex items-start gap-2 pt-3 border-t border-slate-200/50">
                                <MapPin className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
                                <p className="text-xs font-medium text-slate-600 line-clamp-2">{o.deliveryAddress}</p>
                             </div>
                          </div>
                       ))}
                    </div>
                 )}
              </div>
           </div>
        )}

        {activeTab === "settings" && (
           <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="bg-white border rounded-[3rem] p-8 space-y-6 shadow-xl shadow-slate-200/50">
                 <div className="flex items-center gap-6">
                    <div className="w-24 h-24 rounded-full bg-slate-100 border-4 border-white shadow-xl flex items-center justify-center relative">
                       <Bike className="h-12 w-12 text-primary" />
                       <div className="absolute bottom-0 right-0 w-8 h-8 bg-green-500 border-4 border-white rounded-full" />
                    </div>
                    <div>
                       <h2 className="text-2xl font-black text-slate-900">{session?.user?.name || "Rider Name"}</h2>
                       <p className="text-slate-500 font-bold uppercase text-[10px] tracking-widest mb-2">ID: RD-88291</p>
                    </div>
                 </div>
              </div>
              <div className="bg-white border rounded-[3rem] p-4 shadow-xl shadow-slate-200/50 divide-y">
                 <button 
                   onClick={() => toast("Notification settings coming soon!", { icon: "🔔" })}
                   className="w-full p-6 flex items-center justify-between hover:bg-slate-50 transition-all first:rounded-t-[2.5rem]"
                 >
                    <div className="flex items-center gap-4"><Bell className="h-5 w-5 text-slate-400" /><span className="font-black text-slate-800 text-sm uppercase tracking-widest">Notification Settings</span></div>
                    <ChevronRight className="h-5 w-5 text-slate-300" />
                 </button>
                 <button 
                   onClick={() => signOut({ callbackUrl: "/" })}
                   className="w-full p-6 flex items-center justify-between hover:bg-red-50 transition-all last:rounded-b-[2.5rem] group"
                 >
                    <div className="flex items-center gap-4"><Power className="h-5 w-5 text-red-400" /><span className="font-black text-red-600 text-sm uppercase tracking-widest">Logout System</span></div>
                    <ArrowRight className="h-5 w-5 text-red-300 group-hover:translate-x-2 transition-transform" />
                 </button>
              </div>
           </div>
        )}

      </div>

      {/* Bottom Nav */}
      <div className="fixed bottom-0 inset-x-0 bg-white border-t px-8 py-4 z-50">
         <div className="container mx-auto max-w-lg flex items-center justify-between">
            <button onClick={() => handleTabChange("home")} className={`flex flex-col items-center gap-1 transition-all ${activeTab === "home" ? "text-primary scale-110" : "text-slate-400 hover:text-slate-600"}`}><Bike className="h-6 w-6" /><span className="text-[8px] font-black uppercase tracking-widest">Home</span></button>
            <button onClick={() => handleTabChange("growth")} className={`flex flex-col items-center gap-1 transition-all ${activeTab === "growth" ? "text-primary scale-110" : "text-slate-400 hover:text-slate-600"}`}><TrendingUp className="h-6 w-6" /><span className="text-[8px] font-black uppercase tracking-widest">Earnings</span></button>
            <button onClick={() => handleTabChange("dutyrecord")} className={`flex flex-col items-center gap-1 transition-all ${activeTab === "dutyrecord" ? "text-primary scale-110" : "text-slate-400 hover:text-slate-600"}`}><ClipboardList className="h-6 w-6" /><span className="text-[8px] font-black uppercase tracking-widest">Duty Record</span></button>
            <button onClick={() => handleTabChange("settings")} className={`flex flex-col items-center gap-1 transition-all ${activeTab === "settings" ? "text-primary scale-110" : "text-slate-400 hover:text-slate-600"}`}><Settings className="h-6 w-6" /><span className="text-[8px] font-black uppercase tracking-widest">Settings</span></button>
         </div>
      </div>
    </div>
  );
}

function StoreIcon(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7" /><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" /><path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4" /><path d="M2 7h20" /><path d="M22 7v3a2 2 0 0 1-2 2v0a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 16 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 12 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 8 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 4 12v0a2 2 0 0 1-2-2V7" />
    </svg>
  );
}

export default function RiderDashboard() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><Bike className="h-12 w-12 text-primary animate-bounce" /></div>}>
      <RiderDashboardContent />
    </Suspense>
  );
}
