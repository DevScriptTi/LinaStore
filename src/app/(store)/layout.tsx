import React from "react";
import { Navbar } from "@/components/store/Navbar";
import { Footer } from "@/components/store/Footer";

export default function StoreLayout({ children }: { children: React.ReactNode }) {
  return (
    <div dir="rtl" className="min-h-screen bg-slate-50 text-slate-900 dark:bg-[#121212] dark:text-white flex flex-col font-sans antialiased selection:bg-purple-500 selection:text-white transition-colors duration-200">
      {/* Navigation Header */}
      <Navbar />

      {/* Main Page Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 space-y-16">
        {children}
      </main>

      {/* Store Footer */}
      <Footer />
    </div>
  );
}
