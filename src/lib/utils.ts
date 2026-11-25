import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, currency = 'INR'): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(amount);
}

export function formatDate(date: string | Date, format = 'dd MMM yyyy'): string {
  const d = new Date(date);
  return d.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function formatDateTime(date: string | Date): string {
  const d = new Date(date);
  return d.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function truncate(str: string, length = 50): string {
  if (str.length <= length) return str;
  return `${str.slice(0, length)}...`;
}

export function debounce<T extends (...args: any[]) => any>(fn: T, delay: number) {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn(...args), delay);
  };
}

// ---------------------------------------------------------------------------
// Indian mobile number helpers
// A valid Indian mobile number is 10 digits and starts with 6, 7, 8 or 9.
// ---------------------------------------------------------------------------
export const INDIAN_MOBILE_REGEX = /^[6-9]\d{9}$/;

/**
 * Keeps only digits while typing/pasting and strips a leading +91 / 91 / 0
 * prefix, so the stored value is always the plain 10-digit number.
 */
export function sanitizeMobileInput(value: string): string {
  let digits = (value || '').replace(/\D/g, '');
  if (digits.length === 12 && digits.startsWith('91')) digits = digits.slice(2);
  else if (digits.length === 11 && digits.startsWith('0')) digits = digits.slice(1);
  return digits.slice(0, 10);
}

export function isValidIndianMobile(value: string): boolean {
  return INDIAN_MOBILE_REGEX.test(sanitizeMobileInput(value));
}

/** Returns an error message, or '' when the value is acceptable. */
export function getMobileError(value: string, required = false, label = 'Mobile number'): string {
  const v = sanitizeMobileInput(value);
  if (!v) return required ? `${label} is required` : '';
  if (!INDIAN_MOBILE_REGEX.test(v)) return `${label} must be a valid 10-digit Indian number starting with 6-9`;
  return '';
}
