import React from "react";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { AdminAuthGuard } from "@/components/admin/AdminAuthGuard";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminAuthGuard>
      <div dir="rtl" className="min-h-screen bg-md-background text-md-background-on font-sans antialiased">
        {/* Fixed Right Sidebar */}
        <AdminSidebar />

        {/* Main Content Area (offset by 64 / 16rem on the right for fixed sidebar) */}
        <div className="mr-64 min-h-screen flex flex-col">
          {/* Top Header */}
          <AdminHeader />

          {/* Dashboard Content */}
          <main className="flex-1 p-6 md:p-8">
            {children}
          </main>
        </div>
      </div>
    </AdminAuthGuard>
  );
}
