import React from "react";
import Link from "next/link";
import { Sparkles, ArrowLeft, ShieldCheck } from "lucide-react";

export function HeroSection() {
  return (
    <section className="relative rounded-3xl bg-gradient-to-r from-orange-600 via-orange-500 to-amber-500 dark:from-orange-700 dark:via-orange-600 dark:to-amber-600 border border-orange-400/30 dark:border-orange-500/20 p-8 md:p-14 text-white overflow-hidden shadow-2xl transition-colors duration-200">
      {/* Decorative Glow Elements */}
      <div className="absolute -top-24 -left-24 w-96 h-96 bg-orange-400/30 dark:bg-orange-500/25 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-amber-400/30 dark:bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-3xl space-y-6 relative z-10">
        {/* Top Welcome Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/20 dark:bg-orange-500/20 border border-white/30 dark:border-orange-400/30 text-white dark:text-orange-100 text-xs font-semibold backdrop-blur-sm">
          <Sparkles className="w-4 h-4 text-amber-200 dark:text-amber-300" />
          <span>مرحباً بك في Lina Store</span>
        </div>

        {/* Main Heading */}
        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight leading-tight text-white">
          اكتشف تشكيلات فاخرة لحياة عصرية
        </h1>

        {/* Subtitle */}
        <p className="text-base md:text-xl text-orange-50 dark:text-orange-100/90 leading-relaxed max-w-2xl font-normal">
          استكشف منتجات مختارة بعناية مع أناقة Material Design 3، توصيل سريع، وتجربة تسوق سلسة.
        </p>

        {/* Action Buttons */}
        <div className="pt-4 flex flex-wrap items-center gap-4">
          <Link
            href="/products"
            className="inline-flex items-center gap-3 px-8 py-4 rounded-full bg-white text-orange-600 hover:bg-orange-50 dark:bg-white dark:text-orange-700 dark:hover:bg-orange-100 font-bold transition-all shadow-lg hover:shadow-orange-500/25 text-sm md:text-base group"
          >
            <span>تسوق الآن</span>
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          </Link>

          <div className="flex items-center gap-2 px-4 py-3 rounded-full bg-white/15 dark:bg-black/20 border border-white/25 dark:border-white/10 text-xs font-medium text-white">
            <ShieldCheck className="w-4 h-4 text-emerald-300 dark:text-emerald-400" />
            <span>ضمان الجودة وأمان المدفوعات</span>
          </div>
        </div>
      </div>
    </section>
  );
}
