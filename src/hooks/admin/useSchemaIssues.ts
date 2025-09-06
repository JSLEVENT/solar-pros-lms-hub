import { useQuery } from '@tanstack/react-query';
import { checkAdminSchema } from '@/lib/admin/schemaGuard';

export function useSchemaIssues(){
  return useQuery({ queryKey:['admin','schema-issues'], queryFn: checkAdminSchema, refetchInterval: 60_000 });
}