import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface ProtectedRouteProps {
  children: ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">جاري التحميل...</div>
      </div>
    );
  }

  if (!user) {
    // Save the current path to redirect back after login
    const redirectPath = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/auth?redirect=${redirectPath}`} replace />;
  }

  return <>{children}</>;
}
