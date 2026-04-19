// announcements - post/view/delete/filter college announcements

const CATEGORY_ICONS = {
  exam: 'fas fa-pencil-alt',
  holiday: 'fas fa-umbrella-beach',
  event: 'fas fa-star',
  general: 'fas fa-info-circle'
};

let allAnnouncements = [];

document.addEventListener('DOMContentLoaded', loadAnnouncements);

async function loadAnnouncements() {
  const list = document.getElementById('annList');
  list.innerHTML = '<div class="loading"><i class="fas fa-spinner fa-spin"></i> Loading...</div>';

  try {
    const snap = await db.collection('announcements').orderBy('createdAt', 'desc').get();
    allAnnouncements = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    renderAnnouncements(allAnnouncements);
  } catch (e) {
    list.innerHTML = '<div class="empty-state"><i class="fas fa-exclamation"></i><p>Error loading. Check Firebase setup.</p></div>';
  }
}

function renderAnnouncements(announcements) {
  const list = document.getElementById('annList');
  if (announcements.length === 0) {
    list.innerHTML = '<div class="empty-state"><i class="fas fa-bullhorn"></i><p>No announcements yet. Post the first one!</p></div>';
    return;
  }

  list.innerHTML = '';
  announcements.forEach(ann => {
    const cat = ann.category || 'general';
    const icon = CATEGORY_ICONS[cat] || 'fas fa-info-circle';
    const date = ann.eventDate || (ann.createdAt?.toDate ? ann.createdAt.toDate().toLocaleDateString() : '');

    const card = document.createElement('div');
    card.className = 'ann-card';
    card.innerHTML = `
      <div class="ann-card-icon ${cat}"><i class="${icon}"></i></div>
      <div class="ann-card-body">
        <h3>${ann.title}</h3>
        <p>${ann.content}</p>
        <div class="ann-card-footer">
          <span class="ann-badge ${cat}">${cat.toUpperCase()}</span>
          ${date ? `<span><i class="fas fa-calendar"></i> ${date}</span>` : ''}
          <span><i class="fas fa-user"></i> ${ann.postedBy || 'Admin'}</span>
          <button class="ann-delete" onclick="deleteAnn('${ann.id}')"><i class="fas fa-trash"></i> Delete</button>
        </div>
      </div>`;
    list.appendChild(card);
  });
}

function filterAnn(category) {
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  event.target.classList.add('active');
  const filtered = category === 'all' ? allAnnouncements : allAnnouncements.filter(a => a.category === category);
  renderAnnouncements(filtered);
}

function openAnnModal() { document.getElementById('annModal').classList.remove('hidden'); }
function closeAnnModal() { document.getElementById('annModal').classList.add('hidden'); }

async function postAnnouncement() {
  const title = document.getElementById('annTitle').value.trim();
  const category = document.getElementById('annCategory').value;
  const content = document.getElementById('annContent').value.trim();
  const date = document.getElementById('annDate').value;
  const msgEl = document.getElementById('annMsg');

  if (!title || !content) {
    msgEl.textContent = 'Please fill title and content.';
    msgEl.className = 'auth-msg error';
    return;
  }

  const user = auth.currentUser;
  let postedBy = 'Admin';
  try {
    const doc = await db.collection('users').doc(user.uid).get();
    if (doc.exists) postedBy = doc.data().name;
  } catch (e) { }

  try {
    await db.collection('announcements').add({
      title, category, content,
      eventDate: date || null,
      postedBy,
      uid: user.uid,
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    msgEl.textContent = 'Announcement posted! ✅';
    msgEl.className = 'auth-msg success';
    await loadAnnouncements();
    setTimeout(() => {
      closeAnnModal();
      document.getElementById('annTitle').value = '';
      document.getElementById('annContent').value = '';
      document.getElementById('annDate').value = '';
      msgEl.className = 'auth-msg';
    }, 1200);
  } catch (e) {
    msgEl.textContent = 'Error: ' + e.message;
    msgEl.className = 'auth-msg error';
  }
}

async function deleteAnn(id) {
  if (!confirm('Delete this announcement?')) return;
  await db.collection('announcements').doc(id).delete();
  loadAnnouncements();
}
