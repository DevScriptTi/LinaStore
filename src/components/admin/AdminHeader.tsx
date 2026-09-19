"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { INotification } from "@/types";
import { db } from "@/lib/firebase/config";
import { collection, query, orderBy, limit, onSnapshot, doc, updateDoc } from "firebase/firestore";
import { Bell, Store, CheckCheck, ShoppingBag, Clock, ExternalLink, Menu } from "lucide-react";

const mockNotifications: INotification[] = [
  {
    id: "n-1",
    title: "طلب جديد! 🎉",
    message: "قام فوزي جعفري بطلب جديد من 04 - Oum el bouaghi",
    isRead: false,
    type: "new_order",
    link: "/dashboard/orders",
    createdAt: new Date(),
  },
  {
    id: "n-2",
    title: "طلب جديد! 🎉",
    message: "قامت ياسمين بن علي بطلب جديد من 16 - Alger",
    isRead: true,
    type: "new_order",
    link: "/dashboard/orders",
    createdAt: new Date(Date.now() - 3600000 * 2),
  },
];

interface AdminHeaderProps {
  onToggleSidebar?: () => void;
}

export function AdminHeader({ onToggleSidebar }: AdminHeaderProps) {
  const router = useRouter();
  const [notifications, setNotifications] = useState<INotification[]>([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Click outside to close notification dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Real-time Notifications Listener
  useEffect(() => {
    try {
      const q = query(collection(db, "notifications"), orderBy("createdAt", "desc"), limit(10));
      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          if (!snapshot.empty) {
            const list: INotification[] = snapshot.docs.map((d) => ({
              id: d.id,
              ...(d.data() as Omit<INotification, "id">),
            }));
            setNotifications(list);
          } else {
            setNotifications(mockNotifications);
          }
        },
        (err) => {
          console.warn("Notifications onSnapshot fallback to mock:", err);
          setNotifications(mockNotifications);
        }
      );

      return () => unsubscribe();
    } catch (err) {
      console.warn("Notifications setup error fallback to mock:", err);
      setNotifications(mockNotifications);
    }
  }, []);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const handleMarkAsRead = async (notif: INotification) => {
    if (notif.id && !notif.isRead) {
      try {
        await updateDoc(doc(db, "notifications", notif.id), { isRead: true });
        setNotifications((prev) =>
          prev.map((n) => (n.id === notif.id ? { ...n, isRead: true } : n))
        );
      } catch (err) {
        console.warn("Mark notification read error:", err);
        setNotifications((prev) =>
          prev.map((n) => (n.id === notif.id ? { ...n, isRead: true } : n))
        );
      }
    }

    if (notif.link) {
      setIsDropdownOpen(false);
      router.push(notif.link);
    }
  };

  const handleMarkAllAsRead = async () => {
    const unreadList = notifications.filter((n) => !n.isRead);
    if (unreadList.length === 0) return;

    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));

    const updatePromises = unreadList.map((n) => {
      if (n.id) {
        return updateDoc(doc(db, "notifications", n.id), { isRead: true }).catch(() => {});
      }
      return Promise.resolve();
    });

    await Promise.all(updatePromises);
  };

  const formatDate = (dateVal: any) => {
    if (!dateVal) return "الآن";
    let d: Date;
    if (dateVal?.toDate && typeof dateVal.toDate === "function") {
      d = dateVal.toDate();
    } else if (dateVal instanceof Date) {
      d = dateVal;
    } else {
      d = new Date(dateVal);
    }
    if (isNaN(d.getTime())) return "قبل قليل";
    return d.toLocaleTimeString("ar-DZ", { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <header className="h-16 border-b border-md-outline/10 bg-md-surface/80 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between sticky top-0 z-20 select-none" dir="rtl">
      <div className="flex items-center gap-3">
        {/* Mobile Hamburger Toggle Button */}
        <button
          type="button"
          onClick={onToggleSidebar}
          className="lg:hidden p-2 rounded-xl text-md-surface-on hover:bg-md-surface-container-high transition-colors focus:outline-none"
          title="فتح القائمة"
        >
          <Menu className="w-6 h-6" />
        </button>

        <h1 className="text-sm sm:text-lg font-bold text-md-surface-on truncate">
          متجر لينا <span className="hidden sm:inline">- لوحة التحكم</span>
        </h1>
      </div>

      <div className="flex items-center gap-4">
        {/* Real-time Notifications Bell Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="relative p-2 rounded-full hover:bg-md-surface-container-high text-md-surface-on transition-colors focus:outline-none"
            title="الإشعارات"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-red-600 text-white font-black text-[10px] flex items-center justify-center animate-pulse shadow-md">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Floating Dropdown Menu */}
          {isDropdownOpen && (
            <div className="absolute left-0 mt-2 w-80 sm:w-96 bg-md-surface border border-md-outline/20 rounded-2xl shadow-2xl overflow-hidden z-50 animate-in fade-in zoom-in-95">
              
              {/* Header */}
              <div className="px-4 py-3 border-b border-md-outline/10 bg-md-surface-container-low flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4 text-md-primary" />
                  <span className="text-xs font-bold text-md-surface-on">الإشعارات والتنبيهات</span>
                  {unreadCount > 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-red-500/15 text-red-600 dark:text-red-400 font-extrabold text-[10px]">
                      {unreadCount} جديد
                    </span>
                  )}
                </div>

                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={handleMarkAllAsRead}
                    className="text-[11px] font-bold text-md-primary hover:underline flex items-center gap-1"
                  >
                    <CheckCheck className="w-3.5 h-3.5" />
                    <span>تحديد الكل كمقروء</span>
                  </button>
                )}
              </div>

              {/* Notifications List */}
              <div className="max-h-80 overflow-y-auto divide-y divide-md-outline/10">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-xs text-md-surface-on-variant space-y-2">
                    <Bell className="w-8 h-8 mx-auto opacity-40" />
                    <p>لا توجد إشعارات حالياً</p>
                  </div>
                ) : (
                  notifications.map((notif) => (
                    <div
                      key={notif.id || notif.title}
                      onClick={() => handleMarkAsRead(notif)}
                      className={`p-3.5 hover:bg-md-surface-container-high transition-colors cursor-pointer flex items-start gap-3 ${
                        !notif.isRead ? "bg-orange-500/5 dark:bg-orange-950/20" : ""
                      }`}
                    >
                      <div className="p-2 rounded-xl bg-orange-100 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400 shrink-0 mt-0.5">
                        <ShoppingBag className="w-4 h-4" />
                      </div>

                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-extrabold text-md-surface-on truncate">
                            {notif.title}
                          </h4>
                          <span className="text-[10px] text-md-surface-on-variant flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatDate(notif.createdAt)}
                          </span>
                        </div>

                        <p className="text-xs text-md-surface-on-variant line-clamp-2 leading-relaxed">
                          {notif.message}
                        </p>
                      </div>

                      {!notif.isRead && (
                        <span className="w-2 h-2 rounded-full bg-orange-500 shrink-0 mt-2" />
                      )}
                    </div>
                  ))
                )}
              </div>

              {/* Footer */}
              <div className="p-2.5 border-t border-md-outline/10 bg-md-surface-container-low text-center">
                <Link
                  href="/dashboard/orders"
                  onClick={() => setIsDropdownOpen(false)}
                  className="text-xs font-bold text-md-primary hover:underline flex items-center justify-center gap-1"
                >
                  <span>عرض جميع الطلبات</span>
                  <ExternalLink className="w-3 h-3" />
                </Link>
              </div>

            </div>
          )}
        </div>

        {/* Dark/Light Theme Toggle */}
        <ThemeToggle />

        {/* Leave Dashboard Button */}
        <Link
          href="/"
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-md-full bg-md-surface-container-high text-md-surface-on text-xs font-semibold hover:bg-md-surface-container-highest transition-colors border border-md-outline/20"
        >
          <Store className="w-4 h-4 text-md-primary" />
          <span>مغادرة لوحة التحكم</span>
        </Link>
      </div>
    </header>
  );
}
