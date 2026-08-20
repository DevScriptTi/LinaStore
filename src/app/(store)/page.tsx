import React from "react";
import { HeroSection } from "@/components/store/HeroSection";
import { FeaturesSection } from "@/components/store/FeaturesSection";
import { ProductCard, Product } from "@/components/store/ProductCard";
import { db } from "@/lib/firebase/config";
import { collection, query, where, getDocs, limit, orderBy } from "firebase/firestore";
import { Sparkles, ArrowLeft, ShoppingBag } from "lucide-react";
import Link from "next/link";

const mockFeaturedProducts: Product[] = [
  {
    id: "p-1",
    name: "سيروم فيتامين سي للوجه 50ml",
    price: 4500,
    oldPrice: 6000,
    category: "العناية بالبشرة",
    description: "سيروم مركز يعزز نضارة البشرة ويقلل من التصبغات والبقع الداكنة.",
    badge: "الأكثر مبيعاً",
    rating: 4.9,
    isFeatured: true,
  },
  {
    id: "b-1",
    name: "باقة العناية الملكية الشاملة",
    price: 12000,
    oldPrice: 15500,
    category: "مجموعات مميزة",
    description: "باقة حصرية تضم سيروم فيتامين C، كريم الترطيب العميق، وغسول البشرة اللطيف.",
    badge: "باقة توفير",
    rating: 5.0,
    isBundle: true,
    isFreeShipping: true,
    isFeatured: true,
  },
  {
    id: "p-2",
    name: "عطر اللافندر والمسك 100ml",
    price: 8500,
    oldPrice: 9900,
    category: "العطور",
    description: "نفحات عطرية فاخرة تمنحك حضوراً مميزاً طوال اليوم.",
    badge: "جديد",
    rating: 4.8,
    isFeatured: true,
  },
];

export default async function StoreHomePage() {
  let featuredProducts: Product[] = [];

  try {
    const q = query(
      collection(db, "products"),
      where("isFeatured", "==", true),
      limit(6)
    );
    const snapshot = await getDocs(q);

    if (!snapshot.empty) {
      featuredProducts = snapshot.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          name: data.title || data.name || "منتج Lina Store",
          price: data.price || 0,
          oldPrice: data.compareAtPrice ?? data.oldPrice ?? undefined,
          category: data.categoryId || data.category || "عام",
          description: data.shortDescription || data.description || "",
          badge: data.badge || (data.type === "bundle" ? "باقة توفير" : undefined),
          rating: data.rating || 4.9,
          isBundle: data.type === "bundle" || data.isBundle,
          isFreeShipping: data.isFreeShipping,
          images: data.images,
        };
      });
    } else {
      // Fallback query if no isFeatured flag set yet
      const fallbackQuery = query(collection(db, "products"), limit(6));
      const fallbackSnap = await getDocs(fallbackQuery);
      if (!fallbackSnap.empty) {
        featuredProducts = fallbackSnap.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            name: data.title || data.name || "منتج Lina Store",
            price: data.price || 0,
            oldPrice: data.compareAtPrice ?? data.oldPrice ?? undefined,
            category: data.categoryId || data.category || "عام",
            description: data.shortDescription || data.description || "",
            badge: data.badge || (data.type === "bundle" ? "باقة توفير" : undefined),
            rating: data.rating || 4.9,
            isBundle: data.type === "bundle" || data.isBundle,
            isFreeShipping: data.isFreeShipping,
            images: data.images,
          };
        });
      } else {
        featuredProducts = mockFeaturedProducts;
      }
    }
  } catch (err) {
    console.warn("Error fetching featured products from Firestore:", err);
    featuredProducts = mockFeaturedProducts;
  }

  return (
    <div className="space-y-16 py-6" dir="rtl">
      {/* Hero Section */}
      <HeroSection />

      {/* Features Section */}
      <FeaturesSection />

      {/* Featured Products Grid Section */}
      <section className="space-y-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl md:text-3xl font-black text-gray-900 dark:text-white flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-orange-500 dark:text-orange-400" />
              <span>أبرز المنتجات والباقات المميزة ⭐</span>
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">تصفح تشكيلة مختارة من أرقى المنتجات والباقات في متجر لينا</p>
          </div>

          <Link
            href="/products"
            className="flex items-center gap-2 text-sm font-bold text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300 transition-colors"
          >
            <span>عرض كل المنتجات</span>
            <ArrowLeft className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {featuredProducts.map((prod) => (
            <ProductCard key={prod.id} product={prod} />
          ))}
        </div>
      </section>
    </div>
  );
}
