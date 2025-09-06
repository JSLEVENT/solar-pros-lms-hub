import { LMSLayout } from "@/components/LMSLayout";
import { DashboardWelcome } from "@/components/DashboardWelcome";
import { CourseCard } from "@/components/CourseCard";
import { ProgressStats } from "@/components/ProgressStats";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card-new";
import { Button } from "@/components/ui/button-new";
import { Badge } from "@/components/ui/badge-new";
import { Calendar, MessageSquare, Clock, Users, TrendingUp } from "lucide-react";
import { useUserEnrollments } from "@/hooks/useUserEnrollments";
import { useUserProgress } from "@/hooks/useUserProgress";
import { useUpcomingEvents } from "@/hooks/useUpcomingEvents";
import { useRecentDiscussions } from "@/hooks/useRecentDiscussions";
import { useAuth } from "@/hooks/useAuth";

const Index = () => {
  const { profile } = useAuth();
  
  // Real database integrations
  const { data: enrolledCourses, isLoading: coursesLoading, isError: coursesError } = useUserEnrollments();
  const { data: progressStats, isLoading: progressLoading, isError: progressError } = useUserProgress();
  const { data: upcomingEvents, isLoading: eventsLoading, isError: eventsError } = useUpcomingEvents();
  const { data: recentDiscussions, isLoading: discussionsLoading, isError: discussionsError } = useRecentDiscussions();

  // User data from auth
  const currentUser = {
    name: profile?.first_name ? `${profile.first_name}${profile.last_name? ' '+profile.last_name:''}` : (profile?.full_name || "User"),
    role: (profile?.role as 'admin'|'learner'|'instructor') || 'learner',
    notificationCount: 3 // This could be fetched from notifications table
  };

  // Calculate recent activity from real data
  const recentActivity = {
    coursesInProgress: enrolledCourses?.filter(c => c.status === 'active').length || 0,
    completedToday: (enrolledCourses||[]).filter(c => c.status === 'completed' && c.completed_at && new Date(c.completed_at).toDateString() === new Date().toDateString()).length,
    upcomingDeadlines: (upcomingEvents||[]).filter(e => e.type === 'deadline').length || 0,
    newCertificates: progressStats?.certificates || 0,
    studyStreak: progressStats?.streak || 0
  };

  // Show loading state
  if (coursesLoading || progressLoading) {
    return (
      <LMSLayout>
        <div className="space-y-8 animate-fade-in">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-32 rounded-xl bg-gradient-to-r from-muted via-muted/80 to-muted animate-pulse" />
            ))}
          </div>
        </div>
      </LMSLayout>
    );
  }

  return (
    <LMSLayout>
      <div className="space-y-8 animate-fade-in">
        {/* Modern Welcome Section */}
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-solar opacity-30 rounded-3xl" />
          <DashboardWelcome 
            userName={currentUser.name}
            userRole={currentUser.role}
            recentActivity={recentActivity}
          />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Main Content Area */}
          <div className="xl:col-span-2 space-y-8">
            {/* Enhanced Progress Overview */}
            <div className="relative">
              <ProgressStats stats={progressStats || {
                coursesEnrolled: 0,
                coursesCompleted: 0,
                totalProgress: 0,
                weeklyProgress: 0,
                certificates: 0,
                studyTime: "0h",
                streak: 0,
                upcomingDeadlines: 0
              }} />
            </div>

            {/* Modern My Courses Section */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-3xl font-bold text-gradient">My Courses</h2>
                  <p className="text-muted-foreground mt-1">Continue your learning journey</p>
                </div>
                <Button variant="outline" className="btn-glass" asChild>
                  <a href="/courses">View All Courses</a>
                </Button>
              </div>
              <div className="flex items-center justify-between mt-2">
                {enrolledCourses && enrolledCourses.length > 0 && (
                  <Button size="sm" variant="outline" asChild>
                    <a href="/my-training">Go to My Training</a>
                  </Button>
                )}
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-[120px]">
                {coursesError && <div className="col-span-2 p-6 text-sm text-red-500 border rounded-xl">Failed to load courses.</div>}
                {!coursesError && enrolledCourses && enrolledCourses.length === 0 && (
                  <div className="col-span-2 text-center py-12">
                    <p className="text-muted-foreground">No enrolled courses yet.</p>
                    <Button variant="outline" className="mt-4" asChild>
                      <a href="/courses">Browse Courses</a>
                    </Button>
                  </div>
                )}
                {!coursesError && enrolledCourses && enrolledCourses.slice(0,2).map(course => (
                  <div key={course.id} className="interactive-card">
                    <CourseCard
                      course={{
                        id: course.id,
                        title: course.title,
                        description: course.description || '',
                        instructor: course.instructor_name || 'Unknown Instructor',
                        instructorAvatar: '',
                        category: course.category || 'General',
                        duration: course.duration || '—',
                        enrolled: 0,
                        rating: 4.5,
                        progress: course.progress,
                        status: course.status === 'completed' ? 'completed' : (course.status === 'active' ? 'in-progress' : 'not-enrolled'),
                        thumbnail: course.image_url || undefined,
                        level: (course.level as 'Beginner' | 'Intermediate' | 'Advanced') || 'Beginner'
                      }}
                      variant="enrolled"
                    />
                  </div>
                ))}
                {coursesLoading && Array.from({length:2}).map((_,i)=>(
                  <div key={i} className="h-40 rounded-xl bg-muted/40 animate-pulse" />
                ))}
              </div>
            </div>
          </div>

          {/* Modern Sidebar */}
          <div className="space-y-6">
            {/* Elegant Upcoming Events */}
            <div className="card-glass border-white/10 rounded-2xl overflow-hidden">
              <div className="p-6 border-b border-white/10">
                <h3 className="font-semibold text-lg flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Calendar className="h-5 w-5 text-primary" />
                  </div>
                  Upcoming Events
                </h3>
              </div>
              <div className="p-6 space-y-4">
                {eventsError && (
                  <div className="text-center py-8 text-sm text-red-500">Failed to load events.</div>
                )}
                {!eventsError && eventsLoading && (
                  <div className="space-y-3">
                    {Array.from({length:3}).map((_,i)=>(<div key={i} className="h-14 rounded-xl bg-accent/20 animate-pulse" />))}
                  </div>
                )}
                {!eventsError && !eventsLoading && upcomingEvents && upcomingEvents.length > 0 ? (
                  upcomingEvents.map((event) => (
                    <div key={event.id} className="flex items-start gap-4 p-4 rounded-xl bg-accent/20 hover:bg-accent/30 transition-colors">
                      <div className="w-3 h-3 rounded-full bg-gradient-primary mt-2 shadow-glow" />
                      <div className="flex-1">
                        <h4 className="font-medium text-sm leading-relaxed">{event.title}</h4>
                        <p className="text-xs text-muted-foreground mt-1">{event.time}</p>
                        {event.attendees && (
                          <div className="flex items-center gap-1 mt-2">
                            <Users className="h-3 w-3 text-primary" />
                            <span className="text-xs text-primary font-medium">{event.attendees} attending</span>
                          </div>
                        )}
                        {event.course && (
                          <Badge variant="outline" className="text-xs mt-2 bg-accent/50 border-accent">
                            {event.course}
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground text-sm">No upcoming events</p>
                  </div>
                )}
              </div>
            </div>

            {/* Enhanced Recent Discussions */}
            <div className="card-glass border-white/10 rounded-2xl overflow-hidden">
              <div className="p-6 border-b border-white/10">
                <h3 className="font-semibold text-lg flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <MessageSquare className="h-5 w-5 text-primary" />
                  </div>
                  Recent Discussions
                </h3>
              </div>
              <div className="p-6 space-y-4">
                {discussionsError && (
                  <div className="text-center py-8 text-sm text-red-500">Failed to load discussions.</div>
                )}
                {!discussionsError && discussionsLoading && (
                  <div className="space-y-3">
                    {Array.from({length:4}).map((_,i)=>(<div key={i} className="h-20 rounded-xl bg-accent/20 animate-pulse" />))}
                  </div>
                )}
                {!discussionsError && !discussionsLoading && recentDiscussions && recentDiscussions.length > 0 ? (
                  recentDiscussions.map((discussion) => (
                    <div key={discussion.id} className="space-y-3 p-4 rounded-xl hover:bg-accent/20 transition-colors cursor-pointer">
                      <h4 className="font-medium text-sm leading-relaxed">{discussion.title}</h4>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span className="font-medium">by {discussion.author}</span>
                        <div className="flex items-center gap-2">
                          <span>{discussion.replies} replies</span>
                          <span>•</span>
                          <span>{discussion.time}</span>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-xs bg-accent/50 border-accent">
                        {discussion.course}
                      </Badge>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground text-sm">No recent discussions</p>
                  </div>
                )}
                <Button variant="outline" size="sm" className="w-full mt-4 btn-glass" asChild>
                  <a href="/forums">View All Discussions</a>
                </Button>
              </div>
            </div>

            {/* Modern Performance Insights */}
            <div className="card-glass border-white/10 rounded-2xl overflow-hidden">
              <div className="p-6 border-b border-white/10">
                <h3 className="font-semibold text-lg flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-success/10">
                    <TrendingUp className="h-5 w-5 text-success" />
                  </div>
                  This Week's Progress
                </h3>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {progressError && <div className="p-4 rounded-lg bg-accent/20 text-sm text-red-500">Failed to load progress.</div>}
                  {!progressError && progressLoading && (
                    <div className="space-y-3">
                      {Array.from({length:3}).map((_,i)=>(<div key={i} className="h-10 rounded-lg bg-accent/20 animate-pulse" />))}
                    </div>
                  )}
                  {!progressError && !progressLoading && (
                    <>
                      <div className="flex justify-between items-center p-3 rounded-lg bg-accent/20">
                        <span className="text-sm font-medium">Study Time</span>
                        <span className="font-bold text-primary">{progressStats?.studyTime || '0h'}</span>
                      </div>
                      <div className="flex justify-between items-center p-3 rounded-lg bg-accent/20">
                        <span className="text-sm font-medium">Courses Completed</span>
                        <span className="font-bold text-primary">{progressStats?.coursesCompleted || 0}</span>
                      </div>
                      <div className="flex justify-between items-center p-3 rounded-lg bg-accent/20">
                        <span className="text-sm font-medium">Overall Progress</span>
                        <span className="font-bold text-success">{progressStats?.totalProgress || 0}%</span>
                      </div>
                    </>
                  )}
                  <div className="pt-4 border-t border-white/10">
                    <div className="p-4 rounded-xl bg-gradient-primary text-white text-center">
                      <span className="text-2xl">🎉</span>
                      <p className="font-medium mt-2">
                        {progressStats?.totalProgress && progressStats.totalProgress > 50 
                          ? 'Excellent Progress!' 
                          : 'Keep Learning!'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </LMSLayout>
  );
};

export default Index;
