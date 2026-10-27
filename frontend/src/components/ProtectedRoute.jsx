import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * Protects a route from unauthenticated access.
 * Optionally restricts to specific roles.
 */
export function ProtectedRoute({ children, roles }) {
  const { isAuthenticated, role, loading, profile } = useAuth();
  const location = useLocation();

  if (loading || (isAuthenticated && !profile)) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-4 border-sky-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (roles && !roles.includes(role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
}
