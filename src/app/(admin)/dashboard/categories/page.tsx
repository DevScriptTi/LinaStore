"use client";

import React, { useState } from "react";
import { Plus, FolderTree, Layers, Sparkles } from "lucide-react";
import { CategoriesTable } from "@/components/admin/categories/CategoriesTable";
import { CategoryFormDrawer } from "@/components/admin/categories/CategoryFormDrawer";
import { ICategory } from "@/types";

export default function AdminCategoriesPage() {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<ICategory | null>(null);

  const handleOpenAdd = () => {
    setEditingCategory(null);
    setIsDrawerOpen(true);
  };

  const handleOpenEdit = (category: ICategory) => {
    setEditingCategory(category);
    setIsDrawerOpen(true);
  };

  return (
    <div className="space-y-8" dir="rtl">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-md-surface-on flex items-center gap-2">
            <FolderTree className="w-7 h-7 text-md-primary" />
            <span>أصناف المنتجات (Categories)</span>
          </h1>
          <p className="text-sm text-md-surface-on-variant mt-1">
            إدارة الهيكل الهرمي للأصناف والأقسام الرئيسية والفرعية للمتجر.
          </p>
        </div>

        {/* Primary Action Button */}
        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-md-full bg-md-primary text-md-primary-on font-semibold shadow-md-2 hover:opacity-95 transition-all text-sm shrink-0 self-start md:self-auto"
        >
          <Plus className="w-5 h-5" />
          <span>إضافة صنف جديد</span>
        </button>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="p-6 rounded-md-xl bg-md-surface-container border border-md-outline/10 shadow-md-1 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-md-surface-on-variant">إجمالي الأصناف</span>
            <p className="text-2xl font-bold text-md-surface-on">5 أصناف</p>
          </div>
          <div className="p-3 rounded-md-full bg-md-primary-container text-md-primary-on-container">
            <FolderTree className="w-6 h-6" />
          </div>
        </div>

        <div className="p-6 rounded-md-xl bg-md-surface-container border border-md-outline/10 shadow-md-1 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-md-surface-on-variant">الأصناف الرئيسية</span>
            <p className="text-2xl font-bold text-md-surface-on">4 أصناف</p>
          </div>
          <div className="p-3 rounded-md-full bg-md-secondary-container text-md-secondary-on-container">
            <Sparkles className="w-6 h-6" />
          </div>
        </div>

        <div className="p-6 rounded-md-xl bg-md-surface-container border border-md-outline/10 shadow-md-1 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-md-surface-on-variant">الأصناف الفرعية</span>
            <p className="text-2xl font-bold text-md-surface-on">1 صنف فرعي</p>
          </div>
          <div className="p-3 rounded-md-full bg-md-tertiary-container text-md-tertiary-on-container">
            <Layers className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Categories Table Component */}
      <CategoriesTable
        onEdit={handleOpenEdit}
        onAddNew={handleOpenAdd}
      />

      {/* Slide-out Category Form Drawer */}
      <CategoryFormDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onSuccess={() => {
          setIsDrawerOpen(false);
        }}
        categoryToEdit={editingCategory}
      />
    </div>
  );
}
