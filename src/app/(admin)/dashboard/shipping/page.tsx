"use client";

import React, { useState, useEffect, useMemo } from "react";
import { db } from "@/lib/firebase/config";
import { 
  collection, 
  onSnapshot, 
  doc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  serverTimestamp,
  writeBatch
} from "firebase/firestore";
import { IShippingZone } from "@/types";
import { formatCurrency } from "@/lib/utils";
import { 
  Truck, 
  Plus, 
  Search, 
  Edit3, 
  Trash2, 
  MapPin, 
  Building2, 
  Home, 
  X, 
  Loader2, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw,
  SlidersHorizontal
} from "lucide-react";

// Standard seed sample wilayas for easy initialization if database is empty
const SAMPLE_WILAYAS: Partial<IShippingZone>[] = [
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

export default function ShippingManagementPage() {
  const [zones, setZones] = useState<IShippingZone[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [isSeeding, setIsSeeding] = useState<boolean>(false);

  // Toast State
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Modal States
  const [isWilayaModalOpen, setIsWilayaModalOpen] = useState<boolean>(false);
  const [editingZone, setEditingZone] = useState<IShippingZone | null>(null);
  const [formLoading, setFormLoading] = useState<boolean>(false);

  // Form Fields
  const [formData, setFormData] = useState({
    code: "",
    nameAr: "",
    nameFr: "",
    homeDeliveryFee: 600,
    deskDeliveryFee: 350,
    isActive: true,
  });

  // Municipalities Modal State
  const [selectedZoneForMuni, setSelectedZoneForMuni] = useState<IShippingZone | null>(null);
  const [municipalitiesList, setMunicipalitiesList] = useState<string[]>([]);
  const [newMuniInput, setNewMuniInput] = useState<string>("");
  const [muniLoading, setMuniLoading] = useState<boolean>(false);

  // Delete Modal State
  const [deleteTarget, setDeleteTarget] = useState<IShippingZone | null>(null);

  // 1. Subscribe to Firestore collection `shipping_zones` with try/catch & error handling
  useEffect(() => {
    setLoading(true);
    setFetchError(null);

    let unsubscribe: () => void = () => {};

    try {
      unsubscribe = onSnapshot(
        collection(db, "shipping_zones"),
        (snapshot) => {
          const docsList: IShippingZone[] = snapshot.docs.map((docSnap) => {
            const data = docSnap.data();
            return {
              id: docSnap.id,
              code: data.code || docSnap.id,
              nameAr: data.nameAr || "",
              nameFr: data.nameFr || "",
              homeDeliveryFee: typeof data.homeDeliveryFee === "number" ? data.homeDeliveryFee : 0,
              deskDeliveryFee: typeof data.deskDeliveryFee === "number" ? data.deskDeliveryFee : 0,
              isActive: data.isActive !== undefined ? data.isActive : true,
              municipalities: Array.isArray(data.municipalities) ? data.municipalities : [],
              updatedAt: data.updatedAt,
            };
          });

          // Sort by numerical code
          docsList.sort((a, b) => parseInt(a.code, 10) - parseInt(b.code, 10));
          setZones(docsList);
          setLoading(false);
          setFetchError(null);
        },
        (error) => {
          console.error("Error listening to shipping_zones:", error);
          setFetchError("تعذر جلب بيانات التوصيل من قاعدة البيانات. يرجى التحقق من الاتصال أو الصلاحيات.");
          showToast("خطأ في جلب بيانات التوصيل", "error");
          setLoading(false);
        }
      );
    } catch (err) {
      console.error("Setup error for shipping_zones listener:", err);
      setFetchError("حدث خطأ غير متوقع أثناء إعداد الاتصال بقاعدة البيانات.");
      setLoading(false);
    }

    return () => unsubscribe();
  }, []);

  // Quick Stats
  const stats = useMemo(() => {
    const total = zones.length;
    const active = zones.filter((z) => z.isActive).length;
    const activeZones = zones.filter((z) => z.isActive);
    const avgHome = activeZones.length > 0 
      ? Math.round(activeZones.reduce((acc, z) => acc + z.homeDeliveryFee, 0) / activeZones.length)
      : 0;
    const avgDesk = activeZones.length > 0 
      ? Math.round(activeZones.reduce((acc, z) => acc + z.deskDeliveryFee, 0) / activeZones.length)
      : 0;

    return { total, active, avgHome, avgDesk };
  }, [zones]);

  // Filtered List
  const filteredZones = useMemo(() => {
    return zones.filter((z) => {
      const matchSearch = 
        z.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        z.nameAr.toLowerCase().includes(searchQuery.toLowerCase()) ||
        z.nameFr.toLowerCase().includes(searchQuery.toLowerCase());
      
      if (statusFilter === "active") return matchSearch && z.isActive;
      if (statusFilter === "inactive") return matchSearch && !z.isActive;
      return matchSearch;
    });
  }, [zones, searchQuery, statusFilter]);

  // Toggle Active Switch Inline
  const handleToggleActive = async (zone: IShippingZone) => {
    try {
      const zoneRef = doc(db, "shipping_zones", zone.code);
      await updateDoc(zoneRef, {
        isActive: !zone.isActive,
        updatedAt: serverTimestamp(),
      });
      showToast(
        !zone.isActive 
          ? `تم تفعيل التوصيل لولاية ${zone.nameAr}` 
          : `تم تعطيل التوصيل لولاية ${zone.nameAr}`
      );
    } catch (err) {
      console.error("Error toggling active status:", err);
      showToast("حدث خطأ أثناء تغيير حالة التوصيل", "error");
    }
  };

  // Open Modal for Create or Edit
  const openWilayaModal = (zone?: IShippingZone) => {
    if (zone) {
      setEditingZone(zone);
      setFormData({
        code: zone.code,
        nameAr: zone.nameAr,
        nameFr: zone.nameFr,
        homeDeliveryFee: zone.homeDeliveryFee,
        deskDeliveryFee: zone.deskDeliveryFee,
        isActive: zone.isActive,
      });
    } else {
      setEditingZone(null);
      // Auto suggest next code
      const nextCodeNum = zones.length > 0 ? Math.max(...zones.map(z => parseInt(z.code, 10) || 0)) + 1 : 1;
      const formattedCode = nextCodeNum < 10 ? `0${nextCodeNum}` : `${nextCodeNum}`;
      setFormData({
        code: formattedCode,
        nameAr: "",
        nameFr: "",
        homeDeliveryFee: 600,
        deskDeliveryFee: 350,
        isActive: true,
      });
    }
    setIsWilayaModalOpen(true);
  };

  // Save Wilaya
  const handleSaveWilaya = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.code.trim() || !formData.nameAr.trim()) {
      showToast("يرجى ملء كافة الحقول الأساسية", "error");
      return;
    }

    setFormLoading(true);
    try {
      const codeClean = formData.code.trim().padStart(2, "0");
      const docRef = doc(db, "shipping_zones", codeClean);

      const payload = {
        code: codeClean,
        nameAr: formData.nameAr.trim(),
        nameFr: formData.nameFr.trim(),
        homeDeliveryFee: Number(formData.homeDeliveryFee) || 0,
        deskDeliveryFee: Number(formData.deskDeliveryFee) || 0,
        isActive: formData.isActive,
        updatedAt: serverTimestamp(),
      };

      if (editingZone) {
        await updateDoc(docRef, payload);
        showToast(`تم تحديث ولاية ${formData.nameAr} بنجاح`);
      } else {
        // Create new
        await setDoc(docRef, {
          ...payload,
          municipalities: [],
        }, { merge: true });
        showToast(`تمت إضافة ولاية ${formData.nameAr} بنجاح`);
      }

      setIsWilayaModalOpen(false);
    } catch (err) {
      console.error("Error saving wilaya:", err);
      showToast("حدث خطأ أثناء حفظ الولاية", "error");
    } finally {
      setFormLoading(false);
    }
  };

  // Delete Wilaya
  const handleDeleteWilaya = async () => {
    if (!deleteTarget) return;
    try {
      await deleteDoc(doc(db, "shipping_zones", deleteTarget.code));
      showToast(`تم حذف ولاية ${deleteTarget.nameAr} بنجاح`);
      setDeleteTarget(null);
    } catch (err) {
      console.error("Error deleting wilaya:", err);
      showToast("حدث خطأ أثناء حذف الولاية", "error");
    }
  };

  // Open Municipalities Drawer
  const openMunicipalitiesModal = (zone: IShippingZone) => {
    setSelectedZoneForMuni(zone);
    setMunicipalitiesList(zone.municipalities || []);
    setNewMuniInput("");
  };

  // Add Municipality Chip
  const handleAddMunicipality = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = newMuniInput.trim();
    if (!trimmed) return;
    if (municipalitiesList.includes(trimmed)) {
      showToast("هذه البلدية مضافة بالفعل", "error");
      return;
    }
    setMunicipalitiesList((prev) => [...prev, trimmed]);
    setNewMuniInput("");
  };

  // Delete Municipality Chip
  const handleRemoveMunicipality = (name: string) => {
    setMunicipalitiesList((prev) => prev.filter((item) => item !== name));
  };

  // Save Municipalities Array to Firestore
  const handleSaveMunicipalities = async () => {
    if (!selectedZoneForMuni) return;
    setMuniLoading(true);
    try {
      const docRef = doc(db, "shipping_zones", selectedZoneForMuni.code);
      await updateDoc(docRef, {
        municipalities: municipalitiesList,
        updatedAt: serverTimestamp(),
      });
      showToast(`تم تحديث بلديات ولاية ${selectedZoneForMuni.nameAr} بنجاح`);
      setSelectedZoneForMuni(null);
    } catch (err) {
      console.error("Error saving municipalities:", err);
      showToast("حدث خطأ أثناء حفظ البلديات", "error");
    } finally {
      setMuniLoading(false);
    }
  };

  // Seed sample data if Firestore table is empty
  const handleSeedDefaultWilayas = async () => {
    setIsSeeding(true);
    try {
      const batch = writeBatch(db);
      SAMPLE_WILAYAS.forEach((w) => {
        if (w.code) {
          const docRef = doc(db, "shipping_zones", w.code);
          batch.set(docRef, {
            code: w.code,
            nameAr: w.nameAr,
            nameFr: w.nameFr,
            homeDeliveryFee: w.homeDeliveryFee,
            deskDeliveryFee: w.deskDeliveryFee,
            isActive: w.isActive ?? true,
            municipalities: w.municipalities || [],
            updatedAt: serverTimestamp(),
          }, { merge: true });
        }
      });
      await batch.commit();
      showToast("تم استيراد الولايات والبلديات الافتراضية بنجاح");
    } catch (err) {
      console.error("Error seeding default wilayas:", err);
      showToast("حدث خطأ أثناء استيراد البيانات الافتراضية", "error");
    } finally {
      setIsSeeding(false);
    }
  };

  return (
    <div className="space-y-6 select-none" dir="rtl">
      
      {/* Toast Notification */}
      {toast && (
        <div 
          className={`fixed top-5 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-5 py-3 rounded-xl shadow-2xl border text-sm font-semibold transition-all transform animate-bounce ${
            toast.type === "success" 
              ? "bg-emerald-950/90 text-emerald-300 border-emerald-500/40" 
              : "bg-red-950/90 text-red-300 border-red-500/40"
          }`}
        >
          {toast.type === "success" ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
          )}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Header & Title Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-md-outline/10">
        <div>
          <h1 className="text-2xl font-black text-md-surface-on flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-md-primary-container text-md-primary-on-container">
              <Truck className="w-6 h-6" />
            </div>
            <span>إدارة أسعار ومناطق التوصيل (Shipping Management)</span>
          </h1>
          <p className="text-xs text-md-surface-on-variant mt-1">
            تعديل وتحديد تكاليف التوصيل للمنزل والمكتب والبلديات لكافة الولايات الجزائرية
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {zones.length === 0 && !loading && !fetchError && (
            <button
              onClick={handleSeedDefaultWilayas}
              disabled={isSeeding}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30 hover:bg-amber-500/20 text-xs font-bold transition-all disabled:opacity-50"
            >
              {isSeeding ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              <span>استيراد الولايات الافتراضية</span>
            </button>
          )}

          <button
            onClick={() => openWilayaModal()}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-md-primary text-md-primary-on font-bold hover:opacity-95 transition-all shadow-md active:scale-95 text-xs"
          >
            <Plus className="w-4 h-4" />
            <span>إضافة ولاية جديدة</span>
          </button>
        </div>
      </div>

      {/* Fetch Error State Banner */}
      {fetchError && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-5 text-red-600 dark:text-red-400 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-6 h-6 shrink-0" />
            <span className="text-xs font-bold">{fetchError}</span>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="px-3.5 py-1.5 rounded-xl bg-red-600 text-white text-xs font-bold hover:bg-red-700 transition-colors shrink-0"
          >
            إعادة المحاولة
          </button>
        </div>
      )}

      {/* Statistics Cards Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Total Wilayas */}
        <div className="bg-md-surface dark:bg-[#1C1B1F] p-5 rounded-2xl border border-md-outline/10 flex flex-col justify-between">
          <div className="flex items-center justify-between text-md-surface-on-variant text-xs font-medium">
            <span>إجمالي الولايات</span>
            <MapPin className="w-4 h-4 text-orange-500" />
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-md-surface-on">{stats.total}</span>
            <span className="text-xs text-md-surface-on-variant font-normal mr-1">ولاية</span>
          </div>
        </div>

        {/* Active Wilayas */}
        <div className="bg-md-surface dark:bg-[#1C1B1F] p-5 rounded-2xl border border-md-outline/10 flex flex-col justify-between">
          <div className="flex items-center justify-between text-md-surface-on-variant text-xs font-medium">
            <span>الولايات المفعّلة</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{stats.active}</span>
            <span className="text-xs text-md-surface-on-variant">من أصل {stats.total}</span>
          </div>
        </div>

        {/* Avg Home Delivery Fee */}
        <div className="bg-md-surface dark:bg-[#1C1B1F] p-5 rounded-2xl border border-md-outline/10 flex flex-col justify-between">
          <div className="flex items-center justify-between text-md-surface-on-variant text-xs font-medium">
            <span>متوسط التوصيل للمنزل</span>
            <Home className="w-4 h-4 text-blue-500" />
          </div>
          <div className="mt-3">
            <span className="text-xl lg:text-2xl font-black text-md-surface-on">
              {formatCurrency(stats.avgHome)}
            </span>
          </div>
        </div>

        {/* Avg Desk Delivery Fee */}
        <div className="bg-md-surface dark:bg-[#1C1B1F] p-5 rounded-2xl border border-md-outline/10 flex flex-col justify-between">
          <div className="flex items-center justify-between text-md-surface-on-variant text-xs font-medium">
            <span>متوسط التوصيل للمكتب</span>
            <Building2 className="w-4 h-4 text-purple-500" />
          </div>
          <div className="mt-3">
            <span className="text-xl lg:text-2xl font-black text-md-surface-on">
              {formatCurrency(stats.avgDesk)}
            </span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-md-surface dark:bg-[#1C1B1F] p-4 rounded-2xl border border-md-outline/10 flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Search Field */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 text-md-surface-on-variant" />
          <input
            type="text"
            placeholder="البحث باسم الولاية أو الكود..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-4 pr-10 py-2 bg-md-surface-container-low dark:bg-[#121212] border border-md-outline/10 rounded-xl text-xs font-semibold text-md-surface-on placeholder-md-surface-on-variant focus:outline-none focus:border-md-primary transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-md-surface-on-variant hover:text-md-surface-on"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1 bg-md-surface-container-low dark:bg-[#121212] p-1 rounded-xl border border-md-outline/10 w-full sm:w-auto">
          <button
            onClick={() => setStatusFilter("all")}
            className={`flex-1 sm:flex-none px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              statusFilter === "all"
                ? "bg-md-primary text-md-primary-on shadow-sm"
                : "text-md-surface-on-variant hover:text-md-surface-on"
            }`}
          >
            الكل ({zones.length})
          </button>
          <button
            onClick={() => setStatusFilter("active")}
            className={`flex-1 sm:flex-none px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              statusFilter === "active"
                ? "bg-emerald-600 text-white shadow-sm"
                : "text-md-surface-on-variant hover:text-md-surface-on"
            }`}
          >
            المفعّلة ({zones.filter(z => z.isActive).length})
          </button>
          <button
            onClick={() => setStatusFilter("inactive")}
            className={`flex-1 sm:flex-none px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              statusFilter === "inactive"
                ? "bg-red-600 text-white shadow-sm"
                : "text-md-surface-on-variant hover:text-md-surface-on"
            }`}
          >
            المعطّلة ({zones.filter(z => !z.isActive).length})
          </button>
        </div>
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="bg-md-surface dark:bg-[#1C1B1F] rounded-2xl border border-md-outline/10 p-12 flex flex-col items-center justify-center space-y-4">
          <Loader2 className="w-8 h-8 text-md-primary animate-spin" />
          <p className="text-md-surface-on-variant text-xs font-medium">جاري تحميل مناطق التوصيل...</p>
        </div>
      ) : filteredZones.length === 0 ? (
        /* Empty State */
        <div className="bg-md-surface dark:bg-[#1C1B1F] rounded-2xl border border-md-outline/10 p-12 text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-md-surface-container-high flex items-center justify-center mx-auto text-md-surface-on-variant">
            <Truck className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-md-surface-on">لم يتم العثور على أي ولاية</h3>
          <p className="text-md-surface-on-variant text-xs max-w-md mx-auto">
            {searchQuery
              ? "لا توجد نتائج تطابق بحثك. جرب كتابة اسم آخر أو مسح حقل البحث."
              : "قائمة التوصيل فارغة حالياً. يمكنك إضافة ولاية جديدة أو استيراد القائمة الافتراضية."}
          </p>
          {zones.length === 0 && !fetchError && (
            <button
              onClick={handleSeedDefaultWilayas}
              disabled={isSeeding}
              className="mt-2 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-md-primary text-md-primary-on text-xs font-bold hover:opacity-95 transition-all"
            >
              {isSeeding ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              <span>استيراد الولايات الجزائرية (58 ولاية)</span>
            </button>
          )}
        </div>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="hidden lg:block bg-md-surface dark:bg-[#1C1B1F] rounded-2xl border border-md-outline/10 overflow-hidden shadow-sm">
            <table className="w-full text-right border-collapse text-xs">
              <thead>
                <tr className="bg-md-surface-container-low dark:bg-[#161519] border-b border-md-outline/10 text-md-surface-on-variant font-bold">
                  <th className="p-4 text-center">كود</th>
                  <th className="p-4">اسم الولاية</th>
                  <th className="p-4 text-center">التوصيل للمنزل</th>
                  <th className="p-4 text-center">التوصيل للمكتب</th>
                  <th className="p-4 text-center">البلديات المتاحة</th>
                  <th className="p-4 text-center">الحالة</th>
                  <th className="p-4 text-center">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-md-outline/10">
                {filteredZones.map((zone) => (
                  <tr 
                    key={zone.code} 
                    className="hover:bg-md-surface-container-high/50 transition-colors"
                  >
                    {/* Code Badge */}
                    <td className="p-4 text-center">
                      <span className="inline-block px-2.5 py-1 bg-md-surface-container-high rounded-lg text-xs font-mono font-black text-orange-500 border border-md-outline/10">
                        {zone.code}
                      </span>
                    </td>

                    {/* Wilaya Name */}
                    <td className="p-4 font-bold text-md-surface-on">
                      <div className="flex items-center gap-2">
                        <span>{zone.nameAr}</span>
                        {zone.nameFr && (
                          <span className="text-[11px] text-md-surface-on-variant font-normal dir-ltr">
                            ({zone.nameFr})
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Home Price */}
                    <td className="p-4 text-center">
                      <span className="text-emerald-600 dark:text-emerald-400 font-extrabold">
                        {formatCurrency(zone.homeDeliveryFee)}
                      </span>
                    </td>

                    {/* Desk Price */}
                    <td className="p-4 text-center">
                      <span className="text-purple-600 dark:text-purple-400 font-extrabold">
                        {formatCurrency(zone.deskDeliveryFee)}
                      </span>
                    </td>

                    {/* Municipalities */}
                    <td className="p-4 text-center">
                      <button
                        onClick={() => openMunicipalitiesModal(zone)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 hover:bg-blue-500/20 transition-all text-xs font-bold"
                      >
                        <Building2 className="w-3.5 h-3.5" />
                        <span>{zone.municipalities.length} بلديات</span>
                      </button>
                    </td>

                    {/* Active Toggle Switch */}
                    <td className="p-4 text-center">
                      <button
                        onClick={() => handleToggleActive(zone)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                          zone.isActive ? "bg-emerald-600" : "bg-gray-400 dark:bg-gray-700"
                        }`}
                        title={zone.isActive ? "تعطيل التوصيل" : "تفعيل التوصيل"}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            zone.isActive ? "-translate-x-6" : "-translate-x-1"
                          }`}
                        />
                      </button>
                    </td>

                    {/* Actions */}
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        {/* Manage Municipalities */}
                        <button
                          onClick={() => openMunicipalitiesModal(zone)}
                          className="p-2 rounded-lg bg-md-surface-container-high hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 transition-colors"
                          title="إدارة البلديات"
                        >
                          <SlidersHorizontal className="w-4 h-4" />
                        </button>

                        {/* Edit */}
                        <button
                          onClick={() => openWilayaModal(zone)}
                          className="p-2 rounded-lg bg-md-surface-container-high hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 transition-colors"
                          title="تعديل الولاية"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>

                        {/* Delete */}
                        <button
                          onClick={() => setDeleteTarget(zone)}
                          className="p-2 rounded-lg bg-md-surface-container-high hover:bg-red-500/20 text-red-600 dark:text-red-400 transition-colors"
                          title="حذف الولاية"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card Layout */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:hidden gap-4">
            {filteredZones.map((zone) => (
              <div
                key={zone.code}
                className="bg-md-surface dark:bg-[#1C1B1F] p-5 rounded-2xl border border-md-outline/10 space-y-4 shadow-sm"
              >
                <div className="flex items-center justify-between border-b border-md-outline/10 pb-3">
                  <div className="flex items-center gap-3">
                    <span className="px-2.5 py-1 bg-md-surface-container-high rounded-lg text-xs font-mono font-black text-orange-500 border border-md-outline/10">
                      {zone.code}
                    </span>
                    <div>
                      <h3 className="font-bold text-md-surface-on text-sm">{zone.nameAr}</h3>
                      {zone.nameFr && <p className="text-[11px] text-md-surface-on-variant dir-ltr">{zone.nameFr}</p>}
                    </div>
                  </div>

                  {/* Toggle Switch */}
                  <button
                    onClick={() => handleToggleActive(zone)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                      zone.isActive ? "bg-emerald-600" : "bg-gray-400 dark:bg-gray-700"
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        zone.isActive ? "-translate-x-6" : "-translate-x-1"
                      }`}
                    />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="bg-md-surface-container-low dark:bg-[#121212] p-3 rounded-xl border border-md-outline/10">
                    <div className="text-md-surface-on-variant flex items-center gap-1 mb-1">
                      <Home className="w-3.5 h-3.5 text-blue-500" />
                      <span>للمنزل</span>
                    </div>
                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                      {formatCurrency(zone.homeDeliveryFee)}
                    </span>
                  </div>

                  <div className="bg-md-surface-container-low dark:bg-[#121212] p-3 rounded-xl border border-md-outline/10">
                    <div className="text-md-surface-on-variant flex items-center gap-1 mb-1">
                      <Building2 className="w-3.5 h-3.5 text-purple-500" />
                      <span>للمكتب</span>
                    </div>
                    <span className="text-xs font-bold text-purple-600 dark:text-purple-400">
                      {formatCurrency(zone.deskDeliveryFee)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-md-outline/10">
                  <button
                    onClick={() => openMunicipalitiesModal(zone)}
                    className="flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400 font-bold hover:underline"
                  >
                    <Building2 className="w-3.5 h-3.5" />
                    <span>{zone.municipalities.length} بلديات مضافة</span>
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => openWilayaModal(zone)}
                      className="p-2 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setDeleteTarget(zone)}
                      className="p-2 rounded-lg bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-500/20"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* ================= ADD / EDIT WILAYA MODAL ================= */}
      {isWilayaModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-md-surface dark:bg-[#1C1B1F] border border-md-outline/20 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-md-outline/10">
              <h2 className="text-base font-bold text-md-surface-on flex items-center gap-2">
                <Truck className="w-5 h-5 text-md-primary" />
                <span>{editingZone ? `تعديل ولاية ${editingZone.nameAr}` : "إضافة ولاية جديدة"}</span>
              </h2>
              <button
                onClick={() => setIsWilayaModalOpen(false)}
                className="text-md-surface-on-variant hover:text-md-surface-on p-1 rounded-lg hover:bg-md-surface-container-high"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveWilaya} className="p-5 space-y-4">
              <div className="grid grid-cols-3 gap-3">
                {/* Code */}
                <div>
                  <label className="block text-xs font-bold text-md-surface-on mb-1.5">
                    رقم الولاية *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="16"
                    value={formData.code}
                    disabled={!!editingZone}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    className="w-full px-3 py-2 bg-md-surface-container-low dark:bg-[#121212] border border-md-outline/10 rounded-xl text-xs font-mono font-bold text-md-surface-on focus:outline-none focus:border-md-primary text-center disabled:opacity-50"
                  />
                </div>

                {/* Name Ar */}
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-md-surface-on mb-1.5">
                    الاسم بالعربية *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="الجزائر"
                    value={formData.nameAr}
                    onChange={(e) => setFormData({ ...formData, nameAr: e.target.value })}
                    className="w-full px-3 py-2 bg-md-surface-container-low dark:bg-[#121212] border border-md-outline/10 rounded-xl text-xs font-semibold text-md-surface-on focus:outline-none focus:border-md-primary"
                  />
                </div>
              </div>

              {/* Name Fr */}
              <div>
                <label className="block text-xs font-bold text-md-surface-on mb-1.5">
                  الاسم باللاتينية (الفرنسية)
                </label>
                <input
                  type="text"
                  placeholder="Alger"
                  value={formData.nameFr}
                  onChange={(e) => setFormData({ ...formData, nameFr: e.target.value })}
                  className="w-full px-3 py-2 bg-md-surface-container-low dark:bg-[#121212] border border-md-outline/10 rounded-xl text-xs font-semibold text-md-surface-on focus:outline-none focus:border-md-primary dir-ltr text-right"
                />
              </div>

              {/* Shipping Prices */}
              <div className="grid grid-cols-2 gap-4">
                {/* Home Delivery Fee */}
                <div>
                  <label className="block text-xs font-bold text-md-surface-on mb-1.5">
                    سعر التوصيل للمنزل (د.ج) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="50"
                    required
                    value={formData.homeDeliveryFee}
                    onChange={(e) => setFormData({ ...formData, homeDeliveryFee: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-md-surface-container-low dark:bg-[#121212] border border-md-outline/10 rounded-xl text-xs font-black text-emerald-600 dark:text-emerald-400 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                {/* Desk Delivery Fee */}
                <div>
                  <label className="block text-xs font-bold text-md-surface-on mb-1.5">
                    سعر التوصيل للمكتب (د.ج) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="50"
                    required
                    value={formData.deskDeliveryFee}
                    onChange={(e) => setFormData({ ...formData, deskDeliveryFee: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-md-surface-container-low dark:bg-[#121212] border border-md-outline/10 rounded-xl text-xs font-black text-purple-600 dark:text-purple-400 focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              {/* Active Toggle Switch */}
              <div className="flex items-center justify-between p-3 bg-md-surface-container-low dark:bg-[#121212] rounded-xl border border-md-outline/10">
                <div>
                  <span className="text-xs font-bold text-md-surface-on">تفعيل التوصيل للولاية</span>
                  <p className="text-[11px] text-md-surface-on-variant">إتاحة خيار التوصيل لهذه الولاية في المتجر</p>
                </div>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, isActive: !formData.isActive })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    formData.isActive ? "bg-emerald-600" : "bg-gray-400 dark:bg-gray-700"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      formData.isActive ? "-translate-x-6" : "-translate-x-1"
                    }`}
                  />
                </button>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-md-outline/10">
                <button
                  type="button"
                  onClick={() => setIsWilayaModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-md-surface-on-variant hover:text-md-surface-on hover:bg-md-surface-container-high transition-all"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-md-primary text-md-primary-on font-bold hover:opacity-95 transition-all disabled:opacity-50 text-xs shadow-md"
                >
                  {formLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>{editingZone ? "حفظ التغييرات" : "إضافة الولاية"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MUNICIPALITIES MANAGEMENT DRAWER / MODAL ================= */}
      {selectedZoneForMuni && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-md-surface dark:bg-[#1C1B1F] border border-md-outline/20 rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-md-outline/10">
              <div>
                <h2 className="text-base font-bold text-md-surface-on flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-blue-500" />
                  <span>بلديات ولاية {selectedZoneForMuni.nameAr} ({selectedZoneForMuni.code})</span>
                </h2>
                <p className="text-xs text-md-surface-on-variant mt-0.5">
                  إدارة البلديات المتاحة للتوصيل في هذه الولاية
                </p>
              </div>
              <button
                onClick={() => setSelectedZoneForMuni(null)}
                className="text-md-surface-on-variant hover:text-md-surface-on p-1 rounded-lg hover:bg-md-surface-container-high"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-5 space-y-4 overflow-y-auto flex-1">
              {/* Add New Municipality Input */}
              <form onSubmit={handleAddMunicipality} className="flex gap-2">
                <input
                  type="text"
                  placeholder="أكتب اسم بلدية جديدة واضغط Enter..."
                  value={newMuniInput}
                  onChange={(e) => setNewMuniInput(e.target.value)}
                  className="flex-1 px-4 py-2 bg-md-surface-container-low dark:bg-[#121212] border border-md-outline/10 rounded-xl text-xs font-semibold text-md-surface-on placeholder-md-surface-on-variant focus:outline-none focus:border-blue-500"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-500 transition-all flex items-center gap-1 shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  <span>إضافة</span>
                </button>
              </form>

              {/* Tag Chips List */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-md-surface-on-variant">
                  <span>البلديات المضافة ({municipalitiesList.length})</span>
                  {municipalitiesList.length > 0 && (
                    <button
                      onClick={() => setMunicipalitiesList([])}
                      className="text-red-500 hover:underline text-xs font-bold"
                    >
                      مسح الكل
                    </button>
                  )}
                </div>

                {municipalitiesList.length === 0 ? (
                  <div className="p-8 text-center bg-md-surface-container-low dark:bg-[#121212] rounded-xl border border-md-outline/10 text-md-surface-on-variant text-xs">
                    لا توجد أي بلدية مضافة لهذه الولاية بعد. أضف بلديات جديدة أعلاه.
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2 max-h-64 overflow-y-auto p-3 bg-md-surface-container-low dark:bg-[#121212] rounded-xl border border-md-outline/10">
                    {municipalitiesList.map((muni, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-300 border border-blue-500/20 text-xs font-bold group hover:bg-blue-500/20 transition-all"
                      >
                        <span>{muni}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveMunicipality(muni)}
                          className="text-blue-500/70 hover:text-red-500 transition-colors p-0.5"
                          title="حذف"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between p-4 border-t border-md-outline/10 bg-md-surface-container-low dark:bg-[#161519]">
              <span className="text-xs text-md-surface-on-variant">
                إجمالي البلديات: <strong className="text-md-surface-on">{municipalitiesList.length}</strong>
              </span>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedZoneForMuni(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-md-surface-on-variant hover:text-md-surface-on"
                >
                  إلغاء
                </button>
                <button
                  type="button"
                  onClick={handleSaveMunicipalities}
                  disabled={muniLoading}
                  className="flex items-center gap-2 px-5 py-2 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-500 transition-all text-xs disabled:opacity-50"
                >
                  {muniLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>حفظ البلديات</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= DELETE CONFIRMATION MODAL ================= */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-md-surface dark:bg-[#1C1B1F] border border-md-outline/20 rounded-2xl w-full max-w-md p-6 space-y-4 text-center shadow-2xl">
            <div className="w-14 h-14 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center mx-auto border border-red-500/20">
              <Trash2 className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-md-surface-on">تأكيد حذف الولاية</h3>
            <p className="text-md-surface-on-variant text-xs">
              هل أنت تأكد من رغبتك في حذف ولاية <strong className="text-md-surface-on">{deleteTarget.nameAr} ({deleteTarget.code})</strong>؟ سيتم إلغاء أسعار التوصيل والبلديات التابعة لها.
            </p>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={() => setDeleteTarget(null)}
                className="px-5 py-2 rounded-xl text-xs font-bold text-md-surface-on-variant hover:text-md-surface-on bg-md-surface-container-high transition-all"
              >
                إلغاء
              </button>
              <button
                onClick={handleDeleteWilaya}
                className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-red-600 hover:bg-red-500 transition-all shadow-md"
              >
                تأكيد الحذف
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
