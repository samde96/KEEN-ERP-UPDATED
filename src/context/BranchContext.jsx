import { createContext, useEffect, useMemo, useState } from 'react';
import { catalogService } from '../services/catalogService';
import { useAuth } from '../hooks/useAuth';
import { isOperationalStockLocation, isShopLocation } from '../utils/locationTypes';
import { hasRole } from '../utils/permissionUtils';

export const BranchContext = createContext(null);

export function BranchProvider({ children }) {
  const { isAuthenticated, user } = useAuth();
  const [locations, setLocations] = useState([]);
  const [currentLocationId, setCurrentLocationId] = useState('');
  const currentLocation = locations.find((location) => location.id === currentLocationId) || locations[0] || null;

  useEffect(() => {
    let mounted = true;

    if (!isAuthenticated) {
      setLocations([]);
      setCurrentLocationId('');
      return () => {
        mounted = false;
      };
    }

    catalogService
      .locations()
      .then((rows) => {
        if (!mounted) return;
        const assignedLocationIds = new Set((user?.locationIds || []).map(String));
        let assignedLocations = assignedLocationIds.size
          ? rows.filter((location) => assignedLocationIds.has(String(location.id)))
          : [];
        if (!assignedLocations.length && hasRole(user, ['ADMIN', 'STORE_MANAGER'])) {
          assignedLocations = rows.filter(isOperationalStockLocation);
        }
        if (!assignedLocations.length && hasRole(user, ['SHOP_MANAGER'])) {
          assignedLocations = rows.filter(isShopLocation);
        }

        setLocations(assignedLocations);
        setCurrentLocationId((current) => (assignedLocations.some((location) => location.id === current) ? current : assignedLocations[0]?.id || ''));
      })
      .catch(() => {
        if (!mounted) return;
        setLocations([]);
        setCurrentLocationId('');
      });

    return () => {
      mounted = false;
    };
  }, [isAuthenticated, user]);

  const value = useMemo(
    () => ({
      locations,
      currentLocation,
      currentLocationId,
      setCurrentLocationId
    }),
    [currentLocation, currentLocationId, locations]
  );

  return <BranchContext.Provider value={value}>{children}</BranchContext.Provider>;
}
