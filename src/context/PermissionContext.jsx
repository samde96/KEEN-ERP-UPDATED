import { createContext, useMemo } from 'react';
import { hasPermission, hasRole } from '../utils/permissionUtils';
import { useAuth } from '../hooks/useAuth';

export const PermissionContext = createContext(null);

export function PermissionProvider({ children }) {
  const { user } = useAuth();

  const value = useMemo(
    () => ({
      can: (permission) => hasPermission(user, permission),
      is: (roles) => hasRole(user, roles),
      permissions: user?.permissions || []
    }),
    [user]
  );

  return <PermissionContext.Provider value={value}>{children}</PermissionContext.Provider>;
}
