"use client";

import { ShoppingBag, ChevronRight, Loader2, ImagePlus } from "lucide-react";
import Link from "next/link";

interface StoreOwnerDashboardProps {
  storeData: any;
  storeLoading: boolean;
  uploadingStoreLogo: boolean;
  handleStoreImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export function StoreOwnerDashboard({ 
  storeData, 
  storeLoading, 
  uploadingStoreLogo, 
  handleStoreImageUpload 
}: StoreOwnerDashboardProps) {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">Restaurant Partner</h1>
        <p className="text-muted-foreground mt-1">Manage your store and track business growth.</p>
      </div>

      <div className="grid sm:grid-cols-2 gap-6">
        <div className="p-8 bg-gradient-to-br from-primary to-purple-600 text-primary-foreground rounded-[2rem] shadow-lg space-y-4">
          <h3 className="text-xl font-bold">Quick Access</h3>
          <p className="text-primary-foreground/80 text-sm">Jump straight into your store management dashboard to handle orders and products.</p>
          <Link 
            href="/store-dashboard" 
            className="inline-flex items-center gap-2 px-6 py-3 bg-white text-primary rounded-xl font-bold hover:shadow-xl transition-all"
          >
            Store Dashboard <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="p-8 bg-card border rounded-[2rem] shadow-sm space-y-4">
          <h3 className="text-xl font-bold">Business Stats</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Today's Revenue</span>
              <span className="font-bold">$425.00</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Pending Orders</span>
              <span className="font-bold">12</span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-card border rounded-3xl p-8 flex flex-col sm:flex-row items-center gap-8 group">
        <div className="relative">
          <div className="w-32 h-32 bg-muted rounded-2xl flex items-center justify-center overflow-hidden border-2 border-primary/10 shadow-inner">
            {storeLoading ? (
              <Loader2 className="h-8 w-8 animate-spin text-primary/30" />
            ) : storeData?.image ? (
              <img src={storeData.image} alt="Logo" className="w-full h-full object-cover" />
            ) : (
              <ShoppingBag className="h-12 w-12 text-muted-foreground/30" />
            )}
            {uploadingStoreLogo && (
              <div className="absolute inset-0 bg-background/60 flex items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            )}
          </div>
          <label className="absolute -bottom-2 -right-2 p-2 bg-primary text-white rounded-xl shadow-lg cursor-pointer hover:scale-110 transition-transform">
            <ImagePlus className="h-4 w-4" />
            <input type="file" className="hidden" accept="image/*" onChange={handleStoreImageUpload} disabled={uploadingStoreLogo} />
          </label>
        </div>
        <div className="flex-1 text-center sm:text-left space-y-1">
          <h4 className="text-2xl font-extrabold">{storeData?.name || "Loading..."}</h4>
          <p className="text-sm text-muted-foreground">Status: <span className="text-green-600 font-bold">{storeData?.active ? "Active" : "Paused"}</span></p>
          <p className="text-xs text-muted-foreground mt-2 max-w-md line-clamp-2">{storeData?.description || "No description set."}</p>
          <div className="pt-4">
            <Link href="/store-dashboard/settings" className="text-sm font-bold text-primary hover:underline flex items-center gap-1 justify-center sm:justify-start">
              Edit Store Details <ChevronRight className="h-3 w-3" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
