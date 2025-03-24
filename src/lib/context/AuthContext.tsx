'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from 'firebase/auth';
import { subscribeToAuthChanges } from '../auth';
import { updateUserLastActive, ensureCompleteUserDocument } from '../services/userService';
import { useNetwork } from './NetworkContext';

interface AuthContextType {
  user: User | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
});

export const useAuth = () => useContext(AuthContext);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { isOnline } = useNetwork();

  useEffect(() => {
    // Subscribe to auth state changes
    const unsubscribe = subscribeToAuthChanges(async (authUser) => {
      setUser(authUser);
      
      // Handle user document creation and management
      if (authUser) {
        try {
          // Always ensure the user has a complete document with all fields
          if (isOnline) {
            await ensureCompleteUserDocument(authUser);
          } else {
            console.log('User authenticated but device is offline. Will ensure complete document when online.');
          }
        } catch (error) {
          console.error('Error handling user document in auth state change:', error);
        }
      }
      
      setLoading(false);
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, [isOnline]);

  // When network status changes to online and we have a user, ensure complete user document
  useEffect(() => {
    if (isOnline && user) {
      ensureCompleteUserDocument(user).catch((error) => {
        console.error('Error ensuring complete user document on network change:', error);
      });
    }
  }, [isOnline, user]);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
}; 