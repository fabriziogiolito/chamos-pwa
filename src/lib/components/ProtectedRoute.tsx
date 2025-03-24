'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import { signOut } from '../auth';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Don't do anything while authentication is loading
    if (loading) return;

    // If the user is not authenticated and not on an auth page, redirect to signin
    if (!user && !pathname?.startsWith('/auth/')) {
      router.push('/auth/signin');
      return;
    }

    // If user is authenticated but email is not verified and not on verification page
    // and not on auth pages, redirect to verification page
    if (
      user && 
      !user.emailVerified && 
      user.providerData[0]?.providerId === 'password' && 
      pathname !== '/auth/verify-email' && 
      !pathname?.startsWith('/auth/')
    ) {
      router.push('/auth/verify-email');
      return;
    }

    // If user is authenticated and on an auth page (except verify-email), redirect to dashboard
    if (
      user && 
      pathname?.startsWith('/auth/') && 
      pathname !== '/auth/verify-email'
    ) {
      // If user needs verification, don't redirect away from auth pages
      if (
        !user.emailVerified && 
        user.providerData[0]?.providerId === 'password'
      ) {
        router.push('/auth/verify-email');
      } else {
        router.push('/');
      }
      return;
    }

    // If user is on verify-email page but is verified or using social login, redirect to home
    if (
      user && 
      pathname === '/auth/verify-email' && 
      (user.emailVerified || user.providerData[0]?.providerId !== 'password')
    ) {
      router.push('/');
      return;
    }
  }, [user, loading, router, pathname]);

  // Show nothing while checking authentication
  if (loading) {
    return <div className="flex h-screen w-full items-center justify-center">
      <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-gray-900"></div>
    </div>;
  }

  // Render children only if user is authenticated and verified (or using social login),
  // or if we're on an auth page, or on the verification page when needed
  if (
    (user && (user.emailVerified || user.providerData[0]?.providerId !== 'password')) || 
    pathname?.startsWith('/auth/') ||
    (user && !user.emailVerified && user.providerData[0]?.providerId === 'password' && pathname === '/auth/verify-email')
  ) {
    return <>{children}</>;
  }

  // Default case, show nothing while redirecting
  return <div className="flex h-screen w-full items-center justify-center">
    <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-gray-900"></div>
  </div>;
}; 