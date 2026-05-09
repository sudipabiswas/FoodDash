"use client";

import { ShoppingBag, Clock, MapPin, ChevronRight, Loader2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

export function CustomerDashboard() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const res = await fetch("/api/user/orders");
      if (res.ok) {
        const data = await res.json();
        setOrders(data);
      }
    } catch (error) {
      console.error("Failed to fetch orders", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">Customer Dashboard</h1>
        <p className="text-muted-foreground mt-1">Manage your orders, addresses, and discover new food.</p>
      </div>

      {/* Quick Actions Grid */}
      <div className="grid sm:grid-cols-2 gap-6">
        <div className="p-8 bg-gradient-to-br from-blue-600 to-indigo-600 text-white rounded-[2rem] shadow-lg space-y-4 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10 transition-transform group-hover:scale-150"></div>
          <h3 className="text-xl font-bold relative z-10">Hungry?</h3>
          <p className="text-white/80 text-sm relative z-10">Explore hundreds of top-rated local restaurants and get food delivered fast.</p>
          <Link 
            href="/stores" 
            className="inline-flex items-center gap-2 px-6 py-3 bg-white text-blue-600 rounded-xl font-bold hover:shadow-xl transition-all relative z-10"
          >
            Browse Restaurants <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
        
        <div className="p-8 bg-card border rounded-[2rem] shadow-sm space-y-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
              <MapPin className="h-5 w-5 text-primary" />
            </div>
            <h3 className="text-xl font-bold">Saved Addresses</h3>
          </div>
          <div className="space-y-3">
            <div className="p-3 bg-muted rounded-xl flex justify-between items-center">
              <div>
                <p className="font-bold text-sm">Home</p>
                <p className="text-xs text-muted-foreground line-clamp-1">123 Delivery St, New York, NY 10001</p>
              </div>
            </div>
            <Link href="/profile/addresses" className="block text-center text-sm font-bold text-primary hover:underline">
              Manage Addresses
            </Link>
          </div>
        </div>
      </div>

      {/* Order History */}
      <div className="space-y-6 pt-6 border-t">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">Recent Orders</h2>
          <Link href="/profile/orders" className="text-primary text-sm font-bold hover:underline">View All</Link>
        </div>
        
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary/30" />
          </div>
        ) : orders.length > 0 ? (
          orders.slice(0, 3).map((order) => (
            <div key={order.id} className="bg-card border rounded-3xl p-6 hover:shadow-md transition-shadow">
              <div className="flex flex-col sm:flex-row justify-between gap-4 mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-muted rounded-2xl flex-shrink-0 overflow-hidden border">
                    {order.store.image ? (
                      <img src={order.store.image} alt={order.store.name} className="w-full h-full object-cover" />
                    ) : (
                      <ShoppingBag className="h-8 w-8 text-muted-foreground/30 m-auto" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">{order.store.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {new Date(order.createdAt).toLocaleDateString()} • Order #{order.id.slice(-4)}
                    </p>
                  </div>
                </div>
                <div className="text-left sm:text-right">
                  <div className={`px-3 py-1 text-xs font-bold rounded-full inline-block mb-1 ${
                    order.status === 'DELIVERED' ? 'bg-green-100 text-green-700' : 
                    order.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' : 
                    'bg-blue-100 text-blue-700'
                  }`}>
                    {order.status}
                  </div>
                  <p className="font-extrabold text-lg">${order.totalPrice.toFixed(2)}</p>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-2 py-4 border-t border-b border-dashed mb-6">
                {order.items.map((item: any) => (
                  <span key={item.id} className="px-3 py-1 bg-muted rounded-full text-xs font-medium">
                    {item.quantity}x {item.product.name}
                  </span>
                ))}
              </div>

              <div className="flex gap-4">
                <Link href={`/stores`} className="flex-1">
                  <button className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-bold hover:shadow-lg transition-all">
                    Reorder
                  </button>
                </Link>
                <Link href={`/order-tracking/${order.id}`} className="flex-1">
                  <button className="w-full py-3 border rounded-xl font-bold hover:bg-muted transition-all">
                    Track Order
                  </button>
                </Link>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-12 bg-muted/30 rounded-3xl border-2 border-dashed">
            <ShoppingBag className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-muted-foreground font-medium">You haven't placed any orders yet.</p>
            <Link href="/stores" className="text-primary font-bold hover:underline mt-2 inline-block">
              Start shopping
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
