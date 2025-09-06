import { useState, useEffect, useMemo } from 'react';
import { LMSLayout } from '@/components/LMSLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { BookOpen, Clock, Award, TrendingUp, Calendar, Target, CheckCircle, Users } from 'lucide-react';

interface ProgressData {
  enrollments: any[];
  assessmentResults: any[];
  certificates: any[];
  totalStudyTime: number;
  currentStreak: number;
  weeklyGoal: number;
  categoryProgress: any[];
  studyTimeEntries?: any[];
}

export default function MyProgress() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [progressData, setProgressData] = useState<ProgressData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('7d');

  useEffect(() => {
    if (user) {
      fetchProgressData();
    }
  }, [user, timeRange]);

  const fetchProgressData = async () => {
    try {
      const now = new Date();
      const rangeDays: Record<string, number> = { '7d':7, '30d':30, '90d':90, '1y':365 };
      const days = rangeDays[timeRange] || 30;
      const start = new Date(now.getTime() - days*24*60*60*1000).toISOString();
      const [enrollmentsRes, assessmentsRes, certificatesRes] = await Promise.all([
        supabase
          .from('enrollments')
          .select(`
            *,
            courses (
              title,
              category,
              duration
            )
          `)
          .eq('user_id', user?.id)
          .gte('created_at', start),
        
        supabase
          .from('assessment_results')
          .select(`
            *,
            assessments (
              title,
              type,
              courses (
                title,
                category
              )
            )
          `)
          .eq('user_id', user?.id)
          .gte('completed_at', start)
          .order('completed_at', { ascending: false }),
        
        supabase
          .from('certificates')
          .select(`
            *,
            courses (
              title,
              category
            )
          `)
          .eq('user_id', user?.id)
          .gte('issued_at', start)
      ]);

      if (enrollmentsRes.error) throw enrollmentsRes.error;
      if (assessmentsRes.error) throw assessmentsRes.error;
      if (certificatesRes.error) throw certificatesRes.error;

      const enrollments = enrollmentsRes.data || [];
      const assessmentResults = assessmentsRes.data || [];
      const certificates = certificatesRes.data || [];

      // Calculate category progress
      const categoryStats = enrollments.reduce((acc, enrollment) => {
        const category = enrollment.courses.category;
        if (!acc[category]) {
          acc[category] = { completed: 0, total: 0, avgProgress: 0 };
        }
        acc[category].total += 1;
        if (enrollment.status === 'completed') {
          acc[category].completed += 1;
        }
        acc[category].avgProgress += enrollment.progress;
        return acc;
      }, {} as any);

      const categoryProgress = Object.entries(categoryStats).map(([category, stats]: [string, any]) => ({
        category,
        completed: stats.completed,
        total: stats.total,
        avgProgress: Math.round(stats.avgProgress / stats.total),
        completionRate: Math.round((stats.completed / stats.total) * 100)
      }));

      let studyTimeEntries: any[] | undefined;
      try {
        // Cast supabase to any to attempt querying optional table without type error if not generated
        const stRes = await (supabase as any)
          .from('study_time_entries')
          .select('*')
          .eq('user_id', user?.id)
          .gte('started_at', start);
        if (!stRes.error) studyTimeEntries = stRes.data || [];
      } catch {}

      setProgressData({
        enrollments,
        assessmentResults,
        certificates,
        totalStudyTime: 156,
        currentStreak: 7,
        weeklyGoal: 10,
        categoryProgress,
        studyTimeEntries
      });
    } catch (error) {
      console.error('Error fetching progress data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load progress data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
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

  if (!progressData) {
    return (
      <LMSLayout>
        <div className="text-center py-12">
          <p>No progress data available</p>
        </div>
      </LMSLayout>
    );
  }

  const completedCourses = progressData.enrollments.filter(e => e.status === 'completed').length;
  const activeCourses = progressData.enrollments.filter(e => e.status === 'active').length;
  const averageProgress = Math.round(
    progressData.enrollments.reduce((sum, e) => sum + e.progress, 0) / progressData.enrollments.length
  );
  const averageScore = progressData.assessmentResults.length > 0 
    ? Math.round(progressData.assessmentResults.reduce((sum, r) => sum + r.score, 0) / progressData.assessmentResults.length)
    : 0;

  const COLORS = ['#DC2626', '#EA580C', '#D97706', '#CA8A04', '#65A30D'];

  const monthlyStats = useMemo(() => {
    if (!progressData) return [];
    const monthKey = (d: Date) => `${d.getFullYear()}-${d.getMonth()}`;
    const label = (d: Date) => d.toLocaleString(undefined, { month: 'short' });
    const buckets: Record<string, { date: Date; coursesCompleted: number; scoreSum: number; scoreCount: number; minutes: number; }> = {};
    const ensure = (d: Date) => {
      const k = monthKey(d);
      if (!buckets[k]) buckets[k] = { date: new Date(d.getFullYear(), d.getMonth(), 1), coursesCompleted: 0, scoreSum: 0, scoreCount: 0, minutes: 0 };
      return buckets[k];
    };
    progressData.enrollments.forEach(e => {
      if (e.status === 'completed') {
        const ds = e.completed_at || e.updated_at || e.created_at; if (!ds) return;
        const d = new Date(ds); ensure(d).coursesCompleted += 1;
      }
    });
    progressData.assessmentResults.forEach(r => {
      const ds = r.completed_at || r.created_at; if (!ds) return;
      const d = new Date(ds); const b = ensure(d); b.scoreSum += r.score || 0; b.scoreCount += 1;
    });
    progressData.studyTimeEntries?.forEach(s => {
      const ds = s.started_at || s.created_at; if (!ds) return;
      const d = new Date(ds); const b = ensure(d);
      if (typeof s.duration_minutes === 'number') b.minutes += s.duration_minutes;
      else if (typeof s.duration_seconds === 'number') b.minutes += s.duration_seconds / 60;
    });
    const rangeDays: Record<string, number> = { '7d':7, '30d':30, '90d':90, '1y':365 };
    const days = rangeDays[timeRange] || 30;
    const cutoff = new Date(Date.now() - days*24*60*60*1000);
    return Object.values(buckets)
      .filter(b => b.date >= new Date(cutoff.getFullYear(), cutoff.getMonth(), 1))
      .sort((a,b) => a.date.getTime() - b.date.getTime())
      .map(b => ({
        month: label(b.date),
        coursesCompleted: b.coursesCompleted,
        avgScore: b.scoreCount ? Math.round(b.scoreSum / b.scoreCount) : 0,
        studyHours: Math.round((b.minutes/60)*10)/10,
      }));
  }, [progressData, timeRange]);

  const categoryProgressMemo = useMemo(() => progressData?.categoryProgress || [], [progressData]);

  return (
    <LMSLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold">My Progress</h1>
            <p className="text-muted-foreground">
              Track your learning journey and achievements
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline">
              {progressData.enrollments.length} Courses Enrolled
            </Badge>
            <Badge className="bg-success text-success-foreground">
              {completedCourses} Completed
            </Badge>
          </div>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <BookOpen className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Active Courses</p>
                  <p className="text-2xl font-bold">{activeCourses}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-success/10 flex items-center justify-center">
                  <CheckCircle className="h-6 w-6 text-success" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Completed</p>
                  <p className="text-2xl font-bold">{completedCourses}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-warning/10 flex items-center justify-center">
                  <Award className="h-6 w-6 text-warning" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Avg Score</p>
                  <p className="text-2xl font-bold">{averageScore}%</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center">
                  <Clock className="h-6 w-6 text-accent" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Study Time</p>
                  <p className="text-2xl font-bold">{progressData.totalStudyTime}h</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        {/* Time range toggle */}
        <div className="flex flex-wrap gap-2">
          {['7d','30d','90d','1y'].map(r => (
            <Button key={r} size="sm" variant={timeRange === r ? 'default' : 'outline'} onClick={() => setTimeRange(r)}>{r.toUpperCase()}</Button>
          ))}
        </div>
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="courses">Course Progress</TabsTrigger>
            <TabsTrigger value="assessments">Assessment History</TabsTrigger>
            <TabsTrigger value="achievements">Achievements</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Monthly Progress Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>Monthly Progress</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={monthlyStats}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Line 
                        type="monotone" 
                        dataKey="coursesCompleted" 
                        stroke="#DC2626" 
                        strokeWidth={2}
                        name="Courses Completed"
                      />
                      <Line 
                        type="monotone" 
                        dataKey="avgScore" 
                        stroke="#EA580C" 
                        strokeWidth={2}
                        name="Average Score"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Category Progress */}
              <Card>
                <CardHeader>
                  <CardTitle>Progress by Category</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={categoryProgressMemo}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ category, completionRate }) => `${category}: ${completionRate}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="completionRate"
                      >
                        {categoryProgressMemo.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Study Streak & Goals */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Study Streak
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center space-y-4">
                    <div>
                      <p className="text-4xl font-bold text-primary">{progressData.currentStreak}</p>
                      <p className="text-muted-foreground">Days in a row</p>
                    </div>
                    <Progress value={(progressData.currentStreak / 30) * 100} className="h-3" />
                    <p className="text-sm text-muted-foreground">
                      Keep it up! Your longest streak was 15 days.
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    Weekly Goal
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span>Study Hours</span>
                      <span className="font-medium">8 / {progressData.weeklyGoal}h</span>
                    </div>
                    <Progress value={(8 / progressData.weeklyGoal) * 100} className="h-3" />
                    <p className="text-sm text-muted-foreground">
                      {progressData.weeklyGoal - 8} hours left to reach your weekly goal
                    </p>
                    <Button variant="outline" size="sm" className="w-full">
                      Adjust Goal
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="courses" className="space-y-6">
            <div className="space-y-4">
              {progressData.enrollments.map((enrollment) => (
                <Card key={enrollment.id}>
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <BookOpen className="h-6 w-6 text-primary" />
                      </div>
                      <div className="flex-1 space-y-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-semibold">{enrollment.courses.title}</h3>
                            <p className="text-sm text-muted-foreground">
                              {enrollment.courses.category} • {enrollment.courses.duration}
                            </p>
                          </div>
                          <Badge variant={enrollment.status === 'completed' ? 'default' : 'secondary'}>
                            {enrollment.status}
                          </Badge>
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Progress</span>
                            <span>{enrollment.progress}%</span>
                          </div>
                          <Progress value={enrollment.progress} className="h-2" />
                        </div>
                        <div className="flex items-center gap-2">
                          <Button size="sm">Continue Learning</Button>
                          <Button variant="outline" size="sm">View Details</Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="assessments" className="space-y-6">
            <div className="space-y-4">
              {progressData.assessmentResults.map((result) => (
                <Card key={result.id}>
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-lg bg-warning/10 flex items-center justify-center flex-shrink-0">
                        <Award className="h-6 w-6 text-warning" />
                      </div>
                      <div className="flex-1 space-y-2">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-semibold">{result.assessments.title}</h3>
                            <p className="text-sm text-muted-foreground">
                              {result.assessments.courses.title} • {result.assessments.type}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className={`text-lg font-bold ${
                              result.passed ? 'text-success' : 'text-destructive'
                            }`}>
                              {result.score.toFixed(1)}%
                            </p>
                            <Badge variant={result.passed ? 'default' : 'destructive'}>
                              {result.passed ? 'Passed' : 'Failed'}
                            </Badge>
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Completed on {new Date(result.completed_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="achievements" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {progressData.certificates.map((certificate) => (
                <Card key={certificate.id}>
                  <CardContent className="p-6 text-center">
                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                      <Award className="h-8 w-8 text-primary" />
                    </div>
                    <h3 className="font-semibold mb-2">{certificate.courses.title}</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Earned on {new Date(certificate.issued_at).toLocaleDateString()}
                    </p>
                    <Button variant="outline" size="sm">
                      View Certificate
                    </Button>
                  </CardContent>
                </Card>
              ))}
              
              {/* Achievement Badges */}
              <Card>
                <CardContent className="p-6 text-center">
                  <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-4">
                    <TrendingUp className="h-8 w-8 text-success" />
                  </div>
                  <h3 className="font-semibold mb-2">First Course Complete</h3>
                  <p className="text-sm text-muted-foreground">
                    Completed your first course
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6 text-center">
                  <div className="w-16 h-16 rounded-full bg-warning/10 flex items-center justify-center mx-auto mb-4">
                    <Users className="h-8 w-8 text-warning" />
                  </div>
                  <h3 className="font-semibold mb-2">Active Learner</h3>
                  <p className="text-sm text-muted-foreground">
                    7-day study streak
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </LMSLayout>
  );
}