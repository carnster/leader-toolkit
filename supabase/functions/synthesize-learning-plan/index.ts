import Anthropic from "npm:@anthropic-ai/sdk";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";
import { authorizeAiRequest } from "../_shared/auth.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const requestSchema = z.object({
  schoolYearStart: z.string().max(40).nullish(),
  initiatives: z.array(z.object({
    title: z.string().max(300),
    stage: z.string().max(40).nullish(),
    problem_statement: z.string().max(4000).nullish(),
    goals: z.string().max(4000).nullish(),
    target_group: z.string().max(1500).nullish(),
    active_ingredients: z.array(z.object({
      name: z.string().max(300),
      is_core: z.boolean().nullish(),
      look_fors: z.array(z.string()).nullish(),
    })).max(40).nullish(),
    strategies: z.array(z.object({
      strategy_name: z.string().max(300),
      eric_category: z.string().max(60).nullish(),
      implementation_phase: z.string().max(60).nullish(),
    })).max(60).nullish(),
    pd_activities: z.array(z.object({
      title: z.string().max(300),
      activity_type: z.string().max(120).nullish(),
    })).max(60).nullish(),
  })).min(1).max(12),
});

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const auth = await authorizeAiRequest(req, "synthesize-learning-plan", corsHeaders, { perFiveMinutes: 5, perDay: 50 });
    if (!auth.ok) return auth.response!;

    const body = await req.json();
    const { schoolYearStart, initiatives } = requestSchema.parse(body);
    const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
    if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not configured");
    const anthropic = new Anthropic({ apiKey });

    const yearStart = schoolYearStart || "the start of the school year";

    const systemPrompt = `You are an implementation scientist and a professional learning designer. You build a single, coherent, year-long professional learning plan that coordinates the staff learning required across one or more school improvement initiatives.

Your design principles:
- The unit of learning is a capability staff must build to implement an active ingredient with fidelity, not a topic to cover.
- Sequence learning by implementation phase: foundational and readiness learning is front-loaded, launch training comes as each initiative goes live, ongoing coaching and data routines run through the middle of the year, and peer-led, sustaining learning comes later.
- Support precedes monitoring. Staff are coached on a practice before anyone observes it.
- Respect staff capacity. This is the heart of a COLLECTIVE plan: when several initiatives demand learning in the same window, you coordinate and deconflict them into one realistic calendar rather than stacking competing demands. Name these collisions explicitly and resolve them.
- Use varied modalities: summer or pre-launch institutes, workshops, job-embedded coaching cycles, professional learning communities, observation debriefs, and train-the-trainer. Match the modality to the learning.
- Tie every learning block to the initiative or initiatives it serves and the specific capability or active ingredient it builds. Nothing generic.

Organize the plan into time periods across the school year starting at ${yearStart} (for example a pre-launch or summer period, then quarters or terms, then a sustaining period). Within each period, give the specific learning sessions.

Voice: clear, active, evidence-led. Never use em dashes; use a period or a semicolon. Be concise; every field is one or two sentences or a short phrase.`;

    const initiativeBlocks = initiatives.map((i, idx) => {
      const ings = (i.active_ingredients || []).map((a) => `${a.is_core ? "CORE " : ""}${a.name}`).join("; ") || "none recorded";
      const strats = (i.strategies || []).map((s) => `${s.strategy_name} [${s.implementation_phase || "unphased"}]`).join("; ") || "none recorded";
      const pds = (i.pd_activities || []).map((p) => p.title).join("; ") || "none recorded";
      return `INITIATIVE ${idx + 1}: ${i.title}
Stage: ${i.stage || "unspecified"}
Problem: ${i.problem_statement || "not specified"}
Goal: ${i.goals || "not specified"}
Who it serves: ${i.target_group || "not specified"}
Active ingredients (the capabilities staff must build): ${ings}
Implementation strategies (with phase): ${strats}
Professional learning already planned: ${pds}`;
    }).join("\n\n");

    const userPrompt = `Build one collective, comprehensive professional learning plan for the year for these ${initiatives.length} initiative(s). Coordinate the learning across all of them into a single realistic calendar that respects staff time. School year starts at ${yearStart}.

${initiativeBlocks}

Where the professional learning already planned exists, build on it rather than ignoring it. Where two or more initiatives need staff to learn the same kind of thing, combine the learning. Where they compete for the same window, deconflict and say so in the coordination notes.`;

    // Haiku occasionally serializes a nested array as a string; coerce defensively.
    const asArray = (v: unknown): any[] => {
      if (Array.isArray(v)) return v;
      if (typeof v === "string") { try { const p = JSON.parse(v); return Array.isArray(p) ? p : []; } catch { return []; } }
      return [];
    };
    const normalize = (raw: any) => ({
      overview: typeof raw?.overview === "string" ? raw.overview : "",
      themes: asArray(raw?.themes).filter((t) => typeof t === "string"),
      periods: asArray(raw?.periods).map((p: any) => ({
        label: p?.label ?? "",
        timeframe: p?.timeframe ?? "",
        focus: p?.focus ?? "",
        sessions: asArray(p?.sessions).map((s: any) => ({
          title: s?.title ?? "",
          initiatives: asArray(s?.initiatives).filter((x) => typeof x === "string"),
          capability: s?.capability ?? "",
          modality: s?.modality ?? "",
          audience: s?.audience ?? "",
          cadence: s?.cadence ?? "",
          rationale: s?.rationale ?? "",
        })),
      })).filter((p) => p.label || p.sessions.length),
      coordination_notes: asArray(raw?.coordination_notes).filter((t) => typeof t === "string"),
    });

    const callModel = () => anthropic.messages.create({
        model: "claude-haiku-4-5",
        max_tokens: 8192,
        system: systemPrompt,
        messages: [{ role: "user", content: userPrompt }],
        tools: [{
          name: "provide_learning_plan",
          description: "Return the structured year-long professional learning plan",
          input_schema: {
            type: "object",
            properties: {
              overview: { type: "string", description: "2 to 4 sentences: the through-line of the year and how the initiatives' learning fits together" },
              themes: { type: "array", items: { type: "string" }, description: "3 to 5 cross-cutting learning themes for the year" },
              periods: {
                type: "array",
                description: "Time periods across the school year, in order",
                items: {
                  type: "object",
                  properties: {
                    label: { type: "string", description: "e.g. Summer Institute, Quarter 1, Sustaining" },
                    timeframe: { type: "string", description: "e.g. August, September to November" },
                    focus: { type: "string", description: "one line: the focus of learning in this period" },
                    sessions: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          title: { type: "string" },
                          initiatives: { type: "array", items: { type: "string" }, description: "which initiative title(s) this serves" },
                          capability: { type: "string", description: "the capability or active ingredient it builds" },
                          modality: { type: "string", description: "workshop, coaching cycle, PLC, observation debrief, institute, train-the-trainer" },
                          audience: { type: "string", description: "who attends" },
                          cadence: { type: "string", description: "one-time, weekly, monthly, etc." },
                          rationale: { type: "string", description: "one line: why now and why this way" },
                        },
                        required: ["title", "initiatives", "capability", "modality", "audience"],
                        additionalProperties: false,
                      },
                    },
                  },
                  required: ["label", "timeframe", "focus", "sessions"],
                  additionalProperties: false,
                },
              },
              coordination_notes: {
                type: "array",
                items: { type: "string" },
                description: "Explicit notes on deconflicting competing demands and protecting staff capacity across initiatives",
              },
            },
            required: ["overview", "periods", "coordination_notes"],
            additionalProperties: false,
          },
        }],
        tool_choice: { type: "tool", name: "provide_learning_plan" },
      });

    // Up to two attempts: accept the first that yields a real period list.
    let plan: ReturnType<typeof normalize> | null = null;
    try {
      for (let attempt = 0; attempt < 2; attempt++) {
        const msg = await callModel();
        const toolUse = msg.content.find((b): b is Anthropic.ToolUseBlock => b.type === "tool_use");
        const candidate = normalize(toolUse?.input);
        if (candidate.periods.length > 0) { plan = candidate; break; }
      }
    } catch (apiError) {
      if (apiError instanceof Anthropic.APIError) {
        console.error("Anthropic APIError", apiError.status, apiError.message);
        const m = apiError.status === 429 ? "Rate limit exceeded. Please try again in a moment."
          : apiError.status === 402 ? "AI credits exhausted. Please add credits to continue."
          : `AI request failed (${apiError.status}): ${apiError.message}`;
        return new Response(JSON.stringify({ error: m }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      throw apiError;
    }

    if (!plan || plan.periods.length === 0) {
      return new Response(JSON.stringify({ error: "The plan came back empty. Please try again." }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ plan }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in synthesize-learning-plan:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Failed to synthesize learning plan" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
