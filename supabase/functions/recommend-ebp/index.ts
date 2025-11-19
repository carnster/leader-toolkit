import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const requestSchema = z.object({
  decisionBrief: z.object({
    problem_statement: z.string().max(2000),
    target_group: z.string().max(500),
    goals: z.string().max(5000).optional(),
    evidence_base: z.string().max(2000).optional(),
    equity_notes: z.string().max(2000).optional(),
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
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const systemPrompt = `You are an expert in evidence-based educational practices and interventions. Your role is to recommend appropriate Evidence-Based Practices (EBPs), programs, or innovations based on the problem context provided.

Analyze the decision brief and provide 3-5 tailored recommendations that:
- Address the specific problem and target population
- Align with stated equity considerations
- Match the desired evidence level
- Are feasible given the context
- Have proven effectiveness in similar situations

For each recommendation, provide:
- Name of the EBP/program/innovation
- Brief description (2-3 sentences)
- Evidence level (Strong/Moderate/Emerging)
- Fit score (1-100) based on alignment with the context
- Key implementation considerations
- 4-6 Active Ingredients (the core practices that drive effectiveness):
  * Mark 2-3 as "core" (non-negotiable elements)
  * Mark the rest as adaptable
  * Include specific "look-fors" - observable indicators of quality implementation
  * Include "adaptable boundaries" - what can be modified while maintaining fidelity`;

    const userPrompt = `Based on this decision brief, recommend evidence-based practices:

Problem Statement: ${decisionBrief.problem_statement || 'Not specified'}
Target Group: ${decisionBrief.target_group || 'Not specified'}
Root Causes: ${decisionBrief.root_causes?.join(', ') || 'Not specified'}
Equity Considerations: ${decisionBrief.equity_notes || 'Not specified'}
Desired Evidence Base: ${decisionBrief.evidence_base || 'Not specified'}
Feasibility Score: ${decisionBrief.feasibility_score || 'Not assessed'}/10
Baseline Data: ${decisionBrief.baseline_data || 'Not specified'}

Provide recommendations in a clear, structured format.`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        tools: [
          {
            type: 'function',
            function: {
              name: 'provide_recommendations',
              description: 'Provide structured EBP recommendations',
              parameters: {
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
          }
        ],
        tool_choice: { type: 'function', function: { name: 'provide_recommendations' } }
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: 'AI credits exhausted. Please add credits to continue.' }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      throw new Error('Failed to get recommendations from AI');
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    
    if (!toolCall) {
      throw new Error('No recommendations returned');
    }

    const recommendations = JSON.parse(toolCall.function.arguments);

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
