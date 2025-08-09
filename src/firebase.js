import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth, signInAnonymously } from "firebase/auth";

const firebaseConfig = {
   apiKey: "AIzaSyB9Igg1s9GRMh9iXzuGic-xbQkcGiDxkRY",
  authDomain: "zehra-ensar-love.firebaseapp.com",
  projectId: "zehra-ensar-love",
  storageBucket: "zehra-ensar-love.firebasestorage.app",
  messagingSenderId: "315115042069",
  appId: "1:315115042069:web:9ca9423453f915dcb4e51c"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

export const auth = getAuth(app);
signInAnonymously(auth).catch(console.error);


