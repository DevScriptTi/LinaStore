"use client";

import React, { useState } from "react";
import { Plus, Package, Layers, Sparkles } from "lucide-react";
import { ProductsTable } from "@/components/admin/products/ProductsTable";
import { ProductFormModal } from "@/components/admin/products/ProductFormModal";
import { IProduct } from "@/types";

export default function AdminProductsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<IProduct | null>(null);

  const handleOpenAdd = () => {
    setEditingProduct(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (product: IProduct) => {
    setEditingProduct(product);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-8" dir="rtl">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-md-surface-on flex items-center gap-2">
            <Package className="w-7 h-7 text-md-primary" />
            <span>المنتجات والباقات (Products Management)</span>
          </h1>
          <p className="text-sm text-md-surface-on-variant mt-1">
            إدارة كافة المنتجات المفردة والمجموعات والباقات والأسعار وتفاصيل العرض.
          </p>
        </div>

        {/* Primary Action Button */}
        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-md-full bg-md-primary text-md-primary-on font-bold shadow-md-2 hover:opacity-95 transition-all text-sm shrink-0 self-start md:self-auto"
        >
          <Plus className="w-5 h-5" />
          <span>إضافة منتج / باقة جديدة</span>
        </button>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="p-6 rounded-md-xl bg-md-surface-container border border-md-outline/10 shadow-md-1 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-md-surface-on-variant">إجمالي العناصر</span>
            <p className="text-2xl font-bold text-md-surface-on">3 عناصر</p>
          </div>
          <div className="p-3 rounded-md-full bg-md-primary-container text-md-primary-on-container">
            <Package className="w-6 h-6" />
          </div>
        </div>

        <div className="p-6 rounded-md-xl bg-md-surface-container border border-md-outline/10 shadow-md-1 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-md-surface-on-variant">المنتجات المفردة</span>
            <p className="text-2xl font-bold text-md-surface-on">2 منتج</p>
          </div>
          <div className="p-3 rounded-md-full bg-md-secondary-container text-md-secondary-on-container">
            <Sparkles className="w-6 h-6" />
          </div>
        </div>

        <div className="p-6 rounded-md-xl bg-md-surface-container border border-md-outline/10 shadow-md-1 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-md-surface-on-variant">الباقات والمجموعات</span>
            <p className="text-2xl font-bold text-md-surface-on">1 باقة</p>
          </div>
          <div className="p-3 rounded-md-full bg-md-tertiary-container text-md-tertiary-on-container">
            <Layers className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Real-time Products Table Component */}
      <ProductsTable
        onEdit={handleOpenEdit}
        onAddNew={handleOpenAdd}
      />

      {/* Product Form Modal (Full screen mobile, max-w-4xl desktop) */}
      <ProductFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => {
          setIsModalOpen(false);
        }}
        productToEdit={editingProduct}
      />
    </div>
  );
}
