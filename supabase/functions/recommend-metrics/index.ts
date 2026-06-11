import Anthropic from "npm:@anthropic-ai/sdk";
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { decisionBrief } = await req.json();
    const apiKey = Deno.env.get('ANTHROPIC_API_KEY');

    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY is not configured');
    }

    const anthropic = new Anthropic({ apiKey });

    const systemPrompt = `You are an educational implementation science expert specializing in measurement and evaluation. Based on a school's decision brief, recommend appropriate leading indicators, lagging indicators, and data collection activities with measurement frequencies.

Guidelines:
- Leading indicators are early signals of implementation (e.g., teacher attendance at PD, lesson plan completion, fidelity observations, student participation rates)
- Lagging indicators are outcome measures (e.g., assessment scores, behavior incidents, student surveys, attendance data)
- Data collection activities describe HOW and WHEN to gather measurement data (e.g., "Weekly fidelity walkthroughs", "Monthly student surveys", "Termly standardized assessments")
- Each indicator/activity should include a realistic measurement frequency from: weekly, fortnightly, monthly, bi-monthly, half-termly, termly, end-of-year
- Recommend 3-5 leading indicators, 3-5 lagging indicators, and 4-6 data collection activities
- Make recommendations practical and appropriate for the school context
- Ensure indicators align with the problem statement and goals

BE CONCISE. Keep every text field to one or two short sentences or a short phrase. Do not write paragraphs. Speed and scannability matter more than exhaustive detail.`;

    const userPrompt = `Decision Brief Context:
Problem: ${decisionBrief.problem_statement || 'Not specified'}
Target Group: ${decisionBrief.target_group || 'Not specified'}
Goals: ${decisionBrief.goals || 'Not specified'}
Chosen Approach: ${decisionBrief.chosen_approach || 'Not specified'}

Recommend appropriate metrics and measurement plan.`;

    console.log('Calling Claude for metrics recommendations...');

    let msg;
    try {
      msg = await anthropic.messages.create({
        model: 'claude-haiku-4-5',
        max_tokens: 8192,
        system: systemPrompt,
        messages: [
          { role: 'user', content: userPrompt }
        ],
        tools: [{
          name: 'provide_metrics_recommendations',
          description: 'Provide recommendations for leading indicators, lagging indicators, and data collection activities',
          input_schema: {
              type: 'object',
              properties: {
                leading_indicators: {
                  type: 'array',
                  description: 'Array of leading indicators with frequencies',
                  items: {
                    type: 'object',
                    properties: {
                      indicator: { type: 'string', description: 'The leading indicator description' },
                      frequency: { type: 'string', description: 'Measurement frequency (e.g., weekly, monthly, termly)' },
                      rationale: { type: 'string', description: 'Why this indicator is useful' }
                    },
                    required: ['indicator', 'frequency', 'rationale']
                  }
                },
                lagging_indicators: {
                  type: 'array',
                  description: 'Array of lagging indicators with frequencies',
                  items: {
                    type: 'object',
                    properties: {
                      indicator: { type: 'string', description: 'The lagging indicator description' },
                      frequency: { type: 'string', description: 'Measurement frequency (e.g., half-termly, termly, end-of-year)' },
                      rationale: { type: 'string', description: 'Why this outcome measure matters' }
                    },
                    required: ['indicator', 'frequency', 'rationale']
                  }
                },
                data_collection_activities: {
                  type: 'array',
                  description: 'Array of data collection activities/methods with frequencies',
                  items: {
                    type: 'object',
                    properties: {
                      activity: { type: 'string', description: 'The data collection activity description' },
                      frequency: { type: 'string', description: 'How often this activity occurs (e.g., weekly, monthly, termly)' },
                      rationale: { type: 'string', description: 'Why this collection method is practical' }
                    },
                    required: ['activity', 'frequency', 'rationale']
                  }
                }
              },
              required: ['leading_indicators', 'lagging_indicators', 'data_collection_activities']
          }
        }],
        tool_choice: { type: 'tool', name: 'provide_metrics_recommendations' }
      });
    } catch (apiError) {
      if (apiError instanceof Anthropic.APIError) {
        if (apiError.status === 429) {
          return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please try again in a moment.' }), {
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
        console.error('AI Gateway error:', apiError.status, apiError.message);
        throw new Error(`AI Gateway error: ${apiError.status}`);
      }
      throw apiError;
    }

    console.log('AI response received');

    const toolUse = msg.content.find(
      (b): b is Anthropic.ToolUseBlock => b.type === 'tool_use'
    );
    if (!toolUse) {
      throw new Error('No tool call in AI response');
    }

    const recommendations = toolUse.input;
    
    return new Response(JSON.stringify({ recommendations }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in recommend-metrics function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), 
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
