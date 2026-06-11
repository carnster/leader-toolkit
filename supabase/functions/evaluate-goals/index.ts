import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const requestSchema = z.object({
      goals: z.string().trim().min(1, "Goals text is required").max(5000),
    });
    
    const { goals } = requestSchema.parse(await req.json());

    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY is not configured");
    }

    const systemPrompt = `You are an educational goal evaluation expert. Evaluate goals based on SMART and SMARTIE criteria:

SMART:
- Specific: Clear and well-defined
- Measurable: Quantifiable outcomes
- Achievable: Realistic given constraints
- Relevant: Aligned with the problem
- Time-bound: Clear deadline

SMARTIE (extends SMART):
- Inclusive: Considers all students/stakeholders
- Equitable: Addresses disparities and fairness

Provide constructive, actionable feedback.`;

    const response = await fetch("https://generativelanguage.googleapis.com/v1beta/openai/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${GEMINI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { 
            role: "user", 
            content: `Evaluate these initiative goals against SMART/SMARTIE criteria and provide specific feedback:\n\n${goals}`
          }
        ],
        tools: [{
          type: "function",
          function: {
            name: "evaluate_goals",
            description: "Evaluate goals against SMART/SMARTIE criteria",
            parameters: {
              type: "object",
              properties: {
                overall_score: {
                  type: "number",
                  description: "Overall score from 0-100"
                },
                is_smart_compliant: {
                  type: "boolean",
                  description: "Whether goals meet SMART criteria"
                },
                is_smartie_compliant: {
                  type: "boolean",
                  description: "Whether goals meet SMARTIE criteria"
                },
                criteria_scores: {
                  type: "object",
                  properties: {
                    specific: { type: "number", description: "Score 0-100" },
                    measurable: { type: "number", description: "Score 0-100" },
                    achievable: { type: "number", description: "Score 0-100" },
                    relevant: { type: "number", description: "Score 0-100" },
                    time_bound: { type: "number", description: "Score 0-100" },
                    inclusive: { type: "number", description: "Score 0-100" },
                    equitable: { type: "number", description: "Score 0-100" }
                  },
                  required: ["specific", "measurable", "achievable", "relevant", "time_bound", "inclusive", "equitable"]
                },
                strengths: {
                  type: "array",
                  items: { type: "string" },
                  description: "List of strengths in the goals"
                },
                improvements: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      criterion: { type: "string" },
                      issue: { type: "string" },
                      suggestion: { type: "string" }
                    },
                    required: ["criterion", "issue", "suggestion"]
                  },
                  description: "List of improvement suggestions"
                },
                improved_version: {
                  type: "string",
                  description: "Suggested improved version of the goals if needed"
                }
              },
              required: ["overall_score", "is_smart_compliant", "is_smartie_compliant", "criteria_scores", "strengths", "improvements"],
              additionalProperties: false
            }
          }
        }],
        tool_choice: { type: "function", function: { name: "evaluate_goals" } }
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Payment required. Please add credits to your workspace." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: "AI evaluation failed" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    
    if (!toolCall) {
      console.error("No tool call in response");
      return new Response(
        JSON.stringify({ error: "Invalid AI response" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const evaluation = JSON.parse(toolCall.function.arguments);

    return new Response(
      JSON.stringify({ evaluation }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in evaluate-goals function:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
