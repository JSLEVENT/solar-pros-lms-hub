import { useState, useEffect } from 'react';
import { LMSLayout } from '@/components/LMSLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Search, Users, Clock, Star, BookOpen, Filter, DollarSign, Award } from 'lucide-react';

interface Course {
  id: string;
  title: string;
  description: string;
  category: string;
  level: string;
  duration: string;
  price: number;
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
  const [priceFilter, setPriceFilter] = useState('all');

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
    
    let matchesPrice = true;
    if (priceFilter === 'free') {
      matchesPrice = course.price === 0;
    } else if (priceFilter === 'paid') {
      matchesPrice = course.price > 0;
    }
    
    return matchesSearch && matchesCategory && matchesLevel && matchesPrice;
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
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold">Course Catalog</h1>
            <p className="text-muted-foreground">
              Discover and enroll in professional solar energy courses
            </p>
          </div>
          <Badge variant="outline" className="w-fit">
            {filteredCourses.length} Courses Available
          </Badge>
        </div>

        {/* Search and Filters */}
        <Card>
          <CardContent className="p-4 space-y-4">
            <div className="flex flex-col gap-4 md:flex-row md:items-center">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search courses, instructors, or topics..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-2">
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-[150px]">
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
                <SelectTrigger className="w-[130px]">
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

              <Select value={priceFilter} onValueChange={setPriceFilter}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="Price" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Prices</SelectItem>
                  <SelectItem value="free">Free</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Course Grid */}
        {filteredCourses.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No courses found</h3>
              <p className="text-muted-foreground text-center">
                Try adjusting your search criteria or browse all available courses.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCourses.map((course) => (
              <Card key={course.id} className="group hover:shadow-lg transition-all duration-200">
                <CardContent className="p-0">
                  {/* Course Image */}
                  <div className="aspect-video rounded-t-lg bg-gradient-to-br from-primary/20 via-accent/20 to-primary/10 flex items-center justify-center relative overflow-hidden">
                    <BookOpen className="h-16 w-16 text-primary" />
                    <div className="absolute top-3 right-3">
                      <Badge className={`${getLevelColor(course.level)} text-white`}>
                        {course.level}
                      </Badge>
                    </div>
                    {course.price === 0 && (
                      <div className="absolute top-3 left-3">
                        <Badge className="bg-success text-success-foreground">
                          FREE
                        </Badge>
                      </div>
                    )}
                  </div>

                  <div className="p-6 space-y-4">
                    {/* Course Header */}
                    <div className="space-y-2">
                      <h3 className="font-semibold text-lg line-clamp-2 group-hover:text-primary transition-colors">
                        {course.title}
                      </h3>
                      <p className="text-sm text-muted-foreground line-clamp-3">
                        {course.description}
                      </p>
                    </div>

                    {/* Course Meta */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <span>By {course.profiles?.full_name || 'Instructor'}</span>
                        <Badge variant="outline" className="text-xs">
                          {course.category}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          <span>{course.duration}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          <span>{course.enrollments?.[0]?.count || 0} enrolled</span>
                        </div>
                      </div>
                    </div>

                    <Separator />

                    {/* Price and Action */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        {course.price > 0 ? (
                          <>
                            <DollarSign className="h-4 w-4 text-primary" />
                            <span className="text-lg font-semibold text-primary">
                              ${course.price}
                            </span>
                          </>
                        ) : (
                          <span className="text-lg font-semibold text-success">
                            Free
                          </span>
                        )}
                      </div>

                      {course.is_enrolled ? (
                        <Button variant="secondary" size="sm" disabled>
                          <Award className="h-4 w-4 mr-2" />
                          Enrolled
                        </Button>
                      ) : (
                        <Button 
                          size="sm"
                          onClick={() => handleEnroll(course.id)}
                          disabled={enrolling === course.id}
                        >
                          {enrolling === course.id ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                              Enrolling...
                            </>
                          ) : (
                            'Enroll Now'
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </LMSLayout>
  );
}