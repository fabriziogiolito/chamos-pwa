'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/context/AuthContext';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { ensureCompleteUserDocument } from '@/lib/services/userService';

export default function Home() {
  const { user, loading } = useAuth();
  const [checkedUser, setCheckedUser] = useState(false);

  // Effect to check if user exists in Firestore and create if not
  useEffect(() => {
    const checkUserDocument = async () => {
      if (user && !checkedUser) {
        try {
          // Use our improved function to ensure the user document is complete
          await ensureCompleteUserDocument(user);
          console.log('User document verified/created successfully from homepage');
        } catch (error) {
          console.error('Error checking/creating user document:', error);
        } finally {
          setCheckedUser(true);
        }
      }
    };

    if (!loading && user) {
      checkUserDocument();
    }
  }, [user, loading, checkedUser]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-6 md:p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm">
        <div className="w-full flex justify-between items-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold">Welcome to Chamos</h1>
          {!loading && user && (
            <Link 
              href="/profile" 
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
            >
              My Profile
            </Link>
          )}
        </div>
        
        <p className="text-lg md:text-xl mb-4">Your Social Fitness Journey Starts Here</p>

        {!loading && !user ? (
          <div className="mt-6 mb-8 flex gap-4">
            <Link 
              href="/auth/signin" 
              className="bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-6 rounded-lg font-semibold transition-colors"
            >
              Sign In
            </Link>
            <Link 
              href="/auth/signup" 
              className="bg-white border border-indigo-600 text-indigo-600 hover:bg-indigo-50 py-2 px-6 rounded-lg font-semibold transition-colors"
            >
              Sign Up
            </Link>
          </div>
        ) : null}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-8">
          <div className="p-6 bg-white rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-2">Track Progress</h2>
            <p>Log your workouts, weight, and measurements</p>
          </div>
          <div className="p-6 bg-white rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-2">Connect with Friends</h2>
            <p>Share your journey and motivate each other</p>
          </div>
          <div className="p-6 bg-white rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-2">Set Goals</h2>
            <p>Create and track your fitness goals</p>
          </div>
        </div>
      </div>
    </main>
  );
}
