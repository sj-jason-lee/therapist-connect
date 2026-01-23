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
  orderBy,
  limit as firestoreLimit,
  onSnapshot,
  Unsubscribe,
  runTransaction,
  writeBatch,
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
  // Dispute fields
  disputeReason?: string;
  disputedAt?: Timestamp;
  disputedByTherapist?: boolean;
  therapistClaimedHours?: number;
  organizerReportedHours?: number;
  resolvedAt?: Timestamp;
  resolvedBy?: string;
  resolutionNotes?: string;
  // Reminder fields
  reminderSent?: boolean;
  reminderSentAt?: Timestamp;
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

// Booking timeline/audit log
export type BookingEventType =
  | 'created'
  | 'checked_in'
  | 'checked_out'
  | 'completed'
  | 'cancelled'
  | 'disputed'
  | 'payment_initiated'
  | 'payment_completed'
  | 'hours_adjusted';

export interface BookingEvent {
  id: string;
  bookingId: string;
  eventType: BookingEventType;
  actorId: string; // User who performed the action
  actorType: 'therapist' | 'organizer' | 'admin' | 'system';
  details?: string;
  previousValue?: string;
  newValue?: string;
  createdAt: Timestamp;
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

// Transaction-safe function to accept an application and create a booking
export async function acceptApplicationWithTransaction(
  applicationId: string,
  shiftId: string,
  therapistId: string
): Promise<{ success: boolean; bookingId?: string; error?: string }> {
  try {
    const result = await runTransaction(db(), async (transaction) => {
      // Get the application
      const appRef = doc(db(), "applications", applicationId);
      const appDoc = await transaction.get(appRef);

      if (!appDoc.exists()) {
        throw new Error("Application not found");
      }

      const appData = appDoc.data() as Application;
      if (appData.status !== "pending") {
        throw new Error("Application has already been processed");
      }

      // Get the shift to check if it's still open
      const shiftRef = doc(db(), "shifts", shiftId);
      const shiftDoc = await transaction.get(shiftRef);

      if (!shiftDoc.exists()) {
        throw new Error("Shift not found");
      }

      const shiftData = shiftDoc.data() as Shift;
      if (shiftData.status === "filled" || shiftData.status === "cancelled") {
        throw new Error("Shift is no longer available");
      }

      // Count existing active bookings for this shift
      const bookingsQuery = query(
        collection(db(), "bookings"),
        where("shiftId", "==", shiftId)
      );
      const bookingsSnapshot = await getDocs(bookingsQuery);
      const activeBookings = bookingsSnapshot.docs.filter(
        d => (d.data() as Booking).status !== "cancelled"
      );

      if (activeBookings.length >= shiftData.therapistsNeeded) {
        throw new Error("Shift is already fully booked");
      }

      // Update the application status
      transaction.update(appRef, {
        status: "accepted",
        updatedAt: serverTimestamp(),
      });

      // Create the booking
      const bookingRef = doc(collection(db(), "bookings"));
      transaction.set(bookingRef, {
        id: bookingRef.id,
        shiftId,
        therapistId,
        applicationId,
        status: "confirmed",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      // Update shift status if now full
      if (activeBookings.length + 1 >= shiftData.therapistsNeeded) {
        transaction.update(shiftRef, {
          status: "filled",
          updatedAt: serverTimestamp(),
        });
      }

      return bookingRef.id;
    });

    return { success: true, bookingId: result };
  } catch (error) {
    console.error("Transaction failed:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Transaction failed"
    };
  }
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

  // Check if shift is now fully booked and update status
  if (data.shiftId) {
    const shift = await getShift(data.shiftId);
    if (shift) {
      const existingBookings = await getBookingsByShift(data.shiftId);
      // Count only active bookings (not cancelled)
      const activeBookings = existingBookings.filter(b => b.status !== 'cancelled');
      if (activeBookings.length >= shift.therapistsNeeded) {
        await updateShift(data.shiftId, { status: 'filled' });
      }
    }
  }

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

export async function checkInBooking(bookingId: string, actorId?: string): Promise<void> {
  const docRef = doc(db(), "bookings", bookingId);
  const booking = await getDoc(docRef);
  const previousStatus = booking.exists() ? (booking.data() as Booking).status : undefined;

  await updateDoc(docRef, {
    status: "checked_in",
    checkInTime: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  // Log the event
  if (actorId) {
    await logBookingEvent(
      bookingId,
      'checked_in',
      actorId,
      'therapist',
      'Therapist checked in',
      previousStatus,
      'checked_in'
    );
  }
}

export async function checkOutBooking(bookingId: string, actorId?: string): Promise<void> {
  const docRef = doc(db(), "bookings", bookingId);
  const booking = await getDoc(docRef);
  const previousStatus = booking.exists() ? (booking.data() as Booking).status : undefined;

  await updateDoc(docRef, {
    status: "checked_out",
    checkOutTime: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  // Log the event
  if (actorId) {
    await logBookingEvent(
      bookingId,
      'checked_out',
      actorId,
      'therapist',
      'Therapist checked out',
      previousStatus,
      'checked_out'
    );
  }
}

// Real-time subscription for bookings by therapist
export function subscribeToBookingsByTherapist(
  therapistId: string,
  callback: (bookings: Booking[]) => void
): Unsubscribe {
  const q = query(
    collection(db(), "bookings"),
    where("therapistId", "==", therapistId)
  );

  return onSnapshot(q, (snapshot) => {
    const bookings = snapshot.docs.map(doc => doc.data() as Booking);
    callback(bookings);
  });
}

// Real-time subscription for bookings by shift
export function subscribeToBookingsByShift(
  shiftId: string,
  callback: (bookings: Booking[]) => void
): Unsubscribe {
  const q = query(
    collection(db(), "bookings"),
    where("shiftId", "==", shiftId)
  );

  return onSnapshot(q, (snapshot) => {
    const bookings = snapshot.docs.map(doc => doc.data() as Booking);
    callback(bookings);
  });
}

// Real-time subscription for applications by therapist
export function subscribeToApplicationsByTherapist(
  therapistId: string,
  callback: (applications: Application[]) => void
): Unsubscribe {
  const q = query(
    collection(db(), "applications"),
    where("therapistId", "==", therapistId)
  );

  return onSnapshot(q, (snapshot) => {
    const applications = snapshot.docs.map(doc => doc.data() as Application);
    callback(applications);
  });
}

// Real-time subscription for applications by shift
export function subscribeToApplicationsByShift(
  shiftId: string,
  callback: (applications: Application[]) => void
): Unsubscribe {
  const q = query(
    collection(db(), "applications"),
    where("shiftId", "==", shiftId)
  );

  return onSnapshot(q, (snapshot) => {
    const applications = snapshot.docs.map(doc => doc.data() as Application);
    callback(applications);
  });
}

// ============================================
// BOOKING TIMELINE/AUDIT LOG FUNCTIONS
// ============================================

export async function logBookingEvent(
  bookingId: string,
  eventType: BookingEventType,
  actorId: string,
  actorType: 'therapist' | 'organizer' | 'admin' | 'system',
  details?: string,
  previousValue?: string,
  newValue?: string
): Promise<string> {
  const eventRef = doc(collection(db(), "bookingEvents"));
  await setDoc(eventRef, {
    id: eventRef.id,
    bookingId,
    eventType,
    actorId,
    actorType,
    details,
    previousValue,
    newValue,
    createdAt: serverTimestamp(),
  });
  return eventRef.id;
}

export async function getBookingTimeline(bookingId: string): Promise<BookingEvent[]> {
  const q = query(
    collection(db(), "bookingEvents"),
    where("bookingId", "==", bookingId),
    orderBy("createdAt", "asc")
  );
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => doc.data() as BookingEvent);
}

export async function completeBooking(
  bookingId: string,
  hoursWorked: number,
  hourlyRate: number,
  actorId?: string
): Promise<void> {
  const therapistPayout = hoursWorked * hourlyRate; // Therapist gets 100%
  const platformFee = Math.round(therapistPayout * 0.20 * 100) / 100; // 20% platform fee added on top
  const totalDue = therapistPayout + platformFee; // Organizer pays this total

  const docRef = doc(db(), "bookings", bookingId);
  const booking = await getDoc(docRef);
  const previousStatus = booking.exists() ? (booking.data() as Booking).status : undefined;

  await updateDoc(docRef, {
    status: "completed",
    hoursWorked,
    amountDue: totalDue, // Total organizer pays
    platformFee,
    therapistPayout, // 100% of base amount
    updatedAt: serverTimestamp(),
  });

  // Log the event
  if (actorId) {
    await logBookingEvent(
      bookingId,
      'completed',
      actorId,
      'organizer',
      `Booking completed. Hours: ${hoursWorked}, Therapist payout: $${therapistPayout.toFixed(2)}`,
      previousStatus,
      'completed'
    );
  }
}

// ============================================
// HOURS DISPUTE FUNCTIONS
// ============================================

export async function disputeBookingHours(
  bookingId: string,
  therapistId: string,
  claimedHours: number,
  reason: string
): Promise<void> {
  const docRef = doc(db(), "bookings", bookingId);
  const booking = await getDoc(docRef);

  if (!booking.exists()) {
    throw new Error('Booking not found');
  }

  const bookingData = booking.data() as Booking;

  if (bookingData.therapistId !== therapistId) {
    throw new Error('Unauthorized: Only the assigned therapist can dispute');
  }

  if (bookingData.status !== 'completed') {
    throw new Error('Can only dispute completed bookings');
  }

  if (bookingData.paidAt) {
    throw new Error('Cannot dispute after payment has been processed');
  }

  await updateDoc(docRef, {
    status: 'disputed',
    disputeReason: reason,
    disputedAt: serverTimestamp(),
    disputedByTherapist: true,
    therapistClaimedHours: claimedHours,
    organizerReportedHours: bookingData.hoursWorked,
    updatedAt: serverTimestamp(),
  });

  await logBookingEvent(
    bookingId,
    'disputed',
    therapistId,
    'therapist',
    `Therapist disputed hours. Claimed: ${claimedHours}h, Reported: ${bookingData.hoursWorked}h. Reason: ${reason}`,
    'completed',
    'disputed'
  );
}

export async function resolveDispute(
  bookingId: string,
  resolverId: string,
  resolverType: 'organizer' | 'admin',
  finalHours: number,
  hourlyRate: number,
  resolutionNotes: string
): Promise<void> {
  const docRef = doc(db(), "bookings", bookingId);
  const booking = await getDoc(docRef);

  if (!booking.exists()) {
    throw new Error('Booking not found');
  }

  const bookingData = booking.data() as Booking;

  if (bookingData.status !== 'disputed') {
    throw new Error('Booking is not in disputed status');
  }

  // Recalculate amounts with resolved hours
  const therapistPayout = finalHours * hourlyRate;
  const platformFee = Math.round(therapistPayout * 0.20 * 100) / 100;
  const totalDue = therapistPayout + platformFee;

  await updateDoc(docRef, {
    status: 'completed',
    hoursWorked: finalHours,
    therapistPayout,
    platformFee,
    amountDue: totalDue,
    resolvedAt: serverTimestamp(),
    resolvedBy: resolverId,
    resolutionNotes,
    updatedAt: serverTimestamp(),
  });

  await logBookingEvent(
    bookingId,
    'hours_adjusted',
    resolverId,
    resolverType,
    `Dispute resolved. Final hours: ${finalHours}h. Notes: ${resolutionNotes}`,
    'disputed',
    'completed'
  );
}

export async function getDisputedBookings(): Promise<Booking[]> {
  const q = query(
    collection(db(), "bookings"),
    where("status", "==", "disputed")
  );
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Booking));
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

// ============================================
// MESSAGING TYPES
// ============================================

export interface Conversation {
  id: string;
  participants: string[]; // [therapistId, organizerId]
  shiftId?: string;
  bookingId?: string;
  lastMessage?: string;
  lastMessageAt?: Timestamp;
  lastMessageBy?: string;
  unreadCount: Record<string, number>; // { odUid: unreadCount }
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  read: boolean;
  createdAt: Timestamp;
}

// ============================================
// MESSAGING FUNCTIONS
// ============================================

export async function getOrCreateConversation(
  therapistId: string,
  organizerId: string,
  shiftId?: string,
  bookingId?: string
): Promise<Conversation> {
  // Check if conversation already exists
  const participants = [therapistId, organizerId].sort();
  const q = query(
    collection(db(), "conversations"),
    where("participants", "==", participants)
  );
  const querySnapshot = await getDocs(q);

  if (!querySnapshot.empty) {
    return querySnapshot.docs[0].data() as Conversation;
  }

  // Create new conversation
  const convRef = doc(collection(db(), "conversations"));
  const conversation: Conversation = {
    id: convRef.id,
    participants,
    shiftId,
    bookingId,
    unreadCount: { [therapistId]: 0, [organizerId]: 0 },
    createdAt: serverTimestamp() as Timestamp,
    updatedAt: serverTimestamp() as Timestamp,
  };

  await setDoc(convRef, conversation);
  return { ...conversation, id: convRef.id };
}

export async function getConversation(conversationId: string): Promise<Conversation | null> {
  const docRef = doc(db(), "conversations", conversationId);
  const docSnap = await getDoc(docRef);
  return docSnap.exists() ? (docSnap.data() as Conversation) : null;
}

export async function getConversationsByUser(userId: string): Promise<Conversation[]> {
  const q = query(
    collection(db(), "conversations"),
    where("participants", "array-contains", userId)
  );
  const querySnapshot = await getDocs(q);
  const conversations = querySnapshot.docs.map(doc => doc.data() as Conversation);

  // Sort by lastMessageAt (newest first)
  return conversations.sort((a, b) => {
    const dateA = a.lastMessageAt?.toDate?.() || a.createdAt?.toDate?.() || new Date(0);
    const dateB = b.lastMessageAt?.toDate?.() || b.createdAt?.toDate?.() || new Date(0);
    return dateB.getTime() - dateA.getTime();
  });
}

export async function sendMessage(
  conversationId: string,
  senderId: string,
  content: string
): Promise<string> {
  // Create the message
  const msgRef = doc(collection(db(), "messages"));
  await setDoc(msgRef, {
    id: msgRef.id,
    conversationId,
    senderId,
    content,
    read: false,
    createdAt: serverTimestamp(),
  });

  // Update conversation
  const conversation = await getConversation(conversationId);
  if (conversation) {
    const otherParticipant = conversation.participants.find(p => p !== senderId);
    const newUnreadCount = { ...conversation.unreadCount };
    if (otherParticipant) {
      newUnreadCount[otherParticipant] = (newUnreadCount[otherParticipant] || 0) + 1;
    }

    const convRef = doc(db(), "conversations", conversationId);
    await updateDoc(convRef, {
      lastMessage: content.substring(0, 100),
      lastMessageAt: serverTimestamp(),
      lastMessageBy: senderId,
      unreadCount: newUnreadCount,
      updatedAt: serverTimestamp(),
    });
  }

  return msgRef.id;
}

export async function getMessages(conversationId: string, limitCount: number = 50): Promise<Message[]> {
  const q = query(
    collection(db(), "messages"),
    where("conversationId", "==", conversationId),
    orderBy("createdAt", "desc"),
    firestoreLimit(limitCount)
  );
  const querySnapshot = await getDocs(q);
  const messages = querySnapshot.docs.map(doc => doc.data() as Message);

  // Return in chronological order
  return messages.reverse();
}

export function subscribeToMessages(
  conversationId: string,
  callback: (messages: Message[]) => void
): Unsubscribe {
  const q = query(
    collection(db(), "messages"),
    where("conversationId", "==", conversationId),
    orderBy("createdAt", "desc"),
    firestoreLimit(100)
  );

  return onSnapshot(q, (snapshot) => {
    const messages = snapshot.docs.map(doc => doc.data() as Message);
    callback(messages.reverse());
  });
}

export async function markMessagesAsRead(conversationId: string, userId: string): Promise<void> {
  // Update the unread count for this user
  const convRef = doc(db(), "conversations", conversationId);
  const conversation = await getConversation(conversationId);

  if (conversation) {
    const newUnreadCount = { ...conversation.unreadCount, [userId]: 0 };
    await updateDoc(convRef, {
      unreadCount: newUnreadCount,
      updatedAt: serverTimestamp(),
    });
  }
}

export async function getTotalUnreadCount(userId: string): Promise<number> {
  const conversations = await getConversationsByUser(userId);
  return conversations.reduce((total, conv) => {
    return total + (conv.unreadCount?.[userId] || 0);
  }, 0);
}

// ============================================
// REVIEW TYPES
// ============================================

export interface Review {
  id: string;
  bookingId: string;
  shiftId: string;
  therapistId: string;
  organizerId: string;
  rating: number; // 1-5
  comment?: string;
  createdAt: Timestamp;
}

export interface TherapistStats {
  averageRating: number;
  totalReviews: number;
  totalShifts: number;
}

// ============================================
// REVIEW FUNCTIONS
// ============================================

export async function createReview(
  bookingId: string,
  shiftId: string,
  therapistId: string,
  organizerId: string,
  rating: number,
  comment?: string
): Promise<string> {
  // Check if review already exists for this booking
  const existingReview = await getReviewByBooking(bookingId);
  if (existingReview) {
    throw new Error("Review already exists for this booking");
  }

  const reviewRef = doc(collection(db(), "reviews"));
  await setDoc(reviewRef, {
    id: reviewRef.id,
    bookingId,
    shiftId,
    therapistId,
    organizerId,
    rating,
    comment: comment || null,
    createdAt: serverTimestamp(),
  });

  // Update therapist stats
  await updateTherapistStats(therapistId);

  return reviewRef.id;
}

export async function getReviewByBooking(bookingId: string): Promise<Review | null> {
  const q = query(
    collection(db(), "reviews"),
    where("bookingId", "==", bookingId)
  );
  const querySnapshot = await getDocs(q);

  if (querySnapshot.empty) {
    return null;
  }

  return querySnapshot.docs[0].data() as Review;
}

export async function getReviewsByTherapist(therapistId: string): Promise<Review[]> {
  const q = query(
    collection(db(), "reviews"),
    where("therapistId", "==", therapistId),
    orderBy("createdAt", "desc")
  );
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => doc.data() as Review);
}

export async function getReviewsByOrganizer(organizerId: string): Promise<Review[]> {
  const q = query(
    collection(db(), "reviews"),
    where("organizerId", "==", organizerId),
    orderBy("createdAt", "desc")
  );
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => doc.data() as Review);
}

export async function getTherapistStats(therapistId: string): Promise<TherapistStats> {
  const reviews = await getReviewsByTherapist(therapistId);

  const totalReviews = reviews.length;
  const averageRating = totalReviews > 0
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews
    : 0;

  // Count completed bookings
  const bookings = await getBookingsByTherapist(therapistId);
  const totalShifts = bookings.filter(b => b.status === "completed").length;

  return {
    averageRating: Math.round(averageRating * 10) / 10,
    totalReviews,
    totalShifts,
  };
}

async function updateTherapistStats(therapistId: string): Promise<void> {
  const stats = await getTherapistStats(therapistId);
  const therapistRef = doc(db(), "therapists", therapistId);

  await updateDoc(therapistRef, {
    averageRating: stats.averageRating,
    totalReviews: stats.totalReviews,
    updatedAt: serverTimestamp(),
  });
}
