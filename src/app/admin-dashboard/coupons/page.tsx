"use client";

import { useEffect, useState } from "react";
import { Ticket, Percent, Calendar, Plus, RefreshCw, Loader2, Sparkles } from "lucide-react";
import toast from "react-hot-toast";

interface Coupon {
  id: string;
  code: string;
  discount: number;
  type: string;
  expiryDate: string;
  isActive: boolean;
}

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  // Form states
  const [code, setCode] = useState("");
  const [discount, setDiscount] = useState("");
  const [type, setType] = useState<"PERCENTAGE" | "FIXED">("PERCENTAGE");
  const [expiryDate, setExpiryDate] = useState("");

  useEffect(() => {
    fetchCoupons();
  }, []);

  async function fetchCoupons() {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/coupons");
      if (!res.ok) throw new Error("Failed to load global coupons");
      const data = await res.json();
      setCoupons(data);
    } catch (err: any) {
      toast.error(err.message || "Could not retrieve coupons.");
    } finally {
      setLoading(false);
    }
  }

  function generateCode() {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let randomString = "";
    for (let i = 0; i < 6; i++) {
      randomString += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    const prefix = type === "PERCENTAGE" ? "FDPERCENT" : "FDFIXED";
    setCode(`${prefix}${randomString}`);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!code || !discount || !expiryDate) {
      toast.error("Please fill in all coupon details");
      return;
    }

    try {
      setCreating(true);
      const res = await fetch("/api/admin/coupons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code,
          discount: parseFloat(discount),
          type,
          expiryDate,
        }),
      });

      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.error || "Failed to create coupon");
      }

      toast.success("Global coupon created successfully!");
      // Reset form
      setCode("");
      setDiscount("");
      setExpiryDate("");
      // Refresh list
      fetchCoupons();
    } catch (err: any) {
      toast.error(err.message || "Failed to create coupon.");
    } finally {
      setCreating(false);
    }
  }

  const isExpired = (expiry: string) => {
    return new Date(expiry) < new Date();
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">Global Discount Coupons</h1>
        <p className="text-muted-foreground mt-1">Manage system-wide promotional discount codes applicable to any restaurant orders.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Create Form */}
        <div className="bg-card border rounded-3xl p-6 h-fit space-y-6">
          <div>
            <h3 className="font-bold text-lg">Create Global Coupon</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Generate a new voucher code for customer promotions.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Type */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Coupon Type</label>
              <div className="grid grid-cols-2 gap-2 border p-1 bg-muted/20 rounded-xl">
                <button
                  type="button"
                  onClick={() => setType("PERCENTAGE")}
                  className={`py-2 rounded-lg text-xs font-bold transition-all ${
                    type === "PERCENTAGE" ? "bg-card text-foreground shadow-sm border" : "text-muted-foreground"
                  }`}
                >
                  Percentage (%)
                </button>
                <button
                  type="button"
                  onClick={() => setType("FIXED")}
                  className={`py-2 rounded-lg text-xs font-bold transition-all ${
                    type === "FIXED" ? "bg-card text-foreground shadow-sm border" : "text-muted-foreground"
                  }`}
                >
                  Fixed Amount ($)
                </button>
              </div>
            </div>

            {/* Code */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Voucher Code</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  required
                  placeholder="e.g. MEGAFD50"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  className="flex-1 px-4 py-3 bg-muted/30 border rounded-xl focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm font-mono font-bold uppercase tracking-wider"
                />
                <button
                  type="button"
                  onClick={generateCode}
                  className="p-3 bg-primary/10 border border-primary/20 text-primary hover:bg-primary/20 rounded-xl transition-all"
                  title="Auto Generate"
                >
                  <Sparkles className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Discount */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wide">
                Discount Value {type === "PERCENTAGE" ? "(%)" : "($)"}
              </label>
              <div className="relative">
                <input
                  type="number"
                  required
                  min="0.1"
                  step="any"
                  placeholder={type === "PERCENTAGE" ? "e.g. 15" : "e.g. 10.00"}
                  value={discount}
                  onChange={(e) => setDiscount(e.target.value)}
                  className="w-full px-4 py-3 bg-muted/30 border rounded-xl focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm"
                />
                <span className="absolute right-4 top-3.5 text-muted-foreground text-xs font-bold">
                  {type === "PERCENTAGE" ? "%" : "$"}
                </span>
              </div>
            </div>

            {/* Expiry */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Expiry Date</label>
              <div className="relative">
                <input
                  type="date"
                  required
                  min={new Date().toISOString().split("T")[0]}
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                  className="w-full px-4 py-3 bg-muted/30 border rounded-xl focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm"
                />
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={creating}
              className="w-full py-4 bg-primary text-primary-foreground font-bold rounded-xl hover:shadow-lg hover:shadow-primary/15 transition-all text-sm flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {creating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Creating...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4" /> Create Coupon
                </>
              )}
            </button>
          </form>
        </div>

        {/* Right Column: Existing list */}
        <div className="bg-card border rounded-3xl p-6 lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-lg">Active Global Vouchers</h3>
            <button 
              onClick={fetchCoupons}
              className="p-2 hover:bg-muted text-muted-foreground hover:text-foreground rounded-full transition-colors"
              title="Refresh List"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>

          <div className="overflow-x-auto">
            {loading ? (
              <div className="py-20 flex flex-col items-center justify-center gap-2">
                <Loader2 className="h-8 w-8 text-primary animate-spin" />
                <p className="text-muted-foreground text-sm">Retrieving coupons...</p>
              </div>
            ) : coupons.length > 0 ? (
              <table className="w-full text-sm text-left">
                <thead>
                  <tr className="border-b text-muted-foreground font-semibold">
                    <th className="pb-3">Code</th>
                    <th className="pb-3">Discount</th>
                    <th className="pb-3">Expires On</th>
                    <th className="pb-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {coupons.map((c) => {
                    const expired = isExpired(c.expiryDate);
                    return (
                      <tr key={c.id} className="group hover:bg-muted/10 transition-colors">
                        <td className="py-3.5 pr-2">
                          <div className="flex items-center gap-2">
                            <Ticket className="h-4 w-4 text-primary shrink-0" />
                            <span className="font-mono font-bold uppercase tracking-wider text-foreground text-sm">{c.code}</span>
                          </div>
                        </td>
                        <td className="py-3.5 pr-2 font-bold text-foreground">
                          {c.type === "PERCENTAGE" ? `${c.discount}% Off` : `$${c.discount.toFixed(2)} Off`}
                        </td>
                        <td className="py-3.5 pr-2 text-muted-foreground text-xs font-medium">
                          {new Date(c.expiryDate).toLocaleDateString(undefined, {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })}
                        </td>
                        <td className="py-3.5">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                            expired 
                              ? "bg-destructive/10 text-destructive" 
                              : "bg-emerald-500/10 text-emerald-600"
                          }`}>
                            <span className={`w-1 h-1 rounded-full ${expired ? "bg-destructive" : "bg-emerald-500"}`} />
                            {expired ? "Expired" : "Active"}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              <div className="py-20 text-center text-muted-foreground space-y-2">
                <Ticket className="h-10 w-10 text-muted-foreground/30 mx-auto" />
                <p className="text-sm font-semibold">No global coupons found</p>
                <p className="text-xs text-muted-foreground">Create a coupon in the left form to release a promotion system-wide.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
