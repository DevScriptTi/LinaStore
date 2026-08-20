"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Plus, 
  ShoppingCart, 
  Package, 
  FolderTree, 
  User, 
  LogOut,
  LayoutDashboard,
  Key
} from "lucide-react";
import { auth, db } from "@/lib/firebase/config";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import { adminLogout } from "@/lib/firebase/auth";

export function AdminSidebar() {
  const pathname = usePathname();
  const [adminName, setAdminName] = useState<string | null>(null);
  const [adminRole, setAdminRole] = useState<string>("admin");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        let fetchedName = user.displayName || null;
        let fetchedRole = "admin";

        try {
          // Check by UID document directly
          const adminDocRef = doc(db, "admins", user.uid);
          const adminDocSnap = await getDoc(adminDocRef);

          if (adminDocSnap.exists()) {
            const data = adminDocSnap.data();
            fetchedRole = data.role || "admin";
            if (data.name) fetchedName = fetchedName || data.name;
          } else {
            // Fallback query by UID or email
            const q = query(collection(db, "admins"), where("uid", "==", user.uid));
            const snapshot = await getDocs(q);

            if (!snapshot.empty) {
              const data = snapshot.docs[0].data();
              fetchedRole = data.role || "admin";
              if (data.name) fetchedName = fetchedName || data.name;
            } else if (user.email === "admin@linastore.com") {
              fetchedRole = "super_admin";
            }
          }
        } catch (err) {
          console.warn("Sidebar fetch admin info fallback:", err);
          if (user.email === "admin@linastore.com") {
            fetchedRole = "super_admin";
          }
        }

        setAdminName(fetchedName || user.email?.split("@")[0] || null);
        setAdminRole(fetchedRole);
      } else {
        setAdminName(null);
        setAdminRole("admin");
      }
    });

    return () => unsubscribe();
  }, []);

  const baseLinks = [
    {
      title: "لوحة التحكم",
      href: "/dashboard",
      icon: LayoutDashboard,
    },
    {
      title: "الطلبات",
      href: "/dashboard/orders",
      icon: ShoppingCart,
    },
    {
      title: "المنتجات",
      href: "/dashboard/products",
      icon: Package,
    },
    {
      title: "أصناف المنتجات",
      href: "/dashboard/categories",
      icon: FolderTree,
    },
  ];

  // Super Admin Only Link for Invitation Keys Management
  if (adminRole === "super_admin") {
    baseLinks.push({
      title: "المسؤولون والمفاتيح",
      href: "/dashboard/admins",
      icon: Key,
    });
  }

  // Admin Profile Representation link replacing generic "Settings"
  const displayNameToShow = adminName ? `👤 ${adminName}` : "الملف الشخصي";
  baseLinks.push({
    title: displayNameToShow,
    href: "/dashboard/settings",
    icon: User,
  });

  return (
    <aside className="w-64 h-screen fixed right-0 top-0 z-30 bg-md-surface-container-low border-l border-md-outline/10 flex flex-col justify-between p-4 select-none" dir="rtl">
      <div className="space-y-6">
        {/* Logo / Header */}
        <div className="flex items-center justify-between px-2 py-3 border-b border-md-outline/10">
          <Link href="/dashboard" className="text-xl font-bold text-md-primary flex items-center gap-2">
            <LayoutDashboard className="w-6 h-6" />
            <span>لوحة التحكم</span>
          </Link>
        </div>

        {/* Action Button: Add Product */}
        <div>
          <Link
            href="/dashboard/products"
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-md-full bg-md-primary text-md-primary-on font-semibold shadow-md-1 hover:opacity-95 transition-all text-sm"
          >
            <Plus className="w-5 h-5" />
            <span>إضافة منتج</span>
          </Link>
        </div>

        {/* Navigation Links */}
        <nav className="space-y-1">
          {baseLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href || (link.href !== "/dashboard" && pathname?.startsWith(link.href));

            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-md-md text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-md-primary-container text-md-primary-on-container font-semibold"
                    : "text-md-surface-on-variant hover:bg-md-surface-container-high hover:text-md-surface-on"
                }`}
              >
                <Icon className="w-5 h-5 text-current shrink-0" />
                <span className="truncate">{link.title}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Logout Footer Button */}
      <div className="pt-4 border-t border-md-outline/10">
        <button
          type="button"
          onClick={() => adminLogout()}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-md-md text-sm font-medium text-md-error hover:bg-md-error-container/30 transition-colors"
        >
          <LogOut className="w-5 h-5" />
          <span>تسجيل الخروج</span>
        </button>
      </div>
    </aside>
  );
}
