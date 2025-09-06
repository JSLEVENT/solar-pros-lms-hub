import { supabase } from '@/integrations/supabase/client';

export async function fetchAdminStats() {
  const [usersRes, coursesRes, enrollmentsRes, certificatesRes, teamsRes, managersRes] = await Promise.all([
    supabase.from('profiles').select('user_id,last_active_at'),
    supabase.from('courses').select('id'),
    supabase.from('enrollments').select('id,status'),
    supabase.from('certificates').select('id'),
    supabase.from('teams').select('id'),
    supabase.from('profiles').select('id').eq('role','manager')
  ]);

  const error = usersRes.error || coursesRes.error || enrollmentsRes.error || certificatesRes.error || teamsRes.error || managersRes.error;
  if (error) throw error;

  const totalEnrollments = enrollmentsRes.data?.length || 0;
  const completed = (enrollmentsRes.data||[]).filter(e=>e.status==='completed').length;
  const completionRate = totalEnrollments ? (completed/totalEnrollments)*100 : 0;
  const activeUsers = (usersRes.data||[]).filter((u: any) => u.last_active_at && new Date(u.last_active_at) > new Date(Date.now()-7*24*60*60*1000)).length;

  return {
  totalUsers: usersRes.data?.length||0,
    totalCourses: coursesRes.data?.length||0,
    totalEnrollments,
    totalCertificates: certificatesRes.data?.length||0,
    completionRate,
    activeUsers,
    totalTeams: teamsRes.data?.length||0,
    totalManagers: managersRes.data?.length||0
  };
}

export async function fetchUsers() {
  // Explicit columns to avoid selecting non-existent 'id' and reduce payload
  const { data, error } = await supabase.from('profiles').select('user_id, full_name, role, last_active_at, is_active, created_at').order('created_at',{ascending:false});
  if (error) throw error; return data || [];
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
  const { data, error } = await supabase.from('teams').select(cols).order('created_at',{ascending:false});
  if (error) throw error; return data||[];
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
  const { data, error } = await supabase.from('courses').select('*').order('created_at',{ascending:false});
  if (error) throw error; return data||[];
}

export async function fetchTeamAnalytics(){
  const { data, error } = await supabase.from('team_analytics').select('*').order('member_count',{ascending:false});
  if (error) throw error; return data||[];
}

// Analytics detail queries
export async function fetchActiveUsersTimeSeries(days = 30){
  // Assuming profiles.last_active_at exists; bucket per day
  const since = new Date(Date.now() - days*24*60*60*1000).toISOString();
  const { data, error } = await supabase
    .from('profiles')
    .select('last_active_at')
    .gte('last_active_at', since);
  if (error) throw error;
  const buckets: Record<string, number> = {};
  (data||[]).forEach((r: any)=>{
    if(!r.last_active_at) return;
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

