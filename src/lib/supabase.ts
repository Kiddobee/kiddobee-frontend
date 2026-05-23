import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://zmcqzbubpjsgzvanehdz.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InptY3F6YnVicGpzZ3p2YW5laGR6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkzMDkzNzMsImV4cCI6MjA5NDg4NTM3M30.814nIzgKM27jaasOTBpNxAlR8EWHTJH5yP4thJrVFLQ";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { persistSession: true },
});

/** Read first matching key from a row (supports snake/camel/Pascal variants). */
export function pick<T = unknown>(row: Record<string, unknown> | null | undefined, ...keys: string[]): T | undefined {
  if (!row) return undefined;
  for (const k of keys) {
    if (row[k] !== undefined && row[k] !== null && row[k] !== "") return row[k] as T;
  }
  return undefined;
}

export function fullName(row: Record<string, unknown> | null | undefined): string {
  if (!row) return "—";
  const direct = pick<string>(row, "name", "fullName", "full_name", "displayName");
  if (direct) return direct;
  const first = pick<string>(row, "First Name", "firstName", "first_name", "given_name");
  const last = pick<string>(row, "Last Name", "lastName", "last_name", "family_name", "surname");
  const joined = [first, last].filter(Boolean).join(" ").trim();
  return joined || (pick<string>(row, "email") ?? "—");
}

export function fmtDate(v: unknown, locale = "fr-FR"): string {
  if (!v) return "—";
  const d = new Date(v as string);
  if (isNaN(d.getTime())) return String(v);
  return d.toLocaleDateString(locale, { year: "numeric", month: "short", day: "2-digit" });
}

export function fmtDateTime(v: unknown, locale = "fr-FR"): string {
  if (!v) return "—";
  const d = new Date(v as string);
  if (isNaN(d.getTime())) return String(v);
  return d.toLocaleString(locale, { year: "numeric", month: "short", day: "2-digit", hour: "2-digit", minute: "2-digit" });
}
