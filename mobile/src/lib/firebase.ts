import { initializeApp } from 'firebase/app';
import { initializeAuth, getReactNativePersistence, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: "AIzaSyCi4DBUjiAPqv-VygYZ4E6AlFW28Hhv_Mk",
  authDomain: "veille-tech-bb46c.firebaseapp.com",
  projectId: "veille-tech-bb46c",
  storageBucket: "veille-tech-bb46c.firebasestorage.app",
  messagingSenderId: "243729050286",
  appId: "1:243729050286:web:fbb75d7a9cff4a3e5d5b3f",
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();

// Types
export interface Vote {
  user_id: string;
  article_id: string;
  article_url: string;
  vote_value: 1 | -1;
  week_label: string;
  voted_at: Date;
  article_source?: string;
  article_category?: string;
  article_score?: number;
}
