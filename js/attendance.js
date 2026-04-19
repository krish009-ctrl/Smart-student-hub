// attendance tracking

const SUBJECTS = {
  'network-management': 'Network Management',
  'data-information-security': 'Data & Info Security',
  'wireless-media-communication': 'Wireless Communication',
  'open-source-technologies': 'Open Source Technologies'
};

let allAttRecords = [];
let currentUID = null;

document.addEventListener('DOMContentLoaded', () => {
  // default to todays date
  document.getElementById('attDate').value = new Date().toISOString().split('T')[0];
  auth.onAuthStateChanged(user => {
    if (user) {
      currentUID = user.uid;
      loadAttendance();
    }
  });
});

async function loadAttendance() {
  const snap = await db.collection('attendance')
    .where('uid', '==', currentUID)
    .orderBy('date', 'desc')
    .get();
  allAttRecords = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  renderAttCards();
  renderAttLog(allAttRecords);
}

// builds the subject-wise summary cards
function renderAttCards() {
  const grid = document.getElementById('attendanceGrid');
  grid.innerHTML = '';

  Object.entries(SUBJECTS).forEach(([key, name]) => {
    const subRecords = allAttRecords.filter(r => r.subject === key);
    const total = subRecords.length;
    const present = subRecords.filter(r => r.status === 'present').length;
    const pct = total > 0 ? Math.round((present / total) * 100) : 0;
    const cls = pct >= 75 ? 'good' : pct >= 60 ? 'warn' : 'danger';

    const card = document.createElement('div');
    card.className = 'att-card';
    card.innerHTML = `
      <div class="att-card-top">
        <h3>${name}</h3>
      </div>
      <div class="att-percentage ${cls}">${pct}%</div>
      <div class="att-bar"><div class="att-bar-fill ${cls}" style="width:${pct}%"></div></div>
      <div class="att-stats">
        <span>✅ ${present} Present</span>
        <span>❌ ${total - present} Absent</span>
        <span>📅 ${total} Total</span>
      </div>
      ${pct < 75 && total > 0 ? `<div style="margin-top:10px;font-size:0.8rem;color:var(--danger);background:rgba(239,68,68,0.1);padding:6px 10px;border-radius:6px">⚠️ Below 75% — ${calcNeeded(present, total)} more classes needed</div>` : ''}
    `;
    grid.appendChild(card);
  });
}

// how many classes you need to attend in a row to hit 75%
function calcNeeded(present, total) {
  let p = present, t = total;
  let needed = 0;
  while (t > 0 && (p / t) < 0.75) {
    p++; t++; needed++;
    if (needed > 100) break; // safety check
  }
  return needed;
}

function renderAttLog(records) {
  const tbody = document.getElementById('attLogBody');
  if (records.length === 0) {
    tbody.innerHTML = '<tr><td colspan="4" class="empty-row">No attendance records yet. Start marking!</td></tr>';
    return;
  }
  tbody.innerHTML = '';
  records.forEach(r => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${r.date}</td>
      <td>${SUBJECTS[r.subject] || r.subject}</td>
      <td><span class="status-badge ${r.status}">${r.status.charAt(0).toUpperCase() + r.status.slice(1)}</span></td>
      <td><button onclick="deleteAttRecord('${r.id}')" style="background:none;border:none;color:var(--danger);cursor:pointer;font-size:0.85rem"><i class="fas fa-trash"></i></button></td>`;
    tbody.appendChild(tr);
  });
}

function filterAttLog(subject) {
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  event.target.classList.add('active');
  const filtered = subject === 'all' ? allAttRecords : allAttRecords.filter(r => r.subject === subject);
  renderAttLog(filtered);
}

async function markAttendance() {
  const subject = document.getElementById('attSubject').value;
  const date = document.getElementById('attDate').value;
  const status = document.getElementById('attStatus').value;
  const msgEl = document.getElementById('attMsg');

  if (!subject || !date) {
    msgEl.textContent = 'Please select subject and date.';
    msgEl.className = 'auth-msg error';
    return;
  }

  // dont allow duplicate entries for same subject+date
  const dup = allAttRecords.find(r => r.subject === subject && r.date === date);
  if (dup) {
    msgEl.textContent = 'Record for this subject & date already exists.';
    msgEl.className = 'auth-msg error';
    return;
  }

  try {
    await db.collection('attendance').add({
      uid: currentUID,
      subject, date, status,
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    msgEl.textContent = 'Attendance saved! ✅';
    msgEl.className = 'auth-msg success';
    await loadAttendance();
    setTimeout(() => { msgEl.className = 'auth-msg'; msgEl.textContent = ''; }, 2000);
  } catch (e) {
    msgEl.textContent = 'Error: ' + e.message;
    msgEl.className = 'auth-msg error';
  }
}

async function deleteAttRecord(id) {
  if (!confirm('Delete this attendance record?')) return;
  await db.collection('attendance').doc(id).delete();
  await loadAttendance();
}
