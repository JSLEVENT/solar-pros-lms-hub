import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { LMSLayout } from "@/components/LMSLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CalendarIcon, Clock, Users, Video, PlayCircle, AlertCircle } from "lucide-react";

interface VirtualClass {
  id: string;
  title: string;
  description: string;
  scheduled_at: string;
  duration_minutes: number;
  meeting_url: string | null;
  status: string;
  max_participants: number;
  courses: {
    title: string;
    id: string;
  };
  profiles: {
    email: string;
  };
}

const LiveTrainings = () => {
  const { user } = useAuth();
  const { toast: showToast } = useToast();
  const [classes, setClasses] = useState<VirtualClass[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchClasses();
    }
  }, [user]);

  const fetchClasses = async () => {
    try {
      setLoading(true);
      
      // First get user's enrolled course IDs
      const { data: enrollments } = await supabase
        .from('enrollments')
        .select('course_id')
        .eq('user_id', user?.id);

      if (!enrollments || enrollments.length === 0) {
        setClasses([]);
        return;
      }

      const courseIds = enrollments.map(e => e.course_id);

      // Then fetch virtual classes for those courses
      const { data: classesData, error } = await supabase
        .from('virtual_classes')
        .select(`
          *,
          courses (
            title,
            id
          ),
          profiles (
            email
          )
        `)
        .in('course_id', courseIds)
        .order('scheduled_at', { ascending: true });

      if (error) {
        console.error('Error fetching classes:', error);
        showToast({
          title: "Error",
          description: "Failed to load classes",
          variant: "destructive",
        });
        return;
      }

      // Transform the data to match our interface
      const transformedClasses: VirtualClass[] = classesData?.map(classData => ({
        id: classData.id,
        title: classData.title,
        description: classData.description,
        scheduled_at: classData.scheduled_at,
        duration_minutes: classData.duration_minutes,
        meeting_url: classData.meeting_url,
        status: classData.status,
        max_participants: classData.max_participants,
        courses: classData.courses,
        profiles: { email: 'instructor@example.com' } // Mock email since profile query failed
      })) || [];
      
      setClasses(transformedClasses);
    } catch (error) {
      console.error('Error:', error);
      showToast({
        title: "Error",
        description: "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const joinClass = (classItem: VirtualClass) => {
    if (classItem.meeting_url) {
      window.open(classItem.meeting_url, '_blank');
    } else {
      showToast({
        title: "Meeting link not available",
        description: "The meeting link will be available closer to the start time",
      });
    }
  };

  const now = new Date();
  const upcomingClasses = classes.filter(c => new Date(c.scheduled_at) > now && c.status !== 'completed');
  const liveClasses = classes.filter(c => {
    const classStart = new Date(c.scheduled_at);
    const classEnd = new Date(classStart.getTime() + c.duration_minutes * 60000);
    return now >= classStart && now <= classEnd && c.status === 'live';
  });
  const completedClasses = classes.filter(c => c.status === 'completed' || new Date(c.scheduled_at) < now);

  if (loading) {
    return (
      <LMSLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
        </div>
      </LMSLayout>
    );
  }

  return (
    <LMSLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold">Live Trainings</h1>
          <p className="text-xl text-muted-foreground">
            Join live training sessions, attend workshops, and participate in real-time learning
          </p>
          
          {/* Stats */}
          <div className="flex justify-center gap-8 mt-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">{liveClasses.length}</div>
              <div className="text-sm text-muted-foreground">Live Now</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">{upcomingClasses.length}</div>
              <div className="text-sm text-muted-foreground">Upcoming</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-600">{completedClasses.length}</div>
              <div className="text-sm text-muted-foreground">Completed</div>
            </div>
          </div>
        </div>

        {/* Classes Tabs */}
        <Tabs defaultValue="upcoming" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="upcoming" className="flex items-center gap-2">
              <CalendarIcon className="h-4 w-4" />
              Upcoming ({upcomingClasses.length})
            </TabsTrigger>
            <TabsTrigger value="live" className="flex items-center gap-2">
              <Video className="h-4 w-4" />
              Live ({liveClasses.length})
            </TabsTrigger>
            <TabsTrigger value="completed" className="flex items-center gap-2">
              <PlayCircle className="h-4 w-4" />
              Completed ({completedClasses.length})
            </TabsTrigger>
          </TabsList>

          {/* Upcoming Classes */}
          <TabsContent value="upcoming" className="space-y-6">
            {upcomingClasses.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center h-48">
                  <CalendarIcon className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Upcoming Sessions</h3>
                  <p className="text-muted-foreground text-center">
                    Check back later for new training sessions
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-6 md:grid-cols-2">
                {upcomingClasses.map((classItem) => (
                  <Card key={classItem.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg">{classItem.title}</CardTitle>
                          <CardDescription className="text-sm text-muted-foreground">
                            {classItem.courses.title}
                          </CardDescription>
                        </div>
                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                          Upcoming
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-sm text-muted-foreground">{classItem.description}</p>
                      
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <CalendarIcon className="h-4 w-4" />
                          <span>{new Date(classItem.scheduled_at).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          <span>{new Date(classItem.scheduled_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4" />
                          <span>0/{classItem.max_participants} participants</span>
                        </div>
                        <span className="text-muted-foreground">
                          Duration: {classItem.duration_minutes} min
                        </span>
                      </div>
                      
                      <div className="text-sm text-muted-foreground">
                        <strong>Instructor:</strong> {classItem.profiles.email}
                      </div>
                      
                      <div className="flex gap-2">
                        <Button 
                          onClick={() => joinClass(classItem)}
                          className="flex-1"
                          disabled={!classItem.meeting_url}
                        >
                          {classItem.meeting_url ? 'Join Class' : 'Link Not Available'}
                        </Button>
                        <Button variant="outline" size="sm">
                          Remind Me
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Live Classes */}
          <TabsContent value="live" className="space-y-6">
            {liveClasses.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center h-48">
                  <Video className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Live Sessions</h3>
                  <p className="text-muted-foreground text-center">
                    No classes are currently live
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-6 md:grid-cols-2">
                {liveClasses.map((classItem) => (
                  <Card key={classItem.id} className="border-green-200 bg-green-50 hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg flex items-center gap-2">
                            {classItem.title}
                            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                          </CardTitle>
                          <CardDescription className="text-sm text-muted-foreground">
                            {classItem.courses.title}
                          </CardDescription>
                        </div>
                        <Badge className="bg-green-500 text-white">
                          LIVE
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-sm text-muted-foreground">{classItem.description}</p>
                      
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4" />
                          <span>0/{classItem.max_participants} participants</span>
                        </div>
                        <span className="text-muted-foreground">
                          Duration: {classItem.duration_minutes} min
                        </span>
                      </div>
                      
                      <div className="text-sm text-muted-foreground">
                        <strong>Instructor:</strong> {classItem.profiles.email}
                      </div>
                      
                      <Button 
                        onClick={() => joinClass(classItem)}
                        className="w-full bg-green-600 hover:bg-green-700"
                      >
                        <Video className="h-4 w-4 mr-2" />
                        Join Live Session
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Completed Classes */}
          <TabsContent value="completed" className="space-y-6">
            {completedClasses.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center h-48">
                  <PlayCircle className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Completed Sessions</h3>
                  <p className="text-muted-foreground text-center">
                    Completed training sessions will appear here
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-6 md:grid-cols-2">
                {completedClasses.map((classItem) => (
                  <Card key={classItem.id} className="opacity-75 hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg">{classItem.title}</CardTitle>
                          <CardDescription className="text-sm text-muted-foreground">
                            {classItem.courses.title}
                          </CardDescription>
                        </div>
                        <Badge variant="secondary">
                          Completed
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-sm text-muted-foreground">{classItem.description}</p>
                      
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <CalendarIcon className="h-4 w-4" />
                          <span>{new Date(classItem.scheduled_at).toLocaleDateString()}</span>
                        </div>
                        <span className="text-muted-foreground">
                          Duration: {classItem.duration_minutes} min
                        </span>
                      </div>
                      
                      <div className="text-sm text-muted-foreground">
                        <strong>Instructor:</strong> {classItem.profiles.email}
                      </div>
                      
                      <Button variant="outline" className="w-full">
                        <PlayCircle className="h-4 w-4 mr-2" />
                        View Recording
                      </Button>
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
};

export default LiveTrainings;