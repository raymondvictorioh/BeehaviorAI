import { createClient } from "@supabase/supabase-js";

// Use environment-specific Supabase configuration
// Development uses VITE_DEV_SUPABASE_* variables, production uses VITE_PROD_SUPABASE_* variables
const isDevelopment = import.meta.env.MODE === "development";

const supabaseUrl = isDevelopment
  ? (import.meta.env.VITE_DEV_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL)
  : (import.meta.env.VITE_PROD_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL);

const supabaseAnonKey = isDevelopment
  ? (import.meta.env.VITE_DEV_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY)
  : (import.meta.env.VITE_PROD_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY);

if (!supabaseUrl || !supabaseAnonKey) {
  const envPrefix = isDevelopment ? "VITE_DEV_" : "VITE_PROD_";
  console.error(
    `Missing Supabase credentials for ${isDevelopment ? "development" : "production"}. ` +
    `Please set ${envPrefix}SUPABASE_URL and ${envPrefix}SUPABASE_ANON_KEY environment variables.`
  );
}

export const supabase = createClient(supabaseUrl || "", supabaseAnonKey || "");
