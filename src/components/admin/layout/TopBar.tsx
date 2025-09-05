import { useAuth } from '@/hooks/useAuth';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';

export function TopBar() {
  const { profile } = useAuth();
  return (
    <div className="h-14 border-b flex items-center justify-between px-4 gap-4 bg-background/70 backdrop-blur">
      <div className="flex items-center gap-3 text-sm text-muted-foreground">
        <span>Admin Console</span>
      </div>
      <div className="flex items-center gap-4">
        {profile && (
          <div className="flex items-center gap-2 text-sm">
            <span className="font-medium">{profile.full_name || 'User'}</span>
            <Badge variant="outline" className="text-xs capitalize">{profile.role}</Badge>
            <Link to="/settings/profile" className="text-xs text-primary underline">Profile</Link>
          </div>
        )}
      </div>
    </div>
  );
}
