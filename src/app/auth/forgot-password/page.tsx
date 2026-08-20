"use client";

import React, { useState } from "react";
import Link from "next/link";
import { auth } from "@/lib/firebase/config";
import { sendPasswordResetEmail } from "firebase/auth";
import { ShoppingBag, Mail, ArrowLeft, AlertCircle, Loader2, CheckCircle2, KeyRound } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setErrorMessage("يرجى إدخال البريد الإلكتروني.");
      return;
    }

    setLoading(true);

    try {
      await sendPasswordResetEmail(auth, cleanEmail);
      setSuccessMessage("تم إرسال رابط إعادة ضبط كلمة المرور إلى بريدك الإلكتروني بنجاح! 📧 يرجى مراجعة صندوق الوارد.");
    } catch (err: any) {
      console.error("Forgot password error:", err);
      if (err.code === "auth/user-not-found") {
        setErrorMessage("لم يتم العثور على حساب مسجل بهذا البريد الإلكتروني.");
      } else if (err.code === "auth/invalid-email") {
        setErrorMessage("صيغة البريد الإلكتروني غير صحيحة.");
      } else {
        setErrorMessage(err.message || "حدث خطأ أثناء إرسال رابط إعادة الضبط.");
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
            <KeyRound className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-orange-600 dark:text-orange-400">Lina Store</h1>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mt-1">نسيت كلمة المرور؟</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              أدخل بريدك الإلكتروني المسجل وسنرسل لك رابطاً لإعادة ضبط كلمة المرور
            </p>
          </div>
        </div>

        {/* Success Alert */}
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
              <span>العودة لتسجيل الدخول</span>
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

            {/* Email Field */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300">
                البريد الإلكتروني المسجل
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

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-full bg-orange-600 hover:bg-orange-700 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>جاري إرسال الرابط...</span>
                </>
              ) : (
                <>
                  <span>إرسال رابط إعادة الضبط 📧</span>
                  <ArrowLeft className="w-4 h-4" />
                </>
              )}
            </button>

            {/* Back to Login Footer */}
            <div className="pt-3 text-center">
              <Link
                href="/login"
                className="text-xs font-semibold text-gray-500 dark:text-gray-400 hover:text-orange-600 transition-colors"
              >
                تذكرت كلمة المرور؟ تسجيل الدخول
              </Link>
            </div>
          </form>
        )}

      </div>
    </div>
  );
}
