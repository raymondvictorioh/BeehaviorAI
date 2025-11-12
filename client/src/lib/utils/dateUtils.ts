import { format } from "date-fns";

/**
 * Date formatting utilities for BeehaviorAI
 *
 * Provides consistent date formatting across the application
 * following the dd-MM-yyyy format requirement specified in CLAUDE.md
 */

/**
 * Format a date as "dd-MM-yyyy HH:mm"
 * Used for log entries with timestamps
 *
 * @param date - Date string or Date object
 * @returns Formatted date string (e.g., "15-11-2025 14:30")
 *
 * @example
 * ```tsx
 * formatLogDate(new Date()) // "15-11-2025 14:30"
 * formatLogDate("2025-11-15T14:30:00") // "15-11-2025 14:30"
 * ```
 */
export function formatLogDate(date: string | Date): string {
  return format(new Date(date), "dd-MM-yyyy HH:mm");
}

/**
 * Format a date with time in readable format "dd-MM-yyyy 'at' h:mm a"
 * Used for detailed views with human-readable times
 *
 * @param date - Date string or Date object
 * @returns Formatted date string (e.g., "15-11-2025 at 2:30 PM")
 *
 * @example
 * ```tsx
 * formatDateTime(new Date()) // "15-11-2025 at 2:30 PM"
 * ```
 */
export function formatDateTime(date: string | Date): string {
  return format(new Date(date), "dd-MM-yyyy 'at' h:mm a");
}

/**
 * Format a date as "dd-MM-yyyy" only (no time)
 * Used for date-only displays
 *
 * @param date - Date string or Date object
 * @returns Formatted date string (e.g., "15-11-2025")
 *
 * @example
 * ```tsx
 * formatDateOnly(new Date()) // "15-11-2025"
 * ```
 */
export function formatDateOnly(date: string | Date): string {
  return format(new Date(date), "dd-MM-yyyy");
}

/**
 * Format time only as "HH:mm"
 * Used for time-only displays
 *
 * @param date - Date string or Date object
 * @returns Formatted time string (e.g., "14:30")
 *
 * @example
 * ```tsx
 * formatTimeOnly(new Date()) // "14:30"
 * ```
 */
export function formatTimeOnly(date: string | Date): string {
  return format(new Date(date), "HH:mm");
}

/**
 * Format time in 12-hour format "h:mm a"
 * Used for user-friendly time displays
 *
 * @param date - Date string or Date object
 * @returns Formatted time string (e.g., "2:30 PM")
 *
 * @example
 * ```tsx
 * formatTime12Hour(new Date()) // "2:30 PM"
 * ```
 */
export function formatTime12Hour(date: string | Date): string {
  return format(new Date(date), "h:mm a");
}
