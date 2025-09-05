import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Clock, Users, Star, PlayCircle, BookOpen } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface CourseCardProps {
  course: {
    id: string;
    title: string;
    description: string;
    instructor: string;
    instructorAvatar?: string;
    category: string;
    duration: string;
    enrolled: number;
    rating: number;
    progress?: number;
    status: 'not-enrolled' | 'in-progress' | 'completed';
    thumbnail?: string;
    level: 'Beginner' | 'Intermediate' | 'Advanced';
    price?: number;
  };
  variant?: 'catalog' | 'enrolled';
}

export function CourseCard({ course, variant = 'catalog' }: CourseCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-success text-success-foreground';
      case 'in-progress': return 'bg-warning text-warning-foreground';
      default: return 'bg-secondary text-secondary-foreground';
    }
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'Beginner': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'Intermediate': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'Advanced': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      default: return 'bg-secondary text-secondary-foreground';
    }
  };

  return (
    <Card className="group hover:shadow-lg transition-all duration-300 overflow-hidden">
      {/* Course Thumbnail */}
      <div className="relative h-48 bg-gradient-to-br from-primary/10 to-primary/20 overflow-hidden">
        {course.thumbnail ? (
          <img 
            src={course.thumbnail} 
            alt={course.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/10">
            <BookOpen className="h-16 w-16 text-primary/40" />
          </div>
        )}
        
        {/* Status Badge */}
        {variant === 'enrolled' && (
          <Badge className={`absolute top-3 right-3 ${getStatusColor(course.status)}`}>
            {course.status === 'not-enrolled' ? 'Available' : 
             course.status === 'in-progress' ? 'In Progress' : 'Completed'}
          </Badge>
        )}

        {/* Level Badge */}
        <Badge className={`absolute top-3 left-3 ${getLevelColor(course.level)}`}>
          {course.level}
        </Badge>

        {/* Play Button Overlay */}
        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
          <Button size="lg" className="rounded-full h-12 w-12 p-0">
            <PlayCircle className="h-6 w-6" />
          </Button>
        </div>
      </div>

      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <Badge variant="outline" className="mb-2 text-xs">
              {course.category}
            </Badge>
            <h3 className="font-semibold text-lg leading-tight line-clamp-2 mb-2">
              {course.title}
            </h3>
            <p className="text-sm text-muted-foreground line-clamp-2">
              {course.description}
            </p>
          </div>
        </div>

        {/* Instructor */}
        <div className="flex items-center gap-2 pt-2">
          <Avatar className="h-6 w-6">
            <AvatarImage src={course.instructorAvatar} alt={course.instructor} />
            <AvatarFallback className="text-xs">
              {course.instructor.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <span className="text-sm text-muted-foreground">{course.instructor}</span>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {/* Progress Bar for Enrolled Courses */}
        {variant === 'enrolled' && course.progress !== undefined && (
          <div className="mb-4">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-muted-foreground">Progress</span>
              <span className="font-medium">{course.progress}%</span>
            </div>
            <Progress value={course.progress} className="h-2" />
          </div>
        )}

        {/* Course Stats */}
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              <span>{course.duration}</span>
            </div>
            <div className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              <span>{course.enrolled}</span>
            </div>
            <div className="flex items-center gap-1">
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              <span>{course.rating}</span>
            </div>
          </div>
          {course.price !== undefined && variant === 'catalog' && (
            <div className="font-semibold text-foreground">
              {course.price === 0 ? 'Free' : `$${course.price}`}
            </div>
          )}
        </div>
      </CardContent>

      <CardFooter className="pt-0">
        {variant === 'catalog' ? (
          <Button className="w-full" variant={course.price === 0 ? "default" : "default"}>
            {course.status === 'not-enrolled' 
              ? (course.price === 0 ? 'Enroll Now' : 'Purchase Course')
              : 'Continue Learning'
            }
          </Button>
        ) : (
          <div className="flex gap-2 w-full">
            <Button className="flex-1" variant="default">
              {course.status === 'completed' ? 'Review' : 'Continue'}
            </Button>
            <Button variant="outline" size="sm">
              Details
            </Button>
          </div>
        )}
      </CardFooter>
    </Card>
  );
}