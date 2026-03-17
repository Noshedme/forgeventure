// src/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBRuTdFYakI5aBlCKrPrE-g6wBSI4Bn2M0",
  authDomain: "forgeventura-7c2dc.firebaseapp.com",
  projectId: "forgeventura-7c2dc",
  storageBucket: "forgeventura-7c2dc.firebasestorage.app",
  messagingSenderId: "499418514567",
  appId: "1:499418514567:web:64816b41fac60e12c32422"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db   = getFirestore(app);
export default app;