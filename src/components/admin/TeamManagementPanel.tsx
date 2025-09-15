import { useTeams } from '@/hooks/admin/useTeams';
import { ModernCard, ModernCardContent } from '@/components/ui/modern-card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Layers, Trash2, Plus, Pencil } from 'lucide-react';
import { assignManager, removeManager, toggleTeamArchived, exportTeamMembers, downloadCSV } from '@/lib/admin/queries';
import { useToast } from '@/hooks/use-toast';
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { Link } from 'react-router-dom';

export function TeamManagementPanel(){
  const { teams, analytics, createMutation, updateMutation } = useTeams();
  const { toast } = useToast();
  const [managers, setManagers] = useState<{ user_id:string; full_name:string|null }[]>([]);
  const [createOpen, setCreateOpen] = useState(false);
  const [newTeam, setNewTeam] = useState({ name:'', description:'' });
  const [editOpen, setEditOpen] = useState<string|null>(null);
  const [editDraft, setEditDraft] = useState<Record<string,{name:string; description:string}>>({});

  useEffect(()=>{ (async ()=>{ const { data } = await supabase.from('profiles').select('user_id,full_name').eq('role','manager'); setManagers(data||[]); })(); },[]);

  const exportMembers = async (team_id:string) => {
    try { const csv = await exportTeamMembers(team_id); downloadCSV(`team-${team_id}-members.csv`, csv); toast({ title:'Export generated'}); } catch(e:any){ toast({ title:'Export failed', description:e.message, variant:'destructive'});} }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <h2 className="text-2xl font-semibold flex items-center gap-2"><Layers className="h-5 w-5"/>Team Management</h2>
        <div className="flex gap-2">
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-1" /> Create Team
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Team</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Name</label>
                  <Input
                    placeholder="Team name"
                    value={newTeam.name}
                    onChange={e=> setNewTeam(t=> ({...t, name:e.target.value}))}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Description</label>
                  <Textarea
                    placeholder="Optional description"
                    value={newTeam.description}
                    onChange={e=> setNewTeam(t=> ({...t, description:e.target.value}))}
                  />
                </div>
                <Button
                  className="w-full"
                  disabled={!newTeam.name.trim() || createMutation.isPending}
                  onClick={()=> {
                    if(!newTeam.name.trim()) return;
                    createMutation.mutate({ name:newTeam.name.trim(), description:newTeam.description.trim() }, {
                      onSuccess: ()=> { toast({ title:'Team created'}); setNewTeam({name:'',description:''}); setCreateOpen(false); },
                      onError: (e:any)=> toast({ title:'Failed to create team', description:e.message, variant:'destructive' })
                    });
                  }}
                >{createMutation.isPending? 'Creating...' : 'Create Team'}</Button>
              </div>
            </DialogContent>
          </Dialog>
          <Button asChild variant="outline" size="sm"><Link to="/admin/teams">Open Full Manager</Link></Button>
        </div>
      </div>
      <ModernCard variant="glass">
        <ModernCardContent className="p-6 space-y-4">
          {teams.data?.map((t:any)=> (
            <div key={t.id} className="p-4 border rounded-lg">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-medium">{t.name}</p>
                  <p className="text-sm text-muted-foreground">{t.description || 'No description'}</p>
                  <div className="flex gap-2 mt-2 items-center">
                    <Badge className="text-xs">{t.team_memberships?.[0]?.count || 0} members</Badge>
                    <Badge className="text-xs">{(t.manager_teams||[]).length} managers</Badge>
                    <button
                      onClick={async ()=> { await toggleTeamArchived(t.id, !t.is_archived); teams.refetch(); }}
                      className={`text-xs px-2 py-0.5 rounded border ${t.is_archived? 'bg-gray-300 text-gray-700':'bg-amber-600 text-white border-amber-600'}`}
                    >{t.is_archived? 'Archived':'Active'}</button>
                    <Button variant="outline" size="sm" className="h-6" onClick={()=> exportMembers(t.id)}>CSV</Button>
                    <Button variant="outline" size="sm" className="h-6" onClick={()=> { setEditDraft(d=> ({...d, [t.id]: { name: t.name, description: t.description||'' }})); setEditOpen(t.id); }}><Pencil className="h-3 w-3 mr-1"/>Edit</Button>
                  </div>
                </div>
              </div>
              <Dialog open={editOpen===t.id} onOpenChange={(o)=> { if(!o) setEditOpen(null); }}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Edit Team</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium">Name</label>
                      <Input value={editDraft[t.id]?.name||''} onChange={e=> setEditDraft(d=> ({...d, [t.id]: { ...(d[t.id]||{name:'',description:''}), name:e.target.value }}))} />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Description</label>
                      <Textarea value={editDraft[t.id]?.description||''} onChange={e=> setEditDraft(d=> ({...d, [t.id]: { ...(d[t.id]||{name:'',description:''}), description:e.target.value }}))} />
                    </div>
                    <div className="flex gap-2 justify-end">
                      <Button variant="outline" onClick={()=> setEditOpen(null)}>Cancel</Button>
                      <Button
                        onClick={()=> {
                          const draft = editDraft[t.id]||{ name:'', description:'' };
                          // Optimistic update handled in hook's updateMutation
                          updateMutation.mutate({ id: t.id, name: draft.name, description: draft.description }, {
                            onSuccess: ()=> { toast({ title:'Team updated' }); setEditOpen(null); },
                            onError: (e:any)=> toast({ title:'Update failed', description: e.message, variant:'destructive' })
                          });
                        }}
                        disabled={!editDraft[t.id]?.name?.trim() || updateMutation.isPending}
                      >{updateMutation.isPending? 'Saving...':'Save'}</Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
              <div className="mt-3 space-y-2">
                <p className="text-xs text-muted-foreground">Assign Manager</p>
                <Select onValueChange={val=> assignManager(t.id, val).then(()=> teams.refetch())}>
                  <SelectTrigger><SelectValue placeholder="Select manager" /></SelectTrigger>
                  <SelectContent>
                    {managers.map(m=> <SelectItem key={m.user_id} value={m.user_id}>{m.full_name || m.user_id}</SelectItem>)}
                  </SelectContent>
                </Select>
                <div className="flex flex-wrap gap-2 mt-2">
                  {(t.manager_teams||[]).map((m:any)=> (
                    <Badge key={m.manager_id} className="flex items-center gap-1 text-xs">{m.manager_id}<Button variant="outline" size="icon" className="h-5 w-5" onClick={()=> removeManager(t.id, m.manager_id).then(()=> teams.refetch())}><Trash2 className="h-3 w-3"/></Button></Badge>
                  ))}
                  {!(t.manager_teams||[]).length && <span className="text-xs text-muted-foreground">No managers</span>}
                </div>
              </div>
            </div>
          ))}
        </ModernCardContent>
      </ModernCard>
    </div>
  );
}
