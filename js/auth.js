// auth.js - handles login, signup, logout and page protection

// figure out if we're on the login page or inside the app
const isLoginPage = !window.location.pathname.includes('/pages/');

// protect app pages - kick user to login if not signed in
if (!isLoginPage) {
  auth.onAuthStateChanged(async (user) => {
    if (!user) {
      window.location.href = '../index.html';
    } else {
      // try to load their profile info
      try {
        const doc = await db.collection('users').doc(user.uid).get();
        if (doc.exists) {
          const data = doc.data();
          const nameEl = document.getElementById('userName');
          const rollEl = document.getElementById('userRoll');
          const avatarEl = document.getElementById('userAvatar');
          if (nameEl) nameEl.textContent = data.name || 'Student';
          if (rollEl) rollEl.textContent = data.roll || '';
          if (avatarEl) avatarEl.textContent = (data.name || 'S')[0].toUpperCase();
        }
      } catch (e) { console.log('Profile load error:', e); }
    }
  });
}

// if already logged in on the login page, just go to dashboard
if (isLoginPage) {
  auth.onAuthStateChanged((user) => {
    if (user) window.location.href = 'pages/dashboard.html';
  });
}

// tab switching between login and signup forms
function switchTab(tab) {
  document.getElementById('loginForm').classList.add('hidden');
  document.getElementById('signupForm').classList.add('hidden');
  document.getElementById(tab + 'Form').classList.remove('hidden');
  document.querySelectorAll('.tab-btn').forEach((b, i) => {
    b.classList.toggle('active', (tab === 'login' && i === 0) || (tab === 'signup' && i === 1));
  });
  clearMsg();
}

async function loginUser() {
  const email = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value;
  if (!email || !password) return showMsg('Please fill in all fields.', 'error');

  showMsg('Signing in...', 'success');
  try {
    await auth.signInWithEmailAndPassword(email, password);
    window.location.href = 'pages/dashboard.html';
  } catch (e) {
    showMsg(getAuthError(e.code), 'error');
  }
}

async function signupUser() {
  const name = document.getElementById('signupName').value.trim();
  const email = document.getElementById('signupEmail').value.trim();
  const roll = document.getElementById('signupRoll').value.trim();
  const password = document.getElementById('signupPassword').value;

  if (!name || !email || !roll || !password) return showMsg('Please fill all fields.', 'error');
  if (password.length < 6) return showMsg('Password must be at least 6 characters.', 'error');

  showMsg('Creating account...', 'success');
  try {
    const cred = await auth.createUserWithEmailAndPassword(email, password);
    await db.collection('users').doc(cred.user.uid).set({
      name, email, roll,
      branch: 'CS/IT',
      semester: '6th',
      college: 'Government Polytechnic College Jammu',
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    window.location.href = 'pages/dashboard.html';
  } catch (e) {
    showMsg(getAuthError(e.code), 'error');
  }
}

async function logoutUser() {
  await auth.signOut();
  window.location.href = '../index.html';
}

// mobile sidebar
function toggleSidebar() {
  document.getElementById('sidebar').classList.toggle('open');
}

// helper fns
function showMsg(msg, type) {
  const el = document.getElementById('authMsg');
  if (!el) return;
  el.textContent = msg;
  el.className = 'auth-msg ' + type;
}

function clearMsg() {
  const el = document.getElementById('authMsg');
  if (el) { el.textContent = ''; el.className = 'auth-msg'; }
}

function getAuthError(code) {
  const errors = {
    'auth/user-not-found': 'No account found with this email.',
    'auth/wrong-password': 'Incorrect password.',
    'auth/email-already-in-use': 'This email is already registered.',
    'auth/invalid-email': 'Invalid email address.',
    'auth/weak-password': 'Password is too weak.',
    'auth/too-many-requests': 'Too many attempts. Try again later.',
  };
  return errors[code] || 'Something went wrong. Please try again.';
}
