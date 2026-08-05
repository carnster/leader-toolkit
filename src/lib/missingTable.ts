/** True when a Supabase/PostgREST error means the table does not exist yet.
 *
 *  New features ship code-first to the sibling deployment (the migration is
 *  pasted into its dashboard separately), so components built on new tables
 *  must degrade to a quiet "awaiting database update" state instead of an
 *  error screen when the SQL has not been run yet. */
export function isMissingTable(error: unknown): boolean {
  if (!error) return false;
  const e = error as { code?: string; message?: string };
  if (e.code === "42P01" || e.code === "PGRST205") return true;
  const msg = (e.message || "").toLowerCase();
  return msg.includes("does not exist") || msg.includes("could not find the table");
}
