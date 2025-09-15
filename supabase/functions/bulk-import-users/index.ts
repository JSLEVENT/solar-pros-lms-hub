// Edge Function: bulk-import-users
// Imports users from CSV or rows, invites or creates accounts, upserts profiles, and assigns teams
// Security: only admins/owners may call
// deno-lint-ignore-file
// @ts-nocheck
/// <reference lib="deno.unstable" />
/// <reference lib="dom" />

// @ts-ignore Deno std
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
// @ts-ignore Supabase client
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
// @ts-ignore CSV parse from Deno std
import { parse } from "https://deno.land/std@0.224.0/csv/parse.ts";

type AppRole = 'owner'|'admin'|'manager'|'learner';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS"
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: { ...corsHeaders } });
  try {
    const body = await req.json();
    const { csv, rows, mode = 'invite', teamMatch = 'name' } = body as { csv?: string; rows?: any[]; mode?: 'invite'|'create'; teamMatch?: 'name'|'id' };

    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const authClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: req.headers.get('Authorization') || '' } },
    });
    const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Verify caller role
    const { data: ures } = await authClient.auth.getUser();
    const callerId = ures.user?.id;
    if (!callerId) return json({ error: 'Unauthorized' }, 401);
    const { data: caller } = await adminClient.from('profiles').select('role').eq('user_id', callerId).maybeSingle();
    if (!caller || !['owner','admin'].includes(caller.role)) return json({ error: 'Forbidden' }, 403);

    // Parse CSV if provided
    let items: any[] = rows || [];
    if (!items.length && typeof csv === 'string' && csv.trim()){
      const parsed = await parse(csv, { skipFirstRow: false, columns: true });
      items = Array.isArray(parsed) ? parsed : [];
    }
    if (!items.length) return json({ error: 'No rows provided' }, 400);

    // Normalize rows
    const norm = (r: any) => {
      const o: any = {};
      const get = (k: string) => (r[k] ?? r[k.toLowerCase()] ?? r[k.toUpperCase()] ?? '').toString().trim();
      o.email = get('email');
      o.first_name = get('first_name');
      o.last_name = get('last_name');
      o.mobile_number = get('mobile_number') || get('mobile');
      o.role = (get('role') || 'learner').toLowerCase();
      o.team_name = get('team_name');
      o.team_id = get('team_id');
      return o;
    };

    const roleAllowed = new Set(['owner','admin','manager','learner']);
    const teamCacheByName = new Map<string,string>();
    const teamCacheById = new Set<string>();

    const results: any[] = [];
    for (const raw of items){
      const row = norm(raw);
      const res: any = { email: row.email, status: 'ok', message: '', team_assigned: false };
      try {
        if(!row.email){ throw new Error('Missing email'); }
        if(!roleAllowed.has(row.role)) row.role = 'learner';

        // resolve team id if provided
        let team_id: string | null = null;
        if (teamMatch === 'id' && row.team_id){
          team_id = row.team_id;
          // optionally verify existence only once
          if (!teamCacheById.has(team_id)){
            const { data: t } = await adminClient.from('teams').select('id').eq('id', team_id).maybeSingle();
            if (!t) team_id = null; else teamCacheById.add(team_id);
          }
        } else if (teamMatch === 'name' && row.team_name){
          if (teamCacheByName.has(row.team_name)) team_id = teamCacheByName.get(row.team_name)!;
          else {
            const { data: t } = await adminClient.from('teams').select('id').eq('name', row.team_name).maybeSingle();
            if (t) { team_id = t.id; teamCacheByName.set(row.team_name, t.id); }
          }
        }

        // create or invite
        let user_id: string | null = null;
        if (mode === 'create'){
          const { data: c, error: e } = await adminClient.auth.admin.createUser({ email: row.email, email_confirm: false });
          if (e) throw new Error(e.message);
          user_id = c.user?.id || null;
        } else {
          const { data: inv, error: e } = await adminClient.auth.admin.inviteUserByEmail(row.email, {});
          if (e) throw new Error(e.message);
          user_id = inv.user?.id || null;
        }
        if (!user_id) throw new Error('No user id returned');

        // upsert profile
        const full_name = [row.first_name, row.last_name].filter(Boolean).join(' ').trim() || null;
        const prof: any = { user_id, role: row.role };
        if (full_name) prof.full_name = full_name;
        if (row.first_name) prof.first_name = row.first_name;
        if (row.last_name) prof.last_name = row.last_name;
        if (row.mobile_number) prof.mobile_number = row.mobile_number;
        let { error: upErr } = await adminClient.from('profiles').upsert(prof, { onConflict: 'user_id' });
        if (upErr && (upErr as any).code === '42703'){
          const { error: up2 } = await adminClient.from('profiles').upsert({ user_id, role: row.role, full_name }, { onConflict: 'user_id' });
          if (up2) console.warn('profiles upsert fallback failed', up2);
        }

        // team membership
        if (team_id){
          const { error: tmErr } = await adminClient.from('team_memberships').insert({ team_id, user_id });
          if (!tmErr || (tmErr as any).code === '23505') res.team_assigned = true;
        }
      } catch (e: any) {
        res.status = 'error';
        res.message = e?.message || 'Unknown error';
      }
      results.push(res);
    }

    const summary = {
      total: results.length,
      succeeded: results.filter(r=> r.status==='ok').length,
      failed: results.filter(r=> r.status!=='ok').length
    };
    return json({ summary, results }, 200);
  } catch (e) {
    console.error(e);
    return json({ error: 'Server error' }, 500);
  }
});

function json(obj: unknown, status = 200){
  return new Response(JSON.stringify(obj), { status, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
}
