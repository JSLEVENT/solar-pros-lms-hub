import { useState, useEffect } from 'react';
import { LMSLayout } from '@/components/LMSLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Video, Calendar, Clock, Users, Play, Eye, History, CheckCircle } from 'lucide-react';

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

export default function VirtualClasses() {
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
        .order('scheduled_at', { ascending: false });

      if (error) throw error;
      setClasses(data || []);
    } catch (error) {
      console.error('Error fetching classes:', error);
      toast({
        title: 'Error',
        description: 'Failed to load virtual classes',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const joinClass = (cls: VirtualClass) => {
    if (cls.meeting_url) {
      window.open(cls.meeting_url, '_blank');
    } else {
      toast({
        title: 'Meeting Link Unavailable',
        description: 'The meeting link will be available when the session starts.',
        variant: 'destructive',
      });
    }
  };

  const now = new Date();
  const upcomingClasses = classes.filter(c => new Date(c.scheduled_at) > now);
  const liveClasses = classes.filter(c => c.status === 'live');
  const completedClasses = classes.filter(c => c.status === 'completed');

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
      <div className="space-y-8 animate-fade-in">
        {/* Modern Header Section */}
        <div className="relative p-8 rounded-3xl bg-gradient-glass border border-white/10 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-solar opacity-20" />
          <div className="relative z-10">
            <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
              <div className="space-y-2">
                <h1 className="text-4xl font-bold text-gradient">Virtual Classes</h1>
                <p className="text-muted-foreground text-lg">
                  Join live sessions, webinars, and access recorded content
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant="outline" className="bg-accent/50 border-accent px-4 py-2 text-sm">
                  {classes.length} Total Sessions
                </Badge>
                {liveClasses.length > 0 && (
                  <Badge className="bg-gradient-primary text-white animate-pulse px-4 py-2 text-sm shadow-glow">
                    ● {liveClasses.length} Live Now
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>

        <Tabs defaultValue="upcoming" className="space-y-8">
          <TabsList className="card-glass border-white/10 bg-transparent p-2 h-auto rounded-2xl">
            <TabsTrigger value="upcoming" className="rounded-xl px-6 py-3 data-[state=active]:bg-primary data-[state=active]:text-white">
              Upcoming ({upcomingClasses.length})
            </TabsTrigger>
            <TabsTrigger value="live" className="rounded-xl px-6 py-3 data-[state=active]:bg-success data-[state=active]:text-white">
              Live ({liveClasses.length})
            </TabsTrigger>
            <TabsTrigger value="completed" className="rounded-xl px-6 py-3 data-[state=active]:bg-secondary data-[state=active]:text-secondary-foreground">
              Completed ({completedClasses.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upcoming" className="space-y-6">
            {upcomingClasses.length === 0 ? (
              <div className="card-glass border-white/10 rounded-2xl">
                <div className="flex flex-col items-center justify-center py-16">
                  <Calendar className="h-16 w-16 text-muted-foreground mb-6" />
                  <h3 className="text-xl font-semibold mb-3">No upcoming classes</h3>
                  <p className="text-muted-foreground text-center max-w-md">
                    New virtual sessions will appear here when scheduled.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {upcomingClasses.map((cls) => (
                  <div key={cls.id} className="card-glass border-white/10 rounded-2xl p-6 interactive-card">
                    <div className="flex items-start gap-6">
                      <div className="w-14 h-14 rounded-2xl bg-gradient-primary/10 flex items-center justify-center flex-shrink-0">
                        <Video className="h-7 w-7 text-primary" />
                      </div>
                      <div className="flex-1 space-y-4">
                        <div className="flex items-start justify-between">
                          <div className="space-y-2">
                            <h3 className="font-semibold text-xl">{cls.title}</h3>
                            <p className="text-muted-foreground">
                              {cls.courses.title} • {cls.profiles?.full_name}
                            </p>
                          </div>
                          <Badge variant="outline" className="bg-accent/50 border-accent">
                            {cls.courses.category}
                          </Badge>
                        </div>

                        {cls.description && (
                          <p className="text-muted-foreground leading-relaxed">
                            {cls.description}
                          </p>
                        )}

                        <div className="flex items-center gap-8 text-sm">
                          <div className="flex items-center gap-2 text-primary">
                            <Calendar className="h-4 w-4" />
                            <span className="font-medium">{new Date(cls.scheduled_at).toLocaleDateString()}</span>
                          </div>
                          <div className="flex items-center gap-2 text-primary">
                            <Clock className="h-4 w-4" />
                            <span className="font-medium">
                              {new Date(cls.scheduled_at).toLocaleTimeString()} 
                              ({cls.duration_minutes}min)
                            </span>
                          </div>
                          {cls.max_participants && (
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Users className="h-4 w-4" />
                              <span>Max {cls.max_participants}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <Button onClick={() => joinClass(cls)} disabled={!cls.meeting_url} className="btn-glass">
                        Join Class
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="live" className="space-y-4">
            {liveClasses.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Play className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No live classes</h3>
                  <p className="text-muted-foreground text-center">
                    Live sessions will appear here when they start.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {liveClasses.map((cls) => (
                  <Card key={cls.id} className="border-success bg-success/5">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-lg bg-success/20 flex items-center justify-center flex-shrink-0">
                          <Play className="h-6 w-6 text-success" />
                        </div>
                        <div className="flex-1 space-y-3">
                          <div className="flex items-start justify-between">
                            <div>
                              <h3 className="font-semibold text-lg">{cls.title}</h3>
                              <p className="text-sm text-muted-foreground">
                                {cls.courses.title} • {cls.profiles?.full_name}
                              </p>
                            </div>
                            <Badge className="bg-success text-success-foreground animate-pulse">
                              LIVE NOW
                            </Badge>
                          </div>
                        </div>
                        <Button onClick={() => joinClass(cls)} className="bg-success hover:bg-success/90">
                          <Play className="h-4 w-4 mr-2" />
                          Join Live
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="completed" className="space-y-4">
            {completedClasses.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <History className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No completed classes</h3>
                  <p className="text-muted-foreground text-center">
                    Completed sessions and recordings will appear here.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {completedClasses.map((cls) => (
                  <Card key={cls.id} className="opacity-80">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-lg bg-secondary/50 flex items-center justify-center flex-shrink-0">
                          <CheckCircle className="h-6 w-6 text-secondary-foreground" />
                        </div>
                        <div className="flex-1 space-y-3">
                          <div className="flex items-start justify-between">
                            <div>
                              <h3 className="font-semibold text-lg">{cls.title}</h3>
                              <p className="text-sm text-muted-foreground">
                                {cls.courses.title} • Completed on {new Date(cls.scheduled_at).toLocaleDateString()}
                              </p>
                            </div>
                            <Badge variant="secondary">
                              Completed
                            </Badge>
                          </div>
                        </div>
                        <Button variant="outline">
                          <Eye className="h-4 w-4 mr-2" />
                          View Recording
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </LMSLayout>
  );
}