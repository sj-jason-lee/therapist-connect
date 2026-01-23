import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
  serverTimestamp,
  Timestamp,
  deleteDoc,
} from "firebase/firestore";
import { getDb } from "./config";

// Helper to get db instance
const db = () => getDb();

// ============================================
// TYPES
// ============================================

export type UserType = "therapist" | "organizer" | "admin";
export type OrganizationType = "youth_league" | "school" | "tournament" | "corporate" | "other";
export type EventType = "tournament" | "game" | "practice" | "corporate" | "other";
export type ShiftStatus = "open" | "filled" | "completed" | "cancelled";
export type ApplicationStatus = "pending" | "accepted" | "rejected" | "withdrawn";
export type BookingStatus = "confirmed" | "checked_in" | "checked_out" | "completed" | "cancelled" | "disputed";
export type DocumentType = "cata_card" | "insurance_certificate" | "bls_certificate" | "profile_photo";

export interface UserProfile {
  uid: string;
  email: string;
  fullName: string;
  phone?: string;
  userType: UserType;
  isAdmin: boolean;
  onboardingComplete: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface TherapistProfile {
  odUid: string;
  city: string;
  province: string;
  postalCode: string;
  travelRadiusKm: number;
  hourlyRateMin: number;
  hourlyRateMax?: number;
  bio?: string;
  cataNumber?: string;
  cataExpiry?: Timestamp;
  insuranceProvider?: string;
  insurancePolicyNumber?: string;
  insuranceExpiry?: Timestamp;
  blsExpiry?: Timestamp;
  profilePhotoUrl?: string;
  credentialsVerified: boolean;
  onboardingComplete: boolean;
  stripeAccountId?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface OrganizerProfile {
  odUid: string;
  organizationName: string;
  organizationType: OrganizationType;
  address?: string;
  city: string;
  province: string;
  postalCode: string;
  stripeCustomerId?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface Shift {
  id: string;
  organizerId: string;
  title: string;
  description?: string;
  eventType: EventType;
  sport?: string;
  venueName?: string;
  address?: string;
  city: string;
  province: string;
  postalCode?: string;
  latitude?: number;
  longitude?: number;
  date: Timestamp;
  startTime: string;
  endTime: string;
  hourlyRate: number;
  therapistsNeeded: number;
  equipmentProvided?: string;
  specialRequirements?: string;
  status: ShiftStatus;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface Application {
  id: string;
  shiftId: string;
  therapistId: string;
  status: ApplicationStatus;
  message?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface Booking {
  id: string;
  shiftId: string;
  therapistId: string;
  applicationId: string;
  status: BookingStatus;
  checkInTime?: Timestamp;
  checkOutTime?: Timestamp;
  hoursWorked?: number;
  amountDue?: number;
  platformFee?: number;
  therapistPayout?: number;
  stripePaymentIntentId?: string;
  stripeTransferId?: string;
  paidAt?: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface CredentialDocument {
  id: string;
  therapistId: string;
  documentType: DocumentType;
  fileUrl: string;
  uploadedAt: Timestamp;
  verifiedAt?: Timestamp;
  verifiedBy?: string;
}

// ============================================
// USER PROFILE FUNCTIONS
// ============================================

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const docRef = doc(db(), "users", uid);
  const docSnap = await getDoc(docRef);
  return docSnap.exists() ? ({ uid, ...docSnap.data() } as UserProfile) : null;
}

export async function updateUserProfile(uid: string, data: Partial<UserProfile>) {
  const docRef = doc(db(), "users", uid);
  await updateDoc(docRef, {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

export async function markOnboardingComplete(uid: string) {
  const docRef = doc(db(), "users", uid);
  await updateDoc(docRef, {
    onboardingComplete: true,
    updatedAt: serverTimestamp(),
  });
}

// ============================================
// THERAPIST FUNCTIONS
// ============================================

export async function createTherapistProfile(uid: string, data: Partial<TherapistProfile>) {
  const docRef = doc(db(), "therapists", uid);
  await setDoc(docRef, {
    odUid: uid,
    credentialsVerified: false,
    onboardingComplete: false,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    ...data,
  });
}

export async function getTherapistProfile(uid: string): Promise<TherapistProfile | null> {
  const docRef = doc(db(), "therapists", uid);
  const docSnap = await getDoc(docRef);
  return docSnap.exists() ? (docSnap.data() as TherapistProfile) : null;
}

export async function updateTherapistProfile(uid: string, data: Partial<TherapistProfile>) {
  const docRef = doc(db(), "therapists", uid);
  await updateDoc(docRef, {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

export async function markTherapistOnboardingComplete(uid: string) {
  const docRef = doc(db(), "therapists", uid);
  await updateDoc(docRef, {
    onboardingComplete: true,
    updatedAt: serverTimestamp(),
  });
}

// ============================================
// ORGANIZER FUNCTIONS
// ============================================

export async function createOrganizerProfile(uid: string, data: Partial<OrganizerProfile>) {
  const docRef = doc(db(), "organizers", uid);
  await setDoc(docRef, {
    odUid: uid,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    ...data,
  });
}

export async function getOrganizerProfile(uid: string): Promise<OrganizerProfile | null> {
  const docRef = doc(db(), "organizers", uid);
  const docSnap = await getDoc(docRef);
  return docSnap.exists() ? (docSnap.data() as OrganizerProfile) : null;
}

export async function updateOrganizerProfile(uid: string, data: Partial<OrganizerProfile>) {
  const docRef = doc(db(), "organizers", uid);
  await updateDoc(docRef, {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

// ============================================
// SHIFT FUNCTIONS
// ============================================

export async function createShift(organizerId: string, data: Partial<Shift>): Promise<string> {
  const shiftRef = doc(collection(db(), "shifts"));
  await setDoc(shiftRef, {
    id: shiftRef.id,
    organizerId,
    status: "open",
    therapistsNeeded: 1,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    ...data,
  });
  return shiftRef.id;
}

export async function getShift(shiftId: string): Promise<Shift | null> {
  const docRef = doc(db(), "shifts", shiftId);
  const docSnap = await getDoc(docRef);
  return docSnap.exists() ? (docSnap.data() as Shift) : null;
}

export async function getShiftsByOrganizer(organizerId: string): Promise<Shift[]> {
  const q = query(collection(db(), "shifts"), where("organizerId", "==", organizerId));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map((doc) => doc.data() as Shift);
}

export async function getOpenShifts(): Promise<Shift[]> {
  const q = query(collection(db(), "shifts"), where("status", "==", "open"));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map((doc) => doc.data() as Shift);
}

export async function updateShift(shiftId: string, data: Partial<Shift>) {
  const docRef = doc(db(), "shifts", shiftId);
  await updateDoc(docRef, {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

// ============================================
// APPLICATION FUNCTIONS
// ============================================

export async function createApplication(shiftId: string, therapistId: string, message?: string): Promise<string> {
  const appRef = doc(collection(db(), "applications"));
  await setDoc(appRef, {
    id: appRef.id,
    shiftId,
    therapistId,
    status: "pending",
    message: message || null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return appRef.id;
}

export async function getApplicationsByTherapist(therapistId: string): Promise<Application[]> {
  const q = query(collection(db(), "applications"), where("therapistId", "==", therapistId));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map((doc) => doc.data() as Application);
}

export async function getApplicationsByShift(shiftId: string): Promise<Application[]> {
  const q = query(collection(db(), "applications"), where("shiftId", "==", shiftId));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map((doc) => doc.data() as Application);
}

export async function updateApplication(applicationId: string, data: Partial<Application>) {
  const docRef = doc(db(), "applications", applicationId);
  await updateDoc(docRef, {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

// ============================================
// BOOKING FUNCTIONS
// ============================================

export async function createBooking(data: Partial<Booking>): Promise<string> {
  const bookingRef = doc(collection(db(), "bookings"));
  await setDoc(bookingRef, {
    id: bookingRef.id,
    status: "confirmed",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    ...data,
  });
  return bookingRef.id;
}

export async function getBookingsByTherapist(therapistId: string): Promise<Booking[]> {
  const q = query(collection(db(), "bookings"), where("therapistId", "==", therapistId));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map((doc) => doc.data() as Booking);
}

export async function getBookingsByShift(shiftId: string): Promise<Booking[]> {
  const q = query(collection(db(), "bookings"), where("shiftId", "==", shiftId));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map((doc) => doc.data() as Booking);
}

export async function updateBooking(bookingId: string, data: Partial<Booking>) {
  const docRef = doc(db(), "bookings", bookingId);
  await updateDoc(docRef, {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

// ============================================
// CREDENTIAL DOCUMENT FUNCTIONS
// ============================================

export async function createCredentialDocument(therapistId: string, data: Partial<CredentialDocument>): Promise<string> {
  const docRef = doc(collection(db(), "credentialDocuments"));
  await setDoc(docRef, {
    id: docRef.id,
    therapistId,
    uploadedAt: serverTimestamp(),
    ...data,
  });
  return docRef.id;
}

export async function getCredentialDocuments(therapistId: string): Promise<CredentialDocument[]> {
  const q = query(collection(db(), "credentialDocuments"), where("therapistId", "==", therapistId));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map((doc) => doc.data() as CredentialDocument);
}

export async function deleteCredentialDocument(documentId: string) {
  const docRef = doc(db(), "credentialDocuments", documentId);
  await deleteDoc(docRef);
}

export async function updateCredentialDocument(documentId: string, data: Partial<CredentialDocument>) {
  const docRef = doc(db(), "credentialDocuments", documentId);
  await updateDoc(docRef, data);
}

// ============================================
// ADMIN FUNCTIONS
// ============================================

export interface AdminStats {
  totalTherapists: number;
  verifiedTherapists: number;
  pendingVerifications: number;
  totalOrganizers: number;
}

export interface TherapistWithProfile {
  id: string;
  odUid: string;
  credentialsVerified: boolean;
  city?: string;
  province?: string;
  cataNumber?: string;
  profile: {
    fullName: string;
    email: string;
  } | null;
  credentialDocuments: CredentialDocument[];
}

export interface UserWithType {
  uid: string;
  email: string;
  fullName: string;
  userType: UserType;
  isAdmin: boolean;
  onboardingComplete: boolean;
  createdAt: Timestamp;
}

export async function getAdminStats(): Promise<AdminStats> {
  // Get all therapists
  const therapistsSnapshot = await getDocs(collection(db(), "therapists"));
  const therapists = therapistsSnapshot.docs.map(doc => doc.data());

  const totalTherapists = therapists.length;
  const verifiedTherapists = therapists.filter(t => t.credentialsVerified).length;

  // Get pending verifications (therapists with documents but not verified)
  const pendingVerifications = therapists.filter(t => !t.credentialsVerified && t.onboardingComplete).length;

  // Get all organizers
  const organizersSnapshot = await getDocs(collection(db(), "organizers"));
  const totalOrganizers = organizersSnapshot.docs.length;

  return {
    totalTherapists,
    verifiedTherapists,
    pendingVerifications,
    totalOrganizers,
  };
}

export async function getAllTherapistsWithProfiles(): Promise<TherapistWithProfile[]> {
  // Get all therapists
  const therapistsSnapshot = await getDocs(collection(db(), "therapists"));
  const therapists = therapistsSnapshot.docs.map(doc => ({
    id: doc.id,
    ...(doc.data() as TherapistProfile)
  }));

  // Get all credential documents
  const credentialsSnapshot = await getDocs(collection(db(), "credentialDocuments"));
  const allCredentials = credentialsSnapshot.docs.map(doc => doc.data() as CredentialDocument);

  // Get all user profiles
  const usersSnapshot = await getDocs(collection(db(), "users"));
  const users = new Map<string, any>();
  usersSnapshot.docs.forEach(doc => {
    users.set(doc.id, doc.data());
  });

  // Combine the data
  return therapists.map(therapist => {
    const user = users.get(therapist.id);
    const credentials = allCredentials.filter(c => c.therapistId === therapist.id);

    return {
      id: therapist.id,
      odUid: therapist.odUid || therapist.id,
      credentialsVerified: therapist.credentialsVerified || false,
      city: therapist.city,
      province: therapist.province,
      cataNumber: therapist.cataNumber,
      profile: user ? {
        fullName: user.fullName || 'Unknown',
        email: user.email || '',
      } : null,
      credentialDocuments: credentials,
    };
  });
}

export async function getAllUsers(): Promise<UserWithType[]> {
  const usersSnapshot = await getDocs(collection(db(), "users"));
  return usersSnapshot.docs.map(doc => ({
    uid: doc.id,
    ...doc.data()
  })) as UserWithType[];
}

export async function verifyTherapistCredentials(therapistId: string, adminId: string) {
  // Update all unverified credential documents for this therapist
  const credentials = await getCredentialDocuments(therapistId);

  for (const cred of credentials) {
    if (!cred.verifiedAt) {
      await updateCredentialDocument(cred.id, {
        verifiedAt: serverTimestamp() as Timestamp,
        verifiedBy: adminId,
      });
    }
  }

  // Mark therapist as verified
  await updateTherapistProfile(therapistId, {
    credentialsVerified: true,
  });
}

export async function unverifyTherapistCredentials(therapistId: string) {
  // Mark therapist as not verified
  await updateTherapistProfile(therapistId, {
    credentialsVerified: false,
  });
}

export async function approveCredentialDocument(documentId: string, adminId: string, therapistId: string) {
  await updateCredentialDocument(documentId, {
    verifiedAt: serverTimestamp() as Timestamp,
    verifiedBy: adminId,
  });

  // Check if all documents are verified, if so verify the therapist
  const credentials = await getCredentialDocuments(therapistId);
  const allVerified = credentials.every(c => c.verifiedAt);

  if (allVerified && credentials.length >= 4) {
    await updateTherapistProfile(therapistId, {
      credentialsVerified: true,
    });
  }
}

export async function rejectCredentialDocument(documentId: string) {
  // Delete the document - therapist will need to re-upload
  await deleteCredentialDocument(documentId);
}

export async function setUserAdmin(userId: string, isAdmin: boolean) {
  const docRef = doc(db(), "users", userId);
  await updateDoc(docRef, {
    isAdmin,
    updatedAt: serverTimestamp(),
  });
}
