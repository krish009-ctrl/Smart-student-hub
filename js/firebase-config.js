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
  apiKey: "YOUR_API_KEY_HERE",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage();

console.log("✅ Firebase initialized — College Hub GPC Jammu");
