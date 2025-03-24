'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/context/AuthContext';
import { signOut } from '@/lib/auth';
import { createOrUpdateUserDocument, ensureCompleteUserDocument } from '@/lib/services/userService';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Link from 'next/link';

interface UserProfile {
  id: string;
  username: string;
  email: string;
  profilePicture: string;
  startingWeight: number | null;
  currentWeight: number | null;
  fitnessGoals: string[];
  friendIds: string[];
  groupIds: string[];
  privacySettings: {
    shareWeight: boolean;
    sharePhotos: boolean;
    shareAttendance: boolean;
  };
  createdAt: any; // Firebase timestamp
  lastActive: any; // Firebase timestamp
  pushNotificationEnabled: boolean;
  pushSubscription: any;
  authProvider: string;
  emailVerified: boolean;
}

export default function Profile() {
  const { user, loading } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creatingProfile, setCreatingProfile] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!user) return;

      try {
        // First ensure the user document is complete
        await ensureCompleteUserDocument(user);
        
        // Then fetch the user document
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        
        if (userDoc.exists()) {
          setProfile(userDoc.data() as UserProfile);
        } else {
          console.warn(`User profile not found for user ${user.uid}, will create one`);
          setError('User profile not found. Creating a new profile...');
          
          // Use the user service to create a profile with force update
          setCreatingProfile(true);
          await createOrUpdateUserDocument(
            user, 
            user.displayName || `user_${user.uid.substring(0, 6)}`,
            true
          );
          
          // Fetch the newly created profile
          const newUserDoc = await getDoc(doc(db, 'users', user.uid));
          if (newUserDoc.exists()) {
            setProfile(newUserDoc.data() as UserProfile);
            setError(null);
          }
        }
      } catch (err) {
        console.error('Error fetching user profile:', err);
        setError('Failed to load profile');
      } finally {
        setLoadingProfile(false);
        setCreatingProfile(false);
      }
    };

    if (!loading) {
      fetchUserProfile();
    }
  }, [user, loading]);

  const handleSignOut = async () => {
    try {
      await signOut();
      // Redirect will be handled by ProtectedRoute
    } catch (err) {
      console.error('Error signing out:', err);
      setError('Failed to sign out');
    }
  };

  if (loading || loadingProfile || creatingProfile) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-gray-900"></div>
        {creatingProfile && <p className="ml-4 text-lg text-gray-700">Creating your profile...</p>}
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative max-w-md w-full" role="alert">
          <strong className="font-bold">Error!</strong>
          <span className="block sm:inline"> You need to be signed in to view this page.</span>
        </div>
        <button
          onClick={() => router.push('/auth/signin')}
          className="mt-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
        >
          Go to Sign In
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      {error && (
        <div className="max-w-2xl mx-auto mb-4 bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Notice: </strong>
          <span className="block sm:inline">{error}</span>
        </div>
      )}
      
      <div className="max-w-2xl mx-auto">
        {/* Back button */}
        <Link 
          href="/"
          className="inline-flex items-center mb-4 px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
          </svg>
          Back to Home
        </Link>
        
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-8">
            <div className="text-center mb-8">
              <div className="h-32 w-32 rounded-full bg-indigo-100 flex items-center justify-center mx-auto mb-4 overflow-hidden">
                {profile?.profilePicture ? (
                  <img 
                    src={profile.profilePicture} 
                    alt={profile.username} 
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <svg className="h-20 w-20 text-indigo-500" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                )}
              </div>
              <h1 className="text-2xl font-bold text-gray-900">{profile?.username || user.displayName}</h1>
              <p className="text-gray-600">{profile?.email || user.email}</p>
            </div>

            <div className="border-t border-gray-200 pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h2 className="text-lg font-semibold text-gray-700 mb-2">Weight Information</h2>
                  <div className="text-gray-600">
                    <p>Starting Weight: {profile?.startingWeight ? `${profile.startingWeight} kg` : 'Not set'}</p>
                    <p>Current Weight: {profile?.currentWeight ? `${profile.currentWeight} kg` : 'Not set'}</p>
                  </div>
                </div>
                
                <div className="bg-gray-50 rounded-lg p-4">
                  <h2 className="text-lg font-semibold text-gray-700 mb-2">Account Information</h2>
                  <div className="text-gray-600">
                    <p>Account Created: {profile?.createdAt && profile.createdAt.toDate ? new Date(profile.createdAt.toDate()).toLocaleDateString() : 'Just now'}</p>
                    <p>Email Verified: {user.emailVerified ? 'Yes' : 'No'}</p>
                    <p>Auth Provider: {profile?.authProvider || user.providerData[0]?.providerId || 'Unknown'}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 flex justify-center">
              <button
                onClick={handleSignOut}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 