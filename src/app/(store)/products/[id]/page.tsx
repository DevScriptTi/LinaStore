import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/firebase/config";
import { doc, getDoc } from "firebase/firestore";
import { IProduct } from "@/types";
import { ProductGallery } from "@/components/store/ProductGallery";
import { BundleItemsList } from "@/components/store/BundleItemsList";
import { formatCurrency } from "@/lib/utils";
import { ShoppingBag, Star, ShieldCheck, Truck, RefreshCw, ChevronLeft, Layers } from "lucide-react";

interface ProductDetailsPageProps {
  params: Promise<{ id: string }>;
}

const mockProductsList: IProduct[] = [
  {
    id: "p-1",
    title: "سيروم فيتامين سي للوجه 50ml",
    type: "product",
    categoryId: "العناية بالبشرة",
    price: 4500,
    compareAtPrice: 6000,
    shortDescription: "سيروم مركز يعزز نضارة البشرة ويقلل من التصبغات والبقع الداكنة.",
    description: "<h3>مميزات المنتج:</h3><ul><li>تركيبة غنية بفيتامين C النقي وحمض الهيالورونيك.</li><li>يمنح البشرة إشراقة فورية ونضارة دائمة.</li><li>مناسب لجميع أنواع البشرة.</li></ul>",
    images: [{ url: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=800&q=80", isMain: true }],
    rating: 4.9,
    isActive: true,
  },
  {
    id: "b-1",
    title: "باقة العناية الملكية الشاملة",
    type: "bundle",
    categoryId: "مجموعات مميزة",
    price: 12000,
    compareAtPrice: 15500,
    shortDescription: "باقة حصرية تضم سيروم فيتامين C، كريم الترطيب العميق، وغسول البشرة اللطيف.",
    description: "<p>احصل على أفضل تجربة عناية متكاملة ببشرتك مع هذه الباقة الملكية التوفيرية التي تمنحك خصماً حصرياً.</p>",
    images: [{ url: "https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=800&q=80", isMain: true }],
    bundleItems: [
      { title: "سيروم فيتامين C النقي 50ml", image: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=400&q=80", quantity: 1 },
      { title: "كريم الترطيب العميق 100ml", image: "", quantity: 1 },
      { title: "غسول البشرة المنعش 150ml", image: "", quantity: 1 },
    ],
    rating: 5.0,
    isActive: true,
  },
];

export default async function ProductDetailsPage({ params }: ProductDetailsPageProps) {
  const { id } = await params;

  let product: IProduct | null = null;

  try {
    const docRef = doc(db, "products", id);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      product = {
        id: docSnap.id,
        ...(docSnap.data() as Omit<IProduct, "id">),
      };
    } else {
      // Fallback mock check
      const mockMatch = mockProductsList.find((p) => p.id === id);
      if (mockMatch) {
        product = mockMatch;
      }
    }
  } catch (err) {
    console.warn("Error fetching product from Firestore:", err);
    const mockMatch = mockProductsList.find((p) => p.id === id);
    if (mockMatch) {
      product = mockMatch;
    }
  }

  if (!product) {
    notFound();
  }

  const titleText = product.title || product.name || "منتج Lina Store";
  const categoryText = product.categoryId || product.category || "عام";
  const priceVal = product.price || 0;
  const comparePriceVal = product.compareAtPrice ?? product.oldPrice ?? null;
  const discountPercent =
    comparePriceVal && comparePriceVal > priceVal && priceVal > 0
      ? Math.round(((comparePriceVal - priceVal) / comparePriceVal) * 100)
      : null;

  const isBundleType = product.type === "bundle" || product.isBundle;

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-[#121212] text-gray-900 dark:text-white py-8 transition-colors duration-200" dir="rtl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* Breadcrumbs Navigation */}
        <nav className="flex items-center gap-2 text-xs font-semibold text-gray-500 dark:text-gray-400">
          <Link href="/" className="hover:text-orange-600 dark:hover:text-orange-400 transition-colors">
            الرئيسية
          </Link>
          <ChevronLeft className="w-3.5 h-3.5 rotate-180" />
          <Link href="/products" className="hover:text-orange-600 dark:hover:text-orange-400 transition-colors">
            المنتجات
          </Link>
          <ChevronLeft className="w-3.5 h-3.5 rotate-180" />
          <span className="text-gray-900 dark:text-white font-bold truncate max-w-xs">{titleText}</span>
        </nav>

        {/* Main Product Layout (2-Column Grid) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
          
          {/* Column 1: Interactive Image Gallery */}
          <div>
            <ProductGallery images={product.images} title={titleText} />
          </div>

          {/* Column 2: Product Info & Actions */}
          <div className="space-y-6">
            
            {/* Category & Badges */}
            <div className="flex items-center justify-between gap-4">
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-orange-100 dark:bg-orange-950/60 text-orange-700 dark:text-orange-300 border border-orange-200 dark:border-orange-500/30">
                {categoryText}
              </span>

              {isBundleType ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-700 dark:text-amber-300 text-xs font-bold">
                  <Layers className="w-3.5 h-3.5" /> باقة توفيرية (Bundle)
                </span>
              ) : (
                <div className="flex items-center gap-1 text-xs font-bold text-amber-500">
                  <Star className="w-4 h-4 fill-current" />
                  <span>{product.rating || "4.9"}</span>
                  <span className="text-gray-400 font-normal">(42 تقييم)</span>
                </div>
              )}
            </div>

            {/* Title */}
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white leading-tight">
              {titleText}
            </h1>

            {/* Pricing Section (Dinar Currency د.ج) */}
            <div className="p-5 rounded-3xl bg-white dark:bg-[#1C1B1F] border border-gray-200 dark:border-white/10 shadow-sm flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-xs text-gray-500 dark:text-gray-400 block font-medium">السعر النهائي</span>
                <div className="flex items-center gap-3">
                  <span className="text-2xl md:text-3xl font-black text-orange-600 dark:text-orange-400">
                    {formatCurrency(priceVal)}
                  </span>
                  {comparePriceVal && comparePriceVal > priceVal && (
                    <span className="text-sm font-semibold text-red-500 line-through opacity-80 decoration-2">
                      {formatCurrency(comparePriceVal)}
                    </span>
                  )}
                </div>
              </div>

              {discountPercent !== null && (
                <span className="px-4 py-2 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 font-black text-sm">
                  خصم {discountPercent}%-
                </span>
              )}
            </div>

            {/* Short Description */}
            {product.shortDescription && (
              <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                {product.shortDescription}
              </p>
            )}

            {/* Action Area: Direct Checkout (أطلب الآن) */}
            <div className="pt-2 space-y-2">
              <Link
                href={`/checkout/${product.id}`}
                className="w-full py-4 px-8 rounded-full bg-orange-600 hover:bg-orange-700 text-white font-extrabold text-lg shadow-lg shadow-orange-600/30 active:scale-98 transition-all flex items-center justify-center gap-3"
              >
                <ShoppingBag className="w-6 h-6" />
                <span>أطلب الآن (الدفع عند الاستلام)</span>
              </Link>
              {product.isFreeShipping && (
                <div className="text-center">
                  <span className="inline-block px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold text-xs">
                    🚚 هذا المنتج يشمل توصيل مجاني لجميع 58 ولاية!
                  </span>
                </div>
              )}
            </div>

            {/* Trust Badges Bar */}
            <div className="grid grid-cols-3 gap-3 pt-2 text-center text-xs font-semibold text-gray-600 dark:text-gray-400">
              <div className="p-3 rounded-2xl bg-white dark:bg-[#1C1B1F] border border-gray-200 dark:border-white/5 space-y-1">
                <Truck className="w-5 h-5 mx-auto text-orange-600 dark:text-orange-400" />
                <span>توصيل سريع</span>
              </div>
              <div className="p-3 rounded-2xl bg-white dark:bg-[#1C1B1F] border border-gray-200 dark:border-white/5 space-y-1">
                <ShieldCheck className="w-5 h-5 mx-auto text-orange-600 dark:text-orange-400" />
                <span>منتج أصلي 100%</span>
              </div>
              <div className="p-3 rounded-2xl bg-white dark:bg-[#1C1B1F] border border-gray-200 dark:border-white/5 space-y-1">
                <RefreshCw className="w-5 h-5 mx-auto text-orange-600 dark:text-orange-400" />
                <span>ضمان الاسترجاع</span>
              </div>
            </div>

            {/* Bundle Items Component (If product.type === 'bundle') */}
            {isBundleType && product.bundleItems && product.bundleItems.length > 0 && (
              <BundleItemsList bundleItems={product.bundleItems} />
            )}

            {/* Rich Text HTML Description */}
            {product.description && (
              <div className="pt-6 border-t border-gray-200 dark:border-white/10 space-y-3">
                <h3 className="text-base font-bold text-gray-900 dark:text-white">تفاصيل المنتج والمواصفات:</h3>
                <div
                  className="prose dark:prose-invert prose-orange max-w-none text-sm text-gray-700 dark:text-gray-300 leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: product.description }}
                />
              </div>
            )}

          </div>

        </div>

      </div>
    </main>
  );
}
