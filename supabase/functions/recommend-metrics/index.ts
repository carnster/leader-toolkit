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
    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
    
    if (!GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is not configured');
    }

    const systemPrompt = `You are an educational implementation science expert specializing in measurement and evaluation. Based on a school's decision brief, recommend appropriate leading indicators, lagging indicators, and data collection activities with measurement frequencies.

Guidelines:
- Leading indicators are early signals of implementation (e.g., teacher attendance at PD, lesson plan completion, fidelity observations, student participation rates)
- Lagging indicators are outcome measures (e.g., assessment scores, behavior incidents, student surveys, attendance data)
- Data collection activities describe HOW and WHEN to gather measurement data (e.g., "Weekly fidelity walkthroughs", "Monthly student surveys", "Termly standardized assessments")
- Each indicator/activity should include a realistic measurement frequency from: weekly, fortnightly, monthly, bi-monthly, half-termly, termly, end-of-year
- Recommend 3-5 leading indicators, 3-5 lagging indicators, and 4-6 data collection activities
- Make recommendations practical and appropriate for the school context
- Ensure indicators align with the problem statement and goals`;

    const userPrompt = `Decision Brief Context:
Problem: ${decisionBrief.problem_statement || 'Not specified'}
Target Group: ${decisionBrief.target_group || 'Not specified'}
Goals: ${decisionBrief.goals || 'Not specified'}
Chosen Approach: ${decisionBrief.chosen_approach || 'Not specified'}

Recommend appropriate metrics and measurement plan.`;

    console.log('Calling Gemini AI for metrics recommendations...');

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
        tools: [{
          type: 'function',
          function: {
            name: 'provide_metrics_recommendations',
            description: 'Provide recommendations for leading indicators, lagging indicators, and data collection activities',
            parameters: {
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
          }
        }],
        tool_choice: { type: 'function', function: { name: 'provide_metrics_recommendations' } }
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please try again in a moment.' }), {
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
      console.error('AI Gateway error:', response.status, errorText);
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    console.log('AI response received');

    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      throw new Error('No tool call in AI response');
    }

    const recommendations = JSON.parse(toolCall.function.arguments);
    
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
