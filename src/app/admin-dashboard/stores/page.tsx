"use client";

import { useEffect, useState } from "react";
import { Store, User, Plus, Search, Filter, Power, Ban, CheckCircle, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

interface StoreWithOwner {
  id: string;
  name: string;
  description: string | null;
  active: boolean;
  latitude: number | null;
  longitude: number | null;
  address: string | null;
  createdAt: string;
  owner: {
    id: string;
    name: string | null;
    email: string;
  };
  _count: {
    products: number;
    orders: number;
  };
}

export default function AdminStoresPage() {
  const [stores, setStores] = useState<StoreWithOwner[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ACTIVE" | "SUSPENDED">("ALL");
  const [updatingStoreId, setUpdatingStoreId] = useState<string | null>(null);

  useEffect(() => {
    fetchStores();
  }, []);

  async function fetchStores() {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/stores");
      if (!res.ok) throw new Error("Failed to load stores");
      const data = await res.json();
      setStores(data);
    } catch (err: any) {
      toast.error(err.message || "Could not retrieve store list.");
    } finally {
      setLoading(false);
    }
  }

  async function toggleStoreStatus(storeId: string) {
    try {
      setUpdatingStoreId(storeId);
      const res = await fetch(`/api/admin/stores/${storeId}/toggle`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("Failed to toggle store status");
      const json = await res.json();
      
      // Update local state
      setStores(prev =>
        prev.map(s => (s.id === storeId ? { ...s, active: json.active } : s))
      );
      
      if (json.active) {
        toast.success(`${json.message || "Store approved!"}`, { icon: "✅" });
      } else {
        toast.success(`${json.message || "Store suspended!"}`, { icon: "⚠️" });
      }
    } catch (err: any) {
      toast.error(err.message || "Could not update status.");
    } finally {
      setUpdatingStoreId(null);
    }
  }

  // Filter stores
  const filteredStores = stores.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(search.toLowerCase()) ||
      (s.owner.name && s.owner.name.toLowerCase().includes(search.toLowerCase())) ||
      s.owner.email.toLowerCase().includes(search.toLowerCase()) ||
      (s.address && s.address.toLowerCase().includes(search.toLowerCase()));

    if (statusFilter === "ALL") return matchesSearch;
    if (statusFilter === "ACTIVE") return matchesSearch && s.active;
    if (statusFilter === "SUSPENDED") return matchesSearch && !s.active;
    return matchesSearch;
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Restaurant Management</h1>
          <p className="text-muted-foreground mt-1">Approve, monitor, or suspend food stores operating on FoodDash.</p>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-card border rounded-3xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search stores, owners, address..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-muted/30 border rounded-xl focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm"
          />
        </div>

        {/* Status Filter Tab Buttons */}
        <div className="flex items-center gap-2 border p-1.5 bg-muted/20 rounded-xl self-start md:self-auto">
          {(["ALL", "ACTIVE", "SUSPENDED"] as const).map((filter) => (
            <button
              key={filter}
              onClick={() => setStatusFilter(filter)}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                statusFilter === filter
                  ? "bg-card text-foreground shadow-sm border"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      {/* Stores Table Container */}
      <div className="bg-card border rounded-3xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-2">
            <Loader2 className="h-8 w-8 text-primary animate-spin" />
            <p className="text-muted-foreground text-sm">Retrieving stores...</p>
          </div>
        ) : filteredStores.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="border-b bg-muted/20 text-muted-foreground font-semibold">
                  <th className="px-6 py-4">Store Info</th>
                  <th className="px-6 py-4">Owner Info</th>
                  <th className="px-6 py-4">Inventory & Orders</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Joined Date</th>
                  <th className="px-6 py-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredStores.map((s) => (
                  <tr key={s.id} className="group hover:bg-muted/10 transition-colors">
                    <td className="px-6 py-4 max-w-xs">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-primary/10 rounded-2xl text-primary shrink-0 group-hover:scale-105 transition-transform">
                          <Store className="h-5 w-5" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-foreground truncate text-sm">{s.name}</p>
                          <p className="text-xs text-muted-foreground truncate">{s.address || "No address provided"}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground shrink-0" />
                        <div>
                          <p className="font-medium text-foreground text-sm">{s.owner.name || "N/A"}</p>
                          <p className="text-xs text-muted-foreground">{s.owner.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <p className="text-xs text-foreground font-medium">{s._count.products} products</p>
                        <p className="text-xs text-muted-foreground">{s._count.orders} orders processed</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                        s.active 
                          ? "bg-emerald-500/10 text-emerald-600" 
                          : "bg-destructive/10 text-destructive"
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${s.active ? "bg-emerald-500" : "bg-destructive"}`} />
                        {s.active ? "Active" : "Suspended"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground text-xs font-medium">
                      {new Date(s.createdAt).toLocaleDateString(undefined, { 
                        year: "numeric", 
                        month: "short", 
                        day: "numeric" 
                      })}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => toggleStoreStatus(s.id)}
                        disabled={updatingStoreId !== null}
                        className={`inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                          s.active
                            ? "bg-destructive/5 text-destructive border-destructive/20 hover:bg-destructive/10 hover:border-destructive/30"
                            : "bg-emerald-500/5 text-emerald-600 border-emerald-500/20 hover:bg-emerald-500/10 hover:border-emerald-500/30"
                        } disabled:opacity-50`}
                      >
                        {updatingStoreId === s.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : s.active ? (
                          <>
                            <Ban className="h-3.5 w-3.5" />
                            <span>Suspend</span>
                          </>
                        ) : (
                          <>
                            <CheckCircle className="h-3.5 w-3.5" />
                            <span>Approve</span>
                          </>
                        )}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-20 text-center text-muted-foreground space-y-2">
            <Store className="h-10 w-10 text-muted-foreground/30 mx-auto" />
            <p className="text-sm font-semibold">No stores found</p>
            <p className="text-xs text-muted-foreground max-w-xs mx-auto">No restaurant matches the current filter settings or search query.</p>
          </div>
        )}
      </div>
    </div>
  );
}
