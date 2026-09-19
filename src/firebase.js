import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

// Firebase Dashboard settings theke copy kora config
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "quickdrop-food.firebaseapp.com",
  projectId: "quickdrop-food",
  storageBucket: "quickdrop-food.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};

const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);