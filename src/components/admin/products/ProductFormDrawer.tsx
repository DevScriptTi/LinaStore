"use client";

import React, { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { X, Plus, Trash2, UploadCloud, Package, Layers, Sparkles } from "lucide-react";
import { RichTextEditor } from "@/components/admin/rich-text-editor";

export interface ProductFormData {
  title: string;
  price: number;
  compareAtPrice: number;
  type: "product" | "bundle";
  category: string;
  description: string;
  imageUrl?: string;
  bundleItems: { name: string }[];
}

interface ProductFormDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ProductFormData) => void;
}

export function ProductFormDrawer({ isOpen, onClose, onSubmit }: ProductFormDrawerProps) {
  const [productType, setProductType] = useState<"product" | "bundle">("product");
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    control,
    formState: { errors },
  } = useForm<ProductFormData>({
    defaultValues: {
      title: "",
      price: 0,
      compareAtPrice: 0,
      type: "product",
      category: "العناية بالبشرة",
      description: "",
      bundleItems: [{ name: "" }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "bundleItems",
  });

  useEffect(() => {
    setValue("type", productType);
  }, [productType, setValue]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleFormSubmit = (data: ProductFormData) => {
    onSubmit({
      ...data,
      type: productType,
      imageUrl: imagePreview || undefined,
    });
    reset();
    setImagePreview(null);
    onClose();
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setImagePreview(url);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden select-none" dir="rtl">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity animate-in fade-in"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 left-0 max-w-full flex pl-0 md:pl-10">
        <div className="w-screen max-w-2xl bg-md-surface text-md-surface-on shadow-2xl flex flex-col border-r border-md-outline/10">
          
          {/* Drawer Header */}
          <div className="px-6 py-4 border-b border-md-outline/10 bg-md-surface-container-low flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-md-full bg-md-primary-container text-md-primary-on-container">
                <Package className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold">إضافة منتج أو باقة جديدة</h2>
                <p className="text-xs text-md-surface-on-variant">أدخل تفاصيل البيانات والنوع لإضافتها للمتجر</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-md-surface-variant/30 text-md-surface-on-variant transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form Body */}
          <form onSubmit={handleSubmit(handleFormSubmit)} className="flex-1 overflow-y-auto p-6 space-y-6">
            
            {/* Type Selector (Tabs) */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-md-surface-on-variant">نوع العنصر</label>
              <div className="grid grid-cols-2 gap-2 p-1.5 rounded-md-xl bg-md-surface-container-high border border-md-outline/10">
                <button
                  type="button"
                  onClick={() => setProductType("product")}
                  className={`flex items-center justify-center gap-2 py-2.5 rounded-md-lg text-sm font-semibold transition-all ${
                    productType === "product"
                      ? "bg-md-primary text-md-primary-on shadow-md-1"
                      : "text-md-surface-on-variant hover:text-md-surface-on"
                  }`}
                >
                  <Package className="w-4 h-4" />
                  <span>منتج مفرد</span>
                </button>

                <button
                  type="button"
                  onClick={() => setProductType("bundle")}
                  className={`flex items-center justify-center gap-2 py-2.5 rounded-md-lg text-sm font-semibold transition-all ${
                    productType === "bundle"
                      ? "bg-md-tertiary text-md-tertiary-on shadow-md-1"
                      : "text-md-surface-on-variant hover:text-md-surface-on"
                  }`}
                >
                  <Layers className="w-4 h-4" />
                  <span>باقة / مجموعة (Bundle)</span>
                </button>
              </div>
            </div>

            {/* Basic Information */}
            <div className="space-y-4 p-4 rounded-md-xl bg-md-surface-container border border-md-outline/10">
              <h3 className="text-sm font-semibold text-md-primary flex items-center gap-2">
                <Sparkles className="w-4 h-4" /> المعلومات الأساسية
              </h3>

              {/* Title Input */}
              <div>
                <label className="block text-xs font-medium mb-1.5 text-md-surface-on">
                  {productType === "product" ? "اسم المنتج *" : "اسم الباقة / المجموعة *"}
                </label>
                <input
                  type="text"
                  placeholder={productType === "product" ? "مثال: سيروم فيتامين سي للوجه" : "مثال: مجموعة العناية المتكاملة للبشرة"}
                  {...register("title", { required: "هذا الحقل مطلوب" })}
                  className="w-full px-4 py-2.5 rounded-md-md bg-md-surface border border-md-outline/30 focus:border-md-primary focus:ring-2 focus:ring-md-primary/20 text-sm outline-none transition-all"
                />
                {errors.title && <span className="text-xs text-md-error mt-1">{errors.title.message}</span>}
              </div>

              {/* Category Dropdown */}
              <div>
                <label className="block text-xs font-medium mb-1.5 text-md-surface-on">التصنيف *</label>
                <select
                  {...register("category", { required: true })}
                  className="w-full px-4 py-2.5 rounded-md-md bg-md-surface border border-md-outline/30 focus:border-md-primary focus:ring-2 focus:ring-md-primary/20 text-sm outline-none transition-all"
                >
                  <option value="العناية بالبشرة">العناية بالبشرة</option>
                  <option value="العطور">العطور</option>
                  <option value="المكياج">المكياج</option>
                  <option value="العناية بالشعر">العناية بالشعر</option>
                  <option value="مجموعات مميزة">مجموعات مميزة</option>
                </select>
              </div>

              {/* Price & Compare-at Price */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium mb-1.5 text-md-surface-on">السعر الحالي (ر.س) *</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    {...register("price", { valueAsNumber: true, required: "مطلوب" })}
                    className="w-full px-4 py-2.5 rounded-md-md bg-md-surface border border-md-outline/30 focus:border-md-primary focus:ring-2 focus:ring-md-primary/20 text-sm outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium mb-1.5 text-md-surface-on">السعر القديم / المقارن (ر.س)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    {...register("compareAtPrice", { valueAsNumber: true })}
                    className="w-full px-4 py-2.5 rounded-md-md bg-md-surface border border-md-outline/30 focus:border-md-primary focus:ring-2 focus:ring-md-primary/20 text-sm outline-none transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Dynamic Bundle Items Section (If type is bundle) */}
            {productType === "bundle" && (
              <div className="space-y-4 p-4 rounded-md-xl bg-md-tertiary-container/20 border border-md-tertiary/30">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-md-tertiary flex items-center gap-2">
                    <Layers className="w-4 h-4" /> مكونات الباقة (المنتجات المشمولة)
                  </h3>
                  <button
                    type="button"
                    onClick={() => append({ name: "" })}
                    className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-md-full bg-md-tertiary text-md-tertiary-on hover:opacity-90 font-medium transition-all"
                  >
                    <Plus className="w-3.5 h-3.5" /> عنصر جديد
                  </button>
                </div>

                <div className="space-y-2">
                  {fields.map((field, index) => (
                    <div key={field.id} className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder={`مكون الباقة #${index + 1} (مثال: كريم مرطب 50ml)`}
                        {...register(`bundleItems.${index}.name` as const, { required: true })}
                        className="flex-1 px-4 py-2 rounded-md-md bg-md-surface border border-md-outline/30 focus:border-md-tertiary text-sm outline-none"
                      />
                      {fields.length > 1 && (
                        <button
                          type="button"
                          onClick={() => remove(index)}
                          className="p-2 text-md-error hover:bg-md-error-container/30 rounded-md-md transition-colors"
                          title="حذف العنصر"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Image Upload Area */}
            <div className="space-y-2 p-4 rounded-md-xl bg-md-surface-container border border-md-outline/10">
              <label className="block text-xs font-semibold text-md-surface-on-variant">صورة المنتج الرئيسية</label>
              <div className="border-2 border-dashed border-md-outline/30 rounded-md-lg p-4 text-center bg-md-surface/50 hover:bg-md-surface transition-colors cursor-pointer relative">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                />
                {imagePreview ? (
                  <div className="space-y-2">
                    <img src={imagePreview} alt="Preview" className="h-32 mx-auto rounded-md-md object-contain" />
                    <p className="text-xs text-md-primary">انقر لتغيير الصورة</p>
                  </div>
                ) : (
                  <div className="py-4 space-y-2 flex flex-col items-center">
                    <UploadCloud className="w-8 h-8 text-md-primary" />
                    <p className="text-sm font-medium text-md-surface-on">اسحب واسقط الصورة هنا أو اضغط للتصفح</p>
                    <p className="text-xs text-md-surface-on-variant">يدعم صيغ PNG, JPG, WEBP بحجم أقصى 5MB</p>
                  </div>
                )}
              </div>
            </div>

            {/* Description (Rich Text Editor) */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-md-surface-on-variant">وصف التفاصيل</label>
              <RichTextEditor
                content={watch("description") || ""}
                onChange={(html) => setValue("description", html)}
              />
            </div>

            {/* Submit & Cancel Buttons */}
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
                className="px-6 py-2.5 rounded-md-full bg-md-primary text-md-primary-on text-sm font-semibold shadow-md-1 hover:opacity-95 transition-all flex items-center gap-2"
              >
                <Package className="w-4 h-4" />
                <span>حفظ البيانات</span>
              </button>
            </div>
          </form>

        </div>
      </div>
    </div>
  );
}
