import Anthropic from "npm:@anthropic-ai/sdk";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { authorizeAiRequest } from "../_shared/auth.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const auth = await authorizeAiRequest(req, "ai-copilot-chat", corsHeaders, { perFiveMinutes: 40, perDay: 400 });
    if (!auth.ok) return auth.response!;

    const { messages, context } = await req.json();
    console.log('AI Copilot request:', { messageCount: messages?.length, context });
    
    const apiKey = Deno.env.get('ANTHROPIC_API_KEY');
    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY is not configured');
    }

    const anthropic = new Anthropic({ apiKey });

    // Build context-aware system prompt
    const systemPrompt = buildSystemPrompt(context);

    // The Anthropic Messages API takes the system prompt as a top-level
    // parameter and only accepts user/assistant roles in `messages`.
    const conversationMessages: Anthropic.MessageParam[] = (messages ?? [])
      .filter((m: { role: string }) => m.role === 'user' || m.role === 'assistant')
      .map((m: { role: 'user' | 'assistant'; content: string }) => ({
        role: m.role,
        content: m.content,
      }));

    let stream;
    try {
      stream = await anthropic.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 4096,
        system: systemPrompt,
        messages: conversationMessages,
        stream: true,
      });
    } catch (apiError) {
      if (apiError instanceof Anthropic.APIError) {
        console.error('AI Gateway error:', apiError.status, apiError.message);

        if (apiError.status === 429) {
          return new Response(JSON.stringify({
            error: 'Rate limit exceeded. Please try again in a moment.'
          }), {
            status: 429,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        if (apiError.status === 402) {
          return new Response(JSON.stringify({
            error: 'AI credits exhausted. Please add credits to continue.'
          }), {
            status: 402,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        throw new Error(`AI Gateway error: ${apiError.status}`);
      }
      throw apiError;
    }

    // Re-emit the stream as OpenAI-style SSE chunks so the existing
    // frontend parser (choices[0].delta.content + [DONE]) keeps working.
    const encoder = new TextEncoder();
    const body = new ReadableStream({
      async start(controller) {
        try {
          for await (const event of stream) {
            if (
              event.type === 'content_block_delta' &&
              event.delta.type === 'text_delta'
            ) {
              const chunk = {
                choices: [{ delta: { content: event.delta.text } }],
              };
              controller.enqueue(encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`));
            }
          }
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();
        } catch (streamError) {
          console.error('Error while streaming AI response:', streamError);
          controller.error(streamError);
        }
      },
    });

    return new Response(body, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (error) {
    console.error('Error in ai-copilot-chat:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function buildSystemPrompt(context: any): string {
  let prompt = `You are the Implementation Coach for the IMPACT Implementation Companion, an expert in implementation science and educational change management. You help school leaders navigate the implementation process using the "Implement with IMPACT" framework.

Core Framework Stages (4 stages, with monitoring woven throughout):
1. **Decide** - Name the problem and need for change, assemble the implementation team, develop goals, identify evidence-based solutions, assess organizational readiness
2. **Plan & Prepare** - Identify active ingredients (core vs adaptable), select 3 to 5 implementation strategies, build the monitoring plan, timeline, PD, and communication plans
3. **Implement** - Grow the implementers through training and coaching, build supportive structures, run improvement cycles (PDSA), gather and act on implementation data. Monitoring is continuous during this stage, not a separate phase
4. **Spread & Sustain** - Navigate from implementation mode to operational mode, embed practices in routines, build onboarding systems, protect resources, make the scale decision

Key concepts to use accurately: active ingredients, fidelity, adaptation versus de-implementation, implementation literacy, the adopt-and-abandon cycle, and the team behaviors Engage, Unite, and Reflect.

Your Role:
- Provide expert guidance on implementation science
- Offer proactive suggestions based on user's current context
- Help analyze data and identify patterns
- Generate actionable recommendations
- Answer questions about any stage of implementation

Communication Style:
- Be conversational and supportive
- Provide specific, actionable advice
- Reference the user's actual data when relevant
- Offer to help with concrete tasks
- Keep responses focused and practical`;

  // Add context-specific information
  if (context?.currentPage) {
    prompt += `\n\nCurrent Context:
- User is on: ${context.currentPage}`;
  }

  if (context?.currentStage) {
    prompt += `\n- Current stage: ${context.currentStage}`;
  }

  if (context?.initiative) {
    const init = context.initiative;
    prompt += `\n\nInitiative Information:
- Title: ${init.title}
- Description: ${init.description || 'Not set'}
- Stage: ${init.stage}
- Status: ${init.status}`;
    
    if (init.start_date) {
      prompt += `\n- Started: ${init.start_date}`;
    }
    if (init.target_end_date) {
      prompt += `\n- Target end: ${init.target_end_date}`;
    }
  }

  if (context?.teamSize) {
    prompt += `\n- Team size: ${context.teamSize} members`;
  }

  if (context?.activeIngredients) {
    prompt += `\n- Active ingredients defined: ${context.activeIngredients}`;
  }

  if (context?.milestones) {
    prompt += `\n- Milestones: ${context.milestones.total} total (${context.milestones.completed} completed, ${context.milestones.pending} pending)`;
  }

  if (context?.fidelityScore) {
    prompt += `\n- Average fidelity score: ${context.fidelityScore}`;
  }

  if (context?.recentActivity) {
    prompt += `\n\nRecent Activity:\n${context.recentActivity}`;
  }

  prompt += `\n\nUse this context to provide highly relevant, personalized guidance. Reference specific data points when helpful.`;

  return prompt;
}