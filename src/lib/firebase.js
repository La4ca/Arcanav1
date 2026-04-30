import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCCFQt6Qfn_FJgFORQJtZDkVORSGa-9imQ",
  authDomain: "arcana-repo.firebaseapp.com",
  projectId: "arcana-repo",
  storageBucket: "arcana-repo.firebasestorage.app",
  messagingSenderId: "596854987860",
  appId: "1:596854987860:web:90df7184597624e0f3e1c1"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;