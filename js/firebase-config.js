/*
  Firebase setup for College Hub
  
  To get this working:
  1. Go to https://console.firebase.google.com
  2. Create a project called "college-hub" or whatever
  3. Go to Project Settings > Your apps > click the web app icon (</>)
  4. Copy your config values below
  5. Enable Email/Password auth in Authentication
  6. Create a Firestore database (start in test mode)
  7. Enable Storage too (test mode is fine)
*/

const firebaseConfig = {
  apiKey: "AIzaSyBSke5F9CITSsMD2ZLzk7ipsz0NEYrWVFk",
  authDomain: "major-project-ccf84.firebaseapp.com",
  projectId: "major-project-ccf84",
  storageBucket: "major-project-ccf84.firebasestorage.app",
  messagingSenderId: "51861988004",
  appId: "1:51861988004:web:330c3dd44ce03049fcfc31",
  measurementId: "G-2HNVVNMDSG"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage();

console.log("✅ Firebase initialized — College Hub GPC Jammu");
