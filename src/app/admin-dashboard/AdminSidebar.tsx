"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, Store, Users, Ticket, LogOut, Home, ArrowLeftRight } from "lucide-react";
import { signOut } from "next-auth/react";
import toast from "react-hot-toast";

export function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();

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

  const navItems = [
    { name: "Overview", href: "/admin-dashboard", icon: LayoutDashboard },
    { name: "Manage Stores", href: "/admin-dashboard/stores", icon: Store },
    { name: "Manage Users", href: "/admin-dashboard/users", icon: Users },
    { name: "Global Coupons", href: "/admin-dashboard/coupons", icon: Ticket },
  ];

  return (
    <aside className="w-64 border-r bg-card flex flex-col min-h-screen">
      <div className="h-16 border-b flex items-center px-6">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-xl font-black bg-gradient-to-r from-primary to-violet-600 bg-clip-text text-transparent tracking-tight">
            FoodDash Admin
          </span>
        </Link>
      </div>

      <nav className="flex-1 px-4 py-6 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 group relative ${
                isActive
                  ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <Icon className={`h-4 w-4 transition-transform duration-200 group-hover:scale-110 ${isActive ? "text-primary-foreground" : "text-muted-foreground group-hover:text-primary"}`} />
              <span>{item.name}</span>
              {isActive && (
                <span className="absolute right-3 w-1.5 h-1.5 bg-primary-foreground rounded-full" />
              )}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t space-y-2">
        <Link
          href="/"
          className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-muted-foreground hover:bg-muted hover:text-foreground transition-all"
        >
          <Home className="h-4 w-4" />
          <span>Customer Site</span>
        </Link>

        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all text-left"
        >
          <LogOut className="h-4 w-4" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
