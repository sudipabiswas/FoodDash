import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Image from "next/image";
import { Star, Clock, Info, ShoppingBag } from "lucide-react";
import AddToCartButton from "@/components/cart/AddToCartButton";
import StoreSideCart from "@/components/cart/StoreSideCart";
import ReviewSection from "@/components/store/ReviewSection";

export default async function StoreMenuPage(props: { params: Promise<{ id: string }> }) {
  // ... (rest of the code)
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
      {/* ... (existing code for header and menu) */}
      <div className="h-80 relative overflow-hidden">
         {store.image ? (
           <img 
             src={store.image} 
             alt={store.name} 
             className="absolute inset-0 w-full h-full object-cover blur-sm brightness-50"
           />
         ) : (
           <div className="absolute inset-0 bg-primary/20" />
         )}
         <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
         <div className="container mx-auto h-full px-4 flex flex-col justify-end pb-8 relative z-10 text-white">
            <div className="flex items-center gap-6 mb-4">
              {store.image && (
                <div className="w-24 h-24 rounded-2xl border-4 border-white/20 overflow-hidden shadow-2xl bg-white/10 backdrop-blur-md">
                  <img src={store.image} alt="Logo" className="w-full h-full object-cover" />
                </div>
              )}
              <div>
                <h1 className="text-4xl sm:text-5xl font-extrabold mb-2 tracking-tight">{store.name}</h1>
                <p className="text-white/80 text-sm max-w-xl line-clamp-1">{store.description}</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-6 text-sm font-bold">
               <div className="flex items-center gap-1.5 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full">
                 <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                 <span>4.8 (500+)</span>
               </div>
               <div className="flex items-center gap-1.5 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full">
                 <Clock className="h-4 w-4" />
                 <span>20-30 min</span>
               </div>
               <div className="flex items-center gap-1.5 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full">
                 <Info className="h-4 w-4" />
                 <span>${store.deliveryCharge.toFixed(2)} Delivery</span>
               </div>
            </div>
         </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          <aside className="lg:w-80 space-y-8 sticky top-24 h-fit hidden lg:block">
            <StoreSideCart 
              storeId={store.id} 
              storeName={store.name} 
              deliveryCharge={store.deliveryCharge} 
            />

            <div>
              <h2 className="text-xl font-extrabold mb-6 tracking-tight">Categories</h2>
              <div className="space-y-2">
                {store.categories.map((cat: any) => (
                  <a 
                    key={cat.id} 
                    href={`#${cat.id}`}
                    className="block px-4 py-3 rounded-xl hover:bg-primary hover:text-primary-foreground transition-all font-bold text-muted-foreground bg-card border"
                  >
                    {cat.name}
                  </a>
                ))}
              </div>
            </div>
          </aside>

          <div className="flex-1 space-y-12">
            {store.categories.map((category: any) => (
              <section key={category.id} id={category.id} className="scroll-mt-24">
                <h3 className="text-3xl font-extrabold mb-8 pb-4 border-b tracking-tight">{category.name}</h3>
                <div className="grid sm:grid-cols-2 gap-8">
                  {category.products.map((product: any) => (
                    <div key={product.id} className="group flex gap-5 p-5 rounded-[2rem] border bg-card hover:shadow-2xl hover:shadow-primary/5 transition-all duration-300">
                      <div className="flex-1 flex flex-col">
                        <h4 className="font-extrabold text-xl group-hover:text-primary transition-colors">{product.name}</h4>
                        <p className="text-muted-foreground text-xs leading-relaxed mt-2 mb-4 line-clamp-2">
                          {product.description || "Freshly prepared with the best ingredients."}
                        </p>
                        <div className="mt-auto flex items-center justify-between gap-4">
                          <span className="font-extrabold text-2xl text-primary">${product.price.toFixed(2)}</span>
                          <AddToCartButton 
                            item={{
                              id: product.id,
                              name: product.name,
                              price: product.price,
                              storeId: store.id,
                              image: product.image,
                              quantity: 1
                            }} 
                          />
                        </div>
                      </div>
                      <div className="w-28 h-28 sm:w-32 sm:h-32 bg-muted rounded-3xl flex-shrink-0 overflow-hidden relative border shadow-inner">
                         {product.image ? (
                            <img src={product.image} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                         ) : (
                            <ShoppingBag className="h-10 w-10 text-muted-foreground/20 absolute inset-0 m-auto" />
                         )}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            ))}

            {/* Review Section */}
            <ReviewSection storeId={store.id} />
          </div>
        </div>
      </div>
    </div>
  );
}

