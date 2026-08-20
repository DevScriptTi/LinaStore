import { auth } from "@/lib/firebase/config";
import { signInWithEmailAndPassword, signOut as firebaseSignOut } from "firebase/auth";
import Cookies from "js-cookie";

export const ADMIN_SESSION_COOKIE = "admin_session";

/**
 * Admin Login helper function with Firebase Auth & Cookie Session Management
 */
export async function adminLogin(email: string, pass: string) {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, pass);
    const idToken = await userCredential.user.getIdToken();
    
    // Store session cookie (expires in 7 days) for Edge Middleware verification
    Cookies.set(ADMIN_SESSION_COOKIE, idToken || userCredential.user.uid, {
      expires: 7,
      path: "/",
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });

    return { user: userCredential.user, error: null };
  } catch (err: unknown) {
    let errorMessage = "حدث خطأ أثناء تسجيل الدخول. يرجى التحقق من البيانات.";
    if (err instanceof Error) {
      if (err.message.includes("auth/invalid-credential") || err.message.includes("auth/wrong-password")) {
        errorMessage = "البريد الإلكتروني أو كلمة المرور غير صحيحة.";
      } else if (err.message.includes("auth/user-not-found")) {
        errorMessage = "الحساب غير موجود.";
      } else if (err.message.includes("auth/too-many-requests")) {
        errorMessage = "محاولات كثيرة خاطئة. يرجى المحاولة لاحقاً.";
      }
    }
    return { user: null, error: errorMessage };
  }
}

/**
 * Admin Logout helper function
 */
export async function adminLogout() {
  try {
    Cookies.remove(ADMIN_SESSION_COOKIE, { path: "/" });
    await firebaseSignOut(auth);
  } catch (error) {
    console.error("Logout error:", error);
  } finally {
    window.location.href = "/login";
  }
}
