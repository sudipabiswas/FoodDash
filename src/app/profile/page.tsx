"use client";

import { ShoppingBag, Clock, MapPin, ChevronRight, User, X, ImagePlus, Loader2, Camera } from "lucide-react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";

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

  const previousOrders = [
    { id: "1001", store: "Burger King", date: "Oct 24, 2023", total: 45.99, status: "Delivered", items: ["Whopper", "Fries", "Coke"] },
    { id: "0982", store: "Pizza Hut", date: "Oct 12, 2023", total: 22.50, status: "Delivered", items: ["Pepperoni Pizza"] },
  ];

  return (
    <div className="container mx-auto px-4 py-12 max-w-5xl">
      <div className="flex flex-col md:flex-row gap-12">
        {/* Profile Sidebar */}
        <aside className="md:w-80 space-y-6">
           <div className="p-8 bg-card border rounded-[2.5rem] text-center space-y-4 shadow-sm relative group/sidebar">
              <div className="w-24 h-24 bg-primary/10 rounded-full mx-auto flex items-center justify-center border-4 border-background relative overflow-hidden group/avatar">
                 {session.user?.image ? (
                   <img src={session.user.image} alt="Avatar" className="w-full h-full object-cover" />
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
              </nav>
           </div>
        </aside>

        {/* Main Content */}
        <div className="flex-1 space-y-8">
           {isStoreOwner ? (
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
                       {storeData?.image ? (
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
           ) : (
             <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
               <div>
                  <h1 className="text-3xl font-extrabold tracking-tight">Customer Dashboard</h1>
                  <p className="text-muted-foreground mt-1">Manage your orders, addresses, and discover new food.</p>
               </div>

               {/* Quick Actions Grid */}
               <div className="grid sm:grid-cols-2 gap-6">
                 <div className="p-8 bg-gradient-to-br from-blue-600 to-indigo-600 text-white rounded-[2rem] shadow-lg space-y-4 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10 transition-transform group-hover:scale-150"></div>
                    <h3 className="text-xl font-bold relative z-10">Hungry?</h3>
                    <p className="text-white/80 text-sm relative z-10">Explore hundreds of top-rated local restaurants and get food delivered fast.</p>
                    <Link 
                      href="/stores" 
                      className="inline-flex items-center gap-2 px-6 py-3 bg-white text-blue-600 rounded-xl font-bold hover:shadow-xl transition-all relative z-10"
                    >
                      Browse Restaurants <ChevronRight className="h-4 w-4" />
                    </Link>
                 </div>
                 
                 <div className="p-8 bg-card border rounded-[2rem] shadow-sm space-y-4">
                    <div className="flex items-center gap-3 mb-2">
                       <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                          <MapPin className="h-5 w-5 text-primary" />
                       </div>
                       <h3 className="text-xl font-bold">Saved Addresses</h3>
                    </div>
                    <div className="space-y-3">
                       <div className="p-3 bg-muted rounded-xl flex justify-between items-center">
                          <div>
                             <p className="font-bold text-sm">Home</p>
                             <p className="text-xs text-muted-foreground line-clamp-1">123 Delivery St, New York, NY 10001</p>
                          </div>
                       </div>
                       <Link href="/profile/addresses" className="block text-center text-sm font-bold text-primary hover:underline">
                          Manage Addresses
                       </Link>
                    </div>
                 </div>
               </div>

               {/* Order History */}
               <div className="space-y-6 pt-6 border-t">
                  <div className="flex justify-between items-center">
                     <h2 className="text-2xl font-bold">Recent Orders</h2>
                     <Link href="/profile/orders" className="text-primary text-sm font-bold hover:underline">View All</Link>
                  </div>
                  {previousOrders.map((order: any) => (
                    <div key={order.id} className="bg-card border rounded-3xl p-6 hover:shadow-md transition-shadow">
                       <div className="flex flex-col sm:flex-row justify-between gap-4 mb-6">
                          <div className="flex items-center gap-4">
                             <div className="w-16 h-16 bg-muted rounded-2xl flex-shrink-0 flex items-center justify-center">
                                <ShoppingBag className="h-8 w-8 text-muted-foreground/50" />
                             </div>
                             <div>
                                <h3 className="text-xl font-bold">{order.store}</h3>
                                <p className="text-sm text-muted-foreground">{order.date} • Order #{order.id}</p>
                             </div>
                          </div>
                          <div className="text-left sm:text-right">
                             <div className="px-3 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full inline-block mb-1">
                                {order.status}
                             </div>
                             <p className="font-extrabold text-lg">${order.total.toFixed(2)}</p>
                          </div>
                       </div>
                       
                       <div className="flex flex-wrap gap-2 py-4 border-t border-b border-dashed mb-6">
                          {order.items.map((item: any) => (
                            <span key={item} className="px-3 py-1 bg-muted rounded-full text-xs font-medium">
                              {item}
                            </span>
                          ))}
                       </div>

                       <div className="flex gap-4">
                          <button className="flex-1 py-3 bg-primary text-primary-foreground rounded-xl font-bold hover:shadow-lg transition-all">
                             Reorder
                          </button>
                          <button className="flex-1 py-3 border rounded-xl font-bold hover:bg-muted transition-all">
                             View Receipt
                          </button>
                       </div>
                    </div>
                  ))}
               </div>
             </div>
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
