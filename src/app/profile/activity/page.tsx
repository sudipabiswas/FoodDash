"use client";

import { useSession } from "next-auth/react";
import { Clock, ShoppingBag, Store, User, ChevronLeft } from "lucide-react";
import Link from "next/link";

export default function ActivityPage() {
  const { data: session } = useSession();
  const isStoreOwner = (session?.user as any)?.role === "STORE_OWNER";

  const activities = [
    { id: 1, type: "LOGIN", content: "Logged in from a new device in Dhaka, BD", time: "2 hours ago", icon: User, color: "text-blue-600", bg: "bg-blue-100" },
    { id: 2, type: "ORDER", content: isStoreOwner ? "Received a new order #2241 from John Doe" : "Placed a new order #2241 at Burger King", time: "5 hours ago", icon: ShoppingBag, color: "text-green-600", bg: "bg-green-100" },
    { id: 3, type: "PROFILE", content: "Updated profile picture and phone number", time: "1 day ago", icon: User, color: "text-purple-600", bg: "bg-purple-100" },
    { id: 4, type: "STORE", content: "Updated store opening hours for the weekend", time: "2 days ago", icon: Store, color: "text-orange-600", bg: "bg-orange-100", hidden: !isStoreOwner },
  ].filter((a: any) => !a.hidden);

  return (
    <div className="container mx-auto px-4 py-12 max-w-3xl">
      <div className="mb-8 flex items-center gap-4">
        <Link href="/profile" className="p-2 hover:bg-muted rounded-full transition-colors">
           <ChevronLeft className="h-6 w-6" />
        </Link>
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Recent Activity</h1>
          <p className="text-muted-foreground mt-1">Track your account and store actions.</p>
        </div>
      </div>

      <div className="bg-card border rounded-[2.5rem] overflow-hidden shadow-sm">
        <div className="divide-y">
           {activities.map((activity: any) => (
             <div key={activity.id} className="p-8 flex gap-6 hover:bg-muted/30 transition-colors">
                <div className={`w-12 h-12 ${activity.bg} ${activity.color} rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm`}>
                   <activity.icon className="h-6 w-6" />
                </div>
                <div className="space-y-1">
                   <p className="font-bold text-lg leading-tight">{activity.content}</p>
                   <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="h-3.5 w-3.5" />
                      {activity.time}
                   </div>
                </div>
             </div>
           ))}
        </div>
        
        <div className="p-8 bg-muted/20 text-center">
           <p className="text-sm text-muted-foreground">Showing activities from the last 30 days.</p>
        </div>
      </div>
    </div>
  );
}
