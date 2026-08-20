"use client";

import React from "react";
import { Filter, RotateCcw, Check, Sparkles } from "lucide-react";

interface SidebarFilterProps {
  categories: string[];
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
  priceRange: number;
  onChangePriceRange: (val: number) => void;
  maxPrice: number;
  onReset: () => void;
}

export function SidebarFilter({
  categories,
  selectedCategory,
  onSelectCategory,
  priceRange,
  onChangePriceRange,
  maxPrice,
  onReset,
}: SidebarFilterProps) {
  return (
    <aside className="p-6 rounded-2xl bg-white dark:bg-[#1C1B1F] border border-gray-200 dark:border-white/10 shadow-sm space-y-6 select-none" dir="rtl">
      
      {/* Filter Header */}
      <div className="flex items-center justify-between border-b border-gray-100 dark:border-white/10 pb-4">
        <div className="flex items-center gap-2 text-gray-900 dark:text-white font-bold text-base">
          <Filter className="w-5 h-5 text-orange-600 dark:text-orange-400" />
          <span>تصفية المنتجات</span>
        </div>

        <button
          type="button"
          onClick={onReset}
          className="flex items-center gap-1 text-xs text-orange-600 dark:text-orange-400 hover:underline font-semibold"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>إعادة ضبط</span>
        </button>
      </div>

      {/* Category Filter Section */}
      <div className="space-y-3">
        <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-orange-500" />
          <span>التصنيفات</span>
        </h4>

        <div className="space-y-1.5">
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => onSelectCategory(cat)}
                className={`w-full flex items-center justify-between px-4 py-2.5 rounded-full text-xs font-semibold transition-all ${
                  isSelected
                    ? "bg-orange-100 dark:bg-orange-950/80 text-orange-700 dark:text-orange-300 border border-orange-300 dark:border-orange-500/40 shadow-xs"
                    : "border border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5"
                }`}
              >
                <span>{cat}</span>
                {isSelected && <Check className="w-4 h-4 text-orange-600 dark:text-orange-400 shrink-0" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Price Range Filter Section */}
      <div className="space-y-3 pt-4 border-t border-gray-100 dark:border-white/10">
        <div className="flex items-center justify-between text-xs font-bold">
          <span className="text-gray-500 dark:text-gray-400">السعر الأقصى:</span>
          <span className="text-orange-600 dark:text-orange-400 font-extrabold">{priceRange} ر.س</span>
        </div>

        <input
          type="range"
          min={50}
          max={maxPrice}
          step={10}
          value={priceRange}
          onChange={(e) => onChangePriceRange(Number(e.target.value))}
          className="w-full accent-orange-600 dark:accent-orange-500 cursor-pointer h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none"
        />

        <div className="flex justify-between text-[11px] text-gray-400 font-medium">
          <span>50 ر.س</span>
          <span>{maxPrice} ر.س</span>
        </div>
      </div>

    </aside>
  );
}
