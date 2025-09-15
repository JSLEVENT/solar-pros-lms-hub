import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchTeamsForDropdown, createUserDirect, inviteUser, addMemberToTeam, createUserFallbackLocal } from '@/lib/admin/queries';

type AppRole = 'owner'|'admin'|'manager'|'learner';

export function useUserCreation(){
  const qc = useQueryClient();
  const teams = useQuery({ queryKey:['admin','teams','dropdown'], queryFn: fetchTeamsForDropdown });
  const createMutation = useMutation({
    mutationFn: async (payload: { email:string; first_name?:string; last_name?:string; mobile_number?:string; role:AppRole; team_id?:string }) => {
      try {
        return await createUserDirect({ ...payload, first_name: payload.first_name||undefined, last_name: payload.last_name||undefined, mobile_number: payload.mobile_number||undefined, team_id: payload.team_id||undefined });
      } catch (e:any) {
        // If edge function failed (likely 400), fallback to local creation path
        return await createUserFallbackLocal(payload as any);
      }
    },
    onSuccess: async (res:any, vars)=> {
      // Best-effort: ensure team assignment client-side if provided
      try {
        if ((res as any)?.user_id && vars.team_id) {
          await addMemberToTeam(vars.team_id, (res as any).user_id);
        }
      } catch { /* ignore */ }
      qc.invalidateQueries({ queryKey:['admin','users'] });
      qc.invalidateQueries({ queryKey:['admin','users','page'] });
      qc.invalidateQueries({ queryKey:['admin','teams'] });
    }
  });
  const inviteMutation = useMutation({
    mutationFn: (payload: { email:string; first_name?:string; last_name?:string; mobile_number?:string; role:AppRole; team_id?:string; full_name?:string }) => inviteUser({ ...payload, first_name: payload.first_name||undefined, last_name: payload.last_name||undefined, mobile_number: payload.mobile_number||undefined, team_id: payload.team_id||undefined } as any),
    onSuccess: async (_res, vars)=> {
      // After inviting, we still create profile/team server-side; ensure team assignment client-side if needed once user_id is known later.
      // We cannot add membership without user_id, so just invalidate lists.
      qc.invalidateQueries({ queryKey:['admin','users'] });
      qc.invalidateQueries({ queryKey:['admin','users','page'] });
      qc.invalidateQueries({ queryKey:['admin','teams'] });
    }
  });
  return { teams, createMutation, inviteMutation };
}
