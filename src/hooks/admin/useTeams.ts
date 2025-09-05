import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchTeams, toggleTeamArchived, assignManager, removeManager, fetchTeamAnalytics, createTeam, addMemberToTeam, removeMemberFromTeam } from '@/lib/admin/queries';

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
  const addMemberMutation = useMutation({
    mutationFn: ({team_id, user_id}:{team_id:string; user_id:string}) => addMemberToTeam(team_id, user_id),
    onSuccess: ()=> qc.invalidateQueries({queryKey:['admin','teams']})
  });
  const removeMemberMutation = useMutation({
    mutationFn: ({team_id, user_id}:{team_id:string; user_id:string}) => removeMemberFromTeam(team_id, user_id),
    onSuccess: ()=> qc.invalidateQueries({queryKey:['admin','teams']})
  });
  return { teams, analytics, archiveMutation, assignMutation, removeMutation, createMutation, addMemberMutation, removeMemberMutation };
}
