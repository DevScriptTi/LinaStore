"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { db } from "@/lib/firebase/config";
import { collection, query, orderBy, onSnapshot, limit } from "firebase/firestore";
import { IOrder, IProduct } from "@/types";
import { formatCurrency } from "@/lib/utils";
import { 
  DollarSign, 
  ShoppingCart, 
  Package, 
  TrendingUp, 
  Clock, 
  CheckCircle2, 
  ArrowLeft, 
  Loader2, 
  AlertCircle,
  Truck,
  RotateCcw,
  Sparkles
} from "lucide-react";
import { DashboardCharts } from "@/components/admin/dashboard/DashboardCharts";

export default function AdminDashboardPage() {
  const [orders, setOrders] = useState<IOrder[]>([]);
  const [productsCount, setProductsCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);

    // 1. Real-time listener for orders
    const qOrders = query(collection(db, "orders"), orderBy("createdAt", "desc"));
    const unsubscribeOrders = onSnapshot(
      qOrders,
      (snapshot) => {
        const list: IOrder[] = snapshot.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<IOrder, "id">),
        }));
        setOrders(list);
        setLoading(false);
      },
      (err) => {
        console.warn("Dashboard orders listener error:", err);
        setLoading(false);
      }
    );

    // 2. Real-time listener for products count
    const unsubscribeProducts = onSnapshot(
      collection(db, "products"),
      (snapshot) => {
        setProductsCount(snapshot.size);
      },
      (err) => {
        console.warn("Dashboard products listener error:", err);
      }
    );

    return () => {
      unsubscribeOrders();
      unsubscribeProducts();
    };
  }, []);

  // Compute COD Business Analytics Metrics
  const totalOrdersCount = orders.length;
  
  const collectedRevenue = orders
    .filter((o) => o.status === "delivered")
    .reduce((sum, o) => sum + (o.total || (o.productPrice * o.quantity + o.shippingCost)), 0);

  const expectedRevenue = orders
    .filter((o) => o.status === "pending" || o.status === "confirmed" || o.status === "shipped")
    .reduce((sum, o) => sum + (o.total || (o.productPrice * o.quantity + o.shippingCost)), 0);

  const pendingOrdersCount = orders.filter((o) => o.status === "pending").length;
  const deliveredOrdersCount = orders.filter((o) => o.status === "delivered").length;
  const shippedOrdersCount = orders.filter((o) => o.status === "shipped").length;
  const returnedOrdersCount = orders.filter((o) => o.status === "returned").length;

  const formatDate = (dateVal: any) => {
    if (!dateVal) return "قبل قليل";
    let d: Date;
    if (dateVal?.toDate) d = dateVal.toDate();
    else d = new Date(dateVal);
    if (isNaN(d.getTime())) return "قبل قليل";
    return d.toLocaleDateString("ar-DZ", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="space-y-8 select-none" dir="rtl">
      
      {/* Welcome Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-md-outline/10">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-md-surface-on flex items-center gap-3">
            <span>مرحباً بك في لوحة تحكم متجر لينا 🛍️</span>
          </h1>
          <p className="text-xs text-md-surface-on-variant mt-1">
            إليك نظرة عامة شاملة على أرباح الدفع عند الاستلام (COD) والطلبات الحالية في المتجر.
          </p>
        </div>

        <Link
          href="/dashboard/orders"
          className="w-full sm:w-auto px-5 py-2.5 rounded-full bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs shadow-md active:scale-98 transition-all flex items-center justify-center gap-2 shrink-0"
        >
          <ShoppingCart className="w-4 h-4" />
          <span>إدارة جميع الطلبات ({totalOrdersCount})</span>
        </Link>
      </div>

      {/* Summary Stats Grid (COD Business Analytics Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        
        {/* Card 1: Collected Revenue (Delivered Orders) */}
        <div className="p-6 rounded-3xl bg-gradient-to-br from-emerald-500/10 via-md-surface-container to-md-surface-container border border-emerald-500/30 space-y-3 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-emerald-700 dark:text-emerald-400">
              الأرباح المحصلة (تم التوصيل)
            </span>
            <div className="p-2.5 rounded-2xl bg-emerald-500 text-white shadow-md">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
              {formatCurrency(collectedRevenue)}
            </p>
            <span className="text-[11px] font-bold text-md-surface-on-variant flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              من إجمالي {deliveredOrdersCount} طلب مكتمل ومسلم
            </span>
          </div>
        </div>

        {/* Card 2: Expected Revenue (Pending & Shipped Orders) */}
        <div className="p-6 rounded-3xl bg-gradient-to-br from-amber-500/10 via-md-surface-container to-md-surface-container border border-amber-500/30 space-y-3 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-amber-700 dark:text-amber-400">
              الأرباح المتوقعة (قيد التوصيل)
            </span>
            <div className="p-2.5 rounded-2xl bg-amber-500 text-white shadow-md">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-2xl font-black text-amber-600 dark:text-amber-400 font-mono">
              {formatCurrency(expectedRevenue)}
            </p>
            <span className="text-[11px] font-bold text-md-surface-on-variant flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-amber-500" />
              {pendingOrdersCount} طلب قيد المعالجة و {shippedOrdersCount} قيد الشحن
            </span>
          </div>
        </div>

        {/* Card 3: Total Orders Summary */}
        <div className="p-6 rounded-3xl bg-gradient-to-br from-orange-500/10 via-md-surface-container to-md-surface-container border border-orange-500/30 space-y-3 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-orange-700 dark:text-orange-400">
              إجمالي الطلبات النشطة
            </span>
            <div className="p-2.5 rounded-2xl bg-orange-600 text-white shadow-md">
              <ShoppingCart className="w-5 h-5" />
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-2xl font-black text-md-surface-on">
              {totalOrdersCount} <span className="text-xs font-bold text-md-surface-on-variant">طلب</span>
            </p>
            <div className="flex items-center gap-2 text-[10px] font-extrabold text-md-surface-on-variant">
              <span className="text-amber-600 dark:text-amber-400">⏳ {pendingOrdersCount} معلق</span>
              <span>•</span>
              <span className="text-emerald-600 dark:text-emerald-400">🎉 {deliveredOrdersCount} سلم</span>
              {returnedOrdersCount > 0 && (
                <>
                  <span>•</span>
                  <span className="text-slate-500">↩️ {returnedOrdersCount} مسترجع</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Card 4: Registered Store Products */}
        <div className="p-6 rounded-3xl bg-gradient-to-br from-blue-500/10 via-md-surface-container to-md-surface-container border border-blue-500/30 space-y-3 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-blue-700 dark:text-blue-400">
              المنتجات المسجلة
            </span>
            <div className="p-2.5 rounded-2xl bg-blue-600 text-white shadow-md">
              <Package className="w-5 h-5" />
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-2xl font-black text-md-surface-on">
              {productsCount} <span className="text-xs font-bold text-md-surface-on-variant">منتج وباقة</span>
            </p>
            <span className="text-[11px] font-bold text-md-surface-on-variant flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-blue-500" />
              منتجات فردية وباقات عروض جاهزة
            </span>
          </div>
        </div>

      </div>

      {/* Advanced Recharts Visual Analytics Section */}
      <DashboardCharts orders={orders} />

      {/* Recent Orders Overview Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-extrabold text-md-surface-on flex items-center gap-2">
            <Clock className="w-5 h-5 text-orange-600 dark:text-orange-400" />
            <span>آخر الطلبات المسجلة حديثاً (Recent Orders)</span>
          </h2>
          <Link
            href="/dashboard/orders"
            className="text-xs font-bold text-orange-600 dark:text-orange-400 hover:underline flex items-center gap-1"
          >
            <span>عرض الكل</span>
            <ArrowLeft className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="rounded-3xl bg-md-surface border border-md-outline/10 shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-16 text-center space-y-4">
              <Loader2 className="w-10 h-10 mx-auto text-orange-600 animate-spin" />
              <p className="text-xs font-semibold text-md-surface-on-variant">جاري تحميل بيانات الإحصائيات والطلبات...</p>
            </div>
          ) : orders.length === 0 ? (
            <div className="p-16 text-center space-y-4">
              <ShoppingCart className="w-12 h-12 mx-auto text-orange-500 opacity-50" />
              <p className="text-sm font-bold text-md-surface-on">لا توجد طلبات في المتجر حالياً.</p>
            </div>
          ) : (
            <div className="overflow-x-auto scrollbar-thin">
              <table className="w-full min-w-[650px] text-right text-xs">
                <thead className="bg-md-surface-container-low border-b border-md-outline/10 text-md-surface-on-variant font-bold">
                  <tr>
                    <th className="px-5 py-3.5">العميل</th>
                    <th className="px-5 py-3.5">الهاتف والولاية</th>
                    <th className="px-5 py-3.5">المنتج</th>
                    <th className="px-5 py-3.5">المجموع الكلي</th>
                    <th className="px-5 py-3.5">الحالة</th>
                    <th className="px-5 py-3.5">التاريخ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-md-outline/10 font-medium text-md-surface-on">
                  {orders.slice(0, 5).map((ord) => (
                    <tr key={ord.id} className="hover:bg-md-surface-container-high transition-colors">
                      <td className="px-5 py-4 font-bold text-gray-900 dark:text-white">
                        {ord.customerName}
                      </td>
                      <td className="px-5 py-4 text-md-surface-on-variant">
                        <span className="font-mono font-bold block">{ord.customerPhone}</span>
                        <span className="text-[11px]">{ord.wilaya}</span>
                      </td>
                      <td className="px-5 py-4">
                        <span className="font-bold block text-orange-600 dark:text-orange-400 line-clamp-1">{ord.productName}</span>
                        <span className="text-[10px] text-md-surface-on-variant">الكمية: {ord.quantity}×</span>
                      </td>
                      <td className="px-5 py-4 font-mono font-black text-sm text-emerald-600 dark:text-emerald-400">
                        {formatCurrency(ord.total || (ord.productPrice * ord.quantity + ord.shippingCost))}
                      </td>
                      <td className="px-5 py-4">
                        {ord.status === "delivered" && (
                          <span className="px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 font-extrabold text-[11px]">
                            🎉 تم التوصيل
                          </span>
                        )}
                        {ord.status === "pending" && (
                          <span className="px-3 py-1 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-400 font-extrabold text-[11px]">
                            ⏳ قيد المعالجة
                          </span>
                        )}
                        {ord.status === "shipped" && (
                          <span className="px-3 py-1 rounded-full bg-purple-500/15 text-purple-700 dark:text-purple-400 font-extrabold text-[11px]">
                            🚚 تم الشحن
                          </span>
                        )}
                        {ord.status === "confirmed" && (
                          <span className="px-3 py-1 rounded-full bg-blue-500/15 text-blue-700 dark:text-blue-400 font-extrabold text-[11px]">
                            ✅ تم التأكيد
                          </span>
                        )}
                        {ord.status === "returned" && (
                          <span className="px-3 py-1 rounded-full bg-slate-500/15 text-slate-700 dark:text-slate-400 font-extrabold text-[11px]">
                            ↩️ مسترجع
                          </span>
                        )}
                        {ord.status === "cancelled" && (
                          <span className="px-3 py-1 rounded-full bg-red-500/15 text-red-700 dark:text-red-400 font-extrabold text-[11px]">
                            ❌ ملغى
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-md-surface-on-variant">
                        {formatDate(ord.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
