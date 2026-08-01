import { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import { authService } from '../services/authService';

export const AuthContext = createContext(null);

function clearLegacyStoredSession() {
  try {
    localStorage.removeItem('keen.inventory.session');
  } catch {
    // Ignore storage access failures; cookie session restore still decides auth state.
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    clearLegacyStoredSession();

    authService
      .session()
      .then((nextUser) => {
        if (active) {
          setUser(nextUser);
        }
      })
      .catch(() => {
        if (active) {
          setUser(null);
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  const signIn = useCallback(async (credentials) => {
    setLoading(true);
    try {
      const result = await authService.login(credentials);
      if (result?.mfaRequired) {
        setUser(null);
        return result;
      }

      setUser(result);
      return result;
    } finally {
      setLoading(false);
    }
  }, []);

  const completeMfaSignIn = useCallback(async (challenge) => {
    setLoading(true);
    try {
      const nextUser = await authService.completeMfaLogin(challenge);
      setUser(nextUser);
      return nextUser;
    } finally {
      setLoading(false);
    }
  }, []);

  const signOut = useCallback(async () => {
    await authService.logout();
    setUser(null);
  }, []);

  useEffect(() => {
    const handleExpired = () => {
      setUser(null);
    };

    window.addEventListener('auth:expired', handleExpired);
    return () => window.removeEventListener('auth:expired', handleExpired);
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      isAuthenticated: Boolean(user),
      signIn,
      completeMfaSignIn,
      signOut
    }),
    [completeMfaSignIn, loading, signIn, signOut, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
