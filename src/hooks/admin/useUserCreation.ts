import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchTeamsForDropdown, createUserDirect, inviteUser } from '@/lib/admin/queries';

type AppRole = 'owner'|'admin'|'manager'|'learner';

export function useUserCreation(){
  const qc = useQueryClient();
  const teams = useQuery({ queryKey:['admin','teams','dropdown'], queryFn: fetchTeamsForDropdown });
  const createMutation = useMutation({
    mutationFn: (payload: { email:string; first_name?:string; last_name?:string; mobile_number?:string; role:AppRole; team_id?:string }) => createUserDirect(payload),
    onSuccess: ()=> {
      qc.invalidateQueries({ queryKey:['admin','users'] });
      qc.invalidateQueries({ queryKey:['admin','users','page'] });
    }
  });
  const inviteMutation = useMutation({
    mutationFn: (payload: { email:string; first_name?:string; last_name?:string; mobile_number?:string; role:AppRole; team_id?:string; full_name?:string }) => inviteUser(payload as any),
    onSuccess: ()=> {
      qc.invalidateQueries({ queryKey:['admin','users'] });
      qc.invalidateQueries({ queryKey:['admin','users','page'] });
    }
  });
  return { teams, createMutation, inviteMutation };
}
