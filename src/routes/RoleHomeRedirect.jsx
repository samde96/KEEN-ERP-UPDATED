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

export function RoleHomeRedirect() {
  const { user } = useAuth();
  return <Navigate to={roleHome[user?.role] || '/login'} replace />;
}
