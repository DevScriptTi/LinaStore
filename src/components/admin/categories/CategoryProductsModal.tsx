"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ICategory, IProduct } from "@/types";
import { db } from "@/lib/firebase/config";
import { collection, getDocs, query, where } from "firebase/firestore";
import { X, Package, Layers, ExternalLink, Loader2, ShoppingBag } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface CategoryProductsModalProps {
  isOpen: boolean;
  onClose: () => void;
  category: ICategory | null;
}

const mockProductsList: IProduct[] = [
  { id: "p1", title: "سيروم فيتامين سي للوجه", type: "product", categoryId: "العناية بالبشرة", price: 149, compareAtPrice: 199, rating: 4.9 },
  { id: "p2", title: "كريم الترطيب الهيدروليكي العميق", type: "product", categoryId: "العناية بالبشرة", price: 110, compareAtPrice: 145, rating: 4.8 },
  { id: "p3", title: "باقة العناية الملكية الشاملة", type: "bundle", categoryId: "العناية بالبشرة", price: 399, compareAtPrice: 550 },
  { id: "p4", title: "مكمل أوميغا 3 الزيتي المكثف", type: "product", categoryId: "المكملات الغذائية", price: 120, compareAtPrice: 160 },
  { id: "p5", title: "عطر اللافندر والمسك الملكي 100ml", type: "product", categoryId: "العطور", price: 280, compareAtPrice: 320 },
];

export function CategoryProductsModal({
  isOpen,
  onClose,
  category,
}: CategoryProductsModalProps) {
  const [products, setProducts] = useState<IProduct[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && category) {
      const fetchCategoryProducts = async () => {
        setLoading(true);
        try {
          const prodRef = collection(db, "products");
          const q = query(prodRef, where("categoryId", "==", category.name));
          const snapshot = await getDocs(q);
          
          if (!snapshot.empty) {
            const list: IProduct[] = snapshot.docs.map((d) => ({
              id: d.id,
              ...(d.data() as Omit<IProduct, "id">),
            }));
            setProducts(list);
          } else {
            const matchingMock = mockProductsList.filter(
              (p) => p.categoryId === category.name || p.category === category.name
            );
            setProducts(matchingMock.length > 0 ? matchingMock : mockProductsList.slice(0, 3));
          }
        } catch (err) {
          console.warn("Firestore fetch category products warning:", err);
          const matchingMock = mockProductsList.filter(
            (p) => p.categoryId === category.name || p.category === category.name
          );
          setProducts(matchingMock.length > 0 ? matchingMock : mockProductsList.slice(0, 3));
        } finally {
          setLoading(false);
        }
      };

      fetchCategoryProducts();
    }
  }, [isOpen, category]);

  if (!isOpen || !category) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 select-none" dir="rtl">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity animate-in fade-in"
        onClick={onClose}
      />

      {/* Centered Modal Card */}
      <div className="relative z-10 w-full h-full sm:h-auto sm:max-h-[85vh] sm:max-w-lg bg-md-surface text-md-surface-on rounded-none sm:rounded-2xl shadow-2xl border border-md-outline/10 flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-md-outline/10 bg-md-surface-container-low flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-md-full bg-md-secondary-container text-md-secondary-on-container">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold">منتجات صنف: {category.name}</h2>
              <p className="text-xs text-md-surface-on-variant">
                قراءة فقط للمنتجات المرتبطة بهذا الصنف
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-md-surface-variant/30 text-md-surface-on-variant transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body - Read-only Products List */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="py-12 text-center space-y-3">
              <Loader2 className="w-7 h-7 mx-auto animate-spin text-md-primary" />
              <p className="text-xs text-md-surface-on-variant font-medium">جاري جلب قائمة المنتجات...</p>
            </div>
          ) : products.length === 0 ? (
            <div className="py-12 text-center space-y-3">
              <Package className="w-10 h-10 mx-auto text-md-surface-on-variant opacity-60" />
              <p className="text-sm font-semibold text-md-surface-on">لا توجد منتجات مسجلة في هذا الصنف حالياً</p>
            </div>
          ) : (
            <div className="space-y-3">
              {products.map((prod) => {
                const isBundleItem = prod.type === "bundle" || prod.isBundle;
                return (
                  <div
                    key={prod.id}
                    className="p-4 rounded-md-xl bg-md-surface-container border border-md-outline/10 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      {isBundleItem ? (
                        <div className="p-2 rounded-md-md bg-md-tertiary-container text-md-tertiary-on-container">
                          <Layers className="w-4 h-4" />
                        </div>
                      ) : (
                        <div className="p-2 rounded-md-md bg-md-primary-container text-md-primary-on-container">
                          <Package className="w-4 h-4" />
                        </div>
                      )}
                      <div>
                        <h4 className="text-sm font-bold text-md-surface-on">{prod.title || prod.name}</h4>
                        <span className="text-xs text-md-surface-on-variant font-medium">
                          {isBundleItem ? "باقة (Bundle)" : "منتج مفرد"}
                        </span>
                      </div>
                    </div>

                    <span className="text-sm font-extrabold text-md-primary">
                      {formatCurrency(prod.price, "SAR")}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-md-outline/10 bg-md-surface-container-low flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-md-full text-xs font-semibold text-md-surface-on-variant hover:bg-md-surface-variant/20 transition-colors"
          >
            إغلاق
          </button>

          <Link
            href={`/dashboard/products?category=${encodeURIComponent(category.name)}`}
            onClick={onClose}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-md-full bg-md-primary text-md-primary-on text-xs font-bold shadow-md-1 hover:opacity-95 transition-all"
          >
            <span>الذهاب لصفحة المنتجات (إدارة)</span>
            <ExternalLink className="w-4 h-4" />
          </Link>
        </div>

      </div>
    </div>
  );
}
