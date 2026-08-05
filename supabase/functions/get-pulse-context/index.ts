import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

// PUBLIC, MINIMAL READ. Returns the two display strings a respondent needs to
// answer honestly: which initiative this is, and which practice is in focus.
//
// This is the ONLY read surface of Staff Pulse Links, and it is deliberately
// narrow. It returns names ONLY. Never add ids, team members, prior pulses,
// counts, or anything else here: the token travels by QR code and group text,
// so treat everything this returns as public to anyone who sees that link.
//
// Rationale for existing at all: without it the form asks "Did you use the
// practice this week?" with no statement of which practice, while the row it
// writes is tagged with a focus practice the respondent was never shown. That
// silently mislabels the data the Pulse Dashboard is built from.
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const schema = z.object({ token: z.string().min(8).max(64) });

const deny = (status: number, message: string) =>
  new Response(JSON.stringify({ error: message }), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { token } = schema.parse(await req.json());

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: link, error } = await admin
      .from("pulse_links")
      .select("revoked, expires_at, initiatives(name), active_ingredients(name)")
      .eq("token", token)
      .maybeSingle();

    if (error || !link) return deny(400, "This link is not valid.");
    if (link.revoked) return deny(400, "This link is closed.");
    if (link.expires_at && new Date(link.expires_at) < new Date()) return deny(400, "This link has expired.");

    // Names only. Nothing else leaves this function.
    const initiative = (link as any).initiatives?.name ?? null;
    const practice = (link as any).active_ingredients?.name ?? null;

    return new Response(JSON.stringify({ initiative, practice }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch {
    return deny(400, "This link is not valid.");
  }
});
