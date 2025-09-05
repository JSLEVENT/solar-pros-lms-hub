import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Award, Clock, Target, CheckCircle } from "lucide-react";

interface ProgressStatsProps {
  stats: {
    coursesEnrolled: number;
    coursesCompleted: number;
    totalProgress: number;
    weeklyProgress: number;
    certificates: number;
    studyTime: string;
    streak: number;
    upcomingDeadlines: number;
  };
  className?: string;
}

export function ProgressStats({ stats, className }: ProgressStatsProps) {
  const completionRate = Math.round((stats.coursesCompleted / stats.coursesEnrolled) * 100) || 0;
  const isProgressUp = stats.weeklyProgress > 0;

  const statCards = [
    {
      title: "Courses Enrolled",
      value: stats.coursesEnrolled,
      icon: Target,
      color: "text-blue-600"
    },
    {
      title: "Completed",
      value: stats.coursesCompleted,
      icon: CheckCircle,
      color: "text-success"
    },
    {
      title: "Certificates",
      value: stats.certificates,
      icon: Award,
      color: "text-primary"
    },
    {
      title: "Study Time",
      value: stats.studyTime,
      icon: Clock,
      color: "text-purple-600"
    }
  ];

  return (
    <div className={className}>
      {/* Main Progress Card */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Learning Progress</CardTitle>
            <Badge variant={isProgressUp ? "default" : "secondary"} className="flex items-center gap-1">
              {isProgressUp ? (
                <TrendingUp className="h-3 w-3" />
              ) : (
                <TrendingDown className="h-3 w-3" />
              )}
              {Math.abs(stats.weeklyProgress)}% this week
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-muted-foreground">Overall Progress</span>
              <span className="font-medium">{stats.totalProgress}%</span>
            </div>
            <Progress value={stats.totalProgress} className="h-3" />
          </div>
          
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-muted-foreground">Completion Rate</span>
              <span className="font-medium">{completionRate}%</span>
            </div>
            <Progress value={completionRate} className="h-3" />
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {statCards.map((stat, index) => (
          <Card key={index}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg bg-background ${stat.color}`}>
                  <stat.icon className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.title}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Learning Streak</p>
                <p className="text-2xl font-bold text-primary">{stats.streak} days</p>
              </div>
              <div className="text-right">
                <Badge variant="outline" className="bg-primary/10">
                  🔥 On Fire!
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Upcoming Deadlines</p>
                <p className="text-2xl font-bold text-warning">{stats.upcomingDeadlines}</p>
              </div>
              <div className="text-right">
                {stats.upcomingDeadlines > 0 && (
                  <Badge variant="outline" className="bg-warning/10">
                    ⏰ Due Soon
                  </Badge>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}