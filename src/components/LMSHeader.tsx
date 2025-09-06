import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuLabel, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Bell, User, LogOut, Settings, Shield, BookOpen, ChevronDown } from "lucide-react";
import { Link } from 'react-router-dom';
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

export function LMSHeader() {
  const { user, profile, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
  };
  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-primary text-primary-foreground';
      case 'instructor': return 'bg-warning text-warning-foreground';
      default: return 'bg-secondary text-secondary-foreground';
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin': return <Shield className="h-3 w-3" />;
      case 'instructor': return <BookOpen className="h-3 w-3" />;
      default: return <User className="h-3 w-3" />;
    }
  };

  const userName = (profile?.first_name ? `${profile.first_name}${profile.last_name ? ' ' + profile.last_name : ''}` : (profile?.full_name || user?.email)) || 'User';
  const userRole = profile?.role || 'learner';

  const getGreeting = () => {
    const tz = profile?.time_zone || Intl.DateTimeFormat().resolvedOptions().timeZone;
    try {
      const now = new Date();
      const hour = Number(new Intl.DateTimeFormat('en-US', { hour: 'numeric', hour12: false, timeZone: tz }).format(now));
      if (hour < 5) return 'Good late night';
      if (hour < 12) return 'Good morning';
      if (hour < 17) return 'Good afternoon';
      if (hour < 21) return 'Good evening';
      return 'Good night';
    } catch {
      const hour = new Date().getHours();
      if (hour < 12) return 'Good morning';
      if (hour < 17) return 'Good afternoon';
      return 'Good evening';
    }
  };
  const notificationCount = 0;

  return (
    <header className="h-16 card-glass border-b border-white/10 flex items-center justify-between px-6 sticky top-0 z-50 backdrop-blur-xl">
      {/* Modern Logo */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 bg-gradient-primary rounded-xl flex items-center justify-center shadow-glow">
          <span className="text-white font-bold text-sm">SP</span>
        </div>
        <div className="flex flex-col">
          <span className="font-semibold text-lg text-gradient">Solar Pros</span>
          <span className="text-xs text-muted-foreground -mt-1">LMS Hub</span>
        </div>
      </div>

      {/* Right Side */}
      <div className="flex items-center gap-3">
        {/* Modern Notifications */}
        <div className="relative">
          <Button variant="ghost" size="sm" className="relative rounded-xl btn-glass">
            <Bell className="h-4 w-4" />
            {notificationCount > 0 && (
              <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs bg-gradient-primary border-0 shadow-glow">
                {notificationCount}
              </Badge>
            )}
          </Button>
        </div>

        {/* Enhanced User Menu */}
        {user && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-3 h-auto p-3 rounded-xl btn-glass">
                <Avatar className="h-9 w-9 ring-2 ring-primary/20">
                  <AvatarFallback className="bg-gradient-primary text-white font-medium">
                    {userName.split(' ').map(p=> p[0]).join('').slice(0,2).toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden md:flex flex-col items-start">
                  <span className="text-xs uppercase text-muted-foreground tracking-wide">{getGreeting()}</span>
                  <span className="text-sm font-medium">
                    {userName}
                    {profile?.job_title && (
                      <span className="ml-2 text-xs text-muted-foreground font-normal">{profile.job_title}</span>
                    )}
                  </span>
                  <div className="flex items-center gap-1">
                    {getRoleIcon(profile?.role || 'learner')}
                    <Badge variant="outline" className={cn("text-xs border-0 bg-accent/50", getRoleColor(profile?.role || 'learner'))}>
                      {profile?.role || 'learner'}
                    </Badge>
                  </div>
                </div>
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64 card-glass border-white/10 backdrop-blur-xl">
              <DropdownMenuLabel className="font-medium">My Account</DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-white/10" />
              <DropdownMenuItem asChild className="cursor-pointer hover:bg-accent/50 rounded-lg transition-colors">
                <Link to="/settings/profile" className="flex items-center w-full">
                  <User className="h-4 w-4 mr-3" />
                  Profile
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer hover:bg-accent/50 rounded-lg transition-colors">
                <Settings className="h-4 w-4 mr-3" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-white/10" />
              <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer hover:bg-destructive/10 text-destructive rounded-lg transition-colors">
                <LogOut className="h-4 w-4 mr-3" />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </header>
  );
}