export function hasPermission(user, permission) {
  if (!user) return false;
  if (user.permissions?.includes('*')) return true;
  return user.permissions?.includes(permission);
}

export function userRoleNames(user) {
  if (!user) return [];
  if (Array.isArray(user.roles) && user.roles.length) {
    return user.roles;
  }
  return user.role ? [user.role] : [];
}

export function hasRole(user, allowedRoles = []) {
  if (!user) return false;
  const allowedRoleList = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
  return userRoleNames(user).some((role) => allowedRoleList.includes(role));
}

export function canAccessLocation(user, locationId) {
  if (!user) return false;
  if (user.locationIds?.includes('all')) return true;
  return user.locationIds?.includes(locationId);
}
