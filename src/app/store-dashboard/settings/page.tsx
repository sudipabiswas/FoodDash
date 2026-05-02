"use client";

import { useState, useEffect } from "react";
import { Save, Store, Truck, Info, CheckCircle2 } from "lucide-react";

export default function StoreSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [store, setStore] = useState({
    name: "",
    description: "",
    active: true,
    deliveryZone: "",
    deliveryCharge: 0,
  });

  useEffect(() => {
    fetchStore();
  }, []);

  const fetchStore = async () => {
    try {
      const res = await fetch("/api/store");
      const data = await res.json();
      if (res.ok) {
        setStore(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage("");

    try {
      const res = await fetch("/api/store", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(store),
      });

      if (res.ok) {
        setMessage("Store settings updated successfully!");
        setTimeout(() => setMessage(""), 3000);
      } else {
        const data = await res.json();
        setMessage(`Error: ${data.error}`);
      }
    } catch (err) {
      setMessage("Failed to update settings");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">Store Settings</h1>
        <p className="text-muted-foreground mt-1">Manage your restaurant's profile and delivery preferences.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="grid md:grid-cols-2 gap-8">
          {/* General Information */}
          <div className="bg-card border rounded-3xl p-8 space-y-6">
            <div className="flex items-center gap-2 mb-2">
              <Store className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-bold">General Info</h2>
            </div>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-muted-foreground">Restaurant Name</label>
                <input
                  type="text"
                  required
                  className="w-full px-4 py-3 rounded-xl border bg-background focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                  value={store.name}
                  onChange={(e) => setStore({ ...store, name: e.target.value })}
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-semibold text-muted-foreground">Description</label>
                <textarea
                  className="w-full px-4 py-3 rounded-xl border bg-background focus:ring-2 focus:ring-primary/20 outline-none transition-all min-h-[120px]"
                  value={store.description || ""}
                  onChange={(e) => setStore({ ...store, description: e.target.value })}
                  placeholder="Tell customers about your restaurant..."
                />
              </div>

              <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-2xl">
                 <input
                   type="checkbox"
                   id="active-toggle"
                   className="w-5 h-5 accent-primary"
                   checked={store.active}
                   onChange={(e) => setStore({ ...store, active: e.target.checked })}
                 />
                 <label htmlFor="active-toggle" className="text-sm font-bold cursor-pointer select-none">
                    Accepting Orders (Store Active)
                 </label>
              </div>
            </div>
          </div>

          {/* Delivery Settings */}
          <div className="bg-card border rounded-3xl p-8 space-y-6">
            <div className="flex items-center gap-2 mb-2">
              <Truck className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-bold">Delivery</h2>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-muted-foreground">Delivery Zone</label>
                <input
                  type="text"
                  className="w-full px-4 py-3 rounded-xl border bg-background focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                  placeholder="e.g. 5km radius, Downtown"
                  value={store.deliveryZone || ""}
                  onChange={(e) => setStore({ ...store, deliveryZone: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-muted-foreground">Delivery Charge ($)</label>
                <div className="relative">
                   <span className="absolute left-4 top-3 text-muted-foreground font-bold">$</span>
                   <input
                     type="number"
                     step="0.01"
                     className="w-full pl-8 pr-4 py-3 rounded-xl border bg-background focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                     value={store.deliveryCharge}
                     onChange={(e) => setStore({ ...store, deliveryCharge: parseFloat(e.target.value) })}
                   />
                </div>
              </div>

              <div className="p-4 bg-primary/5 rounded-2xl border border-primary/10 flex gap-3">
                 <Info className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                 <p className="text-xs text-muted-foreground leading-relaxed">
                   Set your delivery charge according to your average distance. Customers will see this price at checkout.
                 </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between pt-4">
           {message && (
             <div className={`flex items-center gap-2 text-sm font-bold ${message.includes("Error") ? "text-destructive" : "text-green-600"} animate-in fade-in`}>
                <CheckCircle2 className="h-5 w-5" />
                {message}
             </div>
           )}
           <button
             type="submit"
             disabled={saving}
             className="ml-auto px-8 py-4 bg-primary text-primary-foreground rounded-2xl font-bold hover:shadow-xl hover:shadow-primary/20 transition-all flex items-center gap-2 disabled:opacity-50"
           >
             {saving ? "Saving Changes..." : <><Save className="h-5 w-5" /> Save Store Settings</>}
           </button>
        </div>
      </form>
    </div>
  );
}
