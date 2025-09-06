import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface UserProgressStats {
  coursesEnrolled: number;
  coursesCompleted: number;
  totalProgress: number;
  weeklyProgress: number;
  certificates: number;
  studyTime: string;
  streak: number;
  upcomingDeadlines: number;
}

export function useUserProgress() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['user-progress', user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error('User not authenticated');

      // Get enrollment stats
      const { data: enrollments, error: enrollmentError } = await supabase
        .from('enrollments')
        .select('progress, status, completed_at')
        .eq('user_id', user.id);

      if (enrollmentError) throw enrollmentError;

      // Get certificates count
      const { data: certificates, error: certError } = await supabase
        .from('certificates')
        .select('id')
        .eq('user_id', user.id)
        .eq('status', 'active');

      if (certError) throw certError;

      // Get upcoming virtual classes for deadlines
      const { data: upcomingClasses, error: classError } = await supabase
        .from('virtual_classes')
        .select('id, scheduled_at')
        .gte('scheduled_at', new Date().toISOString())
        .order('scheduled_at', { ascending: true })
        .limit(5);

      if (classError) throw classError;

      // Calculate stats
      const coursesEnrolled = enrollments?.length || 0;
      const coursesCompleted = enrollments?.filter(e => e.status === 'completed').length || 0;
      const totalProgress = coursesEnrolled > 0 
        ? Math.round(enrollments.reduce((sum, e) => sum + e.progress, 0) / coursesEnrolled)
        : 0;

      // Mock some additional stats that would require more complex queries
      const weeklyProgress = Math.floor(Math.random() * 20) + 5; // Would be calculated from recent activity
      const studyTime = "24h"; // Would be calculated from session tracking
      const streak = 7; // Would be calculated from daily activity
      
      return {
        coursesEnrolled,
        coursesCompleted,
        totalProgress,
        weeklyProgress,
        certificates: certificates?.length || 0,
        studyTime,
        streak,
        upcomingDeadlines: upcomingClasses?.length || 0
      } as UserProgressStats;
    },
    enabled: !!user?.id,
  });
}