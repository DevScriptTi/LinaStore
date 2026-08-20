import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merges CSS class names using clsx and tailwind-merge
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format currency amount in Algerian Dinar (د.ج)
 */
export function formatCurrency(amount: number, suffix = "د.ج"): string {
  if (isNaN(amount) || amount === null || amount === undefined) return `0 ${suffix}`;
  return `${new Intl.NumberFormat("fr-DZ").format(amount)} ${suffix}`;
}
