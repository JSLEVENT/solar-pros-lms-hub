import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Home, 
  BookOpen, 
  GraduationCap, 
  Award, 
  MessageSquare, 
  Calendar,
  Users,
  BarChart3,
  Settings,
  FileText,
  PlayCircle,
  Target
} from "lucide-react";

interface NavigationItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  roles: ('learner' | 'instructor' | 'admin')[];
}

const navigationItems: NavigationItem[] = [
  {
    title: "Dashboard",
    href: "/",
    icon: Home,
    roles: ['learner', 'instructor', 'admin']
  },
  {
    title: "My Courses",
    href: "/courses",
    icon: BookOpen,
    roles: ['learner', 'instructor']
  },
  {
    title: "Course Catalog",
    href: "/catalog",
    icon: GraduationCap,
    roles: ['learner', 'instructor', 'admin']
  },
  {
    title: "Assessments",
    href: "/assessments",
    icon: Target,
    roles: ['learner', 'instructor', 'admin']
  },
  {
    title: "My Progress",
    href: "/progress",
    icon: BarChart3,
    roles: ['learner']
  },
  {
    title: "Certificates",
    href: "/certificates",
    icon: Award,
    roles: ['learner', 'instructor', 'admin']
  },
  {
    title: "Discussions",
    href: "/forums",
    icon: MessageSquare,
    badge: "3",
    roles: ['learner', 'instructor', 'admin']
  },
  {
    title: "Calendar",
    href: "/calendar",
    icon: Calendar,
    roles: ['learner', 'instructor', 'admin']
  },
  {
    title: "Virtual Classes",
    href: "/webinars",
    icon: PlayCircle,
    roles: ['learner', 'instructor', 'admin']
  },
  // Admin/Instructor only items
  {
    title: "User Management",
    href: "/admin/users",
    icon: Users,
    roles: ['admin']
  },
  {
    title: "Content Management",
    href: "/admin/content",
    icon: FileText,
    roles: ['admin', 'instructor']
  },
  {
    title: "Analytics",
    href: "/admin/analytics",
    icon: BarChart3,
    roles: ['admin']
  },
  {
    title: "System Settings",
    href: "/admin/settings",
    icon: Settings,
    roles: ['admin']
  }
];

interface LMSNavigationProps {
  userRole: 'learner' | 'instructor' | 'admin';
  currentPath: string;
  className?: string;
}

export function LMSNavigation({ userRole, currentPath, className }: LMSNavigationProps) {
  const filteredItems = navigationItems.filter(item => 
    item.roles.includes(userRole)
  );

  return (
    <nav className={cn("flex flex-col space-y-1 p-4", className)}>
      <div className="space-y-1">
        {filteredItems.map((item) => {
          const isActive = currentPath === item.href || 
            (item.href !== "/" && currentPath.startsWith(item.href));
          
          return (
            <Button
              key={item.href}
              variant={isActive ? "default" : "ghost"}
              className={cn(
                "w-full justify-start gap-3 h-10",
                isActive 
                  ? "bg-primary text-primary-foreground shadow-sm" 
                  : "hover:bg-secondary"
              )}
              asChild
            >
              <a href={item.href}>
                <item.icon className="h-4 w-4" />
                <span className="flex-1 text-left">{item.title}</span>
                {item.badge && (
                  <Badge variant="secondary" className="ml-auto">
                    {item.badge}
                  </Badge>
                )}
              </a>
            </Button>
          );
        })}
      </div>
    </nav>
  );
}