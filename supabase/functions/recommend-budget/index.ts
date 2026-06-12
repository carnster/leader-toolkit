import Anthropic from "npm:@anthropic-ai/sdk";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { authorizeAiRequest } from "../_shared/auth.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface BudgetRecommendation {
  category: string;
  description: string;
  estimated_cost: number;
  funding_source: string;
  notes: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const auth = await authorizeAiRequest(req, "recommend-budget", corsHeaders, { perFiveMinutes: 10, perDay: 200 });
    if (!auth.ok) return auth.response!;

    // Read data as the caller, not the service role, so RLS enforces
    // initiative membership: a user can only budget their own initiatives.
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabase = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: req.headers.get("Authorization")! } },
    });

    const { initiativeId } = await req.json();

    // Fetch initiative context
    const { data: initiative, error: initiativeError } = await supabase
      .from("initiatives")
      .select("*")
      .eq("id", initiativeId)
      .single();

    if (initiativeError) throw initiativeError;

    // Fetch decision brief
    const { data: brief } = await supabase
      .from("decision_briefs")
      .select("*")
      .eq("initiative_id", initiativeId)
      .single();

    // Fetch strategies, team members, and PD activities for context
    const { data: strategies } = await supabase
      .from("implementation_strategies")
      .select("*")
      .eq("initiative_id", initiativeId);

    const { data: teamMembers } = await supabase
      .from("initiative_team_members")
      .select("*")
      .eq("initiative_id", initiativeId);

    const { data: pdActivities } = await supabase
      .from("pd_activities")
      .select("*")
      .eq("initiative_id", initiativeId);

    // Build context for AI
    const context = `
Initiative: ${initiative.title}
Description: ${initiative.description || "Not provided"}
Problem: ${brief?.problem_statement || "Not provided"}
Chosen Approach: ${brief?.chosen_approach || "Not provided"}
Number of Team Members: ${teamMembers?.length || 0}
Number of Strategies: ${strategies?.length || 0}
Number of PD Activities: ${pdActivities?.length || 0}
Target Group: ${brief?.target_group || "Not specified"}
`;

    const systemPrompt = `You are an expert education implementation budget consultant. Analyze the initiative context and recommend a comprehensive budget with realistic cost estimates.

Consider these typical budget categories for school/district implementation initiatives:
- Personnel (substitute teachers, coaching stipends, additional staff)
- Professional Development (workshops, training materials, facilitator fees)
- Materials & Resources (curriculum materials, instructional resources, supplies)
- Technology (software licenses, hardware, technical support)
- Evaluation & Assessment (data tools, assessment materials, external evaluation)
- Communication & Marketing (stakeholder engagement materials, communications)
- Travel & Meetings (conference attendance, site visits, meeting spaces)
- Miscellaneous & Contingency (unexpected costs, buffer)

Provide 6-10 budget line items with:
1. Specific category names appropriate for the initiative
2. Clear descriptions of what each line item covers
3. Realistic cost estimates based on typical school/district pricing
4. Suggested funding sources (e.g., Title I, Title II, General Fund, Grants, District Budget)
5. Brief notes explaining the estimate rationale

Base your estimates on:
- Scale of implementation (team size, target population)
- Complexity of strategies
- Professional development needs
- Duration of initiative
- Typical education sector costs

BE CONCISE. Keep every text field to one or two short sentences or a short phrase. Do not write paragraphs. Speed and scannability matter more than exhaustive detail.`;

    const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
    if (!apiKey) {
      throw new Error("ANTHROPIC_API_KEY is not configured");
    }

    const anthropic = new Anthropic({ apiKey });

    let msg;
    try {
      msg = await anthropic.messages.create({
        model: "claude-haiku-4-5",
        max_tokens: 8192,
        system: systemPrompt,
        messages: [
          { role: "user", content: context }
        ],
        tools: [
          {
            name: "recommend_budget",
            description: "Return budget recommendations for the implementation initiative",
            input_schema: {
              type: "object",
              properties: {
                budget_items: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      category: { type: "string", description: "Budget category name" },
                      description: { type: "string", description: "What this line item covers" },
                      estimated_cost: { type: "number", description: "Cost estimate in dollars" },
                      funding_source: { type: "string", description: "Suggested funding source" },
                      notes: { type: "string", description: "Rationale for the estimate" }
                    },
                    required: ["category", "description", "estimated_cost", "funding_source", "notes"],
                    additionalProperties: false
                  }
                }
              },
              required: ["budget_items"],
              additionalProperties: false
            }
          }
        ],
        tool_choice: { type: "tool", name: "recommend_budget" }
      });
    } catch (apiError) {
      if (apiError instanceof Anthropic.APIError) {
        if (apiError.status === 429) {
          return new Response(
            JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
            { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        if (apiError.status === 402) {
          return new Response(
            JSON.stringify({ error: "AI credits exhausted. Please add credits to continue." }),
            { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        console.error("AI API error:", apiError.status, apiError.message);
        throw new Error("AI API request failed");
      }
      throw apiError;
    }

    const toolUse = msg.content.find(
      (b): b is Anthropic.ToolUseBlock => b.type === "tool_use"
    );

    if (!toolUse) {
      throw new Error("No tool call in AI response");
    }

    const recommendations = toolUse.input as { budget_items: BudgetRecommendation[] };

    return new Response(
      JSON.stringify({ budget_recommendations: recommendations.budget_items }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in recommend-budget function:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "An unexpected error occurred" 
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
