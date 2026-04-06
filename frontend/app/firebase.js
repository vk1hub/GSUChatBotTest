import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAoTPAsDckP81ZW9ZOgl4OMZ4opxZj-sFQ",
  authDomain: "ai-cs-chatbot-cb2b8.firebaseapp.com",
  projectId: "ai-cs-chatbot-cb2b8",
  storageBucket: "ai-cs-chatbot-cb2b8.firebasestorage.app",
  messagingSenderId: "82095252786",
  appId: "1:82095252786:web:ae62a283a5f9a385d8e32b",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);