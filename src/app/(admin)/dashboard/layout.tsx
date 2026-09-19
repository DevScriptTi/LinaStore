"use client";

import React, { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { AdminAuthGuard } from "@/components/admin/AdminAuthGuard";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  // Close mobile drawer automatically when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  // Lock body scroll when mobile drawer is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMobileMenuOpen]);

  return (
    <AdminAuthGuard>
      <div dir="rtl" className="min-h-screen bg-md-background text-md-background-on font-sans antialiased">
        {/* Responsive Sidebar (Desktop persistent + Mobile slide-in drawer) */}
        <AdminSidebar isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />

        {/* Main Content Area (Offset by 64 / 16rem on desktop >= lg) */}
        <div className="mr-0 lg:mr-64 min-h-screen flex flex-col transition-all duration-300">
          {/* Top Header with Hamburger Toggle */}
          <AdminHeader onToggleSidebar={() => setIsMobileMenuOpen((prev) => !prev)} />

          {/* Dashboard Content Area */}
          <main className="flex-1 p-4 sm:p-6 md:p-8">
            {children}
          </main>
        </div>
      </div>
    </AdminAuthGuard>
  );
}
