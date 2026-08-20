"use client";

import React, { useState, useEffect } from "react";
import { auth, db } from "@/lib/firebase/config";
import { updatePassword, verifyBeforeUpdateEmail, updateProfile, onAuthStateChanged } from "firebase/auth";
import { doc, updateDoc, setDoc } from "firebase/firestore";
import { Settings, Lock, CheckCircle2, AlertCircle, Loader2, ShieldCheck, KeyRound, Mail, UserCheck } from "lucide-react";

export default function AdminSettingsPage() {
  // Name update state
  const [name, setName] = useState("");
  const [loadingName, setLoadingName] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);
  const [nameSuccess, setNameSuccess] = useState<string | null>(null);

  // Password state
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loadingPassword, setLoadingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);

  // Email update state
  const [newEmail, setNewEmail] = useState("");
  const [loadingEmail, setLoadingEmail] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [emailSuccess, setEmailSuccess] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user && user.displayName) {
        setName(user.displayName);
      }
    });
    return () => unsubscribe();
  }, []);

  // Safe Name Update Handler
  const handleUpdateName = async (e: React.FormEvent) => {
    e.preventDefault();
    setNameError(null);
    setNameSuccess(null);

    const cleanName = name.trim();
    if (!cleanName) {
      setNameError("يرجى إدخال الاسم الكامل.");
      return;
    }

    const currentUser = auth.currentUser;
    if (!currentUser) {
      setNameError("لم يتم العثور على مسؤول مسجل الدخول حالياً.");
      return;
    }

    setLoadingName(true);

    try {
      // 1. Update Firebase Auth Profile
      await updateProfile(currentUser, { displayName: cleanName });

      // 2. Update Firestore admins collection (ONLY updates name field safely without touching role)
      try {
        await updateDoc(doc(db, "admins", currentUser.uid), { name: cleanName });
      } catch {
        await setDoc(doc(db, "admins", currentUser.uid), { name: cleanName }, { merge: true });
      }

      setNameSuccess("تم تحديث الاسم بنجاح! 🎉");
      setTimeout(() => window.location.reload(), 1200);
    } catch (err: any) {
      console.error("Update name error:", err);
      setNameError(err.message || "حدث خطأ أثناء تحديث الاسم.");
    } finally {
      setLoadingName(false);
    }
  };

  // Password Change Handler
  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(null);

    if (!newPassword) {
      setPasswordError("يرجى إدخال كلمة المرور الجديدة.");
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError("يجب أن تكون كلمة المرور 6 أحرف على الأقل.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("كلمتا المرور غير متطابقتين.");
      return;
    }

    const currentUser = auth.currentUser;
    if (!currentUser) {
      setPasswordError("لم يتم العثور على مسؤول مسجل الدخول حالياً.");
      return;
    }

    setLoadingPassword(true);

    try {
      await updatePassword(currentUser, newPassword);
      setPasswordSuccess("تم تحديث كلمة المرور بنجاح! 🎉 يرجى استخدام كلمة المرور الجديدة في المرات القادمة.");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      console.error("Update password error:", err);
      if (err.code === "auth/requires-recent-login") {
        setPasswordError(
          "لأسباب أمنية، انتهت صلاحية الجلسة الحساسة لحسابك. يرجى تسجيل الخروج من لوحة التحكم ثم إعادة الدخول لتغيير كلمة المرور."
        );
      } else {
        setPasswordError(err.message || "حدث خطأ أثناء تحديث كلمة المرور.");
      }
    } finally {
      setLoadingPassword(false);
    }
  };

  // Email Update Handler (verifyBeforeUpdateEmail)
  const handleEmailUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailError(null);
    setEmailSuccess(null);

    const cleanEmail = newEmail.trim();
    if (!cleanEmail) {
      setEmailError("يرجى إدخال البريد الإلكتروني الجديد.");
      return;
    }

    const currentUser = auth.currentUser;
    if (!currentUser) {
      setEmailError("لم يتم العثور على مسؤول مسجل الدخول حالياً.");
      return;
    }

    if (cleanEmail === currentUser.email) {
      setEmailError("البريد الإلكتروني الجديد مطبق بالفعل حالياً.");
      return;
    }

    setLoadingEmail(true);

    try {
      await verifyBeforeUpdateEmail(currentUser, cleanEmail);
      setEmailSuccess(
        "تم إرسال رابط تأكيد إلى بريدك الإلكتروني الجديد 📧. يرجى مراجعة البريد والضغط على رابط التأكيد لاعتماد التغيير."
      );
      setNewEmail("");
    } catch (err: any) {
      console.error("Verify before update email error:", err);
      if (err.code === "auth/requires-recent-login") {
        setEmailError(
          "لأسباب أمنية، انتهت صلاحية الجلسة الحساسة لحسابك. يرجى تسجيل الخروج من لوحة التحكم ثم إعادة الدخول لتغيير البريد الإلكتروني."
        );
      } else if (err.code === "auth/email-already-in-use") {
        setEmailError("هذا البريد الإلكتروني مستخدم بالفعل بحساب آخر.");
      } else if (err.code === "auth/invalid-email") {
        setEmailError("صيغة البريد الإلكتروني غير صحيحة.");
      } else {
        setEmailError(err.message || "حدث خطأ أثناء إرسال رابط تأكيد البريد الإلكتروني.");
      }
    } finally {
      setLoadingEmail(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 select-none" dir="rtl">
      
      {/* Page Header */}
      <div className="pb-4 border-b border-md-outline/10">
        <h1 className="text-2xl font-black text-md-surface-on flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-orange-100 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400">
            <Settings className="w-6 h-6" />
          </div>
          <span>إعدادات حساب المسؤول (Account Settings)</span>
        </h1>
        <p className="text-xs text-md-surface-on-variant mt-1">
          إدارة الاسم الكامل والبريد الإلكتروني وكلمة المرور وتأمين حساب المسؤول
        </p>
      </div>

      {/* Main Sections Stack */}
      <div className="space-y-8">
        
        {/* Section 1: Update Profile (Full Name) Card */}
        <div className="rounded-3xl bg-md-surface border border-md-outline/10 p-8 shadow-sm space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-md-outline/10">
            <div className="p-2 rounded-xl bg-orange-500/10 text-orange-600 dark:text-orange-400">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-md-surface-on">تحديث الملف الشخصي</h3>
              <p className="text-xs text-md-surface-on-variant">تحديث اسمك الكامل المعروض في لوحة التحكم</p>
            </div>
          </div>

          {/* Success Name Box */}
          {nameSuccess && (
            <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/40 text-emerald-800 dark:text-emerald-300 text-xs font-bold flex items-center gap-3 animate-in fade-in">
              <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
              <span>{nameSuccess}</span>
            </div>
          )}

          {/* Error Name Box */}
          {nameError && (
            <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/40 text-red-800 dark:text-red-300 text-xs font-semibold flex items-center gap-3 animate-in fade-in">
              <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
              <span className="leading-relaxed">{nameError}</span>
            </div>
          )}

          <form onSubmit={handleUpdateName} className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-md-surface-on">
                الاسم الكامل
              </label>
              <div className="relative">
                <UserCheck className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="فوزي جعفري"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pr-10 pl-4 py-2.5 rounded-2xl bg-md-surface-container border border-md-outline/20 text-sm text-md-surface-on font-bold outline-none focus:border-orange-500 transition-all"
                  required
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={loadingName}
                className="px-6 py-3 rounded-full bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs shadow-md active:scale-98 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loadingName ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>جاري التحديث...</span>
                  </>
                ) : (
                  <>
                    <UserCheck className="w-4 h-4" />
                    <span>حفظ الاسم 👤</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Section 2: Secure Email Update Card */}
        <div className="rounded-3xl bg-md-surface border border-md-outline/10 p-8 shadow-sm space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-md-outline/10">
            <div className="p-2 rounded-xl bg-orange-500/10 text-orange-600 dark:text-orange-400">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-md-surface-on">تغيير البريد الإلكتروني للمسؤول</h3>
              <p className="text-xs text-md-surface-on-variant">يتطلب تأكيد الرابط المرسل للبريد الجديد</p>
            </div>
          </div>

          {/* Active Email Preview */}
          <div className="p-3.5 rounded-2xl bg-md-surface-container border border-md-outline/10 text-xs flex items-center justify-between">
            <span className="text-md-surface-on-variant font-bold">البريد الإلكتروني الحالي:</span>
            <span className="font-mono font-extrabold text-orange-600 dark:text-orange-400">
              {auth.currentUser?.email || "admin@linastore.com"}
            </span>
          </div>

          {/* Success Email Box */}
          {emailSuccess && (
            <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/40 text-emerald-800 dark:text-emerald-300 text-xs font-bold flex items-center gap-3 animate-in fade-in">
              <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
              <span className="leading-relaxed">{emailSuccess}</span>
            </div>
          )}

          {/* Error Email Box */}
          {emailError && (
            <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/40 text-red-800 dark:text-red-300 text-xs font-semibold flex items-center gap-3 animate-in fade-in">
              <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
              <span className="leading-relaxed">{emailError}</span>
            </div>
          )}

          <form onSubmit={handleEmailUpdate} className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-md-surface-on">
                البريد الإلكتروني الجديد
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="email"
                  placeholder="newadmin@linastore.com"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="w-full pr-10 pl-4 py-2.5 rounded-2xl bg-md-surface-container border border-md-outline/20 text-sm text-md-surface-on outline-none focus:border-orange-500 transition-all"
                  required
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={loadingEmail}
                className="px-6 py-3 rounded-full bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs shadow-md active:scale-98 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loadingEmail ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>جاري إرسال رابط التأكيد...</span>
                  </>
                ) : (
                  <>
                    <Mail className="w-4 h-4" />
                    <span>إرسال رابط تأكيد البريد الجديد 📧</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Section 3: Change Password Card */}
        <div className="rounded-3xl bg-md-surface border border-md-outline/10 p-8 shadow-sm space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-md-outline/10">
            <div className="p-2 rounded-xl bg-orange-500/10 text-orange-600 dark:text-orange-400">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-md-surface-on">تغيير كلمة المرور</h3>
              <p className="text-xs text-md-surface-on-variant">تحديث كلمة مرور حساب المسؤول الحالي</p>
            </div>
          </div>

          {/* Password Success Alert Box */}
          {passwordSuccess && (
            <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/40 text-emerald-800 dark:text-emerald-300 text-xs font-bold flex items-center gap-3 animate-in fade-in">
              <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
              <span>{passwordSuccess}</span>
            </div>
          )}

          {/* Password Error Alert Box */}
          {passwordError && (
            <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/40 text-red-800 dark:text-red-300 text-xs font-semibold flex items-center gap-3 animate-in fade-in">
              <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
              <span className="leading-relaxed">{passwordError}</span>
            </div>
          )}

          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-md-surface-on">
                كلمة المرور الجديدة
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="password"
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full pr-10 pl-4 py-2.5 rounded-2xl bg-md-surface-container border border-md-outline/20 text-sm text-md-surface-on outline-none focus:border-orange-500 transition-all"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-md-surface-on">
                تأكيد كلمة المرور الجديدة
              </label>
              <div className="relative">
                <ShieldCheck className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pr-10 pl-4 py-2.5 rounded-2xl bg-md-surface-container border border-md-outline/20 text-sm text-md-surface-on outline-none focus:border-orange-500 transition-all"
                  required
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={loadingPassword}
                className="px-6 py-3 rounded-full bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs shadow-md active:scale-98 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loadingPassword ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>جاري تغيير كلمة المرور...</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    <span>حفظ كلمة المرور الجديدة 🔒</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

      </div>

    </div>
  );
}
