import { useState, useEffect } from 'react';
import { LMSLayout } from '@/components/LMSLayout';
import { ModernCard, ModernCardContent, ModernCardHeader, ModernCardTitle } from '@/components/ui/modern-card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Search, Users, Clock, Star, BookOpen, Filter, DollarSign, Award, Sparkles, TrendingUp, ChevronRight, Heart } from 'lucide-react';

interface Course {
  id: string;
  title: string;
  description: string;
  category: string;
  level: string;
  duration: string;
  // Price removed - internal platform
  image_url?: string;
  instructor_id: string;
  profiles: {
    full_name: string;
  };
  enrollments?: { count: number }[];
  is_enrolled?: boolean;
}

export default function CourseCatalog() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [levelFilter, setLevelFilter] = useState('all');
  // Price filter removed - internal platform

  useEffect(() => {
    fetchCourses();
  }, [user]);

  const fetchCourses = async () => {
    try {
      const { data, error } = await supabase
        .from('courses')
        .select(`
          *,
          profiles:instructor_id (
            full_name
          ),
          enrollments!left (
            count
          )
        `)
        .eq('status', 'published')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Check enrollment status for each course if user is logged in
      if (user && data) {
        const { data: userEnrollments } = await supabase
          .from('enrollments')
          .select('course_id')
          .eq('user_id', user.id);

        const enrolledCourseIds = new Set(userEnrollments?.map(e => e.course_id) || []);
        
        const coursesWithEnrollment = data.map(course => ({
          ...course,
          is_enrolled: enrolledCourseIds.has(course.id)
        }));

        setCourses(coursesWithEnrollment);
      } else {
        setCourses(data || []);
      }
    } catch (error) {
      console.error('Error fetching courses:', error);
      toast({
        title: 'Error',
        description: 'Failed to load courses',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEnroll = async (courseId: string) => {
    if (!user) {
      toast({
        title: 'Authentication Required',
        description: 'Please log in to enroll in courses',
        variant: 'destructive',
      });
      return;
    }

    setEnrolling(courseId);
    try {
      const { error } = await supabase
        .from('enrollments')
        .insert({
          user_id: user.id,
          course_id: courseId,
          status: 'active',
          progress: 0
        });

      if (error) {
        if (error.code === '23505') { // Unique constraint violation
          toast({
            title: 'Already Enrolled',
            description: 'You are already enrolled in this course',
            variant: 'destructive',
          });
        } else {
          throw error;
        }
      } else {
        toast({
          title: 'Success!',
          description: 'Successfully enrolled in the course',
        });
        await fetchCourses(); // Refresh to update enrollment status
      }
    } catch (error) {
      console.error('Error enrolling:', error);
      toast({
        title: 'Error',
        description: 'Failed to enroll in course',
        variant: 'destructive',
      });
    } finally {
      setEnrolling(null);
    }
  };

  const filteredCourses = courses.filter((course) => {
    const matchesSearch = course.title
      .toLowerCase()
      .includes(searchTerm.toLowerCase()) ||
      course.description
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase());
    
    const matchesCategory = categoryFilter === 'all' || course.category === categoryFilter;
    const matchesLevel = levelFilter === 'all' || course.level === levelFilter;
    
    return matchesSearch && matchesCategory && matchesLevel;
  });

  const categories = [...new Set(courses.map(c => c.category))];
  const levels = [...new Set(courses.map(c => c.level))];

  const getLevelColor = (level: string) => {
    switch (level?.toLowerCase()) {
      case 'beginner': return 'bg-success';
      case 'intermediate': return 'bg-warning';
      case 'advanced': return 'bg-destructive';
      default: return 'bg-secondary';
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

  return (
    <LMSLayout>
      <div className="space-y-8">
        {/* Revolutionary Header */}
        <ModernCard variant="glass" className="overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-solar-red/5 via-transparent to-solar-glow/10" />
          <ModernCardContent className="relative p-8">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-solar-red to-solar-glow flex items-center justify-center animate-pulse-glow">
                    <Sparkles className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
                      Course Universe
                    </h1>
                    <p className="text-muted-foreground text-lg mt-1">
                      Discover world-class solar energy education and transform your career
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-success" />
                    <span className="font-medium">Expert-Led Content</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-primary" />
                    <span className="font-medium">2,500+ Students</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Award className="h-5 w-5 text-solar-glow" />
                    <span className="font-medium">Industry Certified</span>
                  </div>
                </div>
              </div>
              
              <div className="flex flex-col items-end gap-4">
                <Badge variant="outline" className="text-lg px-6 py-3 animate-pulse">
                  {filteredCourses.length} Courses Available
                </Badge>
                <Button size="lg" className="group">
                  Browse All Courses
                  <ChevronRight className="h-5 w-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </div>
            </div>
          </ModernCardContent>
        </ModernCard>

        {/* Revolutionary Search & Filter System */}
        <ModernCard variant="floating">
          <ModernCardContent className="p-6 space-y-6">
            {/* Main Search */}
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-6 w-6 text-muted-foreground group-hover:text-primary transition-colors z-10" />
              <Input
                placeholder="Search courses, instructors, topics, or skills..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-14 h-14 text-lg border-0 bg-secondary/50 rounded-2xl focus:bg-background transition-all duration-300 shadow-inner"
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2">
                <kbd className="pointer-events-none inline-flex h-8 select-none items-center gap-1 rounded border bg-muted px-2 font-mono text-xs font-medium text-muted-foreground opacity-100">
                  <span className="text-xs">⌘</span>K
                </kbd>
              </div>
            </div>
            
            {/* Filter Pills */}
            <div className="flex flex-wrap gap-3">
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-[180px] h-12 border-0 bg-secondary/50 rounded-2xl hover:bg-secondary transition-colors">
                  <Filter className="h-4 w-4 mr-2" />
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

              <Select value={levelFilter} onValueChange={setLevelFilter}>
                <SelectTrigger className="w-[150px] h-12 border-0 bg-secondary/50 rounded-2xl hover:bg-secondary transition-colors">
                  <TrendingUp className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Levels</SelectItem>
                  {levels.map((level) => (
                    <SelectItem key={level} value={level}>
                      {level}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Price filter removed - internal platform */}
              
              {/* Quick Filter Buttons */}
              <Button variant="outline" size="sm" className="h-12 px-6 rounded-2xl border-0 bg-secondary/50">
                <Star className="h-4 w-4 mr-2" />
                Trending
              </Button>
              
              <Button variant="outline" size="sm" className="h-12 px-6 rounded-2xl border-0 bg-secondary/50">
                <Heart className="h-4 w-4 mr-2" />
                Favorites
              </Button>
            </div>
          </ModernCardContent>
        </ModernCard>

        {/* Revolutionary Course Showcase */}
        {filteredCourses.length === 0 ? (
          <ModernCard variant="glass">
            <ModernCardContent className="flex flex-col items-center justify-center py-20">
              <div className="w-32 h-32 rounded-full bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center mb-8 animate-float">
                <Search className="h-16 w-16 text-muted-foreground" />
              </div>
              <h3 className="text-3xl font-semibold mb-4">No courses match your search</h3>
              <p className="text-muted-foreground text-center max-w-md text-lg leading-relaxed">
                Try adjusting your search criteria or explore our trending courses to discover something amazing.
              </p>
              <Button className="mt-8" size="lg">
                Clear Filters
                <ChevronRight className="h-5 w-5 ml-2" />
              </Button>
            </ModernCardContent>
          </ModernCard>
        ) : (
          <div className="masonry-layout">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 stagger-fade-in">
              {filteredCourses.map((course) => (
                <ModernCard key={course.id} variant="interactive" className="group h-full">
                  <ModernCardContent className="p-0">
                    {/* Course Visual Header */}
                    <div className="relative aspect-video rounded-t-2xl bg-gradient-to-br from-primary/20 via-accent/20 to-solar-glow/20 flex items-center justify-center overflow-hidden">
                      <BookOpen className="h-20 w-20 text-primary group-hover:scale-110 transition-transform duration-500" />
                      
                      {/* Floating Elements */}
                      <div className="absolute inset-0 bg-gradient-to-br from-transparent via-white/5 to-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                      
                      {/* Level Badge */}
                      <div className="absolute top-4 right-4">
                        <Badge className={`${getLevelColor(course.level)} text-white backdrop-blur-sm shadow-lg`}>
                          {course.level}
                        </Badge>
                      </div>
                      
                      {/* Internal platform - all courses are free */}
                      <div className="absolute top-4 left-4">
                        <Badge className="bg-gradient-to-r from-primary to-primary/80 text-white backdrop-blur-sm shadow-lg">
                          INTERNAL TRAINING
                        </Badge>
                      </div>
                      
                      {/* Popularity Indicator */}
                      <div className="absolute bottom-4 left-4">
                        <div className="flex items-center gap-1 bg-black/20 backdrop-blur-sm rounded-full px-3 py-1">
                          <Users className="h-3 w-3 text-white" />
                          <span className="text-white text-xs font-medium">
                            {course.enrollments?.[0]?.count || 0}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Course Content */}
                    <div className="p-6 space-y-4">
                      {/* Course Header */}
                      <div className="space-y-3">
                        <h3 className="font-semibold text-xl leading-tight group-hover:text-primary transition-colors duration-300">
                          {course.title}
                        </h3>
                        <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed">
                          {course.description}
                        </p>
                      </div>

                      {/* Course Meta */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                              <span className="text-xs font-semibold">
                                {course.profiles?.full_name?.charAt(0) || 'I'}
                              </span>
                            </div>
                            <span className="text-sm font-medium">
                              {course.profiles?.full_name || 'Expert Instructor'}
                            </span>
                          </div>
                          <Badge variant="outline" className="text-xs px-3 py-1">
                            {course.category}
                          </Badge>
                        </div>
                        
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            <span>{course.duration}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Star className="h-4 w-4 text-yellow-500" />
                            <span>4.8 (124)</span>
                          </div>
                        </div>
                      </div>

                      <Separator className="my-4" />

                      {/* Action */}
                      <div className="flex items-center justify-end pt-2">

                        {course.is_enrolled ? (
                          <Button variant="secondary" size="sm" disabled className="group/enrolled">
                            <Award className="h-4 w-4 mr-2 group-hover/enrolled:rotate-12 transition-transform" />
                            Enrolled
                          </Button>
                        ) : (
                          <Button 
                            size="sm"
                            onClick={() => handleEnroll(course.id)}
                            disabled={enrolling === course.id}
                            className="group/enroll"
                          >
                            {enrolling === course.id ? (
                              <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                                Enrolling...
                              </>
                            ) : (
                              <>
                                Enroll Now
                                <ChevronRight className="h-4 w-4 ml-2 group-hover/enroll:translate-x-1 transition-transform" />
                              </>
                            )}
                          </Button>
                        )}
                      </div>
                    </div>
                  </ModernCardContent>
                </ModernCard>
              ))}
            </div>
          </div>
        )}
      </div>
    </LMSLayout>
  );
}