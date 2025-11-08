/**
 * Firebase Client Configuration
 * Initializes Firebase for client-side authentication and services
 */

import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAFqk7eKAmgyqNSEgxzi5TGFsffNDnMSms",
  authDomain: "helpful-beach-476908-p3.firebaseapp.com",
  projectId: "helpful-beach-476908-p3",
  storageBucket: "helpful-beach-476908-p3.firebasestorage.app",
  messagingSenderId: "605386197791",
  appId: "1:605386197791:web:c4ef471515a11de1ac7e2a",
  measurementId: "G-QYJ28E89XS"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Initialize Google Auth Provider
export const googleProvider = new GoogleAuthProvider();

export default app;

