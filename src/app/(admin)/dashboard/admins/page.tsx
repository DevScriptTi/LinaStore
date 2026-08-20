"use client";

import React, { useState, useEffect, useCallback } from "react";
import { auth, db } from "@/lib/firebase/config";
import { onAuthStateChanged } from "firebase/auth";
import { collection, query, onSnapshot, addDoc, serverTimestamp, deleteDoc, doc, updateDoc, where, getDocs, getDoc } from "firebase/firestore";
import { Key, Plus, Copy, Check, ShieldCheck, UserCheck, Loader2, Trash2, ShieldAlert, Users, Crown } from "lucide-react";

interface IAdminKey {
  id?: string;
  key: string;
  isUsed: boolean;
  usedBy?: string;
  createdAt?: any;
}

interface IRegisteredAdmin {
  id?: string;
  uid?: string;
  name: string;
  email: string;
  role: "super_admin" | "admin";
  createdAt?: any;
}

export default function AdminsManagementPage() {
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const [keysList, setKeysList] = useState<IAdminKey[]>([]);
  const [registeredAdmins, setRegisteredAdmins] = useState<IRegisteredAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [updatingRoleId, setUpdatingRoleId] = useState<string | null>(null);

  // 1. Page-Level Strict RBAC Authorization Check
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setIsAuthorized(false);
        return;
      }

      // Master default super_admin email fallback
      if (user.email === "admin@linastore.com") {
        setIsAuthorized(true);
        return;
      }

      try {
        // Direct document lookup in admins collection using user.uid
        const adminDocRef = doc(db, "admins", user.uid);
        const adminDocSnap = await getDoc(adminDocRef);

        if (adminDocSnap.exists() && adminDocSnap.data().role === "super_admin") {
          setIsAuthorized(true);
          return;
        }

        // Secondary query check by UID or Email
        const qUser = query(collection(db, "admins"), where("uid", "==", user.uid));
        const userSnap = await getDocs(qUser);

        if (!userSnap.empty && userSnap.docs[0].data().role === "super_admin") {
          setIsAuthorized(true);
        } else {
          setIsAuthorized(false);
        }
      } catch (err) {
        console.error("RBAC role verification error:", err);
        setIsAuthorized(false);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  // 2. Fetch Keys & Admins data ONLY if authorized
  const fetchAdminData = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch Keys
      const keysQuery = await getDocs(collection(db, "admin_keys"));
      const keys: IAdminKey[] = keysQuery.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as Omit<IAdminKey, "id">),
      }));
      setKeysList(keys);

      // Fetch Registered Admins
      const adminsQuery = await getDocs(collection(db, "admins"));
      const admins: IRegisteredAdmin[] = adminsQuery.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as Omit<IRegisteredAdmin, "id">),
      }));
      setRegisteredAdmins(admins);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Subscribe to real-time changes ONLY when isAuthorized === true
  useEffect(() => {
    if (isAuthorized !== true) return;

    fetchAdminData();

    const unsubscribeKeys = onSnapshot(
      collection(db, "admin_keys"),
      (snapshot) => {
        const keys: IAdminKey[] = snapshot.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<IAdminKey, "id">),
        }));
        setKeysList(keys);
        setLoading(false);
      },
      (err) => {
        console.warn("Keys onSnapshot error:", err);
        setLoading(false);
      }
    );

    const unsubscribeAdmins = onSnapshot(
      collection(db, "admins"),
      (snapshot) => {
        const admins: IRegisteredAdmin[] = snapshot.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<IRegisteredAdmin, "id">),
        }));
        setRegisteredAdmins(admins);
      },
      (err) => {
        console.warn("Admins onSnapshot error:", err);
      }
    );

    return () => {
      unsubscribeKeys();
      unsubscribeAdmins();
    };
  }, [isAuthorized, fetchAdminData]);

  // Generate 12-character Random Key (LINA-XXXXXXXX)
  const generateRandomKey = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let randomPart = "";
    for (let i = 0; i < 8; i++) {
      randomPart += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return `LINA-${randomPart}`;
  };

  const handleGenerateKey = async () => {
    setGenerating(true);
    try {
      const newKey = generateRandomKey();
      await addDoc(collection(db, "admin_keys"), {
        key: newKey,
        isUsed: false,
        createdAt: serverTimestamp(),
      });
      fetchAdminData();
    } catch (err) {
      console.error("Error generating admin key:", err);
    } finally {
      setGenerating(false);
    }
  };

  const handleCopyKey = (keyText: string, id: string) => {
    navigator.clipboard.writeText(keyText);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDeleteKey = async (id: string) => {
    if (confirm("هل أنت تأكد من رغبتك في حذف مفتاح الدعوة هذا؟")) {
      try {
        await deleteDoc(doc(db, "admin_keys", id));
        fetchAdminData();
      } catch (err) {
        console.error("Delete key error:", err);
      }
    }
  };

  const handleRoleChange = async (adminId: string, newRole: "super_admin" | "admin") => {
    setUpdatingRoleId(adminId);
    try {
      await updateDoc(doc(db, "admins", adminId), { role: newRole });
      fetchAdminData();
    } catch (err) {
      console.error("Error updating admin role:", err);
      alert("حدث خطأ أثناء تعديل صلاحيات المسؤول.");
    } finally {
      setUpdatingRoleId(null);
    }
  };

  const handleDeleteAdmin = async (adminId: string, adminName: string) => {
    if (confirm(`هل أنت تأكد من رغبتك في إلغاء صلاحيات المسؤول (${adminName}) وحذف حسابه من اللوحة؟`)) {
      try {
        await deleteDoc(doc(db, "admins", adminId));
        fetchAdminData();
      } catch (err) {
        console.error("Error deleting admin document:", err);
        alert("حدث خطأ أثناء حذف المسؤول.");
      }
    }
  };

  const formatDate = (dateVal: any) => {
    if (!dateVal) return "الآن";
    let d: Date;
    if (dateVal?.toDate) d = dateVal.toDate();
    else d = new Date(dateVal);
    if (isNaN(d.getTime())) return "قبل قليل";
    return d.toLocaleDateString("ar-DZ", { year: "numeric", month: "short", day: "numeric" });
  };

  // 1. Loading State while verifying authorization
  if (isAuthorized === null) {
    return (
      <div className="p-20 text-center space-y-4 select-none" dir="rtl">
        <Loader2 className="w-10 h-10 mx-auto text-orange-600 animate-spin" />
        <p className="text-xs font-semibold text-md-surface-on-variant">جاري التحقق من صلاحيات الوصول إلى إدارة المسؤولين...</p>
      </div>
    );
  }

  // 2. Full-Screen / Centered 403 Forbidden Warning State for Unauthorized Admins
  if (isAuthorized === false) {
    return (
      <div className="max-w-md mx-auto my-16 p-8 rounded-3xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 text-center space-y-4 shadow-xl select-none" dir="rtl">
        <div className="w-16 h-16 mx-auto rounded-full bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-400 flex items-center justify-center">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-black text-red-700 dark:text-red-400">403 - غير مصرح</h2>
          <p className="text-xs text-red-600 dark:text-red-300 leading-relaxed font-semibold">
            لا تملك صلاحيات المدير العام (Super Admin) للوصول إلى هذه الصفحة.
          </p>
        </div>
      </div>
    );
  }

  // 3. Authorized View: Render Management Tables
  return (
    <div className="space-y-10 select-none" dir="rtl">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-md-outline/10">
        <div>
          <h1 className="text-2xl font-black text-md-surface-on flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-orange-100 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400">
              <Crown className="w-6 h-6" />
            </div>
            <span>إدارة المسؤولين ومفاتيح الدعوة (Super Admin Access)</span>
          </h1>
          <p className="text-xs text-md-surface-on-variant mt-1">
            أنشئ مفاتيح دعوة مشفرة وقم بتعديل صلاحيات الأدوار وإلغاء وصول المسؤولين المسجلين
          </p>
        </div>

        <button
          type="button"
          onClick={handleGenerateKey}
          disabled={generating}
          className="px-5 py-2.5 rounded-full bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs shadow-md active:scale-98 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {generating ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>جاري التوليد...</span>
            </>
          ) : (
            <>
              <Plus className="w-4 h-4" />
              <span>توليد مفتاح مسؤول جديد 🔑</span>
            </>
          )}
        </button>
      </div>

      {/* SECTION 1: Invitation Keys Table */}
      <div className="space-y-4">
        <h2 className="text-lg font-extrabold text-md-surface-on flex items-center gap-2">
          <Key className="w-5 h-5 text-orange-600 dark:text-orange-400" />
          <span>مفاتيح الدعوة المتاحة والمستعملة (Invitation Keys)</span>
        </h2>

        <div className="rounded-3xl bg-md-surface border border-md-outline/10 shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-16 text-center space-y-4">
              <Loader2 className="w-10 h-10 mx-auto text-orange-600 animate-spin" />
              <p className="text-xs font-semibold text-md-surface-on-variant">جاري تحميل المفاتيح من Firestore...</p>
            </div>
          ) : keysList.length === 0 ? (
            <div className="p-16 text-center space-y-4">
              <Key className="w-12 h-12 mx-auto text-orange-500 opacity-50" />
              <p className="text-sm font-bold text-md-surface-on">لا توجد مفاتيح دعوة حالياً.</p>
              <p className="text-xs text-md-surface-on-variant">اضغط على زر "توليد مفتاح مسؤول جديد" لإنشاء أول مفتاح دعوة.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-md-surface-container-low border-b border-md-outline/10 text-md-surface-on-variant font-bold">
                  <tr>
                    <th className="px-5 py-3.5">مفتاح الدعوة (12 حرفاً)</th>
                    <th className="px-5 py-3.5">الحالة</th>
                    <th className="px-5 py-3.5">المستخدم بواسطة</th>
                    <th className="px-5 py-3.5">تاريخ التوليد</th>
                    <th className="px-5 py-3.5 text-center">نسخ / إجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-md-outline/10 font-medium text-md-surface-on">
                  {keysList.map((k) => (
                    <tr key={k.id || k.key} className="hover:bg-md-surface-container-high transition-colors">
                      <td className="px-5 py-4 font-mono font-extrabold text-sm text-orange-600 dark:text-orange-400">
                        {k.key}
                      </td>
                      <td className="px-5 py-4">
                        {k.isUsed ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-500/15 text-slate-700 dark:text-slate-300 font-extrabold text-[11px]">
                            <UserCheck className="w-3.5 h-3.5" /> مستعمل
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 font-extrabold text-[11px]">
                            <ShieldCheck className="w-3.5 h-3.5" /> جاهز للاستخدام
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-md-surface-on-variant">
                        {k.usedBy || "—"}
                      </td>
                      <td className="px-5 py-4 text-md-surface-on-variant">
                        {formatDate(k.createdAt)}
                      </td>
                      <td className="px-5 py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleCopyKey(k.key, k.id!)}
                            className="p-2 rounded-xl bg-orange-500/15 text-orange-600 dark:text-orange-400 hover:bg-orange-500/25 transition-colors"
                            title="نسخ المفتاح"
                          >
                            {copiedId === k.id ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteKey(k.id!)}
                            className="p-2 rounded-xl bg-red-500/15 text-red-600 dark:text-red-400 hover:bg-red-500/25 transition-colors"
                            title="حذف المفتاح"
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
          )}
        </div>
      </div>

      <hr className="border-md-outline/10 my-6" />

      {/* SECTION 2: Registered Admins Table */}
      <div className="space-y-4">
        <h2 className="text-lg font-extrabold text-md-surface-on flex items-center gap-2">
          <Users className="w-5 h-5 text-orange-600 dark:text-orange-400" />
          <span>قائمة المسؤولين المسجلين (Registered Admins)</span>
        </h2>

        <div className="rounded-3xl bg-md-surface border border-md-outline/10 shadow-sm overflow-hidden">
          {registeredAdmins.length === 0 ? (
            <div className="p-16 text-center space-y-4">
              <Users className="w-12 h-12 mx-auto text-orange-500 opacity-50" />
              <p className="text-sm font-bold text-md-surface-on">لا يوجد مسؤولون مسجلون في قاعدة البيانات حالياً.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-md-surface-container-low border-b border-md-outline/10 text-md-surface-on-variant font-bold">
                  <tr>
                    <th className="px-5 py-3.5">الاسم</th>
                    <th className="px-5 py-3.5">البريد الإلكتروني</th>
                    <th className="px-5 py-3.5">الصلاحيات والدور</th>
                    <th className="px-5 py-3.5">تاريخ التسجيل</th>
                    <th className="px-5 py-3.5 text-center">إجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-md-outline/10 font-medium text-md-surface-on">
                  {registeredAdmins.map((adm) => (
                    <tr key={adm.id || adm.email} className="hover:bg-md-surface-container-high transition-colors">
                      <td className="px-5 py-4 font-bold text-gray-900 dark:text-white">
                        {adm.name || "مسؤول"}
                      </td>
                      <td className="px-5 py-4 font-mono font-semibold text-md-surface-on-variant">
                        {adm.email}
                      </td>
                      <td className="px-5 py-4">
                        <select
                          value={adm.role || "admin"}
                          onChange={(e) => handleRoleChange(adm.id!, e.target.value as "super_admin" | "admin")}
                          disabled={updatingRoleId === adm.id}
                          className="px-3 py-1.5 rounded-full border border-md-outline/20 bg-md-surface-container font-extrabold text-xs outline-none cursor-pointer transition-all hover:border-orange-500"
                        >
                          <option value="admin" className="bg-[#1C1B1F] text-gray-100 dark:bg-[#1C1B1F] dark:text-gray-100 font-bold py-1">
                            👤 مسؤول عادي (Admin)
                          </option>
                          <option value="super_admin" className="bg-[#1C1B1F] text-amber-400 dark:bg-[#1C1B1F] dark:text-amber-400 font-bold py-1">
                            👑 مدير عام (Super Admin)
                          </option>
                        </select>
                      </td>
                      <td className="px-5 py-4 text-md-surface-on-variant">
                        {formatDate(adm.createdAt)}
                      </td>
                      <td className="px-5 py-4 text-center">
                        <button
                          type="button"
                          onClick={() => handleDeleteAdmin(adm.id!, adm.name || adm.email)}
                          className="p-2 rounded-xl bg-red-500/15 text-red-600 dark:text-red-400 hover:bg-red-500/25 transition-colors"
                          title="حذف المسؤول وإلغاء وصوله"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
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
