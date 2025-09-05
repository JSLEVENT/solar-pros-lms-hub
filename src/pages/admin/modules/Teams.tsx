import { useTeams } from '@/hooks/admin/useTeams';
import { Badge } from '@/components/ui/badge';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export function AdminTeams(){
  const { teams, analytics, archiveMutation, assignMutation, removeMutation, createMutation, addMemberMutation, removeMemberMutation } = useTeams();
  const [managers, setManagers] = useState<{ user_id:string; full_name:string|null }[]>([]);
  const [membersCache, setMembersCache] = useState<Record<string,string>>({});
  const [newTeam, setNewTeam] = useState({ name:'', description:'' });
  const [showCreate, setShowCreate] = useState(false);
  useEffect(()=>{(async ()=>{ const { data } = await supabase.from('profiles').select('user_id,full_name').eq('role','manager'); setManagers(data||[]); })();},[]);
  async function loadMembers(teamId:string){
    const { data } = await supabase.from('team_memberships').select('user_id, profiles: user_id(full_name)').eq('team_id', teamId);
    const names = (data||[]).reduce((acc:any,row:any)=> { acc[row.user_id]= row.profiles?.full_name || row.user_id; return acc; }, {});
    setMembersCache(c=> ({...c, ...names }));
  }
  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold">Teams</h1>
      <div className="space-y-2">
        <button onClick={()=> setShowCreate(s=>!s)} className="px-3 py-2 text-sm rounded bg-primary text-primary-foreground">{showCreate? 'Close':'New Team'}</button>
        {showCreate && (
          <div className="border rounded-xl p-4 space-y-3">
            <input className="border rounded px-2 h-9 w-full bg-background" placeholder="Team name" value={newTeam.name} onChange={e=> setNewTeam(t=>({...t,name:e.target.value}))} />
            <textarea className="border rounded px-2 py-2 w-full bg-background" placeholder="Description" value={newTeam.description} onChange={e=> setNewTeam(t=>({...t,description:e.target.value}))} />
            <button disabled={!newTeam.name || createMutation.isPending} onClick={()=> createMutation.mutate(newTeam, { onSuccess: ()=> { setNewTeam({name:'', description:''}); setShowCreate(false);} })} className="px-3 py-2 text-sm rounded bg-green-600 text-white disabled:opacity-50">{createMutation.isPending? 'Saving...':'Create Team'}</button>
          </div>
        )}
      </div>
      <div className="space-y-4">
        {(teams.data||[]).map(t => (
          <div key={t.id} className="border rounded-xl p-4 space-y-3">
            <div className="flex justify-between items-start">
              <div>
                <p className="font-medium">{t.name}</p>
                <p className="text-xs text-muted-foreground">{t.description||'No description'}</p>
                <div className="flex gap-2 mt-2 items-center">
                  <Badge className="text-[10px]">{t.team_memberships?.[0]?.count||0} members</Badge>
                  <Badge className="text-[10px]">{(t.manager_teams||[]).length} managers</Badge>
                  {'is_archived' in t && (
                    <button onClick={()=> archiveMutation.mutate({ id: t.id, next: !t.is_archived })} className={`text-[10px] px-2 py-0.5 rounded border ${t.is_archived? 'bg-gray-300 text-gray-700':'bg-amber-600 text-white border-amber-600'}`}>{t.is_archived? 'Archived':'Active'}</button>
                  )}
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-xs font-medium">Managers</p>
              <div className="flex flex-wrap gap-2">
                {(t.manager_teams||[]).map((mt:any)=> (
                  <div key={mt.manager_id}>
                    <Badge className="text-[10px] flex items-center gap-1">
                      {managers.find(m=>m.user_id===mt.manager_id)?.full_name || mt.manager_id}
                      <button onClick={()=> removeMutation.mutate({ team_id: t.id, manager_id: mt.manager_id })} className="text-[9px] ml-1 opacity-70 hover:opacity-100">✕</button>
                    </Badge>
                  </div>
                ))}
                <Select onValueChange={(val)=> assignMutation.mutate({ team_id: t.id, manager_id: val })}>
                  <SelectTrigger className="h-7 w-40"><SelectValue placeholder="Assign manager" /></SelectTrigger>
                  <SelectContent>
                    {managers.map(m=> <SelectItem key={m.user_id} value={m.user_id}>{m.full_name||m.user_id}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="pt-3 space-y-1 border-t">
                <p className="text-xs font-medium">Members</p>
                <button onClick={()=> loadMembers(t.id)} className="text-[10px] underline">Refresh members</button>
                <div className="flex flex-wrap gap-2 mt-1">
                  {Object.entries(membersCache).filter(([id])=> (t as any).team_memberships?.some((m:any)=> m.user_id===id) || true).map(([id,name])=> (
                    <div key={id} className="flex items-center gap-1 border px-2 py-0.5 rounded text-[10px]">
                      {name}
                      <button onClick={()=> removeMemberMutation.mutate({ team_id: t.id, user_id: id })} className="opacity-60 hover:opacity-100">✕</button>
                    </div>
                  ))}
                </div>
                <AddMemberSelect teamId={t.id} onAdd={(user_id)=> addMemberMutation.mutate({ team_id: t.id, user_id })} />
              </div>
            </div>
          </div>
        ))}
        {(teams.data||[]).length===0 && !teams.isLoading && <p className="text-sm text-muted-foreground">No teams.</p>}
        {teams.isLoading && <p className="text-sm text-muted-foreground">Loading teams…</p>}
      </div>
      <div className="space-y-3">
        <h2 className="text-lg font-medium">Analytics (Top)</h2>
        <div className="grid md:grid-cols-2 gap-3">
          {(analytics.data||[]).slice(0,6).map((a:any)=> (
            <div key={a.team_id} className="p-3 border rounded-lg flex justify-between text-xs">
              <div>
                <p className="font-medium text-sm">{a.team_name}</p>
                <p className="text-muted-foreground">{a.member_count||0} members</p>
              </div>
              <div className="text-right">
                <p>{(a.avg_progress||0).toFixed(0)}% avg</p>
                <p className="text-muted-foreground">{a.completed_courses||0} completed</p>
              </div>
            </div>
          ))}
          {(analytics.data||[]).length===0 && !analytics.isLoading && <p className="text-sm text-muted-foreground">No analytics yet.</p>}
        </div>
      </div>
    </div>
  );
}

function AddMemberSelect({ teamId, onAdd }: { teamId: string; onAdd: (id:string)=> void }){
  const [users,setUsers] = useState<{user_id:string; full_name:string|null}[]>([]);
  useEffect(()=>{(async()=>{ const { data } = await supabase.from('profiles').select('user_id,full_name').in('role',['learner','manager']); setUsers(data||[]); })();},[teamId]);
  return (
    <Select onValueChange={v=> onAdd(v)}>
      <SelectTrigger className="h-7 w-48 mt-2"><SelectValue placeholder="Add member" /></SelectTrigger>
      <SelectContent>
        {users.map(u=> <SelectItem key={u.user_id} value={u.user_id}>{u.full_name||u.user_id}</SelectItem>)}
      </SelectContent>
    </Select>
  );
}

