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
    // Try with extended columns first
    const baseProfile: Record<string, any> = { user_id: newUserId, role };
    if (full_name) baseProfile.full_name = full_name;
    // Prefer is_active true so user lists include them immediately if filtered
    baseProfile.is_active = true;
    if (first_name) baseProfile.first_name = first_name;
    if (last_name) baseProfile.last_name = last_name;
    if (mobile_number) baseProfile.mobile_number = mobile_number;

    // Progressive fallback upsert to tolerate column drift
    const upsertProfile = async (payload: Record<string, any>) => adminClient.from('profiles').upsert(payload, { onConflict: 'user_id' });

    let upErr: any = null;
    {
      const { error } = await upsertProfile(baseProfile);
      upErr = error;
    }
    if (upErr && upErr.code === '42703') {
      // Remove potentially missing columns and retry
      const { error } = await upsertProfile({ user_id: newUserId, role, full_name, is_active: true } as any);
      upErr = error;
    }
    if (upErr && upErr.code === '42703') {
      // Minimal fallback
      const { error } = await upsertProfile({ user_id: newUserId, role, full_name } as any);
      upErr = error;
    }
    if (upErr) {
      return new Response(JSON.stringify({ error: `profile upsert failed: ${upErr.message||'unknown'}` }), { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } });
    }

    // If mobile_number couldn't be stored due to missing column, persist into preferences.mobile_number (best-effort)
    if (mobile_number) {
      try {
        const { data: prefRow } = await adminClient.from('profiles').select('preferences').eq('user_id', newUserId).maybeSingle();
        const prefs = prefRow && typeof (prefRow as any).preferences === 'object' ? (prefRow as any).preferences : {};
        if (!prefs.mobile_number) {
          const nextPrefs = { ...prefs, mobile_number };
          await adminClient.from('profiles').update({ preferences: nextPrefs } as any).eq('user_id', newUserId);
        }
      } catch (_) { /* ignore */ }
    }

    // Optional team membership
    if (team_id && String(team_id).trim().length > 0) {
      const { error: tmErr } = await adminClient.from('team_memberships').insert({ team_id, user_id: newUserId });
      if (tmErr && (tmErr as any).code !== '23505') {
        // Hard fail to surface configuration issues like missing team or constraints
        return new Response(JSON.stringify({ error: `team assignment failed: ${tmErr.message||'unknown'}`, user_id: newUserId }), { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } });
      }
    }

    return new Response(JSON.stringify({ success: true, user_id: newUserId }), { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: 'Server error' }), { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } });
  }
});
