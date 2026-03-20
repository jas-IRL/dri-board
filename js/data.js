/*
  DRI Board - Mock Data
  NOTE: This is synthetic demo data. Replace with Jira/Glean/Snowflake integrations.
*/

const DATA_VERSION = '0.1.0';

const store = {
  snoozed: {
    recs: new Set(JSON.parse(localStorage.getItem('snoozed_recs') || '[]')),
    comms: new Set(JSON.parse(localStorage.getItem('snoozed_comms') || '[]')),
    worldview: new Set(JSON.parse(localStorage.getItem('snoozed_worldview') || '[]')),
  }
};

function persistSnoozes() {
  localStorage.setItem('snoozed_recs', JSON.stringify([...store.snoozed.recs]));
  localStorage.setItem('snoozed_comms', JSON.stringify([...store.snoozed.comms]));
  localStorage.setItem('snoozed_worldview', JSON.stringify([...store.snoozed.worldview]));
}

let initiatives = [
  {
    id: 'OR-2412',
    name: 'Disputes: Evidence Upload UX Change',
    pLevel: 'P1',
    lifecycle: 'Active',
    deadline: '2026-03-28',
    description: 'Update advocate readiness for new evidence upload flow. Requires comms, training delta, and go/no-go criteria.',
    rapid: { recommend: 'Product Ops', agree: 'Quality', perform: 'L&D + Content Ops', input: 'BPO Ops', decide: 'Strategy Lead' },
    artifacts: [
      { type: 'Training Brief', link: '#', status: 'Draft' },
      { type: 'Go/No-Go', link: '#', status: 'Missing' },
      { type: 'Comms Draft', link: '#', status: 'Draft' },
    ],
    kpiImpact: null,
    checklist: [
      { id: 'c1', text: 'Confirm P-level label on Jira epic', done: true, due: '2026-03-18' },
      { id: 'c2', text: 'RAPID assignments confirmed in Jira', done: false, due: '2026-03-18' },
      { id: 'c3', text: 'Training delta doc approved by L&D', done: false, due: '2026-03-22' },
      { id: 'c4', text: 'BPO translation request submitted', done: true, due: '2026-03-20' },
      { id: 'c5', text: 'Go/No-Go checklist drafted (8-10 criteria)', done: false, due: '2026-03-23' },
    ]
  },
  {
    id: 'OR-2399',
    name: 'Banking: Savings Rate Tier Update',
    pLevel: 'P0',
    lifecycle: 'Active',
    deadline: '2026-03-21',
    description: 'Advocate readiness for Savings rate tier change and customer comms alignment.',
    rapid: { recommend: 'PM', agree: 'Legal', perform: 'Content Ops', input: 'Support Ops', decide: 'Strategy Lead' },
    artifacts: [
      { type: 'Stakeholder Map', link: '#', status: 'Complete' },
      { type: 'Training Brief', link: '#', status: 'Complete' },
      { type: 'Measurement Plan', link: '#', status: 'Draft' },
    ],
    kpiImpact: null,
    checklist: [
      { id: 'c1', text: 'Confirm launch date with Product and Marketing', done: true, due: '2026-03-15' },
      { id: 'c2', text: 'Finalize customer-facing FAQ alignment', done: false, due: '2026-03-18' },
      { id: 'c3', text: 'Deliver training to BPO sites', done: false, due: '2026-03-19' },
      { id: 'c4', text: 'Pre-read sent 48h before forum', done: false, due: '2026-03-17' },
    ]
  },
  {
    id: 'OR-2333',
    name: 'Quality Rubric Refresh: Fraud LOB',
    pLevel: 'P2',
    lifecycle: 'In Measurement',
    deadline: '2026-03-05',
    description: 'Shipped rubric update; tracking 30-day KPI movement and advocate comprehension.',
    rapid: { recommend: 'Quality', agree: 'Support Ops', perform: 'Quality', input: 'BPO Ops', decide: 'Strategy Lead' },
    artifacts: [
      { type: 'Rubric v3', link: '#', status: 'Complete' },
      { type: 'Training Completion Report', link: '#', status: 'Complete' },
    ],
    kpiImpact: { fcr: '+1.2pp', csat: '+0.3', qa: '+2.1pp' },
    checklist: [
      { id: 'c1', text: '7-day leading indicators reviewed', done: true, due: '2026-02-20' },
      { id: 'c2', text: '30-day lagging window ends', done: false, due: '2026-03-22' },
    ]
  },
  {
    id: 'OR-2404',
    name: 'Content Ops: Macro Deprecation Cleanup',
    pLevel: 'P3',
    lifecycle: 'Active',
    deadline: '2026-04-10',
    description: 'Retire outdated macros and refresh internal KB entries. Ensure no coverage gaps.',
    rapid: { recommend: 'Content Ops', agree: 'Quality', perform: 'Content Ops', input: 'BPO Leads', decide: 'Strategy Lead' },
    artifacts: [
      { type: 'KB Audit', link: '#', status: 'Draft' },
    ],
    kpiImpact: null,
    checklist: [
      { id: 'c1', text: 'Identify deprecated macros list', done: true, due: '2026-03-12' },
      { id: 'c2', text: 'Validate coverage with QA calibrations', done: false, due: '2026-03-25' },
      { id: 'c3', text: 'Publish updated KB and retire macros', done: false, due: '2026-04-05' },
    ]
  },
  {
    id: 'OR-2290',
    name: 'Advocate Ramp: New Hire Path v2',
    pLevel: 'P2',
    lifecycle: 'Closed',
    deadline: '2026-02-01',
    description: 'Closed: updated ramp curriculum and assessment flow.',
    rapid: { recommend: 'L&D', agree: 'Support Ops', perform: 'L&D', input: 'BPO Ops', decide: 'Strategy Lead' },
    artifacts: [],
    kpiImpact: { rampTime: '-3.5 days', qa: '+1.0pp' },
    checklist: []
  },
];

const actionsDueToday = [
  { id: 'a1', title: 'Send pre-read for Readiness Governance forum', sub: 'Due today 3:00 PM', pLevel: 'P0', initiativeId: 'OR-2399' },
  { id: 'a2', title: 'Confirm RAPID in Jira for Disputes change', sub: 'Awaiting inputs', pLevel: 'P1', initiativeId: 'OR-2412' },
  { id: 'a3', title: 'Draft Go/No-Go checklist (8-10 criteria)', sub: 'Attach to OR-2412', pLevel: 'P1', initiativeId: 'OR-2412' },
];

const comms = {
  unreplied: [
    { id: 'm1', sender: 'BPO Ops Lead', channel: '#support-disputes', ts: 'Today 9:14 AM', preview: 'Do we have the final customer-facing guidance for evidence upload yet?', initiativeId: 'OR-2412', urgency: 'High' },
    { id: 'm2', sender: 'Quality Manager', channel: '#qa-calibration', ts: 'Today 8:31 AM', preview: 'Need your agree on the updated exception handling language before EOD.', initiativeId: 'OR-2399', urgency: 'High' },
    { id: 'm3', sender: 'Content Partner', channel: '#content-ops', ts: 'Yesterday 6:05 PM', preview: 'Can you confirm which macros are safe to deprecate this sprint?', initiativeId: 'OR-2404', urgency: 'Medium' },
    { id: 'm4', sender: 'PM', channel: '#banking-product', ts: 'Yesterday 5:20 PM', preview: 'Marketing asked whether this rate tier change impacts disclosures.', initiativeId: 'OR-2399', urgency: 'High' },
    { id: 'm5', sender: 'Training Lead', channel: '#ld', ts: 'Yesterday 2:10 PM', preview: 'We need success criteria for the training module. Can you define them?', initiativeId: 'OR-2412', urgency: 'Medium' },
  ],
  openThreads: [
    { id: 't1', sender: 'Support Ops', channel: '#support-ops', ts: 'Today 10:02 AM', newCount: 4, summary: 'Team aligned on moving the deadline up by 2 days. Open question: who owns the final comms sign-off.', initiativeId: 'OR-2399', decisionMade: true },
    { id: 't2', sender: 'Quality', channel: '#qa-calibration', ts: 'Today 9:40 AM', newCount: 2, summary: 'New QA scoring nuance proposed for edge cases. Needs Decide confirmation before rollout.', initiativeId: 'OR-2333', decisionMade: false },
    { id: 't3', sender: 'BPO Lead', channel: '#bpo-manila', ts: 'Yesterday 4:55 PM', newCount: 1, summary: 'Translation capacity constraint flagged. Proposed a split delivery for training assets.', initiativeId: 'OR-2412', decisionMade: false },
  ],
  proactive: [
    { id: 'p1', confidence: 'HIGH', signal: 'RAPID violation', talkingPoint: 'You hold Decide. Ask for options and confirm decision deadline.', channel: '#support-ops', ts: 'Today 9:58 AM', initiativeId: 'OR-2399', preview: 'Thread discussing go/no-go criteria without Decide role included.' },
    { id: 'p2', confidence: 'MEDIUM-HIGH', signal: 'Scope intersection', talkingPoint: 'Offer a readiness checklist and training modality recommendation.', channel: '#banking-product', ts: 'Yesterday 3:12 PM', initiativeId: 'OR-2399', preview: 'Thread about launch comms sequencing and advocate enablement timing.' },
    { id: 'p3', confidence: 'MEDIUM', signal: 'Question-answer match', talkingPoint: 'Answer with required artifacts and measurement plan baseline.', channel: '#support-disputes', ts: 'Yesterday 1:30 PM', initiativeId: 'OR-2412', preview: 'Question: what artifacts are mandatory for a P1 change?' },
    { id: 'p4', confidence: 'LOW', signal: 'Stakeholder signal', talkingPoint: 'FYI only: monitored collaborator engaged; no action needed unless asked.', channel: '#content-ops', ts: 'Yesterday 11:05 AM', initiativeId: 'OR-2404', preview: 'Content partner discussing macro cleanup scheduling.' },
  ]
};

let collaborators = [
  {
    id: 'col1', tier: { org: 'Content Operations', role: 'Content Partner', individual: 'Content Partner (LND-1638)' },
    state: 'Cooling',
    composite: 3.1,
    dims: { responsiveness: 2.8, engagement: 3.0, proactivity: 2.9, reliability: 3.5, tone: 3.2 },
    recommendation: 'Send a concrete ask with a tight decision window and attach the latest draft for async review.'
  },
  {
    id: 'col2', tier: { org: 'BPO', role: 'BPO Ops Lead (Disputes)', individual: 'BPO Ops Lead (Disputes)' },
    state: 'Drifting',
    composite: 2.3,
    dims: { responsiveness: 2.0, engagement: 2.4, proactivity: 2.1, reliability: 2.6, tone: 2.5 },
    recommendation: 'Offer a fast unblock: confirm what you need from them and propose a 15-minute alignment slot.'
  },
  {
    id: 'col3', tier: { org: 'Quality', role: 'Quality Manager', individual: 'Quality Manager' },
    state: 'Stable',
    composite: 4.1,
    dims: { responsiveness: 4.2, engagement: 4.0, proactivity: 3.9, reliability: 4.4, tone: 4.1 },
    recommendation: null
  },
  {
    id: 'col4', tier: { org: 'Product', role: 'PM', individual: 'PM' },
    state: 'Strong',
    composite: 4.6,
    dims: { responsiveness: 4.7, engagement: 4.6, proactivity: 4.5, reliability: 4.6, tone: 4.6 },
    recommendation: null
  },
  {
    id: 'col5', tier: { org: 'L&D', role: 'Training Lead', individual: 'Training Lead' },
    state: 'Stable',
    composite: 3.9,
    dims: { responsiveness: 3.8, engagement: 4.0, proactivity: 3.7, reliability: 4.1, tone: 3.9 },
    recommendation: null
  },
];

const worldviewItems = [
  {
    id: 'w1', type: 'Competitive', title: 'Competitor expands instant dispute resolution experience',
    summary: 'Multiple fintech peers are reducing dispute handling time by shifting evidence collection earlier in the flow and adding in-app status tracking.',
    relevance: 'OR-2412', soWhat: 'Ensure advocate macros and scripts reflect new customer expectations around status transparency and timelines.'
  },
  {
    id: 'w2', type: 'Regulatory', title: 'CFPB signals increased scrutiny on complaint handling timelines',
    summary: 'Recent public statements indicate closer monitoring of complaint handling and dispute resolution practices, especially around clarity and timeliness.',
    relevance: 'OR-2412', soWhat: 'Add explicit timeline language to training and go/no-go criteria; validate legal review is captured in RAPID.'
  },
  {
    id: 'w3', type: 'Innovation', title: 'Contact centers adopting AI for guided workflows rather than free-form answers',
    summary: 'Industry trend favors structured decision trees integrated into tooling to reduce variance and improve QA outcomes.',
    relevance: 'OR-2404', soWhat: 'Use the macro cleanup to rationalize guided flows: remove duplicates, standardize decision points, and align to QA rubric.'
  },
  {
    id: 'w4', type: 'Trends', title: 'Training programs emphasize microlearning with measurable comprehension checks',
    summary: 'Short modules with targeted assessments outperform long sessions, especially for policy changes with high error cost.',
    relevance: 'OR-2399', soWhat: 'Convert rate-tier updates into a 10-minute microlearning plus 5-question check; set abort triggers if scores drop.'
  }
];

const recommendations = [
  {
    id: 'r1', title: 'Draft Go/No-Go checklist for OR-2412',
    whyNow: 'Deadline proximity + missing required artifact',
    tenet: 'Artifact completeness for P1 changes',
    effort: '20-30 min with AI assist',
    initiativeId: 'OR-2412'
  },
  {
    id: 'r2', title: 'Send pre-read for governance forum',
    whyNow: 'Meeting approaching without pre-read',
    tenet: 'No surprises in governance',
    effort: '10 min',
    initiativeId: 'OR-2399'
  },
  {
    id: 'r3', title: 'Intervene with drifting collaborator (BPO Ops Lead - Disputes)',
    whyNow: 'Sentiment drifting 7+ days',
    tenet: 'Escalate early, unblock fast',
    effort: '5-10 min',
    initiativeId: 'OR-2412'
  },
  {
    id: 'r4', title: 'Add measurement abort triggers for Savings rate tier update',
    whyNow: 'P0 change missing clear abort triggers',
    tenet: 'Measurement plan required for launch-risk items',
    effort: '15-20 min',
    initiativeId: 'OR-2399'
  },
];

let wins = [
  {
    id: 'win1', title: 'Closed New Hire Path v2 with ramp time reduction',
    desc: 'Delivered ramp curriculum refresh and assessment flow updates. Documented impact and archived artifacts.',
    comp: 'drive-results', evidence: 'Jira: OR-2290', date: '2026-02-02'
  },
  {
    id: 'win2', title: 'Quality rubric refresh shipped with QA lift',
    desc: 'Aligned rubric v3, ran calibrations, and monitored early KPI signals in measurement window.',
    comp: 'data-acumen', evidence: 'Jira: OR-2333', date: '2026-03-01'
  }
];

let decisions = [
  {
    id: 'd1', type: 'p-level', title: 'Classified Savings rate tier update as P0',
    decidedAt: '2026-03-10',
    details: 'Rationale: customer-impacting financial change with marketing push. Required accelerated training and comms coverage. Tenet: match urgency to P-level.'
  },
  {
    id: 'd2', type: 'resource', title: 'Allocated Content Ops capacity to macro cleanup after launch tasks',
    decidedAt: '2026-03-08',
    details: 'Tradeoff: reduced throughput on cleanup to avoid launch risk. Expected outcome: no readiness gaps for P0/P1 items.'
  }
];

function daysUntil(dateStr) {
  const now = new Date();
  const d = new Date(dateStr + 'T00:00:00');
  const ms = d - new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.ceil(ms / (1000 * 60 * 60 * 24));
}

function pWeight(p) {
  if (p === 'P0') return 3;
  if (p === 'P1') return 2;
  if (p === 'P2') return 1.5;
  return 1;
}

function calcInitiativeProgress(init) {
  if (!init.checklist || init.checklist.length === 0) return 0;
  const done = init.checklist.filter(c => c.done).length;
  return Math.round((done / init.checklist.length) * 100);
}

function calcOverallReadiness(activeOnly = true) {
  const items = initiatives.filter(i => (activeOnly ? (i.lifecycle === 'Active') : true));
  let totalW = 0;
  let sum = 0;
  for (const i of items) {
    const w = pWeight(i.pLevel);
    const prog = calcInitiativeProgress(i);
    totalW += w;
    sum += prog * w;
  }
  if (!totalW) return 0;
  return Math.round(sum / totalW);
}

// =============================
// Live Bridge Mode (local backend)
// =============================

window.DRI_LIVE = {
  enabled: false,
  apiBase: ''
};

async function bootstrapLiveData() {
  const apiBase = (window.DRI_CONFIG && window.DRI_CONFIG.API_BASE) ? window.DRI_CONFIG.API_BASE : '';
  if (!apiBase) return;

  window.DRI_LIVE.enabled = true;
  window.DRI_LIVE.apiBase = apiBase;

  await Promise.allSettled([
    loadLiveInitiatives(),
    loadLiveDecisions(),
    loadLiveWins(),
  ]);
}

function _bridgeRapid(i) {
  return {
    recommend: i.rapid_recommend || 'TBD',
    agree: i.rapid_agree || 'TBD',
    perform: i.rapid_perform || 'TBD',
    input: i.rapid_input || 'TBD',
    decide: i.rapid_decide || 'TBD',
  };
}

function _bridgeChecklist(i) {
  const els = Array.isArray(i.readiness_elements) ? i.readiness_elements : [];
  return els.map(e => ({
    id: `el-${e.id}`,
    text: `${e.readiness_element}${e.what_needs_to_happen ? `: ${e.what_needs_to_happen}` : ''}`,
    done: e.status === 'Complete',
    due: e.due_date || i.deadline || '',
    __elementId: e.id,
  }));
}

async function loadLiveInitiatives() {
  const apiBase = window.DRI_LIVE.apiBase;
  const res = await fetch(`${apiBase}/api/initiatives`);
  if (!res.ok) throw new Error('Failed to load initiatives');
  const json = await res.json();
  const items = Array.isArray(json.items) ? json.items : [];

  // overwrite global initiatives with a shape the UI expects
  initiatives = items.map(i => ({
    id: i.jira_key || i.id,
    backendId: i.id,
    name: i.title,
    pLevel: i.p_level,
    lifecycle: i.lifecycle,
    deadline: i.deadline || '',
    description: i.description || '',
    rapid: _bridgeRapid(i),
    artifacts: [],
    kpiImpact: null,
    checklist: _bridgeChecklist(i),
  }));
}

async function loadLiveDecisions() {
  const apiBase = window.DRI_LIVE.apiBase;
  const res = await fetch(`${apiBase}/api/decisions`);
  if (!res.ok) return;
  const json = await res.json();
  const items = Array.isArray(json.items) ? json.items : [];
  decisions = items.map(d => ({
    id: d.id,
    type: d.decision_type || 'all',
    title: d.title,
    decidedAt: (d.decided_at || d.created_at || '').slice(0, 10),
    details: d.details || '',
    initiative_id: d.initiative_id || null,
    tenet_alignment: d.tenet_alignment || null,
    expected_outcome: d.expected_outcome || null,
    actual_outcome: d.actual_outcome || null,
  }));
}

async function loadLiveWins() {
  const apiBase = window.DRI_LIVE.apiBase;
  const res = await fetch(`${apiBase}/api/wins`);
  if (!res.ok) return;
  const json = await res.json();
  const items = Array.isArray(json.items) ? json.items : [];
  wins = items.map(w => ({
    id: w.id,
    title: w.title,
    desc: w.desc,
    comp: w.competency || 'drive-results',
    evidence: w.evidence || 'TBD',
    date: (w.occurred_at || w.created_at || '').slice(0, 10),
  }));
}
