import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchUsers, updateUserRole, toggleUserActive, inviteUser } from '@/lib/admin/queries';

export function useUsers(){
  const qc = useQueryClient();
  const list = useQuery({ queryKey: ['admin','users'], queryFn: fetchUsers });
  const roleMutation = useMutation({
    mutationFn: ({user_id, role}:{user_id:string; role:string}) => updateUserRole(user_id, role),
    onSuccess: ()=> qc.invalidateQueries({queryKey:['admin','users']})
  });
  const activeMutation = useMutation({
    mutationFn: ({id,next}:{id:string; next:boolean}) => toggleUserActive(id,next),
    onSuccess: ()=> qc.invalidateQueries({queryKey:['admin','users']})
  });
  const inviteMutation = useMutation({
    mutationFn: (payload:{ email:string; full_name?:string; role?:string }) => inviteUser(payload),
    onSuccess: ()=> qc.invalidateQueries({queryKey:['admin','users']})
  });
  return { ...list, roleMutation, activeMutation, inviteMutation };
}
