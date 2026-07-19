"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { User, onAuthStateChanged, signInWithPopup, signOut } from "firebase/auth";
import { auth, googleProvider, db } from "./firebase";
import { doc, setDoc, getDoc, onSnapshot, serverTimestamp } from "firebase/firestore";

export interface UserProfile {
  name: string;
  email: string;
  photoURL: string;
  setupComplete: boolean;
  age?: number;
  gender?: string;
  weight?: number; // in lbs
  height?: number; // in inches
  goals?: {
    calories: number;
    protein: number; // in grams
    carbs: number; // in grams
    fat: number; // in grams
    fiber: number; // in grams
    targetWeight?: number;
  },
  theme?: 'dark' | 'light' | 'earthy';
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  signInWithGoogle: async () => {},
  logout: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribeProfile: () => void;

    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        const userRef = doc(db, "users", currentUser.uid);
        
        // Initial create if missing
        const userSnap = await getDoc(userRef);
        if (!userSnap.exists()) {
           await setDoc(userRef, {
            name: currentUser.displayName,
            email: currentUser.email,
            photoURL: currentUser.photoURL,
            setupComplete: false,
            createdAt: serverTimestamp(),
          });
        }

        // Listen for real-time profile updates
        unsubscribeProfile = onSnapshot(userRef, (docSnap) => {
           if (docSnap.exists()) {
             const data = docSnap.data() as UserProfile;
             setProfile(data);
             
             if (typeof document !== 'undefined') {
               if (data.theme && data.theme !== 'dark') {
                 document.documentElement.setAttribute('data-theme', data.theme);
               } else {
                 document.documentElement.removeAttribute('data-theme');
               }
             }
             
             setLoading(false);
           }
        });

      } else {
        setUser(null);
        setProfile(null);
        setLoading(false);
        if (unsubscribeProfile) unsubscribeProfile();
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeProfile) unsubscribeProfile();
    };
  }, []);

  const signInWithGoogle = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Error signing in with Google:", error);
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, signInWithGoogle, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
