import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Merge Tailwind CSS classes with clsx
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format currency with symbol
 */
export function formatCurrency(amount: number, currency: string = "USD"): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
  }).format(amount)
}

/**
 * Format date to readable string
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(d)
}

/**
 * Calculate percentage
 */
export function calculatePercentage(value: number, total: number): number {
  if (total === 0) return 0
  return (value / total) * 100
}

/**
 * Get color based on budget variance (green if under, red if over)
 */
export function getVarianceColor(variance: number): string {
  if (variance < 0) return "text-green-500"
  if (variance > 0) return "text-red-500"
  return "text-gray-500"
}

/**
 * Get budget utilization color
 */
export function getBudgetColor(percentage: number): string {
  if (percentage < 70) return "text-green-500"
  if (percentage < 90) return "text-yellow-500"
  return "text-red-500"
}
