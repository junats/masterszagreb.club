import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    // CORS Handshake
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const supabaseClient = createClient(
            // Automatically injected by Supabase Edge Runtime
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        const { email } = await req.json()

        if (!email) throw new Error('Missing email')

        // Standard Supabase Invite
        // This sends the "Invite User" email template defined in your Dashboard
        const { data, error } = await supabaseClient.auth.admin.inviteUserByEmail(email)

        if (error) throw error

        return new Response(JSON.stringify(data), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        })
    } catch (error) {
        console.error("Function Error:", error); // Visible in supabase functions logs
        // Return 200 so the client can read the error message in the body
        return new Response(JSON.stringify({ error: error.message || "Unknown Function Error", description: JSON.stringify(error) }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        })
    }
})
