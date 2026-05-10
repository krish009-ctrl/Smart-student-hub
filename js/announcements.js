// announcements - post/view/delete/filter college announcements (Supabase)

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
  if (!list) return;
  list.innerHTML = '<div class="loading"><i class="fas fa-spinner fa-spin"></i> Loading...</div>';

  try {
    const { data, error } = await window.supabaseClient
      .from('announcements')
      .select('*')
      .order('created_at', { ascending: false });
      
    if (error) throw error;
    allAnnouncements = data || [];
    renderAnnouncements(allAnnouncements);
  } catch (e) {
    list.innerHTML = '<div class="empty-state"><i class="fas fa-exclamation"></i><p>Error loading. Check Supabase setup.</p></div>';
  }
}

function renderAnnouncements(announcements) {
  const list = document.getElementById('annList');
  if (!list) return;
  
  if (announcements.length === 0) {
    list.innerHTML = '<div class="empty-state"><i class="fas fa-bullhorn"></i><p>No announcements yet. Post the first one!</p></div>';
    return;
  }

  list.innerHTML = '';
  announcements.forEach(ann => {
    const cat = ann.category || 'general';
    const icon = CATEGORY_ICONS[cat] || 'fas fa-info-circle';
    let date = ann.event_date || ann.eventDate || '';
    if (!date && ann.created_at) {
      date = new Date(ann.created_at).toLocaleDateString();
    }

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
          <span><i class="fas fa-user"></i> ${ann.posted_by || ann.postedBy || 'Admin'}</span>
          <button class="ann-delete" onclick="deleteAnn('${ann.id}')"><i class="fas fa-trash"></i> Delete</button>
        </div>
      </div>`;
    list.appendChild(card);
  });
}

function filterAnn(category) {
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  if (event && event.target) event.target.classList.add('active');
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

  const { data: { session } } = await window.supabaseClient.auth.getSession();
  if (!session) return;

  let postedBy = 'Admin';
  try {
    const { data: profile } = await window.supabaseClient
      .from('profiles')
      .select('name')
      .eq('id', session.user.id)
      .single();
    if (profile) postedBy = profile.name;
  } catch (e) { }

  try {
    const { error } = await window.supabaseClient.from('announcements').insert([{
      title, 
      category, 
      content,
      event_date: date || null,
      posted_by: postedBy,
      user_id: session.user.id
    }]);
    
    if (error) throw error;
    
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
  await window.supabaseClient.from('announcements').delete().eq('id', id);
  loadAnnouncements();
}
