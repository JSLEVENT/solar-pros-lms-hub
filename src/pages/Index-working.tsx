import { LMSLayout } from "@/components/LMSLayout";
import { DashboardWelcome } from "@/components/DashboardWelcome";
import { ProgressStats } from "@/components/ProgressStats";
import { Calendar, MessageSquare, Users, TrendingUp } from "lucide-react";
import { useUserEnrollments } from "@/hooks/useUserEnrollments";
import { useUserProgress } from "@/hooks/useUserProgress";
import { useUpcomingEvents } from "@/hooks/useUpcomingEvents";
import { useRecentDiscussions } from "@/hooks/useRecentDiscussions";
import { useAuth } from "@/hooks/useAuth";

const Index = () => {
  const { profile } = useAuth();
  
  // Real database integrations
  const { data: enrolledCourses, isLoading: coursesLoading } = useUserEnrollments();
  const { data: progressStats, isLoading: progressLoading } = useUserProgress();
  const { data: upcomingEvents, isLoading: eventsLoading } = useUpcomingEvents();
  const { data: recentDiscussions, isLoading: discussionsLoading } = useRecentDiscussions();

  // User data from auth
  const currentUser = {
    name: profile?.full_name || "User",
    role: profile?.role || "learner" as const,
    notificationCount: 3
  };

  // Calculate recent activity from real data
  const recentActivity = {
    coursesInProgress: enrolledCourses?.filter(c => c.status === 'active').length || 0,
    upcomingDeadlines: upcomingEvents?.filter(e => e.type === 'deadline').length || 0,
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
                <a 
                  href="/courses" 
                  className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground h-9 px-4 py-2 btn-glass"
                >
                  View All Courses
                </a>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {enrolledCourses && enrolledCourses.length > 0 ? (
                  enrolledCourses.slice(0, 2).map((course) => (
                    <div key={course.id} className="interactive-card rounded-xl border bg-card text-card-foreground shadow p-6">
                      <div className="space-y-4">
                        <div className="flex items-start justify-between">
                          <h3 className="font-semibold text-lg leading-tight">{course.title}</h3>
                          <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold level-${course.level?.toLowerCase() || 'beginner'}`}>
                            {course.level || 'Beginner'}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {course.description}
                        </p>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">by {course.instructor_name}</span>
                          <span className="font-medium">{course.progress}% complete</span>
                        </div>
                        <div className="w-full bg-secondary rounded-full h-2">
                          <div 
                            className="bg-primary h-2 rounded-full transition-all duration-300" 
                            style={{ width: `${course.progress}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="col-span-2 text-center py-12">
                    <p className="text-muted-foreground">No enrolled courses yet.</p>
                    <a 
                      href="/courses"
                      className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground h-9 px-4 py-2 mt-4"
                    >
                      Browse Courses
                    </a>
                  </div>
                )}
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
                {upcomingEvents && upcomingEvents.length > 0 ? (
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
                          <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 text-foreground bg-accent/50 border-accent mt-2">
                            {event.course}
                          </span>
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
                {recentDiscussions && recentDiscussions.length > 0 ? (
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
                      <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 text-foreground bg-accent/50 border-accent">
                        {discussion.course}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground text-sm">No recent discussions</p>
                  </div>
                )}
                <a 
                  href="/forums" 
                  className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground h-8 px-3 text-xs w-full mt-4 btn-glass"
                >
                  View All Discussions
                </a>
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