import Anthropic from "npm:@anthropic-ai/sdk";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";
import { authorizeAiRequest } from "../_shared/auth.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const requestSchema = z.object({
  decisionBrief: z.object({
    problem_statement: z.string().max(5000),
    target_group: z.string().max(1000),
    feasibility_factors: z.any().nullish(),
    chosen_approach: z.string().max(2000).nullish(),
    root_causes: z.array(z.string()).nullish(),
    stakeholder_input: z.string().max(5000).nullish(),
  }),
});

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const auth = await authorizeAiRequest(req, "recommend-risks", corsHeaders, { perFiveMinutes: 10, perDay: 200 });
    if (!auth.ok) return auth.response!;

    const body = await req.json();
    const { decisionBrief } = requestSchema.parse(body);
    const apiKey = Deno.env.get('ANTHROPIC_API_KEY');

    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY is not configured');
    }

    const anthropic = new Anthropic({ apiKey });

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
- Contingency plan if risk materializes

BE CONCISE. Keep every text field to one or two short sentences or a short phrase. Do not write paragraphs. Speed and scannability matter more than exhaustive detail.`;

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
            name: 'provide_risks',
            description: 'Provide structured implementation risks',
            input_schema: {
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
        ],
        tool_choice: { type: 'tool', name: 'provide_risks' }
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
        throw new Error('Failed to get risk recommendations from AI');
      }
      throw apiError;
    }

    const toolUse = msg.content.find(
      (b): b is Anthropic.ToolUseBlock => b.type === 'tool_use'
    );

    if (!toolUse) {
      throw new Error('No risks returned');
    }

    const result = toolUse.input;

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
