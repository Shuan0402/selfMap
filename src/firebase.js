// firebase.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAPcdwpdfDEzZ2RXD6Sr35488hRtg5Co_8",
  authDomain: "selfmap-d948d.firebaseapp.com",
  projectId: "selfmap-d948d",
  storageBucket: "selfmap-d948d.firebasestorage.app",
  messagingSenderId: "492340350388",
  appId: "1:492340350388:web:f847717f5a0b5e9419b6e1",
  measurementId: "G-S8QV830559",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
