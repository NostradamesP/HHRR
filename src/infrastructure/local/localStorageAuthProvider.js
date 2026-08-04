import { AuthProvider } from "../../ports/AuthProvider";

const LOCAL_DEMO_USER = { uid: "local-demo-user", email: "demo@local" };

export class LocalStorageAuthProvider extends AuthProvider {
  subscribe(onAuthChange) {
    onAuthChange(null);
    return () => {};
  }

  async signIn(email) {
    return { ...LOCAL_DEMO_USER, email: email || "demo@local" };
  }

  async signUp(email) {
    return { ...LOCAL_DEMO_USER, email: email || "demo@local" };
  }

  async signOut() {}

  async getUserData() {
    return null;
  }

  async saveUserData() {}
}
