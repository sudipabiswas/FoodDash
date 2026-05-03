import { Rocket, Heart, Shield, Zap } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export default function AboutPage() {
  const values = [
    {
      icon: Rocket,
      title: "Fast Delivery",
      description: "We pride ourselves on getting your food to you while it's still hot and fresh.",
      color: "bg-orange-100 text-orange-600"
    },
    {
      icon: Heart,
      title: "Quality First",
      description: "We partner only with the best local restaurants that meet our strict quality standards.",
      color: "bg-red-100 text-red-600"
    },
    {
      icon: Shield,
      title: "Secure Platform",
      description: "Your data and payments are protected by industry-leading security protocols.",
      color: "bg-blue-100 text-blue-600"
    },
    {
      icon: Zap,
      title: "Innovation",
      description: "We continuously improve our app to provide the most seamless ordering experience.",
      color: "bg-purple-100 text-purple-600"
    }
  ];

  return (
    <div className="animate-in fade-in duration-700">
      {/* Hero Section */}
      <section className="relative bg-muted py-24 overflow-hidden">
         <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-purple-600/10 mix-blend-multiply"></div>
         <div className="container mx-auto px-4 relative z-10 text-center space-y-6 max-w-3xl">
            <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight">
               Connecting you with the food you <span className="text-primary">love.</span>
            </h1>
            <p className="text-xl text-muted-foreground">
               FoodDash is on a mission to transform the way you experience food delivery. We bring the best local restaurants right to your doorstep.
            </p>
         </div>
      </section>

      {/* Story Section */}
      <section className="py-24 container mx-auto px-4 max-w-6xl">
         <div className="grid md:grid-cols-2 gap-16 items-center">
            <div className="space-y-6">
               <h2 className="text-3xl font-bold">Our Story</h2>
               <p className="text-muted-foreground leading-relaxed text-lg">
                  Founded in 2026, FoodDash started with a simple idea: make food delivery fast, reliable, and fair for everyone. We noticed that local restaurants were struggling with high commission fees, and customers were tired of cold food and hidden charges.
               </p>
               <p className="text-muted-foreground leading-relaxed text-lg">
                  We built a platform that puts the community first. By equipping restaurant owners with powerful management tools and providing customers with a seamless app experience, we are bridging the gap between great food and hungry people.
               </p>
               <div className="pt-4 flex gap-4">
                  <div className="space-y-1">
                     <h4 className="text-3xl font-extrabold text-primary">500+</h4>
                     <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Restaurants</p>
                  </div>
                  <div className="space-y-1 pl-6 border-l">
                     <h4 className="text-3xl font-extrabold text-primary">50k+</h4>
                     <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Happy Users</p>
                  </div>
               </div>
            </div>
            <div className="relative h-[500px] bg-muted rounded-[3rem] overflow-hidden border">
               <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-purple-600/20"></div>
               {/* Placeholder for an actual image if they upload one */}
               <div className="absolute inset-0 flex items-center justify-center text-muted-foreground/30">
                  <Heart className="h-32 w-32" />
               </div>
            </div>
         </div>
      </section>

      {/* Values Section */}
      <section className="bg-card border-y py-24">
         <div className="container mx-auto px-4 max-w-6xl space-y-16">
            <div className="text-center space-y-4">
               <h2 className="text-3xl font-bold">Our Core Values</h2>
               <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                  These principles guide everything we do, from writing code to delivering your dinner.
               </p>
            </div>
            
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
               {values.map((val: any) => {
                 const Icon = val.icon;
                 return (
                   <div key={val.title} className="bg-background border rounded-[2rem] p-8 space-y-4 hover:shadow-xl transition-all">
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${val.color}`}>
                         <Icon className="h-7 w-7" />
                      </div>
                      <h3 className="text-xl font-bold">{val.title}</h3>
                      <p className="text-muted-foreground leading-relaxed">{val.description}</p>
                   </div>
                 );
               })}
            </div>
         </div>
      </section>

      {/* CTA */}
      <section className="py-24 container mx-auto px-4 text-center max-w-3xl space-y-8">
         <h2 className="text-4xl font-extrabold">Ready to order?</h2>
         <p className="text-xl text-muted-foreground">
            Join thousands of others who are already enjoying the best food delivery experience.
         </p>
         <div className="flex justify-center gap-4 pt-4">
            <Link href="/stores" className="px-8 py-4 bg-primary text-primary-foreground font-bold rounded-full hover:shadow-lg hover:-translate-y-1 transition-all">
               Browse Restaurants
            </Link>
            <Link href="/register" className="px-8 py-4 bg-muted text-foreground font-bold rounded-full hover:bg-muted/80 transition-all">
               Become a Partner
            </Link>
         </div>
      </section>
    </div>
  );
}
