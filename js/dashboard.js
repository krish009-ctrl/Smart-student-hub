// dashboard - shows overview stats, todays schedule, recent announcements

const SUBJECTS = {
  'network-management': 'Network Management',
  'data-information-security': 'Data & Info Security',
  'wireless-media-communication': 'Wireless Communication',
  'open-source-technologies': 'Open Source Technologies'
};

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

document.addEventListener('DOMContentLoaded', () => {
  setGreeting();
  loadDashboardData();
  loadTodaySchedule();
});

function setGreeting() {
  const hour = new Date().getHours();
  let greet = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  auth.onAuthStateChanged(async (user) => {
    if (user) {
      const doc = await db.collection('users').doc(user.uid).get();
      const name = doc.exists ? doc.data().name.split(' ')[0] : 'Student';
      document.getElementById('greetMsg').textContent = `${greet}, ${name}! 👋`;
    }
  });
}

async function loadDashboardData() {
  auth.onAuthStateChanged(async (user) => {
    if (!user) return;

    // notes count
    const notes = await db.collection('notes').get();
    document.getElementById('notesCount').textContent = notes.size;

    // announcements count
    const ann = await db.collection('announcements').get();
    document.getElementById('announcementsCount').textContent = ann.size;

    // avg attendance
    const attSnap = await db.collection('attendance').where('uid', '==', user.uid).get();
    if (!attSnap.empty) {
      const records = attSnap.docs.map(d => d.data());
      const total = records.length;
      const present = records.filter(r => r.status === 'present').length;
      const avg = total > 0 ? Math.round((present / total) * 100) : 0;
      document.getElementById('attendanceAvg').textContent = avg + '%';
    }

    // recent announcements (last 3)
    const recentAnn = await db.collection('announcements')
      .orderBy('createdAt', 'desc').limit(3).get();
    const annContainer = document.getElementById('recentAnnouncements');

    if (recentAnn.empty) {
      annContainer.innerHTML = '<div class="empty-state"><i class="fas fa-bullhorn"></i><p>No announcements yet</p></div>';
    } else {
      annContainer.innerHTML = '';
      recentAnn.forEach(doc => {
        const d = doc.data();
        const div = document.createElement('div');
        div.className = 'ann-item';
        div.innerHTML = `
          <span class="ann-badge ${d.category || 'general'}">${(d.category || 'general').toUpperCase()}</span>
          <div>
            <strong>${d.title}</strong>
            <p style="color:var(--text2);font-size:0.85rem;margin-top:4px">${d.content?.substring(0, 100)}${d.content?.length > 100 ? '...' : ''}</p>
          </div>`;
        annContainer.appendChild(div);
      });
    }
  });
}

async function loadTodaySchedule() {
  const today = DAYS[new Date().getDay()];
  const snap = await db.collection('timetable').where('day', '==', today).orderBy('startTime').get();
  const container = document.getElementById('todaySchedule');

  if (snap.empty) {
    container.innerHTML = '<p style="color:var(--text2)">No classes scheduled for today.</p>';
    return;
  }

  container.innerHTML = '';
  snap.forEach(doc => {
    const d = doc.data();
    const div = document.createElement('div');
    div.className = 'schedule-item';
    div.innerHTML = `<div class="time">${d.startTime} – ${d.endTime}</div><div class="subj">${SUBJECTS[d.subject] || d.subject}</div>${d.teacher ? `<div style="font-size:0.78rem;color:var(--text2)">${d.teacher}</div>` : ''}`;
    container.appendChild(div);
  });
}
