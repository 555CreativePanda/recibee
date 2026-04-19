import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  orderBy, 
  limit, 
  startAfter, 
  doc, 
  getDoc, 
  setDoc, 
  deleteDoc, 
  runTransaction, 
  serverTimestamp,
  where,
  Timestamp
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { FeatureRequest, FeatureVote } from '../types';

const FEATURES_PER_PAGE = 10;

export const getFeatureRequests = async (lastVisible?: any) => {
  const path = 'feature_requests';
  try {
    let q = query(
      collection(db, path),
      orderBy('score', 'desc'),
      orderBy('created_at', 'desc'),
      limit(FEATURES_PER_PAGE)
    );

    if (lastVisible) {
      q = query(q, startAfter(lastVisible));
    }

    const snapshot = await getDocs(q);
    const features = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      created_at: (doc.data().created_at as Timestamp).toDate().toISOString()
    })) as FeatureRequest[];

    return {
      features,
      lastVisible: snapshot.docs[snapshot.docs.length - 1]
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    throw error;
  }
};

export const createFeatureRequest = async (title: string, description: string, userId: string, userEmail: string) => {
  const path = 'feature_requests';
  try {
    const featureData = {
      title,
      description,
      user_id: userId,
      user_email: userEmail,
      upvotes: 0,
      score: 0,
      created_at: serverTimestamp()
    };

    const docRef = await addDoc(collection(db, path), featureData);
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
    throw error;
  }
};

export const getUserVotesForFeatures = async (featureIds: string[], userId: string) => {
  if (featureIds.length === 0) return {};
  const path = 'feature_votes';
  try {
    // Firestore 'in' query supports up to 30 items
    const q = query(
      collection(db, path),
      where('user_id', '==', userId),
      where('feature_id', 'in', featureIds.slice(0, 30))
    );
    const snapshot = await getDocs(q);
    const votes: Record<string, FeatureVote> = {};
    snapshot.forEach(doc => {
      const data = doc.data() as FeatureVote;
      votes[data.feature_id] = data;
    });
    return votes;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    throw error;
  }
};

export const getUserVote = async (featureId: string, userId: string) => {
  const voteId = `${userId}_${featureId}`;
  const path = `feature_votes/${voteId}`;
  try {
    const voteDoc = await getDoc(doc(db, 'feature_votes', voteId));
    if (voteDoc.exists()) {
      return voteDoc.data() as FeatureVote;
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
    throw error;
  }
};

export const voteOnFeature = async (featureId: string, userId: string, voteType: 'up' | null) => {
  const voteId = `${userId}_${featureId}`;
  const featureRef = doc(db, 'feature_requests', featureId);
  const voteRef = doc(db, 'feature_votes', voteId);

  try {
    await runTransaction(db, async (transaction) => {
      const featureDoc = await transaction.get(featureRef);
      if (!featureDoc.exists()) throw new Error("Feature request does not exist");

      const existingVoteDoc = await transaction.get(voteRef);
      const existingVote = existingVoteDoc.exists() ? existingVoteDoc.data() as FeatureVote : null;

      let upvotes = featureDoc.data().upvotes || 0;

      // Remove existing vote impact
      if (existingVote) {
        if (existingVote.type === 'up') upvotes--;
        transaction.delete(voteRef);
      }

      // Add new vote impact if not just removing
      if (voteType === 'up') {
        upvotes++;
        
        transaction.set(voteRef, {
          feature_id: featureId,
          user_id: userId,
          type: 'up',
          created_at: serverTimestamp()
        });
      }

      transaction.update(featureRef, {
        upvotes,
        score: upvotes // Score is now just upvotes
      });
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `feature_requests/${featureId} + feature_votes/${voteId}`);
    throw error;
  }
};

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

import { auth as firebaseAuth } from '../lib/firebase';
import { safeStringify } from '../lib/utils';

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: firebaseAuth.currentUser?.uid,
      email: firebaseAuth.currentUser?.email,
      emailVerified: firebaseAuth.currentUser?.emailVerified,
      isAnonymous: firebaseAuth.currentUser?.isAnonymous,
      tenantId: firebaseAuth.currentUser?.tenantId,
      providerInfo: firebaseAuth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', safeStringify(errInfo));
  throw new Error(safeStringify(errInfo));
}
