import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyD6IOFnWyYh5E-xl898CEj0iNOWlf_etX8",
  authDomain: "qkai-838b5.firebaseapp.com",
  projectId: "qkai-838b5",
  storageBucket: "qkai-838b5.firebasestorage.app",
  messagingSenderId: "257154368846",
  appId: "1:257154368846:web:e2c6d99d34bda331708a1f",
  measurementId: "G-VJPQ0YQ7NX",
};

const app = initializeApp(firebaseConfig);
getAnalytics(app);

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider(); // new
