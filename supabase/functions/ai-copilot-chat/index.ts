import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, context } = await req.json();
    console.log('AI Copilot request:', { messageCount: messages?.length, context });
    
    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
    if (!GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is not configured');
    }

    // Build context-aware system prompt
    const systemPrompt = buildSystemPrompt(context);
    
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
          ...messages
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ 
          error: 'Rate limit exceeded. Please try again in a moment.' 
        }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      if (response.status === 402) {
        return new Response(JSON.stringify({ 
          error: 'AI credits exhausted. Please add credits to continue.' 
        }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    return new Response(response.body, {
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
  let prompt = `You are the IMPACT Companion AI Assistant, an expert in implementation science and educational change management. You help school leaders navigate the implementation process using the "Implement with IMPACT" framework.

Core Framework Stages:
1. **Decide** - Define problems, set goals, evaluate options
2. **Plan** - Build comprehensive implementation plans
3. **Implement** - Execute with fidelity monitoring
4. **Monitor** - Track progress and adapt
5. **Sustain** - Ensure long-term success

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