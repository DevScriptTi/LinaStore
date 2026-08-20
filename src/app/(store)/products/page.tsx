"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { ProductCard, Product } from "@/components/store/ProductCard";
import { CategoriesSidebar } from "@/components/store/CategoriesSidebar";
import { ProductFilters } from "@/components/store/ProductFilters";
import { ICategory } from "@/types";
import { db } from "@/lib/firebase/config";
import { collection, query, orderBy, limit, startAfter, getDocs, QueryDocumentSnapshot } from "firebase/firestore";
import { ShoppingBag, Loader2, Sparkles, AlertCircle } from "lucide-react";

const mockCategories: ICategory[] = [
  { id: "cat-1", name: "العناية بالبشرة", parentId: null, slug: "skincare", productCount: 12, sortOrder: 1, isActive: true },
  { id: "cat-1-1", name: "سيرومات الوجه", parentId: "cat-1", slug: "serums", productCount: 5, sortOrder: 1, isActive: true },
  { id: "cat-1-2", name: "كريمات الترطيب", parentId: "cat-1", slug: "creams", productCount: 4, sortOrder: 2, isActive: true },
  { id: "cat-2", name: "المكملات الغذائية", parentId: null, slug: "supplements", productCount: 8, sortOrder: 2, isActive: true },
  { id: "cat-3", name: "العطور والزيوت", parentId: null, slug: "perfumes", productCount: 6, sortOrder: 3, isActive: true },
  { id: "cat-4", name: "مجموعات وباقات توفيرية", parentId: null, slug: "bundles", productCount: 4, sortOrder: 4, isActive: true },
];

const mockProductsList: Product[] = [
  {
    id: "p-1",
    name: "سيروم فيتامين سي النقي للوجه 50ml",
    price: 4500,
    oldPrice: 6000,
    category: "سيرومات الوجه",
    categoryId: "cat-1-1",
    description: "سيروم يعزز نضارة البشرة ويقلل من التصبغات والتجاعيد المبكرة.",
    badge: "الأكثر مبيعاً",
    rating: 4.9,
    isFeatured: true,
  },
  {
    id: "p-2",
    name: "مكمل أوميغا 3 المكثف 1000mg",
    price: 3200,
    oldPrice: 4000,
    category: "المكملات الغذائية",
    categoryId: "cat-2",
    description: "مكمل غذائي غني بأحماض أوميغا 3 لدعم صحة القلب والذاكرة.",
    badge: "جديد",
    rating: 4.8,
  },
  {
    id: "b-1",
    name: "باقة العناية الملكية المتكاملة",
    price: 12000,
    oldPrice: 15500,
    category: "مجموعات وباقات توفيرية",
    categoryId: "cat-4",
    description: "مجموعة شاملة تضم سيروم وكريم ترطيب ليل وغسول عميق.",
    badge: "باقة توفير",
    rating: 5.0,
    isBundle: true,
    isFreeShipping: true,
    isFeatured: true,
  },
  {
    id: "p-3",
    name: "عطر اللافندر والمسك الملكي 100ml",
    price: 8500,
    oldPrice: 9900,
    category: "العطور والزيوت",
    categoryId: "cat-3",
    description: "نفحات عطرية ساحرة تمزج بين اللافندر الفرنسي والمسك الأبيض الأصيل.",
    badge: "جديد",
    rating: 4.9,
    isFeatured: true,
  },
  {
    id: "p-4",
    name: "فيتامين د3 العالي الامتصاص 5000IU",
    price: 2800,
    oldPrice: 3500,
    category: "المكملات الغذائية",
    categoryId: "cat-2",
    description: "دعم قوي للمناعة وصحة العظام بشكولات سهلة الامتصاص.",
    rating: 4.8,
  },
  {
    id: "p-5",
    name: "كريم الترطيب الهيدروليكي العميق 100ml",
    price: 3200,
    oldPrice: 4200,
    category: "كريمات الترطيب",
    categoryId: "cat-1-2",
    description: "ترطيب الفائق للبشرة الجافة مع حماية مضادة للأكسدة.",
    rating: 4.9,
  },
];

// Helper Function: Recursively Extract Category & Descendant Children Names/IDs
const getCategoryAndChildrenNames = (selectedName: string, categories: ICategory[]): string[] => {
  if (!selectedName || selectedName === "الكل") return [];

  let result: string[] = [selectedName];

  // Find matching category object by name or ID
  const targetCat = categories.find((c) => c.name === selectedName || c.id === selectedName);

  if (targetCat) {
    if (targetCat.name) result.push(targetCat.name);
    if (targetCat.id) result.push(targetCat.id);

    const targetId = targetCat.id || targetCat.name;

    // Find all immediate children whose parentId matches targetId or targetCat.name
    const children = categories.filter(
      (c) => c.parentId && (c.parentId === targetId || c.parentId === targetCat.name)
    );

    children.forEach((child) => {
      const childNames = getCategoryAndChildrenNames(child.name, categories);
      result = [...result, ...childNames];
      if (child.id) {
        const childIdNames = getCategoryAndChildrenNames(child.id, categories);
        result = [...result, ...childIdNames];
      }
    });
  }

  return Array.from(new Set(result));
};

export default function StoreProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [allCategories, setAllCategories] = useState<ICategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [lastDoc, setLastDoc] = useState<QueryDocumentSnapshot | null>(null);

  // Filters State
  const [selectedCategory, setSelectedCategory] = useState("الكل");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [maxPrice, setMaxPrice] = useState(30000);
  const [sortBy, setSortBy] = useState("default");

  const observerTargetRef = useRef<HTMLDivElement>(null);

  // Fetch all categories for hierarchical filtering
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const snapshot = await getDocs(collection(db, "categories"));
        if (!snapshot.empty) {
          const list: ICategory[] = snapshot.docs.map((d) => ({
            id: d.id,
            ...(d.data() as Omit<ICategory, "id">),
          }));
          setAllCategories(list);
        } else {
          setAllCategories(mockCategories);
        }
      } catch (err) {
        console.warn("Error fetching categories for hierarchical filter:", err);
        setAllCategories(mockCategories);
      }
    };
    fetchCategories();
  }, []);

  // Initial Products Fetch (limit 9)
  const fetchInitialProducts = useCallback(async () => {
    setLoading(true);
    try {
      const q = query(
        collection(db, "products"),
        orderBy("createdAt", "desc"),
        limit(9)
      );
      const snapshot = await getDocs(q);

      if (!snapshot.empty) {
        const fetched: Product[] = snapshot.docs.map((d) => {
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

        setProducts(fetched);
        setLastDoc(snapshot.docs[snapshot.docs.length - 1]);
        setHasMore(snapshot.docs.length === 9);
      } else {
        setProducts(mockProductsList);
        setHasMore(false);
      }
    } catch (err) {
      console.warn("Initial products fetch fallback to mock:", err);
      setProducts(mockProductsList);
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInitialProducts();
  }, [fetchInitialProducts]);

  // Load More Next 9 Products (Infinite Scroll Cursor)
  const loadMoreProducts = useCallback(async () => {
    if (!hasMore || loadingMore || !lastDoc) return;

    setLoadingMore(true);
    try {
      const q = query(
        collection(db, "products"),
        orderBy("createdAt", "desc"),
        startAfter(lastDoc),
        limit(9)
      );
      const snapshot = await getDocs(q);

      if (!snapshot.empty) {
        const fetchedNext: Product[] = snapshot.docs.map((d) => {
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

        setProducts((prev) => [...prev, ...fetchedNext]);
        setLastDoc(snapshot.docs[snapshot.docs.length - 1]);
        setHasMore(snapshot.docs.length === 9);
      } else {
        setHasMore(false);
      }
    } catch (err) {
      console.warn("Load more products error:", err);
      setHasMore(false);
    } finally {
      setLoadingMore(false);
    }
  }, [hasMore, loadingMore, lastDoc]);

  // IntersectionObserver for Infinite Scroll Sentinel
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore && !loading) {
          loadMoreProducts();
        }
      },
      { threshold: 0.1 }
    );

    const currentTarget = observerTargetRef.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [loadMoreProducts, hasMore, loadingMore, loading]);

  // Derived Valid Category Hierarchy Target Names/IDs
  const validCategoryTargets = useMemo(() => {
    if (selectedCategory === "الكل") return [];
    return getCategoryAndChildrenNames(selectedCategory, allCategories);
  }, [selectedCategory, allCategories]);

  // Filter & Sort Logic (Includes Parent + All Subcategories + Product Type)
  const filteredProducts = products
    .filter((prod) => {
      const matchesCategory =
        selectedCategory === "الكل" ||
        validCategoryTargets.includes(prod.category) ||
        (prod.categoryId && validCategoryTargets.includes(prod.categoryId));

      const q = searchTerm.toLowerCase().trim();
      const matchesSearch =
        !q ||
        prod.name.toLowerCase().includes(q) ||
        (prod.description && prod.description.toLowerCase().includes(q));

      const matchesPrice = prod.price <= maxPrice;

      const matchesType =
        selectedType === "all" ||
        (selectedType === "bundle"
          ? prod.isBundle || prod.type === "bundle"
          : !prod.isBundle && prod.type !== "bundle");

      return matchesCategory && matchesSearch && matchesPrice && matchesType;
    })
    .sort((a, b) => {
      if (sortBy === "price-low") return a.price - b.price;
      if (sortBy === "price-high") return b.price - a.price;
      if (sortBy === "rating") return (b.rating || 0) - (a.rating || 0);
      return 0;
    });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 select-none" dir="rtl">
      
      {/* Page Header */}
      <div className="space-y-2 pb-4 border-b border-gray-200 dark:border-white/10">
        <h1 className="text-2xl md:text-3xl font-black text-gray-900 dark:text-white flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-orange-100 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400">
            <ShoppingBag className="w-6 h-6" />
          </div>
          <span>معرض المنتجات والباقات المميزة</span>
        </h1>
        <p className="text-xs text-gray-600 dark:text-gray-400">
          تصفح كافة التشكيلات واطلب مباشرة مع خدمة التوصيل والدفع عند الاستلام 🚚
        </p>
      </div>

      {/* Main Grid: Sidebar + Products List */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column (Desktop 4 cols): Categories Tree Sidebar & Filters */}
        <div className="lg:col-span-4 space-y-6 max-md:sticky max-md:top-16 max-md:z-30 max-md:bg-gray-50/90 dark:max-md:bg-[#121212]/90 max-md:backdrop-blur-md max-md:pb-2 max-md:border-b max-md:border-gray-200 dark:max-md:border-white/10">
          {/* Categories Hierarchical Tree Sidebar */}
          <CategoriesSidebar
            selectedCategory={selectedCategory}
            onSelectCategory={(cat) => setSelectedCategory(cat)}
          />

          {/* Product Filters & Search Widget */}
          <ProductFilters
            searchTerm={searchTerm}
            onSearchChange={(val) => setSearchTerm(val)}
            selectedType={selectedType}
            onSelectedTypeChange={(val) => setSelectedType(val)}
            maxPrice={maxPrice}
            onMaxPriceChange={(val) => setMaxPrice(val)}
            sortBy={sortBy}
            onSortByChange={(val) => setSortBy(val)}
          />
        </div>

        {/* Right Column (Desktop 8 cols): Products Grid & Infinite Scroll */}
        <div className="lg:col-span-8 space-y-6">
          
          {loading ? (
            <div className="p-16 text-center space-y-4">
              <Loader2 className="w-10 h-10 mx-auto text-orange-600 animate-spin" />
              <p className="text-sm font-semibold text-gray-600 dark:text-gray-400">جاري تحميل المعرض من Firestore...</p>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="p-16 text-center space-y-4 rounded-3xl bg-white dark:bg-[#1C1B1F] border border-gray-200 dark:border-white/10">
              <AlertCircle className="w-12 h-12 mx-auto text-orange-500 opacity-60" />
              <p className="text-base font-bold text-gray-900 dark:text-white">لم يتم العثور على منتجات بهذه الفلاتر.</p>
              <button
                type="button"
                onClick={() => {
                  setSelectedCategory("الكل");
                  setSearchTerm("");
                  setMaxPrice(30000);
                }}
                className="px-4 py-2 rounded-full bg-orange-600 text-white text-xs font-bold hover:bg-orange-700 transition-colors"
              >
                إعادة ضبط الفلاتر
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProducts.map((prod) => (
                <ProductCard key={prod.id} product={prod} />
              ))}
            </div>
          )}

          {/* Infinite Scroll Intersection Observer Sentinel */}
          <div ref={observerTargetRef} className="py-6 text-center">
            {loadingMore && (
              <div className="inline-flex items-center gap-2 text-xs font-bold text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/30 px-4 py-2 rounded-full border border-orange-200 dark:border-orange-900/40">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>جاري جلب المزيد من المنتجات تلقائياً...</span>
              </div>
            )}
            {!hasMore && products.length > 0 && (
              <p className="text-xs text-gray-400 dark:text-gray-500 font-semibold">
                وصلت لنهاية المعرض! عرضت جميع المنتجات والباقات المتاحة.
              </p>
            )}
          </div>

        </div>

      </div>

    </div>
  );
}
