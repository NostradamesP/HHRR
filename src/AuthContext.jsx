import { createContext, useContext, useState, useEffect } from "react";
import { useServices } from "./presentation/context/ServicesContext";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const { authService } = useServices();
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    let pendingUserUid = null;

    const unsub = authService.subscribeAuth(async (firebaseUser) => {
      if (!mounted) return;
      const currentUid = firebaseUser?.uid || null;
      pendingUserUid = currentUid;
      setUser(firebaseUser);

      if (firebaseUser) {
        try {
          let data = await authService.getUserData(currentUid);
          if (!mounted) return;
          if (pendingUserUid !== currentUid) return;

          if (data) {
            setUserData(data);
          } else {
            data = {
              email: firebaseUser.email,
              name: firebaseUser.email.split("@")[0],
              role: "member",
              jobTitle: "Soporte Técnico",
              createdAt: new Date().toISOString(),
            };
            await authService.saveUserData(currentUid, data);
            if (mounted) setUserData(data);
          }
        } catch (e) {
          if (mounted) console.error("Error loading user data:", e);
        }
      } else {
        pendingUserUid = null;
        if (mounted) setUserData(null);
      }
      if (mounted) setLoading(false);
    });

    return () => {
      mounted = false;
      unsub();
    };
  }, [authService]);

  async function login(email, password) {
    return authService.signIn(email, password);
  }

  async function signup(email, password, name) {
    return authService.signUp(email, password, name);
  }

  async function logout() {
    await authService.signOut();
  }

  const isAdmin = userData?.role === "admin";

  return (
    <AuthContext.Provider value={{ user, userData, loading, login, signup, logout, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
