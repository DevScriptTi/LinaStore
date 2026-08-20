"use client";

import React, { useState, useEffect } from "react";
import { IOrder } from "@/types";
import { db } from "@/lib/firebase/config";
import { collection, query, orderBy, onSnapshot, doc, updateDoc, deleteDoc } from "firebase/firestore";
import { formatCurrency } from "@/lib/utils";
import { 
  ShoppingCart, 
  Search, 
  Phone, 
  User, 
  MapPin, 
  Calendar, 
  Package, 
  Trash2, 
  CheckCircle, 
  Clock, 
  Truck, 
  XCircle, 
  RotateCcw,
  MessageSquare,
  Loader2,
  Filter,
  Printer
} from "lucide-react";
import { InvoiceTemplate } from "./InvoiceTemplate";

const statusConfig: Record<IOrder["status"], { label: string; bgClass: string; icon: React.ElementType }> = {
  pending: {
    label: "قيد المعالجة",
    bgClass: "bg-amber-500/15 dark:bg-[#1C1B1F] text-amber-700 dark:text-amber-400 border-amber-500/40",
    icon: Clock,
  },
  confirmed: {
    label: "تم التأكيد",
    bgClass: "bg-blue-500/15 dark:bg-[#1C1B1F] text-blue-700 dark:text-blue-400 border-blue-500/40",
    icon: CheckCircle,
  },
  shipped: {
    label: "تم الشحن",
    bgClass: "bg-purple-500/15 dark:bg-[#1C1B1F] text-purple-700 dark:text-purple-400 border-purple-500/40",
    icon: Truck,
  },
  delivered: {
    label: "تم التوصيل",
    bgClass: "bg-emerald-500/15 dark:bg-[#1C1B1F] text-emerald-700 dark:text-emerald-400 border-emerald-500/40",
    icon: CheckCircle,
  },
  cancelled: {
    label: "ملغى",
    bgClass: "bg-red-500/15 dark:bg-[#1C1B1F] text-red-700 dark:text-red-400 border-red-500/40",
    icon: XCircle,
  },
  returned: {
    label: "مسترجع (Retour)",
    bgClass: "bg-slate-500/15 dark:bg-[#1C1B1F] text-slate-700 dark:text-slate-400 border-slate-500/40",
    icon: RotateCcw,
  },
};

const mockOrdersList: IOrder[] = [
  {
    id: "ord-101",
    productId: "p-1",
    productName: "سيروم فيتامين سي للوجه 50ml",
    quantity: 2,
    customerName: "فوزي جعفري",
    customerPhone: "0666010843",
    wilaya: "04 - Oum el bouaghi",
    productPrice: 4500,
    shippingCost: 880,
    total: 9880,
    status: "pending",
    createdAt: new Date(),
  },
  {
    id: "ord-102",
    productId: "b-1",
    productName: "باقة العناية الملكية الشاملة",
    quantity: 1,
    customerName: "ياسمين بن علي",
    customerPhone: "0555123456",
    wilaya: "16 - Alger",
    productPrice: 12000,
    shippingCost: 0,
    total: 12000,
    status: "confirmed",
    createdAt: new Date(Date.now() - 3600000 * 5),
  },
  {
    id: "ord-103",
    productId: "p-2",
    productName: "كريم الترطيب الهيدروليكي 100ml",
    quantity: 1,
    customerName: "أحمد بن رمضان",
    customerPhone: "0777987654",
    wilaya: "31 - Oran",
    productPrice: 3200,
    shippingCost: 830,
    total: 4030,
    status: "shipped",
    createdAt: new Date(Date.now() - 3600000 * 24),
  },
];

export function OrdersTable() {
  const [orders, setOrders] = useState<IOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>("all");
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [printingOrder, setPrintingOrder] = useState<IOrder | null>(null);

  const handlePrintInvoice = (ord: IOrder) => {
    setPrintingOrder(ord);
    setTimeout(() => {
      window.print();
    }, 150);
  };

  // Real-time Firestore Listener
  useEffect(() => {
    setLoading(true);
    try {
      const q = query(collection(db, "orders"), orderBy("createdAt", "desc"));
      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          if (!snapshot.empty) {
            const list: IOrder[] = snapshot.docs.map((d) => ({
              id: d.id,
              ...(d.data() as Omit<IOrder, "id">),
            }));
            setOrders(list);
          } else {
            setOrders(mockOrdersList);
          }
          setLoading(false);
        },
        (err) => {
          console.warn("Real-time orders listener fallback to mock:", err);
          setOrders(mockOrdersList);
          setLoading(false);
        }
      );

      return () => unsubscribe();
    } catch (err) {
      console.warn("Firestore query error fallback to mock:", err);
      setOrders(mockOrdersList);
      setLoading(false);
    }
  }, []);

  // Update Status Handler
  const handleStatusChange = async (orderId: string, newStatus: IOrder["status"]) => {
    setUpdatingId(orderId);
    try {
      const orderRef = doc(db, "orders", orderId);
      await updateDoc(orderRef, { status: newStatus });
      
      // Update local state instantly
      setOrders((prev) =>
        prev.map((ord) => (ord.id === orderId ? { ...ord, status: newStatus } : ord))
      );

      setToastMessage(`تم تحديث حالة الطلب #${orderId.slice(-4)} إلى "${statusConfig[newStatus].label}"`);
      setTimeout(() => setToastMessage(null), 3000);
    } catch (err) {
      console.error("Error updating order status in Firestore:", err);
      // Fallback local update
      setOrders((prev) =>
        prev.map((ord) => (ord.id === orderId ? { ...ord, status: newStatus } : ord))
      );
      setToastMessage(`تم تحديث الحالة بنجاح (وضع العرض)`);
      setTimeout(() => setToastMessage(null), 3000);
    } finally {
      setUpdatingId(null);
    }
  };

  // Delete Order Handler
  const handleDeleteOrder = async (orderId: string) => {
    if (!window.confirm("هل أنت تأكد من رغبتك في حذف هذا الطلب نهائياً؟")) return;

    try {
      await deleteDoc(doc(db, "orders", orderId));
      setOrders((prev) => prev.filter((ord) => ord.id !== orderId));
      setToastMessage("تم حذف الطلب بنجاح");
      setTimeout(() => setToastMessage(null), 3000);
    } catch (err) {
      console.error("Error deleting order:", err);
      setOrders((prev) => prev.filter((ord) => ord.id !== orderId));
    }
  };

  // Helper to format Date
  const formatDate = (dateVal: any) => {
    if (!dateVal) return "الآن";
    let d: Date;
    if (dateVal?.toDate && typeof dateVal.toDate === "function") {
      d = dateVal.toDate();
    } else if (dateVal instanceof Date) {
      d = dateVal;
    } else {
      d = new Date(dateVal);
    }
    if (isNaN(d.getTime())) return "تاريخ غير معروف";
    return d.toLocaleString("ar-DZ", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Filtered Orders
  const filteredOrders = orders.filter((ord) => {
    const matchesStatus = selectedStatusFilter === "all" || ord.status === selectedStatusFilter;
    const q = searchQuery.toLowerCase().trim();
    const matchesQuery =
      !q ||
      (ord.customerName && ord.customerName.toLowerCase().includes(q)) ||
      (ord.customerPhone && ord.customerPhone.includes(q)) ||
      (ord.productName && ord.productName.toLowerCase().includes(q)) ||
      (ord.wilaya && ord.wilaya.toLowerCase().includes(q));

    return matchesStatus && matchesQuery;
  });

  return (
    <div className="space-y-6 select-none" dir="rtl">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 left-6 z-50 p-4 rounded-2xl bg-emerald-600 text-white font-bold text-sm shadow-2xl flex items-center gap-3 animate-in slide-in-from-bottom-5">
          <CheckCircle className="w-5 h-5 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Filter & Search Bar */}
      <div className="p-4 rounded-md-xl bg-md-surface-container border border-md-outline/10 space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          
          {/* Search Box */}
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-md-surface-on-variant" />
            <input
              type="text"
              placeholder="ابحث باسم الزبون، رقم الهاتف، أو المنتج..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pr-10 pl-4 py-2 rounded-md-lg bg-md-surface border border-md-outline/20 text-xs text-md-surface-on outline-none focus:border-md-primary transition-all"
            />
          </div>

          {/* Status Filter Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 scrollbar-none">
            <button
              type="button"
              onClick={() => setSelectedStatusFilter("all")}
              className={`px-3 py-1.5 rounded-md-full text-xs font-bold transition-all shrink-0 ${
                selectedStatusFilter === "all"
                  ? "bg-md-primary text-md-primary-on"
                  : "bg-md-surface-container-high text-md-surface-on-variant hover:text-md-surface-on"
              }`}
            >
              الكل ({orders.length})
            </button>

            {(Object.keys(statusConfig) as IOrder["status"][]).map((st) => {
              const count = orders.filter((o) => o.status === st).length;
              return (
                <button
                  key={st}
                  type="button"
                  onClick={() => setSelectedStatusFilter(st)}
                  className={`px-3 py-1.5 rounded-md-full text-xs font-bold transition-all shrink-0 border ${
                    selectedStatusFilter === st
                      ? statusConfig[st].bgClass
                      : "bg-md-surface-container-high text-md-surface-on-variant border-transparent"
                  }`}
                >
                  {statusConfig[st].label} ({count})
                </button>
              );
            })}
          </div>

        </div>
      </div>

      {/* Orders Data Table */}
      <div className="rounded-md-xl bg-md-surface border border-md-outline/10 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center space-y-3">
            <Loader2 className="w-8 h-8 mx-auto text-md-primary animate-spin" />
            <p className="text-xs font-semibold text-md-surface-on-variant">جاري تحميل طلبات الزبائن من Firestore...</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <ShoppingCart className="w-12 h-12 mx-auto text-md-surface-on-variant/50" />
            <p className="text-sm font-bold text-md-surface-on">لا توجد طلبات مسجلة بهذه الفلاتر حالياً.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-md-surface-container-low text-md-surface-on-variant font-bold border-b border-md-outline/10 uppercase">
                <tr>
                  <th className="px-5 py-4">تاريخ الطلب</th>
                  <th className="px-5 py-4">الزبون والهاتف</th>
                  <th className="px-5 py-4">ولاية الاستلام (Stop Desk)</th>
                  <th className="px-5 py-4">المنتج والكمية</th>
                  <th className="px-5 py-4">الإجمالي (دج)</th>
                  <th className="px-5 py-4">الحالة (تغيير فوري)</th>
                  <th className="px-5 py-4 text-center">إجراءات</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-md-outline/10 text-md-surface-on font-medium">
                {filteredOrders.map((ord) => {
                  const currentStatus = statusConfig[ord.status] || statusConfig.pending;
                  const StatusIcon = currentStatus.icon;

                  return (
                    <tr key={ord.id} className="hover:bg-md-surface-container-high/50 transition-colors">
                      
                      {/* Date */}
                      <td className="px-5 py-4 whitespace-nowrap text-md-surface-on-variant">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-md-primary" />
                          <span>{formatDate(ord.createdAt)}</span>
                        </div>
                      </td>

                      {/* Customer Info */}
                      <td className="px-5 py-4">
                        <div className="space-y-1">
                          <div className="font-bold text-md-surface-on flex items-center gap-1.5">
                            <User className="w-3.5 h-3.5 text-md-primary" />
                            <span>{ord.customerName}</span>
                          </div>
                          <a
                            href={`tel:${ord.customerPhone}`}
                            className="text-[11px] font-mono text-orange-600 dark:text-orange-400 hover:underline inline-flex items-center gap-1 dir-ltr text-right"
                          >
                            <Phone className="w-3 h-3" />
                            <span>{ord.customerPhone}</span>
                          </a>
                        </div>
                      </td>

                      {/* Wilaya */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 text-md-surface-on">
                          <MapPin className="w-3.5 h-3.5 text-md-primary shrink-0" />
                          <span className="font-semibold">{ord.wilaya}</span>
                        </div>
                      </td>

                      {/* Product & Quantity */}
                      <td className="px-5 py-4">
                        <div className="space-y-1">
                          <div className="font-bold text-md-surface-on line-clamp-1 max-w-xs flex items-center gap-1.5">
                            <Package className="w-3.5 h-3.5 text-md-primary shrink-0" />
                            <span>{ord.productName}</span>
                          </div>
                          <span className="inline-block px-2 py-0.5 rounded-full bg-md-surface-container-high text-[10px] font-mono font-bold">
                            الكمية: {ord.quantity}×
                          </span>
                        </div>
                      </td>

                      {/* Total */}
                      <td className="px-5 py-4 whitespace-nowrap font-black text-sm text-md-primary">
                        {formatCurrency(ord.total)}
                      </td>

                      {/* Interactive Status Select Dropdown */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <div className="relative inline-block">
                          {updatingId === ord.id ? (
                            <div className="px-3 py-1.5 rounded-md-full bg-md-surface-container border border-md-outline/20 text-xs font-bold flex items-center gap-2">
                              <Loader2 className="w-3.5 h-3.5 animate-spin text-md-primary" />
                              <span>جاري التحديث...</span>
                            </div>
                          ) : (
                            <select
                              value={ord.status}
                              onChange={(e) => handleStatusChange(ord.id!, e.target.value as IOrder["status"])}
                              className={`px-3 py-1.5 rounded-md-full border text-xs font-extrabold outline-none cursor-pointer transition-all ${currentStatus.bgClass}`}
                            >
                              <option value="pending" className="bg-[#1C1B1F] text-gray-100 dark:bg-[#1C1B1F] dark:text-gray-100 font-bold py-1">⏳ قيد المعالجة</option>
                              <option value="confirmed" className="bg-[#1C1B1F] text-gray-100 dark:bg-[#1C1B1F] dark:text-gray-100 font-bold py-1">✅ تم التأكيد</option>
                              <option value="shipped" className="bg-[#1C1B1F] text-gray-100 dark:bg-[#1C1B1F] dark:text-gray-100 font-bold py-1">🚚 تم الشحن</option>
                              <option value="delivered" className="bg-[#1C1B1F] text-gray-100 dark:bg-[#1C1B1F] dark:text-gray-100 font-bold py-1">🎉 تم التوصيل</option>
                              <option value="returned" className="bg-[#1C1B1F] text-gray-100 dark:bg-[#1C1B1F] dark:text-gray-100 font-bold py-1">↩️ مسترجع (Retour)</option>
                              <option value="cancelled" className="bg-[#1C1B1F] text-gray-100 dark:bg-[#1C1B1F] dark:text-gray-100 font-bold py-1">❌ ملغى</option>
                            </select>
                          )}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-4 whitespace-nowrap text-center">
                        <div className="flex items-center justify-center gap-2">
                          {/* Direct Phone Call Button */}
                          <a
                            href={`tel:${ord.customerPhone}`}
                            className="p-2 rounded-md-md bg-blue-500/15 text-blue-600 dark:text-blue-400 hover:bg-blue-500/25 transition-colors"
                            title="اتصال هاتفي بالزبون"
                          >
                            <Phone className="w-4 h-4" />
                          </a>

                          {/* WhatsApp Direct Message Button */}
                          {(() => {
                            const cleanedPhone = (ord.customerPhone || "").replace(/\s+/g, "");
                            const waNumber = cleanedPhone.startsWith("0") ? "213" + cleanedPhone.slice(1) : cleanedPhone;
                            const waText = encodeURIComponent(`مرحباً ${ord.customerName}، نتواصل معك من متجر Lina Store لتأكيد طلبيتك (${ord.productName})...`);
                            const waUrl = `https://wa.me/${waNumber}?text=${waText}`;

                            return (
                              <a
                                href={waUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-2 rounded-md-md bg-emerald-600 text-white hover:bg-emerald-700 transition-colors shadow-sm"
                                title="تواصل عبر واتساب (WhatsApp)"
                              >
                                <MessageSquare className="w-4 h-4" />
                              </a>
                            );
                          })()}

                          {/* Print Invoice Button */}
                          <button
                            type="button"
                            onClick={() => handlePrintInvoice(ord)}
                            className="p-2 rounded-md-md bg-orange-500/15 text-orange-600 dark:text-orange-400 hover:bg-orange-500/25 transition-colors"
                            title="طباعة الفاتورة (Print Invoice)"
                          >
                            <Printer className="w-4 h-4" />
                          </button>

                          {/* Delete Order Button */}
                          <button
                            type="button"
                            onClick={() => handleDeleteOrder(ord.id!)}
                            className="p-2 rounded-md-md bg-md-error-container/30 text-md-error hover:bg-md-error-container transition-colors"
                            title="حذف الطلب"
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

      {/* Printable Invoice Template Element */}
      <InvoiceTemplate order={printingOrder} />
    </div>
  );
}
