import React, { useMemo, useState } from 'react';
import { useUsers } from '@/hooks/admin/useUsers';
import { usePaginatedUsers } from '@/hooks/admin/usePaginatedUsers';
import { useUserCreation } from '@/hooks/admin/useUserCreation';
import { Select, SelectTrigger, SelectValue, SelectItem, SelectContent } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { LoadingSkeleton } from '@/components/common/LoadingSkeleton';
import { useToast } from '@/hooks/use-toast';
import { updateUserProfile, bulkAddMembers, fetchTeamsForDropdown, bulkUpdateUserRoles } from '@/lib/admin/queries';

export function AdminUsers(){
  const { toast } = useToast();
  const { isLoading, isError, roleMutation, activeMutation, inviteMutation } = useUsers();
  const paged = usePaginatedUsers(20);
  const { teams, createMutation, inviteMutation: inviteAdv } = useUserCreation();
  const [inviteForm, setInviteForm] = useState({ email:'', first_name:'', last_name:'', mobile_number:'', role:'learner', team_id:'' });
  const [createForm, setCreateForm] = useState({ email:'', first_name:'', last_name:'', mobile_number:'', role:'learner', team_id:'' });
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const allSelectedIds = useMemo(()=> Object.keys(selected).filter(k=> selected[k]), [selected]);
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Users</h1>
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
                <input className="border rounded h-9 px-2 bg-background" placeholder="First name" defaultValue={u.first_name||''} onBlur={async (e)=> { await updateUserProfile(u.user_id, { first_name: e.target.value }); }} />
                <input className="border rounded h-9 px-2 bg-background" placeholder="Last name" defaultValue={u.last_name||''} onBlur={async (e)=> { await updateUserProfile(u.user_id, { last_name: e.target.value }); }} />
                <input className="border rounded h-9 px-2 bg-background col-span-2" placeholder="Mobile number" defaultValue={u.mobile_number||''} onBlur={async (e)=> { await updateUserProfile(u.user_id, { mobile_number: e.target.value }); }} />
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

