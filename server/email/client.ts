import { Resend } from "resend";

/**
 * Resend Email Client Configuration
 *
 * Requires RESEND_API_KEY environment variable
 * Get your API key from https://resend.com/api-keys
 */

const RESEND_API_KEY = process.env.RESEND_API_KEY || "";

if (!RESEND_API_KEY) {
  console.warn(
    "⚠️  RESEND_API_KEY environment variable is not set. Email sending will fail."
  );
}

export const resend = new Resend(RESEND_API_KEY);

/**
 * Email sender configuration
 * Update this with your verified domain
 */
export const FROM_EMAIL = "BeehaviorAI <noreply@hello.relyant.app>";

/**
 * Base URL for the application
 * Used to generate invitation links
 */
export const APP_URL = process.env.APP_URL || "http://localhost:5000";
