import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const requestSchema = z.object({
  chosenApproach: z.string().max(1000),
  evidenceBase: z.string().max(2000).optional(),
  problemStatement: z.string().max(2000),
});

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { chosenApproach, evidenceBase, problemStatement } = requestSchema.parse(body);
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const systemPrompt = `You are an expert in implementation science and evidence-based practice fidelity. 
Your role is to identify the "active ingredients" - the core practices and components that make an intervention effective.

For the given educational intervention/approach, identify 4-6 active ingredients:
- 2-3 should be marked as "core" (non-negotiable elements critical to effectiveness)
- The rest should be "adaptable" (can be modified while maintaining fidelity)
- Each ingredient should include:
  * Clear name and description
  * Category (e.g., "Relationships", "Monitoring", "Support Systems", "Instruction")
  * 3-5 "look-fors" - observable indicators that this ingredient is being implemented with quality
  * 2-3 "adaptable boundaries" - what can be flexibly adjusted while maintaining core function`;

    const userPrompt = `Generate active ingredients for this intervention:

Intervention/Approach: ${chosenApproach}
Evidence Base: ${evidenceBase || 'Not specified'}
Problem Context: ${problemStatement || 'Not specified'}

Identify the essential components that make this intervention effective, with clear implementation indicators.`;

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
              name: 'provide_active_ingredients',
              description: 'Provide structured active ingredients for the intervention',
              parameters: {
                type: 'object',
                properties: {
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
                      required: ['name', 'description', 'is_core', 'category']
                    }
                  }
                },
                required: ['active_ingredients']
              }
            }
          }
        ],
        tool_choice: { type: 'function', function: { name: 'provide_active_ingredients' } }
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
      throw new Error('Failed to generate active ingredients from AI');
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    
    if (!toolCall) {
      throw new Error('No active ingredients returned');
    }

    const result = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in generate-active-ingredients function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Failed to generate active ingredients' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
