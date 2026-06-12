// Shared auth + rate limiting for AI edge functions.
// verify_jwt accepts the public anon key, so every AI function must also
// resolve a real user and enforce per-user limits before spending tokens.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

export interface AiAuthResult {
  ok: boolean;
  userId?: string;
  response?: Response;
}

export async function authorizeAiRequest(
  req: Request,
  functionName: string,
  corsHeaders: Record<string, string>,
  limits: { perFiveMinutes: number; perDay: number } = { perFiveMinutes: 10, perDay: 200 },
): Promise<AiAuthResult> {
  const deny = (status: number, message: string): AiAuthResult => ({
    ok: false,
    response: new Response(JSON.stringify({ error: message }), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    }),
  });

  const authHeader = req.headers.get("Authorization") ?? "";
  const token = authHeader.replace(/^Bearer\s+/i, "").trim();
  if (!token) return deny(401, "Sign in to use AI features.");

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  // The anon key itself passes verify_jwt; it is not a user.
  if (token === anonKey) return deny(401, "Sign in to use AI features.");

  const authClient = createClient(supabaseUrl, anonKey);
  const { data, error } = await authClient.auth.getUser(token);
  if (error || !data?.user) return deny(401, "Sign in to use AI features.");
  const userId = data.user.id;

  const admin = createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
  const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const [{ count: recent }, { count: daily }] = await Promise.all([
    admin
      .from("ai_usage_log")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("function_name", functionName)
      .gte("created_at", fiveMinAgo),
    admin
      .from("ai_usage_log")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .gte("created_at", dayAgo),
  ]);

  if ((recent ?? 0) >= limits.perFiveMinutes || (daily ?? 0) >= limits.perDay) {
    return deny(429, "You have reached the AI usage limit. Try again in a few minutes.");
  }

  await admin.from("ai_usage_log").insert({ user_id: userId, function_name: functionName });
  return { ok: true, userId };
}
