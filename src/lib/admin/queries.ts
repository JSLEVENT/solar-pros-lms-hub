import { supabase } from '@/integrations/supabase/client';

// ---------------------------------------------
// Internal utilities
// ---------------------------------------------
type SimpleRecord = Record<string, any>;

async function safeSelect(table: string, columns: string){
  try {
    const { data, error } = await supabase.from(table as any).select(columns as any);
    if (error) {
      const code = (error as any).code;
      const status = (error as any).status;
      if (code === '42P01') return [];           // table missing
      if (code === '42703' || status === 400) {  // column missing / generic
        const retry = await supabase.from(table as any).select('*').limit(50);
        return retry.error ? [] : (retry.data||[]);
      }
      return [];
    }
    return data || [];
  } catch {
    return [];
  }
}

function sortByCreated(a: SimpleRecord[], desc = true){
  return [...a].sort((x,y)=> (desc?1:-1) * ( (y.created_at||'').localeCompare(x.created_at||'') ));
}

// ---------------------------------------------
// Admin summary / users
// ---------------------------------------------

export async function fetchAdminStats() {
  const [users, courses, enrollments, certificates, teams, managers] = await Promise.all([
    safeSelect('profiles','user_id,last_active_at'),
    safeSelect('courses','id'),
    safeSelect('enrollments','id,status'),
    safeSelect('certificates','id'),
    safeSelect('teams','id'),
    (async ()=> (await safeSelect('profiles','user_id,role')).filter((r:any)=> r.role==='manager'))()
  ]);

  const totalEnrollments = enrollments.length;
  const completed = enrollments.filter((e:any)=> e.status==='completed').length;
  const completionRate = totalEnrollments ? (completed/totalEnrollments)*100 : 0;
  const activeUsers = users.filter((u: any) => u.last_active_at && new Date(u.last_active_at) > new Date(Date.now()-7*24*60*60*1000)).length;

  return {
    totalUsers: users.length,
    totalCourses: courses.length,
    totalEnrollments,
    totalCertificates: certificates.length,
    completionRate,
    activeUsers,
    totalTeams: teams.length,
    totalManagers: managers.length
  };
}

export type AdminStats = Awaited<ReturnType<typeof fetchAdminStats>>;

export async function fetchUsers() {
  const data = await safeSelect('profiles','user_id, full_name, role, last_active_at, is_active, created_at');
  return sortByCreated(data as any[]);
}

export async function fetchUsersPage(page=0, pageSize=25){
  const from = page*pageSize;
  const to = from + pageSize - 1;
  try {
    const { data, error, count } = await supabase
      .from('profiles')
      .select('user_id, full_name, first_name, last_name, mobile_number, role, last_active_at, is_active, created_at', { count:'exact' })
      .order('created_at',{ascending:false})
      .range(from,to);
    if (error) throw error;
    return { data: data||[], count: count||0 };
  } catch (e:any) {
    // Fallback for older schema without is_active
    try {
      const { data, error, count } = await supabase
        .from('profiles')
        .select('user_id, full_name, role, last_active_at, created_at', { count:'exact' })
        .order('created_at',{ascending:false})
        .range(from,to);
      if (error) throw error;
      return { data: data||[], count: count||0 };
    } catch { return { data: [], count: 0 }; }
  }
}

export async function updateUserRole(user_id: string, role: 'owner'|'admin'|'manager'|'learner') {
  const { error } = await supabase.from('profiles').update({ role } as any).eq('user_id', user_id); if (error) throw error;
}

export async function toggleUserActive(user_id: string, next: boolean){
  // is_active not in generated types yet
  const { error } = await supabase.from('profiles').update({ is_active: next } as any).eq('user_id', user_id); if (error) throw error;
}

export async function inviteUser(payload: { email:string; full_name?:string; role?:string }){
  const { data, error } = await supabase.functions.invoke('invite-user', { body: payload });
  if (error) throw error; return data;
}

export async function createUserDirect(payload: { email:string; first_name?:string; last_name?:string; mobile_number?:string; role:'owner'|'admin'|'manager'|'learner'; team_id?: string }){
  const { data, error } = await supabase.functions.invoke('create-user', { body: payload });
  if (error) throw error; return data;
}

export async function fetchTeamsForDropdown(){
  try {
    const { data, error } = await supabase.from('teams').select('id,name').order('name');
    if (error) throw error;
    return data||[];
  } catch { return []; }
}

export async function updateUserProfile(user_id: string, payload: { first_name?: string; last_name?: string; mobile_number?: string; full_name?: string }){
  // Build full_name if not provided
  const altFull = [payload.first_name||'', payload.last_name||''].filter(Boolean).join(' ').trim();
  const full = (payload.full_name ?? (altFull || undefined));
  const body: any = { ...payload };
  if (full !== undefined) body.full_name = full;
  try {
    const { error } = await supabase.from('profiles').update(body).eq('user_id', user_id);
    if (error) throw error;
  } catch (e:any) {
    // Fallback: retry with minimal columns if some are missing
    const minimal: any = {};
    if (body.full_name !== undefined) minimal.full_name = body.full_name;
    if (Object.keys(minimal).length){
      const { error } = await supabase.from('profiles').update(minimal).eq('user_id', user_id);
      if (error) throw error;
    }
  }
}

export async function bulkUpdateUserRoles(user_ids: string[], role: 'owner'|'admin'|'manager'|'learner'){
  await Promise.all(user_ids.map(id=> updateUserRole(id, role)));
}

// ---------------------------------------------
// Teams (simple list legacy) - kept for backward compatibility
// Prefer paginated functions below in new UI
export async function fetchTeams(includeArchived = true){
  const cols = includeArchived
    ? 'id,name,description,is_archived,team_memberships(count),manager_teams(manager_id)'
    : 'id,name,description,team_memberships(count),manager_teams(manager_id)';
  const data = await safeSelect('teams', cols);
  return sortByCreated(data as any[]);
}

// Paginated teams with search & archived filter
export async function fetchTeamsPage(params:{ page:number; pageSize:number; search?:string; includeArchived?:boolean }){
  const { page, pageSize, search, includeArchived=true } = params;
  try {
    const from = page * pageSize;
    const to = from + pageSize - 1;
    let query: any = supabase.from('teams').select('id,name,description,is_archived,created_at,team_memberships(count),manager_teams(manager_id)', { count:'exact' });
    if(!includeArchived){ query = query.eq('is_archived', false); }
    if(search){ query = query.ilike('name', `%${search}%`); }
    query = query.order('created_at',{ ascending:false }).range(from,to);
    const { data, error, count } = await query;
    if(error) throw error;
    return { data: data||[], count: count||0 };
  } catch {
    // Fallback for older schema without is_archived
    try {
      const from = page * pageSize;
      const to = from + pageSize - 1;
      let query: any = supabase.from('teams').select('id,name,description,created_at,team_memberships(count),manager_teams(manager_id)', { count:'exact' });
      if(search){ query = query.ilike('name', `%${search}%`); }
      query = query.order('created_at',{ ascending:false }).range(from,to);
      const { data, error, count } = await query;
      if (error) throw error;
      return { data: data||[], count: count||0 };
    } catch { return { data: [], count: 0 }; }
  }
}

export async function fetchTeamDetail(id: string){
  try {
    const { data: raw, error } = await supabase
      .from('teams')
      .select('id,name,description,is_archived,created_at,manager_teams(manager_id),team_memberships(user_id)')
      .eq('id', id)
      .single();
    if (error || !raw) throw error || new Error('Not found');
    const team: any = raw;
    const managerIds = (team.manager_teams||[]).map((m:any)=> m.manager_id);
    const memberIds = (team.team_memberships||[]).map((m:any)=> m.user_id);
    const [managersRes, membersRes] = await Promise.all([
      managerIds.length ? supabase.from('profiles').select('user_id,first_name,last_name,full_name,role').in('user_id', managerIds) : Promise.resolve({ data: [] }),
      memberIds.length ? supabase.from('profiles').select('user_id,first_name,last_name,full_name,role').in('user_id', memberIds) : Promise.resolve({ data: [] })
    ] as any);
    let analytics: any = null;
    try {
      const { data: a } = await supabase.from('team_analytics').select('*').eq('team_id', id).maybeSingle();
      analytics = a;
    } catch {}
    return { team, managers: managersRes.data||[], members: membersRes.data||[], analytics };
  } catch {
    try {
      const { data: raw } = await supabase
        .from('teams')
        .select('id,name,description,created_at,manager_teams(manager_id),team_memberships(user_id)')
        .eq('id', id)
        .single();
      if (!raw) return null;
      const team: any = raw;
      const managerIds = (team.manager_teams||[]).map((m:any)=> m.manager_id);
      const memberIds = (team.team_memberships||[]).map((m:any)=> m.user_id);
      const [managersRes, membersRes] = await Promise.all([
        managerIds.length ? supabase.from('profiles').select('user_id,first_name,last_name,full_name,role').in('user_id', managerIds) : Promise.resolve({ data: [] }),
        memberIds.length ? supabase.from('profiles').select('user_id,first_name,last_name,full_name,role').in('user_id', memberIds) : Promise.resolve({ data: [] })
      ] as any);
      let analytics: any = null;
      try {
        const { data: a } = await supabase.from('team_analytics').select('*').eq('team_id', id).maybeSingle();
        analytics = a;
      } catch {}
      return { team, managers: managersRes.data||[], members: membersRes.data||[], analytics };
    } catch { return null; }
  }
}

export async function updateTeam(id: string, payload: { name?:string; description?:string }){
  const { error } = await supabase.from('teams').update(payload).eq('id', id); if(error) throw error;
}

export async function deleteTeam(id: string){
  const { error } = await supabase.from('teams').delete().eq('id', id); if(error) throw error;
}

export async function bulkAddMembers(team_id: string, user_ids: string[]){
  if(!user_ids.length) return;
  const rows = user_ids.map(u=> ({ team_id, user_id: u }));
  const { error } = await supabase.from('team_memberships').insert(rows); if(error) throw error;
}

export async function exportTeamMembers(team_id: string){
  try {
    const { data, error } = await supabase.from('team_memberships').select('user_id').eq('team_id', team_id);
    if(error) throw error;
    if(!data?.length) return 'user_id\n';
    return 'user_id\n' + data.map(r=> r.user_id).join('\n');
  } catch { return 'user_id\n'; }
}

export async function toggleTeamArchived(id: string, next: boolean){
  // is_archived not in generated types yet
  const { error } = await supabase.from('teams').update({ is_archived: next } as any).eq('id', id); if (error) throw error;
}

export async function assignManager(team_id: string, manager_id: string){
  const { error } = await supabase.from('manager_teams').insert({ team_id, manager_id }); if (error) throw error;
}

export async function removeManager(team_id: string, manager_id: string){
  const { error } = await supabase.from('manager_teams').delete().match({ team_id, manager_id }); if (error) throw error;
}

// ---------------------------------------------
// Courses
export async function fetchCourses(){
  const data = await safeSelect('courses','*');
  return sortByCreated(data as any[]);
}

export async function fetchAssetsPage(page=0, pageSize=30, search=''){ 
  try {
    let query = supabase.from('content_assets').select('*', { count:'exact' }).order('created_at',{ascending:false});
    if (search) query = query.ilike('title', `%${search}%`);
    const from = page*pageSize; const to = from + pageSize - 1;
    const { data, error, count } = await query.range(from,to);
    if (error) return { data: [], count: 0 };
    return { data: data||[], count: count||0 };
  } catch { return { data: [], count: 0 }; }
}

export async function fetchTeamAnalytics(){
  const data = await safeSelect('team_analytics','*');
  return (data||[]).sort((a:any,b:any)=> (b.member_count||0)-(a.member_count||0));
}

// Analytics detail queries
export async function fetchActiveUsersTimeSeries(days = 30){
  const since = new Date(Date.now() - days*24*60*60*1000).toISOString();
  const data = await safeSelect('profiles','last_active_at');
  const buckets: Record<string, number> = {};
  (data||[]).forEach((r: any)=>{
    if(!r.last_active_at) return;
    if(r.last_active_at < since) return;
    const d = new Date(r.last_active_at);
    const key = d.toISOString().slice(0,10);
    buckets[key] = (buckets[key]||0)+1;
  });
  // Fill missing days
  const series: { date:string; active:number }[] = [];
  for(let i=days-1;i>=0;i--){
    const d = new Date(Date.now()-i*24*60*60*1000).toISOString().slice(0,10);
    series.push({ date:d, active: buckets[d]||0 });
  }
  return series;
}

export async function fetchEnrollmentFunnel(){
  const { data, error } = await supabase.from('enrollments').select('status');
  if (error) throw error;
  const counts: Record<string, number> = { enrolled:0, in_progress:0, completed:0 };
  (data||[]).forEach((e:any)=>{
    if(e.status==='completed') counts.completed++;
    else if(e.status==='in_progress') counts.in_progress++;
    else counts.enrolled++;
  });
  return [
    { stage:'Enrolled', value: counts.enrolled + counts.in_progress + counts.completed },
    { stage:'In Progress', value: counts.in_progress + counts.completed },
    { stage:'Completed', value: counts.completed }
  ];
}

export async function fetchProgressDistribution(){
  const { data, error } = await supabase.from('enrollments').select('progress');
  if (error) throw error;
  const bins = [0,20,40,60,80,100];
  const distribution: { range:string; count:number }[] = [];
  for(let i=0;i<bins.length-1;i++) distribution.push({ range:`${bins[i]}-${bins[i+1]}`, count:0 });
  (data||[]).forEach((e:any)=>{
    const p = e.progress||0;
    for(let i=0;i<bins.length-1;i++){
      if(p>=bins[i] && p<bins[i+1]){ distribution[i].count++; break; }
    }
  });
  return distribution;
}

export async function fetchTopLearners(limit=10){
  // Aggregate average progress per user across enrollments
  const { data, error } = await supabase.from('enrollments').select('user_id, progress, status');
  if (error) throw error;
  const agg: Record<string, { total:number; count:number; completed:number } > = {};
  (data||[]).forEach((e:any)=>{
    if(!e.user_id) return;
    if(!agg[e.user_id]) agg[e.user_id] = { total:0, count:0, completed:0 };
    agg[e.user_id].total += e.progress||0;
    agg[e.user_id].count += 1;
    if(e.status==='completed') agg[e.user_id].completed += 1;
  });
  const rows = Object.entries(agg).map(([user_id, v])=> ({ user_id, avg_progress: v.count? v.total/v.count:0, completed: v.completed }));
  rows.sort((a,b)=> b.avg_progress - a.avg_progress);
  return rows.slice(0,limit);
}

// Teams & Memberships
export async function createTeam(name: string, description: string){
  const { data, error } = await supabase
    .from('teams')
  .insert({ name, description })
  .select('*')
    .single();
  if (error) throw error; return data;
}

export async function addMemberToTeam(team_id: string, user_id: string){
  const { error } = await supabase.from('team_memberships').insert({ team_id, user_id }); if (error) throw error;
}

export async function removeMemberFromTeam(team_id: string, user_id: string){
  const { error } = await supabase.from('team_memberships').delete().match({ team_id, user_id }); if (error) throw error;
}

// Courses CRUD
export async function createCourse(payload: { title:string; description:string; category:string; level:string; duration?:string }){
  const { error } = await supabase.from('courses').insert({ ...payload, status:'published' }); if (error) throw error;
}

export async function updateCourse(id: string, payload: Partial<{ title:string; description:string; category:string; level:string; duration:string; status:string }>){
  const { error } = await supabase.from('courses').update(payload).eq('id', id); if (error) throw error;
}

export async function deleteCourse(id: string){
  const { error } = await supabase.from('courses').delete().eq('id', id); if (error) throw error;
}

// ---------------------------------------------
// Pagination: Courses (for admin dashboard)
// ---------------------------------------------
export async function fetchCoursesPage(page=0, pageSize=25){
  try {
    const from = page*pageSize;
    const to = from + pageSize - 1;
    const { data, error, count } = await supabase
      .from('courses')
      .select('id,title,category,level,status,duration,instructor_id,created_at', { count:'exact' })
      .order('created_at',{ ascending:false })
      .range(from,to);
    if (error) return { data: [], count: 0 };
    return { data: data||[], count: count||0 };
  } catch { return { data: [], count: 0 }; }
}

// ---------------------------------------------
// CSV Exports (server-side fresh queries, not relying on paginated state)
// ---------------------------------------------
function toCSV(rows: any[]): string {
  if(!rows.length) return '';
  const headers = Object.keys(rows[0]);
  const escape = (v: any) => {
    if (v == null) return '';
    const s = String(v).replace(/"/g,'""');
    return /[",\n]/.test(s) ? `"${s}"` : s;
  };
  const lines = [headers.join(',')];
  for (const r of rows){
    lines.push(headers.map(h=> escape(r[h])).join(','));
  }
  return lines.join('\n');
}

export async function exportUsersCSV(){
  try {
    const { data, error } = await supabase.from('profiles').select('user_id,full_name,role,is_active,last_active_at,created_at');
    if (error) throw error;
    return toCSV(data||[]);
  } catch {
    const { data } = await supabase.from('profiles').select('user_id,full_name,role,last_active_at,created_at');
    return toCSV(data||[]);
  }
}

export async function exportCoursesCSV(){
  const { data, error } = await supabase.from('courses').select('id,title,category,level,status,duration,created_at');
  if (error) throw error;
  return toCSV(data||[]);
}

export async function exportEnrollmentsCSV(){
  const { data, error } = await supabase.from('enrollments').select('id,user_id,course_id,status,progress,created_at');
  if (error) throw error;
  return toCSV(data||[]);
}

export async function downloadCSV(filename: string, csv: string){
  const blob = new Blob([csv], { type:'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

