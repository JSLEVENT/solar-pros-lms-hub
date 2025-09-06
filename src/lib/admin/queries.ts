import { supabase } from '@/integrations/supabase/client';

// Generic safe selector to gracefully handle missing tables/columns (42P01/42703)
async function safeSelect(table: string, columns: string){
  try {
    const { data, error } = await supabase.from(table as any).select(columns as any);
    if (error) {
      if ((error as any).code === '42P01') return []; // missing relation
      if ((error as any).code === '42703') {
        // Column missing: fallback to select('*') minimal set
        const retry = await supabase.from(table as any).select('*').limit(50);
        if (retry.error) return [];
        return retry.data || [];
      }
      // For 400 generic errors, attempt broad fallback once
      if ((error as any).status === 400) {
        const retry = await supabase.from(table as any).select('*').limit(50);
        if (retry.error) return [];
        return retry.data || [];
      }
      return [];
    }
    return data || [];
  } catch { return []; }
}

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

export async function fetchUsers() {
  const data = await safeSelect('profiles','user_id, full_name, role, last_active_at, is_active, created_at');
  return (data||[]).sort((a:any,b:any)=> (b.created_at||'').localeCompare(a.created_at||''));
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

export async function fetchTeams(includeArchived = true){
  const cols = includeArchived ? 'id,name,description,is_archived,team_memberships(count),manager_teams(manager_id)' : 'id,name,description,team_memberships(count),manager_teams(manager_id)';
  const data = await safeSelect('teams', cols);
  return (data||[]).sort((a:any,b:any)=> (b.created_at||'').localeCompare(a.created_at||''));
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

export async function fetchCourses(){
  const data = await safeSelect('courses','*');
  return (data||[]).sort((a:any,b:any)=> (b.created_at||'').localeCompare(a.created_at||''));
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
  const { data, error } = await supabase.from('teams').insert({ name, description }).select('id');
  if (error) throw error; return data?.[0];
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

