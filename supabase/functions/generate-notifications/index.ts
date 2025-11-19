import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Call the database functions to create notifications
    const { error: milestoneError } = await supabase.rpc("create_milestone_notifications");
    if (milestoneError) {
      console.error("Error creating milestone notifications:", milestoneError);
    }

    const { error: observationError } = await supabase.rpc("create_observation_notifications");
    if (observationError) {
      console.error("Error creating observation notifications:", observationError);
    }

    const { error: pdError } = await supabase.rpc("create_pd_notifications");
    if (pdError) {
      console.error("Error creating PD notifications:", pdError);
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        message: "Notifications generated successfully"
      }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200 
      }
    );
  } catch (error) {
    console.error("Error in generate-notifications:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500 
      }
    );
  }
});
