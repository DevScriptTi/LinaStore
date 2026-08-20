"use client";

import * as React from "react";
import { useTheme } from "next-themes";
import { Sun, Moon } from "lucide-react";

export function ThemeToggle({ className = "" }: { className?: string }) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <button
        type="button"
        className={`p-2 rounded-full text-md-surface-on hover:bg-md-surface-variant/20 transition-colors ${className}`}
        aria-label="Toggle theme"
      >
        <div className="w-5 h-5" />
      </button>
    );
  }

  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className={`p-2 rounded-full text-md-surface-on hover:bg-md-surface-variant/20 transition-colors focus:outline-none focus:ring-2 focus:ring-md-primary ${className}`}
      aria-label="Toggle theme"
      title={`Switch to ${isDark ? "Light" : "Dark"} Mode`}
    >
      {isDark ? (
        <Sun className="w-5 h-5 text-yellow-400 transition-all" />
      ) : (
        <Moon className="w-5 h-5 text-slate-700 transition-all" />
      )}
    </button>
  );
}
