"use client";

import React from "react";
import Link from "next/link";
import { ShoppingBag, Star, Layers, Eye } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

export interface Product {
  id: string;
  name: string;
  title?: string;
  price: number;
  oldPrice?: number;
  compareAtPrice?: number | null;
  category: string;
  categoryId?: string;
  description?: string;
  shortDescription?: string;
  image?: string;
  images?: any[];
  badge?: string;
  rating?: number;
  isBundle?: boolean;
  type?: "product" | "bundle";
  isFeatured?: boolean;
  isFreeShipping?: boolean;
}

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const prodTitle = product.title || product.name || "منتج Lina Store";
  const prodCategory = product.categoryId || product.category || "عام";
  const prodPrice = product.price || 0;
  const prodOldPrice = product.compareAtPrice ?? product.oldPrice ?? null;

  // Extract main image URL
  let imgUrl: string | null = product.image || null;
  if (!imgUrl && product.images && product.images.length > 0) {
    const first = product.images[0];
    if (typeof first === "string") {
      imgUrl = first;
    } else {
      imgUrl = product.images.find((i: any) => i.isMain)?.url || first.url;
    }
  }

  const isBundleType = product.type === "bundle" || product.isBundle;
  const displayRating = product.rating || 4.9;

  return (
    <div className="rounded-3xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1C1B1F] shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col justify-between group h-full select-none">
      
      {/* Clickable Image & Content Block -> Navigates to Product Details /products/[id] */}
      <Link href={`/products/${product.id}`} className="flex flex-col flex-1 group/link">
        {/* Top Image Area & Badges */}
        <div className="relative aspect-square bg-orange-50/50 dark:bg-orange-950/20 border-b border-gray-100 dark:border-white/5 flex items-center justify-center overflow-hidden">
          {imgUrl ? (
            <img
              src={imgUrl}
              alt={prodTitle}
              className="w-full h-full object-cover group-hover/link:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="p-6 rounded-full bg-orange-100/60 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 group-hover/link:scale-110 transition-transform">
              <ShoppingBag className="w-12 h-12" />
            </div>
          )}

          {/* Floating Type & Free Shipping Badges */}
          <div className="absolute top-3 right-3 flex flex-col gap-1.5 items-end">
            {isBundleType ? (
              <span className="px-3 py-1 rounded-full bg-amber-500/90 text-slate-950 font-extrabold text-xs shadow-sm flex items-center gap-1 backdrop-blur-sm">
                <Layers className="w-3.5 h-3.5" /> باقة توفيرية
              </span>
            ) : product.badge ? (
              <span className="px-3 py-1 rounded-full bg-orange-600 text-white font-bold text-xs shadow-sm">
                {product.badge}
              </span>
            ) : null}

            {product.isFreeShipping && (
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500 text-white font-bold text-[10px] shadow-sm">
                🚚 توصيل مجاني
              </span>
            )}
          </div>

          {/* Rating Indicator */}
          <div className="absolute bottom-3 left-3 px-2.5 py-1 rounded-full bg-black/60 text-amber-300 text-xs font-bold flex items-center gap-1 backdrop-blur-md">
            <Star className="w-3.5 h-3.5 fill-current text-amber-400" />
            <span>{displayRating}</span>
          </div>

          {/* Hover View Details Icon Overlay */}
          <div className="absolute inset-0 bg-black/20 opacity-0 group-hover/link:opacity-100 transition-opacity flex items-center justify-center">
            <span className="px-3 py-1.5 rounded-full bg-white/90 text-gray-900 text-xs font-extrabold shadow-md flex items-center gap-1.5 backdrop-blur-sm">
              <Eye className="w-3.5 h-3.5 text-orange-600" /> عرض التفاصيل
            </span>
          </div>
        </div>

        {/* Card Content Block */}
        <div className="p-5 flex-1 space-y-1.5">
          <span className="text-xs font-semibold text-orange-600 dark:text-orange-400 block">
            {prodCategory}
          </span>
          <h3 className="text-base font-extrabold text-gray-900 dark:text-white group-hover/link:text-orange-600 dark:group-hover/link:text-orange-400 transition-colors line-clamp-1">
            {prodTitle}
          </h3>
          {(product.shortDescription || product.description) && (
            <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2 leading-relaxed">
              {product.shortDescription || product.description}
            </p>
          )}
        </div>
      </Link>

      {/* Bottom Area: Pricing in Dinar (د.ج) & Direct Checkout Button */}
      <div className="p-5 pt-0 space-y-3">
        <div className="pt-3 border-t border-gray-100 dark:border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg font-black text-orange-600 dark:text-orange-400">
              {formatCurrency(prodPrice)}
            </span>
            {prodOldPrice && prodOldPrice > prodPrice && (
              <span className="text-xs text-red-500 line-through font-semibold opacity-80">
                {formatCurrency(prodOldPrice)}
              </span>
            )}
          </div>
        </div>

        {/* Primary Action Button: "أطلب الآن" Direct to /checkout/[id] */}
        <Link
          href={`/checkout/${product.id}`}
          className="w-full py-3 px-4 rounded-full bg-orange-600 hover:bg-orange-700 text-white font-extrabold text-xs shadow-md shadow-orange-600/20 active:scale-98 transition-all flex items-center justify-center gap-2"
        >
          <ShoppingBag className="w-4 h-4" />
          <span>أطلب الآن (الدفع عند الاستلام)</span>
        </Link>
      </div>

    </div>
  );
}
