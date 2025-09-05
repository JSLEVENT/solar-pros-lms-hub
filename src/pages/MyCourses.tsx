import { useState, useEffect } from 'react';
import { LMSLayout } from '@/components/LMSLayout';
import { ModernCard, ModernCardContent, ModernCardHeader, ModernCardTitle } from '@/components/ui/modern-card';
import { ProgressRing } from '@/components/ui/progress-ring';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Search, Filter, BookOpen, Clock, Award, Play, Pause, RotateCcw, TrendingUp, Target, Zap, ChevronRight } from 'lucide-react';

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
      <div className="space-y-8">
        {/* Revolutionary Header */}
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-solar-red/10 via-transparent to-solar-glow/10 rounded-3xl" />
          <ModernCard variant="glass" className="relative">
            <ModernCardContent className="p-8">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-solar-red to-solar-glow flex items-center justify-center animate-pulse-glow">
                      <BookOpen className="h-8 w-8 text-white" />
                    </div>
                    <div>
                      <h1 className="text-4xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
                        My Learning Hub
                      </h1>
                      <p className="text-muted-foreground text-lg mt-1">
                        Your personalized course dashboard and progress tracker
                      </p>
                    </div>
                  </div>
                  
                  {/* Quick Stats */}
                  <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-success" />
                      <span className="font-medium">{Math.round(groupedEnrollments.all.reduce((sum, e) => sum + e.progress, 0) / groupedEnrollments.all.length || 0)}% Avg Progress</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Target className="h-5 w-5 text-primary" />
                      <span className="font-medium">{groupedEnrollments.active.length} Active</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Zap className="h-5 w-5 text-solar-glow" />
                      <span className="font-medium">{groupedEnrollments.completed.length} Completed</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-col items-end gap-4">
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="text-sm px-4 py-2">
                      {enrollments.length} Total Courses
                    </Badge>
                    <Badge className="bg-gradient-to-r from-success to-success/80 text-white text-sm px-4 py-2">
                      {groupedEnrollments.completed.length} Completed
                    </Badge>
                  </div>
                  
                  {/* Progress Ring */}
                  <ProgressRing 
                    value={Math.round(groupedEnrollments.completed.length / Math.max(enrollments.length, 1) * 100)}
                    size="lg"
                    className="animate-float"
                  />
                </div>
              </div>
            </ModernCardContent>
          </ModernCard>
        </div>

        {/* Revolutionary Filter System */}
        <ModernCard variant="floating">
          <ModernCardContent className="p-6">
            <div className="flex flex-col gap-6 md:flex-row md:items-center">
              <div className="flex-1">
                <div className="relative group">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                  <Input
                    placeholder="Search your courses, topics, or instructors..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-12 h-12 text-base border-0 bg-secondary/50 rounded-xl focus:bg-background transition-all duration-300"
                  />
                </div>
              </div>
              <div className="flex gap-3">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[160px] h-12 border-0 bg-secondary/50 rounded-xl">
                    <Filter className="h-4 w-4 mr-2" />
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
                  <SelectTrigger className="w-[160px] h-12 border-0 bg-secondary/50 rounded-xl">
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
          </ModernCardContent>
        </ModernCard>

        {/* Revolutionary Course Navigation */}
        <Tabs defaultValue="all" className="space-y-8">
          <TabsList className="grid w-full grid-cols-4 h-16 bg-secondary/50 rounded-2xl p-2">
            <TabsTrigger value="all" className="h-12 rounded-xl text-base data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-primary/80 data-[state=active]:text-white transition-all">
              <div className="flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                All ({groupedEnrollments.all.length})
              </div>
            </TabsTrigger>
            <TabsTrigger value="active" className="h-12 rounded-xl text-base data-[state=active]:bg-gradient-to-r data-[state=active]:from-success data-[state=active]:to-success/80 data-[state=active]:text-white transition-all">
              <div className="flex items-center gap-2">
                <Play className="h-4 w-4" />
                Active ({groupedEnrollments.active.length})
              </div>
            </TabsTrigger>
            <TabsTrigger value="completed" className="h-12 rounded-xl text-base data-[state=active]:bg-gradient-to-r data-[state=active]:from-solar-glow data-[state=active]:to-solar-red data-[state=active]:text-white transition-all">
              <div className="flex items-center gap-2">
                <Award className="h-4 w-4" />
                Completed ({groupedEnrollments.completed.length})
              </div>
            </TabsTrigger>
            <TabsTrigger value="paused" className="h-12 rounded-xl text-base data-[state=active]:bg-gradient-to-r data-[state=active]:from-warning data-[state=active]:to-warning/80 data-[state=active]:text-white transition-all">
              <div className="flex items-center gap-2">
                <Pause className="h-4 w-4" />
                Paused ({groupedEnrollments.paused.length})
              </div>
            </TabsTrigger>
          </TabsList>

          {(['all', 'active', 'completed', 'paused'] as const).map((tabValue) => (
            <TabsContent key={tabValue} value={tabValue} className="space-y-6">
              {groupedEnrollments[tabValue].length === 0 ? (
                <ModernCard variant="glass">
                  <ModernCardContent className="flex flex-col items-center justify-center py-16">
                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center mb-6">
                      <BookOpen className="h-12 w-12 text-muted-foreground" />
                    </div>
                    <h3 className="text-2xl font-semibold mb-3">No courses found</h3>
                    <p className="text-muted-foreground text-center max-w-md">
                      {tabValue === 'all' 
                        ? "Ready to start your learning journey? Browse our course catalog to find the perfect course for you." 
                        : `No ${tabValue} courses found. Try adjusting your filters or check other tabs.`}
                    </p>
                    {tabValue === 'all' && (
                      <Button className="mt-6" size="lg">
                        Browse Courses
                        <ChevronRight className="h-4 w-4 ml-2" />
                      </Button>
                    )}
                  </ModernCardContent>
                </ModernCard>
              ) : (
                <div className="masonry-grid gap-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 stagger-fade-in">
                    {groupedEnrollments[tabValue].map((enrollment) => (
                      <ModernCard key={enrollment.id} variant="interactive" className="group h-full">
                        <ModernCardContent className="p-0">
                          {/* Course Visual Header */}
                          <div className="relative aspect-video rounded-t-2xl bg-gradient-to-br from-primary/20 via-accent/20 to-solar-glow/20 flex items-center justify-center overflow-hidden">
                            <BookOpen className="h-16 w-16 text-primary group-hover:scale-110 transition-transform duration-500" />
                            <div className="absolute inset-0 bg-gradient-to-br from-transparent via-white/5 to-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                            
                            {/* Status Badge */}
                            <div className="absolute top-4 right-4">
                              <Badge className={`${getStatusColor(enrollment.status)} text-white backdrop-blur-sm`}>
                                <div className="flex items-center gap-1">
                                  {getStatusIcon(enrollment.status)}
                                  <span className="capitalize">{enrollment.status}</span>
                                </div>
                              </Badge>
                            </div>
                            
                            {/* Progress Ring Overlay */}
                            <div className="absolute bottom-4 left-4">
                              <ProgressRing 
                                value={enrollment.progress} 
                                size="sm" 
                                className="bg-white/20 backdrop-blur-sm rounded-full p-1"
                              />
                            </div>
                          </div>

                          {/* Course Content */}
                          <div className="p-6 space-y-4">
                            <div className="space-y-3">
                              <h3 className="font-semibold text-xl leading-tight group-hover:text-primary transition-colors duration-300">
                                {enrollment.courses.title}
                              </h3>
                              <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed">
                                {enrollment.courses.description}
                              </p>
                              
                              {/* Course Meta */}
                              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                <div className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  <span>{enrollment.courses.duration}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Target className="h-3 w-3" />
                                  <span>{enrollment.courses.level}</span>
                                </div>
                              </div>
                            </div>

                            {/* Enhanced Progress Display */}
                            <div className="space-y-3">
                              <div className="flex justify-between items-center">
                                <span className="text-sm font-medium">Learning Progress</span>
                                <span className="text-sm font-bold text-primary">{enrollment.progress}%</span>
                              </div>
                              <div className="relative">
                                <Progress value={enrollment.progress} className="h-3 bg-secondary" />
                                <div className="absolute top-0 left-0 h-3 w-full bg-gradient-to-r from-primary/20 to-transparent rounded-full opacity-50" />
                              </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-3 pt-2">
                              <Button className="flex-1 group/btn" size="sm">
                                Continue Learning
                                <ChevronRight className="h-4 w-4 ml-2 group-hover/btn:translate-x-1 transition-transform" />
                              </Button>
                              <Select
                                value={enrollment.status}
                                onValueChange={(value) => handleStatusChange(enrollment.id, value)}
                              >
                                <SelectTrigger className="w-[120px] border-0 bg-secondary/50">
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
                        </ModernCardContent>
                      </ModernCard>
                    ))}
                  </div>
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </LMSLayout>
  );
}