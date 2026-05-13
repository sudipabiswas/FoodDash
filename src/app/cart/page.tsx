"use client";

import { useCart } from "@/components/cart/CartProvider";
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight, Percent, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function CartPage() {
  const { items, removeItem, addItem, totalPrice, clearCart } = useCart();
  const { data: session, status } = useSession();
  const router = useRouter();

  // Redirect if not authenticated
  if (status === "unauthenticated") {
    router.push("/login?callbackUrl=/cart");
    return null;
  }
  const [isOrdering, setIsOrdering] = useState(false);
  const [createdOrders, setCreatedOrders] = useState<any[]>([]);
  const [orderComplete, setOrderComplete] = useState(false);
  const [address, setAddress] = useState("");
  const [couponCode, setCouponCode] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("CASH");
  const [error, setError] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [availableCoupons, setAvailableCoupons] = useState<any[]>([]);

  useEffect(() => {
    const fetchCoupons = async () => {
      if (items.length === 0) return;
      const storeIds = Array.from(new Set(items.map((i: any) => i.storeId)));
      try {
        const res = await fetch("/api/coupons/applicable", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ storeIds }),
        });
        if (res.ok) {
          const data = await res.json();
          setAvailableCoupons(data);
        }
      } catch (err) {
        console.error("Failed to fetch coupons", err);
      }
    };
    fetchCoupons();
  }, [items]);

  const handleApplyCoupon = async (codeOverride?: string) => {
    const codeToUse = codeOverride || couponCode;
    if (!codeToUse) return;
    try {
      const res = await fetch("/api/coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          code: codeToUse, 
          storeIds: Array.from(new Set(items.map((i: any) => i.storeId))) 
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Invalid coupon");
      }
      const coupon = await res.json();
      setAppliedCoupon(coupon);
      setError("");
    } catch (err: any) {
      setError(err.message);
      setAppliedCoupon(null);
    }
  };

  const calculateDiscount = () => {
    if (!appliedCoupon) return 0;
    if (appliedCoupon.type === "PERCENTAGE") {
      return (totalPrice * appliedCoupon.discount) / 100;
    }
    return appliedCoupon.discount;
  };

  const discount = calculateDiscount();
  const finalTotal = totalPrice - discount;

  const handleCheckout = async () => {
    if (!address.trim()) {
      setError("Please provide a delivery address");
      return;
    }
    
    setIsOrdering(true);
    setError("");

    try {
      const response = await fetch("/api/user/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items,
          deliveryAddress: address,
          paymentMethod,
          couponCode,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to place order");
      }

      const orders = await response.json();
      setCreatedOrders(orders);
      setOrderComplete(true);
      clearCart();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsOrdering(false);
    }
  };

  if (orderComplete) {
    return (
      <div className="container mx-auto px-4 py-20 text-center max-w-2xl">
        <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
           <ShoppingBag className="h-10 w-10" />
        </div>
        <h1 className="text-4xl font-bold mb-4">Order Placed Successfully!</h1>
        <p className="text-muted-foreground mb-12 text-lg">
          Your order has been split into **{createdOrders.length}** separate orders because you ordered from multiple restaurants.
        </p>
        
        <div className="grid gap-4 mb-12">
          {createdOrders.map((order) => (
            <div key={order.id} className="p-6 bg-card border rounded-[2rem] flex flex-col sm:flex-row items-center justify-between gap-4">
               <div className="text-left">
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Order ID</p>
                  <p className="font-mono text-sm">#{order.id.slice(-8).toUpperCase()}</p>
               </div>
               <div className="text-right flex items-center gap-4">
                  <p className="font-extrabold text-primary text-xl">${order.totalPrice.toFixed(2)}</p>
                  <Link 
                    href={`/order-tracking/${order.id}`} 
                    className="px-6 py-2 bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground rounded-full text-sm font-bold transition-all"
                  >
                    Track Order
                  </Link>
               </div>
            </div>
          ))}
        </div>

        <Link href="/" className="px-12 py-4 bg-primary text-primary-foreground rounded-full font-bold text-lg shadow-xl shadow-primary/20 hover:scale-105 transition-all">
           Back to Home
        </Link>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <h1 className="text-4xl font-bold mb-4">Your cart is empty</h1>
        <p className="text-muted-foreground mb-8">Add some delicious food to get started!</p>
        <Link href="/stores" className="px-8 py-3 bg-primary text-primary-foreground rounded-full font-bold">
           Browse Restaurants
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-4xl font-bold mb-8 tracking-tight">Shopping Cart</h1>
      
      <div className="flex flex-col lg:flex-row gap-12">
        <div className="flex-1 space-y-8">
          {/* Cart Items */}
          <div className="space-y-4">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <ShoppingBag className="h-5 w-5" /> Your Items
            </h2>
            {items.map((item: any) => (
              <div key={item.id} className="flex items-center gap-6 p-6 rounded-3xl border bg-card hover:shadow-lg transition-all">
                <div className="w-24 h-24 bg-muted rounded-2xl flex-shrink-0 overflow-hidden border">
                   {item.image ? (
                     <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                   ) : (
                     <div className="w-full h-full flex items-center justify-center">
                        <ShoppingBag className="h-8 w-8 text-muted-foreground/30" />
                     </div>
                   )}
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold">{item.name}</h3>
                  <p className="text-primary font-bold text-lg mt-1">${item.price.toFixed(2)}</p>
                </div>
                <div className="flex items-center gap-4 bg-muted/50 p-2 rounded-full px-4 border">
                  <button 
                    onClick={() => removeItem(item.id)}
                    className="hover:text-primary transition-colors p-1"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="font-bold w-4 text-center">{item.quantity}</span>
                  <button 
                     onClick={() => addItem({ ...item, quantity: 1 })}
                     className="hover:text-primary transition-colors p-1"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Checkout Details */}
          <div className="grid md:grid-cols-2 gap-8">
             <div className="space-y-4">
                <h2 className="text-xl font-bold">Delivery Details</h2>
                <textarea
                  placeholder="Enter your full delivery address..."
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full h-32 p-4 rounded-2xl border bg-background focus:ring-2 focus:ring-primary/20 outline-none transition-all resize-none"
                />
             </div>
             
             <div className="space-y-4">
                <h2 className="text-xl font-bold">Payment Method</h2>
                <div className="grid gap-3">
                   {["CASH", "CARD"].map((method) => (
                     <label 
                       key={method} 
                       className={`flex items-center justify-between p-4 rounded-2xl border cursor-pointer transition-all ${
                         paymentMethod === method ? "bg-primary/5 border-primary text-primary" : "hover:bg-muted"
                       }`}
                     >
                       <div className="flex items-center gap-3">
                          <input 
                            type="radio" 
                            name="payment" 
                            value={method} 
                            checked={paymentMethod === method}
                            onChange={(e) => setPaymentMethod(e.target.value)}
                            className="w-4 h-4 accent-primary"
                          />
                          <span className="font-bold">{method === "CASH" ? "Cash on Delivery" : "Credit/Debit Card"}</span>
                       </div>
                     </label>
                   ))}
                </div>
             </div>
          </div>
        </div>

        {/* Order Summary */}
        <div className="lg:w-[400px]">
          <div className="rounded-[2.5rem] border p-8 sticky top-24 space-y-6 bg-card shadow-xl shadow-primary/5">
            <h2 className="text-2xl font-bold">Order Summary</h2>
            
            {/* Available Offers Section */}
            {availableCoupons.length > 0 && !appliedCoupon && (
              <div className="space-y-4 pt-4 border-t">
                 <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                   <Percent className="h-4 w-4" /> Available Offers
                 </h3>
                 <div className="flex flex-col gap-3">
                   {availableCoupons.map((coupon) => (
                     <button
                       key={coupon.id}
                       onClick={() => {
                         setCouponCode(coupon.code);
                         handleApplyCoupon(coupon.code);
                       }}
                       className="flex items-center justify-between p-4 rounded-2xl border border-dashed border-primary/30 bg-primary/5 hover:bg-primary/10 transition-all group text-left"
                     >
                       <div className="space-y-1">
                          <p className="font-bold text-primary flex items-center gap-2">
                             {coupon.code}
                             <span className="text-[10px] bg-primary text-primary-foreground px-2 py-0.5 rounded-full uppercase">
                               {coupon.store?.name || "Global"}
                             </span>
                          </p>
                          <p className="text-xs text-muted-foreground font-medium">
                            {coupon.type === "PERCENTAGE" ? `${coupon.discount}%` : `$${coupon.discount}`} off your order
                          </p>
                       </div>
                       <ChevronRight className="h-5 w-5 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                     </button>
                   ))}
                 </div>
              </div>
            )}

            {/* Coupon Code Input */}
            <div className="space-y-2 pt-4">
               <label className="text-sm font-bold text-muted-foreground">Have a coupon?</label>
               <div className="flex gap-2">
                  <input 
                    type="text"
                    placeholder="Enter code"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    className="flex-1 px-4 py-3 rounded-xl border bg-background focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                  />
                  <button 
                    onClick={handleApplyCoupon}
                    className="px-4 py-2 bg-muted hover:bg-primary hover:text-primary-foreground rounded-xl font-bold transition-all"
                  >
                    Apply
                  </button>
               </div>
               {appliedCoupon && (
                 <p className="text-xs text-green-600 font-bold">
                   Coupon applied: {appliedCoupon.discount}{appliedCoupon.type === "PERCENTAGE" ? "%" : "$"} off!
                 </p>
               )}
            </div>

            <div className="space-y-4 py-4 border-y border-dashed">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-bold">${totalPrice.toFixed(2)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Discount</span>
                  <span className="font-bold">-${discount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Delivery Fee</span>
                <span className="font-bold text-green-600">Free</span>
              </div>
              <div className="flex justify-between text-xl font-extrabold pt-2">
                <span>Total</span>
                <span className="text-primary">${finalTotal.toFixed(2)}</span>
              </div>
            </div>
            
            {error && (
              <p className="text-sm text-destructive font-medium bg-destructive/10 p-3 rounded-xl">
                {error}
              </p>
            )}

            <button 
              onClick={() => {
                if (!session) {
                  router.push("/login?callbackUrl=/cart");
                  return;
                }
                handleCheckout();
              }}
              disabled={isOrdering}
              className="w-full py-5 bg-primary text-primary-foreground rounded-2xl font-bold text-lg hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-xl shadow-primary/20"
            >
              {isOrdering ? "Processing Order..." : (
                <>
                  {!session ? "Login to Checkout" : "Place Order"} 
                  <ArrowRight className="h-5 w-5" />
                </>
              )}
            </button>
            
            <p className="text-xs text-center text-muted-foreground px-4">
              By placing your order, you agree to our terms and conditions.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
