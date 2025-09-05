import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchCourses, createCourse, updateCourse, deleteCourse } from '@/lib/admin/queries';

export function useCourses(){
  const qc = useQueryClient();
  const list = useQuery({ queryKey:['admin','courses'], queryFn: fetchCourses });
  const createMutation = useMutation({
    mutationFn: (payload: { title:string; description:string; category:string; level:string; duration?:string }) => createCourse(payload),
    onSuccess: ()=> qc.invalidateQueries({queryKey:['admin','courses']})
  });
  const updateMutation = useMutation({
    mutationFn: ({id, data}:{id:string; data: any}) => updateCourse(id, data),
    onSuccess: ()=> qc.invalidateQueries({queryKey:['admin','courses']})
  });
  const deleteMutation = useMutation({
    mutationFn: (id:string) => deleteCourse(id),
    onSuccess: ()=> qc.invalidateQueries({queryKey:['admin','courses']})
  });
  return { ...list, createMutation, updateMutation, deleteMutation };
}
