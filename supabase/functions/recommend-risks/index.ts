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
    feasibility_factors: z.any().optional(),
    chosen_approach: z.string().max(2000).optional(),
    root_causes: z.array(z.string()).optional(),
    stakeholder_input: z.string().max(5000).optional(),
  }),
});

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { decisionBrief } = requestSchema.parse(body);
    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');

    if (!GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is not configured');
    }

    const systemPrompt = `You are an expert in implementation science and risk management for educational initiatives.

Analyze the decision brief and feasibility data to identify 5-7 potential implementation risks. Focus on:
- Areas with low feasibility scores (likely risk sources)
- Common implementation barriers in education
- Context-specific challenges mentioned
- Sustainability and scale-up risks

For each risk provide:
- Clear risk description
- Risk category (resource, capacity, political, technical, organizational)
- Likelihood (low/medium/high)
- Impact (low/medium/high)
- Specific mitigation strategy
- Contingency plan if risk materializes`;

    const feasibilityFactors = decisionBrief.feasibility_factors || {};
    const feasibilityAnalysis = `
Time/Scheduling: ${feasibilityFactors.time_scheduling || 0}/10
Staff Capacity: ${feasibilityFactors.staff_capacity || 0}/10
Resources/Budget: ${feasibilityFactors.resources_budget || 0}/10
Leadership Support: ${feasibilityFactors.leadership_support || 0}/10
School Culture: ${feasibilityFactors.school_culture || 0}/10`;

    const userPrompt = `Identify implementation risks for this initiative:

**Initiative:**
${decisionBrief.chosen_approach || 'Not specified'}

**Context:**
Problem: ${decisionBrief.problem_statement || 'Not specified'}
Target: ${decisionBrief.target_group || 'Not specified'}

**Feasibility Assessment:**
${feasibilityAnalysis}

**Known Barriers:**
${decisionBrief.root_causes?.join('; ') || 'Not specified'}

**Stakeholder Context:**
${decisionBrief.stakeholder_input || 'Not specified'}

Identify specific, actionable risks with mitigation strategies.`;

    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/openai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GEMINI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        tools: [
          {
            type: 'function',
            function: {
              name: 'provide_risks',
              description: 'Provide structured implementation risks',
              parameters: {
                type: 'object',
                properties: {
                  risks: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        risk_description: { type: 'string' },
                        risk_category: { type: 'string' },
                        likelihood: { type: 'string', enum: ['low', 'medium', 'high'] },
                        impact: { type: 'string', enum: ['low', 'medium', 'high'] },
                        mitigation_strategy: { type: 'string' },
                        contingency_plan: { type: 'string' }
                      },
                      required: ['risk_description', 'risk_category', 'likelihood', 'impact', 'mitigation_strategy']
                    }
                  }
                },
                required: ['risks']
              }
            }
          }
        ],
        tool_choice: { type: 'function', function: { name: 'provide_risks' } }
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
      throw new Error('Failed to get risk recommendations from AI');
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    
    if (!toolCall) {
      throw new Error('No risks returned');
    }

    const result = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in recommend-risks function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Failed to generate risk recommendations' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
