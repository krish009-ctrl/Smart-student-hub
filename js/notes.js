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

async function loadNotes() {
  const grid = document.getElementById('notesGrid');
  if (!grid) return;
  
  grid.innerHTML = '<div class="loading"><i class="fas fa-spinner fa-spin"></i> Loading notes...</div>';

  try {
    const { data, error } = await window.supabaseClient
      .from('notes')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    allNotes = data || [];
    renderNotes(allNotes);
  } catch (error) {
    console.error('Error loading notes:', error);
    grid.innerHTML = `
      <div class="empty-state">
        <i class="fas fa-exclamation-circle"></i>
        <h3>Could not load notes</h3>
        <p>Check your Supabase setup and internet connection.</p>
      </div>`;
  }
}

function renderNotes(notes) {
  const grid = document.getElementById('notesGrid');
  if (!grid) return;

  const filtered = currentFilter === 'all'
    ? notes
    : notes.filter(n => n.subject === currentFilter);

  if (filtered.length === 0) {
    grid.innerHTML = `
      <div class="empty-state">
        <i class="fas fa-file-alt"></i>
        <h3>No notes found</h3>
        <p>Be the first to upload notes!</p>
      </div>`;
    return;
  }

  grid.innerHTML = '';
  filtered.forEach(note => {
    const color = SUBJECT_COLORS[note.subject] || '#0ea5e9';
    const subjectName = SUBJECT_NAMES[note.subject] || note.subject;
    
    let dateStr = 'Recently';
    if (note.created_at) {
      dateStr = new Date(note.created_at).toLocaleDateString('en-IN', {
        day: '2-digit', month: 'short', year: 'numeric'
      });
    }

    const card = document.createElement('div');
    card.className = 'note-card';
    card.innerHTML = `
      <div class="note-card-top">
        <div>
          <span style="font-size:0.78rem;font-weight:600;color:${color};background:${color}22;padding:3px 10px;border-radius:20px">
            ${subjectName}
          </span>
        </div>
        <div class="note-subject-dot" style="background:${color}"></div>
      </div>
      <h3>${note.title}</h3>
      <div class="note-meta">
        ${note.unit ? `<span><i class="fas fa-bookmark"></i> ${note.unit}</span>` : ''}
        <span><i class="fas fa-user"></i> ${note.uploaded_by || 'Student'}</span>
        <span><i class="fas fa-calendar"></i> ${dateStr}</span>
      </div>
      ${note.description ? `<p class="note-desc">${note.description}</p>` : ''}
      <div class="note-actions">
        ${note.file_url ? `
          <button class="btn-sm download" onclick="viewNote('${note.file_url}')">
            <i class="fas fa-eye"></i> View
          </button>
          <button class="btn-sm download" onclick="downloadNote('${note.file_url}', '${note.title}.pdf')">
            <i class="fas fa-download"></i> Download
          </button>
        ` : ''}
        <button class="btn-sm delete" onclick="deleteNote('${note.id}', '${note.file_url || ''}')">
          <i class="fas fa-trash"></i>
        </button>
      </div>`;
    grid.appendChild(card);
  });
}

async function uploadNote() {
  const title = document.getElementById('noteTitle').value.trim();
  const subject = document.getElementById('noteSubject').value;
  const unit = document.getElementById('noteUnit').value.trim();
  const desc = document.getElementById('noteDesc').value.trim();
  const file = document.getElementById('noteFile').files[0];

  if (!title || !subject) {
    return showUploadMsg('Please fill in the title and select a subject.', 'error');
  }
  if (!file) {
    return showUploadMsg('Please select a file to upload.', 'error');
  }
  if (file.size > 10 * 1024 * 1024) {
    return showUploadMsg('File too large! Maximum size is 10MB.', 'error');
  }

  const { data: { session } } = await window.supabaseClient.auth.getSession();
  if (!session) {
    return showUploadMsg('You need to be logged in to upload notes.', 'error');
  }

  let uploaderName = 'Student';
  try {
    const { data: profile } = await window.supabaseClient
      .from('profiles')
      .select('name')
      .eq('id', session.user.id)
      .single();
    if (profile) uploaderName = profile.name;
  } catch (e) { }

  const progressDiv = document.getElementById('uploadProgress');
  const progressFill = document.getElementById('progressFill');
  const progressText = document.getElementById('progressText');
  if (progressDiv) progressDiv.classList.remove('hidden');

  try {
    const filePath = `notes/${subject}/${Date.now()}_${file.name}`;
    
    // Quick fake progress since Supabase JS doesn't have an easy native progress event listener for small files
    let prog = 0;
    const interval = setInterval(() => {
      prog += 10;
      if (prog > 90) prog = 90;
      if (progressFill) progressFill.style.width = prog + '%';
      if (progressText) progressText.textContent = prog + '%';
    }, 200);

    const { data: uploadData, error: uploadError } = await window.supabaseClient.storage
      .from('notes-pdfs')
      .upload(filePath, file);

    clearInterval(interval);
    if (progressFill) progressFill.style.width = '100%';
    if (progressText) progressText.textContent = '100%';

    if (uploadError) throw uploadError;

    const { data: publicUrlData } = window.supabaseClient.storage
      .from('notes-pdfs')
      .getPublicUrl(filePath);

    const { error: dbError } = await window.supabaseClient.from('notes').insert([
      {
        title: title,
        subject: subject,
        uploaded_by: uploaderName,
        file_url: publicUrlData.publicUrl
      }
    ]);

    if (dbError) throw dbError;

    showUploadMsg('Note uploaded successfully! ✅', 'success');

    setTimeout(() => {
      closeUploadModal();
      if (progressDiv) progressDiv.classList.add('hidden');
      if (progressFill) progressFill.style.width = '0%';
      document.getElementById('noteTitle').value = '';
      document.getElementById('noteSubject').value = '';
      document.getElementById('noteUnit').value = '';
      document.getElementById('noteDesc').value = '';
      document.getElementById('noteFile').value = '';
      document.getElementById('fileName').textContent = 'No file chosen';
      loadNotes();
    }, 1500);
  } catch (error) {
    showUploadMsg('Error: ' + error.message, 'error');
    if (progressDiv) progressDiv.classList.add('hidden');
  }
}

function viewNote(url) {
  window.open(url, '_blank');
}

function downloadNote(url, filename) {
  const a = document.createElement('a');
  a.href = url;
  a.target = '_blank';
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

async function deleteNote(noteId, fileUrl) {
  if (!confirm('Delete this note? This cannot be undone.')) return;

  try {
    await window.supabaseClient.from('notes').delete().eq('id', noteId);

    if (fileUrl) {
      try {
        const bucketPathStr = '/object/public/notes-pdfs/';
        const pathIndex = fileUrl.indexOf(bucketPathStr);
        if (pathIndex !== -1) {
          const filePath = fileUrl.substring(pathIndex + bucketPathStr.length);
          await window.supabaseClient.storage.from('notes-pdfs').remove([decodeURIComponent(filePath)]);
        }
      } catch (e) {
        console.log('File deletion warning:', e.message);
      }
    }

    loadNotes();
  } catch (error) {
    alert('Error deleting note: ' + error.message);
  }
}

function filterNotes(subject) {
  currentFilter = subject;
  document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
  if (event && event.target) event.target.classList.add('active');
  renderNotes(allNotes);
}

function searchNotes() {
  const query = document.getElementById('searchInput').value.toLowerCase();
  const filtered = allNotes.filter(note =>
    note.title.toLowerCase().includes(query) ||
    (SUBJECT_NAMES[note.subject] || '').toLowerCase().includes(query) ||
    (note.unit || '').toLowerCase().includes(query) ||
    (note.description || '').toLowerCase().includes(query)
  );
  renderNotes(filtered);
}

function openUploadModal() {
  const modal = document.getElementById('uploadModal');
  if (modal) modal.classList.remove('hidden');
}

function closeUploadModal() {
  const modal = document.getElementById('uploadModal');
  if (modal) modal.classList.add('hidden');
}

function fileSelected(input) {
  const name = input.files[0]?.name || 'No file chosen';
  const nameEl = document.getElementById('fileName');
  if (nameEl) nameEl.textContent = name;
}

function showUploadMsg(msg, type) {
  const el = document.getElementById('uploadMsg');
  if (el) {
    el.textContent = msg;
    el.className = 'auth-msg ' + type;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const params = new URLSearchParams(window.location.search);
  const subjectParam = params.get('subject');
  if (subjectParam) {
    currentFilter = subjectParam;
    document.querySelectorAll('.filter-btn').forEach(btn => {
      if (btn.getAttribute('onclick') && btn.getAttribute('onclick').includes(subjectParam)) {
        btn.classList.add('active');
      } else if (!btn.getAttribute('onclick')?.includes("'all'")) {
        btn.classList.remove('active');
      }
    });
  }
  loadNotes();
});

// Drag & drop support
document.addEventListener('DOMContentLoaded', () => {
  const dz = document.getElementById('dropZone');
  if (dz) {
    dz.addEventListener('dragover', e => { e.preventDefault(); dz.classList.add('dragging'); });
    dz.addEventListener('dragleave', () => dz.classList.remove('dragging'));
    dz.addEventListener('drop', e => {
      e.preventDefault();
      dz.classList.remove('dragging');
      const fileInput = document.getElementById('noteFile');
      if (fileInput) {
        fileInput.files = e.dataTransfer.files;
        if (typeof fileSelected === 'function') fileSelected(fileInput);
      }
    });
  }
});
