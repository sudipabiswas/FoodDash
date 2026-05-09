import Link from "next/link";
import { ArrowRight, Star, Clock, MapPin } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import OwnerLanding from "@/components/home/OwnerLanding";

export const dynamic = "force-dynamic";

export default async function Home() {
  const session = await auth();
  const userRole = (session?.user as any)?.role;

  // 1. If Store Owner, show Owner Landing Page
  if (userRole === "STORE_OWNER") {
    const store = await prisma.store.findFirst({
      where: { ownerId: session?.user?.id },
      include: {
        _count: { select: { products: true } }
      }
    });

    if (store) {
      const recentOrders = await prisma.order.findMany({
        where: { storeId: store.id },
        take: 5,
        orderBy: { createdAt: "desc" },
        include: { customer: { select: { name: true } } }
      });

      const totalRevenue = await prisma.order.aggregate({
        where: { storeId: store.id, status: "DELIVERED" },
        _sum: { totalPrice: true }
      });

      const reviews = await prisma.review.findMany({
        where: { storeId: store.id },
        select: { rating: true }
      });

      const avgRating = reviews.length > 0 
        ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
        : "0.0";

      const ownerStats = [
        { name: "Total Revenue", value: `$${(totalRevenue._sum.totalPrice || 0).toFixed(2)}`, growth: "+12%", link: "/store-dashboard/revenue" },
        { name: "Total Orders", value: recentOrders.length.toString(), growth: "+5%", link: "/store-dashboard/orders" },
        { name: "Active Products", value: store._count.products.toString(), growth: "Stable", link: "/store-dashboard/products" },
        { name: "Customer Rating", value: avgRating, growth: `(${reviews.length} reviews)`, link: "/store-dashboard/reviews" },
      ];

      return <OwnerLanding stats={ownerStats} recentOrders={recentOrders} storeName={store.name} />;
    }
  }

  // 2. Otherwise (Customer or Guest), show current Customer Landing Page
  const categoryNames = ["Burgers", "Pizza", "Sushi", "Desserts", "Coffee", "Healthy"];
  const categoryIcons: { [key: string]: string } = {
    Burgers: "🍔",
    Pizza: "🍕",
    Sushi: "🍣",
    Desserts: "🍰",
    Coffee: "☕",
    Healthy: "🥗",
  };

  // Fetch real counts for each category
  const categories = await Promise.all(
    categoryNames.map(async (name) => {
      const count = await prisma.store.count({
        where: {
          active: true,
          mainCategories: { has: name }
        }
      });
      return { name, icon: categoryIcons[name], count };
    })
  );

  return (
    <div className="flex flex-col gap-16 pb-16">
      {/* Hero Section */}
      <section className="relative h-[600px] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-background -z-10" />
        <div className="container px-4 text-center">
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6">
            Satisfy Your Cravings <br />
            <span className="text-primary">In One Click</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
            Order from the best local restaurants and get your favorite meals delivered fresh and fast to your doorstep.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link 
              href="/stores" 
              className="px-8 py-4 bg-primary text-primary-foreground rounded-full font-bold text-lg hover:shadow-xl hover:shadow-primary/20 transition-all flex items-center gap-2"
            >
              Order Now <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl font-bold">Popular Categories</h2>
          <Link href="/stores" className="text-primary font-semibold hover:underline flex items-center gap-1">
            View all <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-6">
          {categories.map((cat: any) => (
            <Link 
              key={cat.name}
              href={`/stores?category=${cat.name}`}
              className="group cursor-pointer p-6 rounded-2xl bg-muted/30 border border-transparent hover:border-primary/20 hover:bg-white hover:shadow-lg transition-all text-center"
            >
              <div className="text-4xl mb-4 group-hover:scale-110 transition-transform">{cat.icon}</div>
              <h3 className="font-bold text-lg">{cat.name}</h3>
              <p className="text-sm text-muted-foreground">{cat.count} Restaurants</p>
            </Link>
          ))}
        </div>
      </section>

      {/* AI Recommendation */}
      <section className="container mx-auto px-4">
        <div className="bg-gradient-to-r from-purple-600 to-primary rounded-[2.5rem] p-1 gap-1">
          <div className="bg-background rounded-[2.4rem] p-8 md:p-12">
            <div className="flex flex-col md:flex-row items-center gap-8">
              <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0 animate-pulse">
                <Star className="h-10 w-10 text-primary fill-primary" />
              </div>
              <div className="flex-1 text-center md:text-left space-y-2">
                <h2 className="text-2xl md:text-3xl font-bold">Smart AI Recommendation</h2>
                <p className="text-muted-foreground">Based on your taste, we recommend trying the <span className="font-bold text-primary">Spicy Zinger Burger</span> today!</p>
              </div>
              <button className="px-8 py-3 bg-primary text-primary-foreground rounded-xl font-bold hover:scale-105 transition-transform whitespace-nowrap">
                Try it Now
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Stores Placeholder */}
      <section className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl font-bold">Featured Restaurants</h2>
          <div className="flex gap-2">
            <span className="px-4 py-2 rounded-full border text-sm font-medium bg-primary/10 text-primary border-primary/20">All</span>
            <span className="px-4 py-2 rounded-full border text-sm font-medium hover:bg-muted cursor-pointer transition-colors">Fast Food</span>
            <span className="px-4 py-2 rounded-full border text-sm font-medium hover:bg-muted cursor-pointer transition-colors">Fine Dining</span>
          </div>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[1, 2, 3].map((i: number) => (
            <div key={i} className="rounded-3xl border overflow-hidden group hover:shadow-2xl transition-all duration-500 bg-card">
              <div className="h-56 bg-muted relative overflow-hidden">
                 <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                 <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end">
                    <span className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-white text-xs font-bold border border-white/20">
                      Free Delivery
                    </span>
                    <div className="flex items-center gap-1 bg-white px-2 py-1 rounded-lg text-sm font-bold">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span>4.8</span>
                    </div>
                 </div>
              </div>
              <div className="p-6">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-xl font-bold group-hover:text-primary transition-colors">The Burger Joint {i}</h3>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>25-35 min</span>
                  </div>
                </div>
                <p className="text-muted-foreground text-sm mb-4">Gourmet Burgers, American, Sides</p>
                <div className="flex items-center gap-1 text-sm font-medium">
                  <MapPin className="h-4 w-4 text-primary" />
                  <span>2.5 miles away</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* App Promo */}
      <section className="container mx-auto px-4 mb-8">
        <div className="bg-primary rounded-[3rem] p-12 md:p-20 text-primary-foreground flex flex-col md:flex-row items-center gap-12 overflow-hidden relative">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-32 -mt-32" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -ml-32 -mb-32" />
          
          <div className="flex-1 space-y-6 z-10 text-center md:text-left">
            <h2 className="text-4xl md:text-5xl font-bold">Ready to Order?</h2>
            <p className="text-xl opacity-90 max-w-lg">
              Download our mobile app for exclusive deals, real-time tracking, and a faster ordering experience.
            </p>
            <div className="flex flex-wrap justify-center md:justify-start gap-4">
              <button className="px-8 py-3 bg-white text-primary rounded-xl font-bold hover:scale-105 transition-transform">App Store</button>
              <button className="px-8 py-3 bg-white text-primary rounded-xl font-bold hover:scale-105 transition-transform">Google Play</button>
            </div>
          </div>
          <div className="flex-1 flex justify-center z-10">
             <div className="w-64 h-[450px] bg-white/20 backdrop-blur-xl rounded-[2.5rem] border-4 border-white/30 shadow-2xl relative">
                <div className="absolute top-4 left-1/2 -translate-x-1/2 w-16 h-1 bg-white/40 rounded-full" />
                <div className="mt-12 p-6 space-y-4">
                  <div className="h-4 w-2/3 bg-white/20 rounded-full" />
                  <div className="h-32 w-full bg-white/20 rounded-2xl" />
                  <div className="space-y-2">
                    <div className="h-3 w-full bg-white/20 rounded-full" />
                    <div className="h-3 w-5/6 bg-white/20 rounded-full" />
                  </div>
                </div>
             </div>
          </div>
        </div>
      </section>
    </div>
  );
}
