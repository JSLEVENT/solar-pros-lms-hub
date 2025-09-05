import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { LMSLayout } from "@/components/LMSLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { BookOpen, FileText, Award, Clock, PlayCircle, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface LearningPlan {
  id: string;
  title: string;
  description: string;
  status: string;
  progress: number;
  total_modules: number;
  completed_modules: number;
  due_date: string | null;
}

interface Course {
  id: string;
  title: string;
  description: string;
  status: string;
  progress: number;
  instructor: string;
  duration: number;
  level: string;
}

interface Assessment {
  id: string;
  title: string;
  description: string;
  status: string;
  score: number | null;
  passing_score: number;
  attempts: number;
  max_attempts: number;
  due_date: string | null;
}

const MyTraining = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [learningPlans, setLearningPlans] = useState<LearningPlan[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [assessments, setAssessments] = useState<Assessment[]>([]);

  useEffect(() => {
    if (user) {
      fetchTrainingData();
    }
  }, [user]);

  const fetchTrainingData = async () => {
    try {
      setLoading(true);
      
      // Mock learning plans data since the table doesn't exist yet
      const plansData: LearningPlan[] = [
        {
          id: '1',
          title: 'Solar Sales Fundamentals',
          description: 'Complete training program for solar sales basics',
          status: 'in_progress',
          progress: 65,
          total_modules: 8,
          completed_modules: 5,
          due_date: '2024-12-31'
        }
      ];
      
      // Fetch enrolled courses
      const { data: enrollmentsData } = await supabase
        .from('enrollments')
        .select(`
          *,
          courses (
            id,
            title,
            description,
            level
          )
        `)
        .eq('user_id', user?.id);

      // Fetch assessments
      const { data: assessmentsData } = await supabase
        .from('assessments')
        .select('*');

      // Transform assessments to match our interface
      const transformedAssessments: Assessment[] = assessmentsData?.map(assessment => ({
        id: assessment.id,
        title: assessment.title,
        description: assessment.description,
        status: 'not_started', // Mock status
        score: null,
        passing_score: assessment.passing_score,
        attempts: 0,
        max_attempts: assessment.max_attempts,
        due_date: null
      })) || [];

      setLearningPlans(plansData || []);
      setCourses(enrollmentsData?.map(enrollment => ({
        id: enrollment.courses.id,
        title: enrollment.courses.title,
        description: enrollment.courses.description,
        status: enrollment.status,
        progress: enrollment.progress,
        instructor: 'Instructor', // Mock instructor name
        duration: 120, // Mock duration
        level: enrollment.courses.level
      })) || []);
      setAssessments(transformedAssessments);
    } catch (error) {
      console.error('Error fetching training data:', error);
      toast({
        title: "Error",
        description: "Failed to load training data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'not_started': return 'bg-gray-100 text-gray-800';
      case 'overdue': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

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
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Training</h1>
          <p className="text-muted-foreground">
            Access all your assigned learning content, courses, and assessments
          </p>
        </div>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="courses">Courses</TabsTrigger>
            <TabsTrigger value="plans">Learning Plans</TabsTrigger>
            <TabsTrigger value="assessments">Assessments</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Courses</CardTitle>
                  <BookOpen className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{courses.filter(c => c.status === 'in_progress').length}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Learning Plans</CardTitle>
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{learningPlans.length}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Pending Assessments</CardTitle>
                  <Award className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{assessments.filter(a => a.status === 'not_started').length}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Avg Progress</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {courses.length > 0 ? Math.round(courses.reduce((acc, c) => acc + c.progress, 0) / courses.length) : 0}%
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {courses.slice(0, 3).map((course) => (
                      <div key={course.id} className="flex items-center space-x-4">
                        <PlayCircle className="h-4 w-4 text-muted-foreground" />
                        <div className="flex-1 space-y-1">
                          <p className="text-sm font-medium">{course.title}</p>
                          <Progress value={course.progress} className="h-2" />
                        </div>
                        <Badge className={getStatusColor(course.status)}>
                          {course.status.replace('_', ' ')}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Upcoming Deadlines</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {assessments.filter(a => a.due_date).slice(0, 3).map((assessment) => (
                      <div key={assessment.id} className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium">{assessment.title}</p>
                          <p className="text-xs text-muted-foreground">
                            Due: {assessment.due_date ? new Date(assessment.due_date).toLocaleDateString() : 'No deadline'}
                          </p>
                        </div>
                        <Badge className={getStatusColor(assessment.status)}>
                          {assessment.status.replace('_', ' ')}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="courses" className="space-y-4">
            <div className="grid gap-4">
              {courses.map((course) => (
                <Card key={course.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>{course.title}</CardTitle>
                        <CardDescription>{course.description}</CardDescription>
                      </div>
                      <Badge className={getStatusColor(course.status)}>
                        {course.status.replace('_', ' ')}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <span>Progress: {course.progress}%</span>
                        <span>Instructor: {course.instructor}</span>
                        <span>Level: {course.level}</span>
                      </div>
                      <Progress value={course.progress} className="h-2" />
                      <div className="flex justify-between">
                        <Button variant="outline" size="sm">
                          <BookOpen className="h-4 w-4 mr-2" />
                          View Course
                        </Button>
                        <Button size="sm">
                          <PlayCircle className="h-4 w-4 mr-2" />
                          Continue Learning
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="plans" className="space-y-4">
            <div className="grid gap-4">
              {learningPlans.map((plan) => (
                <Card key={plan.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>{plan.title}</CardTitle>
                        <CardDescription>{plan.description}</CardDescription>
                      </div>
                      <Badge className={getStatusColor(plan.status)}>
                        {plan.status.replace('_', ' ')}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <span>{plan.completed_modules} of {plan.total_modules} modules completed</span>
                        {plan.due_date && <span>Due: {new Date(plan.due_date).toLocaleDateString()}</span>}
                      </div>
                      <Progress value={plan.progress} className="h-2" />
                      <Button size="sm">
                        <FileText className="h-4 w-4 mr-2" />
                        View Learning Plan
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="assessments" className="space-y-4">
            <div className="grid gap-4">
              {assessments.map((assessment) => (
                <Card key={assessment.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>{assessment.title}</CardTitle>
                        <CardDescription>{assessment.description}</CardDescription>
                      </div>
                      <Badge className={getStatusColor(assessment.status)}>
                        {assessment.status.replace('_', ' ')}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Score: </span>
                          <span>{assessment.score ? `${assessment.score}%` : 'Not taken'}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Passing Score: </span>
                          <span>{assessment.passing_score}%</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Attempts: </span>
                          <span>{assessment.attempts} of {assessment.max_attempts}</span>
                        </div>
                        {assessment.due_date && (
                          <div>
                            <span className="text-muted-foreground">Due: </span>
                            <span>{new Date(assessment.due_date).toLocaleDateString()}</span>
                          </div>
                        )}
                      </div>
                      <Button size="sm">
                        <Award className="h-4 w-4 mr-2" />
                        {assessment.status === 'not_started' ? 'Start Assessment' : 'Retake Assessment'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </LMSLayout>
  );
};

export default MyTraining;