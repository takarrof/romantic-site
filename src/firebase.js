// src/lib/firebase.js
import { initializeApp } from "firebase/app";
import {
  initializeFirestore,  // önemli: getFirestore yerine initializeFirestore
} from "firebase/firestore";
import {
  getAuth,
  signInAnonymously,
  setPersistence,
  browserLocalPersistence,
} from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyB9Igg1s9GRMh9iXzuGic-xbQkcGiDxkRY",
  authDomain: "zehra-ensar-love.firebaseapp.com",
  projectId: "zehra-ensar-love",
  storageBucket: "zehra-ensar-love.firebasestorage.app",
  messagingSenderId: "315115042069",
  appId: "1:315115042069:web:9ca9423453f915dcb4e51c",
};

const app = initializeApp(firebaseConfig);

// 🔧 Ağ kısıtlarını aşmak için long-polling
export const db = initializeFirestore(app, {
  experimentalAutoDetectLongPolling: true, // mobil veri + kurumsal ağlarda çok işe yarar
  useFetchStreams: false,                  // bazı cihazlarda daha stabil
});

// 🔐 Oturumu kalıcı yap + anonim giriş
export const auth = getAuth(app);
setPersistence(auth, browserLocalPersistence)
  .then(() => signInAnonymously(auth))
  .catch((e) => console.error("Anonim giriş hatası:", e));
