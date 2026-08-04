import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { AuthProvider } from "../../ports/AuthProvider";
import { auth, db } from "../../firebase";
import { createUser } from "../../core/domain/entities/user";

export class FirebaseAuthProvider extends AuthProvider {
  subscribe(onAuthChange) {
    return onAuthStateChanged(auth, onAuthChange);
  }

  async signIn(email, password) {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    return cred.user;
  }

  async signUp(email, password) {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    return cred.user;
  }

  async signOut() {
    await signOut(auth);
  }

  async getUserData(uid) {
    const snap = await getDoc(doc(db, "users", uid));
    return snap.exists() ? snap.data() : null;
  }

  async saveUserData(uid, data) {
    const defaults = createUser({});
    const record = {
      email: data.email ?? defaults.email,
      name: data.name ?? defaults.name,
      role: data.role ?? defaults.role,
      jobTitle: data.jobTitle ?? defaults.jobTitle,
      createdAt: data.createdAt ?? new Date().toISOString(),
    };
    await setDoc(doc(db, "users", uid), record);
  }
}
