import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

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
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) {
      throw new Error("Unauthorized");
    }

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
- Typical education sector costs`;

    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY is not configured");
    }

    const aiResponse = await fetch("https://generativelanguage.googleapis.com/v1beta/openai/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${GEMINI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: context }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "recommend_budget",
              description: "Return budget recommendations for the implementation initiative",
              parameters: {
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
          }
        ],
        tool_choice: { type: "function", function: { name: "recommend_budget" } }
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add credits to continue." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await aiResponse.text();
      console.error("AI API error:", aiResponse.status, errorText);
      throw new Error("AI API request failed");
    }

    const aiData = await aiResponse.json();
    const toolCall = aiData.choices[0]?.message?.tool_calls?.[0];
    
    if (!toolCall) {
      throw new Error("No tool call in AI response");
    }

    const recommendations: { budget_items: BudgetRecommendation[] } = JSON.parse(
      toolCall.function.arguments
    );

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
