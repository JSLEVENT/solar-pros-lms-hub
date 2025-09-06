import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface UserCourse {
  id: string;
  title: string;
  description: string | null;
  instructor_id: string | null;
  category: string | null;
  duration: string | null;
  level: string | null;
  image_url: string | null;
  progress: number;
  status: 'active' | 'completed' | 'paused';
  enrolled_at: string;
  completed_at: string | null;
  instructor_name?: string;
}

export function useUserEnrollments() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['user-enrollments', user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error('User not authenticated');

      const { data: enrollments, error } = await supabase
        .from('enrollments')
        .select(`
          id,
          progress,
          status,
          enrolled_at,
          completed_at,
          courses (
            id,
            title,
            description,
            instructor_id,
            category,
            duration,
            level,
            image_url,
            profiles:instructor_id (
              full_name
            )
          )
        `)
        .eq('user_id', user.id)
        .order('enrolled_at', { ascending: false });

      if (error) throw error;

      return enrollments.map(enrollment => ({
        id: enrollment.courses?.id || '',
        title: enrollment.courses?.title || '',
        description: enrollment.courses?.description,
        instructor_id: enrollment.courses?.instructor_id,
        category: enrollment.courses?.category,
        duration: enrollment.courses?.duration,
        level: enrollment.courses?.level,
        image_url: enrollment.courses?.image_url,
        progress: enrollment.progress,
        status: enrollment.status as 'active' | 'completed' | 'paused',
        enrolled_at: enrollment.enrolled_at,
        completed_at: enrollment.completed_at,
        instructor_name: enrollment.courses?.profiles?.full_name || 'Unknown Instructor'
      })) as UserCourse[];
    },
    enabled: !!user?.id,
  });
}