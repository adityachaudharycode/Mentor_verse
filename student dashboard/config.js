import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
    apiKey: "AIzaSyCBILtis_zBeNFXBLMj6UqUTTERYLI5bio",
    authDomain: "mentorverse-6416d.firebaseapp.com",
    projectId: "mentorverse-6416d",
    storageBucket: "mentorverse-6416d.appspot.com",
    messagingSenderId: "291855397478",
    appId: "1:291855397478:web:e7b0e8697e7d90b83a73a7",
    measurementId: "G-QESLR29GNC"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);