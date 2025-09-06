import { useTeamManagement } from '@/hooks/admin/useTeamManagement';
import { useState, useMemo, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';

export function AdminTeamsAdvanced(){
  const {
    pagination, setSearch, setPage, setIncludeArchived,
    teamsPage, teamDetail, selectedId, setSelectedId,
    createMutation, updateMutation, deleteMutation, archiveMutation,
    assignManagerMutation, removeManagerMutation,
    addMemberMutation, removeMemberMutation, bulkAddMutation, exportMembersMutation
  } = useTeamManagement();
  const [newTeam, setNewTeam] = useState({ name:'', description:'' });
  const [editTeam, setEditTeam] = useState<{ name:string; description:string }|null>(null);
  const [bulkText, setBulkText] = useState('');
  const totalPages = useMemo(()=> Math.ceil((teamsPage.data?.count||0)/pagination.pageSize),[teamsPage.data,pagination.pageSize]);

  const current = teamDetail.data?.team;
  const managers = teamDetail.data?.managers||[];
  const members = teamDetail.data?.members||[];

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap gap-4 items-end">
        <div>
          <p className="text-xl font-semibold">Teams</p>
          <p className="text-xs text-muted-foreground">Manage structure, assignments & analytics</p>
        </div>
        <Input placeholder="Search teams" className="w-52" value={pagination.search} onChange={e=> setSearch(e.target.value)} />
        <label className="flex items-center gap-2 text-xs">
          <input type="checkbox" checked={pagination.includeArchived} onChange={e=> setIncludeArchived(e.target.checked)} /> Include archived
        </label>
        <div className="ml-auto flex gap-2">
          <Input placeholder="Team name" value={newTeam.name} onChange={e=> setNewTeam(t=>({...t,name:e.target.value}))} className="w-40" />
          <Input placeholder="Description" value={newTeam.description} onChange={e=> setNewTeam(t=>({...t,description:e.target.value}))} className="w-56" />
          <Button disabled={!newTeam.name || createMutation.isPending} onClick={()=> createMutation.mutate(newTeam,{ onSuccess:()=> setNewTeam({name:'',description:''}) })}>Create</Button>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          {(teamsPage.data?.data||[]).map(t=> (
            <div key={t.id} className={`border rounded-xl p-4 cursor-pointer ${selectedId===t.id? 'ring-2 ring-primary':''}`} onClick={()=> setSelectedId(t.id)}>
              <div className="flex justify-between">
                <div>
                  <p className="font-medium flex items-center gap-2">{t.name}{t.is_archived && <Badge variant="secondary" className="text-[10px]">ARCHIVED</Badge>}</p>
                  <p className="text-xs text-muted-foreground line-clamp-2">{t.description||'No description'}</p>
                  <div className="flex gap-2 mt-2">
                    <Badge className="text-[10px]">{t.team_memberships?.[0]?.count||0} members</Badge>
                    <Badge className="text-[10px]">{(t.manager_teams||[]).length} managers</Badge>
                  </div>
                </div>
                <div className="flex flex-col gap-2 items-end text-xs">
                  <Button size="sm" variant="outline" onClick={(e)=> { e.stopPropagation(); archiveMutation.mutate({ id: t.id, next: !t.is_archived }); }}>{t.is_archived? 'Unarchive':'Archive'}</Button>
                </div>
              </div>
            </div>
          ))}
          {teamsPage.isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}
          {(teamsPage.data?.data||[]).length===0 && !teamsPage.isLoading && <p className="text-sm text-muted-foreground">No teams.</p>}
          {totalPages>1 && (
            <div className="flex gap-2 items-center pt-2">
              <Button size="sm" variant="outline" disabled={pagination.page===0} onClick={()=> setPage(pagination.page-1)}>Prev</Button>
              <p className="text-xs">Page {pagination.page+1} / {totalPages}</p>
              <Button size="sm" variant="outline" disabled={pagination.page+1>=totalPages} onClick={()=> setPage(pagination.page+1)}>Next</Button>
            </div>
          )}
        </div>
        <div className="space-y-4">
          {!current && <p className="text-sm text-muted-foreground">Select a team to manage details.</p>}
          {current && (
            <div className="space-y-5">
              <div className="flex justify-between items-start">
                <div>
                  {editTeam? (
                    <div className="space-y-2">
                      <Input value={editTeam.name} onChange={e=> setEditTeam(s=> s? { ...s, name:e.target.value }:s)} />
                      <Textarea value={editTeam.description} onChange={e=> setEditTeam(s=> s? { ...s, description:e.target.value }:s)} />
                      <div className="flex gap-2">
                        <Button size="sm" onClick={()=> { updateMutation.mutate({ id: current.id, name: editTeam!.name, description: editTeam!.description }); setEditTeam(null); }}>Save</Button>
                        <Button size="sm" variant="outline" onClick={()=> setEditTeam(null)}>Cancel</Button>
                      </div>
                    </div>
                  ):(
                    <div>
                      <p className="font-semibold text-lg">{current.name}</p>
                      <p className="text-xs text-muted-foreground whitespace-pre-wrap">{current.description||'No description'}</p>
                    </div>
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  {!editTeam && <Button size="sm" variant="outline" onClick={()=> setEditTeam({ name: current.name, description: current.description })}>Edit</Button>}
                  <Button size="sm" variant="outline" onClick={()=> archiveMutation.mutate({ id: current.id, next: !current.is_archived })}>{current.is_archived? 'Unarchive':'Archive'}</Button>
                  <Button size="sm" variant="destructive" onClick={()=> deleteMutation.mutate(current.id)}>Delete</Button>
                </div>
              </div>
              {teamDetail.isLoading && <p className="text-xs">Loading detail…</p>}
              {teamDetail.data?.analytics && (
                <div className="border rounded-lg p-3 text-xs flex gap-4">
                  <div>
                    <p className="font-medium">Analytics</p>
                    <p className="text-muted-foreground">Avg Progress: {(teamDetail.data.analytics.avg_progress||0).toFixed(0)}%</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Completed: {teamDetail.data.analytics.completed_courses||0}</p>
                    <p className="text-muted-foreground">Members: {members.length}</p>
                  </div>
                </div>
              )}
              <div className="space-y-2">
                <p className="text-xs font-semibold">Managers</p>
                <div className="flex flex-wrap gap-2">
                  {managers.map(m=> (
                    <Badge key={m.user_id} className="text-[10px] flex items-center gap-1">
                      {(m.first_name||m.full_name||'').split(' ')[0]||m.user_id}
                      <button onClick={()=> removeManagerMutation.mutate({ team_id: current.id, manager_id: m.user_id })} className="text-[9px] opacity-60 hover:opacity-100">✕</button>
                    </Badge>
                  ))}
                </div>
                <AssignManagerSelect teamId={current.id} onAssign={(manager_id)=> assignManagerMutation.mutate({ team_id: current.id, manager_id })} />
              </div>
              <div className="space-y-2">
                <p className="text-xs font-semibold flex items-center gap-2">Members <Badge variant="secondary" className="text-[10px]">{members.length}</Badge></p>
                <div className="max-h-40 overflow-auto border rounded-md p-2 space-y-1 bg-muted/30">
                  {members.map(m=> (
                    <div key={m.user_id} className="flex justify-between text-[11px] items-center bg-background rounded px-2 py-1">
                      <span>{m.first_name || m.full_name || m.user_id}</span>
                      <button onClick={()=> removeMemberMutation.mutate({ team_id: current.id, user_id: m.user_id })} className="text-[10px] opacity-60 hover:opacity-100">Remove</button>
                    </div>
                  ))}
                  {members.length===0 && <p className="text-[10px] text-muted-foreground">No members yet.</p>}
                </div>
                <AddMemberSelect teamId={current.id} onAdd={(user_id)=> addMemberMutation.mutate({ team_id: current.id, user_id })} />
                <div className="space-y-1 pt-2">
                  <p className="text-[10px] font-medium">Bulk Add (paste user_ids newline separated)</p>
                  <Textarea rows={4} value={bulkText} onChange={e=> setBulkText(e.target.value)} className="text-[11px]" />
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" disabled={!bulkText.trim()} onClick={()=> { const ids = Array.from(new Set(bulkText.split(/\s+/).filter(Boolean))); bulkAddMutation.mutate({ team_id: current.id, user_ids: ids }); setBulkText(''); }}>Add Bulk</Button>
                    <Button size="sm" variant="outline" onClick={()=> exportMembersMutation.mutate(current.id, { onSuccess: (csv)=> { const blob = new Blob([csv],{type:'text/csv'}); const url = URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download=`team_${current.id}_members.csv`; a.click(); URL.revokeObjectURL(url); } })}>Export CSV</Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function AssignManagerSelect({ teamId, onAssign }:{ teamId:string; onAssign:(id:string)=>void }){
  const [options,setOptions] = useState<any[]>([]);
  const [search,setSearch] = useState('');
  useEffect(()=>{ let active=true; (async()=>{
    const query = supabase.from('profiles').select('user_id,first_name,last_name,full_name,role').eq('role','manager').order('first_name', { ascending:true }).limit(50);
    const { data } = await query;
    if(active) setOptions(data||[]);
  })(); return ()=>{ active=false; }; },[]);
  const filtered = useMemo(()=> search? options.filter(o=> (o.first_name||o.full_name||'').toLowerCase().includes(search.toLowerCase())): options,[options,search]);
  return (
    <div className="flex gap-2 items-center">
      <Select onValueChange={onAssign}>
        <SelectTrigger className="h-7 w-48"><SelectValue placeholder="Assign manager" /></SelectTrigger>
        <SelectContent>
          {filtered.map(m=> <SelectItem key={m.user_id} value={m.user_id}>{m.first_name||m.full_name||m.user_id}</SelectItem>)}
        </SelectContent>
      </Select>
      <Input placeholder="Search" value={search} onChange={e=> setSearch(e.target.value)} className="h-7 w-28 text-[11px]" />
    </div>
  );
}

function AddMemberSelect({ teamId, onAdd }:{ teamId:string; onAdd:(id:string)=>void }){
  const [options,setOptions] = useState<any[]>([]);
  const [search,setSearch] = useState('');
  useEffect(()=>{ let active=true; (async()=>{
    const query = supabase.from('profiles').select('user_id,first_name,last_name,full_name,role').eq('role','learner').order('first_name',{ascending:true}).limit(100);
    const { data } = await query;
    if(active) setOptions(data||[]);
  })(); return ()=>{ active=false; }; },[]);
  const filtered = useMemo(()=> search? options.filter(o=> (o.first_name||o.full_name||'').toLowerCase().includes(search.toLowerCase())): options,[options,search]);
  return (
    <div className="flex gap-2 items-center">
      <Select onValueChange={onAdd}>
        <SelectTrigger className="h-7 w-48"><SelectValue placeholder="Add member" /></SelectTrigger>
        <SelectContent>
          {filtered.map(u=> <SelectItem key={u.user_id} value={u.user_id}>{u.first_name||u.full_name||u.user_id}</SelectItem>)}
        </SelectContent>
      </Select>
      <Input placeholder="Search" value={search} onChange={e=> setSearch(e.target.value)} className="h-7 w-28 text-[11px]" />
    </div>
  );
}
