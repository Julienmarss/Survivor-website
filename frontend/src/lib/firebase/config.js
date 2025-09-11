import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// Configuration Firebase (remplace par tes vraies clés)
const firebaseConfig = {
    apiKey: "AIzaSyA12bNsOlbTs_N9j7mRLfJOjBMARD5ZMPI",
    authDomain: "jeb-incubator-v2.firebaseapp.com",
    projectId: "jeb-incubator-v2",
    storageBucket: "jeb-incubator-v2.firebasestorage.app",
    messagingSenderId: "638098462984",
    appId: "1:638098462984:web:bdb2128405f9e174a974bd",
    measurementId: "G-Y80LCN4FGG"
};
// Initialiser Firebase
const app = initializeApp(firebaseConfig);

// Initialiser Firestore
export const db = getFirestore(app);