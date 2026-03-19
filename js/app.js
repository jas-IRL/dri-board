/*
  DRI Board - Core App Logic
*/

const panelTitles = {
  'mission-control': 'Mission Control',
  'workstreams': 'Workstreams',
  'comms-queue': 'Comms Queue',
  'collaborator-sentiment': 'Collaborator Sentiment',
  'worldview': 'Worldview',
  'ai-recommender': 'AI Recommender',
  'intake-triage': 'Intake / Triage',
  'gap-analysis': 'Gap Analysis',
  'qbr-engine': 'QBR Engine',
  'brag-board': 'Brag Board / Impact Journal',
  'decision-log': 'Decision Log'
};

function qs(sel, root = document) { return root.querySelector(sel); }
function qsa(sel, root = document) { return [...root.querySelectorAll(sel)]; }

function escapeHtml(str) {
  return (str || '').replace(/[&<>"]+/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[m] || m));
}

function setActivePanel(panelId) {
  qsa('.panel').forEach(p => p.classList.remove('active'));
  qs(`#${panelId}`)?.classList.add('active');

  qsa('.nav-item').forEach(i => i.classList.remove('active'));
  qs(`.nav-item[data-panel="${panelId}"]`)?.classList.add('active');

  qs('#panel-title').textContent = panelTitles[panelId] || 'DRI Board';

  // Render when switching
  if (typeof renderAll === 'function') renderAll(panelId);
}

function toggleSidebar() {
  const sidebar = qs('#sidebar');
  // Desktop collapse, mobile open
  if (window.innerWidth <= 1024) {
    sidebar.classList.toggle('open');
  } else {
    sidebar.classList.toggle('collapsed');
  }
}

function initNavigation() {
  qsa('.nav-item').forEach(item => {
    item.addEventListener('click', () => {
      const panel = item.getAttribute('data-panel');
      setActivePanel(panel);
      if (window.innerWidth <= 1024) qs('#sidebar').classList.remove('open');
    });
  });

  qs('#sidebar-toggle').addEventListener('click', toggleSidebar);

  // Close sidebar on overlay tap for mobile
  document.addEventListener('click', (e) => {
    if (window.innerWidth > 1024) return;
    const sidebar = qs('#sidebar');
    if (!sidebar.classList.contains('open')) return;
    const clickedInside = sidebar.contains(e.target) || qs('#sidebar-toggle').contains(e.target);
    if (!clickedInside) sidebar.classList.remove('open');
  });
}

function initTabs() {
  const tabs = qsa('#comms-queue .tab');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      qsa('#comms-queue .tab-content').forEach(c => c.classList.remove('active'));
      const which = tab.getAttribute('data-tab');
      qs(`#tab-${which}`)?.classList.add('active');
    });
  });
}

function initModalCloseHandlers() {
  // Generic modals
  qsa('.modal, .sentiment-detail-modal').forEach(modal => {
    const closeBtn = qs('.modal-close', modal);
    const overlay = qs('.modal-overlay', modal);
    closeBtn?.addEventListener('click', () => modal.style.display = 'none');
    overlay?.addEventListener('click', () => modal.style.display = 'none');
  });
}

function initGlobalSearch() {
  const input = qs('#global-search');
  if (!input) return;
  input.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter') return;
    const q = input.value.trim().toLowerCase();
    if (!q) return;

    // Very lightweight: jump to first matching initiative
    const match = initiatives.find(i =>
      i.id.toLowerCase().includes(q) ||
      i.name.toLowerCase().includes(q) ||
      (i.description || '').toLowerCase().includes(q)
    );

    if (match) {
      setActivePanel('workstreams');
      // Expand matching card after render
      setTimeout(() => {
        const card = qs(`.ws-card[data-id="${match.id}"]`);
        if (card) {
          card.classList.add('expanded');
          card.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 50);
    } else {
      alert('No matches in demo data. (Integrations will expand search scope.)');
    }
  });
}

function snooze(kind, id) {
  if (kind === 'rec') store.snoozed.recs.add(id);
  if (kind === 'comms') store.snoozed.comms.add(id);
  if (kind === 'worldview') store.snoozed.worldview.add(id);
  persistSnoozes();
  if (typeof renderAll === 'function') renderAll();
}

function unsnoozeAll() {
  store.snoozed.recs.clear();
  store.snoozed.comms.clear();
  store.snoozed.worldview.clear();
  persistSnoozes();
  if (typeof renderAll === 'function') renderAll();
}

function setBuildStamp() {
  const el = document.getElementById('build-stamp');
  if (!el) return;

  // Visible “proof” the newest build is loading
  const build = 'build: 2026-03-19 18:06';
  const mode = (window.DRI_CONFIG && window.DRI_CONFIG.API_BASE) ? 'LIVE' : 'DEMO';
  el.textContent = `${build} • ${mode}`;
}

async function initApp() {
  initNavigation();
  initTabs();
  initModalCloseHandlers();
  initGlobalSearch();

  setBuildStamp();

  // If a backend is configured, load live bridge data first
  if (typeof bootstrapLiveData === 'function') {
    try { await bootstrapLiveData(); } catch (e) { /* fall back to demo */ }
  }

  // Default panel
  setActivePanel('mission-control');
}

document.addEventListener('DOMContentLoaded', () => { initApp(); });
