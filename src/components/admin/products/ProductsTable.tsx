"use client";

import React, { useState, useEffect } from "react";
import { IProduct, IProductImage } from "@/types";
import { db } from "@/lib/firebase/config";
import { collection, deleteDoc, doc, onSnapshot } from "firebase/firestore";
import { Pencil, Trash2, Package, Layers, Search, Plus, Loader2, Eye } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface ProductsTableProps {
  onEdit: (product: IProduct) => void;
  onAddNew: () => void;
}

const mockProductsList: IProduct[] = [
  {
    id: "p-1",
    title: "سيروم فيتامين سي للوجه 50ml",
    type: "product",
    categoryId: "العناية بالبشرة",
    price: 4500,
    compareAtPrice: 6000,
    shortDescription: "سيروم يعزز نضارة البشرة ويقلل من التصبغات.",
    description: "<p>وصف تفصيلي لسيروم فيتامين سي...</p>",
    images: [],
    isActive: true,
  },
  {
    id: "b-1",
    title: "باقة العناية الملكية الشاملة",
    type: "bundle",
    categoryId: "مجموعات مميزة",
    price: 12000,
    compareAtPrice: 15500,
    shortDescription: "باقة حصرية تضم سيروم وكريم ترطيب وغسول.",
    description: "<p>تفاصيل باقة العناية الشاملة...</p>",
    images: [],
    bundleItems: [{ title: "سيروم", image: "", quantity: 1 }, { title: "كريم ليل", image: "", quantity: 1 }],
    isActive: true,
  },
  {
    id: "p-2",
    title: "عطر اللافندر والمسك الملكي 100ml",
    type: "product",
    categoryId: "العطور",
    price: 8500,
    compareAtPrice: 9900,
    shortDescription: "عطر فرنسي فاخر ينبض بالانتعاش والجاذبية.",
    description: "<p>تفاصيل العطر...</p>",
    images: [],
    isActive: true,
  },
];

export function ProductsTable({ onEdit, onAddNew }: ProductsTableProps) {
  const [products, setProducts] = useState<IProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");

  useEffect(() => {
    let unsubscribe = () => {};
    try {
      const prodRef = collection(db, "products");
      unsubscribe = onSnapshot(
        prodRef,
        (snapshot) => {
          if (!snapshot.empty) {
            const list: IProduct[] = snapshot.docs.map((d) => ({
              id: d.id,
              ...(d.data() as Omit<IProduct, "id">),
            }));
            setProducts(list);
          } else {
            setProducts(mockProductsList);
          }
          setLoading(false);
        },
        (err) => {
          console.warn("Firestore products snapshot warning:", err);
          setProducts(mockProductsList);
          setLoading(false);
        }
      );
    } catch {
      setProducts(mockProductsList);
      setLoading(false);
    }

    return () => unsubscribe();
  }, []);

  // Complete Product Deletion with Physical Cloudinary Image Deletion
  const handleDelete = async (product: IProduct) => {
    if (!product.id) return;
    if (confirm("هل أنت تأكد من رغبتك في حذف هذا المنتج نهائياً ومسح صوره من Cloudinary؟")) {
      try {
        // 1. Delete all associated images from Cloudinary
        if (product.images && product.images.length > 0) {
          const deletePromises = product.images.map((img) => {
            const imgUrl = typeof img === "string" ? img : img.url;
            return fetch("/api/cloudinary/delete", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ url: imgUrl }),
            }).catch((err) => console.warn("Failed to delete Cloudinary image:", imgUrl, err));
          });
          await Promise.all(deletePromises);
        }

        // 2. Delete Firestore document
        await deleteDoc(doc(db, "products", product.id));
      } catch (err) {
        console.warn("Delete Firestore product error:", err);
        setProducts((prev) => prev.filter((p) => p.id !== product.id));
      }
    }
  };

  const filteredProducts = products.filter((item) => {
    const titleText = item.title || item.name || "";
    const categoryText = item.categoryId || item.category || "";
    const matchesSearch =
      titleText.toLowerCase().includes(searchTerm.toLowerCase()) ||
      categoryText.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === "all" || item.type === typeFilter;
    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-4" dir="rtl">
      {/* Top Controls Bar */}
      <div className="p-4 rounded-md-xl bg-md-surface-container border border-md-outline/10 shadow-md-1 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 text-md-surface-on-variant" />
          <input
            type="text"
            placeholder="البحث عن منتج أو باقة بالاسم أو الصنف..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pr-10 pl-4 py-2 rounded-md-full bg-md-surface border border-md-outline/30 text-xs md:text-sm text-md-surface-on outline-none focus:border-md-primary transition-all"
          />
        </div>

        {/* Type Filter */}
        <div className="flex items-center gap-3">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-4 py-2 rounded-md-full bg-md-surface border border-md-outline/30 text-xs text-md-surface-on outline-none focus:border-md-primary"
          >
            <option value="all">جميع الأنواع</option>
            <option value="product">منتج مفرد</option>
            <option value="bundle">باقة (Bundle)</option>
          </select>
        </div>
      </div>

      {/* Products Table Container */}
      <div className="rounded-md-xl bg-md-surface-container border border-md-outline/10 shadow-md-1 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center space-y-3">
            <Loader2 className="w-8 h-8 mx-auto animate-spin text-md-primary" />
            <p className="text-sm text-md-surface-on-variant font-medium">جاري تحميل المنتجات والباقات...</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="p-12 text-center space-y-4">
            <div className="w-16 h-16 mx-auto rounded-full bg-md-surface-container-high flex items-center justify-center text-md-surface-on-variant">
              <Package className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-semibold text-md-surface-on">لا توجد منتجات مضافة بعد</h3>
              <p className="text-xs text-md-surface-on-variant">
                ابدأ بإنشاء أول منتج مفرد أو باقة جديدة في متجرك.
              </p>
            </div>
            <button
              onClick={onAddNew}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-md-full bg-md-primary text-md-primary-on text-xs font-semibold hover:opacity-90 transition-all"
            >
              <Plus className="w-4 h-4" /> إضافة منتج جديد
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-sm">
              <thead className="bg-md-surface-container-high text-xs font-bold text-md-surface-on-variant border-b border-md-outline/10">
                <tr>
                  <th className="py-3.5 px-4">الصورة</th>
                  <th className="py-3.5 px-4">العنوان والصنف</th>
                  <th className="py-3.5 px-4">النوع</th>
                  <th className="py-3.5 px-4">السعر الحالي (دج)</th>
                  <th className="py-3.5 px-4">السعر المقارن</th>
                  <th className="py-3.5 px-4">الحالة</th>
                  <th className="py-3.5 px-4 text-left">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-md-outline/10">
                {filteredProducts.map((prod) => {
                  let mainImgUrl: string | null = null;
                  if (prod.images && prod.images.length > 0) {
                    const firstImg = prod.images[0];
                    if (typeof firstImg === "string") {
                      mainImgUrl = firstImg;
                    } else {
                      const imgList = prod.images as IProductImage[];
                      const mainObj = imgList.find((i) => i.isMain) || imgList[0];
                      mainImgUrl = mainObj?.url || null;
                    }
                  }

                  const titleText = prod.title || prod.name;
                  const categoryText = prod.categoryId || prod.category;
                  const isBundleItem = prod.type === "bundle" || prod.isBundle;
                  const oldPriceVal = prod.compareAtPrice ?? prod.oldPrice;

                  return (
                    <tr
                      key={prod.id}
                      className="hover:bg-md-surface-container-low/60 transition-colors"
                    >
                      {/* Thumbnail */}
                      <td className="py-3 px-4">
                        <div className="w-10 h-10 rounded-md-md overflow-hidden bg-md-surface-container-high border border-md-outline/10 flex items-center justify-center">
                          {mainImgUrl ? (
                            <img src={mainImgUrl} alt={titleText} className="w-full h-full object-cover" />
                          ) : isBundleItem ? (
                            <Layers className="w-5 h-5 text-md-tertiary" />
                          ) : (
                            <Package className="w-5 h-5 text-md-primary" />
                          )}
                        </div>
                      </td>

                      {/* Title & Category */}
                      <td className="py-3.5 px-4 font-bold text-md-surface-on">
                        <div>
                          <p>{titleText}</p>
                          <span className="text-[11px] font-normal text-md-surface-on-variant">{categoryText}</span>
                        </div>
                      </td>

                      {/* Type Badge */}
                      <td className="py-3.5 px-4">
                        {isBundleItem ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md-full text-xs font-semibold bg-md-tertiary-container text-md-tertiary-on-container">
                            <Layers className="w-3 h-3" /> باقة (Bundle)
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md-full text-xs font-semibold bg-md-primary-container text-md-primary-on-container">
                            <Package className="w-3 h-3" /> منتج مفرد
                          </span>
                        )}
                      </td>

                      {/* Price */}
                      <td className="py-3.5 px-4 font-extrabold text-md-surface-on">
                        {formatCurrency(prod.price)}
                      </td>

                      {/* Compare At Price */}
                      <td className="py-3.5 px-4 text-xs text-md-surface-on-variant line-through">
                        {oldPriceVal && oldPriceVal > 0 ? formatCurrency(oldPriceVal) : "-"}
                      </td>

                      {/* Status Badge */}
                      <td className="py-3.5 px-4">
                        {prod.isActive ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                            نشط
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-600 dark:text-rose-400">
                            معطل
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-left">
                        <div className="flex items-center justify-end gap-1">
                          {/* View as Customer Button */}
                          <a
                            href={`/products/${prod.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-full hover:bg-md-surface-variant/30 text-md-surface-on-variant transition-colors"
                            title="معاينة كعميل (فتح في نافذة جديدة)"
                          >
                            <Eye className="w-4 h-4" />
                          </a>

                          {/* Edit Button */}
                          <button
                            type="button"
                            onClick={() => onEdit(prod)}
                            className="p-1.5 rounded-full hover:bg-md-primary-container/40 text-md-primary transition-colors"
                            title="تعديل"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>

                          {/* Delete Button */}
                          <button
                            type="button"
                            onClick={() => handleDelete(prod)}
                            className="p-1.5 rounded-full hover:bg-md-error-container/40 text-md-error transition-colors"
                            title="حذف نهائي ومسح الصور"
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
    </div>
  );
}
