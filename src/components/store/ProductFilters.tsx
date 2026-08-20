"use client";

import React, { useState } from "react";
import { Search, SlidersHorizontal, ArrowUpDown, Layers, ChevronDown } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface ProductFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  selectedType: string;
  onSelectedTypeChange: (type: string) => void;
  maxPrice: number;
  onMaxPriceChange: (val: number) => void;
  sortBy: string;
  onSortByChange: (val: string) => void;
}

export function ProductFilters({
  searchTerm,
  onSearchChange,
  selectedType,
  onSelectedTypeChange,
  maxPrice,
  onMaxPriceChange,
  sortBy,
  onSortByChange,
}: ProductFiltersProps) {
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);

  return (
    <div className="p-5 rounded-3xl bg-white dark:bg-[#1C1B1F] border border-gray-200 dark:border-white/10 shadow-sm space-y-4 select-none" dir="rtl">
      
      {/* Accordion Header / Toggle Button */}
      <button
        type="button"
        onClick={() => setIsFiltersOpen((prev) => !prev)}
        className="w-full flex items-center justify-between text-gray-900 dark:text-white pb-1 md:pb-3 border-b border-gray-100 dark:border-white/10 outline-none cursor-pointer group"
      >
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-5 h-5 text-orange-600 dark:text-orange-400 shrink-0" />
          <h3 className="text-base font-extrabold">تصفية وبحث المنتجات 🔍</h3>
        </div>

        <div className="flex items-center gap-1 text-xs text-orange-600 dark:text-orange-400 font-bold md:hidden">
          <span>{isFiltersOpen ? "إخفاء التصفية" : "عرض التصفية"}</span>
          <ChevronDown
            className={`w-5 h-5 text-orange-600 dark:text-orange-400 transition-transform duration-300 ${
              isFiltersOpen ? "rotate-180" : ""
            }`}
          />
        </div>
      </button>

      {/* Collapsible Filter Body Wrapper */}
      <div className={`space-y-5 transition-all duration-300 overflow-hidden ${isFiltersOpen ? "block" : "hidden"} md:block`}>
        
        {/* Text Search Input Bar */}
        <div className="space-y-1.5 pt-1">
          <label className="block text-xs font-bold text-gray-700 dark:text-gray-300">ابحث باسم المنتج أو الوصف:</label>
          <div className="relative">
            <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="اكتب ما تبحث عنه هنا..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pr-10 pl-4 py-2.5 rounded-2xl bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-white/10 text-xs text-gray-900 dark:text-white outline-none focus:border-orange-500 transition-all"
            />
          </div>
        </div>

        {/* Product Type Filter Pills */}
        <div className="space-y-2 pt-2 border-t border-gray-100 dark:border-white/10">
          <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-orange-600 dark:text-orange-400" />
            <span>نوع العرض (منتج / باقة):</span>
          </label>
          <div className="grid grid-cols-3 gap-1.5 p-1 rounded-2xl bg-gray-100 dark:bg-slate-900/80 border border-gray-200 dark:border-white/10">
            <button
              type="button"
              onClick={() => onSelectedTypeChange("all")}
              className={`py-2 px-2 rounded-xl text-xs font-bold transition-all text-center ${
                selectedType === "all"
                  ? "bg-orange-600 text-white shadow-md shadow-orange-600/20"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              }`}
            >
              الكل
            </button>
            <button
              type="button"
              onClick={() => onSelectedTypeChange("product")}
              className={`py-2 px-2 rounded-xl text-xs font-bold transition-all text-center ${
                selectedType === "product"
                  ? "bg-orange-600 text-white shadow-md shadow-orange-600/20"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              }`}
            >
              مفردة 🛍️
            </button>
            <button
              type="button"
              onClick={() => onSelectedTypeChange("bundle")}
              className={`py-2 px-2 rounded-xl text-xs font-bold transition-all text-center ${
                selectedType === "bundle"
                  ? "bg-orange-600 text-white shadow-md shadow-orange-600/20"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              }`}
            >
              باقات 📦
            </button>
          </div>
        </div>

        {/* Price Range Slider in Dinar (د.ج) */}
        <div className="space-y-2 pt-2 border-t border-gray-100 dark:border-white/10">
          <div className="flex justify-between items-center text-xs font-bold">
            <span className="text-gray-700 dark:text-gray-300">الحد الأقصى للسعر:</span>
            <span className="text-orange-600 dark:text-orange-400 font-mono">{formatCurrency(maxPrice)}</span>
          </div>
          <input
            type="range"
            min={500}
            max={30000}
            step={500}
            value={maxPrice}
            onChange={(e) => onMaxPriceChange(Number(e.target.value))}
            className="w-full accent-orange-600 cursor-pointer"
          />
        </div>

        {/* Sort By Dropdown */}
        <div className="space-y-1.5 pt-2 border-t border-gray-100 dark:border-white/10">
          <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
            <ArrowUpDown className="w-3.5 h-3.5 text-orange-600" />
            <span>ترتيب النتائج حسب:</span>
          </label>
          <select
            value={sortBy}
            onChange={(e) => onSortByChange(e.target.value)}
            className="w-full px-4 py-2.5 rounded-2xl bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-white/10 text-xs text-gray-900 dark:text-white outline-none focus:border-orange-500 transition-all"
          >
            <option value="default">الترتيب الافتراضي (الأحدث)</option>
            <option value="price-low">السعر: من الأقل للأعلى ⬆️</option>
            <option value="price-high">السعر: من الأعلى للأقل ⬇️</option>
            <option value="rating">الأعلى تقييماً ⭐</option>
          </select>
        </div>

      </div>

    </div>
  );
}
