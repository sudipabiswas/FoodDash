import { Percent, Tag, Clock } from "lucide-react";
import { prisma } from "@/lib/prisma";
import OfferCard from "@/components/offers/OfferCard";

export default async function OffersPage() {
// ... (rest of the server component logic)
  const activeCoupons = await prisma.coupon.findMany({
    where: {
      isActive: true,
      expiryDate: {
        gte: new Date()
      }
    },
    include: {
      store: true
    }
  });

  const dbOffers = activeCoupons.map((coupon: any, index: number) => ({
    id: coupon.id,
    title: coupon.type === 'PERCENTAGE' ? `${coupon.discount}% OFF` : `$${coupon.discount.toFixed(2)} OFF`,
    description: `Special discount from ${coupon.store?.name || 'our partner'}. Apply this code at checkout to claim your deal!`,
    code: coupon.code,
    icon: coupon.type === 'PERCENTAGE' ? 'percent' : 'tag',
    color: index % 2 === 0 ? "bg-green-100 text-green-600" : "bg-pink-100 text-pink-600",
    expires: `Expires ${coupon.expiryDate.toLocaleDateString()}`,
    storeId: coupon.storeId,
    storeName: coupon.store?.name
  }));

  const globalOffers = [
    {
      id: "global-1",
      title: "50% Off First Order",
      description: "Welcome to FoodDash! Enjoy a massive 50% discount on your very first order with us. Up to $15 off.",
      code: "WELCOME50",
      icon: 'percent',
      color: "bg-blue-100 text-blue-600",
      expires: "Valid for new users",
    },
    {
      id: "global-2",
      title: "Free Delivery Weekend",
      description: "Order from any restaurant this weekend and get delivery absolutely free! Minimum order $20.",
      code: "FREEDEL20",
      icon: 'clock',
      color: "bg-purple-100 text-purple-600",
      expires: "Ends Sunday 11:59 PM",
    },
    {
      id: "global-3",
      title: "20% Off Burgers",
      description: "Craving a burger? Get 20% off all burger category items from participating restaurants.",
      code: "BURGER20",
      icon: 'tag',
      color: "bg-orange-100 text-orange-600",
      expires: "Ends in 2 days",
    }
  ];

  const allOffers = [...dbOffers, ...globalOffers];

  return (
    <div className="container mx-auto px-4 py-12 max-w-6xl">
      <div className="text-center space-y-4 mb-16 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
          Exclusive Offers
        </h1>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
          Save big on your favorite meals with our curated selection of deals, discounts, and promotions.
        </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
        {allOffers.map((offer: any, index: number) => (
          <OfferCard key={offer.id} offer={offer} index={index} />
        ))}
      </div>

      <div className="mt-20 bg-primary rounded-[3rem] p-12 text-center text-primary-foreground relative overflow-hidden">
         <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
         <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-64 h-64 bg-black/10 rounded-full blur-3xl"></div>
         <div className="relative z-10 space-y-6 max-w-2xl mx-auto">
            <h2 className="text-3xl font-extrabold">Never Miss a Deal!</h2>
            <p className="text-primary-foreground/80 text-lg">
               Subscribe to our newsletter to get the latest offers and exclusive discounts delivered straight to your inbox.
            </p>
            <div className="flex gap-2 max-w-md mx-auto">
               <input 
                 type="email" 
                 placeholder="Enter your email" 
                 className="flex-1 px-4 py-3 rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-white"
               />
               <button className="px-6 py-3 bg-white text-primary font-bold rounded-xl hover:bg-gray-100 transition-colors shadow-lg">
                  Subscribe
               </button>
            </div>
         </div>
      </div>
    </div>
  );
}
