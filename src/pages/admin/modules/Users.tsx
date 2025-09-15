import React, { useMemo, useState } from 'react';
import { useUsers } from '@/hooks/admin/useUsers';
import { usePaginatedUsers } from '@/hooks/admin/usePaginatedUsers';
import { useUserCreation } from '@/hooks/admin/useUserCreation';
import { Select, SelectTrigger, SelectValue, SelectItem, SelectContent } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { LoadingSkeleton } from '@/components/common/LoadingSkeleton';
import { useToast } from '@/hooks/use-toast';
import { updateUserProfile, bulkAddMembers, bulkUpdateUserRoles, usersCSVTemplate, bulkImportUsers, downloadCSV } from '@/lib/admin/queries';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

export function AdminUsers(){
  const { toast } = useToast();
  const { isLoading, isError, roleMutation, activeMutation, inviteMutation } = useUsers();
  const paged = usePaginatedUsers(20);
  const { teams, createMutation, inviteMutation: inviteAdv } = useUserCreation();
  const [inviteForm, setInviteForm] = useState({ email:'', first_name:'', last_name:'', mobile_number:'', role:'learner', team_id:'' });
  const [createForm, setCreateForm] = useState({ email:'', first_name:'', last_name:'', mobile_number:'', role:'learner', team_id:'' });
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const allSelectedIds = useMemo(()=> Object.keys(selected).filter(k=> selected[k]), [selected]);
  const [csvOpen, setCsvOpen] = useState(false);
  const [csvText, setCsvText] = useState('');
  const [mode, setMode] = useState<'invite'|'create'>('invite');
  const [teamMatch, setTeamMatch] = useState<'name'|'id'>('name');
  const [drafts, setDrafts] = useState<Record<string, { first_name: string; last_name: string; mobile_number: string }>>({});
  const [saving, setSaving] = useState<Record<string, boolean>>({});

  const getDraft = (u: any) => drafts[u.user_id] ?? { first_name: u.first_name || '', last_name: u.last_name || '', mobile_number: u.mobile_number || '' };
  const hasDraftChanges = (u: any) => {
    const d = getDraft(u);
    return (d.first_name !== (u.first_name||'')) || (d.last_name !== (u.last_name||'')) || (d.mobile_number !== (u.mobile_number||''));
  };
  const saveUserDraft = async (u: any) => {
    try {
      setSaving(s=> ({...s, [u.user_id]: true }));
      const d = getDraft(u);
      await updateUserProfile(u.user_id, { first_name: d.first_name, last_name: d.last_name, mobile_number: d.mobile_number });
      toast({ title: 'Profile saved' });
      // Optimistically align displayed data by resetting draft to normalized inputs
      setDrafts(ds=> ({ ...ds, [u.user_id]: { ...d } }));
      // Trigger refresh to pull latest from server
      paged.refetch();
    } catch(e:any){
      toast({ title:'Save failed', description: e.message, variant:'destructive' });
    } finally {
      setSaving(s=> ({...s, [u.user_id]: false }));
    }
  };
  const saveAll = async () => {
    const current = (paged.data?.data||[]) as any[];
    const dirty = current.filter(u=> hasDraftChanges(u));
    if (!dirty.length) return;
    for (const u of dirty){
      await saveUserDraft(u);
    }
  };
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Users</h1>
        <Dialog open={csvOpen} onOpenChange={setCsvOpen}>
          <DialogTrigger asChild>
            <button className="px-3 py-2 text-sm rounded border">Upload CSV</button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Bulk Import Users</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div className="flex gap-2 items-center text-sm">
                <label className="text-sm">Mode</label>
                <select className="border rounded h-8 px-2" value={mode} onChange={e=> setMode(e.target.value as any)}>
                  <option value="invite">Invite (sends invite email)</option>
                  <option value="create">Create (no email)</option>
                </select>
                <label className="text-sm ml-4">Team match by</label>
                <select className="border rounded h-8 px-2" value={teamMatch} onChange={e=> setTeamMatch(e.target.value as any)}>
                  <option value="name">Team name (team_name)</option>
                  <option value="id">Team id (team_id)</option>
                </select>
                <button className="ml-auto text-xs px-2 py-1 border rounded" onClick={()=> downloadCSV('users-template.csv', usersCSVTemplate())}>Download template</button>
              </div>
              <textarea className="w-full h-48 border rounded p-2 font-mono text-xs bg-background" placeholder="Paste CSV here or upload a file" value={csvText} onChange={e=> setCsvText(e.target.value)} />
              <div className="flex justify-end gap-2">
                <button className="px-3 py-2 text-sm rounded border" onClick={()=> setCsvOpen(false)}>Cancel</button>
                <button className="px-3 py-2 text-sm rounded bg-primary text-primary-foreground" disabled={!csvText.trim()} onClick={async ()=>{
                  try {
                    const res = await bulkImportUsers({ csv: csvText, mode, teamMatch });
                    toast({ title: `Imported ${res.summary.succeeded}/${res.summary.total}`, description: res.summary.failed? `${res.summary.failed} failed` : undefined });
                    setCsvText(''); setCsvOpen(false); paged.refetch();
                  } catch (e:any) {
                    toast({ title:'Import failed', description: e.message, variant:'destructive' });
                  }
                }}>Import</button>
              </div>
              <p className="text-xs text-muted-foreground">CSV columns: email, first_name, last_name, mobile_number, role, team_name, team_id</p>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      <div className="border rounded-xl p-4 space-y-3">
        <p className="font-medium text-sm">Create User</p>
        <div className="grid md:grid-cols-6 gap-2">
          <input className="border rounded h-9 px-2 bg-background" placeholder="Email" value={createForm.email} onChange={e=> setCreateForm(f=>({...f,email:e.target.value}))} />
          <input className="border rounded h-9 px-2 bg-background" placeholder="First name" value={createForm.first_name} onChange={e=> setCreateForm(f=>({...f,first_name:e.target.value}))} />
          <input className="border rounded h-9 px-2 bg-background" placeholder="Last name" value={createForm.last_name} onChange={e=> setCreateForm(f=>({...f,last_name:e.target.value}))} />
          <input className="border rounded h-9 px-2 bg-background" placeholder="Mobile" value={createForm.mobile_number} onChange={e=> setCreateForm(f=>({...f,mobile_number:e.target.value}))} />
          <select className="border rounded h-9 px-2 bg-background" value={createForm.role} onChange={e=> setCreateForm(f=>({...f,role:e.target.value}))}>
            <option value="learner">Learner</option>
            <option value="manager">Manager</option>
            <option value="admin">Admin</option>
            <option value="owner">Owner</option>
          </select>
          <select className="border rounded h-9 px-2 bg-background" value={createForm.team_id} onChange={e=> setCreateForm(f=>({...f,team_id:e.target.value}))}>
            <option value="">Assign team (optional)</option>
            {(teams.data||[]).map((t:any)=> <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
          <button disabled={!createForm.email || createMutation.isPending} onClick={()=> {
            createMutation.mutate(createForm as any, { onSuccess: ()=> { setCreateForm({ email:'', first_name:'', last_name:'', mobile_number:'', role:'learner', team_id:'' }); toast({ title:'User created' }); } });
          }} className="px-3 py-2 text-sm rounded bg-primary text-primary-foreground disabled:opacity-50 col-span-1">{createMutation.isPending? 'Creating...':'Create'}</button>
        </div>
      </div>

      <div className="border rounded-xl p-4 space-y-3">
        <p className="font-medium text-sm">Invite User</p>
        <div className="grid md:grid-cols-6 gap-2">
          <input className="border rounded h-9 px-2 bg-background" placeholder="Email" value={inviteForm.email} onChange={e=> setInviteForm(f=>({...f,email:e.target.value}))} />
          <input className="border rounded h-9 px-2 bg-background" placeholder="First name" value={inviteForm.first_name} onChange={e=> setInviteForm(f=>({...f,first_name:e.target.value}))} />
          <input className="border rounded h-9 px-2 bg-background" placeholder="Last name" value={inviteForm.last_name} onChange={e=> setInviteForm(f=>({...f,last_name:e.target.value}))} />
          <input className="border rounded h-9 px-2 bg-background" placeholder="Mobile" value={inviteForm.mobile_number} onChange={e=> setInviteForm(f=>({...f,mobile_number:e.target.value}))} />
          <select className="border rounded h-9 px-2 bg-background" value={inviteForm.role} onChange={e=> setInviteForm(f=>({...f,role:e.target.value}))}>
            <option value="learner">Learner</option>
            <option value="manager">Manager</option>
            <option value="admin">Admin</option>
            <option value="owner">Owner</option>
          </select>
          <select className="border rounded h-9 px-2 bg-background" value={inviteForm.team_id} onChange={e=> setInviteForm(f=>({...f,team_id:e.target.value}))}>
            <option value="">Assign team (optional)</option>
            {(teams.data||[]).map((t:any)=> <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
          <button disabled={!inviteForm.email || inviteAdv.isPending} onClick={()=> {
            const payload = { ...inviteForm, full_name: `${inviteForm.first_name} ${inviteForm.last_name}`.trim() } as any;
            inviteAdv.mutate(payload, { onSuccess: ()=> { setInviteForm({ email:'', first_name:'', last_name:'', mobile_number:'', role:'learner', team_id:'' }); toast({ title:'Invitation sent' }); } });
          }} className="px-3 py-2 text-sm rounded bg-primary text-primary-foreground disabled:opacity-50 col-span-1">{inviteAdv.isPending? 'Sending...':'Send Invite'}</button>
        </div>
      </div>
  {isLoading && <LoadingSkeleton lines={4} />}
      {isError && <p className="text-sm text-red-600">Failed to load users</p>}
      <div className="space-y-3">
        {/* Bulk actions bar */}
        {allSelectedIds.length > 0 && (
          <div className="p-3 border rounded-xl flex items-center gap-3 text-sm">
            <span>{allSelectedIds.length} selected</span>
            <select className="border rounded h-8 px-2" onChange={async (e)=> {
              const r = e.target.value as any; if(!r) return; await bulkUpdateUserRoles(allSelectedIds, r); toast({ title:'Roles updated' }); paged.refetch(); e.currentTarget.value='';
            }}>
              <option value="">Set role…</option>
              <option value="learner">Learner</option>
              <option value="manager">Manager</option>
              <option value="admin">Admin</option>
              <option value="owner">Owner</option>
            </select>
            <select className="border rounded h-8 px-2" onChange={async (e)=> {
              const teamId = e.target.value; if(!teamId) return; await bulkAddMembers(teamId, allSelectedIds); toast({ title:'Added to team' }); e.currentTarget.value='';
            }}>
              <option value="">Add to team…</option>
              {(teams.data||[]).map((t:any)=> <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
            <button onClick={()=> setSelected({})} className="ml-auto text-xs px-2 py-1 border rounded">Clear</button>
          </div>
        )}

        {/* Save all bar if any draft changed */}
        {((paged.data?.data||[]) as any[]).some(u=> hasDraftChanges(u)) && (
          <div className="p-3 border rounded-xl flex items-center gap-3 text-sm bg-muted/40">
            <span>Unsaved changes</span>
            <button className="px-2 py-1 text-xs rounded bg-primary text-primary-foreground" onClick={saveAll}>Save all</button>
          </div>
        )}

        {(paged.data?.data||[]).map((u: any) => (
          <div key={u.user_id} className="p-4 border rounded-xl grid md:grid-cols-3 gap-3 items-start">
            <div className="flex items-start gap-3">
              <input type="checkbox" checked={!!selected[u.user_id]} onChange={(e)=> setSelected(s=> ({...s, [u.user_id]: e.target.checked}))} className="mt-1" />
              <div className="space-y-1">
                <p className="font-medium">{(u.first_name || (u.full_name? u.full_name.split(' ')[0]:'')) + (u.last_name? ' '+u.last_name : '') || 'Unnamed'}</p>
                <p className="text-xs text-muted-foreground break-all">{u.user_id}</p>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs capitalize">{u.role}</Badge>
                  {'is_active' in u && (
                    <button
                      onClick={()=> activeMutation.mutate({ user_id: u.user_id, next: !u.is_active })}
                      className={`text-[10px] px-2 py-0.5 rounded border ${u.is_active? 'bg-green-600 text-white border-green-600':'bg-gray-300 text-gray-700 border-gray-400'}`}
                    >{u.is_active? 'Active':'Inactive'}</button>
                  )}
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <input className="border rounded h-9 px-2 bg-background" placeholder="First name" value={getDraft(u).first_name} onChange={(e)=> setDrafts(d=> ({...d, [u.user_id]: { ...getDraft(u), first_name: e.target.value }}))} />
                <input className="border rounded h-9 px-2 bg-background" placeholder="Last name" value={getDraft(u).last_name} onChange={(e)=> setDrafts(d=> ({...d, [u.user_id]: { ...getDraft(u), last_name: e.target.value }}))} />
                <input className="border rounded h-9 px-2 bg-background col-span-2" placeholder="Mobile number" value={getDraft(u).mobile_number} onChange={(e)=> setDrafts(d=> ({...d, [u.user_id]: { ...getDraft(u), mobile_number: e.target.value }}))} />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-40">
                <Select defaultValue={u.role} onValueChange={(r)=> roleMutation.mutate({ user_id: u.user_id, role: r as any })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="learner">Learner</SelectItem>
                    <SelectItem value="manager">Manager</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="owner">Owner</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="w-56">
                <select className="border rounded h-9 px-2 bg-background" onChange={async (e)=> { const v = e.target.value; if(!v) return; await bulkAddMembers(v, [u.user_id]); toast({ title:'Added to team' }); e.currentTarget.value=''; }}>
                  <option value="">Add to team…</option>
                  {(teams.data||[]).map((t:any)=> <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
              <div className="ml-auto">
                <button disabled={!hasDraftChanges(u) || saving[u.user_id]} onClick={()=> saveUserDraft(u)} className="px-3 py-2 text-sm rounded bg-primary text-primary-foreground disabled:opacity-50">{saving[u.user_id]? 'Saving…' : 'Save'}</button>
              </div>
            </div>
          </div>
        ))}
        {paged.isLoading && <p className="text-sm text-muted-foreground">Loading page…</p>}
        {(!paged.data || paged.data.data.length===0) && !paged.isLoading && <p className="text-sm text-muted-foreground">No users.</p>}
        {paged.data && paged.data.count>paged.pageSize && (
          <div className="flex items-center justify-between pt-2 text-xs">
            <span>{paged.page*paged.pageSize+1}-{Math.min((paged.page+1)*paged.pageSize, paged.data.count)} of {paged.data.count}</span>
            <div className="flex gap-2">
              <button disabled={paged.page===0} onClick={()=> paged.setPage(p=> Math.max(0,p-1))} className="px-2 py-1 border rounded disabled:opacity-40">Prev</button>
              <button disabled={(paged.page+1)*paged.pageSize >= paged.data.count} onClick={()=> paged.setPage(p=> p+1)} className="px-2 py-1 border rounded disabled:opacity-40">Next</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

