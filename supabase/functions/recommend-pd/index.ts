import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const requestSchema = z.object({
  activeIngredients: z.array(z.object({
    name: z.string().max(200),
    is_core: z.boolean(),
    look_fors: z.array(z.string()).optional(),
  })).max(50),
  teamMembers: z.array(z.object({
    role_in_initiative: z.string().max(100),
  })).optional(),
});

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { activeIngredients, teamMembers } = requestSchema.parse(body);
    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');

    if (!GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is not configured');
    }

    const systemPrompt = `You are an expert in professional development design for educational implementation.

Design 5-7 professional development activities that build capacity for implementing the active ingredients with fidelity. Follow best practices:

- **Job-embedded learning**: Integrate PD into regular practice
- **Ongoing support**: Not one-time workshops, but sustained coaching
- **Differentiated**: Match to team member roles and needs
- **Practice-focused**: Include observation, feedback, reflection
- **Fidelity-aligned**: Directly teach the "look-fors" for each ingredient

Activity types to consider:
- initial_training: Initial training workshops
- ongoing_coaching: Coaching and mentoring
- collaborative_learning: Learning communities/PLCs
- external_workshop: Modeling and observation
- self_directed: Co-planning and self-study sessions

Each activity should include:
- Title and type
- Description
- Target audience (which team roles)
- Duration
- Fidelity focus (which active ingredients)
- Facilitator suggestions`;

    const ingredientsList = activeIngredients?.map((ing: any) => 
      `- ${ing.name} (${ing.is_core ? 'CORE' : 'Adaptable'})${ing.look_fors ? '\n  Look-fors: ' + ing.look_fors.slice(0, 2).join('; ') : ''}`
    ).join('\n') || 'None specified';

    const teamRoles = teamMembers?.map((tm: any) => tm.role_in_initiative).join(', ') || 'Not specified';

    const userPrompt = `Design professional development activities for implementing these active ingredients:

**Active Ingredients:**
${ingredientsList}

**Team Composition:**
Roles: ${teamRoles}

**Requirements:**
- Build capacity for quality implementation
- Address the core ingredients (non-negotiable elements)
- Provide ongoing support, not just initial training
- Include observation and feedback opportunities
- Differentiate for different team roles

Create a comprehensive PD plan that ensures fidelity to the active ingredients.`;

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
              name: 'provide_pd_activities',
              description: 'Provide structured professional development activities',
              parameters: {
                type: 'object',
                properties: {
                  activities: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        title: { type: 'string' },
                        activity_type: { 
                          type: 'string',
                          enum: ['initial_training', 'ongoing_coaching', 'collaborative_learning', 'external_workshop', 'self_directed']
                        },
                        description: { type: 'string' },
                        target_audience: { type: 'array', items: { type: 'string' } },
                        duration_minutes: { type: 'number' },
                        fidelity_focus: { type: 'array', items: { type: 'string' } },
                        facilitator: { type: 'string' }
                      },
                      required: ['title', 'activity_type', 'description', 'target_audience', 'duration_minutes']
                    }
                  }
                },
                required: ['activities']
              }
            }
          }
        ],
        tool_choice: { type: 'function', function: { name: 'provide_pd_activities' } }
      }),
    });

    if (!response.ok) {
      const msg = response.status === 429
        ? 'Rate limit exceeded. Please try again later.'
        : response.status === 402
          ? 'AI credits exhausted. Please add credits to continue.'
          : `AI gateway error (status: ${response.status})`;
      console.error('AI gateway non-2xx for PD:', response.status);
      // Return 200 with an error payload so the client (using supabase.functions.invoke)
      // can surface a friendly message. We still include a code for client-side handling.
      return new Response(JSON.stringify({ error: msg, code: response.status }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const data = await response.json();
    
    // Try to extract tool call first (preferred)
    const toolCalls = data.choices?.[0]?.message?.tool_calls ?? [];
    let activitiesResult: any = null;

    try {
      const toolCall = toolCalls.find((tc: any) => tc?.function?.name === 'provide_pd_activities') || toolCalls[0];
      if (toolCall?.function?.arguments) {
        const parsed = JSON.parse(toolCall.function.arguments);
        activitiesResult = parsed?.activities ? parsed : null;
      }
    } catch (e) {
      console.error('Failed parsing tool call arguments:', e);
    }

    // Fallback: try to parse JSON from the assistant content when no tool call is present
    if (!activitiesResult) {
      const content = data.choices?.[0]?.message?.content;
      if (typeof content === 'string') {
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          try {
            const parsed = JSON.parse(jsonMatch[0]);
            if (parsed?.activities) {
              activitiesResult = parsed;
            }
          } catch (e) {
            console.error('Failed parsing JSON from content:', e);
          }
        }
      }
    }
    
    if (!activitiesResult?.activities || !Array.isArray(activitiesResult.activities)) {
      console.error('No PD activities returned from AI. Raw response:', JSON.stringify(data, null, 2));
      return new Response(JSON.stringify({ error: 'The AI did not return PD activities. Please try again.' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Sanitize and coerce fields to match frontend expectations
    const allowedTypes = new Set(['initial_training', 'ongoing_coaching', 'collaborative_learning', 'external_workshop', 'self_directed']);
    const typeMap: Record<string, string> = {
      workshop: 'initial_training',
      training: 'initial_training',
      initial: 'initial_training',
      coaching: 'ongoing_coaching',
      mentoring: 'ongoing_coaching',
      plc: 'collaborative_learning',
      community_of_practice: 'collaborative_learning',
      observation: 'external_workshop',
      model_observation: 'external_workshop',
      self_study: 'self_directed',
      self_directed: 'self_directed',
    };

    const cleaned = {
      activities: activitiesResult.activities.map((a: any) => {
        let t = (a.activity_type || '').toString().toLowerCase().replace(/\s+/g, '_');
        if (!allowedTypes.has(t)) t = typeMap[t] || 'initial_training';
        const duration = typeof a.duration_minutes === 'string' ? parseInt(a.duration_minutes, 10) : a.duration_minutes;
        return {
          title: a.title || 'Professional Learning Session',
          activity_type: t,
          description: a.description || null,
          target_audience: Array.isArray(a.target_audience) ? a.target_audience : (a.target_audience ? [String(a.target_audience)] : null),
          duration_minutes: Number.isFinite(duration) ? duration : 60,
          fidelity_focus: Array.isArray(a.fidelity_focus) ? a.fidelity_focus : (a.fidelity_focus ? [String(a.fidelity_focus)] : null),
          facilitator: a.facilitator || null,
        };
      })
    };

    return new Response(JSON.stringify(cleaned), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in recommend-pd function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Failed to generate PD recommendations' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
