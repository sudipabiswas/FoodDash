"use client";

import { useCart } from "./CartProvider";
import { ShoppingBag, ArrowRight, Minus, Plus, Trash2, CreditCard, Banknote } from "lucide-react";
import { useState } from "react";
import Link from "next/link";

export default function StoreSideCart({ storeId, storeName, deliveryCharge }: { storeId: string, storeName: string, deliveryCharge: number }) {
  const { items, totalPrice, addItem, removeItem, clearCart } = useCart();
  const [isOrdering, setIsOrdering] = useState(false);
  const [orderComplete, setOrderComplete] = useState(false);
  const [address, setAddress] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("CASH");
  const [couponCode, setCouponCode] = useState("");
  const [error, setError] = useState("");

  const storeItems = items.filter(item => item.storeId === storeId);
  const subtotal = storeItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  if (storeItems.length === 0) return null;

  const handleCheckout = async () => {
    if (!address.trim()) {
      setError("Delivery address is required");
      return;
    }

    setIsOrdering(true);
    setError("");

    try {
      const response = await fetch("/api/user/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: storeItems,
          storeId,
          deliveryAddress: address,
          paymentMethod,
          couponCode,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to place order");
      }

      setOrderComplete(true);
      // Only clear items for THIS store
      storeItems.forEach(item => removeItem(item.id));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsOrdering(false);
    }
  };

  if (orderComplete) {
    return (
      <div className="bg-card border rounded-[2rem] p-8 text-center animate-in fade-in zoom-in duration-300 shadow-2xl">
        <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
           <ShoppingBag className="h-8 w-8" />
        </div>
        <h3 className="text-2xl font-bold mb-2">Order Placed!</h3>
        <p className="text-sm text-muted-foreground mb-6">Your order for {storeName} has been received.</p>
        <button 
          onClick={() => setOrderComplete(false)}
          className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-bold"
        >
          Done
        </button>
      </div>
    );
  }

  return (
    <div className="bg-card border rounded-[2rem] p-6 sticky top-24 shadow-xl flex flex-col gap-6 max-h-[calc(100vh-120px)] overflow-y-auto">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <ShoppingBag className="h-5 w-5 text-primary" /> Your Cart
        </h2>
        <span className="bg-primary/10 text-primary text-xs font-bold px-2 py-1 rounded-full">
          {storeItems.length} Items
        </span>
      </div>

      <div className="space-y-4 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
        {storeItems.map((item) => (
          <div key={item.id} className="flex items-center gap-3">
            <div className="flex-1">
              <p className="text-sm font-bold truncate">{item.name}</p>
              <p className="text-xs text-primary font-bold">${item.price.toFixed(2)}</p>
            </div>
            <div className="flex items-center gap-2 bg-muted/50 px-2 py-1 rounded-full border">
              <button onClick={() => {
                if (item.quantity === 1) removeItem(item.id);
                else addItem({ ...item, quantity: -1 });
              }} className="p-1 hover:text-primary transition-colors">
                <Minus className="h-3 w-3" />
              </button>
              <span className="text-xs font-bold w-3 text-center">{item.quantity}</span>
              <button onClick={() => addItem({ ...item, quantity: 1 })} className="p-1 hover:text-primary transition-colors">
                <Plus className="h-3 w-3" />
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="space-y-4 border-t pt-6">
        <div className="space-y-2">
          <label className="text-xs font-bold text-muted-foreground ml-1">Delivery Address</label>
          <input 
            type="text" 
            placeholder="Enter address..."
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border bg-muted/30 text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold text-muted-foreground ml-1">Payment Method</label>
          <div className="grid grid-cols-2 gap-2">
            <button 
              onClick={() => setPaymentMethod("CASH")}
              className={`flex items-center justify-center gap-2 py-2 rounded-xl border text-xs font-bold transition-all ${
                paymentMethod === "CASH" ? "bg-primary text-primary-foreground border-primary" : "bg-muted/30 hover:bg-muted"
              }`}
            >
              <Banknote className="h-3 w-3" /> Cash
            </button>
            <button 
              onClick={() => setPaymentMethod("CARD")}
              className={`flex items-center justify-center gap-2 py-2 rounded-xl border text-xs font-bold transition-all ${
                paymentMethod === "CARD" ? "bg-primary text-primary-foreground border-primary" : "bg-muted/30 hover:bg-muted"
              }`}
            >
              <CreditCard className="h-3 w-3" /> Card
            </button>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold text-muted-foreground ml-1">Coupon Code (Optional)</label>
          <input 
            type="text" 
            placeholder="e.g. SAVE10"
            value={couponCode}
            onChange={(e) => setCouponCode(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border bg-muted/30 text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
          />
        </div>
      </div>

      <div className="space-y-2 border-t pt-4">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Subtotal</span>
          <span className="font-bold">${subtotal.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Delivery</span>
          <span className="font-bold text-green-600">${deliveryCharge.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-lg font-extrabold text-primary pt-1">
          <span>Total</span>
          <span>${(subtotal + deliveryCharge).toFixed(2)}</span>
        </div>
      </div>

      {error && (
        <p className="text-xs text-destructive font-bold bg-destructive/10 p-3 rounded-xl">
          {error}
        </p>
      )}

      <button 
        onClick={handleCheckout}
        disabled={isOrdering}
        className="w-full py-4 bg-primary text-primary-foreground rounded-2xl font-extrabold flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-primary/20 disabled:opacity-50"
      >
        {isOrdering ? "Ordering..." : (
          <>Place Order <ArrowRight className="h-4 w-4" /></>
        )}
      </button>
    </div>
  );
}
