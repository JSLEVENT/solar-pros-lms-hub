import { useState } from 'react';
import { usePaginatedUsers } from '@/hooks/admin/usePaginatedUsers';
import { useUsers } from '@/hooks/admin/useUsers';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ModernCard, ModernCardContent } from '@/components/ui/modern-card';
import { Download, Plus } from 'lucide-react';
import { exportUsersCSV, downloadCSV } from '@/lib/admin/queries';
import { useToast } from '@/hooks/use-toast';

export function UserManagement(){
  const { toast } = useToast();
  const { data: pageData, isLoading, page, setPage, pageSize } = usePaginatedUsers(25);
  const { roleMutation, activeMutation, inviteMutation } = useUsers();
  const [inviteOpen, setInviteOpen] = useState(false);
  const [form, setForm] = useState({ email:'', full_name:'', role:'learner' });

  const sendInvite = () => {
    inviteMutation.mutate({ email: form.email, full_name: form.full_name, role: form.role as any }, {
      onSuccess: ()=> { setForm({ email:'', full_name:'', role:'learner' }); setInviteOpen(false); toast({ title:'Invitation sent'}); },
      onError: (e:any)=> toast({ title:'Invite failed', description: e.message, variant:'destructive' })
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
          <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="h-4 w-4 mr-2"/>Invite User</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Invite User</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <Input placeholder="Email" value={form.email} onChange={e=> setForm(f=>({...f,email:e.target.value}))}/>
                <Input placeholder="Full Name" value={form.full_name} onChange={e=> setForm(f=>({...f,full_name:e.target.value}))}/>
                <Select value={form.role} onValueChange={v=> setForm(f=>({...f, role:v}))}>
                  <SelectTrigger><SelectValue placeholder="Role"/></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="learner">Learner</SelectItem>
                    <SelectItem value="manager">Manager</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="owner">Owner</SelectItem>
                  </SelectContent>
                </Select>
                <Button disabled={inviteMutation.isPending} onClick={sendInvite}>{inviteMutation.isPending? 'Sending...' : 'Send Invite'}</Button>
              </div>
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
