import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

serve(async (req) => {
    try {
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_ANON_KEY') ?? '',
            { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
        )

        // 1. Get the user from the JWT
        const {
            data: { user },
        } = await supabaseClient.auth.getUser()

        if (!user) throw new Error('No user found for JWT!')

        // 2. Create Admin Client to delete user
        const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        // 3. Delete the user from Auth (This should cascade delete data if foreign keys are set up correctly)
        // If not, we might need to manually delete from tables first.
        // Assuming 'users' table has ON DELETE CASCADE from auth.users
        const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(
            user.id
        )

        if (deleteError) throw deleteError

        return new Response(
            JSON.stringify({ message: "Account deleted successfully" }),
            { headers: { "Content-Type": "application/json" } },
        )
    } catch (error) {
        return new Response(
            JSON.stringify({ error: error.message }),
            { status: 400, headers: { "Content-Type": "application/json" } },
        )
    }
})
