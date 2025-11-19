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
    chosen_approach: z.string().max(1000).optional(),
    measurement_timeline: z.string().optional(),
    goals: z.string().optional(),
  }),
  activeIngredients: z.array(z.object({
    name: z.string().max(200),
    is_core: z.boolean(),
    description: z.string().max(1000).optional(),
  })).max(50),
});

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { decisionBrief, activeIngredients } = requestSchema.parse(body);
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const systemPrompt = `You are an expert in implementation science and project planning for educational initiatives.

Create a realistic implementation timeline with 8-12 key milestones following implementation science phases:

**Phase 1: Exploration (Months 1-2)**
- Finalize planning
- Secure resources
- Complete initial training

**Phase 2: Installation (Months 2-3)**
- Set up systems and structures
- Establish monitoring protocols
- Pilot with small group

**Phase 3: Initial Implementation (Months 3-6)**
- Full rollout
- Ongoing coaching and support
- Fidelity monitoring

**Phase 4: Full Implementation (Months 6-12+)**
- Scale and sustainability
- Continuous improvement
- Integration into routine practice

Each milestone should include:
- Specific, measurable milestone
- Implementation phase
- Realistic target date (relative to start)
- Success criteria`;

    const userPrompt = `Create an implementation timeline for this initiative:

**Initiative:**
${decisionBrief.chosen_approach || 'Not specified'}

**Target Timeline:**
${decisionBrief.measurement_timeline || 'Not specified'}

**Active Ingredients to Implement:**
${activeIngredients?.map((ing: any) => `- ${ing.name} (${ing.is_core ? 'Core' : 'Adaptable'})`).join('\n') || 'None specified'}

**Context:**
Target Group: ${decisionBrief.target_group || 'Not specified'}
Goals: ${decisionBrief.goals || 'Not specified'}

Create a phased timeline with specific, actionable milestones.`;

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
              name: 'provide_timeline',
              description: 'Provide structured implementation timeline milestones',
              parameters: {
                type: 'object',
                properties: {
                  milestones: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        milestone: { type: 'string' },
                        phase: { 
                          type: 'string',
                          enum: ['exploration', 'installation', 'initial_implementation', 'full_implementation']
                        },
                        months_from_start: { type: 'number' },
                        notes: { type: 'string' }
                      },
                      required: ['milestone', 'phase', 'months_from_start']
                    }
                  }
                },
                required: ['milestones']
              }
            }
          }
        ],
        tool_choice: { type: 'function', function: { name: 'provide_timeline' } }
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
      throw new Error('Failed to get timeline recommendations from AI');
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    
    if (!toolCall) {
      throw new Error('No timeline returned');
    }

    const result = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in recommend-timeline function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Failed to generate timeline recommendations' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
