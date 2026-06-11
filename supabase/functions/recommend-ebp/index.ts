import Anthropic from "npm:@anthropic-ai/sdk";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const requestSchema = z.object({
  decisionBrief: z.object({
    problem_statement: z.string().max(5000),
    target_group: z.string().max(1000),
    goals: z.string().max(10000).optional(),
    evidence_base: z.string().max(5000).optional(),
    equity_notes: z.string().max(5000).optional(),
    feasibility_factors: z.any().optional(),
    root_causes: z.array(z.string()).optional(),
    feasibility_score: z.number().nullable().optional(),
    baseline_data: z.string().optional(),
  }),
});

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { decisionBrief } = requestSchema.parse(body);
    const apiKey = Deno.env.get('ANTHROPIC_API_KEY');

    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY is not configured');
    }

    const anthropic = new Anthropic({ apiKey });

    const systemPrompt = `You are an expert in evidence-based educational practices and interventions. Your role is to recommend appropriate Evidence-Based Practices (EBPs), programs, or innovations based on the problem context provided.

Analyze the decision brief and provide exactly 3 tailored recommendations that:
- Address the specific problem and target population
- Align with stated equity considerations
- Are feasible given the context and have proven effectiveness in similar situations

For each recommendation, provide:
- Name of the EBP/program/innovation
- Brief description (maximum 2 sentences)
- Evidence level (Strong/Moderate/Emerging)
- Fit score (1-100) based on alignment with the context
- Key implementation considerations (maximum 2 sentences)
- Exactly 4 Active Ingredients (the core practices that drive effectiveness):
  * Mark 2 as "core" (non-negotiable elements), the rest adaptable
  * Include 2-3 "look-fors" as short phrases (under 10 words each)
  * Include "adaptable boundaries" as short phrases (under 10 words each)

BE CONCISE. Every text field is one to two short sentences or a short phrase. Do not write paragraphs. Speed and scannability matter more than thoroughness; the user can ask the Implementation Coach for depth.`;

    const userPrompt = `Based on this decision brief, recommend evidence-based practices:

Problem Statement: ${decisionBrief.problem_statement || 'Not specified'}
Target Group: ${decisionBrief.target_group || 'Not specified'}
Root Causes: ${decisionBrief.root_causes?.join(', ') || 'Not specified'}
Equity Considerations: ${decisionBrief.equity_notes || 'Not specified'}
Desired Evidence Base: ${decisionBrief.evidence_base || 'Not specified'}
Feasibility Score: ${decisionBrief.feasibility_score || 'Not assessed'}/10
Baseline Data: ${decisionBrief.baseline_data || 'Not specified'}

Provide recommendations in a clear, structured format.`;

    let msg;
    try {
      msg = await anthropic.messages.create({
        model: 'claude-haiku-4-5',
        max_tokens: 8192,
        system: systemPrompt,
        messages: [
          { role: 'user', content: userPrompt }
        ],
        tools: [
          {
            name: 'provide_recommendations',
            description: 'Provide structured EBP recommendations',
            input_schema: {
              type: 'object',
              properties: {
                recommendations: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      name: { type: 'string' },
                      description: { type: 'string' },
                      evidence_level: { type: 'string', enum: ['Strong', 'Moderate', 'Emerging'] },
                      fit_score: { type: 'number', minimum: 1, maximum: 100 },
                      implementation_notes: { type: 'string' },
                      active_ingredients: {
                        type: 'array',
                        items: {
                          type: 'object',
                          properties: {
                            name: { type: 'string' },
                            description: { type: 'string' },
                            is_core: { type: 'boolean' },
                            category: { type: 'string' },
                            look_fors: { type: 'array', items: { type: 'string' } },
                            adaptable_boundaries: { type: 'array', items: { type: 'string' } }
                          },
                          required: ['name', 'description', 'is_core']
                        }
                      }
                    },
                    required: ['name', 'description', 'evidence_level', 'fit_score', 'implementation_notes', 'active_ingredients'],
                    additionalProperties: false
                  }
                }
              },
              required: ['recommendations'],
              additionalProperties: false
            }
          }
        ],
        tool_choice: { type: 'tool', name: 'provide_recommendations' }
      });
    } catch (apiError) {
      if (apiError instanceof Anthropic.APIError) {
        if (apiError.status === 429) {
          return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }), {
            status: 429,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        if (apiError.status === 402) {
          return new Response(JSON.stringify({ error: 'AI credits exhausted. Please add credits to continue.' }), {
            status: 402,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        console.error('AI gateway error:', apiError.status, apiError.message);
        throw new Error('Failed to get recommendations from AI');
      }
      throw apiError;
    }

    const toolUse = msg.content.find(
      (b): b is Anthropic.ToolUseBlock => b.type === 'tool_use'
    );

    if (!toolUse) {
      throw new Error('No recommendations returned');
    }

    const recommendations = toolUse.input;

    return new Response(JSON.stringify(recommendations), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in recommend-ebp function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Failed to generate recommendations' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
