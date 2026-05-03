import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { LayoutDashboard, Package, ShoppingBag, Settings, LogOut, User, BarChart3, Tag, MessageSquare } from "lucide-react";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session || (session.user as any).role !== "STORE_OWNER") {
    // redirect("/login");
    // For now, let's allow access for testing if not logged in
  }

  return (
    <div className="flex min-h-screen bg-muted/20">
      {/* Sidebar */}
      <aside className="w-64 bg-card border-r hidden md:flex flex-col">
        <div className="p-6">
          <Link href="/" className="text-2xl font-bold text-primary">FoodDash</Link>
          <p className="text-xs text-muted-foreground mt-1 font-medium">Store Manager</p>
        </div>
        
        <nav className="flex-1 px-4 space-y-2 mt-4">
          <Link href="/store-dashboard" className="flex items-center gap-3 px-4 py-3 rounded-xl bg-primary/10 text-primary font-bold">
            <LayoutDashboard className="h-5 w-5" /> Dashboard
          </Link>
          <Link href="/store-dashboard/orders" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-muted transition-colors font-medium text-muted-foreground">
            <ShoppingBag className="h-5 w-5" /> Orders
          </Link>
          <Link href="/store-dashboard/analytics" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-muted transition-colors font-medium text-muted-foreground">
            <BarChart3 className="h-5 w-5" /> Analytics
          </Link>
          <Link href="/store-dashboard/products" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-muted transition-colors font-medium text-muted-foreground">
            <Package className="h-5 w-5" /> Products
          </Link>
          <Link href="/store-dashboard/offers" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-muted transition-colors font-medium text-muted-foreground">
            <Tag className="h-5 w-5" /> Offers
          </Link>
          <Link href="/store-dashboard/settings" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-muted transition-colors font-medium text-muted-foreground">
            <Settings className="h-5 w-5" /> Settings
          </Link>
        </nav>

        <div className="p-4 border-t">
           <button className="flex items-center gap-3 px-4 py-3 w-full rounded-xl hover:bg-destructive/10 text-destructive transition-colors font-bold">
              <LogOut className="h-5 w-5" /> Logout
           </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col">
        <header className="h-16 border-b bg-card flex items-center justify-between px-8">
           <h2 className="font-bold text-lg">Store Dashboard</h2>
           <div className="flex items-center gap-4">
              <div className="text-right hidden sm:block">
                 <p className="text-sm font-bold">{session?.user?.name || "Store Owner"}</p>
                 <p className="text-xs text-muted-foreground uppercase tracking-tight font-medium">
                   {(session?.user as any)?.role?.replace("_", " ") || "Partner"}
                 </p>
              </div>
              <div className="w-10 h-10 rounded-full bg-primary/10 border flex items-center justify-center">
                 <User className="h-5 w-5 text-primary" />
              </div>
           </div>
        </header>
        <div className="p-8 overflow-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
