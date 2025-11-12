/**
 * Centralized color utilities for BeehaviorAI
 *
 * This file consolidates all color mapping logic used across the application
 * for behavior categories, academic categories, and other color-coded elements.
 */

// ==========================================
// COLOR MAP - Main color mapping
// ==========================================

export const COLOR_MAP: Record<string, string> = {
  green: "bg-green-500",
  blue: "bg-blue-500",
  amber: "bg-amber-500",
  red: "bg-red-500",
  purple: "bg-purple-500",
  pink: "bg-pink-500",
  orange: "bg-orange-500",
  teal: "bg-teal-500",
  indigo: "bg-indigo-500",
};

// ==========================================
// COLOR OPTIONS - For dropdowns and selects
// ==========================================

export interface ColorOption {
  value: string;
  label: string;
  class: string;
}

export const COLOR_OPTIONS: ColorOption[] = [
  { value: "green", label: "Green", class: "bg-green-500" },
  { value: "blue", label: "Blue", class: "bg-blue-500" },
  { value: "amber", label: "Amber", class: "bg-amber-500" },
  { value: "red", label: "Red", class: "bg-red-500" },
  { value: "purple", label: "Purple", class: "bg-purple-500" },
  { value: "pink", label: "Pink", class: "bg-pink-500" },
  { value: "orange", label: "Orange", class: "bg-orange-500" },
  { value: "teal", label: "Teal", class: "bg-teal-500" },
  { value: "indigo", label: "Indigo", class: "bg-indigo-500" },
];

// ==========================================
// HELPER FUNCTIONS
// ==========================================

/**
 * Get Tailwind CSS background color class from color name
 * @param color - Color name (e.g., "green", "blue", "amber")
 * @returns Tailwind CSS class (e.g., "bg-green-500")
 */
export function getColorClass(color: string | null | undefined): string {
  return color ? COLOR_MAP[color] || "bg-gray-500" : "bg-gray-500";
}

/**
 * Get Tailwind CSS border color class from color name
 * @param color - Color name (e.g., "green", "blue", "amber")
 * @returns Tailwind CSS border class (e.g., "border-green-500")
 */
export function getBorderColorClass(color: string | null | undefined): string {
  const bgClass = getColorClass(color);
  return bgClass.replace("bg-", "border-");
}

// ==========================================
// LEGACY CATEGORY COLORS
// ==========================================

/**
 * Legacy behavior category color mapping
 * Used for older behavior log entries that may use string category names
 * @deprecated Use category.color with getColorClass() instead
 */
export const BEHAVIOR_CATEGORY_COLORS: Record<string, string> = {
  positive: "bg-positive",
  neutral: "bg-primary",
  concern: "bg-yellow-500",
  serious: "bg-destructive",
};

/**
 * Get color class for legacy behavior category string
 * @param category - Category name ("positive", "neutral", "concern", "serious")
 * @returns Tailwind CSS class
 * @deprecated Use category.color with getColorClass() instead
 */
export function getLegacyBehaviorColor(category: string): string {
  return BEHAVIOR_CATEGORY_COLORS[category] || "bg-gray-500";
}
