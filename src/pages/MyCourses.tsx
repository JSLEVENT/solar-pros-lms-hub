import { useState, useEffect } from 'react';
import { LMSLayout } from '@/components/LMSLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { CourseCard } from '@/components/CourseCard';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Search, Filter, BookOpen, Clock, Award, Play, Pause, RotateCcw } from 'lucide-react';

interface Enrollment {
  id: string;
  progress: number;
  status: string;
  enrolled_at: string;
  completed_at?: string;
  courses: {
    id: string;
    title: string;
    description: string;
    category: string;
    level: string;
    duration: string;
    image_url?: string;
    instructor_id: string;
    profiles: {
      full_name: string;
    };
  };
}

export default function MyCourses() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');

  useEffect(() => {
    if (user) {
      fetchEnrollments();
    }
  }, [user]);

  const fetchEnrollments = async () => {
    try {
      const { data, error } = await supabase
        .from('enrollments')
        .select(`
          *,
          courses (
            *,
            profiles:instructor_id (
              full_name
            )
          )
        `)
        .eq('user_id', user?.id)
        .order('enrolled_at', { ascending: false });

      if (error) {
        throw error;
      }

      setEnrollments(data || []);
    } catch (error) {
      console.error('Error fetching enrollments:', error);
      toast({
        title: 'Error',
        description: 'Failed to load your courses',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (enrollmentId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('enrollments')
        .update({ 
          status: newStatus,
          completed_at: newStatus === 'completed' ? new Date().toISOString() : null
        })
        .eq('id', enrollmentId);

      if (error) throw error;

      await fetchEnrollments();
      toast({
        title: 'Success',
        description: `Course status updated to ${newStatus}`,
      });
    } catch (error) {
      console.error('Error updating status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update course status',
        variant: 'destructive',
      });
    }
  };

  const filteredEnrollments = enrollments.filter((enrollment) => {
    const matchesSearch = enrollment.courses.title
      .toLowerCase()
      .includes(searchTerm.toLowerCase()) ||
      enrollment.courses.description
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || enrollment.status === statusFilter;
    const matchesCategory = categoryFilter === 'all' || enrollment.courses.category === categoryFilter;
    
    return matchesSearch && matchesStatus && matchesCategory;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <Play className="h-4 w-4" />;
      case 'paused': return <Pause className="h-4 w-4" />;
      case 'completed': return <Award className="h-4 w-4" />;
      default: return <RotateCcw className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-success';
      case 'paused': return 'bg-warning';
      case 'completed': return 'bg-primary';
      default: return 'bg-secondary';
    }
  };

  const groupedEnrollments = {
    active: filteredEnrollments.filter(e => e.status === 'active'),
    completed: filteredEnrollments.filter(e => e.status === 'completed'),
    paused: filteredEnrollments.filter(e => e.status === 'paused'),
    all: filteredEnrollments
  };

  const categories = [...new Set(enrollments.map(e => e.courses.category))];

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
            <h1 className="text-3xl font-bold">My Courses</h1>
            <p className="text-muted-foreground">
              Track your learning progress and manage your enrolled courses
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline">
              {enrollments.length} Total Courses
            </Badge>
            <Badge className="bg-success text-success-foreground">
              {groupedEnrollments.completed.length} Completed
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
                    placeholder="Search courses..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="paused">Paused</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Course Tabs */}
        <Tabs defaultValue="all" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="all">
              All ({groupedEnrollments.all.length})
            </TabsTrigger>
            <TabsTrigger value="active">
              Active ({groupedEnrollments.active.length})
            </TabsTrigger>
            <TabsTrigger value="completed">
              Completed ({groupedEnrollments.completed.length})
            </TabsTrigger>
            <TabsTrigger value="paused">
              Paused ({groupedEnrollments.paused.length})
            </TabsTrigger>
          </TabsList>

          {(['all', 'active', 'completed', 'paused'] as const).map((tabValue) => (
            <TabsContent key={tabValue} value={tabValue} className="space-y-4">
              {groupedEnrollments[tabValue].length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No courses found</h3>
                    <p className="text-muted-foreground text-center">
                      {tabValue === 'all' 
                        ? "You haven't enrolled in any courses yet." 
                        : `No ${tabValue} courses found.`}
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {groupedEnrollments[tabValue].map((enrollment) => (
                    <Card key={enrollment.id} className="group hover:shadow-lg transition-shadow">
                      <CardContent className="p-6">
                        <div className="space-y-4">
                          {/* Course Image */}
                          <div className="aspect-video rounded-lg bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                            <BookOpen className="h-12 w-12 text-primary" />
                          </div>

                          {/* Course Info */}
                          <div className="space-y-2">
                            <div className="flex items-start justify-between">
                              <h3 className="font-semibold line-clamp-2">
                                {enrollment.courses.title}
                              </h3>
                              <Badge className={`ml-2 ${getStatusColor(enrollment.status)} text-white`}>
                                <div className="flex items-center gap-1">
                                  {getStatusIcon(enrollment.status)}
                                  <span className="capitalize">{enrollment.status}</span>
                                </div>
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {enrollment.courses.description}
                            </p>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              <span>{enrollment.courses.duration}</span>
                              <span>•</span>
                              <span>{enrollment.courses.level}</span>
                            </div>
                          </div>

                          {/* Progress */}
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span>Progress</span>
                              <span>{enrollment.progress}%</span>
                            </div>
                            <Progress value={enrollment.progress} className="h-2" />
                          </div>

                          {/* Actions */}
                          <div className="flex gap-2 pt-2">
                            <Button className="flex-1" size="sm">
                              Continue Learning
                            </Button>
                            <Select
                              value={enrollment.status}
                              onValueChange={(value) => handleStatusChange(enrollment.id, value)}
                            >
                              <SelectTrigger className="w-[100px]">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="active">Active</SelectItem>
                                <SelectItem value="paused">Paused</SelectItem>
                                <SelectItem value="completed">Completed</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </LMSLayout>
  );
}