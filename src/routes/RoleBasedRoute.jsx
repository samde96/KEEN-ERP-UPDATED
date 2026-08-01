import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { hasRole } from '../utils/permissionUtils';

export function RoleBasedRoute({ allowedRoles }) {
  const { user } = useAuth();

  if (!hasRole(user, allowedRoles)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <Outlet />;
}
