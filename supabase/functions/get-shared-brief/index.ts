import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Public endpoint (verify_jwt = false): serves a READ-ONLY snapshot of an
// initiative for a valid, unrevoked share token. Uses the service role,
// so it must never return anything beyond this curated snapshot.
serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  try {
    const { token } = await req.json();
    if (!token || typeof token !== 'string' || token.length > 100) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    const { data: link } = await supabase.from('share_links').select('initiative_id, revoked, expires_at').eq('token', token).maybeSingle();
    if (!link || link.revoked) {
      return new Response(JSON.stringify({ error: 'This share link is invalid or has been revoked.' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    if (link.expires_at && new Date(link.expires_at).getTime() < Date.now()) {
      return new Response(JSON.stringify({ error: 'This share link has expired. Ask the initiative owner for a fresh one.' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    const id = link.initiative_id;
    const [init, brief, ingredients, strategies, milestones, team] = await Promise.all([
      supabase.from('initiatives').select('title, description, stage').eq('id', id).maybeSingle(),
      supabase.from('decision_briefs').select('problem_statement, target_group, goals, chosen_approach, evidence_base').eq('initiative_id', id).maybeSingle(),
      supabase.from('active_ingredients').select('name, description, is_core').eq('initiative_id', id),
      supabase.from('implementation_strategies').select('strategy_name, eric_category, target_barrier, status').eq('initiative_id', id),
      supabase.from('timeline_milestones').select('milestone, phase, target_date, status').eq('initiative_id', id).order('target_date'),
      supabase.from('initiative_team_members').select('role_in_initiative').eq('initiative_id', id),
    ]);
    return new Response(JSON.stringify({
      initiative: init.data,
      brief: brief.data,
      ingredients: ingredients.data || [],
      strategies: strategies.data || [],
      milestones: milestones.data || [],
      team: team.data || [],
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (error) {
    console.error('get-shared-brief error:', error);
    return new Response(JSON.stringify({ error: 'Could not load the shared plan.' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
