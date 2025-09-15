import { useState } from 'react';
import { usePaginatedUsers } from '@/hooks/admin/usePaginatedUsers';
import { useUsers } from '@/hooks/admin/useUsers';
import { useUserCreation } from '@/hooks/admin/useUserCreation';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ModernCard, ModernCardContent } from '@/components/ui/modern-card';
import { Download, Plus, UserPlus } from 'lucide-react';
import { exportUsersCSV, downloadCSV } from '@/lib/admin/queries';
import { useToast } from '@/hooks/use-toast';

export function UserManagement(){
  const { toast } = useToast();
  const { data: pageData, isLoading, page, setPage, pageSize } = usePaginatedUsers(25);
  const { roleMutation, activeMutation, inviteMutation } = useUsers();
  const { teams, createMutation, inviteMutation: inviteAdv } = useUserCreation();
  const [inviteOpen, setInviteOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [inviteForm, setInviteForm] = useState({ email:'', first_name:'', last_name:'', mobile_number:'', role:'learner', team_id:'' });
  const [createForm, setCreateForm] = useState({ email:'', first_name:'', last_name:'', mobile_number:'', role:'learner', team_id:'' });

  const sendInvite = () => {
    const full_name = [inviteForm.first_name, inviteForm.last_name].filter(Boolean).join(' ').trim();
    inviteAdv.mutate({ email: inviteForm.email, first_name: inviteForm.first_name||undefined, last_name: inviteForm.last_name||undefined, mobile_number: inviteForm.mobile_number||undefined, role: inviteForm.role as any, team_id: inviteForm.team_id||undefined, full_name }, {
      onSuccess: ()=> { setInviteForm({ email:'', first_name:'', last_name:'', mobile_number:'', role:'learner', team_id:'' }); setInviteOpen(false); toast({ title:'Invitation sent'}); },
      onError: (e:any)=> toast({ title:'Invite failed', description: e.message, variant:'destructive' })
    });
  };

  const createUser = () => {
    createMutation.mutate({ email: createForm.email, first_name: createForm.first_name||undefined, last_name: createForm.last_name||undefined, mobile_number: createForm.mobile_number||undefined, role: createForm.role as any, team_id: createForm.team_id||undefined }, {
      onSuccess: ()=> { setCreateForm({ email:'', first_name:'', last_name:'', mobile_number:'', role:'learner', team_id:'' }); setCreateOpen(false); toast({ title:'User created'}); },
      onError: (e:any)=> toast({ title:'Create failed', description: e.message, variant:'destructive' })
    });
  };

  const exportCSV = async () => {
    try { const csv = await exportUsersCSV(); downloadCSV('users.csv', csv); toast({ title:'Export generated'}); } catch(e:any){ toast({ title:'Export failed', description:e.message, variant:'destructive'}); }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold">User Management</h2>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportCSV}><Download className="h-4 w-4 mr-2"/>Export CSV</Button>
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button variant="secondary"><UserPlus className="h-4 w-4 mr-2"/>Create User</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Create User</DialogTitle></DialogHeader>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Input placeholder="Email" value={createForm.email} onChange={e=> setCreateForm(f=>({...f,email:e.target.value}))}/>
                <Select value={createForm.role} onValueChange={v=> setCreateForm(f=>({...f, role:v}))}>
                  <SelectTrigger><SelectValue placeholder="Role"/></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="learner">Learner</SelectItem>
                    <SelectItem value="manager">Manager</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="owner">Owner</SelectItem>
                  </SelectContent>
                </Select>
                <Input placeholder="First name" value={createForm.first_name} onChange={e=> setCreateForm(f=>({...f,first_name:e.target.value}))}/>
                <Input placeholder="Last name" value={createForm.last_name} onChange={e=> setCreateForm(f=>({...f,last_name:e.target.value}))}/>
                <Input placeholder="Mobile number" value={createForm.mobile_number} onChange={e=> setCreateForm(f=>({...f,mobile_number:e.target.value}))}/>
                <Select value={createForm.team_id} onValueChange={v=> setCreateForm(f=>({...f, team_id: v}))}>
                  <SelectTrigger><SelectValue placeholder="Assign to team (optional)"/></SelectTrigger>
                  <SelectContent>
                    {(teams.data||[]).map((t:any)=> <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <Button disabled={!createForm.email || createMutation.isPending} onClick={createUser}>{createMutation.isPending? 'Creating...' : 'Create'}</Button>
            </DialogContent>
          </Dialog>
          <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="h-4 w-4 mr-2"/>Invite User</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Invite User</DialogTitle></DialogHeader>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Input placeholder="Email" value={inviteForm.email} onChange={e=> setInviteForm(f=>({...f,email:e.target.value}))}/>
                <Select value={inviteForm.role} onValueChange={v=> setInviteForm(f=>({...f, role:v}))}>
                  <SelectTrigger><SelectValue placeholder="Role"/></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="learner">Learner</SelectItem>
                    <SelectItem value="manager">Manager</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="owner">Owner</SelectItem>
                  </SelectContent>
                </Select>
                <Input placeholder="First name" value={inviteForm.first_name} onChange={e=> setInviteForm(f=>({...f,first_name:e.target.value}))}/>
                <Input placeholder="Last name" value={inviteForm.last_name} onChange={e=> setInviteForm(f=>({...f,last_name:e.target.value}))}/>
                <Input placeholder="Mobile number" value={inviteForm.mobile_number} onChange={e=> setInviteForm(f=>({...f,mobile_number:e.target.value}))}/>
                <Select value={inviteForm.team_id} onValueChange={v=> setInviteForm(f=>({...f, team_id: v}))}>
                  <SelectTrigger><SelectValue placeholder="Assign to team (optional)"/></SelectTrigger>
                  <SelectContent>
                    {(teams.data||[]).map((t:any)=> <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <Button disabled={!inviteForm.email || inviteAdv.isPending} onClick={sendInvite}>{inviteAdv.isPending? 'Sending...' : 'Send Invite'}</Button>
            </DialogContent>
          </Dialog>
        </div>
      </div>
      <ModernCard variant="glass">
        <ModernCardContent className="p-6 space-y-4">
          {isLoading && <p className="text-muted-foreground">Loading users...</p>}
          {pageData?.data?.map((u:any)=> (
            <div key={u.user_id} className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <p className="font-medium">{u.full_name || u.user_id}</p>
                <p className="text-xs text-muted-foreground">ID: {u.user_id}</p>
                <div className="flex gap-2 mt-1 items-center">
                  <Badge variant="outline">{u.role}</Badge>
                  <button
                    onClick={()=> activeMutation.mutate({ user_id: u.user_id, next: !u.is_active })}
                    className={`text-xs px-2 py-0.5 rounded border ${u.is_active? 'bg-green-600 text-white border-green-600':'bg-gray-300 text-gray-700 border-gray-400'}`}
                  >{u.is_active? 'Active':'Inactive'}</button>
                </div>
              </div>
              <div className="w-40">
                <Select value={u.role} onValueChange={(val:any)=> roleMutation.mutate({ user_id: u.user_id, role: val })}>
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
          <div className="flex justify-between items-center pt-2">
            <Button variant="outline" size="sm" disabled={page===0} onClick={()=> setPage(p=> Math.max(0,p-1))}>Prev</Button>
            <p className="text-xs text-muted-foreground">Page {page+1}</p>
            <Button variant="outline" size="sm" disabled={(pageData?.data?.length||0) < pageSize} onClick={()=> setPage(p=> p+1)}>Next</Button>
          </div>
        </ModernCardContent>
      </ModernCard>
    </div>
  );
}
