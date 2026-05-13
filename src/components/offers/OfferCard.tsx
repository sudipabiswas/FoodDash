"use client";

import { Clock, Store as StoreIcon, Copy, Check } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import toast from "react-hot-toast";

export default function OfferCard({ offer, index }: { offer: any, index: number }) {
  const [copied, setCopied] = useState(false);
  const Icon = offer.icon;

  const handleCopy = () => {
    navigator.clipboard.writeText(offer.code);
    setCopied(true);
    toast.success(`Code ${offer.code} copied!`, {
      style: {
        borderRadius: '1rem',
        background: '#333',
        color: '#fff',
      },
    });
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div 
      className="bg-card border rounded-[2.5rem] p-8 space-y-6 hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 animate-in fade-in zoom-in-95 h-full flex flex-col"
      style={{ animationDelay: `${index * 100}ms`, animationFillMode: "both" }}
    >
      <div className="flex justify-between items-start">
         <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${offer.color}`}>
           <Icon className="h-8 w-8" />
         </div>
         {offer.storeName && (
           <div className="flex items-center gap-1 text-xs font-bold bg-muted px-3 py-1.5 rounded-full border">
              <StoreIcon className="h-3 w-3" />
              {offer.storeName}
           </div>
         )}
      </div>
      
      <div className="space-y-2 flex-1">
        <h3 className="text-2xl font-bold leading-tight">{offer.title}</h3>
        <p className="text-muted-foreground text-sm leading-relaxed">
          {offer.description}
        </p>
      </div>

      <div className="pt-4 border-t border-dashed space-y-4">
        <div className="flex items-center justify-between">
           <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Use Code</span>
           <button 
             onClick={handleCopy}
             className="flex items-center gap-2 px-3 py-1 bg-muted hover:bg-muted/80 rounded-lg font-mono font-bold text-sm border transition-colors group"
           >
              {offer.code}
              {copied ? <Check className="h-3 w-3 text-green-600" /> : <Copy className="h-3 w-3 text-muted-foreground group-hover:text-primary transition-colors" />}
           </button>
        </div>
        <div className="flex items-center justify-between text-xs font-medium">
           <span className="text-muted-foreground flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" /> {offer.expires}
           </span>
        </div>
      </div>

      <Link 
        href={offer.storeId ? `/stores/${offer.storeId}` : "/stores"} 
        className="block w-full py-4 bg-primary text-primary-foreground text-center rounded-2xl font-bold hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-primary/20 mt-4"
      >
         Shop Now
      </Link>
    </div>
  );
}
