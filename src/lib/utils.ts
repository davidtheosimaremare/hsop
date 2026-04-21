import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getProductSlug(product: { sku: string }) {
  if (!product?.sku) return "";
  // Ganti / jadi - agar url tidak rusak di NextJS
  return product.sku.replaceAll("/", "-");
}

/**
 * Formats a raw description or text to be more readable.
 * - Trims extra whitespace
 * - Normalizes line breaks
 * - Capitalizes the first letter of sentences
 * - Converts plain text with line breaks to basic HTML paragraphs/breaks if it's not already HTML
 */
export function formatRichText(text: string): string {
  if (!text) return "";

  // Check if it looks like HTML
  const isHtml = /<[a-z][\s\S]*>/i.test(text);

  if (isHtml) {
    // If it's already HTML, we still want to clean it a bit but be careful
    return text.trim();
  }

  // Handle plain text
  let formatted = text
    .trim()
    .replace(/\r\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n"); // Max 2 consecutive newlines

  // Basic sentence capitalization
  // Matches start of string or after a punctuation (., !, ?) followed by whitespace
  formatted = formatted.replace(/(^|[.!?]\s+)([a-z])/g, (match, p1, p2) => {
    return p1 + p2.toUpperCase();
  });

  // Convert to HTML
  return formatted
    .split("\n\n")
    .map(para => `<p>${para.replace(/\n/g, "<br />")}</p>`)
    .join("");
}
