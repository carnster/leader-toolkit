import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

// PUBLIC, WRITE-ONLY. This function is the entire public surface of Staff Pulse
// Links. It validates a link token with the service role, inserts exactly one
// pulse, and returns a bare acknowledgement. It NEVER reads initiative, team, or
// prior-pulse data back to the caller. That is the security invariant of the
// feature; do not add a read path.
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const schema = z.object({
  token: z.string().min(8).max(64),
  used_status: z.enum(["yes", "partly", "not_yet"]),
  traction: z.number().int().min(1).max(4),
  needs_support: z.string().max(2000).nullish(),
  respondent_name: z.string().max(120).nullish(),
  client_key: z.string().min(6).max(64),
});

/** Monday of the current week (UTC), as yyyy-MM-dd. */
function mondayOf(): string {
  const d = new Date();
  const day = (d.getUTCDay() + 6) % 7; // 0 = Monday
  d.setUTCDate(d.getUTCDate() - day);
  return d.toISOString().slice(0, 10);
}

const deny = (status: number, message: string) =>
  new Response(JSON.stringify({ error: message }), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json();
    const input = schema.parse(body);

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // 1. validate the token (service role; bypasses RLS)
    const { data: link, error: linkErr } = await admin
      .from("pulse_links")
      .select("id, initiative_id, active_ingredient_id, revoked, expires_at")
      .eq("token", input.token)
      .maybeSingle();

    if (linkErr || !link) return deny(400, "This link is not valid.");
    if (link.revoked) return deny(400, "This link is closed.");
    if (link.expires_at && new Date(link.expires_at) < new Date()) return deny(400, "This link has expired.");

    // 2. insert one pulse, de-duped per browser per week
    const row = {
      initiative_id: link.initiative_id,
      respondent_id: null,
      respondent_name: input.respondent_name?.trim() || null,
      week_of: mondayOf(),
      focus_ingredient_id: link.active_ingredient_id,
      used_status: input.used_status,
      traction: input.traction,
      needs_support: input.needs_support?.trim() || null,
      via_link_id: link.id,
      client_key: input.client_key,
      updated_at: new Date().toISOString(),
    };
    const { error: insErr } = await admin
      .from("pulse_checkins")
      .upsert(row, { onConflict: "via_link_id,client_key,week_of" });

    if (insErr) {
      console.error("pulse insert failed:", insErr.message);
      return deny(500, "Could not save your pulse. Please try again.");
    }

    // 3. bare acknowledgement. No initiative data, ever.
    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return deny(400, e instanceof z.ZodError ? "Please answer all the questions." : "Something went wrong.");
  }
});
