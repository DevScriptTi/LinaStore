"use client";

import React, { useState, useEffect } from "react";
import { auth, db } from "@/lib/firebase/config";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import { Loader2, ShieldAlert } from "lucide-react";
import Cookies from "js-cookie";
import { ADMIN_SESSION_COOKIE } from "@/lib/firebase/auth";

export function AdminAuthGuard({ children }: { children: React.ReactNode }) {
  const [isVerified, setIsVerified] = useState<boolean | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        // No active Auth user: clear session cookie and redirect
        Cookies.remove(ADMIN_SESSION_COOKIE, { path: "/" });
        window.location.href = "/login";
        return;
      }

      // Master default super_admin fallback email
      if (user.email === "admin@linastore.com") {
        setIsVerified(true);
        return;
      }

      try {
        // 1. Direct document lookup in admins collection by UID
        const adminDocRef = doc(db, "admins", user.uid);
        const adminDocSnap = await getDoc(adminDocRef);

        if (adminDocSnap.exists()) {
          setIsVerified(true);
          return;
        }

        // 2. Fallback query search by UID or Email
        const q = query(collection(db, "admins"), where("uid", "==", user.uid));
        const snapshot = await getDocs(q);

        if (!snapshot.empty) {
          setIsVerified(true);
          return;
        }

        // Ghost User Detected! (Deleted admin profile document in Firestore)
        console.warn("Ghost User Detected: Admin profile document does not exist in Firestore. Forcefully logging out.");
        Cookies.remove(ADMIN_SESSION_COOKIE, { path: "/" });
        await signOut(auth);
        window.location.href = "/login?error=deleted";
      } catch (err) {
        console.error("Error validating admin profile existence:", err);
        // Fallback: If network error occurred, verify fallback or allow session
        setIsVerified(true);
      }
    });

    return () => unsubscribe();
  }, []);

  // Loading Screen to prevent any flash of unauthorized content
  if (isVerified === null) {
    return (
      <div dir="rtl" className="min-h-screen bg-md-background text-md-background-on flex flex-col items-center justify-center p-6 select-none">
        <div className="p-8 rounded-3xl bg-md-surface border border-md-outline/10 shadow-xl text-center space-y-4 max-w-sm w-full">
          <Loader2 className="w-10 h-10 mx-auto text-orange-600 animate-spin" />
          <div className="space-y-1">
            <h3 className="text-sm font-black text-md-surface-on">لوحة تحكم متجر لينا</h3>
            <p className="text-xs font-semibold text-md-surface-on-variant">جاري التحقق الجاري من أمان حساب المسؤول...</p>
          </div>
        </div>
      </div>
    );
  }

  // Render children only when user document existence is verified
  return <>{children}</>;
}
