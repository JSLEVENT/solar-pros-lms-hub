import { useTeams } from '@/hooks/admin/useTeams';
import { ModernCard, ModernCardContent } from '@/components/ui/modern-card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Layers, Trash2 } from 'lucide-react';
import { assignManager, removeManager, toggleTeamArchived, exportTeamMembers, downloadCSV } from '@/lib/admin/queries';
import { useToast } from '@/hooks/use-toast';
import { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { Link } from 'react-router-dom';

export function TeamManagementPanel(){
  const { teams, analytics } = useTeams();
  const { toast } = useToast();
  const [managers, setManagers] = useState<{ user_id:string; full_name:string|null }[]>([]);

  useEffect(()=>{ (async ()=>{ const { data } = await supabase.from('profiles').select('user_id,full_name').eq('role','manager'); setManagers(data||[]); })(); },[]);

  const exportMembers = async (team_id:string) => {
    try { const csv = await exportTeamMembers(team_id); downloadCSV(`team-${team_id}-members.csv`, csv); toast({ title:'Export generated'}); } catch(e:any){ toast({ title:'Export failed', description:e.message, variant:'destructive'});} }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold">Team Management</h2>
        <Button asChild variant="outline"><Link to="/admin/teams">Open Full Manager</Link></Button>
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
                  </div>
                </div>
              </div>
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
