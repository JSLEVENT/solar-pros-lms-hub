import { useQuery } from '@tanstack/react-query';
import { fetchActiveUsersTimeSeries, fetchEnrollmentFunnel, fetchProgressDistribution, fetchTopLearners } from '@/lib/admin/queries';

export function useAnalytics(){
  const activeSeries = useQuery({ queryKey:['admin','analytics','active-series'], queryFn: ()=> fetchActiveUsersTimeSeries(30), refetchInterval: 5*60_000 });
  const funnel = useQuery({ queryKey:['admin','analytics','funnel'], queryFn: fetchEnrollmentFunnel, refetchInterval: 5*60_000 });
  const distribution = useQuery({ queryKey:['admin','analytics','distribution'], queryFn: fetchProgressDistribution, refetchInterval: 10*60_000 });
  const topLearners = useQuery({ queryKey:['admin','analytics','top-learners'], queryFn: ()=> fetchTopLearners(10), refetchInterval: 10*60_000 });
  return { activeSeries, funnel, distribution, topLearners };
}
