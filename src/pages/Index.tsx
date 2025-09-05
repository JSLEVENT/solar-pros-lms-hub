import { LMSLayout } from "@/components/LMSLayout";
import { DashboardWelcome } from "@/components/DashboardWelcome";
import { CourseCard } from "@/components/CourseCard";
import { ProgressStats } from "@/components/ProgressStats";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, MessageSquare, Clock, Users, TrendingUp } from "lucide-react";

const Index = () => {
  // Mock user data - in real app this would come from authentication/database
  const currentUser = {
    name: "Alex Rodriguez",
    role: "learner" as const,
    notificationCount: 3
  };

  // Mock recent activity data
  const recentActivity = {
    coursesInProgress: 3,
    upcomingDeadlines: 2,
    newCertificates: 1,
    studyStreak: 7
  };

  // Mock progress stats
  const progressStats = {
    coursesEnrolled: 5,
    coursesCompleted: 2,
    totalProgress: 68,
    weeklyProgress: 12,
    certificates: 2,
    studyTime: "24h",
    streak: 7,
    upcomingDeadlines: 2
  };

  // Mock course data
  const enrolledCourses = [
    {
      id: "1",
      title: "Solar PV System Design Fundamentals",
      description: "Learn the essential principles of photovoltaic system design, including component selection and energy calculations.",
      instructor: "Dr. Sarah Chen",
      instructorAvatar: "",
      category: "Solar Design",
      duration: "8 weeks",
      enrolled: 1247,
      rating: 4.8,
      progress: 75,
      status: "in-progress" as const,
      level: "Intermediate" as const,
      price: 299
    },
    {
      id: "2",
      title: "Electrical Safety for Solar Installers",
      description: "Critical safety protocols and best practices for working with solar electrical systems.",
      instructor: "Mike Thompson",
      instructorAvatar: "",
      category: "Safety & Compliance",
      duration: "4 weeks",
      enrolled: 2156,
      rating: 4.9,
      progress: 100,
      status: "completed" as const,
      level: "Beginner" as const,
      price: 199
    },
    {
      id: "3",
      title: "Advanced Grid-Tie Inverter Systems",
      description: "Deep dive into grid-tie inverter technology, monitoring, and troubleshooting techniques.",
      instructor: "Jennifer Davis",
      instructorAvatar: "",
      category: "Power Electronics",
      duration: "6 weeks",
      enrolled: 876,
      rating: 4.7,
      progress: 25,
      status: "in-progress" as const,
      level: "Advanced" as const,
      price: 399
    }
  ];

  // Mock upcoming events
  const upcomingEvents = [
    {
      title: "Virtual Lab: PV System Sizing",
      time: "Today, 2:00 PM",
      type: "webinar",
      attendees: 45
    },
    {
      title: "Assignment Due: Safety Assessment",
      time: "Tomorrow, 11:59 PM",
      type: "deadline",
      course: "Electrical Safety"
    },
    {
      title: "Live Q&A with Industry Expert",
      time: "Friday, 1:00 PM",
      type: "event",
      attendees: 120
    }
  ];

  // Mock recent discussions
  const recentDiscussions = [
    {
      title: "Best practices for mounting systems on tile roofs?",
      author: "Emma Wilson",
      replies: 12,
      time: "2 hours ago",
      course: "Installation Techniques"
    },
    {
      title: "New inverter technology discussion",
      author: "Carlos Mendoza", 
      replies: 8,
      time: "4 hours ago",
      course: "Power Electronics"
    },
    {
      title: "Code compliance questions for commercial projects",
      author: "Rachel Kim",
      replies: 15,
      time: "6 hours ago",
      course: "Commercial Solar"
    }
  ];

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
              <ProgressStats stats={progressStats} />
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
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {enrolledCourses.slice(0, 2).map((course) => (
                  <div key={course.id} className="interactive-card">
                    <CourseCard 
                      course={course} 
                      variant="enrolled"
                    />
                  </div>
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
                {upcomingEvents.map((event, index) => (
                  <div key={index} className="flex items-start gap-4 p-4 rounded-xl bg-accent/20 hover:bg-accent/30 transition-colors">
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
                    </div>
                  </div>
                ))}
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
                {recentDiscussions.map((discussion, index) => (
                  <div key={index} className="space-y-3 p-4 rounded-xl hover:bg-accent/20 transition-colors cursor-pointer">
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
                ))}
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
                  <div className="flex justify-between items-center p-3 rounded-lg bg-accent/20">
                    <span className="text-sm font-medium">Study Time</span>
                    <span className="font-bold text-primary">8.5 hrs</span>
                  </div>
                  <div className="flex justify-between items-center p-3 rounded-lg bg-accent/20">
                    <span className="text-sm font-medium">Modules Completed</span>
                    <span className="font-bold text-primary">12</span>
                  </div>
                  <div className="flex justify-between items-center p-3 rounded-lg bg-accent/20">
                    <span className="text-sm font-medium">Quiz Scores</span>
                    <span className="font-bold text-success">92% avg</span>
                  </div>
                  <div className="pt-4 border-t border-white/10">
                    <div className="p-4 rounded-xl bg-gradient-primary text-white text-center">
                      <span className="text-2xl">🎉</span>
                      <p className="font-medium mt-2">Excellent Progress!</p>
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
