import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Basic mobile number normalization: strip non-digits except leading + and collapse spaces
export function normalizeMobileNumber(input: string): string {
  if (!input) return '';
  const trimmed = input.trim();
  // Preserve leading + for international format
  const plus = trimmed.startsWith('+') ? '+' : '';
  const digits = trimmed.replace(/[^0-9]/g, '');
  return plus + digits;
}
