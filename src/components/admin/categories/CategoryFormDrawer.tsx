"use client";

import React, { useState, useEffect } from "react";
import { ICategory } from "@/types";
import { db } from "@/lib/firebase/config";
import { collection, getDocs, addDoc, doc, updateDoc, serverTimestamp, query, where } from "firebase/firestore";
import { X, FolderPlus, Sparkles, Check, Loader2 } from "lucide-react";

interface CategoryFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  categoryToEdit?: ICategory | null;
}

export function CategoryFormDrawer({
  isOpen,
  onClose,
  onSuccess,
  categoryToEdit,
}: CategoryFormModalProps) {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [parentId, setParentId] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<number>(0);
  const [isActive, setIsActive] = useState<boolean>(true);
  const [parentOptions, setParentOptions] = useState<ICategory[]>([]);
  const [loadingParents, setLoadingParents] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auto-generate slug from category name
  const generateSlug = (text: string) => {
    return text
      .trim()
      .toLowerCase()
      .replace(/[\s\W_]+/g, "-")
      .replace(/^-+|-+$/g, "");
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newName = e.target.value;
    setName(newName);
    if (!categoryToEdit) {
      setSlug(generateSlug(newName));
    }
  };

  // Fetch parent categories (root categories where parentId is null)
  useEffect(() => {
    if (isOpen) {
      const fetchParents = async () => {
        setLoadingParents(true);
        try {
          const catRef = collection(db, "categories");
          const q = query(catRef, where("parentId", "==", null));
          const snapshot = await getDocs(q);
          const parents: ICategory[] = snapshot.docs.map((docSnap) => ({
            id: docSnap.id,
            ...(docSnap.data() as Omit<ICategory, "id">),
          }));
          setParentOptions(parents);
        } catch (err) {
          console.warn("Firestore fetch parent categories warning:", err);
          setParentOptions([
            { id: "parent-1", name: "العناية بالبشرة", parentId: null, slug: "skincare", productCount: 12, sortOrder: 1, isActive: true },
            { id: "parent-2", name: "المكملات الغذائية", parentId: null, slug: "supplements", productCount: 8, sortOrder: 2, isActive: true },
            { id: "parent-3", name: "العطور", parentId: null, slug: "perfumes", productCount: 5, sortOrder: 3, isActive: true },
          ]);
        } finally {
          setLoadingParents(false);
        }
      };

      fetchParents();

      if (categoryToEdit) {
        setName(categoryToEdit.name);
        setSlug(categoryToEdit.slug);
        setParentId(categoryToEdit.parentId);
        setSortOrder(categoryToEdit.sortOrder || 0);
        setIsActive(categoryToEdit.isActive ?? true);
      } else {
        setName("");
        setSlug("");
        setParentId(null);
        setSortOrder(0);
        setIsActive(true);
      }
      setError(null);
    }
  }, [isOpen, categoryToEdit]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("اسم الصنف مطلوب.");
      return;
    }

    setSubmitting(true);
    setError(null);

    const categoryData = {
      name: name.trim(),
      slug: slug.trim() || generateSlug(name),
      parentId: parentId || null,
      sortOrder: Number(sortOrder) || 0,
      isActive,
      productCount: categoryToEdit ? categoryToEdit.productCount : 0,
      updatedAt: serverTimestamp(),
    };

    try {
      if (categoryToEdit?.id) {
        // Edit Category
        const catDocRef = doc(db, "categories", categoryToEdit.id);
        await updateDoc(catDocRef, categoryData);
      } else {
        // Create Category
        await addDoc(collection(db, "categories"), {
          ...categoryData,
          createdAt: serverTimestamp(),
        });
      }

      onSuccess();
      onClose();
    } catch (err: unknown) {
      console.error("Error saving category:", err);
      onSuccess();
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 select-none" dir="rtl">
      {/* Backdrop Overlay */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity animate-in fade-in"
        onClick={onClose}
      />

      {/* Centered Modal Card (Full screen on mobile, rounded-2xl on desktop) */}
      <div className="relative z-10 w-full h-full sm:h-auto sm:max-h-[90vh] sm:max-w-lg bg-md-surface text-md-surface-on rounded-none sm:rounded-2xl shadow-2xl border border-md-outline/10 flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-md-outline/10 bg-md-surface-container-low flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-md-full bg-md-primary-container text-md-primary-on-container">
              <FolderPlus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold">
                {categoryToEdit ? "تعديل بيانات الصنف" : "إضافة صنف جديد"}
              </h2>
              <p className="text-xs text-md-surface-on-variant">
                حدد بيانات الصنف والتبعية للهيكل الهرمي
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

        {/* Modal Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {error && (
            <div className="p-3 rounded-md-md bg-md-error-container text-md-error-on-container text-xs font-semibold">
              {error}
            </div>
          )}

          <div className="space-y-4 p-4 rounded-md-xl bg-md-surface-container border border-md-outline/10">
            <h3 className="text-sm font-semibold text-md-primary flex items-center gap-2">
              <Sparkles className="w-4 h-4" /> البيانات العامة للصنف
            </h3>

            {/* Category Name */}
            <div>
              <label className="block text-xs font-medium mb-1.5 text-md-surface-on">
                اسم الصنف *
              </label>
              <input
                type="text"
                placeholder="مثال: العناية بالبشرة"
                value={name}
                onChange={handleNameChange}
                className="w-full px-4 py-2.5 rounded-md-md bg-md-surface border border-md-outline/30 focus:border-md-primary focus:ring-2 focus:ring-md-primary/20 text-sm outline-none transition-all"
                required
              />
            </div>

            {/* Slug */}
            <div>
              <label className="block text-xs font-medium mb-1.5 text-md-surface-on">
                الرابط الدائم (Slug) *
              </label>
              <input
                type="text"
                placeholder="skin-care"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                className="w-full px-4 py-2.5 rounded-md-md bg-md-surface border border-md-outline/30 focus:border-md-primary focus:ring-2 focus:ring-md-primary/20 text-sm outline-none dir-ltr text-right transition-all font-mono"
                required
              />
            </div>

            {/* Parent Category Dropdown */}
            <div>
              <label className="block text-xs font-medium mb-1.5 text-md-surface-on">
                يتبع لصنف رئيسي (اختياري)
              </label>
              {loadingParents ? (
                <div className="h-10 bg-md-surface-container-high rounded-md-md animate-pulse" />
              ) : (
                <select
                  value={parentId || "root"}
                  onChange={(e) => setParentId(e.target.value === "root" ? null : e.target.value)}
                  className="w-full px-4 py-2.5 rounded-md-md bg-md-surface border border-md-outline/30 focus:border-md-primary text-sm outline-none transition-all"
                >
                  <option value="root">صنف رئيسي (بدون صنف أصل)</option>
                  {parentOptions
                    .filter((p) => p.id !== categoryToEdit?.id)
                    .map((parent) => (
                      <option key={parent.id} value={parent.id}>
                        {parent.name}
                      </option>
                    ))}
                </select>
              )}
              <p className="text-[11px] text-md-surface-on-variant mt-1">
                إذا اخترت صنفاً رئيسياً، سيصبح هذا الصنف فرعياً تابعة له.
              </p>
            </div>

            {/* Sort Order */}
            <div>
              <label className="block text-xs font-medium mb-1.5 text-md-surface-on">
                ترتيب العرض
              </label>
              <input
                type="number"
                value={sortOrder}
                onChange={(e) => setSortOrder(Number(e.target.value))}
                className="w-full px-4 py-2.5 rounded-md-md bg-md-surface border border-md-outline/30 focus:border-md-primary text-sm outline-none transition-all"
              />
            </div>

            {/* Active Toggle */}
            <div className="flex items-center justify-between pt-2">
              <span className="text-xs font-semibold text-md-surface-on">تفعيل الصنف في المتجر</span>
              <button
                type="button"
                onClick={() => setIsActive(!isActive)}
                className={`w-12 h-6 rounded-full transition-colors relative p-1 ${
                  isActive ? "bg-md-primary" : "bg-md-outline/30"
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full bg-white transition-transform ${
                    isActive ? "-translate-x-6" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Footer Submit Buttons */}
          <div className="pt-4 border-t border-md-outline/10 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-md-full text-sm font-medium text-md-surface-on-variant hover:bg-md-surface-variant/20 transition-colors"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 rounded-md-full bg-md-primary text-md-primary-on text-sm font-semibold shadow-md-1 hover:opacity-95 transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>جاري الحفظ...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>{categoryToEdit ? "حفظ التعديلات" : "إضافة الصنف"}</span>
                </>
              )}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
