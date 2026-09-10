import { supabase } from "./supabase";
import { errorMessage, isMissingTableError } from "./hero";

export { errorMessage, isMissingTableError };

// See supabase/migrations/202609102000_create_admin_settings.sql. Singleton
// row — this id is the only one that will ever exist.
const SETTINGS_ROW_ID = "default";

export type AdminSettingsRow = {
  id: string;
  settings: Record<string, unknown>;
  updated_at: string;
};

export async function fetchAdminSettingsRow(): Promise<AdminSettingsRow | null> {
  const { data, error } = await supabase
    .from("admin_settings")
    .select("id, settings, updated_at")
    .eq("id", SETTINGS_ROW_ID)
    .maybeSingle();
  if (error) throw error;
  return data;
}

// Always writes the complete object — the caller (Settings.tsx) is
// responsible for merging with defaults before calling this, so a partial
// draft never overwrites fields the UI didn't touch.
export async function saveAdminSettingsRow(settings: Record<string, unknown>): Promise<void> {
  const { error } = await supabase
    .from("admin_settings")
    .update({ settings, updated_at: new Date().toISOString() })
    .eq("id", SETTINGS_ROW_ID);
  if (error) throw error;
}
