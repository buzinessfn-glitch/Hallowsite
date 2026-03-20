/* ═══════════════════════════════════════════════════════════════
   HALLOW E-SPORTS — script.js
   Pure CSS transitions + Vanilla JS (no external dependencies)
═══════════════════════════════════════════════════════════════ */

// ─── CONFIGURATION ─────────────────────────────────────────── 
// Fill in your Supabase credentials here (or in your deployment env):
const SUPABASE_URL  = 'https://orcdiarsjvbbjhlqvdva.supabase.co';
const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9yY2RpYXJzanZiYmpobHF2ZHZhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM5MzQ3NDgsImV4cCI6MjA4OTUxMDc0OH0.icAH5zbTt0LrOiRv0RtSd-7SRx_8XtxwEGYWdSzy9k4';
const ADMIN_PASSWORD = 'HALLOW2026';

// ─── SUPABASE CLIENT ─────────────────────────────────────────
let db;
try {
  if (!SUPABASE_URL || SUPABASE_URL === 'YOUR_SUPABASE_URL_HERE') throw new Error('no creds');
  const { createClient } = supabase;
  db = createClient(SUPABASE_URL, SUPABASE_ANON);
} catch (e) {
  console.warn('[Hallow] Supabase credentials not set — using stub.');
  // Fully awaitable stub so nothing crashes
  const makeQuery = () => {
    const pending = Promise.resolve({ data: [], error: { message: 'No DB configured' } });
    const q = {
      select:  () => q,  eq:    () => q, order: () => q,
      limit:   () => q,  not:   () => q, in:    () => q,
      single:  () => Promise.resolve({ data: null, error: { message: 'No DB' } }),
      insert:  () => Promise.resolve({ data: null, error: null }),
      update:  () => q,
      delete:  () => q,
      then:    (fn, rj) => pending.then(fn, rj),
      catch:   (fn)     => pending.catch(fn),
      finally: (fn)     => pending.finally(fn),
    };
    return q;
  };
  db = { from: () => makeQuery() };
}

/* ═══════════════════════════════════════════
   SUPABASE STORAGE — FILE UPLOADS
   Bucket name: "uploads" (create this in Supabase Dashboard → Storage)
   Set bucket to PUBLIC so URLs work without auth.
═══════════════════════════════════════════ */
const STORAGE_BUCKET = 'uploads';

async function uploadFile(file, folder = 'general') {
  if (!db.storage) {
    toast('File upload requires Supabase Storage to be configured.', 'error');
    return null;
  }
  const ext  = file.name.split('.').pop().toLowerCase();
  const safe = file.name.replace(/\s+/g, '-').replace(/[^a-zA-Z0-9.\-_]/g, '');
  const path = `${folder}/${Date.now()}_${safe}`;

  const { data, error } = await db.storage.from(STORAGE_BUCKET).upload(path, file, {
    cacheControl: '3600',
    upsert: true,
    contentType: file.type,
  });
  if (error) { toast('Upload failed: ' + error.message, 'error'); return null; }

  const { data: urlData } = db.storage.from(STORAGE_BUCKET).getPublicUrl(path);
  return urlData?.publicUrl || null;
}

// Attach file-upload button behaviour to an input pair
// uploadBtnId: the <button> that triggers file pick
// inputId:     the text <input> to fill with the URL
// folder:      storage sub-folder
function initUploadBtn(uploadBtnId, inputId, folder = 'general') {
  const btn = document.getElementById(uploadBtnId);
  if (!btn) return;
  btn.addEventListener('click', () => {
    const picker = document.createElement('input');
    picker.type   = 'file';
    picker.accept = 'image/*';
    picker.onchange = async () => {
      const file = picker.files[0];
      if (!file) return;
      btn.textContent = 'Uploading…';
      btn.disabled    = true;
      const url = await uploadFile(file, folder);
      btn.textContent = 'Upload ↑';
      btn.disabled    = false;
      if (url) {
        const inp = document.getElementById(inputId);
        if (inp) { inp.value = url; inp.dispatchEvent(new Event('input')); }
        toast('File uploaded!', 'success');
      }
    };
    picker.click();
  });
}


function hideLoader() {
  const loader = document.getElementById('loader');
  if (!loader) { runPageEntrance(); return; }
  loader.classList.add('out');
  setTimeout(() => {
    loader.style.display = 'none';
    runPageEntrance();
  }, 480);
}

/* ═══════════════════════════════════════════
   PAGE ENTRANCE
═══════════════════════════════════════════ */
function runPageEntrance() {
  const selectors = [
    '.hero-eyebrow', '.hero-title', '.hero-desc', '.hero-cta', '.hero-scroll',
    '.page-hero .section-label', '.page-hero .section-title', '.page-hero .hero-desc',
    '.filter-tabs'
  ];
  let delay = 0;
  selectors.forEach(sel => {
    document.querySelectorAll(sel).forEach(el => {
      el.style.transitionDelay = delay + 'ms';
      requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add('entrance-in')));
      delay += 80;
    });
  });
}

/* ═══════════════════════════════════════════
   SCROLL REVEAL
═══════════════════════════════════════════ */
function initScrollReveal() {
  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      el.style.transitionDelay = (el.dataset.delay || '0') + 'ms';
      el.classList.add('revealed');
      io.unobserve(el);
    });
  }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });
  document.querySelectorAll('.reveal').forEach(el => io.observe(el));
}

/* ═══════════════════════════════════════════
   CARD STAGGER REVEALS
═══════════════════════════════════════════ */
function initCardReveals(selector) {
  const els = document.querySelectorAll(selector);
  if (!els.length) return;
  const io = new IntersectionObserver((entries) => {
    const visible = entries.filter(e => e.isIntersecting).map(e => e.target);
    if (!visible.length) return;
    visible.forEach((el, i) => {
      el.style.transitionDelay = (i * 65) + 'ms';
      el.classList.add('card-in');
    });
    visible.forEach(el => io.unobserve(el));
  }, { threshold: 0.04, rootMargin: '0px 0px -30px 0px' });
  els.forEach(el => { el.classList.add('card-hidden'); io.observe(el); });
}

/* ═══════════════════════════════════════════
   NAV — JS-driven dropdown (no CSS gap bug)
═══════════════════════════════════════════ */
function initNav() {
  const nav    = document.querySelector('.nav');
  const burger = document.querySelector('.nav-burger');
  const mobile = document.querySelector('.nav-mobile');

  // Scroll shrink
  const onScrollHandler = () => nav?.classList.toggle('scrolled', window.scrollY > 10);
  window.addEventListener('scroll', onScrollHandler, { passive: true });
  onScrollHandler();

  // Active link
  const current = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a, .nav-mobile a').forEach(a => {
    const href = a.getAttribute('href');
    if (href === current || (current === '' && href === 'index.html')) a.classList.add('active');
  });

  // ── JS DROPDOWN: hover + click, with leave-delay so gap doesn't close it ──
  document.querySelectorAll('.nav-dropdown').forEach(item => {
    const dropdown = item.querySelector('.dropdown');
    if (!dropdown) return;
    let closeTimer = null;

    const open  = () => { clearTimeout(closeTimer); item.classList.add('dropdown-open'); };
    const close = () => { closeTimer = setTimeout(() => item.classList.remove('dropdown-open'), 120); };

    item.addEventListener('mouseenter', open);
    item.addEventListener('mouseleave', close);
    dropdown.addEventListener('mouseenter', open);
    dropdown.addEventListener('mouseleave', close);

    // Also support click/touch toggle
    item.querySelector('a')?.addEventListener('click', (e) => {
      if (window.innerWidth > 900) {
        e.preventDefault();
        item.classList.contains('dropdown-open') ? close() : open();
      }
    });
  });

  // Close dropdown on outside click
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.nav-dropdown')) {
      document.querySelectorAll('.nav-dropdown').forEach(d => d.classList.remove('dropdown-open'));
    }
  });

  // Mobile menu
  burger?.addEventListener('click', () => {
    const open = burger.classList.toggle('open');
    mobile?.classList.toggle('open', open);
    document.body.style.overflow = open ? 'hidden' : '';
  });
  mobile?.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
    burger?.classList.remove('open');
    mobile?.classList.remove('open');
    document.body.style.overflow = '';
  }));

  // Slide-in animation
  if (nav) {
    nav.style.opacity = '0';
    nav.style.transform = 'translateY(-14px)';
    nav.style.transition = 'opacity .55s ease, transform .55s ease';
    setTimeout(() => { nav.style.opacity = '1'; nav.style.transform = 'translateY(0)'; }, 60);
  }
}

/* ═══════════════════════════════════════════
   WATERMARK / ADMIN TRIGGER
═══════════════════════════════════════════ */
function initWatermark() {
  const wm = document.getElementById('watermark');
  if (!wm) return;
  let clicks = 0, timer;
  wm.addEventListener('click', () => {
    clicks++;
    clearTimeout(timer);
    timer = setTimeout(() => { clicks = 0; }, 500);
    if (clicks >= 2) { clicks = 0; openAdminAuth(); }
  });
}

/* ═══════════════════════════════════════════
   ADMIN AUTH
═══════════════════════════════════════════ */
function openAdminAuth() {
  const overlay = document.getElementById('admin-overlay');
  const pwModal = document.getElementById('admin-pw-modal');
  const panel   = document.getElementById('admin-panel');
  if (!overlay) return;
  overlay.classList.add('open');
  if (pwModal) { pwModal.style.display = 'block'; }
  if (panel)   { panel.style.display = 'none'; panel.classList.remove('open'); }
  setTimeout(() => document.getElementById('admin-pw-input')?.focus(), 80);
}

function checkAdminPw() {
  const input = document.getElementById('admin-pw-input');
  const err   = document.getElementById('admin-pw-error');
  if (!input) return;
  if (input.value === ADMIN_PASSWORD) {
    const overlay = document.getElementById('admin-overlay');
    const pwModal = document.getElementById('admin-pw-modal');
    const panel   = document.getElementById('admin-panel');
    if (overlay) overlay.classList.remove('open');
    if (pwModal) pwModal.style.display = 'none';
    if (panel)   { panel.classList.add('open'); panel.style.display = 'flex'; }
    input.value = '';
    // Small delay so panel is visible before we start loading
    setTimeout(() => {
      loadAdminData();
      // Wire upload buttons (safe to call multiple times — initUploadBtn guards with getElementById)
      initUploadBtn('r-pfp-upload',   'r-pfp',   'roster');
      initUploadBtn('l-pfp-upload',   'l-pfp',   'leaders');
      initUploadBtn('n-image-upload', 'n-image', 'news');
      initUploadBtn('m-img-upload',   'm-img',   'merch');
    }, 50);
  } else {
    if (err) { err.style.display = 'block'; err.textContent = 'Incorrect password.'; }
    input.classList.add('shake');
    setTimeout(() => input.classList.remove('shake'), 500);
    setTimeout(() => { if (err) err.style.display = 'none'; }, 3000);
  }
}

function closeAdmin() {
  document.getElementById('admin-overlay')?.classList.remove('open');
  const panel = document.getElementById('admin-panel');
  if (panel) { panel.classList.remove('open'); panel.style.display = 'none'; }
}

/* ═══════════════════════════════════════════
   ADMIN TABS
═══════════════════════════════════════════ */
function initAdminTabs() {
  document.querySelectorAll('.admin-tab[data-tab]').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.admin-section').forEach(s => s.classList.remove('active'));
      tab.classList.add('active');
      const id = tab.dataset.tab;
      document.getElementById(`admin-${id}`)?.classList.add('active');
    });
  });
}

/* ═══════════════════════════════════════════
   ADMIN — shared helpers
═══════════════════════════════════════════ */
// Sets tbody content — shows empty/error state properly
function adminTableBody(tbodyId, html) {
  const el = document.getElementById(tbodyId);
  if (!el) return;
  el.innerHTML = html || `<tr><td colspan="10" style="text-align:center;padding:24px;color:var(--text-dim);font-size:.8rem">No entries yet.</td></tr>`;
}

function adminTableError(tbodyId, msg) {
  const el = document.getElementById(tbodyId);
  if (!el) return;
  el.innerHTML = `<tr><td colspan="10" style="text-align:center;padding:24px;color:#f87171;font-size:.8rem">⚠ ${msg || 'Could not load data. Check Supabase credentials.'}</td></tr>`;
}

/* ═══════════════════════════════════════════
   ADMIN DATA LOADERS
═══════════════════════════════════════════ */
async function loadAdminData() {
  // Run all loaders in parallel — each handles its own error
  await Promise.allSettled([
    loadAdminRoster(),
    loadAdminLeaders(),
    loadAdminNews(),
    loadAdminMerch(),
    loadAdminSocials(),
    loadAdminPlacements(),
  ]);
}

// ── ROSTER ────────────────────────────────────────────────────
let rosterEditId = null;
async function loadAdminRoster() {
  const { data, error } = await db.from('roster').select('*').order('order_num');
  if (error) { adminTableError('admin-roster-list', error.message); return; }
  adminTableBody('admin-roster-list',
    (data && data.length) ? data.map(p => `
      <tr>
        <td><strong style="color:#fff">${p.name}</strong></td>
        <td>${p.position || '—'}</td>
        <td>${p.game || '—'}</td>
        <td><span class="admin-badge ${p.active ? 'admin-badge-active' : 'admin-badge-inactive'}">${p.active ? 'Active' : 'Inactive'}</span></td>
        <td class="admin-actions">
          <button class="btn btn-ghost btn-sm" onclick="editRoster('${p.id}')">Edit</button>
          <button class="btn btn-ghost btn-sm" onclick="deleteRoster('${p.id}')">Delete</button>
        </td>
      </tr>`).join('') : null
  );
  window._rosterData = data || [];
}
window.editRoster = (id) => {
  const p = (window._rosterData || []).find(r => r.id === id); if (!p) return;
  rosterEditId = id;
  document.getElementById('r-name').value        = p.name || '';
  document.getElementById('r-position').value    = p.position || '';
  document.getElementById('r-game').value        = p.game || '';
  document.getElementById('r-bio').value         = p.bio || '';
  document.getElementById('r-pfp').value         = p.pfp_filename || '';
  document.getElementById('r-twitter').value     = p.social_twitter || '';
  document.getElementById('r-twitch').value      = p.social_twitch || '';
  document.getElementById('r-instagram').value   = p.social_instagram || '';
  document.getElementById('r-tiktok').value      = p.social_tiktok || '';
  document.getElementById('r-active').checked    = !!p.active;
  document.getElementById('r-order').value       = p.order_num || 0;
  document.querySelector('.admin-tab[data-tab="roster"]')?.click();
};
window.deleteRoster = async (id) => {
  if (!confirm('Delete this player?')) return;
  const { error } = await db.from('roster').delete().eq('id', id);
  if (error) { toast('Delete failed: ' + error.message, 'error'); return; }
  toast('Player deleted.'); loadAdminRoster();
};
async function saveRoster() {
  const payload = {
    name:             (document.getElementById('r-name')?.value || '').trim(),
    position:         (document.getElementById('r-position')?.value || '').trim(),
    game:             document.getElementById('r-game')?.value || '',
    bio:              (document.getElementById('r-bio')?.value || '').trim(),
    pfp_filename:     (document.getElementById('r-pfp')?.value || '').trim(),
    social_twitter:   (document.getElementById('r-twitter')?.value || '').trim(),
    social_twitch:    (document.getElementById('r-twitch')?.value || '').trim(),
    social_instagram: (document.getElementById('r-instagram')?.value || '').trim(),
    social_tiktok:    (document.getElementById('r-tiktok')?.value || '').trim(),
    active:           document.getElementById('r-active')?.checked ?? true,
    order_num:        parseInt(document.getElementById('r-order')?.value) || 0,
  };
  if (!payload.name) { toast('Name is required.', 'error'); return; }
  const q = rosterEditId
    ? db.from('roster').update(payload).eq('id', rosterEditId)
    : db.from('roster').insert(payload);
  const { error } = await q;
  rosterEditId = null;
  if (error) { toast('Error: ' + error.message, 'error'); return; }
  toast('Player saved!', 'success'); loadAdminRoster(); clearRosterForm();
}
function clearRosterForm() {
  ['r-name','r-position','r-game','r-bio','r-pfp','r-twitter','r-twitch','r-instagram','r-tiktok','r-order'].forEach(id => {
    const el = document.getElementById(id); if (el) el.value = '';
  });
  const a = document.getElementById('r-active'); if (a) a.checked = true;
  rosterEditId = null;
}

// ── LEADERS ───────────────────────────────────────────────────
let leaderEditId = null;
async function loadAdminLeaders() {
  const { data, error } = await db.from('leaders').select('*').order('order_num');
  if (error) { adminTableError('admin-leaders-list', error.message); return; }
  adminTableBody('admin-leaders-list',
    (data && data.length) ? data.map(l => `
      <tr>
        <td><strong style="color:#fff">${l.name}</strong></td>
        <td>${l.role || '—'}</td>
        <td class="admin-actions">
          <button class="btn btn-ghost btn-sm" onclick="editLeader('${l.id}')">Edit</button>
          <button class="btn btn-ghost btn-sm" onclick="deleteLeader('${l.id}')">Delete</button>
        </td>
      </tr>`).join('') : null
  );
  window._leaderData = data || [];
}
window.editLeader = (id) => {
  const l = (window._leaderData || []).find(r => r.id === id); if (!l) return;
  leaderEditId = id;
  document.getElementById('l-name').value      = l.name || '';
  document.getElementById('l-role').value      = l.role || '';
  document.getElementById('l-bio').value       = l.bio || '';
  document.getElementById('l-pfp').value       = l.pfp_filename || '';
  document.getElementById('l-twitter').value   = l.social_twitter || '';
  document.getElementById('l-discord').value   = l.social_discord || '';
  document.getElementById('l-instagram').value = l.social_instagram || '';
  document.getElementById('l-order').value     = l.order_num || 0;
  document.querySelector('.admin-tab[data-tab="leaders"]')?.click();
};
window.deleteLeader = async (id) => {
  if (!confirm('Delete this leader?')) return;
  const { error } = await db.from('leaders').delete().eq('id', id);
  if (error) { toast('Delete failed: ' + error.message, 'error'); return; }
  toast('Leader deleted.'); loadAdminLeaders();
};
async function saveLeader() {
  const payload = {
    name:             (document.getElementById('l-name')?.value || '').trim(),
    role:             (document.getElementById('l-role')?.value || '').trim(),
    bio:              (document.getElementById('l-bio')?.value || '').trim(),
    pfp_filename:     (document.getElementById('l-pfp')?.value || '').trim(),
    social_twitter:   (document.getElementById('l-twitter')?.value || '').trim(),
    social_discord:   (document.getElementById('l-discord')?.value || '').trim(),
    social_instagram: (document.getElementById('l-instagram')?.value || '').trim(),
    order_num:        parseInt(document.getElementById('l-order')?.value) || 0,
  };
  if (!payload.name) { toast('Name is required.', 'error'); return; }
  const q = leaderEditId
    ? db.from('leaders').update(payload).eq('id', leaderEditId)
    : db.from('leaders').insert(payload);
  const { error } = await q;
  leaderEditId = null;
  if (error) { toast('Error: ' + error.message, 'error'); return; }
  toast('Leader saved!', 'success'); loadAdminLeaders(); clearLeaderForm();
}
function clearLeaderForm() {
  ['l-name','l-role','l-bio','l-pfp','l-twitter','l-discord','l-instagram','l-order'].forEach(id => {
    const el = document.getElementById(id); if (el) el.value = '';
  });
  leaderEditId = null;
}

// ── NEWS ──────────────────────────────────────────────────────
let newsEditId = null;
async function loadAdminNews() {
  const { data, error } = await db.from('news_posts').select('*').order('created_at', { ascending: false });
  if (error) { adminTableError('admin-news-list', error.message); return; }
  adminTableBody('admin-news-list',
    (data && data.length) ? data.map(n => `
      <tr>
        <td><strong style="color:#fff">${n.title}</strong></td>
        <td>${n.author || '—'}</td>
        <td>${new Date(n.created_at).toLocaleDateString()}</td>
        <td><span class="admin-badge ${n.published ? 'admin-badge-active':'admin-badge-inactive'}">${n.published ? 'Published' : 'Draft'}</span></td>
        <td class="admin-actions">
          <button class="btn btn-ghost btn-sm" onclick="editNews('${n.id}')">Edit</button>
          <button class="btn btn-ghost btn-sm" onclick="deleteNews('${n.id}')">Delete</button>
        </td>
      </tr>`).join('') : null
  );
  window._newsData = data || [];
}
window.editNews = (id) => {
  const n = (window._newsData || []).find(r => r.id === id); if (!n) return;
  newsEditId = id;
  document.getElementById('n-title').value   = n.title || '';
  document.getElementById('n-author').value  = n.author || '';
  document.getElementById('n-image').value   = n.image_url || '';
  document.getElementById('n-content').value = n.content || '';
  document.getElementById('n-tags').value    = (n.tags || []).join(', ');
  const pub = document.getElementById('n-published'); if (pub) pub.checked = !!n.published;
  document.querySelector('.admin-tab[data-tab="news"]')?.click();
};
window.deleteNews = async (id) => {
  if (!confirm('Delete this post?')) return;
  const { error } = await db.from('news_posts').delete().eq('id', id);
  if (error) { toast('Delete failed: ' + error.message, 'error'); return; }
  toast('Post deleted.'); loadAdminNews();
};
async function saveNews() {
  const payload = {
    title:     (document.getElementById('n-title')?.value || '').trim(),
    author:    (document.getElementById('n-author')?.value || '').trim(),
    image_url: (document.getElementById('n-image')?.value || '').trim(),
    content:   (document.getElementById('n-content')?.value || '').trim(),
    tags:      (document.getElementById('n-tags')?.value || '').split(',').map(t => t.trim()).filter(Boolean),
    published: document.getElementById('n-published')?.checked ?? true,
  };
  if (!payload.title) { toast('Title is required.', 'error'); return; }
  const q = newsEditId
    ? db.from('news_posts').update(payload).eq('id', newsEditId)
    : db.from('news_posts').insert(payload);
  const { error } = await q;
  newsEditId = null;
  if (error) { toast('Error: ' + error.message, 'error'); return; }
  toast('Post saved!', 'success'); loadAdminNews(); clearNewsForm();
}
function clearNewsForm() {
  ['n-title','n-author','n-image','n-content','n-tags'].forEach(id => {
    const el = document.getElementById(id); if (el) el.value = '';
  });
  const pub = document.getElementById('n-published'); if (pub) pub.checked = true;
  newsEditId = null;
}

// ── MERCH ─────────────────────────────────────────────────────
let merchEditId = null;
async function loadAdminMerch() {
  const { data, error } = await db.from('merch_items').select('*').order('order_num');
  if (error) { adminTableError('admin-merch-list', error.message); return; }
  adminTableBody('admin-merch-list',
    (data && data.length) ? data.map(m => `
      <tr>
        <td><strong style="color:#fff">${m.name}</strong></td>
        <td>${m.price ? `€${parseFloat(m.price).toFixed(2)}` : '—'}</td>
        <td><span class="admin-badge ${m.active ? 'admin-badge-active' : 'admin-badge-inactive'}">${m.active ? 'Active' : 'Hidden'}</span></td>
        <td class="admin-actions">
          <button class="btn btn-ghost btn-sm" onclick="editMerch('${m.id}')">Edit</button>
          <button class="btn btn-ghost btn-sm" onclick="deleteMerch('${m.id}')">Delete</button>
        </td>
      </tr>`).join('') : null
  );
  window._merchData = data || [];
}
window.editMerch = (id) => {
  const m = (window._merchData || []).find(r => r.id === id); if (!m) return;
  merchEditId = id;
  document.getElementById('m-name').value     = m.name || '';
  document.getElementById('m-price').value    = m.price || '';
  document.getElementById('m-img').value      = m.image_filename || '';
  document.getElementById('m-link').value     = m.payhip_link || '';
  document.getElementById('m-desc').value     = m.description || '';
  document.getElementById('m-order').value    = m.order_num || 0;
  document.getElementById('m-active').checked = !!m.active;
  document.querySelector('.admin-tab[data-tab="merch"]')?.click();
};
window.deleteMerch = async (id) => {
  if (!confirm('Delete this product?')) return;
  const { error } = await db.from('merch_items').delete().eq('id', id);
  if (error) { toast('Delete failed: ' + error.message, 'error'); return; }
  toast('Product deleted.'); loadAdminMerch();
};
async function saveMerch() {
  const payload = {
    name:           (document.getElementById('m-name')?.value || '').trim(),
    price:          parseFloat(document.getElementById('m-price')?.value) || null,
    image_filename: (document.getElementById('m-img')?.value || '').trim(),
    payhip_link:    (document.getElementById('m-link')?.value || '').trim(),
    description:    (document.getElementById('m-desc')?.value || '').trim(),
    order_num:      parseInt(document.getElementById('m-order')?.value) || 0,
    active:         document.getElementById('m-active')?.checked ?? true,
  };
  if (!payload.name) { toast('Product name is required.', 'error'); return; }
  const q = merchEditId
    ? db.from('merch_items').update(payload).eq('id', merchEditId)
    : db.from('merch_items').insert(payload);
  const { error } = await q;
  merchEditId = null;
  if (error) { toast('Error: ' + error.message, 'error'); return; }
  toast('Product saved!', 'success'); loadAdminMerch(); clearMerchForm();
}
function clearMerchForm() {
  ['m-name','m-price','m-img','m-link','m-desc','m-order'].forEach(id => {
    const el = document.getElementById(id); if (el) el.value = '';
  });
  const a = document.getElementById('m-active'); if (a) a.checked = true;
  merchEditId = null;
}

// ── SOCIALS ───────────────────────────────────────────────────
async function loadAdminSocials() {
  const formWrap = document.getElementById('admin-socials-form');
  if (!formWrap) return;
  const { data, error } = await db.from('socials').select('*').order('order_num');
  if (error) {
    formWrap.innerHTML = `<p style="color:#f87171;font-size:.82rem">⚠ ${error.message}</p>`;
    return;
  }
  if (!data || !data.length) {
    formWrap.innerHTML = '<p style="color:var(--text-dim);font-size:.85rem">No social entries found in your database yet.</p>';
    return;
  }
  formWrap.innerHTML = data.map(s => `
    <div style="display:grid;grid-template-columns:120px 1fr 90px auto;gap:12px;align-items:center;margin-bottom:12px">
      <label style="color:var(--white);font-family:var(--font-display);font-size:.75rem;font-weight:600;letter-spacing:.1em">${s.platform}</label>
      <input class="admin-input" id="soc-url-${s.id}" value="${s.url || ''}" placeholder="URL">
      <label style="display:flex;align-items:center;gap:6px;cursor:pointer;font-size:.8rem;color:var(--text-dim)">
        <input type="checkbox" id="soc-active-${s.id}" ${s.active ? 'checked' : ''} style="accent-color:#fff"> Active
      </label>
      <button class="btn btn-ghost btn-sm" onclick="saveSocial('${s.id}')">Save</button>
    </div>`).join('');
}
window.saveSocial = async (id) => {
  const url    = (document.getElementById(`soc-url-${id}`)?.value || '').trim();
  const active = document.getElementById(`soc-active-${id}`)?.checked ?? true;
  const { error } = await db.from('socials').update({ url, active }).eq('id', id);
  if (error) { toast('Error: ' + error.message, 'error'); return; }
  toast('Social updated!', 'success');
};

// ── PLACEMENTS ────────────────────────────────────────────────
let placementEditId = null;
async function loadAdminPlacements() {
  const { data, error } = await db.from('placements').select('*').order('date', { ascending: false });
  if (error) { adminTableError('admin-placements-list', error.message); return; }
  adminTableBody('admin-placements-list',
    (data && data.length) ? data.map(p => `
      <tr>
        <td><strong style="color:#fff">${p.tournament}</strong></td>
        <td>${p.game || '—'}</td>
        <td>${p.placement || '—'}</td>
        <td>${p.date ? new Date(p.date).toLocaleDateString() : '—'}</td>
        <td class="admin-actions">
          <button class="btn btn-ghost btn-sm" onclick="editPlacement('${p.id}')">Edit</button>
          <button class="btn btn-ghost btn-sm" onclick="deletePlacement('${p.id}')">Delete</button>
        </td>
      </tr>`).join('') : null
  );
  window._placementData = data || [];
}
window.editPlacement = (id) => {
  const p = (window._placementData || []).find(r => r.id === id); if (!p) return;
  placementEditId = id;
  document.getElementById('pl-game').value       = p.game || '';
  document.getElementById('pl-tournament').value = p.tournament || '';
  document.getElementById('pl-placement').value  = p.placement || '';
  document.getElementById('pl-num').value        = p.placement_num || '';
  document.getElementById('pl-date').value       = p.date || '';
  document.getElementById('pl-prize').value      = p.prize || '';
  document.querySelector('.admin-tab[data-tab="placements"]')?.click();
};
window.deletePlacement = async (id) => {
  if (!confirm('Delete this placement?')) return;
  const { error } = await db.from('placements').delete().eq('id', id);
  if (error) { toast('Delete failed: ' + error.message, 'error'); return; }
  toast('Placement deleted.'); loadAdminPlacements();
};
async function savePlacement() {
  const payload = {
    game:          document.getElementById('pl-game')?.value || '',
    tournament:    (document.getElementById('pl-tournament')?.value || '').trim(),
    placement:     (document.getElementById('pl-placement')?.value || '').trim(),
    placement_num: parseInt(document.getElementById('pl-num')?.value) || null,
    date:          document.getElementById('pl-date')?.value || null,
    prize:         (document.getElementById('pl-prize')?.value || '').trim(),
  };
  if (!payload.tournament) { toast('Tournament name required.', 'error'); return; }
  const q = placementEditId
    ? db.from('placements').update(payload).eq('id', placementEditId)
    : db.from('placements').insert(payload);
  const { error } = await q;
  placementEditId = null;
  if (error) { toast('Error: ' + error.message, 'error'); return; }
  toast('Placement saved!', 'success'); loadAdminPlacements(); clearPlacementForm();
}
function clearPlacementForm() {
  ['pl-tournament','pl-placement','pl-num','pl-date','pl-prize'].forEach(id => {
    const el = document.getElementById(id); if (el) el.value = '';
  });
  placementEditId = null;
}

/* ═══════════════════════════════════════════
   NEWS PARSER
═══════════════════════════════════════════ */
function parseContent(text) {
  if (!text) return '';
  const internalPages = {
    home:'index.html', roster:'roster.html', leaders:'leaders.html',
    news:'news.html', merch:'merch.html', socials:'socials.html',
    about:'about.html', placements:'about.html#placements', contact:'about.html#contact'
  };
  return text
    .replace(/^# (.+)$/gm,  '<h3 class="news-h3">$1</h3>')
    .replace(/^## (.+)$/gm, '<h4 class="news-h4">$1</h4>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g,     '<em>$1</em>')
    .replace(/~~(.+?)~~/g,     '<del>$1</del>')
    .replace(/`(.+?)`/g, '<code style="font-family:monospace;background:rgba(255,255,255,.08);padding:1px 6px;border-radius:4px;font-size:.88em">$1</code>')
    .replace(/^> (.+)$/gm, '<blockquote class="news-quote">$1</blockquote>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener" class="news-link">$1</a>')
    .replace(/\[\[([^\]|]+)\|?([^\]]*)\]\]/g, (_, page, label) =>
      `<a href="${internalPages[page.toLowerCase().trim()] || '#'}" class="news-internal-link">🔗 ${label || page}</a>`)
    .replace(/\n\n+/g, '</p><p class="news-p">')
    .replace(/\n/g, '<br>');
}
function stripContent(text, maxLen = 130) {
  if (!text) return '';
  const plain = text
    .replace(/\*\*(.+?)\*\*/g,'$1').replace(/\*(.+?)\*/g,'$1')
    .replace(/^#+ /gm,'').replace(/\[([^\]]+)\]\([^)]+\)/g,'$1')
    .replace(/\[\[([^\]|]+)\|?[^\]]*\]\]/g,'$1').replace(/[>~`]/g,'').trim();
  return plain.length > maxLen ? plain.slice(0, maxLen) + '…' : plain;
}

/* ═══════════════════════════════════════════
   TOAST
═══════════════════════════════════════════ */
function toast(msg, type = 'success') {
  const wrap = document.getElementById('toast-wrap');
  if (!wrap) return;
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.textContent = msg;
  wrap.appendChild(el);
  requestAnimationFrame(() => {
    el.classList.add('show');
    setTimeout(() => { el.classList.remove('show'); setTimeout(() => el.remove(), 350); }, 2800);
  });
}

/* ═══════════════════════════════════════════
   GAME HELPERS
═══════════════════════════════════════════ */
const GAME_LOGOS = { valorant:'valorantlogo.jpg', fortnite:'fortnitelogo.jpg', rs6:'rs6logo.jpg', cs2:'cs2logo.jpg' };
const GAME_NAMES = { valorant:'Valorant', fortnite:'Fortnite', rs6:'Rainbow Six Siege', cs2:'CS2' };
function gameBadge(game) {
  if (!game) return '';
  return `<span class="game-badge">${GAME_LOGOS[game] ? `<img src="${GAME_LOGOS[game]}" alt="${GAME_NAMES[game]}" onerror="this.style.display='none'">` : ''}${GAME_NAMES[game] || game}</span>`;
}
function socialLinks(player) {
  return [
    player.social_twitter   && `<a href="${player.social_twitter}"   target="_blank" rel="noopener" title="X">𝕏</a>`,
    player.social_twitch    && `<a href="${player.social_twitch}"    target="_blank" rel="noopener" title="Twitch">📺</a>`,
    player.social_instagram && `<a href="${player.social_instagram}" target="_blank" rel="noopener" title="Instagram">📷</a>`,
    player.social_tiktok    && `<a href="${player.social_tiktok}"    target="_blank" rel="noopener" title="TikTok">🎵</a>`,
    player.social_discord   && `<a href="${player.social_discord}"   target="_blank" rel="noopener" title="Discord">💬</a>`,
  ].filter(Boolean).join('');
}

/* ═══════════════════════════════════════════
   KEYBOARD
═══════════════════════════════════════════ */
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeAdmin();
  if (e.key === 'Enter') {
    const modal = document.getElementById('admin-pw-modal');
    if (modal && modal.style.display !== 'none' && document.getElementById('admin-overlay')?.classList.contains('open')) {
      checkAdminPw();
    }
  }
});

/* ═══════════════════════════════════════════
   INIT
═══════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
  hideLoader();
  initNav();
  initWatermark();
  initAdminTabs();
  initScrollReveal();
  const overlay = document.getElementById('admin-overlay');
  if (overlay) overlay.addEventListener('click', (e) => { if (e.target === overlay) closeAdmin(); });
});

// ── Global exports ────────────────────────────────────────────
window.checkAdminPw       = checkAdminPw;
window.closeAdmin         = closeAdmin;
window.saveRoster         = saveRoster;
window.clearRosterForm    = clearRosterForm;
window.saveLeader         = saveLeader;
window.clearLeaderForm    = clearLeaderForm;
window.saveNews           = saveNews;
window.clearNewsForm      = clearNewsForm;
window.saveMerch          = saveMerch;
window.clearMerchForm     = clearMerchForm;
window.savePlacement      = savePlacement;
window.clearPlacementForm = clearPlacementForm;
window.parseContent       = parseContent;
window.stripContent       = stripContent;
window.gameBadge          = gameBadge;
window.socialLinks        = socialLinks;
window.initCardReveals    = initCardReveals;
window.toast              = toast;
window.db                 = db;
window.GAME_NAMES         = GAME_NAMES;