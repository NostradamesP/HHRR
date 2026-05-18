import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const isLocal = ["localhost", "127.0.0.1"].includes(window.location.hostname);

let auth = null;
let db = null;

if (!isLocal) {
  const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyCS_c5ae6w2F1vHQo9GJuZzJ3KNXGjy3MQ",
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "kanba-local-no-saas.firebaseapp.com",
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "kanba-local-no-saas",
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "kanba-local-no-saas.firebasestorage.app",
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "441174984693",
    appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:441174984693:web:b3b0e39807510b36fd02bc",
    measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-LW6M0S4T9Y"
  };
  const app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
}

export { auth, db };
