import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getProductSlug(product: { name: string, sku: string, brand?: string | null }) {
  const isSiemens = product.brand?.toLowerCase() === 'siemens' ||
    product.name.toLowerCase().includes('siemens');

  if (isSiemens) {
    return `siemens-${product.sku}`;
  }

  const firstWord = product.name.trim().split(/\s+/)[0].toLowerCase();
  return `${firstWord}-${product.sku}`;
}
