"use client";

import { useCart } from "@/components/cart/CartProvider";
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export default function CartPage() {
  const { items, removeItem, addItem, totalPrice, clearCart } = useCart();
  const [isOrdering, setIsOrdering] = useState(false);
  const [orderComplete, setOrderComplete] = useState(false);

  const handleCheckout = async () => {
    setIsOrdering(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setIsOrdering(false);
    setOrderComplete(true);
    clearCart();
  };

  if (orderComplete) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
           <ShoppingBag className="h-10 w-10" />
        </div>
        <h1 className="text-4xl font-bold mb-4">Order Placed Successfully!</h1>
        <p className="text-muted-foreground mb-8 text-lg">Your food is being prepared and will be with you shortly.</p>
        <Link href="/" className="px-8 py-3 bg-primary text-primary-foreground rounded-full font-bold">
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
      <h1 className="text-4xl font-bold mb-8">Shopping Cart</h1>
      
      <div className="flex flex-col lg:flex-row gap-12">
        <div className="flex-1 space-y-6">
          {items.map((item) => (
            <div key={item.id} className="flex items-center gap-6 p-6 rounded-2xl border bg-card">
              <div className="w-24 h-24 bg-muted rounded-xl flex-shrink-0" />
              <div className="flex-1">
                <h3 className="text-xl font-bold">{item.name}</h3>
                <p className="text-primary font-bold text-lg mt-1">${item.price.toFixed(2)}</p>
              </div>
              <div className="flex items-center gap-4 bg-muted/50 p-2 rounded-full px-4">
                <button 
                  onClick={() => removeItem(item.id)}
                  className="hover:text-primary"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="font-bold w-4 text-center">{item.quantity}</span>
                <button 
                   onClick={() => addItem({ ...item, quantity: 1 })}
                   className="hover:text-primary"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              <button 
                onClick={() => removeItem(item.id)}
                className="p-2 text-destructive hover:bg-destructive/10 rounded-full transition-colors"
              >
                <Trash2 className="h-5 w-5" />
              </button>
            </div>
          ))}
        </div>

        <div className="lg:w-[400px]">
          <div className="rounded-3xl border p-8 sticky top-24 space-y-6 bg-card">
            <h2 className="text-2xl font-bold">Order Summary</h2>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-medium">${totalPrice.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Delivery Fee</span>
                <span className="font-medium text-green-600">Free</span>
              </div>
              <div className="border-t pt-4 flex justify-between">
                <span className="text-xl font-bold">Total</span>
                <span className="text-xl font-bold text-primary">${totalPrice.toFixed(2)}</span>
              </div>
            </div>
            
            <button 
              onClick={handleCheckout}
              disabled={isOrdering}
              className="w-full py-4 bg-primary text-primary-foreground rounded-2xl font-bold text-lg hover:shadow-xl hover:shadow-primary/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isOrdering ? "Processing..." : (
                <>Place Order <ArrowRight className="h-5 w-5" /></>
              )}
            </button>
            
            <p className="text-xs text-center text-muted-foreground">
              By placing your order, you agree to our Terms of Service and Privacy Policy.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
