"use client";

import { useState, useEffect, useRef } from "react";
import { Save, Store, Truck, Info, CheckCircle2, ImagePlus, Loader2, MapPin, Search } from "lucide-react";
import dynamic from "next/dynamic";
import toast, { Toaster } from "react-hot-toast";

const MapLocationPicker = dynamic(() => import("@/components/map/MapLocationPicker"), { ssr: false });

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
    address: "",
    latitude: undefined as number | undefined,
    longitude: undefined as number | undefined,
    mainCategories: [] as string[],
  });

  // Track whether we have a confirmed pin (separate from the form store state)
  const [hasPinnedLocation, setHasPinnedLocation] = useState(false);
  const [geocodeStatus, setGeocodeStatus] = useState<"idle" | "searching" | "found" | "vague" | "notfound">("idle");
  const [flyToPosition, setFlyToPosition] = useState<[number, number] | null>(null);
  const geocodeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    fetchStore();
  }, []);

  const fetchStore = async () => {
    try {
      const res = await fetch("/api/store");
      const data = await res.json();
      if (res.ok) {
        setStore(data);
        if (data.latitude && data.longitude) {
          setHasPinnedLocation(true);
          setFlyToPosition([data.latitude, data.longitude]);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const geocodeAddress = async (address: string) => {
    if (address.trim().length < 5) return;
    setGeocodeStatus("searching");
    
    const performSearch = async (query: string) => {
      const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=5&addressdetails=1&countrycodes=bd`;
      const res = await fetch(url, { headers: { "Accept-Language": "en", "User-Agent": "FoodDash-App" } });
      if (!res.ok) throw new Error("Geocoding request failed");
      return await res.json();
    };

    const cleanAndNormalize = (addr: string): string => {
      // 1. Remove parentheses and everything inside them (e.g. Plus Codes)
      let cleaned = addr.replace(/\([^)]*\)/g, "").trim();
      
      // 2. Perform common spelling substitutions for Dhaka/Bangladesh context
      const replacements = [
        { regex: /\bdakkhin\b/gi, replacement: "dakshin" },
        { regex: /\bdokkhin\b/gi, replacement: "dakshin" },
        { regex: /\bdakhin\b/gi, replacement: "dakshin" },
        { regex: /\bmosjid\b/gi, replacement: "masjid" },
        { regex: /\bmosque\b/gi, replacement: "masjid" },
        { regex: /\buttorkhan\b/gi, replacement: "uttarkhan" },
        { regex: /\bdakkhinkhan\b/gi, replacement: "dakshinkhan" },
        { regex: /\bdokkhinkhan\b/gi, replacement: "dakshinkhan" }
      ];
      
      for (const r of replacements) {
        cleaned = cleaned.replace(r.regex, r.replacement);
      }
      
      return cleaned;
    };

    const generateFallbacks = (addr: string): string[] => {
      const candidates: string[] = [];
      const normalize = (str: string) => str.replace(/\s+/g, " ").trim();

      const baseAddress = cleanAndNormalize(addr);
      candidates.push(normalize(baseAddress));

      const parts = baseAddress.split(",").map(p => p.trim()).filter(Boolean);

      // Progressively drop parts from the left (more specific to more general)
      for (let i = 1; i < parts.length; i++) {
        candidates.push(normalize(parts.slice(i).join(", ")));
      }

      // Helper to clean individual parts
      const cleanTerm = (p: string) => {
        p = p.replace(/\bblock\s*-?\s*[a-z]\b/i, "");
        p = p.replace(/\b(sector|sec)\s*-?\s*\d+\b/i, "");
        p = p.replace(/\bhouse\s*-?\s*\d+\b/i, "");
        p = p.replace(/\bplot\s*-?\s*\d+\b/i, "");
        p = p.replace(/\b(east|west|north|south|purbo|paschim|uttar|dakshin)\s+/i, "");
        return p.trim();
      };

      // Clean terms and add those candidates
      const cleanedParts = parts.map(part => cleanTerm(part)).filter(Boolean);
      if (cleanedParts.length > 0) {
        const cleanedQuery = normalize(cleanedParts.join(", "));
        if (cleanedQuery !== baseAddress) {
          candidates.push(cleanedQuery);
          // Also progressively drop from left of the cleaned version
          for (let i = 1; i < cleanedParts.length; i++) {
            candidates.push(normalize(cleanedParts.slice(i).join(", ")));
          }
        }
      }

      // Ensure country is appended if not present
      const finalCandidates = candidates.map(c => {
        const lower = c.toLowerCase();
        if (!lower.includes("bangladesh")) {
          return `${c}, Bangladesh`;
        }
        return c;
      });

      // Filter out candidates that are too short or just "Dhaka, Bangladesh" or "Bangladesh"
      const filtered = finalCandidates.filter(c => {
        const clean = c.replace(/\b(bangladesh|dhaka)\b/gi, "").replace(/[\s,]+/g, "").trim();
        return clean.length > 2; // Must have some substance other than city/country
      });

      if (filtered.length === 0) {
        filtered.push(normalize(addr));
      }

      return [...new Set(filtered)];
    };

    try {
      const candidates = generateFallbacks(address);
      let results: any[] = [];
      let matchedCandidateIndex = -1;

      for (let i = 0; i < candidates.length; i++) {
        const query = candidates[i];
        try {
          const res = await performSearch(query);
          if (res && res.length > 0) {
            results = res;
            matchedCandidateIndex = i;
            break;
          }
        } catch (searchErr) {
          console.error(`Search failed for candidate "${query}":`, searchErr);
        }
        // Small delay if we need to try next candidate
        if (i < candidates.length - 1) {
          await new Promise(r => setTimeout(r, 600));
        }
      }

      if (!results || results.length === 0) {
        setGeocodeStatus("notfound");
        toast.error("Location not found. Try simplifying the address (e.g., Road 10, Vatara).", { icon: "📍" });
        return;
      }

      const best = results[0];
      const details = best.address || {};
      const importance = parseFloat(best.importance ?? "0");

      // Check for specific details to ensure precision
      const hasRoad = !!(details.road || details.street || details.pedestrian || details.cycleway || details.suburb);
      const hasCity = !!(details.city || details.town || details.village || details.state_district);

      console.log("Geocoding result:", { importance, hasRoad, hasCity, best, matchedCandidateIndex });

      // If we don't even have a road or a suburb, it's too vague
      if (!hasRoad && !hasCity) {
        setGeocodeStatus("vague");
        toast("Address found but too broad. Please pin your shop manually on the map for accuracy.", { icon: "⚠️", duration: 5000 });
        return;
      }

      const lat = parseFloat(best.lat);
      const lng = parseFloat(best.lon);
      setFlyToPosition([lat, lng]);
      setStore(prev => ({ ...prev, latitude: lat, longitude: lng }));
      setHasPinnedLocation(true);
      setGeocodeStatus("found");
      
      const locationLabel = best.display_name.split(",").slice(0, 2).join(", ");
      if (matchedCandidateIndex > 0) {
        toast.success(`Pinned near: ${locationLabel} (approximate location)`, { duration: 4000, icon: "📍" });
      } else {
        toast.success(`Pinned near: ${locationLabel}`, { duration: 3000 });
      }
    } catch (err) {
      console.error("Geocoding error:", err);
      setGeocodeStatus("idle");
      toast.error("Geocoding service unavailable. Please try again or pin manually.");
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
        const errorMsg = data.details 
          ? `${data.error}: ${data.details}${data.prismaError ? ` (${data.prismaError})` : ""}`
          : data.error || "Failed to update settings";
        setMessage(`Error: ${errorMsg}`);
      }
    } catch (err: any) {
      console.error("Submit error:", err);
      setMessage(`Error: ${err.message || "Failed to connect to server"}`);
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
                <label className="text-sm font-semibold text-muted-foreground">Shop Address</label>
                <div className="relative">
                  <input
                    type="text"
                    className="w-full px-4 py-3 pr-10 rounded-xl border bg-background focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                    value={store.address || ""}
                    onChange={(e) => {
                      const val = e.target.value;
                      setStore({ ...store, address: val });
                      setGeocodeStatus("idle");
                      // Debounced geocoding
                      if (geocodeTimer.current) clearTimeout(geocodeTimer.current);
                      if (val.trim().length >= 8) {
                        geocodeTimer.current = setTimeout(() => geocodeAddress(val), 800);
                      }
                    }}
                    placeholder="e.g. 123 Motijheel, Dhaka, Bangladesh"
                  />
                  <div className="absolute right-3 top-3.5 flex items-center gap-2">
                    {geocodeStatus === "searching" && (
                      <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    )}
                    {geocodeStatus === "found" && (
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                    )}
                    {(geocodeStatus === "vague" || geocodeStatus === "notfound") && (
                      <span className="text-amber-500 text-xs font-bold">?</span>
                    )}
                    {geocodeStatus === "idle" && store.address && (
                      <button 
                        type="button"
                        onClick={() => geocodeAddress(store.address)}
                        className="p-0.5 hover:bg-muted rounded-md transition-colors"
                        title="Search location"
                      >
                        <Search className="h-4 w-4 text-primary" />
                      </button>
                    )}
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">Type your address — the map will automatically find and pin it.</p>
              </div>
              
              <div className="space-y-4">
                <label className="text-sm font-semibold text-muted-foreground">Restaurant Categories (Select all that apply)</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {["Burgers", "Pizza", "Sushi", "Desserts", "Coffee", "Healthy"].map(cat => (
                    <label 
                      key={cat} 
                      className={`flex items-center gap-2 p-3 rounded-xl border cursor-pointer transition-all ${
                        store.mainCategories?.includes(cat) 
                          ? "bg-primary/10 border-primary text-primary" 
                          : "bg-background hover:bg-muted"
                      }`}
                    >
                      <input
                        type="checkbox"
                        className="w-4 h-4 accent-primary"
                        checked={store.mainCategories?.includes(cat)}
                        onChange={(e) => {
                          const current = store.mainCategories || [];
                          if (e.target.checked) {
                            setStore({ ...store, mainCategories: [...current, cat] });
                          } else {
                            setStore({ ...store, mainCategories: current.filter(c => c !== cat) });
                          }
                        }}
                      />
                      <span className="text-sm font-medium">{cat}</span>
                    </label>
                  ))}
                </div>
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

        {/* Shop Location Card */}
        <div className="bg-card border rounded-3xl p-8 space-y-6">
          <div className="flex items-center gap-2 mb-2">
            <MapPin className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-bold">Shop Location</h2>
          </div>
          <p className="text-sm text-muted-foreground -mt-2">
            Pin your restaurant on the map so riders can navigate directly to you for order pickups.
          </p>

          {/* Coordinates display */}
          {hasPinnedLocation && store.latitude && store.longitude ? (
            <div className="flex items-center gap-3 px-4 py-3 bg-green-50 border border-green-200 rounded-2xl">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <p className="text-sm font-semibold text-green-700">
                Location pinned: {store.latitude.toFixed(5)}, {store.longitude.toFixed(5)}
              </p>
              <button
                type="button"
                onClick={() => { setStore({ ...store, latitude: undefined, longitude: undefined }); setHasPinnedLocation(false); }}
                className="ml-auto text-xs text-red-500 font-bold hover:underline"
              >
                Clear
              </button>
            </div>
          ) : (
            <div className="px-4 py-3 bg-amber-50 border border-amber-200 rounded-2xl flex items-center gap-3">
              <Info className="h-4 w-4 text-amber-500 flex-shrink-0" />
              <p className="text-xs text-amber-700 font-medium">No location pinned yet. Click anywhere on the map below to set your shop location.</p>
            </div>
          )}

          <div className="h-72 rounded-2xl overflow-hidden border-2 border-dashed border-muted-foreground/20 z-0">
            <MapLocationPicker
              initialPosition={
                store.latitude && store.longitude
                  ? [store.latitude, store.longitude]
                  : [23.8103, 90.4125]
              }
              flyToPosition={flyToPosition}
              onLocationSelect={(lat, lng) => {
                setStore({ ...store, latitude: lat, longitude: lng });
                setHasPinnedLocation(true);
              }}
            />
          </div>
        </div>

        <Toaster position="top-center" />

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
