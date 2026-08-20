"use client";

import React, { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { adminLogin, adminLogout } from "@/lib/firebase/auth";
import { ShoppingBag, Lock, Mail, ArrowLeft, AlertCircle, Loader2 } from "lucide-react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("from") || "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  React.useEffect(() => {
    if (searchParams.get("error") === "deleted") {
      setErrorMessage("تم إلغاء صلاحيات حساب هذا المسؤول وحذفه من لوحة التحكم بواسطة المدير العام.");
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!email || !password) {
      setErrorMessage("يرجى إدخال البريد الإلكتروني وكلمة المرور.");
      return;
    }

    setLoading(true);
    const { user, error } = await adminLogin(email, password);
    setLoading(false);

    if (error) {
      setErrorMessage(error);
    } else if (user) {
      if (!user.emailVerified) {
        await adminLogout();
        setErrorMessage("لم يتم تفعيل البريد الإلكتروني بعد! يرجى مراجعة صندوق الوارد الخاص بك والضغط على رابط التفعيل.");
        return;
      }
      router.push(redirectTo);
    }
  };

  return (
    <div className="space-y-6">
      {/* Error Alert Box */}
      {errorMessage && (
        <div className="p-3.5 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/40 text-red-700 dark:text-red-300 text-xs font-semibold flex items-center gap-2.5 animate-in fade-in">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Login Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        
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
              className="w-full pr-10 pl-4 py-2.5 rounded-full bg-slate-50 dark:bg-[#121212] border border-gray-200 dark:border-white/10 text-sm text-gray-900 dark:text-white outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all"
              required
            />
          </div>
        </div>

        {/* Password Field */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-center">
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300">
              كلمة المرور
            </label>
            <a
              href="/auth/forgot-password"
              className="text-[11px] font-semibold text-orange-600 dark:text-orange-400 hover:underline"
            >
              نسيت كلمة المرور؟
            </a>
          </div>
          <div className="relative">
            <Lock className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full pr-10 pl-4 py-2.5 rounded-full bg-slate-50 dark:bg-[#121212] border border-gray-200 dark:border-white/10 text-sm text-gray-900 dark:text-white outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all"
              required
            />
          </div>
        </div>

        {/* Links Area */}
        <div className="flex items-center justify-end pt-1 text-xs">
          <a
            href="/auth/register"
            className="text-[11px] text-orange-600 dark:text-orange-400 hover:underline font-bold"
          >
            تسجيل مسؤول بمفتاح دعوة 🔑
          </a>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 rounded-full bg-orange-600 hover:bg-orange-700 text-white font-bold text-sm shadow-md hover:shadow-orange-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>جاري تسجيل الدخول...</span>
            </>
          ) : (
            <>
              <span>دخول لوحة التحكم</span>
              <ArrowLeft className="w-4 h-4" />
            </>
          )}
        </button>
      </form>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-[#121212] text-slate-900 dark:text-white p-4 select-none" dir="rtl">
      {/* Centered Login Card Container */}
      <div className="w-full max-w-md bg-white dark:bg-[#1C1B1F] border border-gray-200 dark:border-white/10 rounded-3xl shadow-xl p-8 space-y-6">
        
        {/* Card Header & Brand Logo */}
        <div className="text-center space-y-3">
          <div className="w-16 h-16 mx-auto rounded-full bg-orange-100 dark:bg-orange-950/80 text-orange-600 dark:text-orange-400 border border-orange-200 dark:border-orange-800/40 flex items-center justify-center shadow-sm">
            <ShoppingBag className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-orange-600 dark:text-orange-400">Lina Store</h1>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mt-1">تسجيل دخول الإدارة</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              أدخل بيانات حساب المسؤول للوصول إلى لوحة التحكم
            </p>
          </div>
        </div>

        {/* Form Wrapped in Suspense Boundary */}
        <Suspense fallback={<div className="h-48 flex items-center justify-center text-gray-400"><Loader2 className="w-6 h-6 animate-spin" /></div>}>
          <LoginForm />
        </Suspense>

        {/* Back to Store Footer */}
        <div className="pt-4 border-t border-gray-100 dark:border-white/10 text-center">
          <a
            href="/"
            className="text-xs font-semibold text-gray-500 dark:text-gray-400 hover:text-orange-600 dark:hover:text-orange-400 transition-colors"
          >
            العودة إلى المتجر الرئيسية
          </a>
        </div>

      </div>
    </div>
  );
}
