// Edge Function: create-user
// Creates a user (admin) and sets initial profile fields and optional team assignment
// Security: only admins/owners may call (verified via JWT and profiles.role)
// deno-lint-ignore-file
// @ts-nocheck
/// <reference lib="deno.unstable" />
/// <reference lib="dom" />

// @ts-ignore remote import for Deno deploy
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
// @ts-ignore remote import for Deno deploy
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

type AppRole = 'owner' | 'admin' | 'manager' | 'learner'

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS"
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: { ...corsHeaders } });
  }

  try {
    const { email, first_name, last_name, mobile_number, role, team_id }: { email: string; first_name?: string; last_name?: string; mobile_number?: string; role: AppRole; team_id?: string } = await req.json();
    if (!email || !role) {
      return new Response(JSON.stringify({ error: 'email and role are required' }), { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } });
    }

    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const authClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: req.headers.get('Authorization') || '' } },
    });
    const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Verify caller role
    const { data: userRes } = await authClient.auth.getUser();
    const callerId = userRes.user?.id;
    if (!callerId) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } });
    const { data: callerProfile } = await adminClient.from('profiles').select('role').eq('user_id', callerId).maybeSingle();
    if (!callerProfile || !['owner','admin'].includes(callerProfile.role)) return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders } });

    // Create user
    const { data: createData, error: createErr } = await adminClient.auth.admin.createUser({ email, email_confirm: false });
    if (createErr) return new Response(JSON.stringify({ error: createErr.message }), { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } });
    const newUserId = createData.user?.id;
    if (!newUserId) return new Response(JSON.stringify({ error: 'Failed to create user id' }), { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } });

    const full_name = [first_name||'', last_name||''].filter(Boolean).join(' ').trim() || null;
    const profilePayload: Record<string, any> = { user_id: newUserId, role };
    if (full_name) profilePayload.full_name = full_name;
    if (first_name) profilePayload.first_name = first_name;
    if (last_name) profilePayload.last_name = last_name;
    if (mobile_number) profilePayload.mobile_number = mobile_number;

    // Upsert profile with safe fallback if some columns are missing
    const upsert = async (payload: Record<string, any>) => {
      const { error } = await adminClient.from('profiles').upsert(payload, { onConflict: 'user_id' });
      return error;
    };
    let upErr = await upsert(profilePayload);
    if (upErr && (upErr as any).code === '42703') {
      // Column missing; retry with minimal set
      upErr = await upsert({ user_id: newUserId, role, full_name });
    }

    // Optional team membership
    if (team_id) {
      const { error: tmErr } = await adminClient.from('team_memberships').insert({ team_id, user_id: newUserId });
      if (tmErr && (tmErr as any).code !== '23505') {
        console.warn('team_memberships insert error', tmErr);
      }
    }

    return new Response(JSON.stringify({ success: true, user_id: newUserId }), { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: 'Server error' }), { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } });
  }
});
