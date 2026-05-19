"use client";

import { useEffect, useState } from "react";
import { Users, Mail, UserCheck, Shield, ShoppingBag, Bike, Store, Loader2, Search } from "lucide-react";
import toast from "react-hot-toast";

interface UserWithCounts {
  id: string;
  name: string | null;
  email: string;
  role: string;
  createdAt: string;
  _count: {
    orders: number;
    deliveryOrders: number;
    stores: number;
    reviews: number;
  };
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserWithCounts[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<"ALL" | "CUSTOMER" | "STORE_OWNER" | "DELIVERY_MAN" | "ADMIN">("ALL");

  useEffect(() => {
    fetchUsers();
  }, []);

  async function fetchUsers() {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/users");
      if (!res.ok) throw new Error("Failed to load users");
      const data = await res.json();
      setUsers(data);
    } catch (err: any) {
      toast.error(err.message || "Could not retrieve user list.");
    } finally {
      setLoading(false);
    }
  }

  // Filter users
  const filteredUsers = users.filter(u => {
    const matchesSearch = (u.name && u.name.toLowerCase().includes(search.toLowerCase())) ||
      u.email.toLowerCase().includes(search.toLowerCase());

    if (roleFilter === "ALL") return matchesSearch;
    return matchesSearch && u.role === roleFilter;
  });

  const getRoleBadgeClass = (role: string) => {
    switch (role) {
      case "ADMIN":
        return "bg-red-500/10 text-red-600";
      case "STORE_OWNER":
        return "bg-purple-500/10 text-purple-600";
      case "DELIVERY_MAN":
        return "bg-amber-500/10 text-amber-600";
      default:
        return "bg-blue-500/10 text-blue-600";
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "ADMIN":
        return <Shield className="h-3.5 w-3.5" />;
      case "STORE_OWNER":
        return <Store className="h-3.5 w-3.5" />;
      case "DELIVERY_MAN":
        return <Bike className="h-3.5 w-3.5" />;
      default:
        return <UserCheck className="h-3.5 w-3.5" />;
    }
  };

  const formatRoleLabel = (role: string) => {
    return role.replace("_", " ");
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">User Account Directory</h1>
        <p className="text-muted-foreground mt-1">Monitor all registered customers, store operators, delivery riders, and administrators.</p>
      </div>

      {/* Filters Toolbar */}
      <div className="bg-card border rounded-3xl p-6 flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search users by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-muted/30 border rounded-xl focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm"
          />
        </div>

        {/* Role Filters Tab Buttons */}
        <div className="flex flex-wrap items-center gap-2 border p-1.5 bg-muted/20 rounded-xl">
          {(["ALL", "CUSTOMER", "STORE_OWNER", "DELIVERY_MAN", "ADMIN"] as const).map((role) => (
            <button
              key={role}
              onClick={() => setRoleFilter(role)}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                roleFilter === role
                  ? "bg-card text-foreground shadow-sm border"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {role === "ALL" ? "All Users" : formatRoleLabel(role)}
            </button>
          ))}
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-card border rounded-3xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-2">
            <Loader2 className="h-8 w-8 text-primary animate-spin" />
            <p className="text-muted-foreground text-sm">Retrieving users...</p>
          </div>
        ) : filteredUsers.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="border-b bg-muted/20 text-muted-foreground font-semibold">
                  <th className="px-6 py-4">User Details</th>
                  <th className="px-6 py-4">System Role</th>
                  <th className="px-6 py-4">Activity Stats</th>
                  <th className="px-6 py-4">Date Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredUsers.map((u) => (
                  <tr key={u.id} className="group hover:bg-muted/10 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-primary/10 text-primary border border-primary/20 flex items-center justify-center rounded-2xl font-bold uppercase group-hover:scale-105 transition-transform shrink-0">
                          {u.name ? u.name.slice(0, 2) : "US"}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-foreground truncate text-sm">{u.name || "Unnamed User"}</p>
                          <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Mail className="h-3 w-3 shrink-0" />
                            <span className="truncate">{u.email}</span>
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold ${getRoleBadgeClass(u.role)}`}>
                        {getRoleIcon(u.role)}
                        <span className="uppercase tracking-wider text-[10px] ml-0.5">{formatRoleLabel(u.role)}</span>
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                        {u.role === "CUSTOMER" && (
                          <span className="flex items-center gap-1 font-semibold text-foreground">
                            <ShoppingBag className="h-3.5 w-3.5 text-blue-500" />
                            {u._count.orders} orders
                          </span>
                        )}
                        {u.role === "DELIVERY_MAN" && (
                          <span className="flex items-center gap-1 font-semibold text-foreground">
                            <Bike className="h-3.5 w-3.5 text-amber-500" />
                            {u._count.deliveryOrders} deliveries
                          </span>
                        )}
                        {u.role === "STORE_OWNER" && (
                          <span className="flex items-center gap-1 font-semibold text-foreground">
                            <Store className="h-3.5 w-3.5 text-purple-500" />
                            {u._count.stores} stores managed
                          </span>
                        )}
                        {u._count.reviews > 0 && (
                          <span>{u._count.reviews} reviews written</span>
                        )}
                        {u._count.orders === 0 && u._count.deliveryOrders === 0 && u._count.stores === 0 && (
                          <span className="italic">No activities yet</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground text-xs font-medium">
                      {new Date(u.createdAt).toLocaleDateString(undefined, { 
                        year: "numeric", 
                        month: "short", 
                        day: "numeric" 
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-20 text-center text-muted-foreground space-y-2">
            <Users className="h-10 w-10 text-muted-foreground/30 mx-auto" />
            <p className="text-sm font-semibold">No users found</p>
            <p className="text-xs text-muted-foreground max-w-xs mx-auto">No account records match the selected role or search query.</p>
          </div>
        )}
      </div>
    </div>
  );
}
