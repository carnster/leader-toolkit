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
    chosen_approach: z.string().max(2000).nullish(),
    measurement_timeline: z.array(z.string()).max(100).nullish(),
    goals: z.string().max(10000).nullish(),
  }),
  activeIngredients: z.array(z.object({
    name: z.string().max(200),
    is_core: z.boolean(),
    description: z.string().max(1000).nullish(),
  })).max(50),
  implementationStrategies: z.array(z.object({
    strategy_name: z.string().max(200),
    eric_category: z.string(),
    timeline: z.string().max(500).optional().nullable(),
  })).max(50).nullish(),
  pdActivities: z.array(z.object({
    title: z.string().max(200),
    activity_type: z.string(),
    scheduled_date: z.string().nullable().nullish(),
  })).max(50).nullish(),
  communicationActivities: z.array(z.object({
    description: z.string().max(500),
    stakeholder_group: z.string().max(200),
    scheduled_date: z.string().nullable().nullish(),
  })).max(50).nullish(),
});

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const auth = await authorizeAiRequest(req, "recommend-timeline", corsHeaders, { perFiveMinutes: 10, perDay: 200 });
    if (!auth.ok) return auth.response!;

    const body = await req.json();
    const { decisionBrief, activeIngredients, implementationStrategies, pdActivities, communicationActivities } = requestSchema.parse(body);
    const apiKey = Deno.env.get('ANTHROPIC_API_KEY');

    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY is not configured');
    }

    const anthropic = new Anthropic({ apiKey });

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
- Success criteria

BE CONCISE. Keep every text field to one or two short sentences or a short phrase. Do not write paragraphs. Speed and scannability matter more than exhaustive detail.`;

    const userPrompt = `Create an implementation timeline for this initiative:

**Initiative:**
${decisionBrief.chosen_approach || 'Not specified'}

**Data Collection Activities:**
${decisionBrief.measurement_timeline?.join('\n') || 'Not specified'}

**Active Ingredients to Implement:**
${activeIngredients?.map((ing: any) => `- ${ing.name} (${ing.is_core ? 'Core' : 'Adaptable'})`).join('\n') || 'None specified'}

**Implementation Strategies (${implementationStrategies?.length || 0} total):**
${implementationStrategies?.map((s: any) => `- ${s.strategy_name} (${s.eric_category.toUpperCase()})${s.timeline ? ` - Timeline: ${s.timeline}` : ''}`).join('\n') || 'None specified'}

**Professional Development Activities (${pdActivities?.length || 0} total):**
${pdActivities?.map((p: any) => `- ${p.title} (${p.activity_type})${p.scheduled_date ? ` - Scheduled: ${p.scheduled_date}` : ''}`).join('\n') || 'None specified'}

**Communication Activities (${communicationActivities?.length || 0} total):**
${communicationActivities?.map((c: any) => `- ${c.description} (Target: ${c.stakeholder_group})${c.scheduled_date ? ` - Scheduled: ${c.scheduled_date}` : ''}`).join('\n') || 'None specified'}

**Context:**
Target Group: ${decisionBrief.target_group || 'Not specified'}
Goals: ${decisionBrief.goals || 'Not specified'}

Create a phased timeline with specific, actionable milestones that coordinates with the strategies, PD activities, and communication activities listed above.`;

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
            name: 'provide_timeline',
            description: 'Provide structured implementation timeline milestones',
            input_schema: {
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
        ],
        tool_choice: { type: 'tool', name: 'provide_timeline' }
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
        throw new Error('Failed to get timeline recommendations from AI');
      }
      throw apiError;
    }

    const toolUse = msg.content.find(
      (b): b is Anthropic.ToolUseBlock => b.type === 'tool_use'
    );

    if (!toolUse) {
      throw new Error('No timeline returned');
    }

    const result = toolUse.input;

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
