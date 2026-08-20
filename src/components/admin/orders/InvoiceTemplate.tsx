"use client";

import React from "react";
import { IOrder } from "@/types";
import { formatCurrency } from "@/lib/utils";

interface InvoiceTemplateProps {
  order: IOrder | null;
}

export function InvoiceTemplate({ order }: InvoiceTemplateProps) {
  if (!order) return null;

  const formatDate = (dateVal: any) => {
    if (!dateVal) return "اليوم";
    let d: Date;
    if (dateVal?.toDate) d = dateVal.toDate();
    else d = new Date(dateVal);
    if (isNaN(d.getTime())) return "اليوم";
    return d.toLocaleDateString("ar-DZ", { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="hidden print:block fixed inset-0 z-[99999] bg-white text-slate-900 p-8 font-sans dir-rtl select-text overflow-visible">
      {/* Invoice Box Header */}
      <div className="flex items-center justify-between border-b-2 border-slate-900 pb-6 mb-6">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900">متجر لينا - LINA STORE</h1>
          <p className="text-xs font-bold text-slate-600 mt-1">متجر إلكتروني جزائري لمنتجات التجميل والعناية الفاخرة</p>
        </div>
        <div className="text-left font-mono">
          <div className="inline-block px-4 py-1.5 rounded-lg bg-slate-100 text-slate-900 font-extrabold text-xs border border-slate-300">
            فاتورة رقم: #{order.id?.slice(-8).toUpperCase()}
          </div>
          <p className="text-[11px] font-bold text-slate-500 mt-1">{formatDate(order.createdAt)}</p>
        </div>
      </div>

      {/* Customer Info Box */}
      <div className="grid grid-cols-2 gap-6 p-4 rounded-xl bg-slate-50 border border-slate-200 mb-6 text-xs">
        <div className="space-y-2">
          <h2 className="font-extrabold text-slate-900 text-sm border-b border-slate-200 pb-1">بيانات العميل (Customer Details)</h2>
          <p className="font-bold text-slate-800"><span className="text-slate-500 font-normal">اسم العميل:</span> {order.customerName}</p>
          <p className="font-bold text-slate-800"><span className="text-slate-500 font-normal">رقم الهاتف:</span> <span className="font-mono">{order.customerPhone}</span></p>
        </div>
        <div className="space-y-2">
          <h2 className="font-extrabold text-slate-900 text-sm border-b border-slate-200 pb-1">طريقة التوصيل والدفع</h2>
          <p className="font-bold text-slate-800"><span className="text-slate-500 font-normal">الولاية / العنوان:</span> {order.wilaya}</p>
          <p className="font-bold text-slate-800"><span className="text-slate-500 font-normal">طريقة التسليم:</span> استلام من مكتب توصيل الولايات (Stop Desk)</p>
          <p className="font-bold text-slate-800"><span className="text-slate-500 font-normal">طريقة الدفع:</span> الدفع عند الاستلام (COD)</p>
        </div>
      </div>

      {/* Itemized Order Table */}
      <table className="w-full text-right text-xs border-collapse border border-slate-300 mb-6">
        <thead>
          <tr className="bg-slate-200 text-slate-900 font-extrabold">
            <th className="border border-slate-300 p-3">المنتج / الباقة</th>
            <th className="border border-slate-300 p-3 text-center">الكمية</th>
            <th className="border border-slate-300 p-3 text-left">السعر الفردي</th>
            <th className="border border-slate-300 p-3 text-left">الإجمالي الفرعي</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="border border-slate-300 p-3 font-bold text-slate-900">{order.productName}</td>
            <td className="border border-slate-300 p-3 text-center font-bold font-mono">{order.quantity}×</td>
            <td className="border border-slate-300 p-3 text-left font-mono font-bold">{formatCurrency(order.productPrice)}</td>
            <td className="border border-slate-300 p-3 text-left font-mono font-extrabold">{formatCurrency(order.productPrice * order.quantity)}</td>
          </tr>
        </tbody>
      </table>

      {/* Totals Calculation Card */}
      <div className="flex justify-end mb-8">
        <div className="w-72 space-y-2 p-4 rounded-xl bg-slate-100 border border-slate-300 text-xs">
          <div className="flex justify-between font-semibold text-slate-700">
            <span>مجموع المنتجات:</span>
            <span className="font-mono">{formatCurrency(order.productPrice * order.quantity)}</span>
          </div>
          <div className="flex justify-between font-semibold text-slate-700">
            <span>رسوم الشحن (Stop Desk):</span>
            <span className="font-mono">{order.shippingCost === 0 ? "مجاني 🚚" : formatCurrency(order.shippingCost)}</span>
          </div>
          <hr className="border-slate-300 my-1" />
          <div className="flex justify-between text-sm font-black text-slate-900 pt-1">
            <span>المجموع النهائي (COD):</span>
            <span className="font-mono text-orange-700">{formatCurrency(order.total)}</span>
          </div>
        </div>
      </div>

      {/* Invoice Footer */}
      <div className="border-t border-slate-300 pt-6 text-center text-[11px] text-slate-500 space-y-1">
        <p className="font-bold text-slate-700">نشكركم على ثقتكم وتسوقكم من متجر لينا LINA STORE 💖</p>
        <p>لأي استفسار يرجى التواصل عبر الهاتف أو الواتساب المسجل في المتجر.</p>
      </div>
    </div>
  );
}
