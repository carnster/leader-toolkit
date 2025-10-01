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
    const { type, context } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    let systemPrompt = '';
    let userPrompt = '';

    switch (type) {
      case 'decision-brief':
        systemPrompt = `You are an implementation science expert helping educators create decision briefs for school improvement initiatives. 
Your role is to help them articulate problems clearly, consider equity, assess feasibility, and define success metrics.
Be concise, practical, and focused on what will help them make evidence-informed decisions.`;
        userPrompt = `Based on this context: ${JSON.stringify(context)}
Provide 2-3 specific suggestions to strengthen this decision brief. Focus on clarity, equity considerations, and measurable outcomes.`;
        break;

      case 'active-ingredients':
        systemPrompt = `You are an implementation science expert helping educators identify and define active ingredients - the core components that make an intervention work.
Help distinguish between core (non-negotiable) practices and adaptable elements. Be specific about what implementation looks like.`;
        userPrompt = `Based on this initiative: ${JSON.stringify(context)}
Suggest 3-5 active ingredients with clear descriptions. Mark which are core vs. adaptable and include observable "look-fors" for each.`;
        break;

      case 'pdsa-suggestion':
        systemPrompt = `You are an improvement science coach helping educators run PDSA (Plan-Do-Study-Act) cycles.
Help them frame clear aims, testable change ideas, and measurable outcomes. Keep cycles small and actionable.`;
        userPrompt = `Based on current data: ${JSON.stringify(context)}
Suggest a focused PDSA cycle with: 1) A specific aim, 2) A testable change idea, 3) How to measure success. Keep it achievable within 2-4 weeks.`;
        break;

      case 'sustainability':
        systemPrompt = `You are an implementation sustainability expert helping educators embed practices long-term.
Focus on routines, resource protections, and capacity building. Help them think beyond the initial implementation phase.`;
        userPrompt = `Based on this initiative: ${JSON.stringify(context)}
Suggest 3-4 specific strategies to sustain this work, including embedding routines, protecting resources, and onboarding new staff.`;
        break;

      default:
        throw new Error('Invalid copilot type');
    }

    console.log('AI Copilot Request:', { type, systemPrompt: systemPrompt.substring(0, 100) });

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

    const data = await response.json();
    const suggestion = data.choices?.[0]?.message?.content;

    console.log('AI Copilot Response generated successfully');

    return new Response(JSON.stringify({ suggestion }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in ai-copilot function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
