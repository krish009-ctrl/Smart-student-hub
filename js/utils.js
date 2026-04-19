// shared stuff for college hub

// all our subjects with colors and stuff
const SUBJECTS = [
  { id: 1, name: "Network Management", short: "NM", color: "#3b82f6", cls: "subj-1", emoji: "🌐" },
  { id: 2, name: "Data & Information Security", short: "DIS", color: "#8b5cf6", cls: "subj-2", emoji: "🔒" },
  { id: 3, name: "Wireless & Mobile Communication", short: "WMC", color: "#22c55e", cls: "subj-3", emoji: "📡" },
  { id: 4, name: "Open Source Technologies", short: "OST", color: "#f97316", cls: "subj-4", emoji: "🐧" },
  { id: 5, name: "Major Project", short: "Project", color: "#ef4444", cls: "subj-5", emoji: "🛠️" },
  { id: 6, name: "Network Mgmt. Lab", short: "NM Lab", color: "#60a5fa", cls: "subj-6", emoji: "🖧" },
  { id: 7, name: "Open Source Lab", short: "OS Lab", color: "#fb923c", cls: "subj-7", emoji: "💻" },
];

// navbar for inner pages
function renderNav(activePage) {
  const pages = [
    { href: "../index.html", icon: "🏠", label: "Home" },
    { href: "notes.html", icon: "📚", label: "Notes" },
    { href: "announcements.html", icon: "📢", label: "Announcements" },
    { href: "timetable.html", icon: "🗓️", label: "Timetable" },
    { href: "attendance.html", icon: "✅", label: "Attendance" },
    { href: "ai-summarizer.html", icon: "🤖", label: "AI Summarizer" },
  ];

  const linksHtml = pages.map(p =>
    `<li><a href="${p.href}" class="${activePage === p.label ? 'active' : ''}">${p.icon} ${p.label}</a></li>`
  ).join('');

  return `
  <nav class="navbar">
    <a href="../index.html" class="nav-logo">
      🎓 <span>College Hub</span>
    </a>
    <ul class="nav-links" id="navLinks">${linksHtml}</ul>
    <div class="nav-right">
      <span class="nav-badge">6th Sem · CS/IT</span>
      <div class="hamburger" id="hamburger" onclick="toggleNav()">
        <span></span><span></span><span></span>
      </div>
    </div>
  </nav>`;
}

// separate nav for the home/landing page (slightly different paths)
function renderHomeNav(activePage) {
  const pages = [
    { href: "pages/notes.html", icon: "📚", label: "Notes" },
    { href: "pages/announcements.html", icon: "📢", label: "Announcements" },
    { href: "pages/timetable.html", icon: "🗓️", label: "Timetable" },
    { href: "pages/attendance.html", icon: "✅", label: "Attendance" },
    { href: "pages/ai-summarizer.html", icon: "🤖", label: "AI Summarizer" },
  ];

  const linksHtml = pages.map(p =>
    `<li><a href="${p.href}">${p.icon} ${p.label}</a></li>`
  ).join('');

  return `
  <nav class="navbar">
    <a href="index.html" class="nav-logo">🎓 <span>College Hub</span></a>
    <ul class="nav-links" id="navLinks">${linksHtml}</ul>
    <div class="nav-right">
      <span class="nav-badge">6th Sem · CS/IT</span>
      <div class="hamburger" id="hamburger" onclick="toggleNav()">
        <span></span><span></span><span></span>
      </div>
    </div>
  </nav>`;
}

function toggleNav() {
  document.getElementById('navLinks').classList.toggle('open');
}

// toast notifications
function showToast(message, type = 'info') {
  const icons = { success: '✅', error: '❌', info: 'ℹ️' };
  const container = document.getElementById('toast-container');
  if (!container) return;
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `<span>${icons[type]}</span> ${message}`;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 3500);
}

// localstorage wrappers
function getStore(key) {
  try { return JSON.parse(localStorage.getItem(key)) || []; }
  catch { return []; }
}
function setStore(key, data) {
  localStorage.setItem(key, JSON.stringify(data));
}

// date formatting
function formatDate(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function timeAgo(dateStr) {
  const diff = Math.floor((new Date() - new Date(dateStr)) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

// subject lookup helpers
function getSubject(id) {
  return SUBJECTS.find(s => s.id == id) || SUBJECTS[0];
}

function subjectSelector(selectedId = '') {
  return SUBJECTS.map(s =>
    `<option value="${s.id}" ${selectedId == s.id ? 'selected' : ''}>${s.emoji} ${s.name}</option>`
  ).join('');
}
