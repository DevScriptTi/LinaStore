"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { ShoppingBag, Search, LayoutDashboard, Sun, Moon } from "lucide-react";
import { auth } from "@/lib/firebase/config";
import { onAuthStateChanged } from "firebase/auth";

export function Navbar() {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    setMounted(true);

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setIsAdmin(true);
      } else {
        setIsAdmin(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const navLinks = [
    { title: "الرئيسية", href: "/" },
    { title: "المنتجات والباقات", href: "/products" },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-gray-200 dark:border-white/10 bg-white/90 dark:bg-[#121212]/90 backdrop-blur-md text-gray-900 dark:text-white transition-colors duration-200 select-none">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Brand Logo & Navigation Links */}
        <div className="flex items-center gap-8">
          <Link href="/" className="text-xl font-extrabold tracking-tight text-orange-600 dark:text-orange-400 flex items-center gap-2.5">
            <div className="p-2 rounded-full bg-orange-100 dark:bg-orange-950/80 text-orange-600 dark:text-orange-300 border border-orange-200 dark:border-orange-800/40 shadow-sm">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <span>Lina Store</span>
          </Link>

          {/* Navigation Links with Active Highlighting */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-semibold">
            {navLinks.map((link) => {
              const isActive =
                link.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(link.href);

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`transition-colors py-1 relative ${
                    isActive
                      ? "text-orange-600 dark:text-orange-400 font-extrabold"
                      : "text-gray-700 dark:text-gray-300 hover:text-orange-600 dark:hover:text-orange-400"
                  }`}
                >
                  {link.title}
                  {isActive && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-500 rounded-full animate-in fade-in" />
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Right Actions: Search Link, Theme Toggle & Admin Link */}
        <div className="flex items-center gap-3">
          {/* Quick Search Link to Products */}
          <Link
            href="/products"
            className="p-2.5 rounded-full text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
            aria-label="البحث عن منتج"
            title="البحث عن منتج"
          >
            <Search className="w-5 h-5" />
          </Link>

          {/* Hydration Safe Theme Toggle Button */}
          <button
            type="button"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="p-2.5 rounded-full text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
            aria-label="تبديل المظهر"
            title={mounted ? (theme === "dark" ? "تغيير إلى الوضع الفاتح" : "تغيير إلى الوضع الداكن") : "تبديل المظهر"}
          >
            {!mounted ? (
              <div className="w-5 h-5" />
            ) : theme === "dark" ? (
              <Sun className="w-5 h-5 text-amber-400" />
            ) : (
              <Moon className="w-5 h-5 text-orange-600" />
            )}
          </button>

          {/* Conditional Admin Dashboard Link (Visible only to authenticated admins) */}
          {isAdmin && (
            <Link
              href="/dashboard"
              className="flex items-center gap-2 text-xs font-bold px-4 py-2 rounded-full bg-orange-100 dark:bg-orange-950/60 text-orange-700 dark:text-orange-300 border border-orange-300 dark:border-orange-500/40 hover:bg-orange-200 dark:hover:bg-orange-900/50 transition-all animate-in fade-in"
            >
              <LayoutDashboard className="w-4 h-4" />
              <span className="hidden sm:inline">لوحة التحكم</span>
            </Link>
          )}
        </div>

      </div>
    </header>
  );
}
