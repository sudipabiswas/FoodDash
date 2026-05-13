"use client";

import { useState, useEffect } from "react";
import { 
  ShoppingBag, 
  Clock, 
  CheckCircle2, 
  MapPin, 
  ChevronRight, 
  Star,
  MessageSquare
} from "lucide-react";
import OrderReviewModal from "@/components/orders/OrderReviewModal";

export default function UserOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrderForReview, setSelectedOrderForReview] = useState<any>(null);

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
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12 max-w-5xl">
      <div className="mb-12">
        <h1 className="text-4xl font-extrabold tracking-tight">Your Orders</h1>
        <p className="text-muted-foreground mt-2 text-lg">Track your current and past orders.</p>
      </div>

      <div className="space-y-8">
        {orders.length === 0 ? (
          <div className="text-center py-24 bg-card border border-dashed rounded-[3rem] space-y-4">
            <ShoppingBag className="h-16 w-16 text-muted-foreground/20 mx-auto" />
            <div className="space-y-2">
               <p className="text-xl font-bold">No orders found</p>
               <p className="text-muted-foreground">Hungry? Start exploring nearby restaurants!</p>
            </div>
            <a href="/" className="inline-block px-8 py-4 bg-primary text-primary-foreground rounded-2xl font-bold hover:scale-105 transition-all">
               Browse Restaurants
            </a>
          </div>
        ) : (
          orders.map((order) => (
            <div key={order.id} className="bg-card border rounded-[2.5rem] overflow-hidden hover:shadow-xl hover:shadow-primary/5 transition-all group">
              <div className="p-8 md:p-10">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
                  <div className="flex items-center gap-6">
                    <div className="w-20 h-20 rounded-3xl bg-primary/10 overflow-hidden border shadow-inner">
                       {order.store?.image ? (
                         <img src={order.store.image} alt="Store" className="w-full h-full object-cover" />
                       ) : (
                         <ShoppingBag className="w-10 h-10 m-5 text-primary/30" />
                       )}
                    </div>
                    <div>
                      <h3 className="text-2xl font-extrabold group-hover:text-primary transition-colors">{order.store?.name}</h3>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1 font-medium">
                        <span>#{order.id.slice(-6).toUpperCase()}</span>
                        <span>•</span>
                        <span>{new Date(order.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-end gap-3">
                     <div className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest ${
                       order.status === "DELIVERED" ? "bg-green-100 text-green-700" :
                       order.status === "PENDING" ? "bg-orange-100 text-orange-700" :
                       "bg-blue-100 text-blue-700"
                     }`}>
                        {order.status}
                     </div>
                     <p className="text-2xl font-black text-primary">${order.totalPrice.toFixed(2)}</p>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-10 pt-8 border-t border-dashed">
                  <div className="space-y-6">
                    <div className="space-y-4">
                      <div className="flex items-center gap-3 text-sm font-bold text-muted-foreground uppercase tracking-widest">
                        <ShoppingBag className="h-4 w-4" />
                        <span>Order Summary</span>
                      </div>
                      <div className="space-y-3">
                        {order.items.map((item: any) => (
                          <div key={item.id} className="flex justify-between text-sm font-medium">
                            <span className="text-muted-foreground">
                              {item.quantity}x <span className="text-foreground">{item.product?.name}</span>
                            </span>
                            <span>${(item.quantity * item.price).toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="flex items-center gap-3 text-sm font-bold text-muted-foreground uppercase tracking-widest">
                        <MapPin className="h-4 w-4" />
                        <span>Delivery Address</span>
                      </div>
                      <p className="text-sm font-medium text-muted-foreground leading-relaxed">{order.deliveryAddress}</p>
                    </div>
                  </div>

                  <div className="flex flex-col justify-end gap-4">
                    {order.status === "DELIVERED" ? (
                      order.review ? (
                        <div className="bg-green-50/50 border border-green-100 p-6 rounded-3xl space-y-4">
                           <div className="flex justify-between items-center">
                              <span className="text-xs font-black text-green-700 uppercase tracking-widest">Your Feedback</span>
                              <div className="flex gap-1">
                                 {[1, 2, 3, 4, 5].map((s) => (
                                   <Star key={s} className={`h-3 w-3 ${s <= order.review.rating ? "fill-green-600 text-green-600" : "text-green-200"}`} />
                                 ))}
                              </div>
                           </div>
                           <p className="text-sm italic text-green-800 leading-relaxed">"{order.review.comment}"</p>
                        </div>
                      ) : (
                        <button 
                          onClick={() => setSelectedOrderForReview(order)}
                          className="w-full py-5 bg-primary text-primary-foreground rounded-3xl font-black text-lg flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-primary/20 group/btn"
                        >
                          <Star className="h-6 w-6 group-hover/btn:rotate-12 transition-transform" />
                          Rate & Review Meal
                        </button>
                      )
                    ) : (
                      <div className="bg-muted/30 p-8 rounded-[2rem] text-center border border-dashed">
                        <Clock className="h-10 w-10 text-muted-foreground/20 mx-auto mb-4 animate-pulse" />
                        <p className="text-sm font-bold text-muted-foreground">Tracking your order...</p>
                        <p className="text-xs text-muted-foreground/60 mt-1">Review option will be available once delivered.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {selectedOrderForReview && (
        <OrderReviewModal 
          order={selectedOrderForReview} 
          onClose={() => setSelectedOrderForReview(null)} 
          onSuccess={fetchOrders}
        />
      )}
    </div>
  );
}
