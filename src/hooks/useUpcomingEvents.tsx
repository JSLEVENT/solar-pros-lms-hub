import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface UpcomingEvent {
  id: string;
  title: string;
  time: string;
  type: 'webinar' | 'deadline' | 'event';
  attendees?: number;
  course?: string;
  scheduled_at: string;
}

export function useUpcomingEvents() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['upcoming-events', user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error('User not authenticated');

      // Get virtual classes for enrolled courses
      const { data: virtualClasses, error: classError } = await supabase
        .from('virtual_classes')
        .select(`
          id,
          title,
          description,
          scheduled_at,
          max_participants,
          courses (
            title,
            enrollments!inner (
              user_id
            )
          )
        `)
        .gte('scheduled_at', new Date().toISOString())
        .eq('courses.enrollments.user_id', user.id)
        .order('scheduled_at', { ascending: true })
        .limit(5);

      if (classError) throw classError;

      // Get upcoming assessments (mock data for now)
      const events: UpcomingEvent[] = [];

      // Add virtual classes
      if (virtualClasses) {
        virtualClasses.forEach(vc => {
          const eventDate = new Date(vc.scheduled_at);
          const now = new Date();
          const isToday = eventDate.toDateString() === now.toDateString();
          const isTomorrow = eventDate.toDateString() === new Date(now.getTime() + 24 * 60 * 60 * 1000).toDateString();
          
          let timeDisplay = '';
          if (isToday) {
            timeDisplay = `Today, ${eventDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
          } else if (isTomorrow) {
            timeDisplay = `Tomorrow, ${eventDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
          } else {
            timeDisplay = eventDate.toLocaleDateString('en-US', { 
              weekday: 'long', 
              hour: '2-digit', 
              minute: '2-digit' 
            });
          }

          events.push({
            id: vc.id,
            title: vc.title,
            time: timeDisplay,
            type: 'webinar',
            attendees: vc.max_participants || undefined,
            course: vc.courses?.title,
            scheduled_at: vc.scheduled_at
          });
        });
      }

      // Add some mock upcoming deadlines if we don't have enough events
      if (events.length < 3) {
        events.push({
          id: 'mock-deadline-1',
          title: 'Assignment Due: Safety Assessment',
          time: 'Tomorrow, 11:59 PM',
          type: 'deadline',
          course: 'Electrical Safety',
          scheduled_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
        });

        events.push({
          id: 'mock-event-1',
          title: 'Live Q&A with Industry Expert',
          time: 'Friday, 1:00 PM',
          type: 'event',
          attendees: 120,
          scheduled_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
        });
      }

      return events.sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime());
    },
    enabled: !!user?.id,
  });
}