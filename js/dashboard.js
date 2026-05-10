const SUBJECTS_MAP = {
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
  let greet = 'Good evening';
  if (hour < 12) greet = 'Good morning';
  else if (hour < 17) greet = 'Good afternoon';

  window.supabaseClient.auth.getSession().then(async ({ data: { session } }) => {
    if (!session) return;
    try {
      const { data, error } = await window.supabaseClient
        .from('profiles')
        .select('name')
        .eq('id', session.user.id)
        .single();
        
      const firstName = data ? data.name.split(' ')[0] : 'Student';
      const greetEl = document.getElementById('greetMsg');
      if (greetEl) greetEl.textContent = `${greet}, ${firstName}! 👋`;
    } catch (e) {
      console.log('Greeting error:', e);
    }
  });
}

async function loadDashboardData() {
  window.supabaseClient.auth.getSession().then(async ({ data: { session } }) => {
    if (!session) return;

    try {
      // Notes count
      const { count: notesCount } = await window.supabaseClient
        .from('notes')
        .select('*', { count: 'exact', head: true });
        
      const notesEl = document.getElementById('notesCount');
      if (notesEl) notesEl.textContent = notesCount || 0;

      // Announcements count
      const { count: annCount } = await window.supabaseClient
        .from('announcements')
        .select('*', { count: 'exact', head: true });
        
      const annEl = document.getElementById('announcementsCount');
      if (annEl) annEl.textContent = annCount || 0;

      // Attendance
      const { data: attData } = await window.supabaseClient
        .from('attendance')
        .select('*')
        .eq('user_id', session.user.id);
        
      if (attData && attData.length > 0) {
        const total = attData.length;
        const present = attData.filter(r => r.status === 'present').length;
        const avg = total > 0 ? Math.round((present / total) * 100) : 0;
        const attEl = document.getElementById('attendanceAvg');
        if (attEl) attEl.textContent = avg + '%';
      }

      // Recent announcements
      const { data: recentAnn } = await window.supabaseClient
        .from('announcements')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(3);

      const annContainer = document.getElementById('recentAnnouncements');
      if (!annContainer) return;

      if (!recentAnn || recentAnn.length === 0) {
        annContainer.innerHTML = '<div class="empty-state"><i class="fas fa-bullhorn"></i><p>No announcements yet</p></div>';
      } else {
        annContainer.innerHTML = '';
        recentAnn.forEach(d => {
          const div = document.createElement('div');
          div.className = 'ann-item';
          div.innerHTML = `
            <span class="ann-badge ${d.category || 'general'}">${(d.category || 'general').toUpperCase()}</span>
            <div>
              <strong>${d.title}</strong>
              <p style="color:var(--text2);font-size:0.85rem;margin-top:4px">
                ${d.content ? d.content.substring(0, 100) : ''}${d.content && d.content.length > 100 ? '...' : ''}
              </p>
            </div>`;
          annContainer.appendChild(div);
        });
      }
    } catch (error) {
      console.log('Dashboard data error:', error);
    }
  });
}

async function loadTodaySchedule() {
  const today = DAYS[new Date().getDay()];
  const container = document.getElementById('todaySchedule');
  if (!container) return;

  try {
    const { data: schedule } = await window.supabaseClient
      .from('timetable')
      .select('*')
      .eq('day', today)
      .order('start_time', { ascending: true });

    if (!schedule || schedule.length === 0) {
      container.innerHTML = '<p style="color:var(--text2)">No classes scheduled for today. 🎉</p>';
      return;
    }

    container.innerHTML = '';
    schedule.forEach(d => {
      const div = document.createElement('div');
      div.className = 'schedule-item';
      div.innerHTML = `
        <div class="time">${d.start_time || d.startTime} – ${d.end_time || d.endTime}</div>
        <div class="subj">${SUBJECTS_MAP[d.subject] || d.subject}</div>
        ${d.teacher ? `<div style="font-size:0.78rem;color:var(--text2)">${d.teacher}</div>` : ''}`;
      container.appendChild(div);
    });
  } catch (error) {
    container.innerHTML = '<p style="color:var(--text2)">Could not load schedule.</p>';
    console.log('Schedule error:', error);
  }
}
