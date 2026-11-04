import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

// TODO: firebase config here? maybe one project for all of us
const firebaseConfig = {};

export const firebase_app = initializeApp(firebaseConfig);
export const firebase_auth = getAuth(firebase_app);
