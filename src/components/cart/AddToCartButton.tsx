"use client";

import { useCart, CartItem } from "./CartProvider";
import { Plus, Minus } from "lucide-react";

export default function AddToCartButton({ item }: { item: CartItem }) {
  const { items, addItem, removeItem } = useCart();
  
  const cartItem = items.find((i) => i.id === item.id);
  const quantity = cartItem?.quantity || 0;

  if (quantity > 0) {
    return (
      <div className="flex items-center gap-3 bg-primary text-primary-foreground rounded-full px-2 py-1 shadow-lg shadow-primary/20">
        <button
          onClick={() => {
            if (quantity === 1) {
              removeItem(item.id);
            } else {
              addItem({ ...item, quantity: -1 });
            }
          }}
          className="p-1 hover:bg-white/20 rounded-full transition-colors"
        >
          <Minus className="h-4 w-4" />
        </button>
        <span className="font-bold text-sm w-4 text-center">{quantity}</span>
        <button
          onClick={() => addItem({ ...item, quantity: 1 })}
          className="p-1 hover:bg-white/20 rounded-full transition-colors"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => addItem(item)}
      className="flex items-center gap-1 px-4 py-2 bg-primary text-primary-foreground rounded-full text-sm font-bold hover:scale-105 transition-transform shadow-lg shadow-primary/20"
    >
      <Plus className="h-4 w-4" /> Add
    </button>
  );
}

