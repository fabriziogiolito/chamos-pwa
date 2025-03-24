'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/context/AuthContext';
import { sendEmailVerification, signOut, getCurrentUser } from '@/lib/auth';

export default function VerifyEmail() {
  const { user, loading } = useAuth();
  const [resendDisabled, setResendDisabled] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const router = useRouter();

  // Effect to handle countdown for resend button
  useEffect(() => {
    if (countdown === 0) {
      setResendDisabled(false);
      return;
    }

    const timer = setTimeout(() => {
      setCountdown(countdown - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [countdown]);

  // Function to handle resending verification email
  const handleResendVerification = async () => {
    setResendDisabled(true);
    setCountdown(60); // Disable resend for 60 seconds
    setMessage(null);

    try {
      const currentUser = getCurrentUser();
      if (currentUser) {
        await sendEmailVerification(currentUser);
        setMessage({
          type: 'success',
          text: 'Verification email sent! Please check your inbox.'
        });
      } else {
        setMessage({
          type: 'error',
          text: 'No user is currently signed in.'
        });
      }
    } catch (error: any) {
      console.error('Error sending verification email:', error);
      setMessage({
        type: 'error',
        text: `Failed to send verification email: ${error.message}`
      });
    }
  };

  // Function to handle sign out
  const handleSignOut = async () => {
    await signOut();
    router.push('/auth/signin');
  };

  // Function to check if email is verified
  const checkEmailVerification = async () => {
    try {
      const currentUser = getCurrentUser();
      if (currentUser) {
        // Reload user to get fresh data from Firebase
        await currentUser.reload();
        
        if (currentUser.emailVerified) {
          setMessage({
            type: 'success',
            text: 'Email verified! Redirecting to home...'
          });
          
          // Short delay before redirect for better UX
          setTimeout(() => {
            router.push('/');
          }, 1500);
        } else {
          setMessage({
            type: 'error',
            text: 'Email is not verified yet. Please check your inbox.'
          });
        }
      }
    } catch (error: any) {
      console.error('Error checking email verification:', error);
      setMessage({
        type: 'error',
        text: `Failed to check verification status: ${error.message}`
      });
    }
  };

  // If no user or loading, show loading spinner
  if (loading || !user) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-lg shadow-md">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Verify Your Email
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            We've sent a verification email to <span className="font-medium">{user.email}</span>
          </p>
          <p className="mt-2 text-center text-sm text-gray-600">
            Please check your inbox and click the verification link to continue.
          </p>
        </div>

        {message && (
          <div 
            className={`${
              message.type === 'success' ? 'bg-green-100 border-green-400 text-green-700' : 'bg-red-100 border-red-400 text-red-700'
            } px-4 py-3 rounded relative border`} 
            role="alert"
          >
            <span className="block sm:inline">{message.text}</span>
          </div>
        )}

        <div className="flex flex-col space-y-4">
          <button
            onClick={checkEmailVerification}
            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            I've Verified My Email
          </button>

          <button
            onClick={handleResendVerification}
            disabled={resendDisabled}
            className="group relative w-full flex justify-center py-2 px-4 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            {resendDisabled 
              ? `Resend Email (${countdown}s)` 
              : 'Resend Verification Email'}
          </button>

          <button
            onClick={handleSignOut}
            className="group relative w-full flex justify-center py-2 px-4 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Sign Out
          </button>
        </div>

        <div className="mt-6 text-center text-sm">
          <p className="text-gray-600">
            If you're having trouble, please contact{' '}
            <a href="mailto:support@chamos.app" className="font-medium text-indigo-600 hover:text-indigo-500">
              support@chamos.app
            </a>
          </p>
        </div>
      </div>
    </div>
  );
} 