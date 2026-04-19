// notes page - upload, view, filter, delete notes

const SUBJECT_COLORS = {
  'network-management': '#0ea5e9',
  'data-information-security': '#8b5cf6',
  'wireless-media-communication': '#10b981',
  'open-source-technologies': '#f59e0b'
};

const SUBJECT_NAMES = {
  'network-management': 'Network Management',
  'data-information-security': 'Data & Info Security',
  'wireless-media-communication': 'Wireless Communication',
  'open-source-technologies': 'Open Source Technologies'
};

let allNotes = [];
let currentFilter = 'all';

document.addEventListener('DOMContentLoaded', () => {
  // check if theres a subject in the url (coming from home page cards)
  const params = new URLSearchParams(window.location.search);
  const subjectParam = params.get('subject');
  if (subjectParam) {
    currentFilter = subjectParam;
    document.querySelectorAll('.filter-btn').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('onclick').includes(subjectParam));
    });
  }
  loadNotes();
});

async function loadNotes() {
  const grid = document.getElementById('notesGrid');
  grid.innerHTML = '<div class="loading"><i class="fas fa-spinner fa-spin"></i> Loading notes...</div>';
  try {
    const snap = await db.collection('notes').orderBy('createdAt', 'desc').get();
    allNotes = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    renderNotes(allNotes);
  } catch (e) {
    grid.innerHTML = '<div class="empty-state"><i class="fas fa-exclamation-circle"></i><p>Error loading notes. Check Firebase setup.</p></div>';
  }
}

function renderNotes(notes) {
  const grid = document.getElementById('notesGrid');
  const filtered = currentFilter === 'all' ? notes : notes.filter(n => n.subject === currentFilter);

  if (filtered.length === 0) {
    grid.innerHTML = '<div class="empty-state"><i class="fas fa-file-alt"></i><p>No notes found. Be the first to upload!</p></div>';
    return;
  }

  grid.innerHTML = '';
  filtered.forEach(note => {
    const color = SUBJECT_COLORS[note.subject] || '#0ea5e9';
    const subjectName = SUBJECT_NAMES[note.subject] || note.subject;
    const date = note.createdAt?.toDate ? note.createdAt.toDate().toLocaleDateString() : 'Recently';

    const card = document.createElement('div');
    card.className = 'note-card';
    card.innerHTML = `
      <div class="note-card-top">
        <div>
          <span style="font-size:0.78rem;font-weight:600;color:${color};background:${color}22;padding:3px 10px;border-radius:20px">${subjectName}</span>
        </div>
        <div class="note-subject-dot" style="background:${color}"></div>
      </div>
      <h3>${note.title}</h3>
      <div class="note-meta">
        ${note.unit ? `<span><i class="fas fa-bookmark"></i> ${note.unit}</span>` : ''}
        <span><i class="fas fa-user"></i> ${note.uploadedBy || 'Student'}</span>
        <span><i class="fas fa-calendar"></i> ${date}</span>
      </div>
      ${note.description ? `<p class="note-desc">${note.description}</p>` : ''}
      <div class="note-actions">
        <button class="btn-sm download" onclick="downloadNote('${note.fileUrl}','${note.title}')">
          <i class="fas fa-download"></i> Download
        </button>
        <button class="btn-sm delete" onclick="deleteNote('${note.id}','${note.fileRef || ''}')">
          <i class="fas fa-trash"></i>
        </button>
      </div>`;
    grid.appendChild(card);
  });
}

function filterNotes(subject) {
  currentFilter = subject;
  document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
  event.target.classList.add('active');
  renderNotes(allNotes);
}

function searchNotes() {
  const q = document.getElementById('searchInput').value.toLowerCase();
  const filtered = allNotes.filter(n =>
    n.title.toLowerCase().includes(q) ||
    (SUBJECT_NAMES[n.subject] || '').toLowerCase().includes(q) ||
    (n.unit || '').toLowerCase().includes(q)
  );
  renderNotes(filtered);
}

function openUploadModal() { document.getElementById('uploadModal').classList.remove('hidden'); }
function closeUploadModal() { document.getElementById('uploadModal').classList.add('hidden'); }

function fileSelected(input) {
  const name = input.files[0]?.name || 'No file chosen';
  document.getElementById('fileName').textContent = name;
}

async function uploadNote() {
  const title = document.getElementById('noteTitle').value.trim();
  const subject = document.getElementById('noteSubject').value;
  const unit = document.getElementById('noteUnit').value.trim();
  const desc = document.getElementById('noteDesc').value.trim();
  const file = document.getElementById('noteFile').files[0];

  if (!title || !subject) return showUploadMsg('Please fill title and subject.', 'error');
  if (!file) return showUploadMsg('Please select a file to upload.', 'error');
  if (file.size > 10 * 1024 * 1024) return showUploadMsg('File too large. Max 10MB.', 'error');

  const user = auth.currentUser;
  if (!user) return showUploadMsg('Please log in again.', 'error');

  // get the user's name for the uploaded-by field
  let uploaderName = 'Student';
  try {
    const userDoc = await db.collection('users').doc(user.uid).get();
    if (userDoc.exists) uploaderName = userDoc.data().name;
  } catch (e) { }

  document.getElementById('uploadProgress').classList.remove('hidden');
  const progressFill = document.getElementById('progressFill');
  const progressText = document.getElementById('progressText');

  try {
    const fileRef = `notes/${subject}/${Date.now()}_${file.name}`;
    const storageRef = storage.ref(fileRef);
    const uploadTask = storageRef.put(file);

    uploadTask.on('state_changed',
      (snapshot) => {
        const pct = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
        progressFill.style.width = pct + '%';
        progressText.textContent = pct + '%';
      },
      (error) => {
        showUploadMsg('Upload failed: ' + error.message, 'error');
        document.getElementById('uploadProgress').classList.add('hidden');
      },
      async () => {
        const downloadURL = await uploadTask.snapshot.ref.getDownloadURL();
        await db.collection('notes').add({
          title, subject, unit, description: desc,
          fileUrl: downloadURL,
          fileRef: fileRef,
          fileName: file.name,
          fileSize: file.size,
          uploadedBy: uploaderName,
          uid: user.uid,
          createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        showUploadMsg('Note uploaded successfully! ✅', 'success');
        setTimeout(() => {
          closeUploadModal();
          document.getElementById('uploadProgress').classList.add('hidden');
          progressFill.style.width = '0%';
          document.getElementById('noteTitle').value = '';
          document.getElementById('noteSubject').value = '';
          document.getElementById('noteUnit').value = '';
          document.getElementById('noteDesc').value = '';
          document.getElementById('noteFile').value = '';
          document.getElementById('fileName').textContent = 'No file chosen';
          loadNotes();
        }, 1500);
      }
    );
  } catch (e) {
    showUploadMsg('Error: ' + e.message, 'error');
  }
}

function downloadNote(url, title) {
  const a = document.createElement('a');
  a.href = url;
  a.target = '_blank';
  a.download = title;
  a.click();
}

async function deleteNote(id, fileRef) {
  if (!confirm('Delete this note? This cannot be undone.')) return;
  try {
    await db.collection('notes').doc(id).delete();
    if (fileRef) await storage.ref(fileRef).delete().catch(() => { });
    loadNotes();
  } catch (e) {
    alert('Error deleting note: ' + e.message);
  }
}

function showUploadMsg(msg, type) {
  const el = document.getElementById('uploadMsg');
  el.textContent = msg;
  el.className = 'auth-msg ' + type;
}
