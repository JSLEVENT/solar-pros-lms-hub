import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchUsers, updateUserRole, toggleUserActive, inviteUser } from '@/lib/admin/queries';

type AppRole = 'owner'|'admin'|'manager'|'learner';

export function useUsers(){
  const qc = useQueryClient();
  const list = useQuery({ queryKey: ['admin','users'], queryFn: fetchUsers });
  const roleMutation = useMutation({
    mutationFn: ({user_id, role}:{user_id:string; role:AppRole}) => updateUserRole(user_id, role),
    onSuccess: ()=> qc.invalidateQueries({queryKey:['admin','users']})
  });
  const activeMutation = useMutation({
    mutationFn: ({user_id,next}:{user_id:string; next:boolean}) => toggleUserActive(user_id,next),
    onSuccess: ()=> qc.invalidateQueries({queryKey:['admin','users']})
  });
  const inviteMutation = useMutation({
    mutationFn: (payload:{ email:string; full_name?:string; role?:AppRole }) => inviteUser(payload),
    onSuccess: ()=> qc.invalidateQueries({queryKey:['admin','users']})
  });
  return { ...list, roleMutation, activeMutation, inviteMutation };
}
