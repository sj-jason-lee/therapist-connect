"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User } from "firebase/auth";

// Lazy import the auth functions to avoid SSR issues
let onAuthChange: any = null;
let getUserProfile: any = null;
let getTherapistProfile: any = null;
let getOrganizerProfile: any = null;

if (typeof window !== 'undefined') {
  // Dynamic import for client-side only
  import("./auth").then((mod) => {
    onAuthChange = mod.onAuthChange;
    getUserProfile = mod.getUserProfile;
  });
  import("./firestore").then((mod) => {
    getTherapistProfile = mod.getTherapistProfile;
    getOrganizerProfile = mod.getOrganizerProfile;
  });
}

// Types
interface UserProfile {
  uid: string;
  email: string;
  fullName: string;
  phone?: string;
  userType: "therapist" | "organizer" | "admin";
  isAdmin: boolean;
  onboardingComplete: boolean;
}

interface TherapistProfile {
  odUid: string;
  city: string;
  province: string;
  postalCode: string;
  travelRadiusKm: number;
  hourlyRateMin: number;
  hourlyRateMax?: number;
  bio?: string;
  cataNumber?: string;
  cataExpiry?: any;
  insuranceProvider?: string;
  insurancePolicyNumber?: string;
  insuranceExpiry?: any;
  blsExpiry?: any;
  profilePhotoUrl?: string;
  credentialsVerified: boolean;
  onboardingComplete: boolean;
  stripeAccountId?: string;
}

interface OrganizerProfile {
  odUid: string;
  organizationName: string;
  organizationType: string;
  address?: string;
  city: string;
  province: string;
  postalCode: string;
  stripeCustomerId?: string;
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  therapist: TherapistProfile | null;
  organizer: OrganizerProfile | null;
  loading: boolean;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [therapist, setTherapist] = useState<TherapistProfile | null>(null);
  const [organizer, setOrganizer] = useState<OrganizerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isClient, setIsClient] = useState(false);

  // Only run on client
  useEffect(() => {
    setIsClient(true);
  }, []);

  const refreshProfile = async () => {
    if (user && getUserProfile) {
      const userProfile = await getUserProfile(user.uid);
      setProfile(userProfile);

      if (userProfile?.userType === "therapist" && getTherapistProfile) {
        const therapistProfile = await getTherapistProfile(user.uid);
        setTherapist(therapistProfile);
        setOrganizer(null);
      } else if (userProfile?.userType === "organizer" && getOrganizerProfile) {
        const organizerProfile = await getOrganizerProfile(user.uid);
        setOrganizer(organizerProfile);
        setTherapist(null);
      }
    }
  };

  useEffect(() => {
    if (!isClient) return;

    // Wait for dynamic imports to complete
    const initAuth = async () => {
      // Import modules dynamically
      const authModule = await import("./auth");
      const firestoreModule = await import("./firestore");

      onAuthChange = authModule.onAuthChange;
      getUserProfile = authModule.getUserProfile;
      getTherapistProfile = firestoreModule.getTherapistProfile;
      getOrganizerProfile = firestoreModule.getOrganizerProfile;

      const unsubscribe = onAuthChange(async (firebaseUser: User | null) => {
        setUser(firebaseUser);

        if (firebaseUser) {
          try {
            const userProfile = await getUserProfile(firebaseUser.uid);
            setProfile(userProfile);

            // Load role-specific profile
            if (userProfile?.userType === "therapist") {
              const therapistProfile = await getTherapistProfile(firebaseUser.uid);
              setTherapist(therapistProfile);
              setOrganizer(null);
            } else if (userProfile?.userType === "organizer") {
              const organizerProfile = await getOrganizerProfile(firebaseUser.uid);
              setOrganizer(organizerProfile);
              setTherapist(null);
            } else {
              setTherapist(null);
              setOrganizer(null);
            }
          } catch (error) {
            console.error("Error fetching user profile:", error);
            setProfile(null);
            setTherapist(null);
            setOrganizer(null);
          }
        } else {
          setProfile(null);
          setTherapist(null);
          setOrganizer(null);
        }

        setLoading(false);
      });

      return unsubscribe;
    };

    let unsubscribe: (() => void) | undefined;

    initAuth().then((unsub) => {
      unsubscribe = unsub;
    }).catch((error) => {
      console.error("Error initializing auth:", error);
      setLoading(false);
    });

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [isClient]);

  return (
    <AuthContext.Provider value={{ user, profile, therapist, organizer, loading, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
