"use client";

import { useState, useEffect, useRef } from "react";
import { Save, Store, Truck, Info, CheckCircle2, ImagePlus, Loader2, X } from "lucide-react";

export default function StoreSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadState, setUploadState] = useState<"idle" | "uploading" | "done" | "error">("idle");
  const [store, setStore] = useState({
    name: "",
    description: "",
    active: true,
    deliveryZone: "",
    deliveryCharge: 0,
    image: "",
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

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadState("uploading");
    try {
      // 1. Get a presigned URL from our API
      const res = await fetch(
        `/api/upload?filename=${encodeURIComponent(file.name)}&contentType=${encodeURIComponent(file.type)}`
      );
      if (!res.ok) throw new Error("Failed to get upload URL");
      const { signedUrl, publicUrl } = await res.json();

      // 2. PUT the file directly to R2
      const uploadRes = await fetch(signedUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      });
      if (!uploadRes.ok) throw new Error("Failed to upload to R2");

      // 3. Auto‑save the image to the DB and get the updated store back
      const patchRes = await fetch("/api/store", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: publicUrl }),
      });
      if (!patchRes.ok) throw new Error("Failed to save store image");
      const updatedStore = await patchRes.json();

      // 4. Update local state with the fresh data
      setStore(updatedStore);

      setUploadState("done");
      setTimeout(() => setUploadState("idle"), 3000);
    } catch (err) {
      console.error(err);
      setUploadState("error");
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
            
            <div className="space-y-6">
              {/* Logo Upload Section */}
              <div className="space-y-3">
                <label className="text-sm font-semibold text-muted-foreground">Restaurant Logo / Profile Image</label>
                <div className="flex items-center gap-6">
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="relative w-24 h-24 rounded-2xl border-2 border-dashed border-muted-foreground/20 hover:border-primary/40 bg-muted/20 hover:bg-primary/5 flex flex-col items-center justify-center cursor-pointer transition-all overflow-hidden group"
                  >
                    {store.image ? (
                      <img src={store.image} alt="Logo" className="w-full h-full object-cover" />
                    ) : (
                      <ImagePlus className="h-8 w-8 text-muted-foreground/40" />
                    )}
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <p className="text-[10px] text-white font-bold">Change</p>
                    </div>
                    {uploadState === "uploading" && (
                      <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-bold">Upload Logo</p>
                    <p className="text-xs text-muted-foreground">Recommend: 512x512px (JPG or PNG)</p>
                    {uploadState === "done" && <p className="text-[10px] text-green-600 font-bold">Image ready!</p>}
                    {uploadState === "error" && <p className="text-[10px] text-destructive font-bold">Upload failed</p>}
                  </div>
                  <input 
                    ref={fileInputRef}
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    onChange={handleImageChange}
                  />
                </div>
              </div>

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
