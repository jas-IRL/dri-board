/*
  Mock data only.
  This app is UI scaffolding for a DRI Board command center.
  Replace these objects with live integrations to Jira/Slack/Glean/Snowflake.
*/

(function () {
  const today = new Date();
  const iso = (d) => new Date(d).toISOString().slice(0, 10);
  const addDays = (n) => {
    const d = new Date(today);
    d.setDate(d.getDate() + n);
    return d;
  };

  window.DRI_DATA = {
    meta: {
      generatedAt: new Date().toISOString(),
      disclaimer: "Demo data only. No internal data is loaded."
    },

    initiatives: [
      {
        id: "DEMO-101",
        name: "Disputes Intake Form Refresh",
        pLevel: "P1",
        lifecycle: "Active",
        deadline: iso(addDays(9)),
        description: "Refresh advocate-facing intake form to reduce missing info and decrease back-and-forth.",
        progress: 62,
        checklist: [
          { id: "c1", text: "Confirm scope + requirements with Product", done: true, due: iso(addDays(2)) },
          { id: "c2", text: "RAPID assignments confirmed", done: true, due: iso(addDays(1)) },
          { id: "c3", text: "Training brief drafted (per playbook)", done: false, due: iso(addDays(3)) },
          { id: "c4", text: "Comms draft ready for stakeholder review", done: false, due: iso(addDays(4)) },
          { id: "c5", text: "Go/No-Go criteria agreed", done: false, due: iso(addDays(6)) }
        ],
        rapid: {
          Recommend: "TBD",
          Agree: "TBD",
          Perform: "TBD",
          Input: "TBD",
          Decide: "TBD"
        },
        artifacts: [
          { name: "Initiative brief", href: "#" },
          { name: "Training brief", href: "#" },
          { name: "Go/No-Go checklist", href: "#" }
        ],
        risks: [
          { level: "High", text: "Training brief is missing while deadline is within 10 days." },
          { level: "Medium", text: "Go/No-Go criteria not aligned with measurable readiness gates." }
        ],
        kpiImpact: null
      },
      {
        id: "DEMO-204",
        name: "Chargeback Policy Copy Update",
        pLevel: "P2",
        lifecycle: "Active",
        deadline: iso(addDays(16)),
        description: "Update knowledge base copy and macros for new chargeback wording.",
        progress: 38,
        checklist: [
          { id: "c1", text: "KB article draft updated", done: true, due: iso(addDays(3)) },
          { id: "c2", text: "QA review complete", done: false, due: iso(addDays(7)) },
          { id: "c3", text: "BPO translation request submitted", done: false, due: iso(addDays(6)) },
          { id: "c4", text: "Training modality confirmed", done: false, due: iso(addDays(8)) }
        ],
        rapid: {
          Recommend: "TBD",
          Agree: "TBD",
          Perform: "TBD",
          Input: "TBD",
          Decide: "TBD"
        },
        artifacts: [{ name: "KB draft", href: "#" }],
        risks: [{ level: "Medium", text: "Translation dependency could compress rollout window." }],
        kpiImpact: null
      },
      {
        id: "DEMO-330",
        name: "New Escalation Path for Account Takeover",
        pLevel: "P0",
        lifecycle: "In Measurement",
        deadline: iso(addDays(-4)),
        description: "Launched new escalation routing for ATO to reduce time-to-containment.",
        progress: 100,
        checklist: [
          { id: "c1", text: "Enablement session delivered", done: true, due: iso(addDays(-12)) },
          { id: "c2", text: "Go/No-Go met", done: true, due: iso(addDays(-6)) },
          { id: "c3", text: "30-day measurement plan started", done: true, due: iso(addDays(-4)) }
        ],
        rapid: {
          Recommend: "TBD",
          Agree: "TBD",
          Perform: "TBD",
          Input: "TBD",
          Decide: "TBD"
        },
        artifacts: [
          { name: "Go/No-Go record", href: "#" },
          { name: "Training deck", href: "#" }
        ],
        risks: [{ level: "Low", text: "Monitor exception handling for edge cases." }],
        kpiImpact: {
          note: "Demo placeholder. Connect Snowflake to populate FCR/CSAT/AHT/QA trends.",
          metrics: [
            { name: "AHT", value: "-3%", period: "7d post" },
            { name: "FCR", value: "+1.2 pts", period: "7d post" }
          ]
        }
      },
      {
        id: "DEMO-412",
        name: "Advocate Onboarding Module Refresh",
        pLevel: "P3",
        lifecycle: "Active",
        deadline: iso(addDays(28)),
        description: "Refresh L&D onboarding module to align to current tooling and policy.",
        progress: 22,
        checklist: [
          { id: "c1", text: "Stakeholder map validated", done: true, due: iso(addDays(4)) },
          { id: "c2", text: "Content outline complete", done: false, due: iso(addDays(10)) },
          { id: "c3", text: "Comprehension assessment drafted", done: false, due: iso(addDays(14)) },
          { id: "c4", text: "Pilot cohort scheduled", done: false, due: iso(addDays(18)) }
        ],
        rapid: {
          Recommend: "TBD",
          Agree: "TBD",
          Perform: "TBD",
          Input: "TBD",
          Decide: "TBD"
        },
        artifacts: [{ name: "Module plan", href: "#" }],
        risks: [{ level: "Medium", text: "Pilot date not locked. Calendar dependency." }],
        kpiImpact: null
      },
      {
        id: "DEMO-090",
        name: "Legacy Macro Cleanup",
        pLevel: "P3",
        lifecycle: "Closed",
        deadline: iso(addDays(-40)),
        description: "Removed outdated macros and aligned tags.",
        progress: 100,
        checklist: [
          { id: "c1", text: "Deprecated macros removed", done: true, due: iso(addDays(-50)) },
          { id: "c2", text: "Advocate comms sent", done: true, due: iso(addDays(-48)) }
        ],
        rapid: { Recommend: "TBD", Agree: "TBD", Perform: "TBD", Input: "TBD", Decide: "TBD" },
        artifacts: [{ name: "Change log", href: "#" }],
        risks: [],
        kpiImpact: null
      }
    ],

    comms: {
      unreplied: [
        {
          id: "t-1",
          sender: "(Demo) Content Ops Partner",
          channel: "#readiness",
          timestamp: "Today 9:12am",
          preview: "Can you confirm whether DEMO-101 needs a formal go/no-go doc or a lightweight checklist?",
          initiativeId: "DEMO-101",
          urgency: "High"
        },
        {
          id: "t-2",
          sender: "(Demo) BPO Ops Lead",
          channel: "#bpo-ops",
          timestamp: "Today 10:03am",
          preview: "We need the translation request for DEMO-204 by EOD to hit training timelines.",
          initiativeId: "DEMO-204",
          urgency: "High"
        },
        {
          id: "t-3",
          sender: "(Demo) Product Manager",
          channel: "#product",
          timestamp: "Yesterday 4:22pm",
          preview: "RAPID roles are unclear for the escalation change follow-ups. Who is Decide?",
          initiativeId: "DEMO-330",
          urgency: "Medium"
        },
        {
          id: "t-4",
          sender: "(Demo) Quality Lead",
          channel: "#quality",
          timestamp: "Yesterday 2:11pm",
          preview: "Any expected KPI movement for ATO escalations so we can set QA focus areas?",
          initiativeId: "DEMO-330",
          urgency: "Medium"
        },
        {
          id: "t-5",
          sender: "(Demo) L&D Program Manager",
          channel: "#learning",
          timestamp: "Monday 1:17pm",
          preview: "For DEMO-412, do you want a pilot cohort or straight rollout to all new hires?",
          initiativeId: "DEMO-412",
          urgency: "Low"
        }
      ],
      openThreads: [
        {
          id: "ot-1",
          channel: "#readiness",
          timestamp: "Today 8:35am",
          newCount: 6,
          summary: "Thread continued with questions about enablement ownership and whether a comms draft exists. Two people suggested moving deadline forward.",
          initiativeId: "DEMO-101"
        },
        {
          id: "ot-2",
          channel: "#bpo-ops",
          timestamp: "Yesterday 6:10pm",
          newCount: 3,
          summary: "Ops asked for translation timelines and requested a single point of contact for approvals. No decision yet.",
          initiativeId: "DEMO-204"
        },
        {
          id: "ot-3",
          channel: "#quality",
          timestamp: "Yesterday 12:05pm",
          newCount: 2,
          summary: "QA discussed new failure modes to monitor and asked for a short measurement plan. Someone proposed 7-day leading indicators.",
          initiativeId: "DEMO-330"
        }
      ],
      proactive: [
        {
          id: "p-1",
          channel: "#product",
          timestamp: "Today 9:48am",
          confidence: "High",
          signal: "RAPID violation",
          talkingPoint: "I can confirm RAPID and lock Decide/Agree today so delivery is unblocked.",
          initiativeId: "DEMO-101",
          context: "Decision being discussed without the readiness DRI included."
        },
        {
          id: "p-2",
          channel: "#bpo-ops",
          timestamp: "Today 10:22am",
          confidence: "Medium-High",
          signal: "Scope intersection",
          talkingPoint: "I will draft the training brief and translation request today and attach it to the Jira ticket.",
          initiativeId: "DEMO-204",
          context: "Readiness/training timeline risk for BPO sites."
        },
        {
          id: "p-3",
          channel: "#quality",
          timestamp: "Yesterday 3:19pm",
          confidence: "Medium",
          signal: "Question-answer match",
          talkingPoint: "We should align QA focus to the top 3 new error states and define abort triggers for measurement.",
          initiativeId: "DEMO-330",
          context: "QA planning question in readiness domain."
        },
        {
          id: "p-4",
          channel: "#learning",
          timestamp: "Monday 11:10am",
          confidence: "Low",
          signal: "Stakeholder signal",
          talkingPoint: "If helpful, I can propose a pilot plan with success criteria and a rollout gate.",
          initiativeId: "DEMO-412",
          context: "Collaborator engagement detected in relevant topic."
        }
      ]
    },

    collaborators: [
      {
        id: "col-1",
        tierOrg: "Content Operations",
        tierRole: "Content Partner",
        name: "(Demo) Content Partner",
        state: "Cooling",
        composite: 3.1,
        dims: {
          Responsiveness: 2.9,
          EngagementDepth: 3.0,
          Proactivity: 3.2,
          Reliability: 3.4,
          ToneAlignment: 3.1
        },
        action: "Send a concrete ask with a deadline and attach the draft artifact for fast review. Offer two options to choose from."
      },
      {
        id: "col-2",
        tierOrg: "BPO Partners",
        tierRole: "BPO Ops Lead",
        name: "(Demo) BPO Ops Lead",
        state: "Drifting",
        composite: 2.3,
        dims: {
          Responsiveness: 2.2,
          EngagementDepth: 2.4,
          Proactivity: 2.1,
          Reliability: 2.6,
          ToneAlignment: 2.4
        },
        action: "Provide a single page timeline (dates, owners, decisions needed). Ask for their top 2 constraints and confirm the approval path."
      },
      {
        id: "col-3",
        tierOrg: "Quality",
        tierRole: "Quality Lead",
        name: "(Demo) Quality Lead",
        state: "Stable",
        composite: 4.0,
        dims: {
          Responsiveness: 4.1,
          EngagementDepth: 3.8,
          Proactivity: 3.9,
          Reliability: 4.2,
          ToneAlignment: 4.0
        },
        action: "Keep looped in via a short weekly update that ties readiness work to measurement outcomes."
      },
      {
        id: "col-4",
        tierOrg: "L&D",
        tierRole: "L&D Program Manager",
        name: "(Demo) L&D Program Manager",
        state: "Strong",
        composite: 4.7,
        dims: {
          Responsiveness: 4.8,
          EngagementDepth: 4.6,
          Proactivity: 4.7,
          Reliability: 4.7,
          ToneAlignment: 4.8
        },
        action: "Delegate content production and align on pilot success criteria early."
      }
    ],

    worldview: [
      {
        id: "wv-1",
        type: "Regulatory",
        title: "Demo: Regulatory monitoring item",
        summary: "Placeholder for external updates. Wire this to a web search feed and tag to relevant initiatives.",
        relevance: "DEMO-330",
        soWhat: "If new guidance affects escalation or dispute handling, update enablement and QA focus before measurement window ends."
      },
      {
        id: "wv-2",
        type: "Competitive",
        title: "Demo: Competitor CX move",
        summary: "Placeholder for competitive intelligence and how it may shift customer expectations.",
        relevance: "DEMO-101",
        soWhat: "If competitors simplify dispute intake, prioritize clarity and reduce customer effort in the new form design."
      },
      {
        id: "wv-3",
        type: "Innovation",
        title: "Demo: Contact center automation trend",
        summary: "Placeholder for AI automation signals and operational implications.",
        relevance: "DEMO-204",
        soWhat: "If macros/KB can be auto-suggested, ensure updated policy copy is consistent to avoid model drift."
      },
      {
        id: "wv-4",
        type: "Trends",
        title: "Demo: Industry metric benchmarking",
        summary: "Placeholder for industry KPI trend or benchmark.",
        relevance: "DEMO-412",
        soWhat: "Align onboarding comprehension checks to the behaviors that predict early advocate success."
      }
    ],

    recommender: [
      {
        id: "rec-1",
        title: "Training brief missing for DEMO-101",
        whyNow: "Deadline within 10 days and checklist shows training brief incomplete.",
        effort: "~30 min with AI assist",
        trigger: "Deadline proximity + incomplete checklist",
        initiativeId: "DEMO-101"
      },
      {
        id: "rec-2",
        title: "Confirm RAPID roles for DEMO-101",
        whyNow: "Slack indicates RAPID confusion. Unblocks decisions and prevents drift.",
        effort: "~15 min",
        trigger: "RAPID completeness",
        initiativeId: "DEMO-101"
      },
      {
        id: "rec-3",
        title: "Create translation request packet for DEMO-204",
        whyNow: "BPO dependency risks compressing training window.",
        effort: "~20 min",
        trigger: "Dependency pressure",
        initiativeId: "DEMO-204"
      },
      {
        id: "rec-4",
        title: "Measurement mini-brief for DEMO-330",
        whyNow: "In Measurement. QA asked for expected movement and abort triggers.",
        effort: "~25 min",
        trigger: "Measurement window",
        initiativeId: "DEMO-330"
      }
    ],

    wins: [
      {
        id: "w-1",
        title: "ATO escalation routing launched on time (demo)",
        desc: "Shipped routing change and entered measurement with defined leading indicators.",
        comp: "operational",
        evidence: "DEMO-330",
        when: "This month"
      },
      {
        id: "w-2",
        title: "Improved cross-functional alignment (demo)",
        desc: "Locked stakeholder review path and reduced handoffs for a readiness artifact.",
        comp: "cross-func",
        evidence: "DEMO-101",
        when: "This month"
      }
    ],

    decisions: [
      {
        id: "d-1",
        type: "Go/No-Go",
        title: "Go decision for DEMO-330",
        body: "Decision captured as demo placeholder. Replace with your real decision record.",
        tenet: "(Playbook) Tenet alignment placeholder",
        expected: "Reduce time-to-containment",
        actual: "Pending measurement",
        when: "Last week",
        initiativeId: "DEMO-330"
      },
      {
        id: "d-2",
        type: "P-Level Classification",
        title: "Classified DEMO-101 as P1",
        body: "Rationale placeholder. Replace with playbook-based rationale.",
        tenet: "(Playbook) Prioritization framework placeholder",
        expected: "Improve intake completeness",
        actual: "Pending",
        when: "This week",
        initiativeId: "DEMO-101"
      }
    ]
  };
})();
