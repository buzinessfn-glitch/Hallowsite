/* ═══════════════════════════════════════════════════════════════
   HALLOW E-SPORTS — script.js
   Pure CSS transitions + Vanilla JS (no anime.js)
═══════════════════════════════════════════════════════════════ */

// ─── CONFIGURATION ───────────────────────────────────────────
const SUPABASE_URL  = 'https://orcdiarsjvbbjhlqvdva.supabase.co';
const SUPABASE_ANON = 'eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9yY2RpYXJzanZiYmpobHF2ZHZhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM5MzQ3NDgsImV4cCI6MjA4OTUxMDc0OH0';
const ADMIN_PASSWORD = 'HALLOW2026';

// ─── SUPABASE CLIENT ─────────────────────────────────────────
let db;
try {
  const { createClient } = supabase;
  db = createClient(SUPABASE_URL, SUPABASE_ANON);
} catch (e) {
  console.warn('[Hallow] Supabase not configured yet.');
  // Stub so pages don't crash when credentials aren't set
  const stub = () => {
    const q = {
      select: () => q, eq: () => q, order: () => q, limit: () => q,
      single:  () => Promise.resolve({ data: null,  error: { message: 'no db' } }),
      then:    (fn) => Promise.resolve({ data: [],   error: { message: 'no db' } }).then(fn),
      catch:   (fn) => Promise.resolve({ data: [],   error: { message: 'no db' } }).catch(fn),
      insert:  () => Promise.resolve({ error: null }),
      update:  () => q,
      delete:  () => q,
    };
    return q;
  };
  db = { from: () => stub() };
}

/* ═══════════════════════════════════════════
   LOADER — instant fade, no external deps
═══════════════════════════════════════════ */
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

  els.forEach(el => {
    el.classList.add('card-hidden');
    io.observe(el);
  });
}

/* ═══════════════════════════════════════════
   NAV
═══════════════════════════════════════════ */
function initNav() {
  const nav    = document.querySelector('.nav');
  const burger = document.querySelector('.nav-burger');
  const mobile = document.querySelector('.nav-mobile');

  const onScrollHandler = () => nav?.classList.toggle('scrolled', window.scrollY > 10);
  window.addEventListener('scroll', onScrollHandler, { passive: true });
  onScrollHandler();

  // Highlight active page
  const current = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a, .nav-mobile a').forEach(a => {
    const href = a.getAttribute('href');
    if (href === current || (current === '' && href === 'index.html')) a.classList.add('active');
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

  // Slide-in nav
  if (nav) {
    nav.style.cssText += ';opacity:0;transform:translateY(-14px);transition:opacity .55s ease,transform .55s ease';
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
  if (pwModal) pwModal.style.display = 'block';
  if (panel)   panel.style.display   = 'none';
  setTimeout(() => document.getElementById('admin-pw-input')?.focus(), 50);
}

function checkAdminPw() {
  const input = document.getElementById('admin-pw-input');
  const err   = document.getElementById('admin-pw-error');
  if (!input) return;
  if (input.value === ADMIN_PASSWORD) {
    document.getElementById('admin-pw-modal').style.display = 'none';
    const panel = document.getElementById('admin-panel');
    panel.classList.add('open'); panel.style.display = 'flex';
    input.value = '';
    loadAdminData();
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
  document.querySelectorAll('.admin-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.admin-section').forEach(s => s.classList.remove('active'));
      tab.classList.add('active');
      const id = tab.dataset.tab;
      if (id) document.getElementById(`admin-${id}`)?.classList.add('active');
    });
  });
}

/* ═══════════════════════════════════════════
   ADMIN LOADERS
═══════════════════════════════════════════ */
async function loadAdminData() {
  loadAdminRoster(); loadAdminLeaders(); loadAdminNews();
  loadAdminMerch(); loadAdminSocials(); loadAdminPlacements();
}

// ROSTER
let rosterEditId = null;
async function loadAdminRoster() {
  const { data, error } = await db.from('roster').select('*').order('order_num');
  if (error) return;
  const tbody = document.getElementById('admin-roster-list');
  if (!tbody) return;
  tbody.innerHTML = data.map(p => `
    <tr>
      <td><strong style="color:#fff">${p.name}</strong></td>
      <td>${p.position || '—'}</td><td>${p.game || '—'}</td>
      <td><span class="admin-badge ${p.active ? 'admin-badge-active' : 'admin-badge-inactive'}">${p.active ? 'Active' : 'Inactive'}</span></td>
      <td class="admin-actions">
        <button class="btn btn-ghost btn-sm" onclick="editRoster('${p.id}')">Edit</button>
        <button class="btn btn-ghost btn-sm" onclick="deleteRoster('${p.id}')">Delete</button>
      </td>
    </tr>`).join('');
  window._rosterData = data;
}
window.editRoster = (id) => {
  const p = window._rosterData?.find(r => r.id === id); if (!p) return;
  rosterEditId = id;
  ['r-name','r-position','r-game','r-bio','r-pfp','r-twitter','r-twitch','r-instagram','r-tiktok','r-order'].forEach(key => {
    const el = document.getElementById(key); if (!el) return;
    const field = key.replace('r-','').replace('twitter','social_twitter').replace('twitch','social_twitch').replace('instagram','social_instagram').replace('tiktok','social_tiktok').replace('pfp','pfp_filename').replace('order','order_num').replace('name','name').replace('position','position').replace('game','game').replace('bio','bio');
    el.value = p[field] ?? p[key.replace('r-','')] ?? '';
  });
  document.getElementById('r-name').value      = p.name || '';
  document.getElementById('r-position').value  = p.position || '';
  document.getElementById('r-game').value      = p.game || '';
  document.getElementById('r-bio').value       = p.bio || '';
  document.getElementById('r-pfp').value       = p.pfp_filename || '';
  document.getElementById('r-twitter').value   = p.social_twitter || '';
  document.getElementById('r-twitch').value    = p.social_twitch || '';
  document.getElementById('r-instagram').value = p.social_instagram || '';
  document.getElementById('r-tiktok').value    = p.social_tiktok || '';
  document.getElementById('r-active').checked  = p.active;
  document.getElementById('r-order').value     = p.order_num || 0;
};
window.deleteRoster = async (id) => {
  if (!confirm('Delete this player?')) return;
  await db.from('roster').delete().eq('id', id);
  toast('Player deleted.'); loadAdminRoster();
};
async function saveRoster() {
  const payload = {
    name: document.getElementById('r-name').value.trim(),
    position: document.getElementById('r-position').value.trim(),
    game: document.getElementById('r-game').value,
    bio: document.getElementById('r-bio').value.trim(),
    pfp_filename: document.getElementById('r-pfp').value.trim(),
    social_twitter: document.getElementById('r-twitter').value.trim(),
    social_twitch: document.getElementById('r-twitch').value.trim(),
    social_instagram: document.getElementById('r-instagram').value.trim(),
    social_tiktok: document.getElementById('r-tiktok').value.trim(),
    active: document.getElementById('r-active').checked,
    order_num: parseInt(document.getElementById('r-order').value) || 0,
  };
  if (!payload.name) { toast('Name is required.', 'error'); return; }
  const { error } = rosterEditId
    ? await db.from('roster').update(payload).eq('id', rosterEditId)
    : await db.from('roster').insert(payload);
  rosterEditId = null;
  if (error) { toast('Error saving player.', 'error'); return; }
  toast('Player saved!', 'success'); loadAdminRoster(); clearRosterForm();
}
function clearRosterForm() {
  ['r-name','r-position','r-game','r-bio','r-pfp','r-twitter','r-twitch','r-instagram','r-tiktok','r-order'].forEach(id => {
    const el = document.getElementById(id); if (el) el.value = '';
  });
  const a = document.getElementById('r-active'); if (a) a.checked = true;
  rosterEditId = null;
}

// LEADERS
let leaderEditId = null;
async function loadAdminLeaders() {
  const { data, error } = await db.from('leaders').select('*').order('order_num');
  if (error) return;
  const tbody = document.getElementById('admin-leaders-list');
  if (!tbody) return;
  tbody.innerHTML = data.map(l => `
    <tr>
      <td><strong style="color:#fff">${l.name}</strong></td><td>${l.role || '—'}</td>
      <td class="admin-actions">
        <button class="btn btn-ghost btn-sm" onclick="editLeader('${l.id}')">Edit</button>
        <button class="btn btn-ghost btn-sm" onclick="deleteLeader('${l.id}')">Delete</button>
      </td>
    </tr>`).join('');
  window._leaderData = data;
}
window.editLeader = (id) => {
  const l = window._leaderData?.find(r => r.id === id); if (!l) return;
  leaderEditId = id;
  document.getElementById('l-name').value      = l.name || '';
  document.getElementById('l-role').value      = l.role || '';
  document.getElementById('l-bio').value       = l.bio || '';
  document.getElementById('l-pfp').value       = l.pfp_filename || '';
  document.getElementById('l-twitter').value   = l.social_twitter || '';
  document.getElementById('l-discord').value   = l.social_discord || '';
  document.getElementById('l-instagram').value = l.social_instagram || '';
  document.getElementById('l-order').value     = l.order_num || 0;
};
window.deleteLeader = async (id) => {
  if (!confirm('Delete this leader?')) return;
  await db.from('leaders').delete().eq('id', id);
  toast('Leader deleted.'); loadAdminLeaders();
};
async function saveLeader() {
  const payload = {
    name: document.getElementById('l-name').value.trim(),
    role: document.getElementById('l-role').value.trim(),
    bio: document.getElementById('l-bio').value.trim(),
    pfp_filename: document.getElementById('l-pfp').value.trim(),
    social_twitter: document.getElementById('l-twitter').value.trim(),
    social_discord: document.getElementById('l-discord').value.trim(),
    social_instagram: document.getElementById('l-instagram').value.trim(),
    order_num: parseInt(document.getElementById('l-order').value) || 0,
  };
  if (!payload.name) { toast('Name is required.', 'error'); return; }
  const { error } = leaderEditId
    ? await db.from('leaders').update(payload).eq('id', leaderEditId)
    : await db.from('leaders').insert(payload);
  leaderEditId = null;
  if (error) { toast('Error saving leader.', 'error'); return; }
  toast('Leader saved!', 'success'); loadAdminLeaders(); clearLeaderForm();
}
function clearLeaderForm() {
  ['l-name','l-role','l-bio','l-pfp','l-twitter','l-discord','l-instagram','l-order'].forEach(id => {
    const el = document.getElementById(id); if (el) el.value = '';
  });
  leaderEditId = null;
}

// NEWS
let newsEditId = null;
async function loadAdminNews() {
  const { data, error } = await db.from('news_posts').select('*').order('created_at', { ascending: false });
  if (error) return;
  const tbody = document.getElementById('admin-news-list');
  if (!tbody) return;
  tbody.innerHTML = data.map(n => `
    <tr>
      <td><strong style="color:#fff">${n.title}</strong></td><td>${n.author || '—'}</td>
      <td>${new Date(n.created_at).toLocaleDateString()}</td>
      <td><span class="admin-badge ${n.published ? 'admin-badge-active':'admin-badge-inactive'}">${n.published ? 'Published' : 'Draft'}</span></td>
      <td class="admin-actions">
        <button class="btn btn-ghost btn-sm" onclick="editNews('${n.id}')">Edit</button>
        <button class="btn btn-ghost btn-sm" onclick="deleteNews('${n.id}')">Delete</button>
      </td>
    </tr>`).join('');
  window._newsData = data;
}
window.editNews = (id) => {
  const n = window._newsData?.find(r => r.id === id); if (!n) return;
  newsEditId = id;
  document.getElementById('n-title').value   = n.title || '';
  document.getElementById('n-author').value  = n.author || '';
  document.getElementById('n-image').value   = n.image_url || '';
  document.getElementById('n-content').value = n.content || '';
  document.getElementById('n-tags').value    = (n.tags || []).join(', ');
  const pub = document.getElementById('n-published'); if (pub) pub.checked = n.published;
};
window.deleteNews = async (id) => {
  if (!confirm('Delete this post?')) return;
  await db.from('news_posts').delete().eq('id', id);
  toast('Post deleted.'); loadAdminNews();
};
async function saveNews() {
  const payload = {
    title:     document.getElementById('n-title')?.value.trim(),
    author:    document.getElementById('n-author')?.value.trim(),
    image_url: document.getElementById('n-image')?.value.trim(),
    content:   document.getElementById('n-content')?.value.trim(),
    tags:      (document.getElementById('n-tags')?.value || '').split(',').map(t => t.trim()).filter(Boolean),
    published: document.getElementById('n-published')?.checked ?? true,
  };
  if (!payload.title) { toast('Title is required.', 'error'); return; }
  const { error } = newsEditId
    ? await db.from('news_posts').update(payload).eq('id', newsEditId)
    : await db.from('news_posts').insert(payload);
  newsEditId = null;
  if (error) { toast('Error saving post.', 'error'); return; }
  toast('Post saved!', 'success'); loadAdminNews(); clearNewsForm();
}
function clearNewsForm() {
  ['n-title','n-author','n-image','n-content','n-tags'].forEach(id => {
    const el = document.getElementById(id); if (el) el.value = '';
  });
  const pub = document.getElementById('n-published'); if (pub) pub.checked = true;
  newsEditId = null;
}

// MERCH
let merchEditId = null;
async function loadAdminMerch() {
  const { data, error } = await db.from('merch_items').select('*').order('order_num');
  if (error) return;
  const tbody = document.getElementById('admin-merch-list');
  if (!tbody) return;
  tbody.innerHTML = data.map(m => `
    <tr>
      <td><strong style="color:#fff">${m.name}</strong></td>
      <td>${m.price ? `€${parseFloat(m.price).toFixed(2)}` : '—'}</td>
      <td><span class="admin-badge ${m.active ? 'admin-badge-active' : 'admin-badge-inactive'}">${m.active ? 'Active' : 'Hidden'}</span></td>
      <td class="admin-actions">
        <button class="btn btn-ghost btn-sm" onclick="editMerch('${m.id}')">Edit</button>
        <button class="btn btn-ghost btn-sm" onclick="deleteMerch('${m.id}')">Delete</button>
      </td>
    </tr>`).join('');
  window._merchData = data;
}
window.editMerch = (id) => {
  const m = window._merchData?.find(r => r.id === id); if (!m) return;
  merchEditId = id;
  document.getElementById('m-name').value  = m.name || '';
  document.getElementById('m-price').value = m.price || '';
  document.getElementById('m-img').value   = m.image_filename || '';
  document.getElementById('m-link').value  = m.payhip_link || '';
  document.getElementById('m-desc').value  = m.description || '';
  document.getElementById('m-order').value = m.order_num || 0;
  document.getElementById('m-active').checked = m.active;
};
window.deleteMerch = async (id) => {
  if (!confirm('Delete this product?')) return;
  await db.from('merch_items').delete().eq('id', id);
  toast('Product deleted.'); loadAdminMerch();
};
async function saveMerch() {
  const payload = {
    name:           document.getElementById('m-name')?.value.trim(),
    price:          parseFloat(document.getElementById('m-price')?.value) || null,
    image_filename: document.getElementById('m-img')?.value.trim(),
    payhip_link:    document.getElementById('m-link')?.value.trim(),
    description:    document.getElementById('m-desc')?.value.trim(),
    order_num:      parseInt(document.getElementById('m-order')?.value) || 0,
    active:         document.getElementById('m-active')?.checked ?? true,
  };
  if (!payload.name) { toast('Product name is required.', 'error'); return; }
  const { error } = merchEditId
    ? await db.from('merch_items').update(payload).eq('id', merchEditId)
    : await db.from('merch_items').insert(payload);
  merchEditId = null;
  if (error) { toast('Error saving product.', 'error'); return; }
  toast('Product saved!', 'success'); loadAdminMerch(); clearMerchForm();
}
function clearMerchForm() {
  ['m-name','m-price','m-img','m-link','m-desc','m-order'].forEach(id => {
    const el = document.getElementById(id); if (el) el.value = '';
  });
  const a = document.getElementById('m-active'); if (a) a.checked = true;
  merchEditId = null;
}

// SOCIALS
async function loadAdminSocials() {
  const formWrap = document.getElementById('admin-socials-form');
  if (!formWrap) return;
  const { data, error } = await db.from('socials').select('*').order('order_num');
  if (error || !data?.length) {
    formWrap.innerHTML = '<p style="color:var(--text-dim);font-size:.85rem">No social entries found.</p>';
    return;
  }
  formWrap.innerHTML = data.map(s => `
    <div class="admin-form-row" style="margin-bottom:12px;align-items:center">
      <div class="admin-field" style="flex:0 0 120px"><label style="color:var(--white)">${s.platform}</label></div>
      <div class="admin-field" style="flex:1"><input class="admin-input" id="soc-url-${s.id}" value="${s.url || ''}" placeholder="URL"></div>
      <div class="admin-field" style="flex:0 0 80px">
        <label style="display:flex;align-items:center;gap:6px;cursor:pointer">
          <input type="checkbox" id="soc-active-${s.id}" ${s.active ? 'checked' : ''} style="accent-color:#fff"> Active
        </label>
      </div>
      <button class="btn btn-ghost btn-sm" onclick="saveSocial('${s.id}')">Save</button>
    </div>`).join('');
}
window.saveSocial = async (id) => {
  const url    = document.getElementById(`soc-url-${id}`)?.value.trim();
  const active = document.getElementById(`soc-active-${id}`)?.checked ?? true;
  const { error } = await db.from('socials').update({ url, active }).eq('id', id);
  if (error) { toast('Error saving social.', 'error'); return; }
  toast('Social saved!', 'success');
};

// PLACEMENTS
let placementEditId = null;
async function loadAdminPlacements() {
  const { data, error } = await db.from('placements').select('*').order('date', { ascending: false });
  if (error) return;
  const tbody = document.getElementById('admin-placements-list');
  if (!tbody) return;
  tbody.innerHTML = data.map(p => `
    <tr>
      <td><strong style="color:#fff">${p.tournament}</strong></td>
      <td>${p.game || '—'}</td><td>${p.placement || '—'}</td>
      <td>${p.date ? new Date(p.date).toLocaleDateString() : '—'}</td>
      <td class="admin-actions">
        <button class="btn btn-ghost btn-sm" onclick="editPlacement('${p.id}')">Edit</button>
        <button class="btn btn-ghost btn-sm" onclick="deletePlacement('${p.id}')">Delete</button>
      </td>
    </tr>`).join('');
  window._placementData = data;
}
window.editPlacement = (id) => {
  const p = window._placementData?.find(r => r.id === id); if (!p) return;
  placementEditId = id;
  document.getElementById('pl-game').value       = p.game || '';
  document.getElementById('pl-tournament').value = p.tournament || '';
  document.getElementById('pl-placement').value  = p.placement || '';
  document.getElementById('pl-num').value        = p.placement_num || '';
  document.getElementById('pl-date').value       = p.date || '';
  document.getElementById('pl-prize').value      = p.prize || '';
};
window.deletePlacement = async (id) => {
  if (!confirm('Delete this placement?')) return;
  await db.from('placements').delete().eq('id', id);
  toast('Placement deleted.'); loadAdminPlacements();
};
async function savePlacement() {
  const payload = {
    game:          document.getElementById('pl-game')?.value,
    tournament:    document.getElementById('pl-tournament')?.value.trim(),
    placement:     document.getElementById('pl-placement')?.value.trim(),
    placement_num: parseInt(document.getElementById('pl-num')?.value) || null,
    date:          document.getElementById('pl-date')?.value || null,
    prize:         document.getElementById('pl-prize')?.value.trim(),
  };
  if (!payload.tournament) { toast('Tournament name required.', 'error'); return; }
  const { error } = placementEditId
    ? await db.from('placements').update(payload).eq('id', placementEditId)
    : await db.from('placements').insert(payload);
  placementEditId = null;
  if (error) { toast('Error saving placement.', 'error'); return; }
  toast('Placement saved!', 'success'); loadAdminPlacements(); clearPlacementForm();
}
function clearPlacementForm() {
  ['pl-tournament','pl-placement','pl-num','pl-date','pl-prize'].forEach(id => {
    const el = document.getElementById(id); if (el) el.value = '';
  });
  placementEditId = null;
}

/* ═══════════════════════════════════════════
   NEWS CONTENT PARSER
═══════════════════════════════════════════ */
function parseContent(text) {
  if (!text) return '';
  const internalPages = {
    home: 'index.html', roster: 'roster.html', leaders: 'leaders.html',
    news: 'news.html', merch: 'merch.html', socials: 'socials.html',
    about: 'about.html', placements: 'about.html#placements', contact: 'about.html#contact'
  };
  return text
    .replace(/^# (.+)$/gm, '<h3 class="news-h3">$1</h3>')
    .replace(/^## (.+)$/gm, '<h4 class="news-h4">$1</h4>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/~~(.+?)~~/g, '<del>$1</del>')
    .replace(/`(.+?)`/g, '<code style="font-family:monospace;background:rgba(255,255,255,0.08);padding:1px 6px;border-radius:4px;font-size:.88em">$1</code>')
    .replace(/^> (.+)$/gm, '<blockquote class="news-quote">$1</blockquote>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener" class="news-link">$1</a>')
    .replace(/\[\[([^\]|]+)\|?([^\]]*)\]\]/g, (_, page, label) => {
      const href = internalPages[page.toLowerCase().trim()] || '#';
      return `<a href="${href}" class="news-internal-link">🔗 ${label || page}</a>`;
    })
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
const GAME_LOGOS = { valorant: 'valorantlogo.jpg', fortnite: 'fortnitelogo.jpg', rs6: 'rs6logo.jpg', cs2: 'cs2logo.jpg' };
const GAME_NAMES = { valorant: 'Valorant', fortnite: 'Fortnite', rs6: 'Rainbow Six Siege', cs2: 'CS2' };
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
  if (e.key === 'Enter' && document.getElementById('admin-pw-modal')?.style.display !== 'none') checkAdminPw();
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

// Global exports
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