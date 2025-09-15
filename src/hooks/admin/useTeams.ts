import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchTeams, toggleTeamArchived, assignManager, removeManager, fetchTeamAnalytics, createTeam, addMemberToTeam, removeMemberFromTeam, updateTeam } from '@/lib/admin/queries';
import { supabase } from '@/integrations/supabase/client';

export function useTeams(){
  const qc = useQueryClient();
  const teams = useQuery({ queryKey:['admin','teams'], queryFn: ()=> fetchTeams(true) });
  const analytics = useQuery({ queryKey:['admin','team-analytics'], queryFn: fetchTeamAnalytics, refetchInterval: 120_000 });
  const archiveMutation = useMutation({
    mutationFn: ({id,next}:{id:string; next:boolean}) => toggleTeamArchived(id,next),
    onSuccess: ()=> qc.invalidateQueries({queryKey:['admin','teams']})
  });
  const assignMutation = useMutation({
    mutationFn: ({team_id, manager_id}:{team_id:string; manager_id:string}) => assignManager(team_id, manager_id),
    onSuccess: ()=> qc.invalidateQueries({queryKey:['admin','teams']})
  });
  const removeMutation = useMutation({
    mutationFn: ({team_id, manager_id}:{team_id:string; manager_id:string}) => removeManager(team_id, manager_id),
    onSuccess: ()=> qc.invalidateQueries({queryKey:['admin','teams']})
  });
  const createMutation = useMutation({
    mutationFn: ({name, description}:{name:string; description:string}) => createTeam(name, description),
    onSuccess: ()=> qc.invalidateQueries({queryKey:['admin','teams']})
  });
  const updateMutation = useMutation({
    mutationFn: ({id, name, description}:{id:string; name?:string; description?:string}) => updateTeam(id, { name, description }),
    onMutate: async (vars)=>{
      await qc.cancelQueries({ queryKey:['admin','teams'] });
      const previous = qc.getQueryData<any>(['admin','teams']);
      // optimistic: patch name/description locally
      qc.setQueryData<any>(['admin','teams'], (old:any)=> (old||[]).map((t:any)=> t.id===vars.id ? { ...t, ...(vars.name!==undefined? { name: vars.name }: {}), ...(vars.description!==undefined? { description: vars.description }: {}) } : t));
      return { previous } as { previous: any };
    },
    onError: (_err, _vars, ctx)=>{
      if(ctx?.previous) qc.setQueryData(['admin','teams'], ctx.previous);
    },
    onSettled: ()=>{
      qc.invalidateQueries({ queryKey:['admin','teams'] });
    }
  });
  const addMemberMutation = useMutation({
    mutationFn: ({team_id, user_id}:{team_id:string; user_id:string}) => addMemberToTeam(team_id, user_id),
    onSuccess: ()=> qc.invalidateQueries({queryKey:['admin','teams']})
  });
  const removeMemberMutation = useMutation({
    mutationFn: ({team_id, user_id}:{team_id:string; user_id:string}) => removeMemberFromTeam(team_id, user_id),
    onSuccess: ()=> qc.invalidateQueries({queryKey:['admin','teams']})
  });

  // Live data via realtime
  useEffect(()=>{
    const channel = supabase
      .channel('admin-teams-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'teams' }, ()=>{
        qc.invalidateQueries({ queryKey:['admin','teams'] });
        qc.invalidateQueries({ queryKey:['admin','team-analytics'] });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'team_memberships' }, ()=>{
        qc.invalidateQueries({ queryKey:['admin','teams'] });
        qc.invalidateQueries({ queryKey:['admin','team-analytics'] });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'manager_teams' }, ()=>{
        qc.invalidateQueries({ queryKey:['admin','teams'] });
      })
      .subscribe();
    return ()=> { try { supabase.removeChannel(channel); } catch {} };
  }, [qc]);

  return { teams, analytics, archiveMutation, assignMutation, removeMutation, createMutation, updateMutation, addMemberMutation, removeMemberMutation };
}
