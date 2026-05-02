import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Star, Clock, MapPin, Search, Filter } from "lucide-react";

export default async function StoresPage(props: {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const searchParams = await props.searchParams;
  const rawQuery = searchParams?.search;
  const query = typeof rawQuery === 'string' ? rawQuery : Array.isArray(rawQuery) ? rawQuery[0] : "";

  const stores = await prisma.store.findMany({
    where: { 
      active: true,
      ...(query ? {
        OR: [
          { name: { contains: query } },
          { description: { contains: query } },
          { products: { some: { name: { contains: query } } } }
        ]
      } : {})
    },
    include: {
      _count: {
        select: { products: true }
      }
    }
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-4xl font-bold mb-2">All Restaurants</h1>
          <p className="text-muted-foreground">Discover the best food near you</p>
        </div>
        
        <div className="flex w-full md:w-auto gap-2">
          <form action="/stores" method="GET" className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <input 
              type="text" 
              name="search"
              defaultValue={query}
              placeholder="Search stores..." 
              className="w-full pl-9 pr-4 py-2 rounded-lg border bg-background focus:ring-2 focus:ring-primary/20 outline-none"
            />
          </form>
          <button className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-muted transition-colors font-medium">
            <Filter className="h-4 w-4" /> Filters
          </button>
        </div>
      </div>

      {stores.length === 0 ? (
        <div className="text-center py-20 bg-muted/20 rounded-[2rem] border-2 border-dashed">
          <h3 className="text-xl font-semibold mb-2">No stores found</h3>
          <p className="text-muted-foreground mb-6">Be the first one to open a store here!</p>
          <Link href="/become-partner" className="px-6 py-3 bg-primary text-primary-foreground rounded-full font-bold">
            Register a Store
          </Link>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {stores.map((store) => (
            <Link key={store.id} href={`/stores/${store.id}`} className="block">
              <div className="rounded-3xl border overflow-hidden group hover:shadow-2xl transition-all duration-500 bg-card">
                <div className="h-48 bg-muted relative overflow-hidden">
                   <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                   <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end">
                      <span className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-white text-xs font-bold border border-white/20">
                        {store._count.products} Items
                      </span>
                      <div className="flex items-center gap-1 bg-white px-2 py-1 rounded-lg text-sm font-bold">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span>4.5</span>
                      </div>
                   </div>
                </div>
                <div className="p-6">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-xl font-bold group-hover:text-primary transition-colors">{store.name}</h3>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span>20-30 min</span>
                    </div>
                  </div>
                  <p className="text-muted-foreground text-sm line-clamp-1 mb-4">{store.description || "Gourmet food and more"}</p>
                  <div className="flex items-center gap-1 text-sm font-medium">
                    <MapPin className="h-4 w-4 text-primary" />
                    <span>Free Delivery</span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
