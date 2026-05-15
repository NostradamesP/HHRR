import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCS_c5ae6w2F1vHQo9GJuZzJ3KNXGjy3MQ",
  authDomain: "kanba-local-no-saas.firebaseapp.com",
  projectId: "kanba-local-no-saas",
  storageBucket: "kanba-local-no-saas.firebasestorage.app",
  messagingSenderId: "441174984693",
  appId: "1:441174984693:web:b3b0e39807510b36fd02bc",
  measurementId: "G-LW6M0S4T9Y"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
