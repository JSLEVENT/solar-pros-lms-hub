import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: string | string[]; // can be single or list
}

export const ProtectedRoute = ({ children, requiredRole }: ProtectedRouteProps) => {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (!loading && user && profile && requiredRole) {
      const allowedRoles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
      const isAllowed = allowedRoles.includes(profile.role) || profile.role === 'admin' || profile.role === 'owner';
      if (!isAllowed) navigate('/');
    }
  }, [user, profile, loading, requiredRole, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  if (requiredRole && profile) {
    const allowedRoles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
    const isAllowed = allowedRoles.includes(profile.role) || profile.role === 'admin' || profile.role === 'owner';
    if (!isAllowed) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-destructive mb-2">Access Denied</h2>
          <p className="text-muted-foreground">You don't have permission to access this page.</p>
        </div>
      </div>
    );
    }
  }

  return <>{children}</>;
};