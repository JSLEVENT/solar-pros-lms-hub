// Edge Function: create-user
// Purpose: Create an auth user + profile + optional team membership with clear error diagnostics.
// Security: Only owner/admin callers (validated via caller profile role) may invoke.
// Notes: Returns granular error JSON on failure: { success:false, step, error, code }.
// deno-lint-ignore-file
// @ts-nocheck
/// <reference lib="deno.unstable" />
/// <reference lib="dom" />
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

type AppRole = 'owner' | 'admin' | 'manager' | 'learner';

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
    if (!email || !role) return new Response(JSON.stringify({ success:false, step:'validate-input', error:'email and role are required' }), { status:400, headers:{"Content-Type":"application/json",...corsHeaders}});

    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !SUPABASE_SERVICE_ROLE_KEY) {
      return new Response(JSON.stringify({ success:false, step:'env-check', error:'Missing function secrets (SUPABASE_URL/ANON/SERVICE_ROLE_KEY)' }), { status:500, headers:{"Content-Type":"application/json",...corsHeaders}});
    }

    const authClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { global:{ headers:{ Authorization: req.headers.get('Authorization') || '' }}});
    const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Caller auth
    const { data: userRes, error: callerErr } = await authClient.auth.getUser();
    if (callerErr) return new Response(JSON.stringify({ success:false, step:'get-caller', error: callerErr.message }), { status:401, headers:{"Content-Type":"application/json",...corsHeaders}});
    const callerId = userRes.user?.id;
    if (!callerId) return new Response(JSON.stringify({ success:false, step:'get-caller', error:'No caller id' }), { status:401, headers:{"Content-Type":"application/json",...corsHeaders}});

    // id key detection
    let idKey: 'user_id' | 'id' = 'user_id';
    try { const probe = await adminClient.from('profiles' as any).select('user_id' as any, { head:true, count:'exact' }); if (probe.error && (probe.error as any).code === '42703') idKey = 'id'; } catch { /* ignore */ }

    // Caller role
    const { data: callerProfile } = await adminClient.from('profiles').select('role').eq(idKey, callerId).maybeSingle();
    if (!callerProfile || !['owner','admin'].includes(callerProfile.role)) return new Response(JSON.stringify({ success:false, step:'authz', error:'Forbidden' }), { status:403, headers:{"Content-Type":"application/json",...corsHeaders}});

    // Auth user creation
    const { data: created, error: createErr } = await adminClient.auth.admin.createUser({ email, email_confirm:false });
    if (createErr) return new Response(JSON.stringify({ success:false, step:'create-auth-user', error:createErr.message, code:createErr.status }), { status:400, headers:{"Content-Type":"application/json",...corsHeaders}});
    const newUserId = created.user?.id;
    if (!newUserId) return new Response(JSON.stringify({ success:false, step:'create-auth-user', error:'Missing new user id'}), { status:500, headers:{"Content-Type":"application/json",...corsHeaders}});

    const full_name = [first_name||'', last_name||''].filter(Boolean).join(' ').trim() || null;
    const extended: Record<string, any> = { [idKey]: newUserId, role, is_active:true };
    if (full_name) extended.full_name = full_name;
    if (first_name) extended.first_name = first_name;
    if (last_name) extended.last_name = last_name;
    if (mobile_number) extended.mobile_number = mobile_number;

    // Insert profile (extended -> minimal)
    let profileInsertError: any = null;
    let inserted = null;
    const { error: extErr } = await adminClient.from('profiles').insert(extended as any);
    if (extErr) {
      profileInsertError = extErr;
      // Minimal attempt
      const minimal: any = { [idKey]: newUserId, role };
      if (full_name) minimal.full_name = full_name;
      const { error: minErr } = await adminClient.from('profiles').insert(minimal as any);
      if (minErr) return new Response(JSON.stringify({ success:false, step:'insert-profile', error:minErr.message, prev: extErr.message, code:minErr.code }), { status:400, headers:{"Content-Type":"application/json",...corsHeaders}});
    }

    // Preferences mobile fallback
    if (mobile_number) {
      try {
        const { data: pref } = await adminClient.from('profiles').select('preferences').eq(idKey, newUserId).maybeSingle();
        const prefs = pref && typeof (pref as any).preferences === 'object' ? (pref as any).preferences : {};
        if (!prefs.mobile_number) {
          const next = { ...prefs, mobile_number };
          await adminClient.from('profiles').update({ preferences: next } as any).eq(idKey, newUserId);
        }
      } catch { /* ignore */ }
    }

    // Team membership
    let teamWarning: string | undefined;
    if (team_id && team_id.trim().length) {
      const { error: tmErr } = await adminClient.from('team_memberships').insert({ team_id, user_id: newUserId });
      if (tmErr && (tmErr as any).code !== '23505') teamWarning = tmErr.message || 'team assignment failed';
    }

    // Return created profile (best-effort)
    let profile: any = null;
    try { const { data: p } = await adminClient.from('profiles').select('*').eq(idKey, newUserId).maybeSingle(); profile = p; } catch { /* ignore */ }

    return new Response(JSON.stringify({ success:true, user_id:newUserId, profile, warning: teamWarning, profileInsertError: profileInsertError?.message }), { status:200, headers:{"Content-Type":"application/json",...corsHeaders}});
  } catch (e:any) {
    return new Response(JSON.stringify({ success:false, step:'unhandled', error: e?.message || 'Server error' }), { status:500, headers:{"Content-Type":"application/json",...corsHeaders}});
  }
});
