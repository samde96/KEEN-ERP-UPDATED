import { createContext, useEffect, useMemo, useState } from 'react';
import { catalogService } from '../services/catalogService';
import { useAuth } from '../hooks/useAuth';

export const BranchContext = createContext(null);

function isStoreLocation(location) {
  const normalized = String(location.type || '').toUpperCase().replace(/\s+/g, '_');
  return ['STORE', 'MAIN_WAREHOUSE', 'WAREHOUSE'].includes(normalized);
}

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
        if (!assignedLocations.length && ['ADMIN', 'STORE_MANAGER'].includes(user?.role)) {
          assignedLocations = rows.filter(isStoreLocation);
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
  }, [isAuthenticated, user?.locationIds]);

  const value = useMemo(
    () => ({
      locations,
      currentLocation,
      currentLocationId,
      setCurrentLocationId
    }),
    [currentLocation, currentLocationId]
  );

  return <BranchContext.Provider value={value}>{children}</BranchContext.Provider>;
}
