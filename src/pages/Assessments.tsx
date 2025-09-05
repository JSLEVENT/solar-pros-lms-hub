import { useState, useEffect } from 'react';
import { LMSLayout } from '@/components/LMSLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Search, BookOpen, Clock, Award, FileText, CheckCircle, XCircle, AlertCircle, Play, History } from 'lucide-react';

interface Assessment {
  id: string;
  title: string;
  description: string;
  type: string;
  passing_score: number;
  time_limit_minutes?: number;
  max_attempts: number;
  courses: {
    title: string;
    category: string;
  };
  assessment_results: {
    id: string;
    score: number;
    passed: boolean;
    completed_at: string;
    attempt_number: number;
  }[];
  user_attempts?: number;
  best_score?: number;
  latest_result?: any;
}

export default function Assessments() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    if (user) {
      fetchAssessments();
    }
  }, [user]);

  const fetchAssessments = async () => {
    try {
      // Get assessments for courses the user is enrolled in
      const { data: enrollments } = await supabase
        .from('enrollments')
        .select('course_id')
        .eq('user_id', user?.id);

      const courseIds = enrollments?.map(e => e.course_id) || [];

      const { data, error } = await supabase
        .from('assessments')
        .select(`
          *,
          courses (
            title,
            category
          ),
          assessment_results!left (
            id,
            score,
            passed,
            completed_at,
            attempt_number
          )
        `)
        .in('course_id', courseIds)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Process assessments to add user-specific data
      const processedAssessments = (data || []).map(assessment => {
        const userResults = assessment.assessment_results?.filter(
          result => result.id // This would need user_id filtering in a real app
        ) || [];

        const userAttempts = userResults.length;
        const bestScore = userResults.length > 0 ? Math.max(...userResults.map(r => r.score)) : 0;
        const latestResult = userResults.sort((a, b) => 
          new Date(b.completed_at).getTime() - new Date(a.completed_at).getTime()
        )[0];

        return {
          ...assessment,
          user_attempts: userAttempts,
          best_score: bestScore,
          latest_result: latestResult
        };
      });

      setAssessments(processedAssessments);
    } catch (error) {
      console.error('Error fetching assessments:', error);
      toast({
        title: 'Error',
        description: 'Failed to load assessments',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const getAssessmentStatus = (assessment: Assessment) => {
    if (assessment.user_attempts === 0) return 'not_started';
    if (assessment.latest_result?.passed) return 'passed';
    if (assessment.user_attempts >= assessment.max_attempts) return 'failed';
    return 'in_progress';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'passed': return <CheckCircle className="h-4 w-4 text-success" />;
      case 'failed': return <XCircle className="h-4 w-4 text-destructive" />;
      case 'in_progress': return <AlertCircle className="h-4 w-4 text-warning" />;
      default: return <Play className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'passed': return 'bg-success text-success-foreground';
      case 'failed': return 'bg-destructive text-destructive-foreground';
      case 'in_progress': return 'bg-warning text-warning-foreground';
      default: return 'bg-secondary text-secondary-foreground';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'quiz': return <FileText className="h-4 w-4" />;
      case 'exam': return <BookOpen className="h-4 w-4" />;
      case 'assignment': return <Award className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const filteredAssessments = assessments.filter((assessment) => {
    const matchesSearch = assessment.title
      .toLowerCase()
      .includes(searchTerm.toLowerCase()) ||
      assessment.courses.title
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
    
    const matchesType = typeFilter === 'all' || assessment.type === typeFilter;
    
    const status = getAssessmentStatus(assessment);
    const matchesStatus = statusFilter === 'all' || status === statusFilter;
    
    return matchesSearch && matchesType && matchesStatus;
  });

  const groupedAssessments = {
    not_started: filteredAssessments.filter(a => getAssessmentStatus(a) === 'not_started'),
    in_progress: filteredAssessments.filter(a => getAssessmentStatus(a) === 'in_progress'),
    passed: filteredAssessments.filter(a => getAssessmentStatus(a) === 'passed'),
    failed: filteredAssessments.filter(a => getAssessmentStatus(a) === 'failed'),
    all: filteredAssessments
  };

  const types = [...new Set(assessments.map(a => a.type))];

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
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold">Assessments</h1>
            <p className="text-muted-foreground">
              Take quizzes, exams, and complete assignments to test your knowledge
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline">
              {assessments.length} Total Assessments
            </Badge>
            <Badge className="bg-success text-success-foreground">
              {groupedAssessments.passed.length} Passed
            </Badge>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col gap-4 md:flex-row md:items-center">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search assessments..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-[120px]">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    {types.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="not_started">Not Started</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="passed">Passed</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Assessment Tabs */}
        <Tabs defaultValue="all" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="all">
              All ({groupedAssessments.all.length})
            </TabsTrigger>
            <TabsTrigger value="not_started">
              New ({groupedAssessments.not_started.length})
            </TabsTrigger>
            <TabsTrigger value="in_progress">
              In Progress ({groupedAssessments.in_progress.length})
            </TabsTrigger>
            <TabsTrigger value="passed">
              Passed ({groupedAssessments.passed.length})
            </TabsTrigger>
            <TabsTrigger value="failed">
              Failed ({groupedAssessments.failed.length})
            </TabsTrigger>
          </TabsList>

          {(['all', 'not_started', 'in_progress', 'passed', 'failed'] as const).map((tabValue) => (
            <TabsContent key={tabValue} value={tabValue} className="space-y-4">
              {groupedAssessments[tabValue].length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No assessments found</h3>
                    <p className="text-muted-foreground text-center">
                      {tabValue === 'all' 
                        ? "No assessments available yet." 
                        : `No ${tabValue.replace('_', ' ')} assessments found.`}
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {groupedAssessments[tabValue].map((assessment) => {
                    const status = getAssessmentStatus(assessment);
                    return (
                      <Card key={assessment.id} className="hover:shadow-md transition-shadow">
                        <CardContent className="p-6">
                          <div className="flex items-start gap-4">
                            {/* Icon */}
                            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                              {getTypeIcon(assessment.type)}
                            </div>

                            {/* Content */}
                            <div className="flex-1 space-y-3">
                              <div className="flex items-start justify-between">
                                <div>
                                  <h3 className="font-semibold text-lg">{assessment.title}</h3>
                                  <p className="text-sm text-muted-foreground">
                                    {assessment.courses.title} • {assessment.courses.category}
                                  </p>
                                </div>
                                <Badge className={getStatusColor(status)}>
                                  <div className="flex items-center gap-1">
                                    {getStatusIcon(status)}
                                    <span className="capitalize">{status.replace('_', ' ')}</span>
                                  </div>
                                </Badge>
                              </div>

                              {assessment.description && (
                                <p className="text-sm text-muted-foreground">
                                  {assessment.description}
                                </p>
                              )}

                              <div className="flex items-center gap-6 text-sm text-muted-foreground">
                                <div className="flex items-center gap-1">
                                  <FileText className="h-3 w-3" />
                                  <span>{assessment.type.charAt(0).toUpperCase() + assessment.type.slice(1)}</span>
                                </div>
                                {assessment.time_limit_minutes && (
                                  <div className="flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    <span>{assessment.time_limit_minutes} min</span>
                                  </div>
                                )}
                                <div className="flex items-center gap-1">
                                  <Award className="h-3 w-3" />
                                  <span>Pass: {assessment.passing_score}%</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <History className="h-3 w-3" />
                                  <span>{assessment.user_attempts}/{assessment.max_attempts} attempts</span>
                                </div>
                              </div>

                              {assessment.user_attempts > 0 && (
                                <div className="space-y-2">
                                  <div className="flex justify-between text-sm">
                                    <span>Best Score</span>
                                    <span className={`font-medium ${
                                      assessment.best_score >= assessment.passing_score 
                                        ? 'text-success' 
                                        : 'text-destructive'
                                    }`}>
                                      {assessment.best_score.toFixed(1)}%
                                    </span>
                                  </div>
                                  <Progress value={assessment.best_score} className="h-2" />
                                </div>
                              )}
                            </div>

                            {/* Actions */}
                            <div className="flex flex-col gap-2">
                              {status === 'not_started' && (
                                <Button>
                                  Start Assessment
                                </Button>
                              )}
                              {status === 'in_progress' && (
                                <Button>
                                  Continue
                                </Button>
                              )}
                              {status === 'failed' && assessment.user_attempts < assessment.max_attempts && (
                                <Button variant="outline">
                                  Retake
                                </Button>
                              )}
                              {status === 'passed' && (
                                <Button variant="secondary" disabled>
                                  <CheckCircle className="h-4 w-4 mr-2" />
                                  Completed
                                </Button>
                              )}
                              {assessment.user_attempts > 0 && (
                                <Button variant="ghost" size="sm">
                                  View Results
                                </Button>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </LMSLayout>
  );
}