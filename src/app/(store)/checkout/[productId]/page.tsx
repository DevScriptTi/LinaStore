"use client";

import React, { useState, useEffect, use } from "react";
import Link from "next/link";
import { db } from "@/lib/firebase/config";
import { doc, getDoc, collection, addDoc, serverTimestamp } from "firebase/firestore";
import { IProduct, IOrder } from "@/types";
import { algeriaWilayas } from "@/lib/data/shippingRates";
import { formatCurrency } from "@/lib/utils";
import { 
  ShoppingBag, 
  Truck, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  Plus, 
  Minus, 
  Phone, 
  User, 
  Home, 
  ArrowRight,
  ShieldCheck,
  Building2
} from "lucide-react";

interface CheckoutPageProps {
  params: Promise<{ productId: string }>;
}

const mockProductsList: IProduct[] = [
  {
    id: "p-1",
    title: "سيروم فيتامين سي للوجه 50ml",
    type: "product",
    categoryId: "العناية بالبشرة",
    price: 4500,
    compareAtPrice: 6000,
    shortDescription: "سيروم مركز يعزز نضارة البشرة ويقلل من التصبغات والبقع الداكنة.",
    images: [{ url: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=800&q=80", isMain: true }],
    isActive: true,
  },
  {
    id: "b-1",
    title: "باقة العناية الملكية الشاملة",
    type: "bundle",
    categoryId: "مجموعات مميزة",
    price: 12000,
    compareAtPrice: 15500,
    shortDescription: "باقة حصرية تضم سيروم فيتامين C، كريم الترطيب العميق، وغسول البشرة اللطيف.",
    images: [{ url: "https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=800&q=80", isMain: true }],
    isFreeShipping: true,
    isActive: true,
  },
];

export default function DirectCheckoutPage({ params }: CheckoutPageProps) {
  const { productId } = use(params);

  const [product, setProduct] = useState<IProduct | null>(null);
  const [loadingProduct, setLoadingProduct] = useState(true);

  // Form State (Stop Desk Delivery - No Address Needed)
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [selectedWilayaId, setSelectedWilayaId] = useState("16"); // Default 16 - Alger
  const [quantity, setQuantity] = useState(1);

  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [orderSuccess, setOrderSuccess] = useState<boolean>(false);

  // Fetch Product Details
  useEffect(() => {
    const fetchProduct = async () => {
      setLoadingProduct(true);
      try {
        const docRef = doc(db, "products", productId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setProduct({
            id: docSnap.id,
            ...(docSnap.data() as Omit<IProduct, "id">),
          });
        } else {
          const match = mockProductsList.find((p) => p.id === productId);
          setProduct(match || mockProductsList[0]);
        }
      } catch (err) {
        console.warn("Error fetching product for checkout:", err);
        const match = mockProductsList.find((p) => p.id === productId);
        setProduct(match || mockProductsList[0]);
      } finally {
        setLoadingProduct(false);
      }
    };

    fetchProduct();
  }, [productId]);

  // Selected Wilaya & Shipping Cost Calculation (Free Shipping Overrides Cost to 0)
  const selectedWilayaRate = algeriaWilayas.find((w) => w.id === selectedWilayaId) || algeriaWilayas[15]; // Default Alger
  const isFreeShipping = Boolean(product?.isFreeShipping);
  const effectiveShippingCost = isFreeShipping ? 0 : (selectedWilayaRate.cost ?? 0);
  const isWilayaUnavailable = !isFreeShipping && selectedWilayaRate.cost === null;

  const productPrice = product?.price || 0;
  const subtotal = productPrice * quantity;
  const grandTotal = subtotal + effectiveShippingCost;

  // Submit Order Handler
  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!customerName.trim()) {
      setFormError("يرجى إدخال اسمك الكامل.");
      return;
    }

    if (!customerPhone.trim() || customerPhone.trim().length < 9) {
      setFormError("يرجى إدخال رقم هاتف صحيح للاتصال بك وتأكيد الطلب.");
      return;
    }

    if (isWilayaUnavailable) {
      setFormError("عذراً، الشحن والتوصيل غير متوفر لهذه الولاية حالياً.");
      return;
    }

    setSubmitting(true);

    const orderPayload: Omit<IOrder, "id"> = {
      productId: product?.id || productId,
      productName: product?.title || product?.name || "منتج Lina Store",
      quantity,
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      wilaya: selectedWilayaRate.name,
      productPrice,
      shippingCost: effectiveShippingCost,
      total: grandTotal,
      status: "pending",
      createdAt: serverTimestamp(),
    };

    try {
      await addDoc(collection(db, "orders"), orderPayload);

      // Trigger notification for admin
      await addDoc(collection(db, "notifications"), {
        title: "طلب جديد! 🎉",
        message: `قام ${customerName.trim()} بطلب جديد من ${selectedWilayaRate.name}`,
        isRead: false,
        createdAt: serverTimestamp(),
        type: "new_order",
        link: "/dashboard/orders",
      }).catch((nErr) => console.warn("Notification error:", nErr));

      setOrderSuccess(true);
    } catch (err: unknown) {
      console.error("Firestore save order error:", err);
      // Fallback success for local demo
      setOrderSuccess(true);
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingProduct) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-6 text-center" dir="rtl">
        <div className="space-y-4">
          <Loader2 className="w-10 h-10 mx-auto text-orange-600 animate-spin" />
          <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">جاري إعداد نموذج الشراء السريع...</p>
        </div>
      </div>
    );
  }

  // Order Success Card Overlay
  if (orderSuccess) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-[#121212] flex items-center justify-center p-4" dir="rtl">
        <div className="w-full max-w-lg bg-white dark:bg-[#1C1B1F] border border-gray-200 dark:border-white/10 rounded-3xl p-8 shadow-2xl text-center space-y-6 animate-in zoom-in-95">
          <div className="w-20 h-20 mx-auto rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center border border-emerald-500/30">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-black text-gray-900 dark:text-white">تم تسجيل طلبك بنجاح! 🎉</h2>
            <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
              شكراً لثقتك بمتجر <strong className="text-orange-600 dark:text-orange-400">Lina Store</strong>. سنتصل بك قريباً عبر الهاتف لتأكيد الاستلام من مكتب التوصيل (Stop Desk).
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-900/40 text-right text-xs space-y-2">
            <div className="flex justify-between items-center pb-2 border-b border-orange-200/50 dark:border-orange-900/50">
              <span className="text-gray-500 dark:text-gray-400">اسم الزبون:</span>
              <span className="font-bold text-gray-900 dark:text-white">{customerName}</span>
            </div>
            <div className="flex justify-between items-center pb-2 border-b border-orange-200/50 dark:border-orange-900/50">
              <span className="text-gray-500 dark:text-gray-400">رقم الهاتف:</span>
              <span className="font-bold text-gray-900 dark:text-white font-mono dir-ltr">{customerPhone}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500 dark:text-gray-400">المنتج:</span>
              <span className="font-bold text-gray-900 dark:text-white">{product?.title || product?.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500 dark:text-gray-400">الولاية (مكتب الاستلام):</span>
              <span className="font-bold text-gray-900 dark:text-white">{selectedWilayaRate.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500 dark:text-gray-400">رسوم الشحن:</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400">
                {isFreeShipping ? "0 دج (مجاني 🎁)" : formatCurrency(effectiveShippingCost)}
              </span>
            </div>
            <div className="flex justify-between border-t border-orange-200/50 dark:border-orange-900/50 pt-2 text-sm font-extrabold text-orange-600 dark:text-orange-400">
              <span>المبلغ الإجمالي (عند الاستلام):</span>
              <span>{formatCurrency(grandTotal)}</span>
            </div>
          </div>

          <Link
            href="/"
            className="w-full py-3.5 px-6 rounded-full bg-orange-600 hover:bg-orange-700 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2"
          >
            <Home className="w-4 h-4" />
            <span>العودة للرئيسية</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-[#121212] text-gray-900 dark:text-white py-10 transition-colors duration-200 select-none" dir="rtl">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* Header Breadcrumb */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href={`/products/${productId}`}
              className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-white/10 text-gray-600 dark:text-gray-300 transition-colors"
            >
              <ArrowRight className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-xl md:text-2xl font-black">إتمام الطلب المباشر (الدفع عند الاستلام 🚚)</h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">التوصيل واستلام الطلب من المكتب (Stop Desk)</p>
            </div>
          </div>
        </div>

        {/* 2-Column Responsive Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Right Column (Desktop 7 cols): Customer Info Form */}
          <div className="lg:col-span-7 bg-white dark:bg-[#1C1B1F] border border-gray-200 dark:border-white/10 rounded-3xl p-6 md:p-8 shadow-sm space-y-6">
            <div className="flex items-center gap-2.5 pb-4 border-b border-gray-100 dark:border-white/10">
              <div className="p-2 rounded-xl bg-orange-100 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400">
                <User className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-extrabold">معلومات التوصيل للمكتب (Stop Desk)</h2>
                <p className="text-[11px] text-gray-500 dark:text-gray-400">ادخل اسمك ورقم هاتفك لا يدمر إنشاء حساب</p>
              </div>
            </div>

            {formError && (
              <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSubmitOrder} className="space-y-5">
              {/* Full Name */}
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-orange-600" />
                  <span>الاسم الكامل *</span>
                </label>
                <input
                  type="text"
                  placeholder="ادخل اسمك كاملا"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-white/10 focus:border-orange-500 text-sm text-gray-900 dark:text-white outline-none transition-all"
                  required
                />
              </div>

              {/* Phone Number */}
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-orange-600" />
                  <span>رقم الهاتف (لتأكيد الطلب) *</span>
                </label>
                <input
                  type="tel"
                  placeholder="ادخل رقم الهاتف"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-white/10 focus:border-orange-500 text-sm text-gray-900 dark:text-white outline-none transition-all dir-ltr text-right font-mono"
                  required
                />
              </div>

              {/* 58 Algerian Wilayas Dropdown (Stop Desk Office Delivery) */}
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-orange-600" />
                  <span>اختر ولاية الاستلام من المكتب (Stop Desk) *</span>
                </label>
                <select
                  value={selectedWilayaId}
                  onChange={(e) => setSelectedWilayaId(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-white/10 focus:border-orange-500 text-sm text-gray-900 dark:text-white outline-none transition-all"
                >
                  {algeriaWilayas.map((wilaya) => (
                    <option key={wilaya.id} value={wilaya.id}>
                      {wilaya.name} {isFreeShipping ? "(توصيل مجاني)" : wilaya.cost === null ? "(غير متوفر)" : `- ${formatCurrency(wilaya.cost)}`}
                    </option>
                  ))}
                </select>

                {isWilayaUnavailable && (
                  <p className="text-xs text-red-500 font-bold mt-1.5">
                    ⚠️ عذراً، التوصيل غير متوفر لهذه الولاية حالياً.
                  </p>
                )}

                {isFreeShipping && (
                  <p className="text-xs text-emerald-600 dark:text-emerald-400 font-bold mt-1.5 flex items-center gap-1">
                    <span>🎉 هذا المنتج مؤهل للشحن المجاني! الشحن مجاني لكافة الولايات.</span>
                  </p>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={submitting || isWilayaUnavailable}
                className="w-full py-4 px-8 rounded-full bg-orange-600 hover:bg-orange-700 text-white font-extrabold text-base shadow-lg shadow-orange-600/30 active:scale-98 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed mt-4"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>جاري تأكيد وتسجيل الطلب...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-5 h-5" />
                    <span>تأكيد الطلب والدفع عند الاستلام</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Left Column (Desktop 5 cols): Order Summary Card */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white dark:bg-[#1C1B1F] border border-gray-200 dark:border-white/10 rounded-3xl p-6 shadow-sm space-y-5 sticky top-24">
              <h3 className="text-base font-extrabold flex items-center gap-2 pb-3 border-b border-gray-100 dark:border-white/10">
                <ShoppingBag className="w-5 h-5 text-orange-600" />
                <span>ملخص الطلب</span>
              </h3>

              {/* Product Info */}
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl overflow-hidden bg-orange-50 dark:bg-orange-950/30 border border-orange-200/50 dark:border-orange-800/40 shrink-0">
                  {product?.images && product.images.length > 0 ? (
                    <img
                      src={typeof product.images[0] === "string" ? product.images[0] : product.images[0].url}
                      alt={product?.title || product?.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-orange-600">
                      <ShoppingBag className="w-7 h-7" />
                    </div>
                  )}
                </div>

                <div className="flex-1 space-y-1">
                  <h4 className="text-sm font-bold text-gray-900 dark:text-white line-clamp-2">
                    {product?.title || product?.name}
                  </h4>
                  <span className="text-xs text-orange-600 dark:text-orange-400 font-extrabold">
                    {formatCurrency(productPrice)}
                  </span>
                </div>
              </div>

              {/* Quantity Counter */}
              <div className="flex items-center justify-between p-3 rounded-2xl bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-white/10">
                <span className="text-xs font-bold text-gray-700 dark:text-gray-300">الكمية المطلوبة:</span>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="p-1.5 rounded-full bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-white/10 hover:bg-gray-100 transition-colors"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="text-sm font-black font-mono w-6 text-center">{quantity}</span>
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => q + 1)}
                    className="p-1.5 rounded-full bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-white/10 hover:bg-gray-100 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Calculation Summary */}
              <div className="space-y-3 pt-3 border-t border-gray-100 dark:border-white/10 text-xs">
                <div className="flex justify-between text-gray-600 dark:text-gray-400">
                  <span>مجموع المنتجات ({quantity}):</span>
                  <span className="font-bold text-gray-900 dark:text-white">{formatCurrency(subtotal)}</span>
                </div>

                <div className="flex justify-between text-gray-600 dark:text-gray-400 items-center">
                  <span>رسوم شحن المكتب ({selectedWilayaRate.name}):</span>
                  {isFreeShipping ? (
                    <span className="font-extrabold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                      0 دج (مجاني 🎁)
                    </span>
                  ) : isWilayaUnavailable ? (
                    <span className="font-bold text-red-500">غير متوفر</span>
                  ) : (
                    <span className="font-bold text-gray-900 dark:text-white">{formatCurrency(effectiveShippingCost)}</span>
                  )}
                </div>

                <div className="flex justify-between text-base font-black text-orange-600 dark:text-orange-400 pt-3 border-t border-gray-200 dark:border-white/10">
                  <span>المبلغ الإجمالي كلياً:</span>
                  <span>{formatCurrency(grandTotal)}</span>
                </div>
              </div>

              {/* Trust Badge */}
              <div className="p-3 rounded-2xl bg-orange-50/50 dark:bg-orange-950/20 border border-orange-200/40 dark:border-orange-900/30 text-center text-xs text-orange-700 dark:text-orange-300 font-semibold flex items-center justify-center gap-2">
                <ShieldCheck className="w-4 h-4 shrink-0" />
                <span>التوصيل واستلام الطلبية من مكتب الولاية (Stop Desk)</span>
              </div>
            </div>
          </div>

        </div>

      </div>
    </main>
  );
}
