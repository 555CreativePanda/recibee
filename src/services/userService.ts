import { db, auth as firebaseAuth } from '../lib/firebase';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { UserProfile } from '../types';
import { handleFirestoreError, OperationType } from '../lib/firestoreUtils';
import { safeStringify } from '../lib/utils';

// Simple cache for user profiles
const profileCache: Record<string, { data: UserProfile; timestamp: number }> = {};
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export const getUserProfile = async (uid: string, forceRefresh = false): Promise<UserProfile | null> => {
  const path = `users/${uid}`;
  
  // Check cache
  const now = Date.now();
  if (!forceRefresh && profileCache[uid] && (now - profileCache[uid].timestamp < CACHE_TTL)) {
    return profileCache[uid].data;
  }

  try {
    const docSnap = await getDoc(doc(db, 'users', uid));
    if (docSnap.exists()) {
      const data = docSnap.data() as UserProfile;
      
      // If this is the current user, also try to fetch private email
      if (firebaseAuth.currentUser?.uid === uid) {
        try {
          const privateSnap = await getDoc(doc(db, 'users', uid, 'private', 'data'));
          if (privateSnap.exists()) {
            data.email = privateSnap.data().email;
          }
        } catch (e) {
          console.warn('Could not fetch private user data', e);
        }
      }
      
      // Update cache
      profileCache[uid] = { data, timestamp: Date.now() };
      
      return data;
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
    return null;
  }
};

export const updateUserProfile = async (uid: string, data: Partial<UserProfile>) => {
  const path = `users/${uid}`;
  try {
    const userRef = doc(db, 'users', uid);
    const docSnap = await getDoc(userRef);
    
    // Separate public and private data
    const { email, ...publicData } = data;

    if (docSnap.exists()) {
      await updateDoc(userRef, {
        ...publicData,
        updated_at: serverTimestamp()
      });
    } else {
      await setDoc(userRef, {
        uid,
        displayName: publicData.displayName || null,
        photoURL: publicData.photoURL || null,
        bio: publicData.bio || null,
        updated_at: serverTimestamp()
      });
    }

    // Update private email if provided
    if (email) {
      await setDoc(doc(db, 'users', uid, 'private', 'data'), { email }, { merge: true });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
};
