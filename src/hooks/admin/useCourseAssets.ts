import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { attachCourseAssets, detachCourseAsset, fetchCourseAssets, reorderCourseAssets } from '@/lib/admin/queries';

export function useCourseAssets(course_id: string){
  const qc = useQueryClient();
  const key = ['admin','courses','course-assets',course_id];
  const list = useQuery({ queryKey: key, queryFn: ()=> fetchCourseAssets(course_id), enabled: !!course_id });
  const attach = useMutation({
    mutationFn: (ids: string[]) => attachCourseAssets(course_id, ids),
    onSuccess: ()=> qc.invalidateQueries({ queryKey: key })
  });
  const detach = useMutation({
    mutationFn: (asset_id: string) => detachCourseAsset(course_id, asset_id),
    onSuccess: ()=> qc.invalidateQueries({ queryKey: key })
  });
  const reorder = useMutation({
    mutationFn: (ordered_asset_ids: string[]) => reorderCourseAssets(course_id, ordered_asset_ids),
    onSuccess: ()=> qc.invalidateQueries({ queryKey: key })
  });
  return { ...list, attach, detach, reorder };
}
