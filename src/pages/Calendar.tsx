import { useState, useEffect } from 'react';
import { LMSLayout } from '@/components/LMSLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Calendar as CalendarIcon, Clock, Users, Video, MapPin, Bell } from 'lucide-react';

interface VirtualClass {
  id: string;
  title: string;
  description: string;
  scheduled_at: string;
  duration_minutes: number;
  meeting_url?: string;
  status: string;
  max_participants?: number;
  courses: {
    title: string;
    category: string;
  };
  profiles: {
    full_name: string;
  };
}

export default function Calendar() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [classes, setClasses] = useState<VirtualClass[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchClasses();
    }
  }, [user]);

  const fetchClasses = async () => {
    try {
      const { data: enrollments } = await supabase
        .from('enrollments')
        .select('course_id')
        .eq('user_id', user?.id);

      const courseIds = enrollments?.map(e => e.course_id) || [];

      const { data, error } = await supabase
        .from('virtual_classes')
        .select(`
          *,
          courses (
            title,
            category
          ),
          profiles:instructor_id (
            full_name
          )
        `)
        .in('course_id', courseIds)
        .gte('scheduled_at', new Date().toISOString())
        .order('scheduled_at', { ascending: true });

      if (error) throw error;
      setClasses(data || []);
    } catch (error) {
      console.error('Error fetching classes:', error);
      toast({
        title: 'Error',
        description: 'Failed to load calendar events',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const joinClass = (meetingUrl?: string) => {
    if (meetingUrl) {
      window.open(meetingUrl, '_blank');
    } else {
      toast({
        title: 'Meeting Link Unavailable',
        description: 'The meeting link will be available closer to the session time.',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <LMSLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </LMSLayout>
    );
  }

  return (
    <LMSLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold">Calendar</h1>
            <p className="text-muted-foreground">
              View upcoming classes, webinars, and assignment deadlines
            </p>
          </div>
          <Badge variant="outline">
            {classes.length} Upcoming Events
          </Badge>
        </div>

        <div className="space-y-4">
          {classes.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <CalendarIcon className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No upcoming events</h3>
                <p className="text-muted-foreground text-center">
                  Virtual classes and webinars will appear here when scheduled.
                </p>
              </CardContent>
            </Card>
          ) : (
            classes.map((cls) => (
              <Card key={cls.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Video className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1 space-y-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold text-lg">{cls.title}</h3>
                          <p className="text-sm text-muted-foreground">
                            {cls.courses.title} • Instructor: {cls.profiles?.full_name}
                          </p>
                        </div>
                        <Badge 
                          className={cls.status === 'live' ? 'bg-success' : 'bg-primary'}
                        >
                          {cls.status === 'live' ? 'Live Now' : 'Scheduled'}
                        </Badge>
                      </div>

                      {cls.description && (
                        <p className="text-sm text-muted-foreground">
                          {cls.description}
                        </p>
                      )}

                      <div className="flex items-center gap-6 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <CalendarIcon className="h-4 w-4" />
                          <span>{new Date(cls.scheduled_at).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          <span>
                            {new Date(cls.scheduled_at).toLocaleTimeString()} 
                            ({cls.duration_minutes}min)
                          </span>
                        </div>
                        {cls.max_participants && (
                          <div className="flex items-center gap-1">
                            <Users className="h-4 w-4" />
                            <span>Max {cls.max_participants} participants</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <Button 
                        onClick={() => joinClass(cls.meeting_url)}
                        disabled={cls.status !== 'live' && !cls.meeting_url}
                      >
                        {cls.status === 'live' ? 'Join Now' : 'Join Class'}
                      </Button>
                      <Button variant="outline" size="sm">
                        <Bell className="h-4 w-4 mr-2" />
                        Remind Me
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </LMSLayout>
  );
}