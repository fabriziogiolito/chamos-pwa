import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup,
  User,
  onAuthStateChanged,
  sendEmailVerification as firebaseSendEmailVerification,
} from 'firebase/auth';
import { auth, db } from './firebase';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { createOrUpdateUserDocument, updateUserLastActive, ensureCompleteUserDocument } from './services/userService';

export interface AuthError {
  code: string;
  message: string;
}

// Send email verification
export const sendEmailVerification = async (user: User): Promise<void> => {
  try {
    await firebaseSendEmailVerification(user);
  } catch (error: any) {
    console.error('Error sending verification email:', error);
    throw error;
  }
};

// Create a new user with email and password
export const registerWithEmail = async (
  email: string,
  password: string,
  username: string
): Promise<User | AuthError> => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const { user } = userCredential;

    // Update the user's profile with their username
    await updateProfile(user, {
      displayName: username,
    });
    
    // Send email verification
    try {
      await sendEmailVerification(user);
      console.log('Verification email sent');
    } catch (verificationError: any) {
      console.error('Error sending verification email:', verificationError);
      // Continue with registration even if verification email fails
    }

    // Create a user document in Firestore using the service
    // Force update to ensure all fields are created
    await createOrUpdateUserDocument(user, username, true);
    
    return user;
  } catch (error: any) {
    console.error('Error registering user:', error);
    return {
      code: error.code || 'unknown',
      message: error.message || 'An unknown error occurred',
    };
  }
};

// Sign in with email and password
export const loginWithEmail = async (
  email: string,
  password: string
): Promise<User | AuthError> => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    
    // Ensure user document is complete after login
    try {
      await ensureCompleteUserDocument(userCredential.user);
    } catch (docError) {
      console.error('Error ensuring user document completeness:', docError);
      // Continue with login even if document update fails
    }
    
    return userCredential.user;
  } catch (error: any) {
    console.error('Error signing in:', error);
    return {
      code: error.code || 'unknown',
      message: error.message || 'An unknown error occurred',
    };
  }
};

// Sign in with Google
export const loginWithGoogle = async (): Promise<User | AuthError> => {
  try {
    const provider = new GoogleAuthProvider();
    const userCredential = await signInWithPopup(auth, provider);
    
    // Check if this is a new user
    const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));
    
    if (!userDoc.exists()) {
      // Create a user document for new Google sign-ins using the service
      // Force update to ensure all fields are created
      await createOrUpdateUserDocument(
        userCredential.user, 
        userCredential.user.displayName || `user_${userCredential.user.uid.substring(0, 6)}`,
        true
      );
    } else {
      // Ensure the document is complete
      await ensureCompleteUserDocument(userCredential.user);
    }
    
    return userCredential.user;
  } catch (error: any) {
    console.error('Error signing in with Google:', error);
    return {
      code: error.code || 'unknown',
      message: error.message || 'An unknown error occurred',
    };
  }
};

// Sign out
export const signOut = async (): Promise<void> => {
  try {
    await firebaseSignOut(auth);
  } catch (error) {
    console.error('Error signing out:', error);
    throw error;
  }
};

// Subscribe to auth state changes
export const subscribeToAuthChanges = (
  callback: (user: User | null) => void
): (() => void) => {
  return onAuthStateChanged(auth, callback);
};

// Reset password
export const resetPassword = async (email: string): Promise<void | AuthError> => {
  try {
    await sendPasswordResetEmail(auth, email);
  } catch (error: any) {
    console.error('Error resetting password:', error);
    return {
      code: error.code || 'unknown',
      message: error.message || 'An unknown error occurred',
    };
  }
};

// Get current user
export const getCurrentUser = (): User | null => {
  return auth.currentUser;
}; 