import { 
  doc, 
  setDoc, 
  getDoc, 
  collection,
  query,
  where, 
  serverTimestamp, 
  writeBatch 
} from 'firebase/firestore';
import { db } from '../firebase';
import { User } from 'firebase/auth';

// Interface for operations to be queued
interface QueuedOperation {
  type: 'create' | 'update';
  userId: string;
  data: any;
  timestamp: number;
}

// Queue for operations when offline
const operationQueue: QueuedOperation[] = [];

// Load any saved operations from localStorage
const loadQueuedOperations = () => {
  if (typeof window === 'undefined') return;
  
  try {
    const savedQueue = localStorage.getItem('firestore_operation_queue');
    if (savedQueue) {
      const parsedQueue = JSON.parse(savedQueue);
      operationQueue.push(...parsedQueue);
      console.log(`Loaded ${parsedQueue.length} queued operations`);
    }
  } catch (error) {
    console.error('Error loading queued operations:', error);
  }
};

// Save queued operations to localStorage
const saveQueuedOperations = () => {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem('firestore_operation_queue', JSON.stringify(operationQueue));
  } catch (error) {
    console.error('Error saving queued operations:', error);
  }
};

// Process the operation queue
export const processOperationQueue = async () => {
  if (operationQueue.length === 0) return;
  
  console.log(`Processing ${operationQueue.length} queued operations`);
  
  // Sort by timestamp (oldest first)
  operationQueue.sort((a, b) => a.timestamp - b.timestamp);
  
  // Use batch writes for efficiency
  const batch = writeBatch(db);
  const processedOps: number[] = [];
  
  for (let i = 0; i < operationQueue.length; i++) {
    const op = operationQueue[i];
    const docRef = doc(db, 'users', op.userId);
    
    try {
      if (op.type === 'create') {
        // For create operations, first check if the document exists
        const docSnap = await getDoc(docRef);
        if (!docSnap.exists()) {
          batch.set(docRef, op.data);
        } else {
          // Document already exists, skip this operation
          processedOps.push(i);
          continue;
        }
      } else if (op.type === 'update') {
        // For updates, we merge with existing data
        batch.set(docRef, { 
          ...op.data, 
          lastActive: serverTimestamp() 
        }, { merge: true });
      }
      
      processedOps.push(i);
    } catch (error) {
      console.error(`Error processing operation for user ${op.userId}:`, error);
    }
  }
  
  // Commit the batch
  try {
    await batch.commit();
    console.log(`Successfully processed ${processedOps.length} operations`);
    
    // Remove processed operations from the queue
    for (let i = processedOps.length - 1; i >= 0; i--) {
      operationQueue.splice(processedOps[i], 1);
    }
    
    // Update the saved queue
    saveQueuedOperations();
    
  } catch (error) {
    console.error('Error committing batch operations:', error);
  }
};

// Initialize online/offline event listeners
if (typeof window !== 'undefined') {
  loadQueuedOperations();
  
  window.addEventListener('online', () => {
    console.log('Device is back online, processing queued operations');
    processOperationQueue();
  });
}

// Create a standard user data object
export const createUserDataObject = (user: User, username: string) => {
  return {
    id: user.uid,
    username: username || user.displayName || `user_${user.uid.substring(0, 6)}`,
    email: user.email,
    profilePicture: user.photoURL || '',
    fitnessGoals: [],
    startingWeight: null,
    currentWeight: null,
    friendIds: [],
    groupIds: [],
    privacySettings: {
      shareWeight: false,
      sharePhotos: false,
      shareAttendance: true
    },
    createdAt: serverTimestamp(),
    lastActive: serverTimestamp(),
    pushNotificationEnabled: false,
    pushSubscription: null,
    authProvider: user.providerData[0]?.providerId || 'password',
    emailVerified: user.emailVerified
  };
};

// Create or update user document in Firestore
export const createOrUpdateUserDocument = async (
  user: User, 
  username: string, 
  forceUpdate: boolean = false
): Promise<void> => {
  const userData = createUserDataObject(user, username);
  
  try {
    const userRef = doc(db, 'users', user.uid);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      // Create new user document
      await setDoc(userRef, userData);
      console.log(`User document created for ${user.uid}`);
    } else if (forceUpdate) {
      // Force update all fields but keep the original createdAt
      const existingData = userDoc.data();
      const updatedData = {
        ...userData,
        createdAt: existingData.createdAt || serverTimestamp(),
      };
      
      await setDoc(userRef, updatedData);
      console.log(`User document force updated for ${user.uid}`);
    } else {
      // Just update the lastActive field
      await setDoc(userRef, { 
        lastActive: serverTimestamp(),
        // Always ensure email verification status is synced
        emailVerified: user.emailVerified
      }, { merge: true });
    }
  } catch (error: any) {
    // Handle offline scenario
    if (error.code === 'failed-precondition' || 
        error.message.includes('offline') || 
        error.message.includes('network')) {
      console.warn('Device appears to be offline, queueing user document operation');
      
      // Queue the operation for later
      const operation: QueuedOperation = {
        type: !forceUpdate ? 'update' : 'create',
        userId: user.uid,
        data: userData,
        timestamp: Date.now()
      };
      
      operationQueue.push(operation);
      saveQueuedOperations();
    } else {
      console.error('Error creating/updating user document:', error);
    }
  }
};

// Ensure user has a complete document
export const ensureCompleteUserDocument = async (user: User): Promise<void> => {
  try {
    const userRef = doc(db, 'users', user.uid);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      // Create new user document if none exists
      await createOrUpdateUserDocument(
        user, 
        user.displayName || `user_${user.uid.substring(0, 6)}`,
        true
      );
    } else {
      // Check if the document has all required fields
      const data = userDoc.data();
      const requiredFields = [
        'username', 'email', 'profilePicture', 
        'fitnessGoals', 'startingWeight', 'currentWeight',
        'friendIds', 'groupIds', 'privacySettings',
        'createdAt', 'authProvider'
      ];
      
      const missingFields = requiredFields.filter(field => data[field] === undefined);
      
      if (missingFields.length > 0) {
        console.warn(`User document missing fields: ${missingFields.join(', ')}. Fixing...`);
        await createOrUpdateUserDocument(
          user, 
          data.username || user.displayName || `user_${user.uid.substring(0, 6)}`,
          true
        );
      } else {
        // Just update lastActive and email verification status
        await setDoc(userRef, { 
          lastActive: serverTimestamp(),
          emailVerified: user.emailVerified
        }, { merge: true });
      }
    }
  } catch (error) {
    console.error('Error ensuring complete user document:', error);
  }
};

// Update user's lastActive timestamp
export const updateUserLastActive = async (userId: string): Promise<void> => {
  try {
    const userRef = doc(db, 'users', userId);
    await setDoc(userRef, { lastActive: serverTimestamp() }, { merge: true });
  } catch (error: any) {
    // Handle offline scenario
    if (error.code === 'failed-precondition' || 
        error.message.includes('offline') || 
        error.message.includes('network')) {
      console.warn('Device appears to be offline, queueing lastActive update');
      
      // Queue the operation for later
      const operation: QueuedOperation = {
        type: 'update',
        userId,
        data: { lastActive: new Date() },
        timestamp: Date.now()
      };
      
      operationQueue.push(operation);
      saveQueuedOperations();
    } else {
      console.error('Error updating lastActive timestamp:', error);
    }
  }
}; 