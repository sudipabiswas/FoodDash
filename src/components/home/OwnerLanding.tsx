import Link from "next/link";
import { 
  BarChart3, 
  Package, 
  Settings, 
  MessageSquare, 
  TrendingUp, 
  ArrowRight,
  PlusCircle,
  LayoutDashboard,
  Clock,
  Star
} from "lucide-react";

interface OwnerLandingProps {
  stats: any[];
  recentOrders: any[];
  storeName: string;
}

export default function OwnerLanding({ stats, recentOrders, storeName }: OwnerLandingProps) {
  return (
    <div className="container mx-auto px-4 py-12 space-y-12">
      {/* Welcome Header */}
      <section className="flex flex-col md:flex-row justify-between items-center gap-6 bg-gradient-to-br from-primary to-purple-600 rounded-[3rem] p-12 text-white overflow-hidden relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-32 -mt-32" />
        <div className="z-10 space-y-4 text-center md:text-left">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">
            Welcome back, <br />
            <span className="text-white/90">{storeName}</span>
          </h1>
          <p className="text-lg opacity-90 max-w-md">
            Your restaurant is live! Manage your menu, track orders, and grow your business with FoodDash.
          </p>
          <div className="flex flex-wrap gap-4 pt-4 justify-center md:justify-start">
            <Link 
              href="/store-dashboard" 
              className="px-6 py-3 bg-white text-primary rounded-xl font-bold flex items-center gap-2 hover:scale-105 transition-transform"
            >
              <LayoutDashboard className="h-5 w-5" /> Go to Dashboard
            </Link>
            <Link 
              href="/store-dashboard/products" 
              className="px-6 py-3 bg-white/20 backdrop-blur-md text-white border border-white/30 rounded-xl font-bold flex items-center gap-2 hover:bg-white/30 transition-all"
            >
              <PlusCircle className="h-5 w-5" /> Add Product
            </Link>
          </div>
        </div>
        <div className="hidden lg:block z-10 animate-float">
           <div className="w-64 h-64 bg-white/20 backdrop-blur-xl rounded-[2.5rem] border-4 border-white/30 shadow-2xl flex items-center justify-center">
              <TrendingUp className="h-32 w-32 text-white/40" />
           </div>
        </div>
      </section>

      {/* Quick Stats Grid */}
      <section className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <Link 
            key={stat.name} 
            href={stat.link}
            className="p-8 rounded-3xl border bg-card hover:shadow-xl transition-all group"
          >
            <p className="text-sm font-medium text-muted-foreground mb-1">{stat.name}</p>
            <div className="flex items-end justify-between">
              <h3 className="text-3xl font-bold">{stat.value}</h3>
              <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                stat.growth.startsWith("+") ? "bg-green-100 text-green-600" : "bg-muted text-muted-foreground"
              }`}>
                {stat.growth}
              </span>
            </div>
          </Link>
        ))}
      </section>

      <div className="grid lg:grid-cols-3 gap-12">
        {/* Recent Orders Section */}
        <section className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Recent Orders</h2>
            <Link href="/store-dashboard/orders" className="text-primary font-bold text-sm flex items-center gap-1 hover:underline">
              View all <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          
          <div className="space-y-4">
            {recentOrders.length === 0 ? (
              <div className="p-12 text-center border rounded-3xl bg-muted/20 border-dashed">
                <p className="text-muted-foreground font-medium">No orders yet. Keep up the great work!</p>
              </div>
            ) : (
              recentOrders.map((order) => (
                <div key={order.id} className="p-6 rounded-2xl border bg-card hover:border-primary/20 transition-all flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                      <Package className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="font-bold">{order.customer?.name || "Customer"}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span>{new Date(order.createdAt).toLocaleDateString()}</span>
                        <span>•</span>
                        <span className="font-bold text-primary">${order.totalPrice.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-[10px] font-bold ${
                    order.status === "DELIVERED" ? "bg-green-100 text-green-600" : "bg-primary/10 text-primary"
                  }`}>
                    {order.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Management Shortcuts */}
        <section className="space-y-6">
          <h2 className="text-2xl font-bold">Management</h2>
          <div className="grid gap-4">
             {[
               { name: "Menu Management", icon: Package, link: "/store-dashboard/products", desc: "Add or update products" },
               { name: "Store Analytics", icon: BarChart3, link: "/store-dashboard/analytics", desc: "Detailed business insights" },
               { name: "Customer Reviews", icon: MessageSquare, link: "/store-dashboard/reviews", desc: "Respond to feedback" },
               { name: "Store Settings", icon: Settings, link: "/store-dashboard/settings", desc: "Update store profile" },
             ].map((item) => (
               <Link 
                 key={item.name} 
                 href={item.link}
                 className="flex items-center gap-4 p-5 rounded-2xl border bg-card hover:bg-muted/30 transition-all group"
               >
                 <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                    <item.icon className="h-5 w-5" />
                 </div>
                 <div className="flex-1">
                    <p className="font-bold text-sm">{item.name}</p>
                    <p className="text-xs text-muted-foreground">{item.desc}</p>
                 </div>
               </Link>
             ))}
          </div>
        </section>
      </div>

      {/* Owner Tip */}
      <section className="bg-muted/30 rounded-[2rem] p-8 border border-dashed flex items-center gap-6">
         <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center shadow-sm flex-shrink-0">
            <Star className="h-8 w-8 text-yellow-400 fill-yellow-400" />
         </div>
         <div>
            <h3 className="font-bold text-lg">Pro Tip: Keep your menu updated</h3>
            <p className="text-sm text-muted-foreground">Restaurants with high-quality photos and detailed descriptions get <span className="text-primary font-bold">40% more orders</span> on average.</p>
         </div>
      </section>
    </div>
  );
}
