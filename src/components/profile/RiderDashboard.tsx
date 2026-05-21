"use client";

import { useEffect, useState } from "react";
import { Bike, Clock, TrendingUp, Star, Award, ShieldCheck, MapPin, ChevronRight, Loader2, Play, AlertCircle, ShoppingBag } from "lucide-react";
import Link from "next/link";
import { calculateDistance } from "@/lib/distance";

export function RiderDashboard() {
  const [myTasks, setMyTasks] = useState<any[]>([]);
  const [availableCount, setAvailableCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [riderPos, setRiderPos] = useState<[number, number]>([23.8120, 90.4100]); // Dhaka fallback

  useEffect(() => {
    fetchRiderData();
    // Try to get geolocation for accurate distance/allowance calculations
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setRiderPos([pos.coords.latitude, pos.coords.longitude]);
        },
        (err) => {
          console.warn("Rider profile geolocation error:", err.message);
        }
      );
    }
  }, []);

  const fetchRiderData = async () => {
    try {
      const [tasksRes, availRes] = await Promise.all([
        fetch("/api/rider/orders/my-tasks"),
        fetch("/api/rider/orders/available")
      ]);

      if (tasksRes.ok) {
        const data = await tasksRes.json();
        setMyTasks(Array.isArray(data) ? data : []);
      }
      if (availRes.ok) {
        const data = await availRes.json();
        setAvailableCount(Array.isArray(data) ? data.length : 0);
      }
    } catch (error) {
      console.error("Failed to fetch rider data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Helper to calculate allowance for an order
  const getAllowance = (order: any) => {
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
    return Math.max(2.5, totalDist * 1.5);
  };

  const activeOrders = myTasks.filter(o => o.status !== "DELIVERED" && o.status !== "CANCELLED");
  const completedOrders = myTasks.filter(o => o.status === "DELIVERED");

  // Calculate earnings
  const todayEarnings = completedOrders
    .filter(o => new Date(o.createdAt).toDateString() === new Date().toDateString())
    .reduce((sum, o) => sum + getAllowance(o), 0);

  const weekEarnings = completedOrders
    .reduce((sum, o) => sum + getAllowance(o), 0);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-24">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
      {/* Top Banner / Welcome Card */}
      <div className="p-8 bg-gradient-to-br from-primary to-purple-600 text-white rounded-[2.5rem] shadow-xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16 transition-transform group-hover:scale-125"></div>
        <div className="absolute -bottom-8 -left-8 w-40 h-40 bg-purple-500/20 rounded-full blur-2xl"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/20 rounded-full text-xs font-bold uppercase tracking-wider">
              <Bike className="h-3.5 w-3.5" /> Rider Console Active
            </div>
            <h1 className="text-3xl font-black tracking-tight">Rider Dashboard</h1>
            <p className="text-white/80 text-sm max-w-md">Manage your active delivery missions, check live status, and monitor your earnings dashboard.</p>
          </div>
          <Link 
            href="/rider-dashboard"
            className="self-start md:self-auto inline-flex items-center gap-2 px-6 py-4 bg-white text-primary font-black rounded-2xl hover:shadow-2xl hover:scale-105 active:scale-95 transition-all text-sm uppercase tracking-wider"
          >
            Open Rider Console <Play className="h-4 w-4 fill-current" />
          </Link>
        </div>
      </div>

      {/* Available Orders Alert */}
      {availableCount > 0 && (
        <div className="p-5 bg-amber-500/10 border border-amber-500/30 rounded-3xl flex items-center justify-between gap-4 animate-pulse">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-6 w-6 text-amber-500 flex-shrink-0" />
            <div>
              <p className="font-extrabold text-amber-800 text-sm sm:text-base">{availableCount} delivery orders available in your zone!</p>
              <p className="text-xs text-amber-700 font-medium">Head to the Rider Console to accept incoming orders.</p>
            </div>
          </div>
          <Link href="/rider-dashboard" className="px-4 py-2 bg-amber-500 text-white text-xs font-black rounded-xl hover:bg-amber-600 transition-colors uppercase whitespace-nowrap">
            View
          </Link>
        </div>
      )}

      {/* Active Mission Banner */}
      {activeOrders.length > 0 ? (
        <div className="bg-card border-2 border-primary/30 rounded-[2.5rem] overflow-hidden shadow-lg">
          <div className="bg-primary/5 p-6 border-b border-dashed flex justify-between items-center">
            <div className="flex items-center gap-3">
              <span className="w-2.5 h-2.5 bg-green-500 rounded-full animate-ping" />
              <p className="text-xs font-black text-primary uppercase tracking-widest">Active Delivery Mission</p>
            </div>
            <span className="text-xs font-extrabold text-muted-foreground bg-muted px-2.5 py-1 rounded-full">
              #{activeOrders[0].id.slice(-6).toUpperCase()}
            </span>
          </div>
          <div className="p-8 space-y-6">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
              <div>
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-wider">Pickup Location</p>
                <h4 className="text-lg font-black text-foreground">{activeOrders[0].store?.name}</h4>
              </div>
              <div className="text-left sm:text-right">
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-wider">Est. Allowance</p>
                <h4 className="text-xl font-black text-green-600">${getAllowance(activeOrders[0]).toFixed(2)}</h4>
              </div>
            </div>
            
            <div className="flex items-start gap-3 p-4 bg-muted/40 rounded-2xl border">
              <MapPin className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
              <div>
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-wider">Delivery Destination</p>
                <p className="text-sm font-bold text-foreground">{activeOrders[0].deliveryAddress}</p>
                <p className="text-xs text-muted-foreground mt-0.5">Customer: {activeOrders[0].customer?.name}</p>
              </div>
            </div>

            <div className="flex gap-4">
              <Link href="/rider-dashboard" className="flex-1">
                <button className="w-full py-4 bg-primary text-primary-foreground rounded-2xl font-black text-sm uppercase tracking-wider shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all">
                  Navigate & Deliver
                </button>
              </Link>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-card border border-dashed rounded-[2.5rem] p-8 text-center space-y-3">
          <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto text-primary">
            <Bike className="h-6 w-6" />
          </div>
          <h3 className="font-extrabold text-lg">No Active Mission</h3>
          <p className="text-muted-foreground text-sm max-w-sm mx-auto">You don't have any active deliveries right now. Go online to receive order offers.</p>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        <div className="p-6 bg-card border rounded-[2rem] shadow-sm space-y-2">
          <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
            <TrendingUp className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Today's Pay</p>
            <p className="text-2xl font-black text-foreground">${todayEarnings.toFixed(2)}</p>
          </div>
        </div>

        <div className="p-6 bg-card border rounded-[2rem] shadow-sm space-y-2">
          <div className="w-10 h-10 bg-green-500/10 rounded-xl flex items-center justify-center text-green-600">
            <ShoppingBag className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Deliveries</p>
            <p className="text-2xl font-black text-foreground">{completedOrders.length}</p>
          </div>
        </div>

        <div className="p-6 bg-card border rounded-[2rem] shadow-sm space-y-2">
          <div className="w-10 h-10 bg-yellow-500/10 rounded-xl flex items-center justify-center text-yellow-600">
            <Star className="h-5 w-5 fill-current" />
          </div>
          <div>
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Rating</p>
            <p className="text-2xl font-black text-foreground">4.8</p>
          </div>
        </div>

        <div className="p-6 bg-card border rounded-[2rem] shadow-sm space-y-2">
          <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-600">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Safety Score</p>
            <p className="text-2xl font-black text-foreground">4.9</p>
          </div>
        </div>
      </div>

      {/* Recent Deliveries */}
      <div className="space-y-6 pt-6 border-t">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-black tracking-tight">Recent Deliveries</h2>
          <Link href="/rider-dashboard?tab=dutyrecord" className="text-primary text-sm font-extrabold hover:underline flex items-center gap-1">
            View All <ChevronRight className="h-4 w-4" />
          </Link>
        </div>

        {completedOrders.length > 0 ? (
          <div className="space-y-4">
            {completedOrders.slice(0, 3).map((order) => (
              <div key={order.id} className="bg-card border rounded-3xl p-6 hover:shadow-md transition-all">
                <div className="flex flex-col sm:flex-row justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-muted rounded-2xl flex-shrink-0 flex items-center justify-center border text-muted-foreground">
                      <Bike className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="text-lg font-black">{order.store?.name}</h3>
                      <p className="text-xs text-muted-foreground">
                        {new Date(order.createdAt).toLocaleDateString()} • Order #{order.id.slice(-6).toUpperCase()}
                      </p>
                    </div>
                  </div>
                  <div className="text-left sm:text-right space-y-1">
                    <span className="px-2.5 py-0.5 text-[10px] font-black rounded-full bg-green-100 text-green-700 uppercase tracking-wider">
                      Delivered
                    </span>
                    <p className="font-black text-lg text-green-600">+${getAllowance(order).toFixed(2)}</p>
                  </div>
                </div>
                
                <div className="mt-4 pt-4 border-t border-dashed flex justify-between items-center text-xs text-muted-foreground font-medium">
                  <span>To: {order.customer?.name}</span>
                  <span className="line-clamp-1 max-w-[200px]">{order.deliveryAddress}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-muted/20 rounded-[2rem] border-2 border-dashed">
            <ShoppingBag className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-muted-foreground font-medium">No deliveries completed yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
