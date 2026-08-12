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
  // Fallback for clients that strip the code. Deliberately narrow: a generic
  // "does not exist" match would also catch missing-COLUMN errors (42703,
  // 'column "x" of relation "y" does not exist') and hide a real schema bug
  // behind the quiet "awaiting database update" card.
  const msg = (e.message || "").toLowerCase();
  return msg.includes("could not find the table") ||
    (msg.includes("relation") && msg.includes("does not exist") && !msg.includes("column"));
}

/** True when the error means a *column* does not exist yet.
 *
 *  New columns ship code-first too: a feature is deployed before its migration
 *  is pasted into the sibling database. A read that names a not-yet-migrated
 *  column, or a write that includes one, must degrade quietly (show the small
 *  "activates after the next database update" state, or retry the write without
 *  the column) instead of surfacing a red error.
 *
 *  Two shapes reach the client: a direct SQL error (42703, 'column "x" does not
 *  exist') on reads, and the PostgREST schema-cache miss (PGRST204, "Could not
 *  find the 'x' column of 'y' in the schema cache") on writes. */
export function isMissingColumn(error: unknown): boolean {
  if (!error) return false;
  const e = error as { code?: string; message?: string };
  if (e.code === "42703" || e.code === "PGRST204") return true;
  const msg = (e.message || "").toLowerCase();
  return (msg.includes("column") && msg.includes("does not exist")) ||
    (msg.includes("could not find") && msg.includes("column") && msg.includes("schema cache"));
}
