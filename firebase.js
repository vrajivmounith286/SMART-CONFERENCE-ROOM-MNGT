// ===== FIREBASE CLIENT =====
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyA39BEGbUvcKZiN8NEECDUUtcrHrCII4fg",
    authDomain: "smart-conference-room-mn-11785.firebaseapp.com",
    projectId: "smart-conference-room-mn-11785",
    storageBucket: "smart-conference-room-mn-11785.firebasestorage.app",
    messagingSenderId: "943043774496",
    appId: "1:943043774496:web:058b03b8881b61af3f1445",
    measurementId: "G-D5LMFVFLRQ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();