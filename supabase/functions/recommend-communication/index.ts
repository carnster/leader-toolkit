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
    chosen_approach: z.string().max(2000).optional(),
    stakeholder_input: z.string().max(5000).optional(),
    equity_notes: z.string().max(5000).optional(),
  }),
  teamMembers: z.array(z.object({
    name: z.string().optional(),
    role_in_initiative: z.string(),
  })).optional(),
});

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { decisionBrief, teamMembers } = requestSchema.parse(body);
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    console.log('Calling Lovable AI for communication recommendations...');

    const systemPrompt = `You are an expert in educational change management and stakeholder engagement.

Your role is to design a comprehensive communication and stakeholder engagement plan that:
- Builds awareness and understanding of the initiative
- Creates buy-in and commitment from key stakeholders
- Maintains ongoing engagement and support
- Addresses concerns and resistance proactively
- Ensures equity in communication access and approaches

Key stakeholder groups in schools typically include:
- Teachers/Staff
- School Leadership
- Students
- Parents/Families
- District Leadership
- Community Partners
- Governors/Board Members

Consider:
- Different communication needs and preferences of each group
- Appropriate channels (meetings, newsletters, presentations, etc.)
- Timing and frequency of communication
- Two-way communication opportunities for feedback
- Cultural and linguistic accessibility`;

    const teamContext = teamMembers && teamMembers.length > 0 
      ? `\n\nTeam Members:\n${teamMembers.map(m => `- ${m.name || 'Unnamed'} (${m.role_in_initiative})`).join('\n')}`
      : '';

    const userPrompt = `Design a communication and stakeholder engagement plan for this initiative:

**Initiative Context:**
Problem: ${decisionBrief.problem_statement || 'Not specified'}
Target Group: ${decisionBrief.target_group || 'Not specified'}
Approach: ${decisionBrief.chosen_approach || 'Not specified'}
Goals: ${decisionBrief.goals || 'Not specified'}

**Stakeholder Input Already Gathered:**
${decisionBrief.stakeholder_input || 'Not specified'}

**Equity Considerations:**
${decisionBrief.equity_notes || 'Not specified'}
${teamContext}

Generate 8-12 communication activities that:
1. Cover different stakeholder groups
2. Include various activity types (launch meetings, progress updates, feedback sessions, etc.)
3. Use appropriate channels for each stakeholder group
4. Are sequenced logically over time
5. Create opportunities for two-way communication and feedback
6. Address equity and accessibility in communication`;

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
              name: 'provide_communication_plan',
              description: 'Provide structured communication activities for stakeholder engagement',
              parameters: {
                type: 'object',
                properties: {
                  activities: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        stakeholder_group: {
                          type: 'string',
                          description: 'Target stakeholder group (e.g., Teachers, Parents, Leadership)'
                        },
                        activity_type: {
                          type: 'string',
                          description: 'Type of communication activity (e.g., Launch Meeting, Newsletter, Feedback Session)'
                        },
                        description: {
                          type: 'string',
                          description: 'Brief description of the activity and its purpose'
                        },
                        channel: {
                          type: 'string',
                          description: 'Communication channel (e.g., Email, In-person Meeting, Newsletter)'
                        },
                        timing: {
                          type: 'string',
                          description: 'When to conduct this activity (e.g., Week 1, Monthly, Quarterly)'
                        }
                      },
                      required: ['stakeholder_group', 'activity_type', 'description', 'channel', 'timing'],
                      additionalProperties: false
                    }
                  }
                },
                required: ['activities'],
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: { type: 'function', function: { name: 'provide_communication_plan' } }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      throw new Error(`AI gateway returned ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    console.log('AI response received');

    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      throw new Error('No tool call in AI response');
    }

    const recommendations = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify(recommendations), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in recommend-communication function:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});