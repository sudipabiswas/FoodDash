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
  const [selectedOrder, setSelectedOrder] = useState<any>(null);

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
           {["ALL", "PENDING", "ACCEPTED", "DELIVERED"].map((f: string) => (
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
                <th className="px-8 py-6 text-xs font-bold uppercase tracking-widest text-muted-foreground text-right">Actions</th>
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
                  <tr key={order.id} className="group hover:bg-muted/20 transition-colors cursor-pointer" onClick={() => setSelectedOrder(order)}>
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
                    <td className="px-8 py-6 text-right">
                       <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
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
                          <button 
                            onClick={() => setSelectedOrder(order)}
                            className="p-2 hover:bg-muted rounded-lg transition-colors"
                          >
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

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-card w-full max-w-2xl rounded-[2.5rem] border shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-8 border-b bg-muted/30 flex justify-between items-center">
               <div>
                  <h2 className="text-2xl font-bold">Order Details</h2>
                  <p className="text-sm font-mono text-primary mt-1">ID: #{selectedOrder.id.toUpperCase()}</p>
               </div>
               <button 
                 onClick={() => setSelectedOrder(null)}
                 className="p-2 hover:bg-muted rounded-full transition-colors"
               >
                 <XCircle className="h-6 w-6" />
               </button>
            </div>

            <div className="p-8 space-y-8 max-h-[70vh] overflow-y-auto">
               <div className="grid md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                     <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Customer Info</h3>
                     <div className="space-y-2">
                        <p className="font-bold text-lg">{selectedOrder.customer?.name}</p>
                        <p className="text-sm text-muted-foreground">{selectedOrder.customer?.email}</p>
                        <div className="pt-2">
                           <p className="text-xs font-bold text-muted-foreground uppercase">Delivery Address</p>
                           <p className="text-sm mt-1 leading-relaxed">{selectedOrder.deliveryAddress || "No address provided"}</p>
                        </div>
                     </div>
                  </div>
                  <div className="space-y-4">
                     <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Order Summary</h3>
                     <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                           <span>Status</span>
                           <span className="font-bold text-primary">{selectedOrder.status}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                           <span>Payment Method</span>
                           <span className="font-bold">{selectedOrder.paymentMethod}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                           <span>Payment Status</span>
                           <span className={`font-bold ${
                             selectedOrder.paymentStatus === "PAID" ? "text-green-600" :
                             selectedOrder.paymentStatus === "COD" ? "text-blue-600" :
                             "text-amber-600 font-extrabold animate-pulse"
                           }`}>
                             {selectedOrder.paymentStatus === "PAID" ? "PAID" :
                              selectedOrder.paymentStatus === "COD" ? "Cash on Delivery" :
                              "UNPAID (Pending)"}
                           </span>
                        </div>
                        <div className="flex justify-between text-sm">
                           <span>Date</span>
                           <span className="font-bold">{new Date(selectedOrder.createdAt).toLocaleDateString()}</span>
                        </div>
                     </div>
                  </div>
               </div>

               <div className="space-y-4">
                  <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Items Ordered</h3>
                  <div className="border rounded-2xl overflow-hidden">
                     {selectedOrder.items.map((item: any) => (
                       <div key={item.id} className="flex justify-between items-center p-4 bg-muted/10 border-b last:border-0">
                          <div className="flex items-center gap-4">
                             <div className="w-12 h-12 rounded-xl overflow-hidden border bg-background">
                                {item.product?.image ? (
                                  <img src={item.product.image} className="w-full h-full object-cover" />
                                ) : (
                                  <ShoppingBag className="w-6 h-6 m-3 text-muted-foreground/30" />
                                )}
                             </div>
                             <div>
                                <p className="font-bold">{item.product?.name}</p>
                                <p className="text-xs text-muted-foreground">{item.quantity} x ${item.price.toFixed(2)}</p>
                             </div>
                          </div>
                          <p className="font-bold">${(item.quantity * item.price).toFixed(2)}</p>
                       </div>
                     ))}
                  </div>
               </div>

               <div className="bg-primary/5 p-6 rounded-3xl space-y-3">
                  <div className="flex justify-between text-sm">
                     <span className="text-muted-foreground">Subtotal</span>
                     <span className="font-bold">${(selectedOrder.totalPrice + selectedOrder.discount - selectedOrder.deliveryCharge).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                     <span className="text-muted-foreground">Delivery Charge</span>
                     <span className="font-bold">${selectedOrder.deliveryCharge.toFixed(2)}</span>
                  </div>
                  {selectedOrder.discount > 0 && (
                    <div className="flex justify-between text-sm text-green-600">
                       <span className="flex items-center gap-1">
                          Discount {selectedOrder.coupon?.code && `(${selectedOrder.coupon.code})`}
                       </span>
                       <span className="font-bold">-${selectedOrder.discount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-xl font-extrabold text-primary pt-3 border-t border-primary/10">
                     <span>Total Bill</span>
                     <span>${selectedOrder.totalPrice.toFixed(2)}</span>
                  </div>
               </div>
            </div>

            <div className="p-8 bg-muted/30 border-t flex justify-end gap-3">
               <button 
                 onClick={() => setSelectedOrder(null)}
                 className="px-6 py-3 bg-background border rounded-xl font-bold hover:bg-muted transition-all"
               >
                 Close
               </button>
               {selectedOrder.status === "PENDING" && (
                 <button 
                    onClick={() => {
                      updateStatus(selectedOrder.id, "ACCEPTED");
                      setSelectedOrder(null);
                    }}
                    className="px-6 py-3 bg-primary text-primary-foreground rounded-xl font-bold hover:scale-105 transition-all shadow-lg shadow-primary/20"
                 >
                    Accept Order
                 </button>
               )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

