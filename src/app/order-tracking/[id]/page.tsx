"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Clock, MapPin, Phone, MessageSquare, ChevronLeft } from "lucide-react";
import Link from "next/link";

export default function OrderTrackingPage({ params }: { params: { id: string } }) {
  const [progress, setProgress] = useState(65); // 0 to 100

  // Simulate movement
  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((prev) => (prev < 100 ? prev + 1 : 100));
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <Link href="/profile" className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors mb-8">
        <ChevronLeft className="h-4 w-4" /> Back to Orders
      </Link>

      <div className="space-y-8">
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">Track Order</h1>
            <p className="text-muted-foreground mt-1">Order #FS-1029 is on its way!</p>
          </div>
          <div className="text-right">
             <p className="text-sm font-bold text-primary">Estimated Arrival</p>
             <p className="text-2xl font-extrabold">12:45 PM</p>
          </div>
        </div>

        {/* Mock Map */}
        <div className="h-80 bg-muted rounded-[3rem] relative overflow-hidden border shadow-inner">
           {/* Grid Pattern */}
           <div className="absolute inset-0 opacity-20" 
                style={{ backgroundImage: 'radial-gradient(var(--foreground) 1px, transparent 1px)', backgroundSize: '30px 30px' }} />
           
           {/* Path */}
           <svg className="absolute inset-0 w-full h-full p-12">
              <path 
                d="M 50 200 Q 150 50 250 200 T 450 150" 
                fill="none" 
                stroke="var(--primary)" 
                strokeWidth="4" 
                strokeDasharray="10 10"
                className="opacity-20"
              />
              <path 
                d="M 50 200 Q 150 50 250 200 T 450 150" 
                fill="none" 
                stroke="var(--primary)" 
                strokeWidth="4" 
                strokeDasharray="500"
                strokeDashoffset={500 - (500 * progress / 100)}
                className="transition-all duration-1000 ease-linear"
              />
           </svg>

           {/* Store Icon */}
           <div className="absolute left-12 bottom-12 w-10 h-10 bg-card border-2 border-primary rounded-xl flex items-center justify-center shadow-lg">
              <ShoppingBag className="h-5 w-5 text-primary" />
           </div>

           {/* Delivery Man Icon (Moving) */}
           <div 
             className="absolute w-12 h-12 bg-primary text-primary-foreground rounded-full flex items-center justify-center shadow-2xl transition-all duration-1000 ease-linear z-10"
             style={{ 
               left: `${10 + progress * 0.7}%`, 
               top: `${60 - Math.sin(progress / 20) * 30}%` 
             }}
           >
              <div className="relative">
                 <div className="absolute -top-1 -right-1 w-3 h-3 bg-white rounded-full animate-ping" />
                 <Truck className="h-6 w-6" />
              </div>
           </div>

           {/* Customer Home */}
           <div className="absolute right-12 top-12 w-10 h-10 bg-card border-2 border-primary rounded-xl flex items-center justify-center shadow-lg">
              <MapPin className="h-5 w-5 text-primary" />
           </div>
        </div>

        {/* Status Timeline */}
        <div className="bg-card border rounded-[2.5rem] p-8 space-y-8">
           <div className="flex items-start gap-4">
              <div className="w-8 h-8 bg-green-100 text-green-600 rounded-full flex items-center justify-center flex-shrink-0">
                 <CheckCircle2 className="h-5 w-5" />
              </div>
              <div>
                 <p className="font-bold">Order Received</p>
                 <p className="text-sm text-muted-foreground">We've received your order and the restaurant is confirming.</p>
              </div>
           </div>
           
           <div className="flex items-start gap-4">
              <div className="w-8 h-8 bg-green-100 text-green-600 rounded-full flex items-center justify-center flex-shrink-0">
                 <CheckCircle2 className="h-5 w-5" />
              </div>
              <div>
                 <p className="font-bold">Preparing Your Meal</p>
                 <p className="text-sm text-muted-foreground">The chef is working their magic!</p>
              </div>
           </div>

           <div className="flex items-start gap-4 relative">
              <div className="absolute left-4 top-8 bottom-[-2rem] w-0.5 bg-muted" />
              <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center flex-shrink-0 animate-pulse">
                 <Clock className="h-5 w-5" />
              </div>
              <div>
                 <p className="font-bold text-primary">On the Way</p>
                 <p className="text-sm text-muted-foreground">Your delivery partner is headed to your location.</p>
              </div>
           </div>
        </div>

        {/* Delivery Partner Info */}
        <div className="bg-card border rounded-[2.5rem] p-6 flex items-center gap-6">
           <div className="w-16 h-16 bg-muted rounded-2xl" />
           <div className="flex-1">
              <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider">Your Courier</p>
              <h3 className="text-xl font-bold">Michael Scott</h3>
              <p className="text-sm text-muted-foreground">⭐ 4.9 (120+ deliveries)</p>
           </div>
           <div className="flex gap-2">
              <button className="p-4 bg-muted rounded-2xl hover:bg-muted/80 transition-colors">
                 <Phone className="h-5 w-5" />
              </button>
              <button className="p-4 bg-primary text-primary-foreground rounded-2xl hover:opacity-90 transition-opacity">
                 <MessageSquare className="h-5 w-5" />
              </button>
           </div>
        </div>
      </div>
    </div>
  );
}

function ShoppingBag({ className }: { className?: string }) {
  return (
    <svg 
      className={className} 
      xmlns="http://www.w3.org/2000/svg" 
      width="24" 
      height="24" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/>
    </svg>
  );
}

function Truck({ className }: { className?: string }) {
  return (
    <svg 
      className={className} 
      xmlns="http://www.w3.org/2000/svg" 
      width="24" 
      height="24" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><path d="M15 18H9"/><path d="M19 18h2a1 1 0 0 0 1-1v-5l-4-4h-3v10"/><circle cx="7" cy="18" r="2"/><circle cx="17" cy="18" r="2"/>
    </svg>
  );
}
