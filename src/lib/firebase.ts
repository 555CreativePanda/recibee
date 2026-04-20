import { initializeApp } from 'firebase/app';
import { 
  initializeAuth,
  browserLocalPersistence,
  browserPopupRedirectResolver,
  indexedDBLocalPersistence,
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged, 
  User,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  updateProfile
} from 'firebase/auth';
import { initializeFirestore, setLogLevel } from 'firebase/firestore';

// Suppress benign transport-level warnings from Firestore SDK that can cause 
// circular reference errors in some terminal/logging environments.
setLogLevel('error');

import firebaseConfigLocal from '@/firebase-applet-config.json';

// Use environment variables for configuration to avoid exposing secrets
// and to support deployments where the config file is ignored.
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || firebaseConfigLocal.apiKey,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || firebaseConfigLocal.authDomain,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || firebaseConfigLocal.projectId,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || firebaseConfigLocal.storageBucket,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || firebaseConfigLocal.messagingSenderId,
  appId: import.meta.env.VITE_FIREBASE_APP_ID || firebaseConfigLocal.appId,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || firebaseConfigLocal.measurementId,
  firestoreDatabaseId: import.meta.env.VITE_FIREBASE_DATABASE_ID || firebaseConfigLocal.firestoreDatabaseId || '(default)'
};

// Global flag to check if the app is properly configured
export const isConfigValid = !!(firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.appId);

// Only initialize if we have at least the critical keys to prevent "invalid-api-key" fatal errors on load
const app = isConfigValid ? initializeApp(firebaseConfig) : initializeApp({ apiKey: "temporary-placeholder", projectId: "placeholder" });

// Use initializeAuth with explicit persistence for maximum reliability in sandboxed environments
export const auth = initializeAuth(app, {
  persistence: [indexedDBLocalPersistence, browserLocalPersistence],
  popupRedirectResolver: browserPopupRedirectResolver,
});

// Use initializeFirestore with long polling for better reliability in sandboxed environments
// specifically to avoid 10s connection timeouts in restricted iframes.
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
  experimentalAutoDetectLongPolling: false, // Force it explicitly without trying others first
}, firebaseConfig.firestoreDatabaseId);

console.log('Active Firestore Database ID:', firebaseConfig.firestoreDatabaseId);

export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

if (isConfigValid) {
  console.log('Firebase initialized with Project ID:', firebaseConfig.projectId);
} else {
  console.warn('Firebase is NOT fully configured. Check VITE_FIREBASE_* environment variables.');
}

export { 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  updateProfile
};
export type { User };
