/*
  DRI Board - Panel Renderers
  This is a front-end prototype using mock data in data.js.
*/

function formatLifecycle(lifecycle) {
  if (lifecycle === 'In Measurement') return { cls: 'measuring', label: 'In Measurement' };
  if (lifecycle === 'Closed') return { cls: 'closed', label: 'Closed' };
  if (lifecycle === 'Paused') return { cls: 'paused', label: 'Paused' };
  return { cls: 'active', label: 'Active' };
}

function pClass(p) {
  return (p || '').toLowerCase();
}

function progressColor(pct) {
  if (pct >= 80) return 'green';
  if (pct >= 55) return 'blue';
  if (pct >= 35) return 'yellow';
  return 'red';
}

function renderMissionControl() {
  // Readiness ring
  const readiness = calcOverallReadiness(true);
  const ring = qs('#readiness-ring-fill');
  const value = qs('#readiness-value');
  if (value) value.textContent = `${readiness}%`;
  if (ring) {
    const circumference = 2 * Math.PI * 52;
    const offset = circumference * (1 - readiness / 100);
    ring.style.strokeDasharray = `${circumference.toFixed(1)}`;
    ring.style.strokeDashoffset = `${offset.toFixed(1)}`;
  }

  // Quick stats
  const activeCount = initiatives.filter(i => i.lifecycle === 'Active').length;
  const measuringCount = initiatives.filter(i => i.lifecycle === 'In Measurement').length;
  const atRiskCount = collaborators.filter(c => ['Cooling', 'Drifting', 'Strained'].includes(c.state)).length;
  const unrepliedCount = comms.unreplied.filter(m => !store.snoozed.comms.has(m.id)).length;
  qs('#stat-active').textContent = `${activeCount}`;
  qs('#stat-measuring').textContent = `${measuringCount}`;
  qs('#stat-atrisk').textContent = `${atRiskCount}`;
  qs('#stat-unreplied').textContent = `${unrepliedCount}`;

  // Actions list
  const actionsList = qs('#actions-list');
  const visibleActions = actionsDueToday.slice(0, 6);
  qs('#actions-count').textContent = `${visibleActions.length}`;
  actionsList.innerHTML = visibleActions.map(a => `
    <li class="action-item">
      <div class="action-meta">
        <div class="action-title truncate">${escapeHtml(a.title)}</div>
        <div class="action-sub">${escapeHtml(a.sub)} · <span class="text-muted">${escapeHtml(a.initiativeId)}</span></div>
      </div>
      <span class="p-badge ${pClass(a.pLevel)}">${escapeHtml(a.pLevel)}</span>
    </li>
  `).join('');

  // Checklist top items: pick incomplete, sort by P-level then deadline
  const pOrder = { P0: 0, P1: 1, P2: 2, P3: 3 };
  const items = [];
  initiatives.filter(i => i.lifecycle === 'Active').forEach(init => {
    init.checklist?.filter(c => !c.done).forEach(c => items.push({
      initId: init.id,
      initName: init.name,
      pLevel: init.pLevel,
      due: c.due,
      text: c.text
    }));
  });

  items.sort((a, b) => {
    const po = (pOrder[a.pLevel] ?? 9) - (pOrder[b.pLevel] ?? 9);
    if (po !== 0) return po;
    return new Date(a.due) - new Date(b.due);
  });

  const checklistEl = qs('#mc-checklist');
  checklistEl.innerHTML = items.slice(0, 7).map(it => `
    <li class="checklist-item">
      <div class="checklist-meta">
        <div class="checklist-title truncate">${escapeHtml(it.text)}</div>
        <div class="checklist-sub">${escapeHtml(it.initId)} · due ${escapeHtml(it.due)} (${daysUntil(it.due)}d)</div>
      </div>
      <span class="p-badge ${pClass(it.pLevel)}">${escapeHtml(it.pLevel)}</span>
    </li>
  `).join('');

  // Urgent recommendations
  const mcRecs = qs('#mc-recs');
  const visibleRecs = recommendations.filter(r => !store.snoozed.recs.has(r.id)).slice(0, 3);
  mcRecs.innerHTML = visibleRecs.map(r => `
    <div class="rec-card">
      <div class="rec-title">${escapeHtml(r.title)}</div>
      <div class="rec-why">Why now: ${escapeHtml(r.whyNow)} · Tenet: ${escapeHtml(r.tenet)}</div>
      <div class="rec-actions">
        <button class="btn btn-primary btn-sm" data-gen-rec="${escapeHtml(r.id)}"><i class="fas fa-bolt"></i> Generate</button>
        <button class="btn btn-secondary btn-sm" data-snooze-rec="${escapeHtml(r.id)}"><i class="fas fa-clock"></i> Not Relevant</button>
      </div>
    </div>
  `).join('');

  qsa('[data-snooze-rec]').forEach(btn => {
    btn.onclick = () => snooze('rec', btn.getAttribute('data-snooze-rec'));
  });
  qsa('[data-gen-rec]').forEach(btn => {
    btn.onclick = () => alert('Demo: “Generate” would produce an artifact and attach it to Jira.');
  });

  // Collab alerts
  const alerts = qs('#mc-collab-alerts');
  const atRisk = collaborators.filter(c => ['Cooling', 'Drifting', 'Strained'].includes(c.state));
  alerts.innerHTML = atRisk.map(c => `
    <div class="collab-alert">
      <div class="flex justify-between items-center gap-12">
        <div>
          <div style="font-weight:800">${escapeHtml(c.tier.role)}</div>
          <div class="text-muted" style="font-size:0.8rem">${escapeHtml(c.tier.org)}</div>
        </div>
        <span class="sentiment-badge ${c.state.toLowerCase()}">${escapeHtml(c.state)}</span>
      </div>
      <div class="text-secondary" style="font-size:0.85rem; line-height:1.35">Recommended action: ${escapeHtml(c.recommendation || '')}</div>
      <div class="rec-actions">
        <button class="btn btn-secondary btn-sm" data-draft-reengage="${escapeHtml(c.id)}"><i class="fas fa-pen"></i> Draft Message</button>
      </div>
    </div>
  `).join('');

  qsa('[data-draft-reengage]').forEach(btn => {
    btn.onclick = () => {
      alert('Demo: drafts a re-engagement message that leads with an unblock and a clear ask.');
    };
  });
}

function renderWorkstreams() {
  const list = qs('#workstream-list');
  const filter = qs('#workstreams .filter-btn.active')?.getAttribute('data-filter') || 'active-measuring';
  const sort = qs('#ws-sort')?.value || 'priority';

  let items = [...initiatives];
  if (filter === 'active-measuring') {
    items = items.filter(i => ['Active', 'In Measurement'].includes(i.lifecycle));
  }

  const pOrder = { P0: 0, P1: 1, P2: 2, P3: 3 };
  items.sort((a, b) => {
    if (sort === 'deadline') return new Date(a.deadline) - new Date(b.deadline);
    if (sort === 'progress') return calcInitiativeProgress(b) - calcInitiativeProgress(a);
    return (pOrder[a.pLevel] ?? 9) - (pOrder[b.pLevel] ?? 9);
  });

  list.innerHTML = items.map(init => {
    const prog = calcInitiativeProgress(init);
    const lc = formatLifecycle(init.lifecycle);
    const riskSignals = deriveRisks(init);

    return `
      <div class="ws-card ${init.lifecycle === 'Closed' ? 'closed' : ''}" data-id="${escapeHtml(init.id)}">
        <div class="ws-header">
          <div class="ws-title">
            <span class="p-badge ${pClass(init.pLevel)}">${escapeHtml(init.pLevel)}</span>
            <span class="lifecycle-badge ${lc.cls}">${escapeHtml(lc.label)}</span>
            <div class="flex flex-col" style="min-width:0">
              <div class="name truncate">${escapeHtml(init.name)}</div>
              <div class="id">${escapeHtml(init.id)} · deadline ${escapeHtml(init.deadline)} (${daysUntil(init.deadline)}d)</div>
            </div>
          </div>
          <div class="ws-meta">
            <div style="min-width:140px">
              <div class="text-muted" style="font-size:0.75rem; margin-bottom:6px">Progress: ${prog}%</div>
              <div class="progress-bar"><div class="progress-fill ${progressColor(prog)}" style="width:${prog}%"></div></div>
            </div>
            <button class="btn btn-secondary btn-sm"><i class="fas fa-chevron-down"></i> Expand</button>
          </div>
        </div>
        <div class="ws-body">
          <div class="ws-body-grid">
            <div class="ws-section">
              <h4>Description</h4>
              <div class="text-secondary" style="line-height:1.4">${escapeHtml(init.description)}</div>
              <div class="ws-risk">
                ${riskSignals.map(r => `<div class="risk-chip">${escapeHtml(r)}</div>`).join('')}
              </div>
            </div>
            <div class="ws-section">
              <h4>RAPID</h4>
              <div class="ws-kv">
                <div class="k">Recommend</div><div>${escapeHtml(init.rapid.recommend)}</div>
                <div class="k">Agree</div><div>${escapeHtml(init.rapid.agree)}</div>
                <div class="k">Perform</div><div>${escapeHtml(init.rapid.perform)}</div>
                <div class="k">Input</div><div>${escapeHtml(init.rapid.input)}</div>
                <div class="k">Decide</div><div>${escapeHtml(init.rapid.decide)}</div>
              </div>
              <div class="mt-12">
                <h4>Checklist</h4>
                <ul class="ws-checklist">
                  ${(init.checklist || []).map(c => `
                    <li class="ws-check-item ${c.done ? 'done' : ''}" data-check="${escapeHtml(init.id)}::${escapeHtml(c.id)}">
                      <div class="left">
                        <input type="checkbox" ${c.done ? 'checked' : ''} />
                        <div class="label truncate">${escapeHtml(c.text)}<div class="text-muted" style="font-size:0.75rem">due ${escapeHtml(c.due)} (${daysUntil(c.due)}d)</div></div>
                      </div>
                      <span class="p-badge ${pClass(init.pLevel)}">${escapeHtml(init.pLevel)}</span>
                    </li>
                  `).join('')}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }).join('');

  // Expand handlers
  qsa('.ws-card .ws-header').forEach(h => {
    h.onclick = () => {
      const card = h.closest('.ws-card');
      card.classList.toggle('expanded');
    };
  });

  // Checklist toggles
  qsa('.ws-check-item input[type="checkbox"]').forEach(cb => {
    cb.onchange = () => {
      const li = cb.closest('.ws-check-item');
      const key = li.getAttribute('data-check');
      const [initId, checkId] = key.split('::');
      const init = initiatives.find(i => i.id === initId);
      const item = init?.checklist?.find(c => c.id === checkId);
      if (item) item.done = cb.checked;
      renderAll('workstreams');
      renderAll('mission-control');
    };
  });

  // Workstreams filters
  qsa('#workstreams .filter-btn').forEach(btn => {
    btn.onclick = () => {
      qsa('#workstreams .filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      renderAll('workstreams');
    };
  });

  qs('#ws-sort').onchange = () => renderAll('workstreams');
}

function deriveRisks(init) {
  const risks = [];
  const remaining = (init.checklist || []).filter(c => !c.done);
  const d = daysUntil(init.deadline);
  if (d <= 3 && remaining.length >= 2) risks.push('Timeline pressure: multiple incomplete checklist items with <=3 days remaining.');
  if (!init.artifacts?.some(a => a.type.toLowerCase().includes('go/no-go') && a.status !== 'Missing')) risks.push('Artifact gap: Go/No-Go missing or incomplete.');
  if (!init.rapid?.decide) risks.push('RAPID risk: Decide role not assigned.');
  return risks.slice(0, 3);
}

function renderCommsQueue() {
  function threadRow(item, kind) {
    const init = initiatives.find(i => i.id === item.initiativeId);
    const p = init?.pLevel || 'P2';

    const rightMeta = kind === 'open'
      ? `<span class="card-badge">+${item.newCount} new</span>${item.decisionMade ? '<span class="card-badge" style="background:rgba(239,68,68,0.15);color:var(--accent-red)">Decision made</span>' : ''}`
      : kind === 'pro'
      ? `<span class="confidence-badge ${item.confidence.toLowerCase().replace(' ', '-')}">${escapeHtml(item.confidence)}</span>`
      : `<span class="card-badge">${escapeHtml(item.urgency)}</span>`;

    const extra = kind === 'pro'
      ? `<div class="thread-sub">Signal: ${escapeHtml(item.signal)} · Suggested: ${escapeHtml(item.talkingPoint)}</div>`
      : kind === 'open'
      ? `<div class="thread-sub">Catch-up: ${escapeHtml(item.summary)}</div>`
      : `<div class="thread-sub">${escapeHtml(item.sender)} in ${escapeHtml(item.channel)} · ${escapeHtml(item.ts)} · ${escapeHtml(item.initiativeId)}</div>`;

    const preview = kind === 'open' ? item.summary : item.preview;

    return `
      <div class="thread">
        <div class="thread-header">
          <div class="thread-title truncate">
            <span class="p-badge ${pClass(p)}">${escapeHtml(p)}</span>
            <span class="truncate">${escapeHtml(init?.name || 'Unknown initiative')}</span>
          </div>
          <div class="flex gap-8 items-center">${rightMeta}</div>
        </div>
        ${extra}
        <div class="thread-preview">${escapeHtml(preview)}</div>
        <div class="thread-actions">
          <button class="btn btn-primary btn-sm" data-draft="${escapeHtml(kind)}::${escapeHtml(item.id)}"><i class="fas fa-pen"></i> Draft Response</button>
          <button class="btn btn-secondary btn-sm" data-snooze-comms="${escapeHtml(item.id)}"><i class="fas fa-clock"></i> Not Relevant</button>
        </div>
      </div>
    `;
  }

  const unreplied = comms.unreplied.filter(m => !store.snoozed.comms.has(m.id));
  const open = comms.openThreads.filter(m => !store.snoozed.comms.has(m.id));
  const pro = comms.proactive.filter(m => !store.snoozed.comms.has(m.id));

  qs('#unreplied-list').innerHTML = unreplied.map(i => threadRow(i, 'unreplied')).join('');
  qs('#open-threads-list').innerHTML = open.map(i => threadRow(i, 'open')).join('');
  qs('#proactive-list').innerHTML = pro.map(i => threadRow(i, 'pro')).join('');

  qsa('[data-snooze-comms]').forEach(btn => {
    btn.onclick = () => snooze('comms', btn.getAttribute('data-snooze-comms'));
  });

  qsa('[data-draft]').forEach(btn => {
    btn.onclick = () => {
      alert('Demo: generates a concise Slack draft under 200 words, aligned to P-level urgency.');
    };
  });
}

function renderCollaboratorSentiment() {
  const tier = qs('#collaborator-sentiment .filter-btn.active')?.getAttribute('data-tier') || 'role';
  const query = (qs('#collab-search')?.value || '').toLowerCase().trim();

  let items = collaborators;

  if (tier === 'org') {
    const byOrg = new Map();
    for (const c of collaborators) {
      const k = c.tier.org;
      const arr = byOrg.get(k) || [];
      arr.push(c);
      byOrg.set(k, arr);
    }
    items = [...byOrg.entries()].map(([org, arr]) => aggregateSentiment(org, 'Org', arr));
  } else if (tier === 'role') {
    const byRole = new Map();
    for (const c of collaborators) {
      const k = c.tier.role;
      const arr = byRole.get(k) || [];
      arr.push(c);
      byRole.set(k, arr);
    }
    items = [...byRole.entries()].map(([role, arr]) => aggregateSentiment(role, 'Role', arr));
  } else {
    items = collaborators.map(c => ({
      id: c.id,
      name: c.tier.individual,
      subtitle: `${c.tier.role} · ${c.tier.org}`,
      state: c.state,
      composite: c.composite,
      dims: c.dims,
      recommendation: c.recommendation
    }));
  }

  if (query) {
    items = items.filter(i => (i.name + ' ' + i.subtitle).toLowerCase().includes(query));
  }

  const grid = qs('#sentiment-grid');
  grid.innerHTML = items.map(i => `
    <div class="sentiment-card" data-sent="${escapeHtml(i.id)}">
      <div class="sentiment-header">
        <div style="min-width:0">
          <div class="sentiment-name truncate">${escapeHtml(i.name)}</div>
          <div class="sentiment-role truncate">${escapeHtml(i.subtitle)}</div>
        </div>
        <span class="sentiment-badge ${i.state.toLowerCase()}">${escapeHtml(i.state)}</span>
      </div>
      <div class="dim-grid">
        <div class="k">Composite</div><div style="font-weight:800">${i.composite.toFixed(1)}</div>
        <div class="k">Responsiveness</div><div>${i.dims.responsiveness.toFixed(1)}</div>
        <div class="k">Reliability</div><div>${i.dims.reliability.toFixed(1)}</div>
      </div>
      ${i.recommendation ? `<div class="mt-12 text-secondary" style="font-size:0.85rem; line-height:1.35">Action: ${escapeHtml(i.recommendation)}</div>` : ''}
    </div>
  `).join('');

  qsa('#collaborator-sentiment .filter-btn').forEach(btn => {
    btn.onclick = () => {
      qsa('#collaborator-sentiment .filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      renderAll('collaborator-sentiment');
    };
  });

  qs('#collab-search').oninput = () => renderAll('collaborator-sentiment');

  // Modal
  qsa('[data-sent]').forEach(card => {
    card.onclick = () => {
      const id = card.getAttribute('data-sent');
      const item = collaborators.find(c => c.id === id);
      if (!item) return;

      const modal = qs('#sentiment-modal');
      const body = qs('#sentiment-modal-body');
      body.innerHTML = `
        <h3 style="margin-bottom:8px">${escapeHtml(item.tier.individual)}</h3>
        <div class="text-muted" style="margin-bottom:12px">Private sentiment details. Do not share externally.</div>
        <div class="output-kv">
          <div class="k">Org</div><div>${escapeHtml(item.tier.org)}</div>
          <div class="k">Role</div><div>${escapeHtml(item.tier.role)}</div>
          <div class="k">State</div><div><span class="sentiment-badge ${item.state.toLowerCase()}">${escapeHtml(item.state)}</span></div>
          <div class="k">Composite</div><div>${item.composite.toFixed(1)} (1.0-5.0)</div>
          <div class="k">Responsiveness</div><div>${item.dims.responsiveness.toFixed(1)}</div>
          <div class="k">Engagement Depth</div><div>${item.dims.engagement.toFixed(1)}</div>
          <div class="k">Proactivity</div><div>${item.dims.proactivity.toFixed(1)}</div>
          <div class="k">Reliability</div><div>${item.dims.reliability.toFixed(1)}</div>
          <div class="k">Tone Alignment</div><div>${item.dims.tone.toFixed(1)}</div>
        </div>
        ${item.recommendation ? `<div class="mt-16"><div style="font-weight:800;margin-bottom:6px">Recommended action</div><div class="text-secondary">${escapeHtml(item.recommendation)}</div></div>` : ''}
        <div class="mt-16">
          <button class="btn btn-secondary" id="draft-reengage"><i class="fas fa-pen"></i> Draft re-engagement message</button>
        </div>
      `;

      qs('#draft-reengage').onclick = () => alert('Demo: drafts a message that leads with an unblock and a clear ask.');

      modal.style.display = 'flex';
    };
  });
}

function aggregateSentiment(name, label, arr) {
  const avg = (k) => arr.reduce((s, x) => s + x.dims[k], 0) / arr.length;
  const composite = arr.reduce((s, x) => s + x.composite, 0) / arr.length;
  const state = composite >= 4.5 ? 'Strong'
    : composite >= 3.5 ? 'Stable'
    : composite >= 2.5 ? 'Cooling'
    : composite >= 1.5 ? 'Drifting'
    : 'Strained';

  return {
    id: `${label}:${name}`,
    name,
    subtitle: `${label} aggregate · ${arr.length} people`,
    state,
    composite,
    dims: {
      responsiveness: avg('responsiveness'),
      engagement: avg('engagement'),
      proactivity: avg('proactivity'),
      reliability: avg('reliability'),
      tone: avg('tone')
    },
    recommendation: ['Cooling','Drifting','Strained'].includes(state)
      ? 'Take a targeted unblock action: send a concrete ask, propose 2 options, and set a response deadline.'
      : null
  };
}

async function renderWorldview() {
  const activeType = qs('#worldview .filter-btn.active')?.getAttribute('data-wv') || 'all';

  let items = worldviewItems;

  // If API_BASE is set, pull real external items from backend RSS aggregator
  const apiBase = (window.DRI_CONFIG && window.DRI_CONFIG.API_BASE) ? window.DRI_CONFIG.API_BASE : '';
  if (apiBase) {
    try {
      const res = await fetch(`${apiBase}/api/worldview`);
      if (res.ok) {
        const json = await res.json();
        if (json && Array.isArray(json.items) && json.items.length) {
          items = json.items;
        }
      }
    } catch (e) {
      // fall back to local demo data
    }
  }

  items = items.filter(w => !store.snoozed.worldview.has(w.id));
  if (activeType !== 'all') {
    items = items.filter(w => (w.type || '').toLowerCase() === activeType);
  }

  const grid = qs('#worldview-grid');
  grid.innerHTML = items.map(w => `
    <div class="wv-card">
      <div class="flex justify-between items-center gap-12">
        <span class="type-badge ${(w.type || '').toLowerCase()}">${escapeHtml(w.type || '')}</span>
        <button class="btn btn-secondary btn-sm" data-snooze-wv="${escapeHtml(w.id)}"><i class="fas fa-clock"></i> Not Relevant</button>
      </div>
      <div class="wv-title">${escapeHtml(w.title)}</div>
      <div class="wv-summary">${escapeHtml(w.summary)}</div>
      <div class="wv-footer">
        <div class="text-muted" style="font-size:0.8rem">Relevance: <span class="text-secondary">${escapeHtml(w.relevance)}</span></div>
      </div>
      <div class="wv-so-what"><b>So what:</b> ${escapeHtml(w.soWhat)}</div>
    </div>
  `).join('');

  qsa('#worldview .filter-btn').forEach(btn => {
    btn.onclick = () => {
      qsa('#worldview .filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      renderAll('worldview');
    };
  });

  qsa('[data-snooze-wv]').forEach(btn => {
    btn.onclick = () => snooze('worldview', btn.getAttribute('data-snooze-wv'));
  });
}

function renderRecommender() {
  const list = qs('#recommender-list');
  const items = recommendations.filter(r => !store.snoozed.recs.has(r.id)).slice(0, 7);
  list.innerHTML = items.map(r => {
    const init = initiatives.find(i => i.id === r.initiativeId);
    return `
      <div class="rec-row">
        <div class="top">
          <div class="title">${escapeHtml(r.title)}</div>
          <div class="flex gap-8 items-center">
            <span class="p-badge ${pClass(init?.pLevel || 'P2')}">${escapeHtml(init?.pLevel || 'P2')}</span>
            <span class="card-badge">Effort: ${escapeHtml(r.effort)}</span>
          </div>
        </div>
        <div class="meta">
          <span>Why now: ${escapeHtml(r.whyNow)}</span>
          <span>Tenet: ${escapeHtml(r.tenet)}</span>
          <span>Initiative: ${escapeHtml(r.initiativeId)}</span>
        </div>
        <div class="actions">
          <button class="btn btn-primary btn-sm" data-gen="${escapeHtml(r.id)}"><i class="fas fa-wand-magic-sparkles"></i> Generate</button>
          <button class="btn btn-secondary btn-sm" data-snooze-rec="${escapeHtml(r.id)}"><i class="fas fa-clock"></i> Not Relevant</button>
        </div>
      </div>
    `;
  }).join('');

  qsa('[data-snooze-rec]').forEach(btn => {
    btn.onclick = () => snooze('rec', btn.getAttribute('data-snooze-rec'));
  });
  qsa('[data-gen]').forEach(btn => {
    btn.onclick = () => alert('Demo: “Generate” would produce a complete deliverable and write back to Jira.');
  });
}

function initIntake() {
  qs('#intake-generate').onclick = () => {
    const text = (qs('#intake-text').value || '').trim();
    if (!text) return alert('Paste a change description first.');
    const out = qs('#intake-output');
    out.style.display = 'block';
    out.innerHTML = buildIntakeOutput(text);
  };
  qs('#intake-clear').onclick = () => {
    qs('#intake-text').value = '';
    qs('#intake-output').style.display = 'none';
    qs('#intake-output').innerHTML = '';
  };
}

function buildIntakeOutput(text) {
  // Demo heuristics only
  const lower = text.toLowerCase();
  const p = lower.includes('p0') ? 'P0'
    : (lower.includes('launch') || lower.includes('legal') || lower.includes('marketing')) ? 'P1'
    : lower.includes('macro') ? 'P3'
    : 'P2';

  const affected = [];
  if (lower.includes('bank')) affected.push('Banking');
  if (lower.includes('dispute')) affected.push('Disputes');
  if (lower.includes('fraud')) affected.push('Fraud');
  if (affected.length === 0) affected.push('TBD');

  const rapid = {
    recommend: 'Product / Ops',
    agree: p === 'P0' ? 'Legal + Quality' : 'Quality',
    perform: 'Content Ops + L&D + BPO',
    input: 'BPO Ops + VMO + Product',
    decide: 'Strategy Lead, Operational Readiness'
  };

  const goNoGo = [
    'Jira epic created with P-level label and deadline',
    'RAPID assigned and acknowledged (Decide, Agree, Perform)',
    'Training brief approved and scheduled for all sites',
    'Comms draft reviewed by Agree role(s)',
    'Advocate comprehension check defined (pass threshold)',
    'KB/macros updated and published',
    'Measurement plan includes 7-day leading + 30-day lagging metrics',
    'Abort triggers defined and escalation path confirmed',
    'BPO delivery plan confirmed (sites, dates, coverage)',
    'Go/No-Go meeting held and decision logged'
  ];

  const measurement = {
    leading7: ['Training completion %', 'Comprehension pass rate', 'Top driver tags', 'Escalations volume'],
    lagging30: ['FCR', 'CSAT', 'AHT', 'QA score'],
    abort: ['FCR down >2pp for 3 consecutive days', 'QA down >3pp vs baseline', 'Escalations spike >25% week-over-week']
  };

  const slackMsg = `Hi team. For this change, I’m classifying it as ${p} based on customer impact and readiness risk.\n\nNext steps today: (1) confirm RAPID (Decide/Agree/Perform) in Jira, (2) align deadline and launch guardrails, (3) lock training modality and success criteria.\n\nPlease reply with any blockers by EOD so we can keep the readiness plan on track.`;

  return `
    <div class="output-card">
      <h4>P-level classification</h4>
      <div class="output-kv">
        <div class="k">P-level</div><div><span class="p-badge ${pClass(p)}">${p}</span></div>
        <div class="k">Rationale</div><div class="text-secondary">Demo logic. Replace with Playbook P-level framework once wired to your playbook requirements.</div>
        <div class="k">Affected LOBs</div><div class="text-secondary">${affected.join(', ')}</div>
        <div class="k">Risk if advocates are unprepared</div><div class="text-secondary">Incorrect guidance, increased escalations, QA variance, and potential compliance exposure depending on change type.</div>
      </div>
    </div>

    <div class="output-card">
      <h4>RAPID assignment</h4>
      <div class="output-kv">
        <div class="k">Recommend</div><div>${escapeHtml(rapid.recommend)}</div>
        <div class="k">Agree</div><div>${escapeHtml(rapid.agree)}</div>
        <div class="k">Perform</div><div>${escapeHtml(rapid.perform)}</div>
        <div class="k">Input</div><div>${escapeHtml(rapid.input)}</div>
        <div class="k">Decide</div><div>${escapeHtml(rapid.decide)}</div>
      </div>
    </div>

    <div class="output-card">
      <h4>Stakeholder Slack message (ready to send)</h4>
      <textarea style="min-height:140px">${escapeHtml(slackMsg)}</textarea>
    </div>

    <div class="output-card">
      <h4>Training brief</h4>
      <div class="output-list">
        <div class="li"><b>Modality:</b> Microlearning + 5-question comprehension check; live Q&A if P0/P1.</div>
        <div class="li"><b>Timeline:</b> Draft within 48h; delivery 2-5 days pre-launch; refresh macros same day as training publish.</div>
        <div class="li"><b>Prereqs:</b> final policy/UX spec, approved customer language, updated KB.</div>
        <div class="li"><b>Success criteria:</b> completion >= 95% (sites), pass rate >= 85%, no new critical QA failure mode introduced.</div>
      </div>
    </div>

    <div class="output-card">
      <h4>Go/No-Go checklist (binary criteria)</h4>
      <div class="output-list">
        ${goNoGo.map(x => `<div class="li">□ ${escapeHtml(x)}</div>`).join('')}
      </div>
    </div>

    <div class="output-card">
      <h4>Measurement plan</h4>
      <div class="output-list">
        <div class="li"><b>7-day leading:</b> ${measurement.leading7.join(', ')}</div>
        <div class="li"><b>30-day lagging:</b> ${measurement.lagging30.join(', ')}</div>
        <div class="li"><b>Abort triggers:</b> ${measurement.abort.join('; ')}</div>
        <div class="li"><b>Success definition:</b> improve or maintain baseline KPIs while reducing avoidable escalations for the change area.</div>
      </div>
      <div class="mt-12">
        <button class="btn btn-primary"><i class="fas fa-plus"></i> Push to Jira (demo)</button>
        <button class="btn btn-secondary" onclick="alert('Demo: would create Jira epic and attach artifacts.')"><i class="fas fa-link"></i> Attach artifacts</button>
      </div>
    </div>
  `;
}

function initGapAnalysis() {
  qs('#gap-analyze').onclick = () => {
    const text = (qs('#gap-text').value || '').trim();
    if (!text) return alert('Paste a plan first.');
    const out = qs('#gap-output');
    out.style.display = 'block';
    out.innerHTML = buildGapOutput(text);
  };
  qs('#gap-clear').onclick = () => {
    qs('#gap-text').value = '';
    qs('#gap-output').style.display = 'none';
    qs('#gap-output').innerHTML = '';
  };
}

function buildGapOutput(text) {
  // Demo red-team: checks for keywords
  const lower = text.toLowerCase();
  const hasRapid = lower.includes('rapid') || (lower.includes('decide') && lower.includes('perform'));
  const hasMeasure = lower.includes('measure') || lower.includes('kpi') || lower.includes('csat') || lower.includes('fcr');
  const hasChecklist = lower.includes('checklist') || lower.includes('go/no-go') || lower.includes('go no go');
  const hasComms = lower.includes('comms') || lower.includes('slack') || lower.includes('announcement');
  const hasTimeline = lower.includes('date') || lower.includes('deadline') || lower.match(/\b20\d{2}-\d{2}-\d{2}\b/);

  const gaps = [];
  if (!hasRapid) gaps.push('RAPID completeness missing. Assign Recommend/Agree/Perform/Input/Decide explicitly.');
  if (!hasChecklist) gaps.push('Go/No-Go criteria missing or non-binary. Add 8-10 measurable criteria.');
  if (!hasMeasure) gaps.push('Measurement plan missing. Define 7-day leading and 30-day lagging metrics plus abort triggers.');
  if (!hasComms) gaps.push('Communication coverage unclear. Add comms plan by audience and timing (48h pre-read for forums).');
  if (!hasTimeline) gaps.push('Timeline realism risk: no explicit deadline or dependencies mapped.');

  const strengths = [];
  if (hasTimeline) strengths.push('Timeline signals present.');
  if (hasComms) strengths.push('Comms considered.');
  if (hasMeasure) strengths.push('KPIs/measurement referenced.');

  const confidence = gaps.length <= 1 ? 'High' : gaps.length <= 3 ? 'Medium' : 'Low';

  return `
    <div class="output-card">
      <h4>Strengths</h4>
      <div class="output-list">
        ${(strengths.length ? strengths : ['No explicit strengths detected in demo heuristic.']).map(s => `<div class="li">${escapeHtml(s)}</div>`).join('')}
      </div>
    </div>
    <div class="output-card">
      <h4>Critical Gaps</h4>
      <div class="output-list">
        ${(gaps.length ? gaps : ['No critical gaps detected by demo heuristic.']).map(g => `<div class="li">${escapeHtml(g)}</div>`).join('')}
      </div>
    </div>
    <div class="output-card">
      <h4>Risks</h4>
      <div class="output-list">
        <div class="li">Readiness risk: advocates may lack consistent guidance, increasing escalations and QA variance.</div>
        <div class="li">Governance risk: decisions may be made without correct RAPID roles engaged.</div>
      </div>
    </div>
    <div class="output-card">
      <h4>Missing Artifacts</h4>
      <div class="output-list">
        <div class="li">Training brief (modality, timeline, prereqs, success criteria)</div>
        <div class="li">Go/No-Go checklist (8-10 binary criteria)</div>
        <div class="li">Measurement plan (7-day leading, 30-day lagging, abort triggers)</div>
        <div class="li">Stakeholder comms draft (Slack-ready)</div>
      </div>
    </div>
    <div class="output-card">
      <h4>Confidence</h4>
      <div class="text-secondary">${escapeHtml(confidence)} (demo)</div>
    </div>
  `;
}

function initQBR() {
  qs('#qbr-generate').onclick = () => {
    const quarter = qs('#qbr-quarter').value;
    const out = qs('#qbr-output');
    out.style.display = 'block';
    out.innerHTML = buildQbrDraft(quarter);
  };
}

function buildQbrDraft(quarter) {
  const active = initiatives.filter(i => i.lifecycle === 'Active');
  const measuring = initiatives.filter(i => i.lifecycle === 'In Measurement');
  const closed = initiatives.filter(i => i.lifecycle === 'Closed');

  const rows = initiatives.map(i => {
    const prog = calcInitiativeProgress(i);
    const lc = formatLifecycle(i.lifecycle).label;
    const kpi = i.kpiImpact ? Object.entries(i.kpiImpact).map(([k,v]) => `${k}: ${v}`).join(', ') : 'TBD';
    return `<tr>
      <td>${escapeHtml(i.id)}</td>
      <td>${escapeHtml(i.name)}</td>
      <td><span class="p-badge ${pClass(i.pLevel)}">${escapeHtml(i.pLevel)}</span></td>
      <td>${escapeHtml(lc)}</td>
      <td>${escapeHtml(i.deadline)}</td>
      <td>${prog}%</td>
      <td class="text-secondary">${escapeHtml(kpi)}</td>
    </tr>`;
  }).join('');

  return `
    <h2>Operational Readiness QBR Draft - ${escapeHtml(quarter)}</h2>

    <h3>Executive Summary</h3>
    <p>This draft is built from demo data. In production, it pulls initiative status from Jira and KPI results from Snowflake. Use this section to state the quarter’s readiness outcomes, risks managed, and what shipped.</p>
    <ul>
      <li><b>Active work:</b> ${active.length} initiatives in flight.</li>
      <li><b>In Measurement:</b> ${measuring.length} initiatives in 30-day KPI tracking.</li>
      <li><b>Closed:</b> ${closed.length} initiatives completed with artifacts archived.</li>
    </ul>

    <h3>Program Results Table</h3>
    <table class="table">
      <thead>
        <tr>
          <th>ID</th><th>Initiative</th><th>P</th><th>Lifecycle</th><th>Deadline</th><th>Progress</th><th>KPI impact</th>
        </tr>
      </thead>
      <tbody>
        ${rows}
      </tbody>
    </table>

    <h3>Start / Stop / Continue</h3>
    <ul>
      <li><b>Start:</b> enforce Go/No-Go checklists earlier for P0/P1 items.</li>
      <li><b>Stop:</b> shipping without explicit abort triggers and a documented escalation path.</li>
      <li><b>Continue:</b> microlearning + comprehension checks as default for policy and UX changes.</li>
    </ul>

    <h3>Forward Pipeline</h3>
    <p class="text-secondary">In production, this section is generated by querying Jira for upcoming epics and intake tickets, then grouping by LOB and P-level.</p>
  `;
}

function renderBragBoard() {
  const filter = qs('#brag-board .filter-btn.active')?.getAttribute('data-comp') || 'all';
  let items = [...wins];
  if (filter !== 'all') items = items.filter(w => w.comp === filter);

  const grid = qs('#brag-grid');
  grid.innerHTML = items.map(w => `
    <div class="win-card">
      <div class="flex justify-between items-center gap-12">
        <span class="comp-badge ${escapeHtml(w.comp)}">${escapeHtml(labelComp(w.comp))}</span>
        <span class="text-muted" style="font-size:0.8rem">${escapeHtml(w.date)}</span>
      </div>
      <div class="win-title">${escapeHtml(w.title)}</div>
      <div class="win-desc">${escapeHtml(w.desc)}</div>
      <div class="win-evidence">Evidence: ${escapeHtml(w.evidence)}</div>
    </div>
  `).join('');

  qsa('#brag-board .filter-btn').forEach(btn => {
    btn.onclick = () => {
      qsa('#brag-board .filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      renderAll('brag-board');
    };
  });

  qs('#brag-add').onclick = () => {
    const m = qs('#add-win-modal');
    m.style.display = 'flex';
  };

  qs('#win-save').onclick = () => {
    const title = qs('#win-title').value.trim();
    const desc = qs('#win-desc').value.trim();
    const comp = qs('#win-comp').value;
    const evidence = qs('#win-evidence').value.trim() || 'TBD';
    if (!title || !desc) return alert('Title and description required.');

    wins.unshift({ id: `win${Date.now()}`, title, desc, comp, evidence, date: new Date().toISOString().slice(0,10) });
    qs('#add-win-modal').style.display = 'none';
    qs('#win-title').value = '';
    qs('#win-desc').value = '';
    qs('#win-evidence').value = '';
    renderAll('brag-board');
  };

  qs('#brag-generate-review').onclick = () => {
    alert('Demo: would search for Block review template and synthesize wins with evidence links.');
  };
}

function labelComp(comp) {
  return {
    'data-acumen': 'Data Acumen',
    'strategic': 'Strategic Thinking',
    'cross-func': 'Cross-Functional Influence',
    'operational': 'Operational Execution',
    'communication': 'Communication',
    'drive-results': 'Drive Results'
  }[comp] || comp;
}

function renderDecisionLog() {
  const filter = qs('#decision-log .filter-btn.active')?.getAttribute('data-dtype') || 'all';
  let items = [...decisions];
  if (filter !== 'all') items = items.filter(d => d.type === filter);

  const list = qs('#decision-list');
  list.innerHTML = items.map(d => `
    <div class="decision-item">
      <div class="head">
        <div class="title">${escapeHtml(d.title)}</div>
        <span class="card-badge">${escapeHtml(d.type)}</span>
      </div>
      <div class="text-muted" style="margin-top:6px">Decided: ${escapeHtml(d.decidedAt)}</div>
      <div class="body">${escapeHtml(d.details)}</div>
    </div>
  `).join('');

  qsa('#decision-log .filter-btn').forEach(btn => {
    btn.onclick = () => {
      qsa('#decision-log .filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      renderAll('decision-log');
    };
  });

  qs('#decision-add').onclick = () => alert('Demo: add a decision with alternatives, tenet alignment, expected vs actual outcome.');

  // Patterns (demo)
  qs('#patterns-content').innerHTML = `
    <div class="text-secondary" style="line-height:1.45">
      Demo placeholder. In production, this analyzes decision outcomes over time (predicted vs actual) and surfaces recurring gaps.
      Example pattern: “Go/No-Go checklists are created late for P1 items; shift artifact creation earlier.”
    </div>
    <div class="mt-12"><button class="btn btn-secondary btn-sm" onclick="unsnoozeAll()"><i class=\"fas fa-rotate\"></i> Reset snoozed items</button></div>
  `;
}

function renderAll(panelId) {
  // Always render dependent panels since they share data
  const p = panelId || (qs('.panel.active')?.id);

  // Render on demand to avoid extra DOM churn
  if (!panelId || panelId === 'mission-control') renderMissionControl();
  if (!panelId || panelId === 'workstreams') renderWorkstreams();
  if (!panelId || panelId === 'comms-queue') renderCommsQueue();
  if (!panelId || panelId === 'collaborator-sentiment') renderCollaboratorSentiment();
  if (!panelId || panelId === 'worldview') renderWorldview();
  if (!panelId || panelId === 'ai-recommender') renderRecommender();
  if (!panelId || panelId === 'brag-board') renderBragBoard();
  if (!panelId || panelId === 'decision-log') renderDecisionLog();

  // Ensure intake/gap/qbr initializers are attached once
  if (!window.__init_done) {
    initIntake();
    initGapAnalysis();
    initQBR();
    window.__init_done = true;
  }

  // Update nav badges (demo)
  qs('#nav-badge-ws').textContent = `${initiatives.filter(i => i.lifecycle === 'Active').length}`;
  qs('#nav-badge-cq').textContent = `${comms.unreplied.filter(m => !store.snoozed.comms.has(m.id)).length}`;
  qs('#nav-badge-ai').textContent = `${recommendations.filter(r => !store.snoozed.recs.has(r.id)).length}`;
}
