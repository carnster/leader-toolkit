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
    const { activeIngredients, teamMembers } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const systemPrompt = `You are an expert in professional development design for educational implementation.

Design 5-7 professional development activities that build capacity for implementing the active ingredients with fidelity. Follow best practices:

- **Job-embedded learning**: Integrate PD into regular practice
- **Ongoing support**: Not one-time workshops, but sustained coaching
- **Differentiated**: Match to team member roles and needs
- **Practice-focused**: Include observation, feedback, reflection
- **Fidelity-aligned**: Directly teach the "look-fors" for each ingredient

Activity types to consider:
- Initial training workshops
- Coaching and mentoring
- Learning communities/PLCs
- Modeling and observation
- Co-planning sessions
- Feedback cycles

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
                          enum: ['workshop', 'coaching', 'modeling', 'community_of_practice', 'co_planning', 'other']
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
      throw new Error('Failed to get PD recommendations from AI');
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    
    if (!toolCall) {
      throw new Error('No PD activities returned');
    }

    const result = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify(result), {
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
