"use client";

import { useState, useEffect } from "react";
import { Tag, Plus, Trash2, X, Percent, DollarSign, Calendar } from "lucide-react";

export default function StoreOffersPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newCoupon, setNewCoupon] = useState({
    code: "",
    discount: "",
    type: "PERCENTAGE",
    expiryDate: "",
  });
  const [error, setError] = useState("");

  useEffect(() => {
    fetchOffers();
  }, []);

  const fetchOffers = async () => {
    try {
      const res = await fetch("/api/store/offers");
      const json = await res.json();
      if (res.ok) setData(json);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddOffer = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      const res = await fetch("/api/store/offers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...newCoupon, storeId: data.storeId }),
      });
      const json = await res.json();
      if (res.ok) {
        setShowAddModal(false);
        setNewCoupon({ code: "", discount: "", type: "PERCENTAGE", expiryDate: "" });
        fetchOffers();
      } else {
        setError(json.error || "Failed to create coupon");
      }
    } catch (err) {
      setError("An unexpected error occurred");
    }
  };

  const deleteOffer = async (id: string) => {
    if (!confirm("Are you sure you want to delete this offer?")) return;
    try {
      await fetch(`/api/store/offers?id=${id}`, { method: "DELETE" });
      fetchOffers();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Promotional Offers</h1>
          <p className="text-muted-foreground mt-1">Manage discount codes and promotions for your customers.</p>
        </div>
        
        <button 
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-2xl font-bold hover:shadow-xl hover:shadow-primary/20 transition-all"
        >
          <Plus className="h-5 w-5" /> Create Offer
        </button>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {data?.coupons?.length === 0 ? (
           <div className="col-span-full py-20 text-center space-y-4 border-2 border-dashed rounded-[3rem]">
              <Tag className="h-12 w-12 text-muted-foreground mx-auto opacity-20" />
              <p className="text-muted-foreground font-medium">No active offers. Create a discount code to attract more customers!</p>
           </div>
        ) : (
          data?.coupons?.map((coupon: any) => (
            <div key={coupon.id} className="bg-card border rounded-[2.5rem] p-6 space-y-6 relative overflow-hidden group hover:shadow-xl transition-all">
               <div className="absolute top-0 right-0 -mr-4 -mt-4 w-24 h-24 bg-primary/5 rounded-full blur-xl group-hover:bg-primary/10 transition-colors"></div>
               
               <div className="flex justify-between items-start relative z-10">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${coupon.type === 'PERCENTAGE' ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-600'}`}>
                     {coupon.type === 'PERCENTAGE' ? <Percent className="h-6 w-6" /> : <DollarSign className="h-6 w-6" />}
                  </div>
                  <button 
                     onClick={() => deleteOffer(coupon.id)}
                     className="p-2 text-muted-foreground hover:bg-destructive hover:text-white rounded-xl transition-all"
                  >
                     <Trash2 className="h-4 w-4" />
                  </button>
               </div>
               
               <div className="space-y-1 relative z-10">
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Code</p>
                  <h3 className="text-2xl font-extrabold tracking-tight">{coupon.code}</h3>
               </div>

               <div className="pt-4 border-t border-dashed flex justify-between items-end relative z-10">
                  <div>
                     <p className="text-sm font-bold text-primary">
                        {coupon.type === 'PERCENTAGE' ? `${coupon.discount}% OFF` : `$${coupon.discount.toFixed(2)} OFF`}
                     </p>
                     <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                        <Calendar className="h-3 w-3" /> 
                        {new Date(coupon.expiryDate).toLocaleDateString()}
                     </p>
                  </div>
                  <span className={`px-2 py-1 text-[10px] font-bold rounded-md ${new Date(coupon.expiryDate) > new Date() ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                     {new Date(coupon.expiryDate) > new Date() ? 'ACTIVE' : 'EXPIRED'}
                  </span>
               </div>
            </div>
          ))
        )}
      </div>

      {/* Add Offer Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-300">
           <div className="bg-card border w-full max-w-md rounded-[2.5rem] shadow-2xl p-10 space-y-8 animate-in zoom-in-95 duration-300">
              <div className="flex justify-between items-center">
                 <h2 className="text-2xl font-extrabold">New Offer</h2>
                 <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-muted rounded-full transition-colors">
                    <X className="h-6 w-6" />
                 </button>
              </div>

              {error && (
                <div className="p-4 bg-destructive/10 text-destructive text-sm font-bold rounded-xl">
                  {error}
                </div>
              )}

              <form onSubmit={handleAddOffer} className="space-y-6">
                 <div className="space-y-4">
                    <div className="space-y-2">
                       <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest px-1">Coupon Code</label>
                       <input
                          type="text"
                          required
                          className="w-full px-4 py-3 rounded-xl border bg-muted/30 focus:ring-2 focus:ring-primary/20 outline-none transition-all uppercase"
                          placeholder="e.g. SUMMER20"
                          value={newCoupon.code}
                          onChange={(e) => setNewCoupon({ ...newCoupon, code: e.target.value.toUpperCase() })}
                       />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                       <div className="space-y-2">
                          <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest px-1">Type</label>
                          <select
                             className="w-full px-4 py-3 rounded-xl border bg-muted/30 focus:ring-2 focus:ring-primary/20 outline-none transition-all appearance-none"
                             value={newCoupon.type}
                             onChange={(e) => setNewCoupon({ ...newCoupon, type: e.target.value })}
                          >
                             <option value="PERCENTAGE">Percentage (%)</option>
                             <option value="FIXED">Fixed Amount ($)</option>
                          </select>
                       </div>
                       <div className="space-y-2">
                          <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest px-1">Discount</label>
                          <input
                             type="number"
                             step="0.01"
                             required
                             className="w-full px-4 py-3 rounded-xl border bg-muted/30 focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                             placeholder="20"
                             value={newCoupon.discount}
                             onChange={(e) => setNewCoupon({ ...newCoupon, discount: e.target.value })}
                          />
                       </div>
                    </div>

                    <div className="space-y-2">
                       <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest px-1">Expiry Date</label>
                       <input
                          type="date"
                          required
                          min={new Date().toISOString().split("T")[0]}
                          className="w-full px-4 py-3 rounded-xl border bg-muted/30 focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                          value={newCoupon.expiryDate}
                          onChange={(e) => setNewCoupon({ ...newCoupon, expiryDate: e.target.value })}
                       />
                    </div>
                 </div>

                 <div className="flex gap-4 pt-4">
                    <button 
                       type="button" 
                       onClick={() => setShowAddModal(false)}
                       className="flex-1 py-4 border rounded-xl font-bold hover:bg-muted transition-all"
                    >
                       Cancel
                    </button>
                    <button 
                       type="submit"
                       className="flex-1 py-4 bg-primary text-primary-foreground rounded-xl font-bold hover:shadow-lg transition-all"
                    >
                       Create Offer
                    </button>
                 </div>
              </form>
           </div>
        </div>
      )}
    </div>
  );
}
