import { useQuery } from '@tanstack/react-query';
import { fetchAdminStats } from '@/lib/admin/queries';

export function useAdminStats() {
  return useQuery({
    queryKey: ['admin','stats'],
    queryFn: fetchAdminStats,
    refetchInterval: 60_000,
  });
}
