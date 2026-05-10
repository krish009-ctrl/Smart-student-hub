// timetable.js (Supabase)

const SUBJECTS = {
  'network-management': 'Network Management',
  'data-information-security': 'Data & Info Security',
  'wireless-media-communication': 'Wireless Communication',
  'open-source-technologies': 'Open Source Technologies'
};

const SUBJECT_CLASS = {
  'network-management': 's1',
  'data-information-security': 's2',
  'wireless-media-communication': 's3',
  'open-source-technologies': 's4'
};

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const TIME_SLOTS = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00'];

let timetableEntries = [];

document.addEventListener('DOMContentLoaded', () => {
  setTodayBanner();
  loadTimetable();
});

function setTodayBanner() {
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const today = dayNames[new Date().getDay()];
  document.getElementById('todayText').textContent = `Today is ${today} — check your classes below`;
}

async function loadTimetable() {
  try {
    const { data } = await window.supabaseClient
      .from('timetable')
      .select('*')
      .order('start_time', { ascending: true });
    timetableEntries = data || [];
    renderTimetable();
  } catch (e) {
    console.log('Error loading timetable:', e);
  }
}

function renderTimetable() {
  const tbody = document.getElementById('timetableBody');
  if (!tbody) return;
  tbody.innerHTML = '';

  TIME_SLOTS.forEach((slot, i) => {
    const nextSlot = TIME_SLOTS[i + 1] || '17:00';
    const tr = document.createElement('tr');
    let row = `<td class="time-col">${slot} – ${nextSlot}</td>`;

    DAYS.forEach(day => {
      const entry = timetableEntries.find(e =>
        e.day === day && 
        (e.start_time || e.startTime) >= slot && 
        (e.start_time || e.startTime) < nextSlot
      );
      if (entry) {
        const cls = SUBJECT_CLASS[entry.subject] || 's1';
        row += `<td>
          <div class="tt-cell ${cls}">
            ${SUBJECTS[entry.subject] || entry.subject}
            ${entry.teacher ? `<div class="teacher">${entry.teacher}</div>` : ''}
            ${entry.room ? `<div class="teacher"><i class="fas fa-door-open"></i> ${entry.room}</div>` : ''}
          </div>
          <button onclick="deleteTTEntry('${entry.id}')" style="margin-top:4px;background:none;border:none;color:var(--text2);cursor:pointer;font-size:0.75rem">✕ remove</button>
        </td>`;
      } else {
        row += `<td style="color:var(--bg3)">—</td>`;
      }
    });

    tr.innerHTML = row;
    tbody.appendChild(tr);
  });
}

function openTTModal() { document.getElementById('ttModal').classList.remove('hidden'); }
function closeTTModal() { document.getElementById('ttModal').classList.add('hidden'); }

async function addTimetableEntry() {
  const subject = document.getElementById('ttSubject').value;
  const day = document.getElementById('ttDay').value;
  const startTime = document.getElementById('ttStart').value;
  const endTime = document.getElementById('ttEnd').value;
  const teacher = document.getElementById('ttTeacher').value.trim();
  const room = document.getElementById('ttRoom').value.trim();
  const msgEl = document.getElementById('ttMsg');

  if (!subject || !day || !startTime || !endTime) {
    msgEl.textContent = 'Please fill subject, day, and time.';
    msgEl.className = 'auth-msg error';
    return;
  }

  try {
    const { error } = await window.supabaseClient.from('timetable').insert([{
      subject, 
      day, 
      start_time: startTime, 
      end_time: endTime,
      teacher: teacher || null,
      room: room || null
    }]);

    if (error) throw error;

    msgEl.textContent = 'Class added! ✅';
    msgEl.className = 'auth-msg success';
    await loadTimetable();
    setTimeout(() => {
      closeTTModal();
      msgEl.className = 'auth-msg';
      msgEl.textContent = '';
    }, 1200);
  } catch (e) {
    msgEl.textContent = 'Error: ' + e.message;
    msgEl.className = 'auth-msg error';
  }
}

async function deleteTTEntry(id) {
  if (!confirm('Remove this class from timetable?')) return;
  await window.supabaseClient.from('timetable').delete().eq('id', id);
  loadTimetable();
}
