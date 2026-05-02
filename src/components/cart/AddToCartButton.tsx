"use client";

import { useCart, CartItem } from "./CartProvider";
import { Plus } from "lucide-react";

export default function AddToCartButton({ item }: { item: CartItem }) {
  const { addItem } = useCart();

  return (
    <button
      onClick={() => addItem(item)}
      className="flex items-center gap-1 px-4 py-2 bg-primary text-primary-foreground rounded-full text-sm font-bold hover:scale-105 transition-transform shadow-lg shadow-primary/20"
    >
      <Plus className="h-4 w-4" /> Add
    </button>
  );
}
