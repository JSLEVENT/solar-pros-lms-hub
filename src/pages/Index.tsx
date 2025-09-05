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
      <div className="space-y-8">
        {/* Welcome Section */}
        <DashboardWelcome 
          userName={currentUser.name}
          userRole={currentUser.role}
          recentActivity={recentActivity}
        />

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Main Content Area */}
          <div className="xl:col-span-2 space-y-8">
            {/* Progress Overview */}
            <ProgressStats stats={progressStats} />

            {/* My Courses */}
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">My Courses</h2>
                <Button variant="outline" asChild>
                  <a href="/courses">View All</a>
                </Button>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {enrolledCourses.slice(0, 2).map((course) => (
                  <CourseCard 
                    key={course.id} 
                    course={course} 
                    variant="enrolled"
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Upcoming Events */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Upcoming Events
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {upcomingEvents.map((event, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-secondary/50">
                    <div className="w-2 h-2 rounded-full bg-primary mt-2" />
                    <div className="flex-1">
                      <h4 className="font-medium text-sm">{event.title}</h4>
                      <p className="text-xs text-muted-foreground">{event.time}</p>
                      {event.attendees && (
                        <div className="flex items-center gap-1 mt-1">
                          <Users className="h-3 w-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">{event.attendees} attending</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Recent Discussions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Recent Discussions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {recentDiscussions.map((discussion, index) => (
                  <div key={index} className="space-y-2">
                    <h4 className="font-medium text-sm leading-tight">{discussion.title}</h4>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>by {discussion.author}</span>
                      <div className="flex items-center gap-2">
                        <span>{discussion.replies} replies</span>
                        <span>•</span>
                        <span>{discussion.time}</span>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {discussion.course}
                    </Badge>
                  </div>
                ))}
                <Button variant="outline" size="sm" className="w-full mt-4" asChild>
                  <a href="/forums">View All Discussions</a>
                </Button>
              </CardContent>
            </Card>

            {/* Performance Insights */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  This Week's Progress
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Study Time</span>
                    <span className="font-medium">8.5 hrs</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Modules Completed</span>
                    <span className="font-medium">12</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Quiz Scores</span>
                    <span className="font-medium">92% avg</span>
                  </div>
                  <div className="pt-2 border-t">
                    <Badge className="w-full justify-center bg-success text-success-foreground">
                      🎉 Excellent Progress!
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </LMSLayout>
  );
};

export default Index;
