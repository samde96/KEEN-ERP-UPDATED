import { Navigate } from 'react-router-dom';
import { ROLES } from '../data/roles';
import { useAuth } from '../hooks/useAuth';

const roleHome = {
  [ROLES.ADMIN]: '/admin/dashboard',
  [ROLES.STORE_MANAGER]: '/warehouse/dashboard',
  [ROLES.SHOP_MANAGER]: '/shop/dashboard',
  [ROLES.CASHIER]: '/pos/checkout',
  [ROLES.AUDITOR]: '/reports'
};

const homeRolePriority = [ROLES.ADMIN, ROLES.STORE_MANAGER, ROLES.SHOP_MANAGER, ROLES.CASHIER, ROLES.AUDITOR];

export function RoleHomeRedirect() {
  const { user } = useAuth();
  const roles = Array.isArray(user?.roles) && user.roles.length ? user.roles : [user?.role].filter(Boolean);
  const homeRole = homeRolePriority.find((role) => roles.includes(role));
  return <Navigate to={roleHome[homeRole] || '/login'} replace />;
}
