"use client";

import React, { useState, useEffect } from "react";
import { ICategory } from "@/types";
import { db } from "@/lib/firebase/config";
import { collection, getDocs } from "firebase/firestore";
import { FolderTree, ChevronDown, ChevronLeft, Check, Layers, Filter } from "lucide-react";

interface CategoriesSidebarProps {
  selectedCategory: string;
  onSelectCategory: (categoryName: string) => void;
}

const mockCategories: ICategory[] = [
  { id: "cat-1", name: "العناية بالبشرة", parentId: null, slug: "skincare", productCount: 12, sortOrder: 1, isActive: true },
  { id: "cat-1-1", name: "سيرومات الوجه", parentId: "cat-1", slug: "serums", productCount: 5, sortOrder: 1, isActive: true },
  { id: "cat-1-2", name: "كريمات الترطيب", parentId: "cat-1", slug: "creams", productCount: 4, sortOrder: 2, isActive: true },
  { id: "cat-2", name: "المكملات الغذائية", parentId: null, slug: "supplements", productCount: 8, sortOrder: 2, isActive: true },
  { id: "cat-3", name: "العطور والزيوت", parentId: null, slug: "perfumes", productCount: 6, sortOrder: 3, isActive: true },
  { id: "cat-4", name: "مجموعات وباقات توفيرية", parentId: null, slug: "bundles", productCount: 4, sortOrder: 4, isActive: true },
];

export function CategoriesSidebar({ selectedCategory, onSelectCategory }: CategoriesSidebarProps) {
  const [categories, setCategories] = useState<ICategory[]>([]);
  const [isMobileExpanded, setIsMobileExpanded] = useState(false);
  const [expandedParents, setExpandedParents] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const snapshot = await getDocs(collection(db, "categories"));
        if (!snapshot.empty) {
          const list: ICategory[] = snapshot.docs.map((d) => ({
            id: d.id,
            ...(d.data() as Omit<ICategory, "id">),
          }));
          setCategories(list);
        } else {
          setCategories(mockCategories);
        }
      } catch (err) {
        console.warn("CategoriesSidebar fetch error:", err);
        setCategories(mockCategories);
      }
    };

    fetchCategories();
  }, []);

  const toggleParentExpand = (parentId: string) => {
    setExpandedParents((prev) => ({
      ...prev,
      [parentId]: !prev[parentId],
    }));
  };

  // Group Parents and Children
  const parentCategories = categories.filter((c) => !c.parentId || c.parentId === null);
  const getSubcategories = (parentId: string) => categories.filter((c) => c.parentId === parentId || c.parentId === categories.find(p => p.id === parentId)?.name);

  return (
    <aside className="w-full max-md:sticky max-md:top-16 max-md:z-30 bg-white dark:bg-[#1C1B1F] border border-gray-200 dark:border-white/10 rounded-3xl p-5 shadow-sm space-y-4 select-none backdrop-blur-md" dir="rtl">
      
      {/* Mobile Accordion Toggle Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5 text-gray-900 dark:text-white">
          <div className="p-2 rounded-xl bg-orange-100 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400">
            <FolderTree className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-extrabold">تصفح الأصناف 📂</h3>
            <p className="text-[11px] text-gray-500 dark:text-gray-400">فهرس شجري شامل لمنتجات المتجر</p>
          </div>
        </div>

        {/* Mobile Expand Toggle Button */}
        <button
          type="button"
          onClick={() => setIsMobileExpanded(!isMobileExpanded)}
          className="md:hidden p-2 rounded-xl bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-gray-300"
          aria-label="توسيع قائمة الأصناف"
        >
          <ChevronDown className={`w-5 h-5 transition-transform ${isMobileExpanded ? "rotate-180" : ""}`} />
        </button>
      </div>

      {/* Tree Content List (Collapsible on Mobile, Always open on Desktop) */}
      <div className={`space-y-2 pt-2 border-t border-gray-100 dark:border-white/10 ${isMobileExpanded ? "block" : "max-md:hidden"}`}>
        
        {/* All Products Option */}
        <button
          type="button"
          onClick={() => {
            onSelectCategory("الكل");
            setIsMobileExpanded(false);
          }}
          className={`w-full p-2.5 rounded-2xl flex items-center justify-between text-xs font-bold transition-all ${
            selectedCategory === "الكل"
              ? "bg-orange-600 text-white shadow-md shadow-orange-600/20"
              : "hover:bg-gray-100 dark:hover:bg-white/5 text-gray-700 dark:text-gray-300"
          }`}
        >
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4" />
            <span>جميع المنتجات والباقات</span>
          </div>
          {selectedCategory === "الكل" && <Check className="w-4 h-4" />}
        </button>

        {/* Hierarchical Parent & Subcategories Tree */}
        {parentCategories.map((parent) => {
          const subcats = getSubcategories(parent.id || parent.name);
          const hasSubs = subcats.length > 0;
          const isExpanded = expandedParents[parent.id || parent.name] ?? true;
          const isParentSelected = selectedCategory === parent.name;

          return (
            <div key={parent.id || parent.name} className="space-y-1">
              {/* Parent Category Row */}
              <div className="flex items-center justify-between gap-1">
                <button
                  type="button"
                  onClick={() => {
                    onSelectCategory(parent.name);
                    setIsMobileExpanded(false);
                  }}
                  className={`flex-1 p-2.5 rounded-2xl flex items-center justify-between text-xs font-bold transition-all ${
                    isParentSelected
                      ? "bg-orange-600 text-white shadow-md shadow-orange-600/20"
                      : "hover:bg-gray-100 dark:hover:bg-white/5 text-gray-800 dark:text-gray-200"
                  }`}
                >
                  <span className="truncate">{parent.name}</span>
                  {isParentSelected && <Check className="w-4 h-4 shrink-0" />}
                </button>

                {hasSubs && (
                  <button
                    type="button"
                    onClick={() => toggleParentExpand(parent.id || parent.name)}
                    className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-white/5 text-gray-500"
                  >
                    <ChevronDown className={`w-4 h-4 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                  </button>
                )}
              </div>

              {/* Children Subcategories Tree */}
              {hasSubs && isExpanded && (
                <div className="pr-4 space-y-1 border-r-2 border-orange-500/30 mr-3 my-1">
                  {subcats.map((sub) => {
                    const isSubSelected = selectedCategory === sub.name;
                    return (
                      <button
                        key={sub.id || sub.name}
                        type="button"
                        onClick={() => {
                          onSelectCategory(sub.name);
                          setIsMobileExpanded(false);
                        }}
                        className={`w-full p-2 rounded-xl flex items-center justify-between text-xs font-semibold transition-all ${
                          isSubSelected
                            ? "bg-orange-100 dark:bg-orange-950/60 text-orange-700 dark:text-orange-300 font-bold"
                            : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-white/5"
                        }`}
                      >
                        <span className="truncate">{sub.name}</span>
                        {isSubSelected && <Check className="w-3.5 h-3.5 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}

      </div>
    </aside>
  );
}
