import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  confirmPasswordReset,
  onAuthStateChanged,
  User,
} from "firebase/auth";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { getAuth, getDb } from "./config";

export type UserType = "therapist" | "organizer" | "admin";

export interface UserProfile {
  uid: string;
  email: string;
  fullName: string;
  phone?: string;
  userType: UserType;
  isAdmin: boolean;
  onboardingComplete: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Sign up with email and password
export async function signUp(
  email: string,
  password: string,
  fullName: string,
  userType: UserType
) {
  const auth = getAuth();
  const db = getDb();
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const user = userCredential.user;

  // Create user profile in Firestore
  await setDoc(doc(db, "users", user.uid), {
    email,
    fullName,
    userType,
    isAdmin: false,
    onboardingComplete: false,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return user;
}

// Sign in with email and password
export async function signIn(email: string, password: string) {
  const auth = getAuth();
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  return userCredential.user;
}

// Sign out
export async function signOut() {
  const auth = getAuth();
  await firebaseSignOut(auth);
}

// Send password reset email
export async function resetPassword(email: string) {
  const auth = getAuth();
  await sendPasswordResetEmail(auth, email);
}

// Confirm password reset with code
export async function confirmReset(code: string, newPassword: string) {
  const auth = getAuth();
  await confirmPasswordReset(auth, code, newPassword);
}

// Get user profile from Firestore
export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const db = getDb();
  const docRef = doc(db, "users", uid);
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    const data = docSnap.data();
    return {
      uid,
      email: data.email,
      fullName: data.fullName,
      phone: data.phone,
      userType: data.userType,
      isAdmin: data.isAdmin || false,
      onboardingComplete: data.onboardingComplete || false,
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date(),
    };
  }

  return null;
}

// Auth state observer
export function onAuthChange(callback: (user: User | null) => void) {
  const auth = getAuth();
  return onAuthStateChanged(auth, callback);
}

// Get current user
export function getCurrentUser(): User | null {
  const auth = getAuth();
  return auth?.currentUser || null;
}
