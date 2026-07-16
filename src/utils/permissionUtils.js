export function hasPermission(user, permission) {
  if (!user) return false;
  if (user.permissions?.includes('*')) return true;
  return user.permissions?.includes(permission);
}

export function hasRole(user, allowedRoles = []) {
  if (!user) return false;
  return allowedRoles.includes(user.role);
}

export function canAccessLocation(user, locationId) {
  if (!user) return false;
  if (user.locationIds?.includes('all')) return true;
  return user.locationIds?.includes(locationId);
}
