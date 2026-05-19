import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { LayoutDashboard, Package, ShoppingBag, Settings, LogOut, User, BarChart3, Tag, MessageSquare } from "lucide-react";

import { StoreSidebar } from "./StoreSidebar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (session && (session.user as any).role === "ADMIN") {
    redirect("/admin-dashboard");
  }

  if (!session || (session.user as any).role !== "STORE_OWNER") {
    // redirect("/login");
    // For now, let's allow access for testing if not logged in
  }

  return (
    <div className="flex min-h-screen bg-muted/20">
      <StoreSidebar />

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
