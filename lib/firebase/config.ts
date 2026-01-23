import { initializeApp, getApps, FirebaseApp } from "firebase/app";
import { getAuth as getFirebaseAuth, Auth } from "firebase/auth";
import { getFirestore as getFirebaseFirestore, Firestore } from "firebase/firestore";
import { getStorage as getFirebaseStorage, FirebaseStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "placeholder",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "placeholder",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "placeholder",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "placeholder",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "placeholder",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "placeholder",
};

// Initialize Firebase (prevent re-initialization)
let app: FirebaseApp;
let auth: Auth;
let db: Firestore;
let storage: FirebaseStorage;

function initializeServices() {
  if (typeof window === 'undefined') {
    // During SSR/build, return dummy values
    return;
  }

  if (!app) {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
    auth = getFirebaseAuth(app);
    db = getFirebaseFirestore(app);
    storage = getFirebaseStorage(app);
  }
}

// Getter functions that initialize on first access
export function getApp(): FirebaseApp {
  initializeServices();
  return app;
}

export function getAuth(): Auth {
  initializeServices();
  return auth;
}

export function getDb(): Firestore {
  initializeServices();
  return db;
}

export function getStorage(): FirebaseStorage {
  initializeServices();
  return storage;
}

// For backwards compatibility - these now call the getters
export { getApp as app, getAuth as authInstance, getDb as dbInstance, getStorage as storageInstance };
