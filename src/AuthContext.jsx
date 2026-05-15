import { createContext, useContext, useState, useEffect } from "react";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import { doc, getDoc, setDoc, collection, getDocs } from "firebase/firestore";
import { auth, db } from "./firebase";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth) {
      setUser(null);
      setUserData(null);
      setLoading(false);
      return;
    }
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        let snap = await getDoc(doc(db, "users", firebaseUser.uid));
        if (snap.exists()) {
          setUserData(snap.data());
        } else {
          const usersSnap = await getDocs(collection(db, "users"));
          const role = usersSnap.empty ? "admin" : "member";
          const data = {
            email: firebaseUser.email,
            name: firebaseUser.email.split("@")[0],
            role,
            createdAt: new Date().toISOString(),
          };
          await setDoc(doc(db, "users", firebaseUser.uid), data);
          setUserData(data);
        }
      } else {
        setUserData(null);
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  async function login(email, password) {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    return cred.user;
  }

  async function signup(email, password, name) {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    const usersSnap = await getDocs(collection(db, "users"));
    const role = usersSnap.empty ? "admin" : "member";
    const data = {
      email,
      name: name || email.split("@")[0],
      role,
      createdAt: new Date().toISOString(),
    };
    await setDoc(doc(db, "users", cred.user.uid), data);
    setUserData(data);
    return cred.user;
  }

  async function logout() {
    await signOut(auth);
  }

  const isAdmin = userData?.role === "admin";

  return (
    <AuthContext.Provider
      value={{ user, userData, loading, login, signup, logout, isAdmin }}
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
