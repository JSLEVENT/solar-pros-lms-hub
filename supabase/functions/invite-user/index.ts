// Edge Function: invite-user
// Invites a user by email and sets initial profile (name fields, role, mobile), optional team assignment
// Security: only admins/owners may call (verified via JWT and profiles.role)
// deno-lint-ignore-file
// @ts-nocheck
// The below references help local editors; Supabase deploy uses Deno runtime with these available.
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
  const { email, full_name, role, first_name, last_name, mobile_number, team_id }: { email: string; full_name?: string; role: AppRole; first_name?: string; last_name?: string; mobile_number?: string; team_id?: string } = await req.json();
  if (!email || !role) {
      return new Response(JSON.stringify({ error: 'email and role are required' }), { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } });
    }

    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // Client bound to the caller's JWT for auth context
    const authClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: req.headers.get('Authorization') || '' } },
    });

    // Admin client for privileged operations
    const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Verify caller is admin/owner
    const { data: userRes } = await authClient.auth.getUser();
    const callerId = userRes.user?.id;
    if (!callerId) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } });
    }

    const { data: callerProfile, error: callerErr } = await adminClient
      .from('profiles')
      .select('role')
      .eq('user_id', callerId)
      .single();
    if (callerErr || !callerProfile || !['owner', 'admin'].includes(callerProfile.role)) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders } });
    }

    // Invite user by email
    const { data: inviteData, error: inviteError } = await adminClient.auth.admin.inviteUserByEmail(email, {
      // redirectTo could be set here if desired
    });
    if (inviteError) {
      return new Response(JSON.stringify({ error: inviteError.message }), { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } });
    }

    const newUserId = inviteData.user?.id;
    if (!newUserId) {
      return new Response(JSON.stringify({ error: 'Failed to obtain invited user id' }), { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } });
    }

    // Upsert profile with initial role and name fields
    const resolvedFullName = full_name || [first_name||'', last_name||''].filter(Boolean).join(' ').trim() || null;
    const profilePayload: Record<string, any> = { user_id: newUserId, role };
    if (resolvedFullName) profilePayload.full_name = resolvedFullName;
    if (first_name) profilePayload.first_name = first_name;
    if (last_name) profilePayload.last_name = last_name;
    if (mobile_number) profilePayload.mobile_number = mobile_number;
    let { error: upsertErr } = await adminClient.from('profiles').upsert(profilePayload, { onConflict: 'user_id' });
    if (upsertErr && (upsertErr as any).code === '42703') {
      // Column mismatch; retry with minimal set
      const retry = { user_id: newUserId, role, full_name: resolvedFullName };
      const { error: up2 } = await adminClient.from('profiles').upsert(retry, { onConflict: 'user_id' });
      if (up2) console.error('Profile upsert retry error:', up2);
    }

    // Optional team membership
    if (team_id) {
      const { error: tmErr } = await adminClient.from('team_memberships').insert({ team_id, user_id: newUserId });
      if (tmErr && (tmErr as any).code !== '23505') {
        console.error('team_memberships insert error', tmErr);
      }
    }

    return new Response(JSON.stringify({ success: true, user_id: newUserId }), { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } });

  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: 'Server error' }), { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } });
  }
});
