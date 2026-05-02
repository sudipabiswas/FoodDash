import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/layout/Navbar";
import { CartProvider } from "@/components/cart/CartProvider";
import { AuthProvider } from "@/components/providers/SessionProvider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "FoodDash | Smart Multi-Store Food Delivery",
  description: "Browse menus, place orders, and track deliveries from multiple restaurants in one place.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className={`${inter.className} min-h-full flex flex-col`}>
        <AuthProvider>
          <CartProvider>
            <Navbar />
            <main className="flex-1">
              {children}
            </main>
            <footer className="border-t bg-muted/30 py-8 text-center text-sm text-muted-foreground">
              <p>© 2026 FoodDash. All rights reserved.</p>
            </footer>
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
