import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, BookOpen, Trophy, Clock } from "lucide-react";

interface DashboardWelcomeProps {
  userName: string;
  userRole: 'learner' | 'instructor' | 'admin';
  recentActivity: {
    coursesInProgress: number;
    upcomingDeadlines: number;
    newCertificates: number;
    studyStreak: number;
  };
}

export function DashboardWelcome({ userName, userRole, recentActivity }: DashboardWelcomeProps) {
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  const getRoleSpecificMessage = () => {
    switch (userRole) {
      case 'admin':
        return "Manage your Solar Pros LMS platform and monitor learning progress across the organization.";
      case 'instructor':
        return "Create engaging solar energy courses and guide learners on their certification journey.";
      default:
        return "Continue your solar energy certification journey and master industry best practices.";
    }
  };

  const quickActions = userRole === 'admin' 
    ? [
        { label: "Manage Users", href: "/admin/users", variant: "default" as const },
        { label: "Course Analytics", href: "/admin/analytics", variant: "outline" as const },
        { label: "System Settings", href: "/admin/settings", variant: "outline" as const },
      ]
    : userRole === 'instructor'
    ? [
        { label: "Create Course", href: "/admin/content", variant: "default" as const },
        { label: "Grade Assessments", href: "/assessments", variant: "outline" as const },
        { label: "Student Progress", href: "/admin/analytics", variant: "outline" as const },
      ]
    : [
        { label: "Browse Courses", href: "/catalog", variant: "default" as const },
        { label: "Take Assessment", href: "/assessments", variant: "outline" as const },
        { label: "View Progress", href: "/progress", variant: "outline" as const },
      ];

  return (
    <Card className="relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-primary/10" />
      <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-primary/20 to-transparent rounded-full translate-x-32 -translate-y-32" />
      
      <CardContent className="relative p-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-4">
              <h1 className="text-3xl font-bold text-foreground">
                {getGreeting()}, {userName}!
              </h1>
              <Badge className="bg-primary text-primary-foreground">
                {userRole.charAt(0).toUpperCase() + userRole.slice(1)}
              </Badge>
            </div>
            
            <p className="text-lg text-muted-foreground mb-6 max-w-2xl">
              {getRoleSpecificMessage()}
            </p>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-background/50 backdrop-blur">
                <BookOpen className="h-8 w-8 text-primary" />
                <div>
                  <p className="text-2xl font-bold">{recentActivity.coursesInProgress}</p>
                  <p className="text-sm text-muted-foreground">Active Courses</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-3 rounded-lg bg-background/50 backdrop-blur">
                <Calendar className="h-8 w-8 text-warning" />
                <div>
                  <p className="text-2xl font-bold">{recentActivity.upcomingDeadlines}</p>
                  <p className="text-sm text-muted-foreground">Due Soon</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-3 rounded-lg bg-background/50 backdrop-blur">
                <Trophy className="h-8 w-8 text-success" />
                <div>
                  <p className="text-2xl font-bold">{recentActivity.newCertificates}</p>
                  <p className="text-sm text-muted-foreground">Certificates</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-3 rounded-lg bg-background/50 backdrop-blur">
                <Clock className="h-8 w-8 text-primary" />
                <div>
                  <p className="text-2xl font-bold">{recentActivity.studyStreak}</p>
                  <p className="text-sm text-muted-foreground">Day Streak</p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-col gap-3 lg:items-end">
            <h3 className="font-semibold text-foreground mb-2">Quick Actions</h3>
            <div className="flex flex-col gap-2 w-full lg:w-auto">
              {quickActions.map((action, index) => (
                <Button 
                  key={index}
                  variant={action.variant}
                  className="w-full lg:w-auto lg:min-w-[160px]"
                  asChild
                >
                  <a href={action.href}>{action.label}</a>
                </Button>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}