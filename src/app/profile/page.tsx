"use client";

import { ShoppingBag, Clock, MapPin, ChevronRight, User, X, ImagePlus, Loader2, Camera, Shield, LayoutDashboard, Tag } from "lucide-react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { CustomerDashboard } from "@/components/profile/CustomerDashboard";
import { StoreOwnerDashboard } from "@/components/profile/StoreOwnerDashboard";

export default function ProfilePage() {
  const { data: session, status, update } = useSession();
  const router = useRouter();

  const [isEditing, setIsEditing] = useState(false);
  const [newName, setNewName] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateError, setUpdateError] = useState("");
  
  const [storeData, setStoreData] = useState<any>(null);
  const [storeLoading, setStoreLoading] = useState(false);
  const [uploadingStoreLogo, setUploadingStoreLogo] = useState(false);
  const [uploadingUserAvatar, setUploadingUserAvatar] = useState(false);

  const isStoreOwner = (session?.user as any)?.role === "STORE_OWNER";
  const isAdmin = (session?.user as any)?.role === "ADMIN";

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
    if (session?.user?.name) {
      setNewName(session.user.name);
    }
    if (isStoreOwner) {
      fetchStoreData();
    }
  }, [status, router, session, isStoreOwner]);

  const fetchStoreData = async () => {
    setStoreLoading(true);
    try {
      const res = await fetch("/api/store");
      const data = await res.json();
      if (res.ok) {
        setStoreData(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setStoreLoading(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);
    setUpdateError("");

    try {
      const res = await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName }),
      });

      if (res.ok) {
        await update({ name: newName });
        setIsEditing(false);
        router.refresh();
      } else {
        const data = await res.json();
        setUpdateError(data.error || "Failed to update profile");
      }
    } catch (err) {
      setUpdateError("An unexpected error occurred");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleUserAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingUserAvatar(true);
    try {
      const res = await fetch(`/api/upload?filename=${encodeURIComponent(file.name)}&contentType=${encodeURIComponent(file.type)}`);
      const { signedUrl, publicUrl } = await res.json();
      
      await fetch(signedUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      });

      // Update user image in DB
      const profileRes = await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: session?.user?.name, image: publicUrl }),
      });

      if (profileRes.ok) {
        await update({ image: publicUrl }); // Update NextAuth session
      }
    } catch (err) {
      console.error("Avatar upload failed", err);
    } finally {
      setUploadingUserAvatar(false);
    }
  };

  const handleStoreImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingStoreLogo(true);
    try {
      const res = await fetch(`/api/upload?filename=${encodeURIComponent(file.name)}&contentType=${encodeURIComponent(file.type)}`);
      const { signedUrl, publicUrl } = await res.json();
      
      await fetch(signedUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      });

      // Update store image in DB
      await fetch("/api/store", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: publicUrl }),
      });

      await update({ image: publicUrl }); // Refresh session image
      setStoreData({ ...storeData, image: publicUrl });
    } catch (err) {
      console.error("Store logo upload failed", err);
    } finally {
      setUploadingStoreLogo(false);
    }
  };

  if (status === "loading") {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!session) return null;



  return (
    <div className="container mx-auto px-4 py-12 max-w-5xl">
      <div className="flex flex-col md:flex-row gap-12">
        {/* Profile Sidebar */}
        <aside className="md:w-80 space-y-6">
           <div className="p-8 bg-card border rounded-[2.5rem] text-center space-y-4 shadow-sm relative group/sidebar">
              <div className="w-24 h-24 bg-primary/10 rounded-full mx-auto flex items-center justify-center border-4 border-background relative overflow-hidden group/avatar">
                 {session.user?.image ? (
                   <img src={session.user.image} alt="Avatar" className="w-full h-full object-cover" />
                 ) : isStoreOwner && storeData?.image ? (
                   <img src={storeData.image} alt="Store Logo" className="w-full h-full object-cover" />
                 ) : (
                   <User className="h-12 w-12 text-primary" />
                 )}
                 
                 {uploadingUserAvatar && (
                   <div className="absolute inset-0 bg-background/60 flex items-center justify-center">
                     <Loader2 className="h-6 w-6 animate-spin text-primary" />
                   </div>
                 )}
                 
                 <label className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center opacity-0 group-hover/avatar:opacity-100 transition-opacity cursor-pointer">
                    <Camera className="h-6 w-6 text-white mb-1" />
                    <span className="text-[8px] text-white font-bold uppercase tracking-widest">Update</span>
                    <input type="file" className="hidden" accept="image/*" onChange={handleUserAvatarUpload} disabled={uploadingUserAvatar} />
                 </label>
              </div>
              <div>
                 <h2 className="text-2xl font-extrabold">{session.user?.name}</h2>
                 <p className="text-muted-foreground text-sm">{session.user?.email}</p>
                 <div className="mt-2 inline-block px-3 py-1 bg-primary/10 text-primary text-[10px] font-bold rounded-full uppercase tracking-widest">
                   {(session.user as any)?.role}
                 </div>
              </div>
              <button onClick={() => setIsEditing(true)} className="w-full py-3 bg-muted rounded-xl text-sm font-bold hover:bg-muted/80 transition-colors">
                 Edit Name
              </button>
           </div>

           <div className="bg-card border rounded-[2.5rem] overflow-hidden shadow-sm">
              <nav className="flex flex-col">
                 {isAdmin ? (
                   <>
                     <Link href="/profile" className="flex items-center justify-between p-6 hover:bg-muted/50 border-b bg-primary/5">
                        <div className="flex items-center gap-4">
                           <Shield className="h-5 w-5 text-primary" />
                           <span className="font-bold">Admin Console</span>
                        </div>
                        <ChevronRight className="h-4 w-4" />
                     </Link>
                     <Link href="/admin-dashboard" className="flex items-center justify-between p-6 hover:bg-muted/50 border-b">
                        <div className="flex items-center gap-4">
                           <LayoutDashboard className="h-5 w-5 text-muted-foreground" />
                           <span className="font-medium">System Dashboard</span>
                        </div>
                        <ChevronRight className="h-4 w-4" />
                     </Link>
                     <Link href="/admin-dashboard/stores" className="flex items-center justify-between p-6 hover:bg-muted/50 border-b">
                        <div className="flex items-center gap-4">
                           <ShoppingBag className="h-5 w-5 text-muted-foreground" />
                           <span className="font-medium">Manage Stores</span>
                        </div>
                        <ChevronRight className="h-4 w-4" />
                     </Link>
                     <Link href="/admin-dashboard/users" className="flex items-center justify-between p-6 hover:bg-muted/50">
                        <div className="flex items-center gap-4">
                           <User className="h-5 w-5 text-muted-foreground" />
                           <span className="font-medium">Manage Users</span>
                        </div>
                        <ChevronRight className="h-4 w-4" />
                     </Link>
                   </>
                 ) : (
                   <>
                     <Link href="/profile" className="flex items-center justify-between p-6 hover:bg-muted/50 border-b bg-primary/5">
                        <div className="flex items-center gap-4">
                           <ShoppingBag className="h-5 w-5 text-primary" />
                           <span className="font-bold">{isStoreOwner ? "Store Overview" : "Order History"}</span>
                        </div>
                        <ChevronRight className="h-4 w-4" />
                     </Link>
                     {isStoreOwner ? (
                       <Link href="/store-dashboard" className="flex items-center justify-between p-6 hover:bg-muted/50 border-b">
                          <div className="flex items-center gap-4">
                             <Clock className="h-5 w-5 text-muted-foreground" />
                             <span className="font-medium">Go to Dashboard</span>
                          </div>
                          <ChevronRight className="h-4 w-4" />
                       </Link>
                     ) : (
                       <Link href="/profile/addresses" className="flex items-center justify-between p-6 hover:bg-muted/50 border-b">
                          <div className="flex items-center gap-4">
                             <MapPin className="h-5 w-5 text-muted-foreground" />
                             <span className="font-medium">My Addresses</span>
                          </div>
                          <ChevronRight className="h-4 w-4" />
                       </Link>
                     )}
                     <Link href="/profile/activity" className="flex items-center justify-between p-6 hover:bg-muted/50">
                        <div className="flex items-center gap-4">
                           <Clock className="h-5 w-5 text-muted-foreground" />
                           <span className="font-medium">Recent Activity</span>
                        </div>
                        <ChevronRight className="h-4 w-4" />
                     </Link>
                   </>
                 )}
              </nav>
           </div>
        </aside>

        {/* Main Content */}
        <div className="flex-1 space-y-8">
           {isAdmin ? (
             <AdminDashboard />
           ) : isStoreOwner ? (
             <StoreOwnerDashboard 
               storeData={storeData}
               storeLoading={storeLoading}
               uploadingStoreLogo={uploadingStoreLogo}
               handleStoreImageUpload={handleStoreImageUpload}
             />
           ) : (
             <CustomerDashboard />
           )}
        </div>
      </div>

      {/* Edit Profile Modal */}
      {isEditing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-card border w-full max-w-md rounded-[2.5rem] shadow-2xl p-8 space-y-6 animate-in zoom-in-95">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Edit Profile</h2>
              <button onClick={() => setIsEditing(false)} className="p-2 hover:bg-muted rounded-full transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            {updateError && (
              <div className="p-4 bg-destructive/10 text-destructive text-sm font-medium rounded-xl">
                {updateError}
              </div>
            )}

            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-bold text-muted-foreground">Full Name</label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border bg-muted/30 focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                  placeholder="Your name"
                />
              </div>
              
              <div className="flex gap-3 pt-4">
                <button 
                  type="button" 
                  onClick={() => setIsEditing(false)}
                  className="flex-1 py-3 border rounded-xl font-bold hover:bg-muted transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={isUpdating}
                  className="flex-1 py-3 bg-primary text-primary-foreground rounded-xl font-bold hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {isUpdating ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function AdminDashboard() {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-black bg-gradient-to-r from-foreground to-foreground/60 bg-clip-text text-transparent">
          System Admin Panel
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Manage system configurations, control storefront statuses, and inspect platform metrics.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Link 
          href="/admin-dashboard" 
          className="p-6 bg-card border rounded-[2rem] hover:shadow-lg hover:-translate-y-0.5 transition-all group space-y-4"
        >
          <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
            <LayoutDashboard className="h-6 w-6" />
          </div>
          <div>
            <h3 className="font-extrabold text-lg flex items-center gap-2">
              Platform Stats & Overview <ChevronRight className="h-4 w-4 opacity-50" />
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              Analyze total sales volumes, platform commissions, active store counts, and weekly sales trends.
            </p>
          </div>
        </Link>

        <Link 
          href="/admin-dashboard/stores" 
          className="p-6 bg-card border rounded-[2rem] hover:shadow-lg hover:-translate-y-0.5 transition-all group space-y-4"
        >
          <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-600 group-hover:scale-110 transition-transform">
            <ShoppingBag className="h-6 w-6" />
          </div>
          <div>
            <h3 className="font-extrabold text-lg flex items-center gap-2">
              Manage Restaurants <ChevronRight className="h-4 w-4 opacity-50" />
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              View and audit all registered restaurant storefronts. Suspend, activate, or verify stores instantly.
            </p>
          </div>
        </Link>

        <Link 
          href="/admin-dashboard/users" 
          className="p-6 bg-card border rounded-[2rem] hover:shadow-lg hover:-translate-y-0.5 transition-all group space-y-4"
        >
          <div className="w-12 h-12 bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-600 group-hover:scale-110 transition-transform">
            <User className="h-6 w-6" />
          </div>
          <div>
            <h3 className="font-extrabold text-lg flex items-center gap-2">
              Manage Platform Users <ChevronRight className="h-4 w-4 opacity-50" />
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              Inspect user directories, search by details, and filter accounts by roles (Customers, Owners, Riders, Admins).
            </p>
          </div>
        </Link>

        <Link 
          href="/admin-dashboard/coupons" 
          className="p-6 bg-card border rounded-[2rem] hover:shadow-lg hover:-translate-y-0.5 transition-all group space-y-4"
        >
          <div className="w-12 h-12 bg-amber-500/10 rounded-2xl flex items-center justify-center text-amber-600 group-hover:scale-110 transition-transform">
            <Tag className="h-6 w-6" />
          </div>
          <div>
            <h3 className="font-extrabold text-lg flex items-center gap-2">
              System Discount Coupons <ChevronRight className="h-4 w-4 opacity-50" />
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              Create and manage platform-wide global coupons to incentivize users with flat or percentage discounts.
            </p>
          </div>
        </Link>
      </div>

      <div className="p-6 bg-primary/5 rounded-[2rem] border border-primary/10 flex items-center gap-4">
        <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
          <Shield className="h-5 w-5" />
        </div>
        <div>
          <h4 className="font-bold text-sm">Security Mode Active</h4>
          <p className="text-xs text-muted-foreground">You are logged in with the highest access level. Always log out when using shared devices.</p>
        </div>
      </div>
    </div>
  );
}
