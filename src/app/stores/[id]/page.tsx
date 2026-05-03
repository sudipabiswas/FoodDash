import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Image from "next/image";
import { Star, Clock, Info, ShoppingBag } from "lucide-react";
import AddToCartButton from "@/components/cart/AddToCartButton";

export default async function StoreMenuPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const store = await prisma.store.findUnique({
    where: { id: params.id },
    include: {
      categories: {
        include: {
          products: true,
        },
      },
    },
  });

  if (!store) notFound();

  return (
    <div className="pb-20">
      {/* Store Header */}
      <div className="h-64 bg-muted relative">
         <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
         <div className="container mx-auto h-full px-4 flex flex-col justify-end pb-8 relative z-10 text-white">
            <h1 className="text-4xl font-bold mb-2">{store.name}</h1>
            <div className="flex flex-wrap items-center gap-6 text-sm font-medium opacity-90">
               <div className="flex items-center gap-1">
                 <Star className="h-4 w-4 fill-yellow-400 text-yellow-400 border-none" />
                 <span>4.8 (500+ ratings)</span>
               </div>
               <div className="flex items-center gap-1">
                 <Clock className="h-4 w-4" />
                 <span>20-30 min</span>
               </div>
               <div className="flex items-center gap-1">
                 <Info className="h-4 w-4" />
                 <span className="underline cursor-pointer">Store Info</span>
               </div>
            </div>
         </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Categories Sidebar */}
          <aside className="lg:w-64 space-y-2 sticky top-24 h-fit">
            <h2 className="text-xl font-bold mb-4">Categories</h2>
            {store.categories.map((cat: any) => (
              <a 
                key={cat.id} 
                href={`#${cat.id}`}
                className="block px-4 py-2 rounded-lg hover:bg-primary/5 hover:text-primary transition-all font-medium text-muted-foreground"
              >
                {cat.name}
              </a>
            ))}
          </aside>

          {/* Menu Items */}
          <div className="flex-1 space-y-12">
            {store.categories.map((category: any) => (
              <section key={category.id} id={category.id} className="scroll-mt-24">
                <h3 className="text-2xl font-bold mb-6 pb-2 border-b">{category.name}</h3>
                <div className="grid sm:grid-cols-2 gap-6">
                  {category.products.map((product: any) => (
                    <div key={product.id} className="flex gap-4 p-4 rounded-2xl border bg-card hover:shadow-md transition-shadow">
                      <div className="flex-1 flex flex-col">
                        <h4 className="font-bold text-lg">{product.name}</h4>
                        <p className="text-muted-foreground text-sm line-clamp-2 mt-1 mb-3">
                          {product.description || "Freshly prepared with the best ingredients."}
                        </p>
                        <div className="mt-auto flex items-center justify-between">
                          <span className="font-bold text-lg">${product.price.toFixed(2)}</span>
                          <AddToCartButton 
                            item={{
                              id: product.id,
                              name: product.name,
                              price: product.price,
                              storeId: store.id,
                              quantity: 1
                            }} 
                          />
                        </div>
                      </div>
                      <div className="w-24 h-24 bg-muted rounded-xl flex-shrink-0" />
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
