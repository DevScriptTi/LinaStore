"use client";

import React, { useState, useEffect } from "react";
import { ICategory } from "@/types";
import { db } from "@/lib/firebase/config";
import { collection, deleteDoc, doc, onSnapshot } from "firebase/firestore";
import { Pencil, Trash2, FolderTree, Search, Plus, Layers, Loader2, Eye } from "lucide-react";
import { CategoryProductsModal } from "./CategoryProductsModal";

interface CategoriesTableProps {
  onEdit: (category: ICategory) => void;
  onAddNew: () => void;
}

const mockCategories: ICategory[] = [
  { id: "cat-1", name: "العناية بالبشرة", parentId: null, slug: "skincare", productCount: 18, sortOrder: 1, isActive: true },
  { id: "cat-2", name: "المكملات الغذائية", parentId: null, slug: "supplements", productCount: 14, sortOrder: 2, isActive: true },
  { id: "cat-3", name: "العطور", parentId: null, slug: "perfumes", productCount: 8, sortOrder: 3, isActive: true },
  { id: "cat-4", name: "سيروم للبشرة", parentId: "cat-1", slug: "face-serum", productCount: 6, sortOrder: 4, isActive: true },
  { id: "cat-5", name: "المكياج", parentId: null, slug: "makeup", productCount: 10, sortOrder: 5, isActive: true },
];

export function CategoriesTable({ onEdit, onAddNew }: CategoriesTableProps) {
  const [categories, setCategories] = useState<ICategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategoryForProducts, setSelectedCategoryForProducts] = useState<ICategory | null>(null);

  useEffect(() => {
    let unsubscribe = () => {};
    try {
      const catRef = collection(db, "categories");
      unsubscribe = onSnapshot(
        catRef,
        (snapshot) => {
          if (!snapshot.empty) {
            const list: ICategory[] = snapshot.docs.map((d) => ({
              id: d.id,
              ...(d.data() as Omit<ICategory, "id">),
            }));
            setCategories(list);
          } else {
            setCategories(mockCategories);
          }
          setLoading(false);
        },
        (err) => {
          console.warn("Firestore categories snapshot warning:", err);
          setCategories(mockCategories);
          setLoading(false);
        }
      );
    } catch {
      setCategories(mockCategories);
      setLoading(false);
    }

    return () => unsubscribe();
  }, []);

  const handleDelete = async (id?: string) => {
    if (!id) return;
    if (confirm("هل أنت تأكد من رغبتك في حذف هذا الصنف؟")) {
      try {
        await deleteDoc(doc(db, "categories", id));
      } catch (err) {
        console.warn("Delete Firestore category error:", err);
        setCategories((prev) => prev.filter((c) => c.id !== id));
      }
    }
  };

  const getParentName = (parentId: string | null) => {
    if (!parentId) return null;
    const parent = categories.find((c) => c.id === parentId);
    return parent ? parent.name : "صنف أصل";
  };

  const filteredCategories = categories.filter(
    (c) =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.slug.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-4" dir="rtl">
      {/* Top Filter and Search Bar */}
      <div className="p-4 rounded-md-xl bg-md-surface-container border border-md-outline/10 shadow-md-1 flex items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 text-md-surface-on-variant" />
          <input
            type="text"
            placeholder="البحث عن صنف بالاسم أو الرابط..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pr-10 pl-4 py-2 rounded-md-full bg-md-surface border border-md-outline/30 text-xs md:text-sm text-md-surface-on outline-none focus:border-md-primary transition-all"
          />
        </div>
      </div>

      {/* Categories Data Table */}
      <div className="rounded-md-xl bg-md-surface-container border border-md-outline/10 shadow-md-1 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center space-y-3">
            <Loader2 className="w-8 h-8 mx-auto animate-spin text-md-primary" />
            <p className="text-sm text-md-surface-on-variant font-medium">جاري تحميل الأصناف...</p>
          </div>
        ) : filteredCategories.length === 0 ? (
          <div className="p-12 text-center space-y-4">
            <div className="w-16 h-16 mx-auto rounded-full bg-md-surface-container-high flex items-center justify-center text-md-surface-on-variant">
              <FolderTree className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-semibold text-md-surface-on">لا توجد أصناف مضافة بعد</h3>
              <p className="text-xs text-md-surface-on-variant">
                ابدأ بإنشاء أصل صنف جديد لإضافته إلى الهيكل التنظيمي للمتجر.
              </p>
            </div>
            <button
              onClick={onAddNew}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-md-full bg-md-primary text-md-primary-on text-xs font-semibold hover:opacity-90 transition-all"
            >
              <Plus className="w-4 h-4" /> إضافة صنف جديد
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-sm">
              <thead className="bg-md-surface-container-high text-xs font-bold text-md-surface-on-variant border-b border-md-outline/10">
                <tr>
                  <th className="py-3.5 px-4">اسم الصنف</th>
                  <th className="py-3.5 px-4">الرابط الدائم (Slug)</th>
                  <th className="py-3.5 px-4">الصنف الرئيسي</th>
                  <th className="py-3.5 px-4">عدد المنتجات</th>
                  <th className="py-3.5 px-4">الترتيب</th>
                  <th className="py-3.5 px-4">الحالة</th>
                  <th className="py-3.5 px-4 text-left">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-md-outline/10">
                {filteredCategories.map((category) => {
                  const parentName = getParentName(category.parentId);
                  return (
                    <tr
                      key={category.id}
                      className="hover:bg-md-surface-container-low/60 transition-colors"
                    >
                      <td className="py-3.5 px-4 font-semibold text-md-surface-on">
                        <div className="flex items-center gap-2">
                          <FolderTree className="w-4 h-4 text-md-primary shrink-0" />
                          <span>{category.name}</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-xs font-mono text-md-surface-on-variant dir-ltr text-right">
                        {category.slug}
                      </td>

                      <td className="py-3.5 px-4">
                        {parentName ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md-full text-xs font-medium bg-md-secondary-container text-md-secondary-on-container">
                            <Layers className="w-3 h-3" /> {parentName}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md-full text-xs font-semibold bg-md-primary-container text-md-primary-on-container">
                            صنف رئيسي
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 font-bold text-md-surface-on">
                        {category.productCount || 0} منتج
                      </td>

                      <td className="py-3.5 px-4 text-xs text-md-surface-on-variant">
                        {category.sortOrder || 0}
                      </td>

                      <td className="py-3.5 px-4">
                        {category.isActive ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                            نشط
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-600 dark:text-rose-400">
                            معطل
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-left">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => setSelectedCategoryForProducts(category)}
                            className="p-1.5 rounded-full hover:bg-md-surface-variant/30 text-md-surface-on-variant transition-colors"
                            title="عرض المنتجات"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onEdit(category)}
                            className="p-1.5 rounded-full hover:bg-md-primary-container/40 text-md-primary transition-colors"
                            title="تعديل"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(category.id)}
                            className="p-1.5 rounded-full hover:bg-md-error-container/40 text-md-error transition-colors"
                            title="حذف"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Read-Only Category Products Modal */}
      <CategoryProductsModal
        isOpen={!!selectedCategoryForProducts}
        onClose={() => setSelectedCategoryForProducts(null)}
        category={selectedCategoryForProducts}
      />
    </div>
  );
}
