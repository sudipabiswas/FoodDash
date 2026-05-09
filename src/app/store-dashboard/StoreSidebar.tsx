"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Package, ShoppingBag, Settings, LogOut, BarChart3, Tag } from "lucide-react";
import { signOut } from "next-auth/react";

export function StoreSidebar() {
  const pathname = usePathname();

  const handleLogout = async () => {
    try {
      await Promise.race([
        signOut({ redirect: false }),
        new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), 2000))
      ]);
    } catch (error) {
      console.error("Logout failed or timed out:", error);
    }
    window.location.href = window.location.origin + '/login';
  };

  const links = [
    { href: "/store-dashboard", label: "Dashboard", icon: LayoutDashboard, exact: true },
    { href: "/store-dashboard/orders", label: "Orders", icon: ShoppingBag },
    { href: "/store-dashboard/analytics", label: "Analytics", icon: BarChart3 },
    { href: "/store-dashboard/products", label: "Products", icon: Package },
    { href: "/store-dashboard/offers", label: "Offers", icon: Tag },
    { href: "/store-dashboard/settings", label: "Settings", icon: Settings },
  ];

  return (
    <aside className="w-64 bg-card border-r hidden md:flex flex-col">
      <div className="p-6">
        <Link href="/" className="text-2xl font-bold text-primary">FoodDash</Link>
        <p className="text-xs text-muted-foreground mt-1 font-medium">Store Manager</p>
      </div>
      
      <nav className="flex-1 px-4 space-y-2 mt-4">
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = link.exact 
            ? pathname === link.href 
            : pathname?.startsWith(link.href);

          return (
            <Link 
              key={link.href}
              href={link.href} 
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                isActive 
                  ? "bg-primary/10 text-primary font-bold" 
                  : "hover:bg-muted font-medium text-muted-foreground"
              }`}
            >
              <Icon className="h-5 w-5" /> {link.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t">
         <button 
           onClick={handleLogout}
           className="flex items-center gap-3 px-4 py-3 w-full rounded-xl hover:bg-destructive/10 text-destructive transition-colors font-bold"
         >
            <LogOut className="h-5 w-5" /> Logout
         </button>
      </div>
    </aside>
  );
}
