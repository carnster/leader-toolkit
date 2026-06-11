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
    const apiKey = Deno.env.get('ANTHROPIC_API_KEY');

    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY is not configured');
    }

    const anthropic = new Anthropic({ apiKey });

    const systemPrompt = `You are an expert in implementation science and the ERIC framework (Expert Recommendations for Implementing Change).

Your role is to recommend implementation strategies that address specific barriers and leverage enablers based on the school's context.

The ERIC framework categories you can use:
- **evaluative_iterative** - Assess and refine through ongoing evaluation
- **provide_interactive_assistance** - Offer hands-on support and guidance
- **adapt_practice** - Tailor and modify the intervention
- **develop_stakeholder_relationships** - Build partnerships and buy-in
- **train_educate** - Build knowledge and skills
- **support_clinicians** - Help practitioners succeed
- **engage_consumers** - Involve end users and beneficiaries
- **use_financial_strategies** - Leverage funding and incentives
- **change_infrastructure** - Modify systems and structures

Analyze the feasibility data and context to recommend 6-8 specific, actionable strategies:
- Mix strategies across different ERIC categories
- Each strategy should directly address identified barriers or leverage enablers
- Include specific target barriers, timelines, resources needed, and success indicators
- Strategies should be practical and context-appropriate based on feasibility scores

BE CONCISE. Keep every text field to one or two short sentences or a short phrase. Do not write paragraphs. Speed and scannability matter more than exhaustive detail.`;

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

    let aiMessage;
    try {
      aiMessage = await anthropic.messages.create({
        model: 'claude-haiku-4-5',
        max_tokens: 8192,
        system: systemPrompt,
        messages: [
          { role: 'user', content: userPrompt }
        ],
        tools: [
          {
            name: 'provide_strategies',
            description: 'Provide structured implementation strategies',
            input_schema: {
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
                        enum: [
                          'evaluative_iterative',
                          'provide_interactive_assistance',
                          'adapt_practice',
                          'develop_stakeholder_relationships',
                          'train_educate',
                          'support_clinicians',
                          'engage_consumers',
                          'use_financial_strategies',
                          'change_infrastructure'
                        ]
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
        ],
        tool_choice: { type: 'tool', name: 'provide_strategies' }
      });
    } catch (apiError) {
      if (apiError instanceof Anthropic.APIError) {
        const msg = apiError.status === 429
          ? 'Rate limit exceeded. Please try again later.'
          : apiError.status === 402
            ? 'AI credits exhausted. Please add credits to continue.'
            : `AI gateway error (status: ${apiError.status})`;
        console.error('AI gateway non-2xx for strategies:', apiError.status);
        return new Response(JSON.stringify({ error: msg, code: apiError.status }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      throw apiError;
    }

    // Try to extract tool use first (preferred)
    let strategiesResult: any = null;

    const toolUse = aiMessage.content.find(
      (b): b is Anthropic.ToolUseBlock =>
        b.type === 'tool_use' && b.name === 'provide_strategies'
    ) || aiMessage.content.find(
      (b): b is Anthropic.ToolUseBlock => b.type === 'tool_use'
    );
    if (toolUse?.input) {
      const parsed = toolUse.input as any;
      strategiesResult = parsed?.strategies ? parsed : null;
    }

    // Fallback: try to parse JSON from the assistant text content when no tool use is present
    if (!strategiesResult) {
      const content = aiMessage.content
        .filter((b): b is Anthropic.TextBlock => b.type === 'text')
        .map((b) => b.text)
        .join('');
      if (typeof content === 'string') {
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          try {
            const parsed = JSON.parse(jsonMatch[0]);
            if (parsed?.strategies) {
              strategiesResult = parsed;
            }
          } catch (e) {
            console.error('Failed parsing JSON from content:', e);
          }
        }
      }
    }

    if (!strategiesResult?.strategies || !Array.isArray(strategiesResult.strategies)) {
      console.error('No strategies returned from AI. Raw response:', JSON.stringify(aiMessage, null, 2));
      return new Response(JSON.stringify({ error: 'The AI did not return strategies. Please try again.' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Sanitize and validate the strategies
    const allowedCategories = new Set([
      'evaluative_iterative',
      'provide_interactive_assistance',
      'adapt_practice',
      'develop_stakeholder_relationships',
      'train_educate',
      'support_clinicians',
      'engage_consumers',
      'use_financial_strategies',
      'change_infrastructure'
    ]);
    const cleaned = {
      strategies: strategiesResult.strategies.map((s: any) => {
        let category = (s.eric_category || '').toString().toLowerCase();
        if (!allowedCategories.has(category)) {
          category = 'train_educate'; // default fallback
        }
        return {
          strategy_name: s.strategy_name || 'Implementation Strategy',
          eric_category: category,
          description: s.description || null,
          target_barrier: s.target_barrier || null,
          timeline: s.timeline || null,
          resources_needed: s.resources_needed || null,
          success_indicators: s.success_indicators || null,
          responsible_party: s.responsible_party || null,
        };
      })
    };

    return new Response(JSON.stringify(cleaned), {
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
