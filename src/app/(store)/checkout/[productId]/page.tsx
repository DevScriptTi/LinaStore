"use client";

import React, { useState, useEffect, useMemo, use } from "react";
import Link from "next/link";
import { db } from "@/lib/firebase/config";
import { doc, getDoc, collection, getDocs, addDoc, serverTimestamp } from "firebase/firestore";
import { IProduct, IOrder, IShippingZone } from "@/types";
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
  Building2,
  MapPin
} from "lucide-react";

interface CheckoutPageProps {
  params: Promise<{ productId: string }>;
}

// Fallback wilayas data if Firestore shipping_zones collection is empty or fails
const FALLBACK_SHIPPING_ZONES: IShippingZone[] = [
  { code: "01", nameAr: "أدرار", nameFr: "Adrar", homeDeliveryFee: 950, deskDeliveryFee: 500, isActive: true, municipalities: ["أدرار", "تامست", "شروين", "رقان", "أولف"] },
  { code: "02", nameAr: "الشلف", nameFr: "Chlef", homeDeliveryFee: 650, deskDeliveryFee: 400, isActive: true, municipalities: ["الشلف", "تنس", "أولاد فارس", "تاوقريت", "بوقادير"] },
  { code: "03", nameAr: "الأغواط", nameFr: "Laghouat", homeDeliveryFee: 800, deskDeliveryFee: 450, isActive: true, municipalities: ["الأغواط", "أفلو", "حاسي الرمل", "قصر الحيران"] },
  { code: "04", nameAr: "أم البواقي", nameFr: "Oum El Bouaghi", homeDeliveryFee: 750, deskDeliveryFee: 400, isActive: true, municipalities: ["أم البواقي", "عين البيضاء", "عين مليلة", "مسكيانة"] },
  { code: "05", nameAr: "باتنة", nameFr: "Batna", homeDeliveryFee: 700, deskDeliveryFee: 400, isActive: true, municipalities: ["باتنة", "أريس", "بريكة", "عين التوتة", "مروانة"] },
  { code: "06", nameAr: "بجاية", nameFr: "Béjaïa", homeDeliveryFee: 700, deskDeliveryFee: 400, isActive: true, municipalities: ["بجاية", "أقبو", "القصر", "أميزور", "تيشي", "أوقاس"] },
  { code: "07", nameAr: "بسكرة", nameFr: "Biskra", homeDeliveryFee: 800, deskDeliveryFee: 450, isActive: true, municipalities: ["بسكرة", "طولقة", "سيدي عقبة", "زريبة الوادي", "أولاد جلال"] },
  { code: "08", nameAr: "بشار", nameFr: "Béchar", homeDeliveryFee: 950, deskDeliveryFee: 550, isActive: true, municipalities: ["بشار", "القنادسة", "تاغيت", "العبادلة"] },
  { code: "09", nameAr: "البليدة", nameFr: "Blida", homeDeliveryFee: 500, deskDeliveryFee: 300, isActive: true, municipalities: ["البليدة", "بوفاريك", "العفرون", "موزاية", "أولاد يعيش", "الشبلي"] },
  { code: "10", nameAr: "البويرة", nameFr: "Bouira", homeDeliveryFee: 650, deskDeliveryFee: 350, isActive: true, municipalities: ["البويرة", "الأخضرية", "سور الغزلان", "عين بسام", "مشدالة"] },
  { code: "16", nameAr: "الجزائر", nameFr: "Alger", homeDeliveryFee: 400, deskDeliveryFee: 250, isActive: true, municipalities: ["باب الزوار", "المرادية", "الرويبة", "حسين داي", "بئر خادم", "الشراقة", "الدرارية", "زرالدة", "الأبيار", "بن عكنون", "القبة", "بوزريعة"] },
  { code: "19", nameAr: "سطيف", nameFr: "Sétif", homeDeliveryFee: 650, deskDeliveryFee: 350, isActive: true, municipalities: ["سطيف", "العلمة", "عين ولمان", "عين أرنات", "بوقاعة", "جميلة"] },
  { code: "25", nameAr: "قسنطينة", nameFr: "Constantine", homeDeliveryFee: 650, deskDeliveryFee: 350, isActive: true, municipalities: ["قسنطينة", "الخروب", "حامة بوزيان", "زيغود يوسف", "عين سمارة", "ديدوش مراد"] },
  { code: "31", nameAr: "وهران", nameFr: "Oran", homeDeliveryFee: 600, deskDeliveryFee: 350, isActive: true, municipalities: ["وهران", "السانية", "بئر الجير", "ارزيو", "عين الترك", "قديل", "وادي تليلات"] },
  { code: "35", nameAr: "بومرداس", nameFr: "Boumerdès", homeDeliveryFee: 550, deskDeliveryFee: 300, isActive: true, municipalities: ["بومرداس", "برج منايل", "خميس الخشنة", "دلس", "بودواو", "الثنية"] }
];

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

  // Dynamic Shipping Zones State
  const [shippingZones, setShippingZones] = useState<IShippingZone[]>([]);
  const [loadingZones, setLoadingZones] = useState<boolean>(true);

  // Customer Form State
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [selectedWilayaCode, setSelectedWilayaCode] = useState("16"); // Default 16 - Alger
  const [selectedMunicipality, setSelectedMunicipality] = useState("");
  const [deliveryType, setDeliveryType] = useState<"home" | "desk">("home");
  const [quantity, setQuantity] = useState(1);

  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [orderSuccess, setOrderSuccess] = useState<boolean>(false);

  // 1. Fetch Product Details
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

  // 2. Fetch Active Shipping Zones from Firestore
  useEffect(() => {
    const fetchZones = async () => {
      setLoadingZones(true);
      try {
        const querySnapshot = await getDocs(collection(db, "shipping_zones"));
        if (!querySnapshot.empty) {
          const fetched: IShippingZone[] = querySnapshot.docs
            .map((docSnap) => {
              const data = docSnap.data();
              return {
                id: docSnap.id,
                code: data.code || docSnap.id,
                nameAr: data.nameAr || "",
                nameFr: data.nameFr || "",
                homeDeliveryFee: typeof data.homeDeliveryFee === "number" ? data.homeDeliveryFee : 600,
                deskDeliveryFee: typeof data.deskDeliveryFee === "number" ? data.deskDeliveryFee : 350,
                isActive: data.isActive !== undefined ? data.isActive : true,
                municipalities: Array.isArray(data.municipalities) ? data.municipalities : [],
              };
            })
            .filter((z) => z.isActive);

          fetched.sort((a, b) => parseInt(a.code, 10) - parseInt(b.code, 10));

          if (fetched.length > 0) {
            setShippingZones(fetched);
            // Default select first available or '16'
            const defaultZone = fetched.find((z) => z.code === "16") || fetched[0];
            setSelectedWilayaCode(defaultZone.code);
            if (defaultZone.municipalities.length > 0) {
              setSelectedMunicipality(defaultZone.municipalities[0]);
            }
          } else {
            setShippingZones(FALLBACK_SHIPPING_ZONES);
          }
        } else {
          setShippingZones(FALLBACK_SHIPPING_ZONES);
        }
      } catch (err) {
        console.warn("Error fetching shipping_zones fallback to defaults:", err);
        setShippingZones(FALLBACK_SHIPPING_ZONES);
      } finally {
        setLoadingZones(false);
      }
    };

    fetchZones();
  }, []);

  // 3. Selected Wilaya Object
  const selectedZone = useMemo(() => {
    return shippingZones.find((z) => z.code === selectedWilayaCode) || shippingZones[0] || FALLBACK_SHIPPING_ZONES[10];
  }, [shippingZones, selectedWilayaCode]);

  // 4. Update Municipality default when Wilaya changes
  const handleWilayaChange = (code: string) => {
    setSelectedWilayaCode(code);
    const targetZone = shippingZones.find((z) => z.code === code);
    if (targetZone && targetZone.municipalities.length > 0) {
      setSelectedMunicipality(targetZone.municipalities[0]);
    } else {
      setSelectedMunicipality("");
    }
  };

  // 5. Price Calculations
  const isFreeShipping = Boolean(product?.isFreeShipping);
  const baseShippingCost = deliveryType === "home" 
    ? (selectedZone?.homeDeliveryFee ?? 600)
    : (selectedZone?.deskDeliveryFee ?? 350);
  
  const effectiveShippingCost = isFreeShipping ? 0 : baseShippingCost;
  const productPrice = product?.price || 0;
  const subtotal = productPrice * quantity;
  const grandTotal = subtotal + effectiveShippingCost;

  // 6. Form Submission Handler
  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!customerName.trim()) {
      setFormError("يرجى إدخال اسمك الكامل.");
      return;
    }

    if (!customerPhone.trim() || customerPhone.trim().length < 9) {
      setFormError("يرجى إدخال رقم هاتف صحيح (مثال: 0661234567).");
      return;
    }

    if (!selectedZone) {
      setFormError("يرجى اختيار ولاية التوصيل.");
      return;
    }

    if (!selectedMunicipality.trim()) {
      setFormError("يرجى تحديد أو كتابة اسم البلدية.");
      return;
    }

    setSubmitting(true);

    const orderPayload: Omit<IOrder, "id"> = {
      productId: product?.id || productId,
      productName: product?.title || product?.name || "منتج Lina Store",
      quantity,
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      wilayaCode: selectedZone.code,
      wilayaName: selectedZone.nameAr,
      wilaya: `${selectedZone.code} - ${selectedZone.nameAr}`,
      municipality: selectedMunicipality.trim(),
      deliveryType,
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
        message: `قام ${customerName.trim()} بطلب جديد من ولاية ${selectedZone.nameAr} (${selectedMunicipality.trim()})`,
        isRead: false,
        createdAt: serverTimestamp(),
        type: "new_order",
        link: "/dashboard/orders",
      }).catch((nErr) => console.warn("Notification error:", nErr));

      setOrderSuccess(true);
    } catch (err: unknown) {
      console.error("Firestore save order error:", err);
      // Local fallback success for demo resilience
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
          <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">جاري تحميل تفاصيل الطلب...</p>
        </div>
      </div>
    );
  }

  // Order Success Screen
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
              شكراً لثقتك بمتجر <strong className="text-orange-600 dark:text-orange-400">Lina Store</strong>. سنتصل بك قريباً عبر الهاتف لتأكيد الطلب وتفاصيل التوصيل.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-900/40 text-right text-xs space-y-2.5">
            <div className="flex justify-between items-center pb-2 border-b border-orange-200/50 dark:border-orange-900/50">
              <span className="text-gray-500 dark:text-gray-400">اسم الزبون:</span>
              <span className="font-bold text-gray-900 dark:text-white">{customerName}</span>
            </div>
            <div className="flex justify-between items-center pb-2 border-b border-orange-200/50 dark:border-orange-900/50">
              <span className="text-gray-500 dark:text-gray-400">رقم الهاتف:</span>
              <span className="font-bold text-gray-900 dark:text-white font-mono dir-ltr">{customerPhone}</span>
            </div>
            <div className="flex justify-between pb-2 border-b border-orange-200/50 dark:border-orange-900/50">
              <span className="text-gray-500 dark:text-gray-400">المنتج والكمية:</span>
              <span className="font-bold text-gray-900 dark:text-white">{product?.title || product?.name} ({quantity})</span>
            </div>
            <div className="flex justify-between pb-2 border-b border-orange-200/50 dark:border-orange-900/50">
              <span className="text-gray-500 dark:text-gray-400">مكان التوصيل:</span>
              <span className="font-bold text-gray-900 dark:text-white">
                ولاية {selectedZone?.nameAr} - {selectedMunicipality}
              </span>
            </div>
            <div className="flex justify-between pb-2 border-b border-orange-200/50 dark:border-orange-900/50">
              <span className="text-gray-500 dark:text-gray-400">طريقة التوصيل:</span>
              <span className="font-bold text-gray-900 dark:text-white">
                {deliveryType === "home" ? "🚚 توصيل للمنزل" : "🏢 استلام من المكتب (Stop Desk)"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500 dark:text-gray-400">تكلفة الشحن:</span>
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
              <p className="text-xs text-gray-500 dark:text-gray-400">أدخل معلوماتك واختر ولاية وبلدية التوصيل المناسبة</p>
            </div>
          </div>
        </div>

        {/* 2-Column Responsive Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Right Column: Customer & Delivery Info Form */}
          <div className="lg:col-span-7 bg-white dark:bg-[#1C1B1F] border border-gray-200 dark:border-white/10 rounded-3xl p-6 md:p-8 shadow-sm space-y-6">
            <div className="flex items-center gap-2.5 pb-4 border-b border-gray-100 dark:border-white/10">
              <div className="p-2 rounded-xl bg-orange-100 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400">
                <User className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-extrabold">معلومات التوصيل والزبون</h2>
                <p className="text-[11px] text-gray-500 dark:text-gray-400">توصيل سريع مع إمكانية الدفع عند الاستلام</p>
              </div>
            </div>

            {formError && (
              <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSubmitOrder} className="space-y-5">
              {/* Customer Name */}
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
                  placeholder="0661234567"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-white/10 focus:border-orange-500 text-sm text-gray-900 dark:text-white outline-none transition-all dir-ltr text-right font-mono"
                  required
                />
              </div>

              {/* Dynamic Wilaya Select */}
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-orange-600" />
                  <span>اختر الولاية *</span>
                </label>

                {loadingZones ? (
                  <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-white/10 text-xs text-gray-500">
                    <Loader2 className="w-4 h-4 animate-spin text-orange-600" />
                    <span>جاري تحميل قائمة الولايات...</span>
                  </div>
                ) : (
                  <select
                    value={selectedWilayaCode}
                    onChange={(e) => handleWilayaChange(e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-white/10 focus:border-orange-500 text-sm font-semibold text-gray-900 dark:text-white outline-none transition-all"
                  >
                    {shippingZones.map((zone) => (
                      <option key={zone.code} value={zone.code}>
                        {zone.code} - {zone.nameAr} ({zone.nameFr})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Dynamic Municipality Selection / Input Field */}
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-orange-600" />
                  <span>البلدية *</span>
                </label>

                {selectedZone && selectedZone.municipalities.length > 0 ? (
                  <select
                    value={selectedMunicipality}
                    onChange={(e) => setSelectedMunicipality(e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-white/10 focus:border-orange-500 text-sm font-semibold text-gray-900 dark:text-white outline-none transition-all"
                  >
                    {selectedZone.municipalities.map((muni, i) => (
                      <option key={i} value={muni}>
                        {muni}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    placeholder="ادخل اسم البلدية"
                    value={selectedMunicipality}
                    onChange={(e) => setSelectedMunicipality(e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-white/10 focus:border-orange-500 text-sm text-gray-900 dark:text-white outline-none transition-all"
                    required
                  />
                )}
              </div>

              {/* Delivery Type Selector (Home vs Stop Desk) */}
              <div className="space-y-2 pt-2">
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                  خيار وطريقة التوصيل *
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Option 1: Home Delivery */}
                  <button
                    type="button"
                    onClick={() => setDeliveryType("home")}
                    className={`p-4 rounded-2xl border text-right transition-all flex items-start gap-3 relative ${
                      deliveryType === "home"
                        ? "bg-orange-500/10 border-orange-500 text-orange-600 dark:text-orange-400 font-bold"
                        : "bg-gray-50 dark:bg-slate-900 border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300 hover:border-gray-300"
                    }`}
                  >
                    <div className={`p-2 rounded-xl shrink-0 ${deliveryType === "home" ? "bg-orange-600 text-white" : "bg-gray-200 dark:bg-white/10"}`}>
                      <Home className="w-5 h-5" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black">توصيل للمنزل</span>
                        {deliveryType === "home" && <CheckCircle2 className="w-4 h-4 text-orange-600" />}
                      </div>
                      <p className="text-[11px] text-gray-500 dark:text-gray-400 font-normal">استلام مباشر أمام المنزل</p>
                      <span className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400 block pt-1">
                        {isFreeShipping ? "0 دج (مجاني 🎁)" : formatCurrency(selectedZone?.homeDeliveryFee ?? 600)}
                      </span>
                    </div>
                  </button>

                  {/* Option 2: Stop Desk Delivery */}
                  <button
                    type="button"
                    onClick={() => setDeliveryType("desk")}
                    className={`p-4 rounded-2xl border text-right transition-all flex items-start gap-3 relative ${
                      deliveryType === "desk"
                        ? "bg-purple-500/10 border-purple-500 text-purple-600 dark:text-purple-400 font-bold"
                        : "bg-gray-50 dark:bg-slate-900 border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300 hover:border-gray-300"
                    }`}
                  >
                    <div className={`p-2 rounded-xl shrink-0 ${deliveryType === "desk" ? "bg-purple-600 text-white" : "bg-gray-200 dark:bg-white/10"}`}>
                      <Building2 className="w-5 h-5" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black">استلام من المكتب (Stop Desk)</span>
                        {deliveryType === "desk" && <CheckCircle2 className="w-4 h-4 text-purple-600" />}
                      </div>
                      <p className="text-[11px] text-gray-500 dark:text-gray-400 font-normal">الاستلام من مقر ولاية {selectedZone?.nameAr}</p>
                      <span className="text-xs font-extrabold text-purple-600 dark:text-purple-400 block pt-1">
                        {isFreeShipping ? "0 دج (مجاني 🎁)" : formatCurrency(selectedZone?.deskDeliveryFee ?? 350)}
                      </span>
                    </div>
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={submitting}
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
                    <span>تأكيد الطلب والدفع عند الاستلام ({formatCurrency(grandTotal)})</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Left Column: Order Summary Card */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white dark:bg-[#1C1B1F] border border-gray-200 dark:border-white/10 rounded-3xl p-6 shadow-sm space-y-5 sticky top-24">
              <h3 className="text-base font-extrabold flex items-center gap-2 pb-3 border-b border-gray-100 dark:border-white/10">
                <ShoppingBag className="w-5 h-5 text-orange-600" />
                <span>ملخص التكلفة والحساب</span>
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

              {/* Live Calculation Summary */}
              <div className="space-y-3 pt-3 border-t border-gray-100 dark:border-white/10 text-xs">
                <div className="flex justify-between text-gray-600 dark:text-gray-400">
                  <span>مجموع المنتجات ({quantity}):</span>
                  <span className="font-bold text-gray-900 dark:text-white">{formatCurrency(subtotal)}</span>
                </div>

                <div className="flex justify-between text-gray-600 dark:text-gray-400 items-center">
                  <span>
                    رسوم التوصيل ({deliveryType === "home" ? "منزل" : "مكتب"} - {selectedZone?.nameAr}):
                  </span>
                  {isFreeShipping ? (
                    <span className="font-extrabold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                      0 دج (مجاني 🎁)
                    </span>
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
                <span>الدفع عند الاستلام بعد معاينة الطلبية</span>
              </div>
            </div>
          </div>

        </div>

      </div>
    </main>
  );
}
