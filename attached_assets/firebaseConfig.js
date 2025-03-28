// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCpyokIFr0CY5_NZiZs7jSZ3gySbqSRVEw",
  authDomain: "cleaning-schedule-373b7.firebaseapp.com",
  projectId: "cleaning-schedule-373b7",
  storageBucket: "cleaning-schedule-373b7.firebasestorage.app",
  messagingSenderId: "702647189021",
  appId: "1:702647189021:web:7e23984751ba87ea8dd0f4",
  measurementId: "G-0W8HYRPQS4"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);