import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { getSeedUsers } from "@/lib/firestore";
import { COL } from "@/lib/firestore";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [ndaAccepted, setNdaAccepted] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const snap = await getDoc(doc(db, COL.USERS, firebaseUser.uid));

        if (snap.exists()) {
          const userData = { id: snap.id, ...snap.data() };

          setCurrentUser(userData);

          // read from Firestore
          setNdaAccepted(!!userData.ndaAccepted);
        } else {
          await signOut(auth);
          setCurrentUser(null);
          setNdaAccepted(false);
        }
      } else {
        setCurrentUser(null);
        setNdaAccepted(false);
      }

      setAuthLoading(false);
    });

    return unsub;
  }, []);

  const login = useCallback(async (emailOrUserId, password) => {
    let email = emailOrUserId;

    if (!emailOrUserId.includes("@")) {
      const seedUsers = getSeedUsers();
      const found = seedUsers.find((u) => u.id === emailOrUserId);
      if (!found) throw new Error("User not found");

      email = found.email;
      password = password || found.password;
    }

    const cred = await signInWithEmailAndPassword(auth, email, password);
    return cred.user;
  }, []);

  const logout = useCallback(async () => {
    await signOut(auth);
    setCurrentUser(null);
    setNdaAccepted(false);
  }, []);

  const acceptNda = useCallback(async () => {
    if (!currentUser?.id) return;

    setNdaAccepted(true);

    // persist to Firestore
    await updateDoc(doc(db, COL.USERS, currentUser.id), {
      ndaAccepted: true,
    });
  }, [currentUser]);

  return (
    <AuthContext.Provider
      value={{ currentUser, authLoading, login, logout, ndaAccepted, acceptNda }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export { useAuth as useMockAuth };
export { AuthProvider as MockAuthProvider };