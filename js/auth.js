// redirect users if they are not logged in
// This runs on EVERY page that includes auth.js
// If the user is NOT logged in, they get sent to login.html
// If they ARE logged in, we load their profile data

async function handleAuthChange(user) {
  // Get the current page name
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  
  // These pages don't need login (anyone can visit them)
  const publicPages = ['login.html', 'register.html', 'index.html'];
  const isPublicPage = publicPages.includes(currentPage);

  if (!user && !isPublicPage) {
    // not logged in
    window.location.href = 'login.html';
    return;
  }

  if (user && (currentPage === 'login.html' || currentPage === 'register.html')) {
    // logged in
    window.location.href = 'dashboard.html';
    return;
  }

  if (user && !isPublicPage) {
    // logged in
    try {
      const { data, error } = await supabaseClient
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (data) {
        // Update UI elements if they exist on the page
        const nameEl = document.getElementById('userName');
        const rollEl = document.getElementById('userRoll');
        const avatarEl = document.getElementById('userAvatar');
        const emailEl = document.getElementById('userEmail');
        
        if (nameEl) nameEl.textContent = data.name || 'Student';
        if (rollEl) rollEl.textContent = data.roll || '';
        if (avatarEl) avatarEl.textContent = (data.name || 'S')[0].toUpperCase();
        if (emailEl) emailEl.textContent = data.email || user.email;
      }
    } catch (err) {
      console.log('Could not load profile:', err);
    }
  }
}

// Check initial session
async function checkSession() {
  const { data: { session } } = await supabaseClient.auth.getSession();
  handleAuthChange(session?.user || null);
}

// Listen for auth state changes
supabaseClient.auth.onAuthStateChange((event, session) => {
  handleAuthChange(session?.user || null);
});

// Run session check on load
checkSession();


// handle login submit
async function loginUser() {
  // Grab what the user typed
  const email = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value;

  // Make sure they filled both fields
  if (!email || !password) {
    return showMsg('Please fill in all fields.', 'error');
  }

  // Show loading state
  const btn = document.getElementById('loginBtn');
  btn.classList.add('loading');
  btn.textContent = 'Signing in...';
  showMsg('Signing in...', 'success');

  try {
    // Try to sign in with Supabase
    const { data, error } = await supabaseClient.auth.signInWithPassword({
      email: email,
      password: password,
    });

    if (error) {
      // Something went wrong — show friendly error
      showMsg(getAuthError(error.message), 'error');
      btn.classList.remove('loading');
      btn.innerHTML = 'Sign In →';
    } else {
      // If successful, redirect to dashboard.html
      window.location.href = 'dashboard.html';
    }
  } catch (error) {
    showMsg('Something went wrong. Please try again.', 'error');
    btn.classList.remove('loading');
    btn.innerHTML = 'Sign In →';
  }
}


// handle registration
async function signupUser() {
  // Grab all the form values
  const name = document.getElementById('signupName').value.trim();
  const email = document.getElementById('signupEmail').value.trim();
  const roll = document.getElementById('signupRoll').value.trim();
  const password = document.getElementById('signupPassword').value;

  // Validate — make sure nothing is empty
  if (!name || !email || !roll || !password) {
    return showMsg('Please fill all fields.', 'error');
  }

  // Password must be at least 6 characters
  if (password.length < 6) {
    return showMsg('Password must be at least 6 characters.', 'error');
  }

  // Show loading state
  const btn = document.getElementById('signupBtn');
  btn.classList.add('loading');
  btn.textContent = 'Creating account...';
  showMsg('Creating account...', 'success');

  try {
    // Step 1: Create the user account in Supabase Auth
    const { data, error } = await supabaseClient.auth.signUp({
      email: email,
      password: password,
    });

    if (error) {
      showMsg(getAuthError(error.message), 'error');
      btn.classList.remove('loading');
      btn.innerHTML = 'Create Account →';
      return;
    }

    if (data.user) {
      // Step 2: Save extra user info in Supabase database ('profiles' table)
      const { error: profileError } = await supabaseClient
        .from('profiles')
        .insert([
          {
            id: data.user.id,
            name: name,
            email: email,
            roll: roll,
            branch: 'CS/IT'
          }
        ]);

      if (profileError) {
        console.error('Error creating profile:', profileError);
      }

      // Redirect to dashboard
      window.location.href = 'dashboard.html';
    }
  } catch (error) {
    showMsg('Something went wrong. Please try again.', 'error');
    btn.classList.remove('loading');
    btn.innerHTML = 'Create Account →';
  }
}


// clear session and redirect
async function logoutUser() {
  try {
    await supabaseClient.auth.signOut();
    // After signing out, redirect to login page
    window.location.href = 'login.html';
  } catch (error) {
    console.log('Logout error:', error);
  }
}


// toggle sidebar on mobile devices
function toggleSidebar() {
  const sidebar = document.getElementById('sidebar');
  if (sidebar) sidebar.classList.toggle('open');
}


// switch between login and register forms
function switchTab(tab) {
  const loginForm = document.getElementById('loginForm');
  const signupForm = document.getElementById('signupForm');
  const tabLogin = document.getElementById('tabLogin');
  const tabSignup = document.getElementById('tabSignup');

  if (loginForm) loginForm.classList.toggle('hidden', tab !== 'login');
  if (signupForm) signupForm.classList.toggle('hidden', tab !== 'signup');
  if (tabLogin) tabLogin.classList.toggle('active', tab === 'login');
  if (tabSignup) tabSignup.classList.toggle('active', tab === 'signup');
  clearMsg();
}


// toggle password visibility
function togglePasswordVisibility(inputId, toggleBtn) {
  const input = document.getElementById(inputId);
  if (input.type === 'password') {
    input.type = 'text';
    toggleBtn.textContent = '🙈';
  } else {
    input.type = 'password';
    toggleBtn.textContent = '👁️';
  }
}


// ui message helpers
function showMsg(msg, type) {
  const el = document.getElementById('authMsg');
  if (!el) return;
  el.textContent = msg;
  el.className = 'auth-msg ' + type;
}

function clearMsg() {
  const el = document.getElementById('authMsg');
  if (el) {
    el.textContent = '';
    el.className = 'auth-msg';
  }
}


// convert supabase errors to user friendly messages
function getAuthError(errorMsg) {
  if (!errorMsg) return 'Something went wrong. Please try again.';
  
  const msg = errorMsg.toLowerCase();
  
  if (msg.includes('invalid login credentials')) {
    return 'Invalid email or password. Please check and try again.';
  }
  if (msg.includes('already registered')) {
    return 'This email is already registered. Try logging in.';
  }
  if (msg.includes('password should be at least')) {
    return 'Password is too weak. Use at least 6 characters.';
  }
  if (msg.includes('valid email')) {
    return 'Please enter a valid email address.';
  }
  if (msg.includes('rate limit')) {
    return 'Too many attempts. Please wait and try again.';
  }
  
  return errorMsg || 'Something went wrong. Please try again.';
}

// Handle Enter key to submit
document.addEventListener('keydown', (e) => {
  if (e.key !== 'Enter') return;
  const loginForm = document.getElementById('loginForm');
  const signupForm = document.getElementById('signupForm');
  
  if (loginForm && !loginForm.classList.contains('hidden')) {
    if (typeof loginUser === 'function') loginUser();
  } else if (signupForm && !signupForm.classList.contains('hidden')) {
    if (typeof signupUser === 'function') signupUser();
  }
});
