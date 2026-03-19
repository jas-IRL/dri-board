// CS Readiness Playbook (private) - extracted from "CS Readiness Playbook.pdf" (2026-03-19)
// This file encodes playbook-driven defaults for the DRI Board.

window.DRI_PLAYBOOK = {
  title: 'CS Readiness Playbook',
  version: '2026-03-19',

  // Feature flags: keep the board aligned to *your* playbook.
  // RAPID is supported by the app/Jira mapping, but is not part of this playbook by default.
  features: {
    rapid: false,
  },

  tenets: [
    'We measure readiness by advocate performance, not deliverable completion; we will challenge our own work if outcomes don\'t match preparation. Completion rates and assessments are signals, not proof. If advocates struggle after launch, the preparation changes.',
    'Every change has a unique risk profile; readiness is not one-size-fits-all. We scale rigor to match impact—light touch for routine updates, full process for what matters. P-levels exist so we don\'t over-engineer small things or under-prepare big ones.',
    'We enable change as fast as the business invents it; but we will challenge any launch that ships unmanaged risk to the frontline. Readiness doesn\'t block—it makes tradeoffs visible. If a launch proceeds with gaps, those gaps are documented, owned, and mitigated.',
    'Signals from the field carry the same weight as planned roadmaps. An Ops lead flagging a pattern is as valid an intake as a product launch brief. The system doesn\'t distinguish how work enters—only whether advocates will be ready.',
    'We own requirements and outcomes; partners own delivery. Readiness defines what good looks like and whether it was achieved. L&D, Content, Quality, and Ops own how. Clear lines make collaboration sustainable—but we will surface any gap that falls between functions.',
    'Advocates are our customer. Every decision is tested against one question: will this help them serve customers better? If yes, find a way. If no, push back or deprioritize.'
  ],

  pLevels: {
    P0: {
      label: 'High regulatory, customer, or operational risk',
      rigor: 'Full readiness process and formal review',
      outputs: ['Readiness recommendation', 'Risk visibility', 'Launch review'],
    },
    P1: {
      label: 'Significant frontline or workflow impact',
      rigor: 'Structured discovery, planning, and assessment',
      outputs: ['Readiness recommendation', 'Risk visibility', 'Launch review'],
    },
    P2: {
      label: 'Moderate change with contained impact',
      rigor: 'Lightweight discovery and focused readiness support',
      outputs: ['Readiness plan', 'Targeted cross-functional execution'],
    },
    P3: {
      label: 'Low-risk routine update',
      rigor: 'Minimal coordination and monitoring as needed',
      outputs: ['Targeted enablement', 'Requirements alignment'],
    },
  },

  modes: [
    {
      name: 'Launch Readiness',
      usedFor: 'Product launches, feature rollouts, workflow changes, or partner transitions that materially change advocate execution.',
      readinessRole: [
        'Assess frontline impact',
        'Define readiness requirements',
        'Coordinate cross-functional preparation',
        'Provide a readiness recommendation before go-live',
        'Monitor T+7 and T+30 outcomes',
      ],
    },
    {
      name: 'Operational Change Readiness',
      usedFor: 'Policy updates, routing changes, staffing model adjustments, tooling changes, or process redesigns.',
      readinessRole: [
        'Validate advocate impact',
        'Identify support requirements',
        'Coordinate enablement, communications, and dependency closure',
        'Monitor early operational signals',
      ],
    },
    {
      name: 'Performance Intervention Readiness',
      usedFor: 'When performance signals suggest advocates are not prepared for existing work.',
      readinessRole: [
        'Diagnose likely readiness drivers',
        'Distinguish between knowledge, workflow, tooling, and support issues',
        'Define intervention requirements',
        'Measure post-intervention impact',
      ],
    },
    {
      name: 'Regulatory and Policy Readiness',
      usedFor: 'When compliance, legal, or regulatory changes alter advocate handling requirements.',
      readinessRole: [
        'Translate requirements into advocate-facing impact',
        'Coordinate required guidance, enablement, and acknowledgments',
        'Surface implementation risk',
        'Ensure monitoring is in place after deployment',
      ],
    },
    {
      name: 'Reactive Risk and Recovery Readiness',
      usedFor: 'When a change has already gone live and operational issues are emerging.',
      readinessRole: [
        'Assess frontline failure points',
        'Define immediate mitigation requirements',
        'Coordinate urgent support fixes',
        'Document learning for future changes',
      ],
    },
  ],

  readinessElements: [
    {
      name: 'Knowledge (Content)',
      key: 'knowledge',
      whatItCovers: 'Advocates have access to accurate, current, and findable guidance for the work they are expected to perform. This covers knowledge articles, quick tips, job aids, and any reference material advocates use during or between customer interactions.',
      readyWhen: 'Published guidance reflects the production state of the change, is findable in the CMS, and has a confirmed owner for post-launch maintenance.',
    },
    {
      name: 'Training (L&D)',
      key: 'training',
      whatItCovers: 'Advocates have been equipped with the skills, context, and practice needed to execute the change. This covers instructor-led sessions, eLearning, simulations, nesting support, and any structured learning tied to the initiative.',
      readyWhen: 'Training aligned to readiness requirements is complete (or scheduled with coverage tracked) before the change reaches production.',
    },
    {
      name: 'Tooling',
      key: 'tooling',
      whatItCovers: 'The tools, systems, and interfaces advocates use to execute the work are configured, tested, and functioning as expected. This covers CRM, internal platforms, telephony, routing, and any system the advocate touches during the workflow.',
      readyWhen: 'Tooling changes are deployed to the production environment with known limitations documented and downstream dependencies confirmed.',
    },
    {
      name: 'Quality',
      key: 'quality',
      whatItCovers: 'The quality framework reflects the change and can accurately evaluate advocate performance against the new expectation. This covers QA rubrics, calibration, evaluation criteria, and the signals Quality uses to assess execution.',
      readyWhen: 'Evaluation criteria reflect the new expectation, calibration is in place, and baseline data exists to measure post-launch movement.',
    },
    {
      name: 'Workforce',
      key: 'workforce',
      whatItCovers: 'Staffing, scheduling, and capacity planning account for the change. This covers training time allocation, ramp periods, volume shifts, and any scheduling adjustments needed to support the transition.',
      readyWhen: 'Training windows, volume impact, and any routing or ramp changes are reflected in workforce plans without unmanaged service level risk.',
    },
    {
      name: 'Vendor Management / BPO',
      key: 'bpo',
      whatItCovers: 'External partner populations are included in readiness planning with the same rigor as internal teams. This covers BPO training alignment, communication cadence, access provisioning, and any vendor-specific constraints that affect execution.',
      readyWhen: 'BPO populations are scoped into the readiness plan from discovery, with timelines that account for vendor lead times and constraints.',
    },
    {
      name: 'Operations',
      key: 'operations',
      whatItCovers: 'Operational leaders and frontline management are prepared to support execution in production. This covers team leads, supervisors, SMEs, escalation contacts, and the operational structures advocates rely on when they encounter issues.',
      readyWhen: 'Frontline leadership understands the change, escalation paths are defined, and real-time support is planned proportional to launch risk.',
    },
    {
      name: 'Communications (Content)',
      key: 'comms',
      whatItCovers: 'The right people receive the right information at the right time through the right channel. This covers advocate-facing announcements, leadership briefings, partner notifications, and any structured messaging that supports awareness and alignment.',
      readyWhen: 'Advocates and support tiers know what is changing, when, and what they need to do differently, delivered through the right channel at the right time.',
    },
    {
      name: 'Operational Readiness',
      key: 'or',
      whatItCovers: 'The cross-functional readiness process itself has been executed with appropriate rigor. This is the self-assessment of the OR function: whether discovery was thorough, requirements were clear, coordination was effective, and the recommendation reflects the true state of preparation.',
      readyWhen: 'Discovery scoped the full frontline impact, requirements were documented with owners, and the readiness recommendation honestly reflects preparation status and residual risk.',
    },
    {
      name: 'Compliance / Regulatory',
      key: 'compliance',
      whatItCovers: 'Regulatory, legal, and compliance requirements are translated into frontline handling expectations and operationalized before go-live. This covers mandated disclosures, handling procedures, acknowledgment requirements, and audit readiness.',
      readyWhen: 'Compliance requirements are operationalized into specific advocate actions with acknowledgments tracked and monitoring defined.',
    },
    {
      name: 'Data / Measurement',
      key: 'measurement',
      whatItCovers: 'The data infrastructure and success criteria needed to evaluate whether the change landed are defined before launch. This covers KPIs, dashboards, reporting alignment, and the signals Readiness and partners will use to assess outcomes at T+7 and T+30.',
      readyWhen: 'Success metrics are defined, baselines are captured, and reporting reflects the new state before the change goes live.',
    },
  ],
};
