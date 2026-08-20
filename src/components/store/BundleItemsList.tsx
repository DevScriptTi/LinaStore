"use client";

import React from "react";
import { Package, Layers } from "lucide-react";

interface BundleItem {
  title: string;
  image?: string;
  quantity: number;
}

interface BundleItemsListProps {
  bundleItems?: BundleItem[];
}

export function BundleItemsList({ bundleItems = [] }: BundleItemsListProps) {
  if (!bundleItems || bundleItems.length === 0) return null;

  return (
    <div className="space-y-3 p-5 rounded-3xl bg-amber-500/10 dark:bg-amber-950/30 border border-amber-500/20 text-gray-900 dark:text-white select-none" dir="rtl">
      <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
        <Layers className="w-5 h-5" />
        <h3 className="text-base font-bold">مكونات هذه المجموعة (Bundle Items 📦)</h3>
      </div>
      <p className="text-xs text-gray-600 dark:text-gray-400">
        تحتوي هذه الباقة التوفيرية المميزة على العناصر التالية:
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
        {bundleItems.map((item, idx) => (
          <div
            key={idx}
            className="p-3 rounded-2xl bg-white dark:bg-[#1C1B1F] border border-gray-200 dark:border-white/10 shadow-sm flex items-center justify-between gap-3"
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl overflow-hidden bg-amber-100 dark:bg-amber-900/40 border border-amber-200 dark:border-amber-700/40 flex items-center justify-center shrink-0">
                {item.image ? (
                  <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                ) : (
                  <Package className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                )}
              </div>
              <span className="text-xs font-bold text-gray-900 dark:text-white line-clamp-2">
                {item.title}
              </span>
            </div>

            <span className="px-2.5 py-1 rounded-full bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300 font-extrabold text-xs shrink-0">
              {item.quantity}×
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
