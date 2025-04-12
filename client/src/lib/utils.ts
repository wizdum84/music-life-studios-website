import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format a price amount in cents to a currency string
 * @param price Price in cents
 * @param currency Currency code
 * @returns Formatted price string
 */
export function formatPrice(price: number, currency: string = "USD") {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(price / 100)
}
