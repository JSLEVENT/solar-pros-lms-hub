import React, { useState } from 'react';
import { useUsers } from '@/hooks/admin/useUsers';
import { usePaginatedUsers } from '@/hooks/admin/usePaginatedUsers';
import { Select, SelectTrigger, SelectValue, SelectItem, SelectContent } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { LoadingSkeleton } from '@/components/common/LoadingSkeleton';

export function AdminUsers(){
  const { data, isLoading, isError, roleMutation, activeMutation, inviteMutation } = useUsers();
  const paged = usePaginatedUsers(20);
  const [inviteForm, setInviteForm] = useState({ email:'', full_name:'', role:'learner' });
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Users</h1>
      <div className="border rounded-xl p-4 space-y-3">
        <p className="font-medium text-sm">Invite User</p>
        <div className="grid md:grid-cols-4 gap-2">
          <input className="border rounded h-9 px-2 bg-background" placeholder="Email" value={inviteForm.email} onChange={e=> setInviteForm(f=>({...f,email:e.target.value}))} />
          <input className="border rounded h-9 px-2 bg-background" placeholder="Full name" value={inviteForm.full_name} onChange={e=> setInviteForm(f=>({...f,full_name:e.target.value}))} />
          <select className="border rounded h-9 px-2 bg-background" value={inviteForm.role} onChange={e=> setInviteForm(f=>({...f,role:e.target.value}))}>
            <option value="learner">Learner</option>
            <option value="manager">Manager</option>
            <option value="admin">Admin</option>
            <option value="owner">Owner</option>
          </select>
          <button disabled={!inviteForm.email || inviteMutation.isPending} onClick={()=> inviteMutation.mutate(inviteForm, { onSuccess: ()=> setInviteForm({ email:'', full_name:'', role:'learner' }) })} className="px-3 py-2 text-sm rounded bg-primary text-primary-foreground disabled:opacity-50">{inviteMutation.isPending? 'Sending...':'Send Invite'}</button>
        </div>
      </div>
  {isLoading && <LoadingSkeleton lines={4} />}
      {isError && <p className="text-sm text-red-600">Failed to load users</p>}
      <div className="space-y-3">
        {(paged.data?.data||[]).map((u: any) => (
          <div key={u.user_id} className="p-4 border rounded-xl flex items-center justify-between">
            <div className="space-y-1">
              <p className="font-medium">{u.full_name || 'Unnamed'}</p>
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
            <div className="w-40">
              <Select defaultValue={u.role} onValueChange={(r)=> roleMutation.mutate({ user_id: u.user_id, role: r })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="learner">Learner</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="owner">Owner</SelectItem>
                </SelectContent>
              </Select>
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

