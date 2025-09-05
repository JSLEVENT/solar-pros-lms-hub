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

export async function updateUserRole(user_id: string, role: string) {
  const { error } = await supabase.from('profiles').update({ role }).eq('user_id', user_id); if (error) throw error;
}

export async function toggleUserActive(user_id: string, next: boolean){
  const { error } = await supabase.from('profiles').update({ is_active: next }).eq('user_id', user_id); if (error) throw error;
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
  const { error } = await supabase.from('teams').update({ is_archived: next }).eq('id', id); if (error) throw error;
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

