"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase/config";
import { createUserWithEmailAndPassword, sendEmailVerification } from "firebase/auth";
import { collection, query, where, getDocs, updateDoc, doc, addDoc, serverTimestamp } from "firebase/firestore";
import { ShoppingBag, Key, Mail, Lock, User, ArrowLeft, AlertCircle, Loader2, CheckCircle2 } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();

  const [invitationKey, setInvitationKey] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const cleanKey = invitationKey.trim();
    const cleanName = name.trim();
    const cleanEmail = email.trim();

    if (!cleanKey || !cleanName || !cleanEmail || !password) {
      setErrorMessage("جميع الحقول مطلوبة للمتابعة.");
      return;
    }

    if (password.length < 6) {
      setErrorMessage("يجب أن تكون كلمة المرور 6 أحرف على الأقل.");
      return;
    }

    setLoading(true);

    try {
      // 1. Verify invitation key in admin_keys collection
      const q = query(
        collection(db, "admin_keys"),
        where("key", "==", cleanKey),
        where("isUsed", "==", false)
      );
      const keySnap = await getDocs(q);

      if (keySnap.empty) {
        setErrorMessage("مفتاح الدعوة الذي أدخلته غير صالح أو تم استخدامه سابقاً!");
        setLoading(false);
        return;
      }

      const keyDoc = keySnap.docs[0];

      // 2. Create User via Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, cleanEmail, password);

      // 3. Send Email Verification link
      await sendEmailVerification(userCredential.user);

      // 4. Mark key as used in Firestore
      await updateDoc(doc(db, "admin_keys", keyDoc.id), {
        isUsed: true,
        usedBy: cleanEmail,
        usedAt: serverTimestamp(),
      });

      // 5. Save Admin profile in admins collection
      await addDoc(collection(db, "admins"), {
        uid: userCredential.user.uid,
        name: cleanName,
        email: cleanEmail,
        role: "admin",
        createdAt: serverTimestamp(),
      });

      setSuccessMessage("تم إنشاء حساب المسؤول بنجاح! 🎉 أرسلنا رابط تفعيل إلى بريدك الإلكتروني. يرجى التفعيل ثم تسجيل الدخول.");
    } catch (err: any) {
      console.error("Register admin error:", err);
      if (err.code === "auth/email-already-in-use") {
        setErrorMessage("هذا البريد الإلكتروني مسجل بالفعل لمسؤول آخر.");
      } else if (err.code === "auth/invalid-email") {
        setErrorMessage("صيغة البريد الإلكتروني غير صحيحة.");
      } else {
        setErrorMessage(err.message || "حدث خطأ غير متوقع أثناء تسجيل الحساب.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-[#121212] text-slate-900 dark:text-white p-4 select-none" dir="rtl">
      
      <div className="w-full max-w-md bg-white dark:bg-[#1C1B1F] border border-gray-200 dark:border-white/10 rounded-3xl shadow-xl p-8 space-y-6">
        
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="w-16 h-16 mx-auto rounded-full bg-orange-100 dark:bg-orange-950/80 text-orange-600 dark:text-orange-400 border border-orange-200 dark:border-orange-800/40 flex items-center justify-center shadow-sm">
            <ShoppingBag className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-orange-600 dark:text-orange-400">Lina Store</h1>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mt-1">تسجيل مسؤول جديد بمفتاح الدعوة</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              أدخل مفتاح الدعوة الممنوح لك وبياناتك الشخصية
            </p>
          </div>
        </div>

        {/* Success Card Alert */}
        {successMessage ? (
          <div className="p-6 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/40 text-center space-y-4 animate-in zoom-in-95">
            <CheckCircle2 className="w-10 h-10 mx-auto text-emerald-500" />
            <p className="text-xs font-bold text-emerald-800 dark:text-emerald-300 leading-relaxed">
              {successMessage}
            </p>
            <Link
              href="/login"
              className="inline-flex items-center justify-center gap-2 w-full py-2.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-all"
            >
              <span>الانتقال لتسجيل الدخول</span>
              <ArrowLeft className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Error Alert Box */}
            {errorMessage && (
              <div className="p-3.5 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/40 text-red-700 dark:text-red-300 text-xs font-semibold flex items-center gap-2.5 animate-in fade-in">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Invitation Key Field */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300">
                مفتاح الدعوة (Invitation Key)
              </label>
              <div className="relative">
                <Key className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 text-orange-500" />
                <input
                  type="text"
                  placeholder="LINA-XXXXXXXX"
                  value={invitationKey}
                  onChange={(e) => setInvitationKey(e.target.value.toUpperCase())}
                  className="w-full pr-10 pl-4 py-2.5 rounded-full bg-slate-50 dark:bg-[#121212] border border-gray-200 dark:border-white/10 text-sm font-mono font-extrabold text-orange-600 dark:text-orange-400 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all uppercase"
                  required
                />
              </div>
            </div>

            {/* Full Name Field */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300">
                الاسم الكامل
              </label>
              <div className="relative">
                <User className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="أدخل اسمك كاملاً"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pr-10 pl-4 py-2.5 rounded-full bg-slate-50 dark:bg-[#121212] border border-gray-200 dark:border-white/10 text-sm text-gray-900 dark:text-white outline-none focus:border-orange-500 transition-all"
                  required
                />
              </div>
            </div>

            {/* Email Field */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300">
                البريد الإلكتروني
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="email"
                  placeholder="admin@linastore.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pr-10 pl-4 py-2.5 rounded-full bg-slate-50 dark:bg-[#121212] border border-gray-200 dark:border-white/10 text-sm text-gray-900 dark:text-white outline-none focus:border-orange-500 transition-all"
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300">
                كلمة المرور
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pr-10 pl-4 py-2.5 rounded-full bg-slate-50 dark:bg-[#121212] border border-gray-200 dark:border-white/10 text-sm text-gray-900 dark:text-white outline-none focus:border-orange-500 transition-all"
                  required
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-full bg-orange-600 hover:bg-orange-700 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>جاري التحقق وإنشاء الحساب...</span>
                </>
              ) : (
                <>
                  <span>تسجيل حساب المسؤول</span>
                  <ArrowLeft className="w-4 h-4" />
                </>
              )}
            </button>

            {/* Footer Navigation */}
            <div className="pt-3 text-center">
              <Link
                href="/login"
                className="text-xs font-semibold text-gray-500 dark:text-gray-400 hover:text-orange-600 transition-colors"
              >
                لديك حساب بالفعل؟ تسجيل الدخول
              </Link>
            </div>
          </form>
        )}

      </div>
    </div>
  );
}
