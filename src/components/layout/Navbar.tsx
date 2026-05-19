"use client";

import Link from "next/link";
import { ShoppingCart, User, Search, Menu, LogOut, LayoutDashboard, Bike } from "lucide-react";
import { useState } from "react";
import { useCart } from "@/components/cart/CartProvider";
import { useSession, signOut } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import toast from "react-hot-toast";

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const { totalItems } = useCart();
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  const handleLogout = async () => {
    try {
      // Attempt to sign out, but don't let it block the redirect if it takes too long
      await Promise.race([
        signOut({ redirect: false }),
        new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), 2000))
      ]);
    } catch (error) {
      console.error("Logout failed or timed out:", error);
    }
    // Force a hard redirect to the login page on the current origin
    window.location.href = window.location.origin + '/login';
  };

  const handleSearch = (e: React.FormEvent) => {

    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/stores?search=${encodeURIComponent(searchQuery.trim())}`);
      setIsMenuOpen(false);
    }
  };

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center space-x-2">
              <span className="text-2xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                FoodDash
              </span>
            </Link>
            <div className="hidden md:flex items-center space-x-6 text-sm font-medium">
              {(session?.user as any)?.role === "DELIVERY_MAN" ? (
                <>
                  <Link href="/rider-dashboard?tab=home" className="transition-colors hover:text-primary flex items-center gap-1">
                    Dashboard
                  </Link>
                  <Link href="/rider-dashboard?tab=growth" className="transition-colors hover:text-primary">
                    Earnings
                  </Link>
                  <Link href="/rider-dashboard?tab=dutyrecord" className="transition-colors hover:text-primary">
                    Duty Record
                  </Link>
                  <Link href="/about" className="transition-colors hover:text-primary">
                    About
                  </Link>
                </>
              ) : (
                <>
                  <Link href="/stores" className="transition-colors hover:text-primary">
                    Browse Stores
                  </Link>
                  {(session?.user as any)?.role === "CUSTOMER" && (
                    <Link href="/orders" className="transition-colors hover:text-primary">
                      My Orders
                    </Link>
                  )}
                  <Link href="/offers" className="transition-colors hover:text-primary">
                    Offers
                  </Link>
                  <Link href="/about" className="transition-colors hover:text-primary">
                    About
                  </Link>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center gap-4">
            {!pathname?.startsWith("/store-dashboard") && (session?.user as any)?.role !== "STORE_OWNER" && (
              <>
                <form onSubmit={handleSearch} className="hidden sm:flex items-center relative group">
                  <Search className="absolute left-2.5 h-4 w-4 text-muted-foreground" />
                  <input
                    type="search"
                    placeholder="Search food or restaurants..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="h-9 w-64 rounded-full border bg-muted/50 pl-9 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                  />
                </form>
                
                {status === "authenticated" ? (
                  <Link href="/cart" className="relative p-2 hover:bg-muted rounded-full transition-colors">
                    <ShoppingCart className="h-5 w-5" />
                    <span className="absolute top-0 right-0 h-4 w-4 bg-primary text-[10px] font-bold text-primary-foreground flex items-center justify-center rounded-full">
                      {totalItems}
                    </span>
                  </Link>
                ) : (
                  <button 
                    onClick={() => {
                      toast.error("Please sign in first", {
                        icon: '🔒',
                        style: {
                          borderRadius: '1rem',
                          background: '#333',
                          color: '#fff',
                        },
                      });
                      setTimeout(() => {
                        router.push("/login?callbackUrl=/cart");
                      }, 800);
                    }}
                    className="relative p-2 hover:bg-muted rounded-full transition-colors"
                  >
                    <ShoppingCart className="h-5 w-5" />
                    <span className="absolute top-0 right-0 h-4 w-4 bg-primary text-[10px] font-bold text-primary-foreground flex items-center justify-center rounded-full">
                      0
                    </span>
                  </button>
                )}
              </>
            )}


            {status === "authenticated" ? (
              <div className="flex items-center gap-3">
                {(session?.user as any)?.role === "STORE_OWNER" || (session?.user as any)?.role === "ADMIN" ? (
                  <Link 
                    href={(session?.user as any)?.role === "ADMIN" ? "/admin-dashboard" : "/store-dashboard"} 
                    className="hidden sm:flex items-center gap-2 px-4 py-2 bg-muted hover:bg-muted/80 rounded-full text-sm font-medium transition-colors"
                  >
                    <LayoutDashboard className="h-4 w-4" />
                    <span>Dashboard</span>
                  </Link>
                ) : null}
                
                <div className="flex items-center gap-2">
                  <button                    onClick={handleLogout}
                  className="p-2 hover:bg-muted rounded-full text-muted-foreground hover:text-destructive transition-colors"
                  title="Sign Out"
                >
                  <LogOut className="h-5 w-5" />
                </button>
                  <Link href="/profile" className="flex items-center gap-2 p-1 pl-1 pr-3 bg-primary/10 text-primary rounded-full text-sm font-medium hover:bg-primary/20 transition-colors">
                    {session.user?.image ? (
                      <div className="h-7 w-7 rounded-full overflow-hidden border border-primary/20">
                        <img src={session.user.image} alt="Profile" className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <div className="h-7 w-7 rounded-full bg-primary/20 flex items-center justify-center">
                        <User className="h-4 w-4" />
                      </div>
                    )}
                    <span className="max-w-[100px] truncate">{session.user?.name || "Profile"}</span>
                  </Link>
                </div>
              </div>
            ) : (
              <Link href="/login" className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-full text-sm font-medium hover:opacity-90 transition-opacity">
                <User className="h-4 w-4" />
                <span>Login</span>
              </Link>
            )}

            <button 
              className="md:hidden p-2 hover:bg-muted rounded-md"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              <Menu className="h-6 w-6" />
            </button>
          </div>
        </div>
      </div>
      
      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden border-t bg-background px-4 py-4 space-y-4">
          {(session?.user as any)?.role === "DELIVERY_MAN" ? (
            <>
              <Link href="/rider-dashboard?tab=home" className="block text-sm font-medium" onClick={() => setIsMenuOpen(false)}>Dashboard</Link>
              <Link href="/rider-dashboard?tab=growth" className="block text-sm font-medium" onClick={() => setIsMenuOpen(false)}>Earnings</Link>
              <Link href="/rider-dashboard?tab=dutyrecord" className="block text-sm font-medium" onClick={() => setIsMenuOpen(false)}>Duty Record</Link>
              <Link href="/about" className="block text-sm font-medium" onClick={() => setIsMenuOpen(false)}>About</Link>
            </>
          ) : (
            <>
              <Link href="/stores" className="block text-sm font-medium">Browse Stores</Link>
              {status === "authenticated" ? (
                (session?.user as any)?.role === "CUSTOMER" && (
                  <>
                    <Link href="/orders" className="block text-sm font-medium">My Orders</Link>
                    <Link href="/cart" className="flex items-center justify-between text-sm font-medium group">
                      <span>My Cart</span>
                      <span className="h-5 w-5 bg-primary text-[10px] font-bold text-primary-foreground flex items-center justify-center rounded-full group-active:scale-95 transition-transform">
                        {totalItems}
                      </span>
                    </Link>
                  </>
                )
              ) : (
                <button 
                  onClick={() => {
                    toast.error("Please sign in first", {
                      icon: '🔒',
                    });
                    setTimeout(() => {
                      router.push("/login?callbackUrl=/cart");
                    }, 800);
                  }}
                  className="flex items-center justify-between w-full text-sm font-medium group text-left"
                >
                  <span>My Cart</span>
                  <span className="h-5 w-5 bg-primary text-[10px] font-bold text-primary-foreground flex items-center justify-center rounded-full group-active:scale-95 transition-transform">
                    0
                  </span>
                </button>
              )}
              <Link href="/offers" className="block text-sm font-medium">Offers</Link>
              <Link href="/about" className="block text-sm font-medium">About</Link>
            </>
          )}
          
          <div className="pt-2 border-t space-y-3">
            {status === "authenticated" ? (
              <>
                <div className="flex items-center gap-3 px-2 py-1">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary overflow-hidden border">
                    {session.user?.image ? (
                      <img src={session.user.image} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      <User className="h-5 w-5" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-bold truncate">{session.user?.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{session.user?.email}</p>
                  </div>
                </div>
                {(session?.user as any)?.role === "ADMIN" ? (
                  <Link href="/admin-dashboard" className="flex items-center gap-2 text-sm font-medium p-2 hover:bg-muted rounded-md transition-colors">
                    <LayoutDashboard className="h-4 w-4" />
                    Admin Dashboard
                  </Link>
                ) : (session?.user as any)?.role === "STORE_OWNER" ? (
                  <Link href="/store-dashboard" className="flex items-center gap-2 text-sm font-medium p-2 hover:bg-muted rounded-md transition-colors">
                    <LayoutDashboard className="h-4 w-4" />
                    Store Dashboard
                  </Link>
                ) : (session?.user as any)?.role === "DELIVERY_MAN" ? (
                  <Link href="/rider-dashboard" className="flex items-center gap-2 text-sm font-medium p-2 hover:bg-muted rounded-md transition-colors">
                    <Bike className="h-4 w-4" />
                    Rider Dashboard
                  </Link>
                ) : null}
                <Link href="/profile" className="flex items-center gap-2 text-sm font-medium p-2 hover:bg-muted rounded-md transition-colors">
                  <User className="h-4 w-4" />
                  My Profile
                </Link>
                <button 
                  onClick={handleLogout}
                  className="flex w-full items-center gap-2 text-sm font-medium p-2 hover:bg-destructive/10 text-destructive rounded-md transition-colors text-left"
                >
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </button>
              </>
            ) : (
              <Link href="/login" className="flex items-center gap-2 w-full px-4 py-3 bg-primary text-primary-foreground rounded-xl text-center font-bold">
                <User className="h-4 w-4" />
                <span>Login</span>
              </Link>
            )}
          </div>

          {!pathname?.startsWith("/store-dashboard") && (session?.user as any)?.role !== "STORE_OWNER" && (
            <form onSubmit={handleSearch} className="relative pt-2">
              <Search className="absolute left-2.5 top-5 h-4 w-4 text-muted-foreground" />
              <input
                type="search"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-10 w-full rounded-md border bg-muted/50 pl-9 pr-4 text-sm"
              />
            </form>
          )}
        </div>
      )}
    </nav>
  );
}

