# College Hub — GPC Jammu
### 6th Semester CS/IT | Complete Academic Web App

## Project Structure
```
college-hub/
├── index.html              ← Login page (OPEN THIS FIRST)
├── pages/
│   ├── dashboard.html
│   ├── notes.html
│   ├── attendance.html
│   ├── timetable.html
│   ├── announcements.html
│   └── ai-summarizer.html
├── css/style.css
└── js/
    ├── firebase-config.js  ← FILL YOUR FIREBASE KEYS HERE
    ├── auth.js
    ├── dashboard.js
    ├── notes.js
    ├── attendance.js
    ├── timetable.js
    ├── announcements.js
    └── ai-summarizer.js    ← FILL YOUR ANTHROPIC KEY HERE
```

## SETUP — STEP BY STEP

### STEP 1 — Firebase (FREE database + login + file storage)
1. Go to https://console.firebase.google.com
2. Add project → name it "college-hub"
3. Authentication → Get started → Enable Email/Password
4. Firestore Database → Create database → Test mode
5. Storage → Get started → Test mode
6. Gear icon → Project Settings → Your apps → Web (</>)
7. Register app → Copy the firebaseConfig values
8. Open js/firebase-config.js and paste your values

### STEP 2 — AI Feature (Optional)
1. Go to https://console.anthropic.com → Sign up free
2. Create API key → Copy it
3. Open js/ai-summarizer.js → paste key at the top

### STEP 3 — Run the site
- Install VS Code + "Live Server" extension
- Right-click index.html → Open with Live Server
- Opens at http://localhost:5500

### STEP 4 — Deploy for FREE
- Go to https://netlify.com
- Drag and drop the college-hub folder
- Get a live URL to share with your class!

## Team Split (6 Students)
1. Firebase setup + login testing
2. Notes upload & download
3. Attendance marking & stats
4. Timetable setup
5. Announcements board
6. AI summarizer + deployment

## Common Errors
- "Firebase not initialized" → Check js/firebase-config.js keys
- "Permission denied" → Firebase Firestore Rules → test mode
- Files not uploading → Firebase Storage Rules → test mode
- AI not working → Check API key in js/ai-summarizer.js
- Page blank → Use Live Server, don't double-click the file
