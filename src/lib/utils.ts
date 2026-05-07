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

  // Replace non-breaking spaces (HTML entities and unicode characters) with normal spaces to prevent layout breaking
  let cleanText = text
    .replace(/&nbsp;/gi, " ")
    .replace(/&#160;/g, " ")
    .replace(/\u00a0/g, " ");

  // Strip inline style attributes to preserve website's uniform color and typography
  cleanText = cleanText
    .replace(/style="[^"]*"/gi, "")
    .replace(/style='[^']*'/gi, "");

  // Strip font tags (replace <font color="...">text</font> with text)
  cleanText = cleanText
    .replace(/<font[^>]*>/gi, "")
    .replace(/<\/font>/gi, "");

  // Technical keywords for Siemens items
  const techKeywords = [
    "frame size",
    "\\d+-poles?",
    "In\\s*=\\s*\\d+",
    "breaking capacity",
    "Trip unit",
    "Protection",
    "incl\\.",
    "rear connection",
    "without Com",
    "Manual operating",
    "without Spring",
    "Ready-to-close",
    "Auxiliary switches",
    "without Closing",
    "without Remote",
    "without 2nd",
    "without 1st",
    "Option [A-Z0-9]+",
    "rated current",
    "operating mechanism"
  ];

  // Apply smart line splitting for dense technical texts
  for (const keyword of techKeywords) {
    const regex = new RegExp(`,\\s*(${keyword})`, "gi");
    cleanText = cleanText.replace(regex, (match, p1) => {
      const capitalized = p1.charAt(0).toUpperCase() + p1.slice(1);
      return `<br /><span class="text-red-600 font-black select-none mr-1.5">▪</span> ${capitalized}`;
    });
  }

  // Check if it looks like HTML
  const isHtml = /<[a-z][\s\S]*>/i.test(cleanText);

  if (isHtml) {
    // If it's already HTML, we still want to clean it a bit but be careful
    return cleanText.trim();
  }

  // Handle plain text
  let formatted = cleanText
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
