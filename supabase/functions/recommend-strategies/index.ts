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
    feasibility_factors: z.any().optional(),
    chosen_approach: z.string().max(2000).optional(),
    root_causes: z.array(z.string()).optional(),
    stakeholder_input: z.string().optional(),
    equity_notes: z.string().optional(),
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

    const systemPrompt = `You are an expert in implementation science and the ERIC framework (Expert Recommendations for Implementing Change).

Your role is to recommend implementation strategies that address specific barriers and leverage enablers based on the school's context.

The ERIC framework has 4 categories:
- **Enable** - Build capacity (training, technical assistance, coaching, tools, resources)
- **Redesign** - Modify context (change workflows, schedules, policies, structures)
- **Integrate** - Embed in routine (link to existing practices, create implementation teams)
- **Create** - Build new supports (develop new policies, funding, partnerships, incentives)

Analyze the feasibility data and context to recommend 6-8 specific, actionable strategies:
- 2 strategies for each ERIC category
- Each strategy should directly address identified barriers or leverage enablers
- Include specific target barriers, timelines, resources needed, and success indicators
- Strategies should be practical and context-appropriate based on feasibility scores`;

    const feasibilityFactors = decisionBrief.feasibility_factors || {};
    const feasibilityAnalysis = `
Time/Scheduling: ${feasibilityFactors.time_scheduling || 0}/10
Staff Capacity: ${feasibilityFactors.staff_capacity || 0}/10
Resources/Budget: ${feasibilityFactors.resources_budget || 0}/10
Leadership Support: ${feasibilityFactors.leadership_support || 0}/10
School Culture: ${feasibilityFactors.school_culture || 0}/10`;

    const userPrompt = `Recommend ERIC implementation strategies for this initiative:

**Initiative Details:**
Problem: ${decisionBrief.problem_statement || 'Not specified'}
Target Group: ${decisionBrief.target_group || 'Not specified'}
Chosen Approach: ${decisionBrief.chosen_approach || 'Not specified'}

**Context & Feasibility:**
${feasibilityAnalysis}

**Identified Barriers:**
${decisionBrief.root_causes?.join('; ') || 'Not specified'}

**Stakeholder Input:**
${decisionBrief.stakeholder_input || 'Not specified'}

**Equity Considerations:**
${decisionBrief.equity_notes || 'Not specified'}

Provide practical strategies that address the specific barriers and feasibility concerns identified above.`;

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
              name: 'provide_strategies',
              description: 'Provide structured implementation strategies',
              parameters: {
                type: 'object',
                properties: {
                  strategies: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        strategy_name: { type: 'string' },
                        eric_category: { 
                          type: 'string', 
                          enum: ['enable', 'redesign', 'integrate', 'create'] 
                        },
                        description: { type: 'string' },
                        target_barrier: { type: 'string' },
                        timeline: { type: 'string' },
                        resources_needed: { type: 'string' },
                        success_indicators: { type: 'string' },
                        responsible_party: { type: 'string' }
                      },
                      required: ['strategy_name', 'eric_category', 'description', 'target_barrier']
                    }
                  }
                },
                required: ['strategies']
              }
            }
          }
        ],
        tool_choice: { type: 'function', function: { name: 'provide_strategies' } }
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
      throw new Error('Failed to get strategy recommendations from AI');
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    
    if (!toolCall) {
      throw new Error('No strategies returned');
    }

    const result = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in recommend-strategies function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Failed to generate strategy recommendations' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
