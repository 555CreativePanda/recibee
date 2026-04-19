import { initializeApp } from 'firebase/app';
import { 
  getAuth,
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
import { getFirestore } from 'firebase/firestore';

// Use environment variables for configuration to avoid exposing secrets
// and to support deployments where the config file is ignored.
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
  firestoreDatabaseId: import.meta.env.VITE_FIREBASE_DATABASE_ID || '(default)'
};

// Global flag to check if the app is properly configured
export const isConfigValid = !!(firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.appId);

// Only initialize if we have at least the critical keys to prevent "invalid-api-key" fatal errors on load
const app = isConfigValid ? initializeApp(firebaseConfig) : initializeApp({ apiKey: "temporary-placeholder-to-prevent-crash", projectId: "placeholder" });

// Use initializeAuth with explicit persistence for maximum reliability in sandboxed environments
export const auth = initializeAuth(app, {
  persistence: [indexedDBLocalPersistence, browserLocalPersistence],
  popupRedirectResolver: browserPopupRedirectResolver,
});

export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

// Connection test as per critical guidelines
import { getDocFromServer, doc } from 'firebase/firestore';
async function testConnection() {
  if (!isConfigValid) return;
  try {
    console.log('Testing Firestore connectivity...');
    await getDocFromServer(doc(db, '_internal_', 'connectivity_test'));
    console.log('Firestore connection verified.');
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('CRITICAL: Firestore is offline. Check authorized domains.');
    }
  }
}
testConnection();

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
