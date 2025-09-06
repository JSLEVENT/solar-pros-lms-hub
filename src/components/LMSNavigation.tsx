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
  roles: ('learner' | 'manager' | 'admin' | 'owner')[];
}

const navigationItems: NavigationItem[] = [
  {
    title: "Dashboard",
    href: "/",
    icon: Home,
    roles: ['learner', 'manager', 'admin', 'owner']
  },
  {
    title: "My Training",
    href: "/my-training",
    icon: BookOpen,
    roles: ['learner', 'manager', 'admin', 'owner']
  },
  {
    title: "AI Training Arena",
    href: "/ai-training-arena",
    icon: Target,
    roles: ['learner', 'manager', 'admin', 'owner']
  },
  {
    title: "My Progress",
    href: "/progress",
    icon: BarChart3,
    roles: ['learner', 'manager', 'admin', 'owner']
  },
  {
    title: "Calendar",
    href: "/calendar",
    icon: Calendar,
    roles: ['learner', 'manager', 'admin', 'owner']
  },
  {
    title: "Live Trainings",
    href: "/live-trainings",
    icon: PlayCircle,
    roles: ['learner', 'manager', 'admin', 'owner']
  },
  {
    title: "Team View",
    href: "/team-view",
    icon: Users,
    roles: ['manager', 'admin', 'owner']
  },
  // Admin only items
  {
    title: "Admin Dashboard",
    href: "/admin",
    icon: Settings,
    roles: ['admin', 'owner']
  }
];

interface LMSNavigationProps {
  userRole: 'learner' | 'manager' | 'admin' | 'owner';
  currentPath: string;
  className?: string;
}

export function LMSNavigation({ userRole, currentPath, className }: LMSNavigationProps) {
  const filteredItems = navigationItems.filter(item => 
    item.roles.includes(userRole)
  );

  // Group navigation items
  const mainItems = filteredItems.filter(item => !item.href.startsWith('/admin'));
  const adminItems = filteredItems.filter(item => item.href.startsWith('/admin'));

  return (
    <nav className={cn("flex flex-col h-full p-4", className)}>
      {/* User Role Indicator */}
      <div className="mb-6 p-3 rounded-xl bg-accent/20 border border-accent/30">
        <p className="text-xs text-muted-foreground mb-1">Logged in as</p>
        <p className="text-sm font-medium capitalize">{userRole}</p>
      </div>

      {/* Main Navigation */}
      <div className="space-y-2 flex-1">
        {mainItems.map((item) => {
          const isActive = currentPath === item.href || 
            (item.href !== "/" && currentPath.startsWith(item.href));
          
          return (
            <a
              key={item.href}
              href={item.href}
              className={cn(
                "nav-item group",
                isActive && "active"
              )}
            >
              <div className="relative p-1 rounded-lg">
                <item.icon className="h-5 w-5 transition-colors" />
              </div>
              <span className="flex-1 font-medium">{item.title}</span>
              {item.badge && (
                <Badge className="bg-primary/10 text-primary border-primary/20 text-xs px-2 py-0.5">
                  {item.badge}
                </Badge>
              )}
            </a>
          );
        })}
      </div>

      {/* Admin Section */}
      {adminItems.length > 0 && (
        <div className="mt-6 pt-6 border-t border-border/50">
          <div className="mb-3">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Administration
            </p>
          </div>
          <div className="space-y-2">
            {adminItems.map((item) => {
              const isActive = currentPath === item.href || 
                (item.href !== "/" && currentPath.startsWith(item.href));
              
              return (
                <a
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "nav-item group",
                    isActive && "active"
                  )}
                >
                  <div className="relative p-1 rounded-lg">
                    <item.icon className="h-5 w-5 transition-colors" />
                  </div>
                  <span className="flex-1 font-medium">{item.title}</span>
                  {item.badge && (
                    <Badge className="bg-primary/10 text-primary border-primary/20 text-xs px-2 py-0.5">
                      {item.badge}
                    </Badge>
                  )}
                </a>
              );
            })}
          </div>
        </div>
      )}
    </nav>
  );
}