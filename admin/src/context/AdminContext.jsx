import React, { createContext, useEffect, useMemo, useState } from 'react';
import { useAuth, useUser } from '@clerk/clerk-react';
import { setAuthToken, setGetTokenFunction } from '../services/api';

export const AdminContext = createContext(null);

export function AdminProvider({ children }) {
  const { isLoaded, isSignedIn, user: clerkUser } = useUser();
  const { signOut, getToken } = useAuth();
  const [user, setUser] = useState(null);

  useEffect(() => {
    if (!getToken) {
      return;
    }

    setGetTokenFunction(getToken);

    getToken()
      .then((token) => {
        if (token) {
          setAuthToken(token);
        }
      })
      .catch(() => {
        setAuthToken(null);
      });
  }, [getToken]);

  useEffect(() => {
    if (!isLoaded) {
      return;
    }

    if (!isSignedIn || !clerkUser) {
      setUser(null);
      return;
    }

    setUser({
      _id: clerkUser.id,
      name: clerkUser.fullName || `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim() || 'Admin',
      email: clerkUser.primaryEmailAddress?.emailAddress || '',
      isAdmin: true,
      imageUrl: clerkUser.imageUrl,
    });
  }, [isLoaded, isSignedIn, clerkUser]);

  const logout = async () => {
    setAuthToken(null);
    setGetTokenFunction(null);
    setUser(null);
    await signOut({ redirectUrl: '/login' });
  };

  const value = useMemo(
    () => ({
      user,
      loading: !isLoaded,
      isAuthenticated: !!user,
      logout,
    }),
    [user, isLoaded],
  );

  return <AdminContext.Provider value={value}>{children}</AdminContext.Provider>;
}

