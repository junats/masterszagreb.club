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
        // Get authenticated user
        const authHeader = req.headers.get('Authorization')!
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_ANON_KEY') ?? '',
            { global: { headers: { Authorization: authHeader } } }
        )

        const { data: { user } } = await supabaseClient.auth.getUser()
        if (!user) throw new Error('Must be logged in to invite')

        const { email } = await req.json()
        if (!email || !email.includes('@')) {
            throw new Error('Invalid email address')
        }

        console.log(`Inviting: ${email} by user: ${user.email}`)

        // 1. Save to database
        const { error: dbError } = await supabaseClient
            .from('coparent_invites')
            .insert({
                invited_email: email,
                invited_by: user.id
            })

        if (dbError) {
            console.error('Database error:', dbError)
            throw new Error('Failed to save invite: ' + dbError.message)
        }

        // 2. Send email via Resend API directly
        const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')

        if (!RESEND_API_KEY) {
            console.error('RESEND_API_KEY not set')
            throw new Error('Email service not configured')
        }

        const inviteUrl = `https://truetrack.app/accept-invite?email=${encodeURIComponent(email)}`

        const emailResponse = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${RESEND_API_KEY}`,
            },
            body: JSON.stringify({
                from: 'TrueTrack <noreply@resend.dev>',
                to: [email],
                subject: 'You\'ve been invited to TrueTrack',
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                        <h2 style="color: #3b82f6;">TrueTrack Calendar Invitation</h2>
                        <p>Hi there,</p>
                        <p><strong>${user.email}</strong> has invited you to share their TrueTrack co-parenting calendar.</p>
                        <p>TrueTrack helps co-parents manage custody schedules, track expenses, and stay organized.</p>
                        <div style="margin: 30px 0;">
                            <a href="${inviteUrl}" 
                               style="background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                                Accept Invitation
                            </a>
                        </div>
                        <p style="color: #666; font-size: 14px;">
                            If you didn't expect this invitation, you can safely ignore this email.
                        </p>
                    </div>
                `,
            }),
        })

        if (!emailResponse.ok) {
            const errorText = await emailResponse.text()
            console.error('Resend API error:', errorText)
            throw new Error('Failed to send email via Resend: ' + errorText)
        }

        const emailData = await emailResponse.json()
        console.log('Email sent successfully:', emailData)

        return new Response(JSON.stringify({
            success: true,
            message: `Invitation sent to ${email}`,
            emailId: emailData.id
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        })

    } catch (error) {
        console.error("Function Error:", error)
        return new Response(JSON.stringify({
            error: error.message || "Unknown error",
            details: error.toString()
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        })
    }
})
