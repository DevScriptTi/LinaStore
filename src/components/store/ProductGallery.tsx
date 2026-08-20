"use client";

import React, { useState } from "react";
import { IProductImage } from "@/types";
import { ShoppingBag, Image as ImageIcon } from "lucide-react";

interface ProductGalleryProps {
  images?: (IProductImage | string)[];
  title?: string;
}

export function ProductGallery({ images = [], title = "Product" }: ProductGalleryProps) {
  // Normalize images to array of URLs
  const imageUrls: string[] = images.map((img) => (typeof img === "string" ? img : img.url));

  // Determine initial selected index (prefer isMain if available)
  const initialIndex = images.findIndex((img) => typeof img !== "string" && img.isMain);
  const [selectedIndex, setSelectedIndex] = useState<number>(initialIndex >= 0 ? initialIndex : 0);

  const currentImage = imageUrls[selectedIndex] || imageUrls[0];

  return (
    <div className="space-y-4 select-none" dir="rtl">
      {/* Main Image View Container */}
      <div className="relative aspect-square w-full rounded-3xl overflow-hidden bg-orange-50/50 dark:bg-orange-950/20 border border-gray-200 dark:border-white/10 shadow-sm flex items-center justify-center group">
        {currentImage ? (
          <img
            src={currentImage}
            alt={title}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex flex-col items-center gap-3 text-orange-600 dark:text-orange-400 p-8">
            <div className="p-6 rounded-full bg-orange-100/60 dark:bg-orange-900/30">
              <ShoppingBag className="w-16 h-16" />
            </div>
            <span className="text-xs font-semibold">لا تتوفر صورة للمنتج</span>
          </div>
        )}
      </div>

      {/* Thumbnails Selection Row */}
      {imageUrls.length > 1 && (
        <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-none">
          {imageUrls.map((url, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setSelectedIndex(idx)}
              className={`relative w-20 h-20 rounded-2xl overflow-hidden border-2 transition-all shrink-0 bg-gray-100 dark:bg-gray-800 ${
                selectedIndex === idx
                  ? "border-orange-500 ring-4 ring-orange-500/20 scale-95"
                  : "border-transparent opacity-70 hover:opacity-100"
              }`}
            >
              {url ? (
                <img src={url} alt={`${title} ${idx + 1}`} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  <ImageIcon className="w-5 h-5" />
                </div>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
