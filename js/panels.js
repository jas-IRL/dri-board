/* Panel rendering + UI actions */

(function () {
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  const SNOOZE_KEY = "dri_board_snoozed_v1";

  function escapeHtml(s) {
    return String(s)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function parseDateISO(iso) {
    const d = new Date(iso + "T00:00:00");
    return Number.isNaN(d.getTime()) ? null : d;
  }

  function daysUntil(iso) {
    const d = parseDateISO(iso);
    if (!d) return null;
    const now = new Date();
    const ms = d.getTime() - new Date(now.toDateString()).getTime();
    return Math.round(ms / (1000 * 60 * 60 * 24));
  }

  function pWeight(p) {
    if (p === "P0") return 3;
    if (p === "P1") return 2;
    if (p === "P2") return 1.5;
    return 1;
  }

  function pClass(p) {
    return (p || "P3").toLowerCase();
  }

  function lifecycleClass(l) {
    const x = (l || "Active").toLowerCase();
    if (x.includes("measurement")) return "measuring";
    return x;
  }

  function progressColor(n) {
    if (n >= 80) return "green";
    if (n >= 50) return "blue";
    if (n >= 30) return "yellow";
    return "red";
  }

  function loadSnoozed() {
    try {
      return JSON.parse(localStorage.getItem(SNOOZE_KEY) || "{}") || {};
    } catch {
      return {};
    }
  }

  function saveSnoozed(next) {
    localStorage.setItem(SNOOZE_KEY, JSON.stringify(next));
  }

  function snooze(kind, id) {
    const current = loadSnoozed();
    const key = `${kind}:${id}`;
    current[key] = { snoozedAt: new Date().toISOString() };
    saveSnoozed(current);
  }

  function isSnoozed(kind, id) {
    const current = loadSnoozed();
    return Boolean(current[`${kind}:${id}`]);
  }

  function ringSetPercent(svgCircle, percent) {
    // circumference for r=52: ~326.7
    const c = 327;
    const clamped = Math.max(0, Math.min(100, percent));
    const offset = c - (clamped / 100) * c;
    svgCircle.style.strokeDashoffset = String(offset);

    // color
    if (clamped >= 80) svgCircle.style.stroke = "var(--accent-green)";
    else if (clamped >= 60) svgCircle.style.stroke = "var(--accent-blue)";
    else if (clamped >= 40) svgCircle.style.stroke = "var(--accent-yellow)";
    else svgCircle.style.stroke = "var(--accent-red)";
  }

  function computeOverallReadiness(initiatives) {
    // readiness = weighted avg progress of Active initiatives only
    const active = initiatives.filter((i) => i.lifecycle === "Active");
    let num = 0;
    let den = 0;
    for (const i of active) {
      const w = pWeight(i.pLevel);
      num += (i.progress || 0) * w;
      den += w;
    }
    if (!den) return 0;
    return Math.round(num / den);
  }

  function renderMissionControl(data) {
    const initiatives = data.initiatives || [];
    const active = initiatives.filter((i) => i.lifecycle === "Active");
    const measuring = initiatives.filter((i) => i.lifecycle === "In Measurement");

    // readiness ring
    const readiness = computeOverallReadiness(initiatives);
    $("#readiness-value").textContent = `${readiness}%`;
    ringSetPercent($("#readiness-ring-fill"), readiness);

    // stats
    $("#stat-active").textContent = String(active.length);
    $("#stat-measuring").textContent = String(measuring.length);

    // at-risk collabs (cooling/drifting/strained)
    const atRisk = (data.collaborators || []).filter((c) => ["Cooling", "Drifting", "Strained"].includes(c.state));
    $("#stat-atrisk").textContent = String(atRisk.length);

    // unreplied mentions count (non-snoozed)
    const unreplied = (data.comms?.unreplied || []).filter((t) => !isSnoozed("comms", t.id));
    $("#stat-unreplied").textContent = String(unreplied.length);

    // actions due today (from checklist due today and not done)
    const todayISO = new Date().toISOString().slice(0, 10);
    const actions = [];
    for (const i of active) {
      for (const c of i.checklist || []) {
        if (!c.done && c.due === todayISO) {
          actions.push({ initiativeId: i.id, pLevel: i.pLevel, text: c.text, due: c.due });
        }
      }
    }

    // fallback actions (demo)
    if (actions.length === 0) {
      actions.push(
        { initiativeId: "DEMO-101", pLevel: "P1", text: "Draft training brief and attach to Jira ticket", due: todayISO },
        { initiativeId: "DEMO-204", pLevel: "P2", text: "Submit translation request packet", due: todayISO },
        { initiativeId: "DEMO-330", pLevel: "P0", text: "Send measurement mini-brief to QA", due: todayISO }
      );
    }

    $("#actions-count").textContent = String(actions.length);
    const actionsList = $("#actions-list");
    actionsList.innerHTML = actions
      .slice(0, 6)
      .map(
        (a) => `
          <li class="action-item">
            <i class="fas fa-circle-exclamation"></i>
            <div class="action-main">
              <div class="action-title">${escapeHtml(a.text)}</div>
              <div class="action-meta">
                <span class="p-badge ${pClass(a.pLevel)}">${escapeHtml(a.pLevel)}</span>
                <span>${escapeHtml(a.initiativeId)}</span>
                <span>Due ${escapeHtml(a.due)}</span>
              </div>
            </div>
            <button class="btn btn-sm btn-secondary" data-jump="${escapeHtml(a.initiativeId)}">Open</button>
          </li>
        `
      )
      .join("");

    actionsList.querySelectorAll("button[data-jump]").forEach((btn) => {
      btn.addEventListener("click", () => {
        window.DRI_APP.setPanel("workstreams");
        window.dispatchEvent(new CustomEvent("dri:focus-initiative", { detail: { id: btn.dataset.jump } }));
      });
    });

    // Top checklist items (5-7 incomplete across Active)
    const incomplete = [];
    for (const i of active) {
      for (const c of i.checklist || []) {
        if (!c.done) {
          incomplete.push({
            initiativeId: i.id,
            initiativeName: i.name,
            pLevel: i.pLevel,
            due: c.due,
            text: c.text,
            days: typeof c.due === "string" ? daysUntil(c.due) : null
          });
        }
      }
    }

    incomplete.sort((a, b) => {
      const pw = (x) => ({ P0: 0, P1: 1, P2: 2, P3: 3 }[x.pLevel] ?? 9);
      const pComp = pw(a) - pw(b);
      if (pComp !== 0) return pComp;
      const da = a.days ?? 999;
      const db = b.days ?? 999;
      return da - db;
    });

    const checklist = $("#mc-checklist");
    checklist.innerHTML = incomplete
      .slice(0, 7)
      .map(
        (c) => `
        <li class="checklist-item">
          <i class="far fa-circle"></i>
          <div class="check-main">
            <div class="check-title">${escapeHtml(c.text)}</div>
            <div class="check-meta">
              <span class="p-badge ${pClass(c.pLevel)}">${escapeHtml(c.pLevel)}</span>
              <span>${escapeHtml(c.initiativeId)}: ${escapeHtml(c.initiativeName)}</span>
              ${c.due ? `<span>Due ${escapeHtml(c.due)} (${escapeHtml(String(c.days))}d)</span>` : ""}
            </div>
          </div>
          <button class="btn btn-sm btn-secondary" data-jump="${escapeHtml(c.initiativeId)}">Open</button>
        </li>
      `
      )
      .join("");

    checklist.querySelectorAll("button[data-jump]").forEach((btn) => {
      btn.addEventListener("click", () => {
        window.DRI_APP.setPanel("workstreams");
        window.dispatchEvent(new CustomEvent("dri:focus-initiative", { detail: { id: btn.dataset.jump } }));
      });
    });

    // Urgent recommendations
    const recs = (data.recommender || []).filter((r) => !isSnoozed("rec", r.id)).slice(0, 4);
    $("#mc-recs").innerHTML = recs
      .map(
        (r) => `
        <div class="rec-card">
          <div class="rec-title">${escapeHtml(r.title)}</div>
          <div class="rec-why">${escapeHtml(r.whyNow)}</div>
          <div class="action-meta">
            <span class="p-badge ${pClass((initiatives.find((i) => i.id === r.initiativeId) || {}).pLevel || "P2")}">${escapeHtml((initiatives.find((i) => i.id === r.initiativeId) || {}).pLevel || "P2")}</span>
            <span>${escapeHtml(r.initiativeId)}</span>
            <span>${escapeHtml(r.effort)}</span>
          </div>
          <div class="rec-actions">
            <button class="btn btn-sm btn-primary" data-generate="${escapeHtml(r.id)}">Generate</button>
            <button class="btn btn-sm btn-secondary" data-snooze="${escapeHtml(r.id)}">Not Relevant</button>
          </div>
        </div>
      `
      )
      .join("");

    $("#mc-recs").querySelectorAll("button[data-snooze]").forEach((b) => {
      b.addEventListener("click", () => {
        snooze("rec", b.dataset.snooze);
        renderAll();
      });
    });

    $("#mc-recs").querySelectorAll("button[data-generate]").forEach((b) => {
      b.addEventListener("click", () => {
        const recId = b.dataset.generate;
        const rec = (data.recommender || []).find((x) => x.id === recId);
        if (!rec) return;
        window.DRI_APP.setPanel("ai-recommender");
        window.dispatchEvent(new CustomEvent("dri:generate", { detail: { type: "rec", id: recId } }));
      });
    });

    // Collaboration health alerts
    const alerts = atRisk.slice(0, 4);
    $("#mc-collab-alerts").innerHTML = alerts
      .map(
        (c) => `
        <div class="collab-alert">
          <div class="collab-avatar">${escapeHtml((c.name || "?").split(" ").slice(-1)[0].slice(0, 2).toUpperCase())}</div>
          <div class="collab-main">
            <div class="collab-name">${escapeHtml(c.name)} <span class="sentiment-badge ${escapeHtml(c.state.toLowerCase())}">${escapeHtml(c.state)}</span></div>
            <div class="collab-rec">${escapeHtml(c.action)}</div>
            <div class="rec-actions mt-12">
              <button class="btn btn-sm btn-primary" data-draft-reengage="${escapeHtml(c.id)}">Draft message</button>
              <button class="btn btn-sm btn-secondary" data-view-collab="${escapeHtml(c.id)}">View</button>
            </div>
          </div>
        </div>
      `
      )
      .join("");

    $("#mc-collab-alerts").querySelectorAll("button[data-view-collab]").forEach((b) => {
      b.addEventListener("click", () => {
        window.DRI_APP.setPanel("collaborator-sentiment");
        window.dispatchEvent(new CustomEvent("dri:focus-collab", { detail: { id: b.dataset.viewCollab } }));
      });
    });
  }

  function renderWorkstreams(data) {
    const list = $("#workstream-list");
    const filter = $(".filter-btn.active[data-filter]")?.dataset.filter || "active-measuring";
    const sort = $("#ws-sort").value || "priority";

    const initiatives = [...(data.initiatives || [])];

    let filtered = initiatives;
    if (filter === "active-measuring") {
      filtered = initiatives.filter((i) => i.lifecycle === "Active" || i.lifecycle === "In Measurement");
    }

    const prank = (p) => ({ P0: 0, P1: 1, P2: 2, P3: 3 }[p] ?? 9);

    filtered.sort((a, b) => {
      if (sort === "deadline") {
        return (daysUntil(a.deadline) ?? 999) - (daysUntil(b.deadline) ?? 999);
      }
      if (sort === "progress") {
        return (b.progress || 0) - (a.progress || 0);
      }
      return prank(a.pLevel) - prank(b.pLevel);
    });

    list.innerHTML = filtered
      .map((i) => {
        const d = daysUntil(i.deadline);
        const lc = lifecycleClass(i.lifecycle);
        const closed = i.lifecycle === "Closed";
        const progColor = progressColor(i.progress || 0);
        const kpi = i.kpiImpact;

        return `
        <div class="ws-card ${closed ? "closed" : ""}" data-init="${escapeHtml(i.id)}">
          <div class="ws-header">
            <div class="ws-title">
              <span class="p-badge ${pClass(i.pLevel)}">${escapeHtml(i.pLevel)}</span>
              <span class="lifecycle-badge ${escapeHtml(lc)}">${escapeHtml(i.lifecycle)}</span>
              <span class="ws-name">${escapeHtml(i.name)}</span>
              <span class="ws-meta">${escapeHtml(i.id)}</span>
            </div>
            <div class="ws-meta">
              <span>Deadline ${escapeHtml(i.deadline)}</span>
              <span>${d === null ? "" : `${escapeHtml(String(d))}d`}</span>
              <span style="min-width:120px;">${escapeHtml(String(i.progress || 0))}%</span>
              <i class="fas fa-chevron-down"></i>
            </div>
          </div>
          <div class="ws-body">
            <div class="ws-section">
              <h4>Progress</h4>
              <div class="progress-bar"><div class="progress-fill ${progColor}" style="width:${Math.max(0, Math.min(100, i.progress || 0))}%"></div></div>
            </div>

            <div class="ws-section">
              <h4>Description</h4>
              <div class="ws-desc">${escapeHtml(i.description || "")}</div>
            </div>

            <div class="ws-section">
              <h4>Checklist (editable)</h4>
              <ul class="ws-checklist">
                ${(i.checklist || [])
                  .map(
                    (c) => `
                  <li class="ws-check">
                    <input type="checkbox" ${c.done ? "checked" : ""} data-check="${escapeHtml(i.id)}::${escapeHtml(c.id)}" />
                    <div class="check-text ${c.done ? "done" : ""}">${escapeHtml(c.text)}</div>
                    <div class="text-muted" style="font-size:0.75rem;">${c.due ? `Due ${escapeHtml(c.due)}` : ""}</div>
                  </li>
                `
                  )
                  .join("")}
              </ul>
            </div>

            <div class="ws-section">
              <h4>Risks and blockers (demo)</h4>
              <div class="ws-risks">
                ${(i.risks || []).length
                  ? (i.risks || [])
                      .map((r) => `<div class="risk-item"><strong>${escapeHtml(r.level)}:</strong> ${escapeHtml(r.text)}</div>`)
                      .join("")
                  : `<div class="text-muted">No risks captured.</div>`}
              </div>
            </div>

            <div class="ws-section">
              <h4>RAPID (placeholders)</h4>
              <div class="ws-rapid">
                ${Object.entries(i.rapid || {}).map(([k, v]) => `<div class="rapid-item"><b>${escapeHtml(k)}:</b> ${escapeHtml(v)}</div>`).join("")}
              </div>
            </div>

            <div class="ws-section">
              <h4>Artifacts</h4>
              <div class="artifact-list">
                ${(i.artifacts || []).map((a) => `<div class="artifact"><a href="${escapeHtml(a.href || "#")}" target="_blank" rel="noreferrer">${escapeHtml(a.name)}</a><button class="btn btn-sm btn-secondary" data-copy="${escapeHtml(a.name)}">Copy link</button></div>`).join("")}
              </div>
            </div>

            ${kpi ? `
              <div class="ws-section">
                <h4>KPI impact (demo)</h4>
                <div class="ws-desc">${escapeHtml(kpi.note || "")}</div>
                <div class="ws-meta" style="margin-top:8px;">
                  ${(kpi.metrics || []).map((m) => `<span class="card-badge">${escapeHtml(m.name)} ${escapeHtml(m.value)} (${escapeHtml(m.period)})</span>`).join("")}
                </div>
              </div>
            ` : ""}

            <div class="ws-section">
              <h4>Actions</h4>
              <div class="rec-actions">
                <button class="btn btn-sm btn-primary" data-draft-update="${escapeHtml(i.id)}"><i class="fas fa-pen"></i> Draft Slack update</button>
                <button class="btn btn-sm btn-secondary" data-log-decision="${escapeHtml(i.id)}"><i class="fas fa-gavel"></i> Log decision</button>
              </div>
            </div>
          </div>
        </div>
      `;
      })
      .join("");

    // expand / collapse
    $$(".ws-header", list).forEach((h) => {
      h.addEventListener("click", () => {
        const card = h.closest(".ws-card");
        card.classList.toggle("expanded");
      });
    });

    // checklist toggles stored in local state
    list.querySelectorAll("input[data-check]").forEach((cb) => {
      cb.addEventListener("change", () => {
        const [initId, checkId] = cb.dataset.check.split("::");
        const init = (data.initiatives || []).find((x) => x.id === initId);
        if (!init) return;
        const item = (init.checklist || []).find((x) => x.id === checkId);
        if (!item) return;
        item.done = cb.checked;
        renderAll();
      });
    });

    // focus initiative
    window.addEventListener("dri:focus-initiative", (e) => {
      const id = e.detail?.id;
      if (!id) return;
      const card = list.querySelector(`.ws-card[data-init="${CSS.escape(id)}"]`);
      if (!card) return;
      card.classList.add("expanded");
      card.scrollIntoView({ behavior: "smooth", block: "start" });
    });

    // filter buttons
    $$(".filter-btn[data-filter]").forEach((b) => {
      b.addEventListener("click", () => {
        $$(".filter-btn[data-filter]").forEach((x) => x.classList.remove("active"));
        b.classList.add("active");
        renderWorkstreams(window.DRI_DATA);
      });
    });

    $("#ws-sort").addEventListener("change", () => renderWorkstreams(window.DRI_DATA));

    // search event
    window.addEventListener("dri:search", (e) => {
      const q = e.detail?.query;
      if (!q) return;
      const cards = $$(".ws-card", list);
      cards.forEach((c) => {
        const text = c.textContent.toLowerCase();
        c.style.display = text.includes(q) ? "block" : "none";
      });
      const first = cards.find((c) => c.style.display !== "none");
      if (first) first.scrollIntoView({ behavior: "smooth", block: "start" });
    });

    // draft update
    list.querySelectorAll("button[data-draft-update]").forEach((b) => {
      b.addEventListener("click", () => {
        const initId = b.dataset.draftUpdate;
        const init = (data.initiatives || []).find((x) => x.id === initId);
        if (!init) return;
        const missing = (init.checklist || []).filter((c) => !c.done).slice(0, 3).map((c) => c.text);
        const d = daysUntil(init.deadline);

        const msg = [
          `Update on ${init.id} (${init.pLevel}): ${init.name}`,
          `Progress: ${init.progress}% | Deadline: ${init.deadline} (${d === null ? "" : d + "d"})`,
          missing.length ? `Next up: ${missing.join("; ")}.` : "Next up: closeout checks and measurement plan.",
          "If you are an approver, please review the linked artifacts today."
        ].join("\n");

        alert(msg);
      });
    });

    // log decision shortcut
    list.querySelectorAll("button[data-log-decision]").forEach((b) => {
      b.addEventListener("click", () => {
        window.DRI_APP.setPanel("decision-log");
      });
    });

    // copy link (demo)
    list.querySelectorAll("button[data-copy]").forEach((b) => {
      b.addEventListener("click", async () => {
        try {
          await navigator.clipboard.writeText("#");
          b.textContent = "Copied";
          setTimeout(() => (b.textContent = "Copy link"), 900);
        } catch {
          // ignore
        }
      });
    });
  }

  function draftSlackResponse(thread) {
    // Keep under ~200 words.
    const init = (window.DRI_DATA.initiatives || []).find((i) => i.id === thread.initiativeId);
    const context = init ? `${init.id} (${init.pLevel})` : "this initiative";

    if (thread.urgency === "High") {
      return (
        `Thanks for the ping. On ${context}: ` +
        `I will confirm the required artifact today and attach it to the Jira ticket. ` +
        `If you need a decision from me, please drop the two options and the deadline in this thread and I will respond by EOD.`
      );
    }

    return (
      `On ${context}: ` +
      `I see the question. I will validate against the readiness requirements and reply with the decision and next steps today. ` +
      `If you have a specific deadline or dependency, please call it out.`
    );
  }

  function renderComms(data) {
    const unreplied = (data.comms?.unreplied || []).filter((t) => !isSnoozed("comms", t.id));
    const openThreads = (data.comms?.openThreads || []).filter((t) => !isSnoozed("comms", t.id));
    const proactive = (data.comms?.proactive || []).filter((t) => !isSnoozed("comms", t.id));

    const renderThread = (t, opts = {}) => {
      const init = (data.initiatives || []).find((i) => i.id === t.initiativeId);
      const p = init?.pLevel || "P2";

      const badge = opts.confidence
        ? `<span class="confidence-badge ${escapeHtml(opts.confidenceClass)}">${escapeHtml(opts.confidence)}</span>`
        : `<span class="p-badge ${pClass(p)}">${escapeHtml(p)}</span>`;

      const metaPieces = [
        t.sender ? escapeHtml(t.sender) : null,
        t.channel ? escapeHtml(t.channel) : null,
        t.timestamp ? escapeHtml(t.timestamp) : null
      ].filter(Boolean);

      const extra = opts.extraHtml || "";

      return `
        <div class="thread-card" data-thread="${escapeHtml(t.id)}">
          <div class="thread-top">
            <div class="thread-from">
              ${badge}
              <span>${escapeHtml(t.sender || t.channel || "Thread")}</span>
            </div>
            <div class="thread-meta">
              ${metaPieces.map((x) => `<span>${x}</span>`).join("")}
              ${t.newCount ? `<span class="card-badge">+${escapeHtml(String(t.newCount))} new</span>` : ""}
            </div>
          </div>
          <div class="thread-preview">${escapeHtml(t.preview || t.summary || t.context || "")}</div>
          <div class="thread-context">
            ${t.initiativeId ? `<span class="card-badge">${escapeHtml(t.initiativeId)}</span>` : ""}
            ${t.urgency ? `<span class="card-badge" style="background:rgba(239,68,68,0.15);color:var(--accent-red)">${escapeHtml(t.urgency)} urgency</span>` : ""}
            ${t.signal ? `<span class="card-badge">Signal: ${escapeHtml(t.signal)}</span>` : ""}
          </div>
          ${extra}
          <div class="thread-actions">
            <button class="btn btn-sm btn-primary" data-draft="${escapeHtml(t.id)}">Draft Response</button>
            <button class="btn btn-sm btn-secondary" data-snooze="${escapeHtml(t.id)}">Not Relevant</button>
          </div>
          <div class="draft-box" style="display:none;"><textarea></textarea><div class="rec-actions mt-12"><button class="btn btn-sm btn-success" data-copy-draft="${escapeHtml(t.id)}">Copy</button><button class="btn btn-sm btn-secondary" data-close-draft="${escapeHtml(t.id)}">Close</button></div></div>
        </div>
      `;
    };

    $("#unreplied-list").innerHTML = unreplied.map((t) => renderThread(t)).join("");
    $("#open-threads-list").innerHTML = openThreads
      .map((t) => renderThread({ ...t, sender: "Open thread" }, { extraHtml: `<div class="text-muted" style="font-size:0.8rem;">Catch-up: ${escapeHtml(t.summary || "")}</div>` }))
      .join("");

    $("#proactive-list").innerHTML = proactive
      .map((t) =>
        renderThread(
          { ...t, sender: "Recommendation", preview: `${t.talkingPoint || ""} ${t.context || ""}` },
          {
            confidence: t.confidence,
            confidenceClass: String(t.confidence || "Low").toLowerCase().replace(/\s+/g, "-")
          }
        )
      )
      .join("");

    // Wire actions
    $$("button[data-snooze]", $("#comms-queue")).forEach((b) => {
      b.addEventListener("click", () => {
        snooze("comms", b.dataset.snooze);
        renderAll();
      });
    });

    $$("button[data-draft]", $("#comms-queue")).forEach((b) => {
      b.addEventListener("click", () => {
        const id = b.dataset.draft;
        const t = [...(data.comms?.unreplied || []), ...(data.comms?.openThreads || []), ...(data.comms?.proactive || [])].find((x) => x.id === id);
        if (!t) return;
        const card = b.closest(".thread-card");
        const box = $(".draft-box", card);
        const ta = $("textarea", box);
        ta.value = draftSlackResponse(t);
        box.style.display = "block";
      });
    });

    $$("button[data-close-draft]", $("#comms-queue")).forEach((b) => {
      b.addEventListener("click", () => {
        const card = b.closest(".thread-card");
        const box = $(".draft-box", card);
        box.style.display = "none";
      });
    });

    $$("button[data-copy-draft]", $("#comms-queue")).forEach((b) => {
      b.addEventListener("click", async () => {
        const card = b.closest(".thread-card");
        const txt = $("textarea", $(".draft-box", card)).value;
        try {
          await navigator.clipboard.writeText(txt);
          b.textContent = "Copied";
          setTimeout(() => (b.textContent = "Copy"), 900);
        } catch {
          // ignore
        }
      });
    });
  }

  function scoreToPercent(x) {
    // x 1..5
    const v = Math.max(1, Math.min(5, Number(x || 1)));
    return Math.round(((v - 1) / 4) * 100);
  }

  function renderSentiment(data) {
    const grid = $("#sentiment-grid");
    const tier = $(".filter-btn.active[data-tier]")?.dataset.tier || "role";
    const q = ($("#collab-search").value || "").trim().toLowerCase();

    let rows = data.collaborators || [];

    // For demo: tier just changes grouping label.
    const labelFor = (c) => {
      if (tier === "org") return c.tierOrg;
      if (tier === "individual") return c.name;
      return `${c.tierRole} (${c.tierOrg})`;
    };

    if (q) {
      rows = rows.filter((c) => labelFor(c).toLowerCase().includes(q) || (c.name || "").toLowerCase().includes(q));
    }

    grid.innerHTML = rows
      .map((c) => {
        const lbl = labelFor(c);
        const state = String(c.state || "Stable").toLowerCase();

        const dims = c.dims || {};
        const dimLines = Object.entries(dims)
          .map(([k, v]) => {
            const pct = scoreToPercent(v);
            return `
              <div class="score-row">
                <div class="score-label">${escapeHtml(k)}</div>
                <div class="score-value">${escapeHtml(String(v))}</div>
                <div class="score-meter"><div style="width:${pct}%"></div></div>
              </div>
            `;
          })
          .join("");

        return `
          <div class="card sentiment-card" data-collab="${escapeHtml(c.id)}">
            <div class="top">
              <div>
                <div class="sentiment-name">${escapeHtml(lbl)}</div>
                <div class="sentiment-sub">${escapeHtml(c.name)}</div>
              </div>
              <div style="text-align:right;">
                <span class="sentiment-badge ${escapeHtml(state)}">${escapeHtml(c.state)}</span>
                <div class="text-muted" style="margin-top:6px;font-size:0.75rem;">Composite: ${escapeHtml(String(c.composite))}</div>
              </div>
            </div>
            <div>${dimLines}</div>
          </div>
        `;
      })
      .join("");

    const modal = $("#sentiment-modal");
    const modalBody = $("#sentiment-modal-body");

    function closeModal() {
      modal.style.display = "none";
    }

    modal.querySelector(".modal-overlay").addEventListener("click", closeModal);
    modal.querySelector(".modal-close").addEventListener("click", closeModal);

    grid.querySelectorAll(".sentiment-card").forEach((card) => {
      card.addEventListener("click", () => {
        const id = card.dataset.collab;
        const c = (data.collaborators || []).find((x) => x.id === id);
        if (!c) return;

        modalBody.innerHTML = `
          <h3>${escapeHtml(c.name)}</h3>
          <div class="mb-12"><span class="sentiment-badge ${escapeHtml(String(c.state).toLowerCase())}">${escapeHtml(c.state)}</span> <span class="text-muted">Composite ${escapeHtml(String(c.composite))}</span></div>
          <div class="output-card">
            <h4>Recommended action</h4>
            <pre>${escapeHtml(c.action)}</pre>
          </div>
          <div class="output-card">
            <h4>Draft re-engagement message (demo)</h4>
            <pre>${escapeHtml(
              `Quick sync on the current readiness items. I attached the latest draft and called out the two decisions needed.\n\nIf you can confirm (1) owner for approvals and (2) latest timeline constraints by EOD, I will align the plan and keep you out of unnecessary threads.`
            )}</pre>
          </div>
          <div class="rec-actions">
            <button class="btn btn-primary" id="copy-reengage">Copy message</button>
            <button class="btn btn-secondary" id="close-reengage">Close</button>
          </div>
        `;

        $("#copy-reengage", modalBody).addEventListener("click", async () => {
          const text = $("pre", modalBody).textContent;
          try {
            await navigator.clipboard.writeText(text);
          } catch {
            // ignore
          }
        });
        $("#close-reengage", modalBody).addEventListener("click", closeModal);

        modal.style.display = "flex";
      });
    });

    // tier buttons
    $$(".filter-btn[data-tier]").forEach((b) => {
      b.addEventListener("click", () => {
        $$(".filter-btn[data-tier]").forEach((x) => x.classList.remove("active"));
        b.classList.add("active");
        renderSentiment(window.DRI_DATA);
      });
    });

    // search
    $("#collab-search").addEventListener("input", () => renderSentiment(window.DRI_DATA));

    window.addEventListener("dri:focus-collab", (e) => {
      const id = e.detail?.id;
      if (!id) return;
      const card = grid.querySelector(`[data-collab="${CSS.escape(id)}"]`);
      if (card) card.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  function renderWorldview(data) {
    const filter = $(".filter-btn.active[data-wv]")?.dataset.wv || "all";
    const items = (data.worldview || []).filter((w) => !isSnoozed("wv", w.id));

    const filtered = filter === "all" ? items : items.filter((w) => String(w.type).toLowerCase() === filter);

    $("#worldview-grid").innerHTML = filtered
      .map(
        (w) => `
      <div class="world-card" data-wv="${escapeHtml(w.id)}">
        <div class="flex justify-between items-center">
          <span class="type-badge ${escapeHtml(String(w.type).toLowerCase())}">${escapeHtml(w.type)}</span>
          <span class="card-badge">Relevance: ${escapeHtml(w.relevance || "")}</span>
        </div>
        <div class="world-title">${escapeHtml(w.title)}</div>
        <div class="world-summary">${escapeHtml(w.summary)}</div>
        <div class="world-so-what"><b>So what:</b> ${escapeHtml(w.soWhat)}</div>
        <div class="world-actions">
          <button class="btn btn-sm btn-secondary" data-snooze-wv="${escapeHtml(w.id)}">Not Relevant</button>
        </div>
      </div>
    `
      )
      .join("");

    $("#worldview-grid").querySelectorAll("button[data-snooze-wv]").forEach((b) => {
      b.addEventListener("click", () => {
        snooze("wv", b.dataset.snoozeWv);
        renderAll();
      });
    });

    $$(".filter-btn[data-wv]").forEach((b) => {
      b.addEventListener("click", () => {
        $$(".filter-btn[data-wv]").forEach((x) => x.classList.remove("active"));
        b.classList.add("active");
        renderWorldview(window.DRI_DATA);
      });
    });
  }

  function renderRecommender(data) {
    const list = $("#recommender-list");
    const initiatives = data.initiatives || [];

    const recs = (data.recommender || []).filter((r) => !isSnoozed("rec", r.id)).slice(0, 7);

    list.innerHTML = recs
      .map((r) => {
        const init = initiatives.find((i) => i.id === r.initiativeId);
        const p = init?.pLevel || "P2";

        return `
          <div class="recommendation" data-rec="${escapeHtml(r.id)}">
            <div class="rec-head">
              <div>
                <h4>${escapeHtml(r.title)}</h4>
                <div class="rec-meta">
                  <span class="p-badge ${pClass(p)}">${escapeHtml(p)}</span>
                  <span class="card-badge">${escapeHtml(r.initiativeId)}</span>
                  <span class="card-badge">${escapeHtml(r.effort)}</span>
                </div>
              </div>
              <button class="btn btn-sm btn-secondary" data-snooze="${escapeHtml(r.id)}">Not Relevant</button>
            </div>
            <div class="rec-detail"><b>Why now:</b> ${escapeHtml(r.whyNow)}</div>
            <div class="rec-detail"><b>Trigger:</b> ${escapeHtml(r.trigger)}</div>
            <div class="rec-actions mt-12">
              <button class="btn btn-sm btn-primary" data-generate="${escapeHtml(r.id)}">Generate</button>
              <button class="btn btn-sm btn-secondary" data-open="${escapeHtml(r.initiativeId)}">Open workstream</button>
            </div>
            <div class="output-card" style="display:none; margin-top:12px;"><h4>Generated artifact (demo)</h4><pre></pre><div class="rec-actions mt-12"><button class="btn btn-sm btn-success" data-copy="${escapeHtml(r.id)}">Copy</button><button class="btn btn-sm btn-secondary" data-close="${escapeHtml(r.id)}">Close</button></div></div>
          </div>
        `;
      })
      .join("");

    list.querySelectorAll("button[data-snooze]").forEach((b) => {
      b.addEventListener("click", () => {
        snooze("rec", b.dataset.snooze);
        renderAll();
      });
    });

    list.querySelectorAll("button[data-open]").forEach((b) => {
      b.addEventListener("click", () => {
        window.DRI_APP.setPanel("workstreams");
        window.dispatchEvent(new CustomEvent("dri:focus-initiative", { detail: { id: b.dataset.open } }));
      });
    });

    function generateArtifact(rec) {
      const init = initiatives.find((i) => i.id === rec.initiativeId);
      const now = new Date().toISOString().slice(0, 10);

      // Demo artifacts: always editable text, no fabricated owners/dates beyond initiative deadline.
      return [
        `Artifact: ${rec.title}`,
        `Initiative: ${init ? init.id + " - " + init.name : rec.initiativeId}`,
        `Generated: ${now}`,
        "",
        "Purpose",
        "- Produce a ready-to-use readiness artifact to unblock the next decision and reduce timeline risk.",
        "",
        "Inputs needed (fill in)",
        "- Link to Jira epic/ticket",
        "- RAPID roles (Recommend/Agree/Perform/Input/Decide)",
        "- Ship date + any phased rollout",
        "- Affected LOBs and audiences",
        "",
        "Deliverable",
        "- Draft text is a placeholder. Replace with playbook-aligned content and attach to Jira.",
        "",
        "Next steps",
        "- Confirm owner for approvals",
        "- Finalize go/no-go criteria and measurement plan",
        "- Send Slack comms to stakeholders"
      ].join("\n");
    }

    list.querySelectorAll("button[data-generate]").forEach((b) => {
      b.addEventListener("click", () => {
        const recId = b.dataset.generate;
        const rec = (data.recommender || []).find((x) => x.id === recId);
        if (!rec) return;
        const card = b.closest(".recommendation");
        const out = $(".output-card", card);
        $("pre", out).textContent = generateArtifact(rec);
        out.style.display = "block";
      });
    });

    list.querySelectorAll("button[data-close]").forEach((b) => {
      b.addEventListener("click", () => {
        const card = b.closest(".recommendation");
        $(".output-card", card).style.display = "none";
      });
    });

    list.querySelectorAll("button[data-copy]").forEach((b) => {
      b.addEventListener("click", async () => {
        const card = b.closest(".recommendation");
        const txt = $("pre", $(".output-card", card)).textContent;
        try {
          await navigator.clipboard.writeText(txt);
          b.textContent = "Copied";
          setTimeout(() => (b.textContent = "Copy"), 900);
        } catch {
          // ignore
        }
      });
    });
  }

  function classifyPLevel(text) {
    const t = text.toLowerCase();
    if (/(launch|outage|regulator|fraud|security|incident|p0)/.test(t)) return "P0";
    if (/(policy|pricing|banking|payments|deadline|p1)/.test(t)) return "P1";
    if (/(copy|macro|kb|workflow|p2)/.test(t)) return "P2";
    return "P3";
  }

  function generateIntakeArtifacts(inputText) {
    const today = new Date().toISOString().slice(0, 10);
    const p = classifyPLevel(inputText);

    const pRationale = {
      P0: "Classified as P0 due to signals of launch/incident/security/regulatory impact. Validate against playbook and update if needed.",
      P1: "Classified as P1 due to policy or customer-impacting change signals. Validate against playbook and update if needed.",
      P2: "Classified as P2 based on content/workflow change signals. Validate against playbook and update if needed.",
      P3: "Classified as P3 by default due to limited risk signals. Validate against playbook and update if needed."
    };

    const artifacts = {
      classification: [
        `P-level: ${p}`,
        `Rationale: ${pRationale[p]}`,
        "Affected LOBs: (fill in)",
        "Risk if advocates are unprepared: (fill in)"
      ].join("\n"),

      rapid: [
        "RAPID (fill in names)",
        "- Recommend:",
        "- Agree:",
        "- Perform:",
        "- Input:",
        "- Decide:"
      ].join("\n"),

      stakeholderMsg: [
        "Slack message (ready to send)",
        "",
        "Sharing a readiness heads-up on the change below.",
        "",
        "What is changing:",
        inputText.trim() ? inputText.trim() : "(paste change summary)",
        "",
        "What I need from you today:",
        "- Confirm owner for approvals and the RAPID roles",
        "- Confirm ship date and any phased rollout",
        "- Confirm the top 3 advocate risks or known failure modes",
        "",
        "I will return with a training brief, comms draft, go/no-go checklist, and measurement plan attached to the Jira intake ticket."
      ].join("\n"),

      trainingBrief: [
        "Training brief",
        `Generated: ${today}`,
        "",
        "Audience",
        "- Primary: Advocates in affected LOBs",
        "- Secondary: QA, BPO trainers, Content Ops",
        "",
        "Modality (pick one)",
        "- Quick-read (KB + macro) with 5-question comprehension check",
        "- Live enablement session + recording",
        "- Train-the-trainer for BPO sites",
        "",
        "Timeline",
        "- Draft ready:",
        "- Review complete:",
        "- Delivery date:",
        "",
        "Prerequisites",
        "- Access to updated KB article",
        "- Decision record for edge-case handling",
        "",
        "Success criteria",
        "- Training completion >= (target)%",
        "- Comprehension score >= (target)%",
        "- No critical readiness gaps at go/no-go"
      ].join("\n"),

      goNoGo: [
        "Go/No-Go checklist (binary, measurable)",
        "1) RAPID roles are confirmed in Jira.",
        "2) Final KB/macro content is published and linked.",
        "3) Training is delivered and completion meets target.",
        "4) Comprehension check meets target and top misses are addressed.",
        "5) BPO sites have localized materials and trainer sign-off.",
        "6) QA rubric updates are published and QA leads acknowledge.",
        "7) Escalation path is documented for top 3 failure modes.",
        "8) Measurement plan is defined (leading 7d, lagging 30d).
9) Abort triggers are documented and owners are assigned.
10) Comms are sent with a single source of truth link."
      ].join("\n"),

      measurement: [
        "Measurement plan",
        "Leading (7-day)",
        "- Training completion and comprehension trend",
        "- Contact driver mix changes relevant to the change",
        "- QA defect rate for new policy/process failure modes",
        "",
        "Lagging (30-day)",
        "- FCR, CSAT, AHT, QA composite (by LOB)",
        "",
        "Success definition",
        "- (fill in) Target movement or non-regression vs baseline",
        "",
        "Abort triggers",
        "- If KPI regresses beyond (threshold) for (days), initiate rollback or mitigation"
      ].join("\n")
    };

    return artifacts;
  }

  function renderIntake() {
    const btnGen = $("#intake-generate");
    const btnClear = $("#intake-clear");
    const input = $("#intake-text");
    const out = $("#intake-output");

    btnGen.addEventListener("click", () => {
      const artifacts = generateIntakeArtifacts(input.value || "");
      out.style.display = "block";
      out.innerHTML = `
        <div class="output-card"><h4>P-level classification</h4><pre>${escapeHtml(artifacts.classification)}</pre></div>
        <div class="output-card"><h4>RAPID assignments</h4><pre>${escapeHtml(artifacts.rapid)}</pre></div>
        <div class="output-card"><h4>Stakeholder Slack message</h4><pre>${escapeHtml(artifacts.stakeholderMsg)}</pre></div>
        <div class="output-card"><h4>Training brief</h4><pre>${escapeHtml(artifacts.trainingBrief)}</pre></div>
        <div class="output-card"><h4>Go/No-Go checklist</h4><pre>${escapeHtml(artifacts.goNoGo)}</pre></div>
        <div class="output-card"><h4>Measurement plan</h4><pre>${escapeHtml(artifacts.measurement)}</pre></div>
        <div class="rec-actions">
          <button class="btn btn-primary" id="intake-copy">Copy all</button>
          <button class="btn btn-secondary" id="intake-hide">Hide</button>
        </div>
      `;

      $("#intake-copy").addEventListener("click", async () => {
        const txt = Object.values(artifacts).join("\n\n---\n\n");
        try {
          await navigator.clipboard.writeText(txt);
        } catch {
          // ignore
        }
      });
      $("#intake-hide").addEventListener("click", () => {
        out.style.display = "none";
      });
    });

    btnClear.addEventListener("click", () => {
      input.value = "";
      out.style.display = "none";
    });
  }

  function gapCheck(text) {
    const t = text.toLowerCase();
    const checks = [
      { label: "P-level defined", ok: /p0|p1|p2|p3/.test(t) },
      { label: "RAPID roles present", ok: /rapid|recommend|agree|perform|input|decide/.test(t) },
      { label: "Deadline/timeline present", ok: /deadline|ship|launch|date|timeline/.test(t) },
      { label: "Training plan present", ok: /training|enablement|l&d|assessment|comprehension/.test(t) },
      { label: "Go/No-Go criteria present", ok: /go\/no-go|gono|criteria/.test(t) },
      { label: "Measurement plan present", ok: /measurement|kpi|fcr|csat|aht|qa/.test(t) },
      { label: "Comms coverage present", ok: /comms|slack|announcement|stakeholder/.test(t) },
      { label: "Dependencies / blockers present", ok: /dependency|blocked|risk|assumption/.test(t) }
    ];
    const okCount = checks.filter((c) => c.ok).length;
    const confidence = okCount >= 7 ? "High" : okCount >= 4 ? "Medium" : "Low";

    return { checks, okCount, confidence };
  }

  function renderGapAnalysis() {
    const btn = $("#gap-analyze");
    const clear = $("#gap-clear");
    const input = $("#gap-text");
    const out = $("#gap-output");

    btn.addEventListener("click", () => {
      const text = input.value || "";
      const res = gapCheck(text);

      const strengths = res.checks.filter((c) => c.ok).map((c) => `- ${c.label}`);
      const gaps = res.checks.filter((c) => !c.ok).map((c) => `- Missing: ${c.label}`);

      out.style.display = "block";
      out.innerHTML = `
        <div class="output-card"><h4>Strengths</h4><pre>${escapeHtml(strengths.length ? strengths.join("\n") : "- None detected. Add basic readiness scaffolding.")}</pre></div>
        <div class="output-card"><h4>Critical gaps (demo heuristic)</h4><pre>${escapeHtml(gaps.length ? gaps.join("\n") : "- No obvious gaps detected by heuristic. Validate against playbook.")}</pre></div>
        <div class="output-card"><h4>Risks</h4><pre>${escapeHtml(
          "- If required artifacts are missing, stakeholders will make decisions on incomplete info.\n- If measurement is undefined, you will not be able to prove impact or catch regressions quickly."
        )}</pre></div>
        <div class="output-card"><h4>Missing artifacts</h4><pre>${escapeHtml(
          "- Training brief (if applicable)\n- Comms draft\n- Go/No-Go checklist\n- Measurement plan\n- Decision log entry"
        )}</pre></div>
        <div class="output-card"><h4>Suggested additions</h4><pre>${escapeHtml(
          "- Add RAPID table with named owners\n- Add timeline with milestones and dependency owners\n- Add 7-day leading indicators and 30-day lagging KPI plan\n- Add abort triggers and rollback path"
        )}</pre></div>
        <div class="output-card"><h4>Confidence</h4><pre>${escapeHtml(res.confidence)}</pre></div>
      `;
    });

    clear.addEventListener("click", () => {
      input.value = "";
      out.style.display = "none";
    });
  }

  function renderQBR(data) {
    const btn = $("#qbr-generate");
    const out = $("#qbr-output");

    btn.addEventListener("click", () => {
      const q = $("#qbr-quarter").value;
      const initiatives = data.initiatives || [];
      const active = initiatives.filter((i) => i.lifecycle === "Active");
      const measuring = initiatives.filter((i) => i.lifecycle === "In Measurement");
      const closed = initiatives.filter((i) => i.lifecycle === "Closed");

      const table = (rows) => {
        const header = "ID | P | Lifecycle | Deadline | Progress | Name";
        const sep = "---|---|---|---|---|---";
        const body = rows
          .map((i) => `${i.id} | ${i.pLevel} | ${i.lifecycle} | ${i.deadline} | ${i.progress}% | ${i.name}`)
          .join("\n");
        return [header, sep, body].join("\n");
      };

      const doc = [
        `QBR Draft (${q})`,
        "",
        "Executive summary (demo)",
        `- Active initiatives: ${active.length}`,
        `- In Measurement: ${measuring.length}`,
        `- Closed: ${closed.length}`,
        "- Replace demo values with Jira + Snowflake pulls.",
        "",
        "Program results table (demo)",
        table(initiatives),
        "",
        "Start / Stop / Continue (demo)",
        "Start:",
        "- Enforce artifact completeness gates earlier for P0/P1 initiatives.",
        "Stop:",
        "- Letting RAPID ambiguity linger past intake.",
        "Continue:",
        "- Weekly risk-based readiness reviews tied to deadlines.",
        "",
        "Forward pipeline (demo)",
        "- Add top 3 upcoming initiatives from Jira intake.",
        "",
        "KPI dashboard (demo placeholders)",
        "- FCR: connect Snowflake",
        "- CSAT: connect Snowflake",
        "- AHT: connect Snowflake",
        "- QA: connect Snowflake"
      ].join("\n");

      out.style.display = "block";
      out.innerHTML = `<div class="qbr-doc">${escapeHtml(doc)}</div><div class="rec-actions mt-16"><button class="btn btn-primary" id="qbr-copy">Copy</button></div>`;

      $("#qbr-copy").addEventListener("click", async () => {
        try {
          await navigator.clipboard.writeText(doc);
        } catch {
          // ignore
        }
      });
    });
  }

  function renderBrag(data) {
    const grid = $("#brag-grid");
    const filter = $(".filter-btn.active[data-comp]")?.dataset.comp || "all";
    const wins = data.wins || [];

    const filtered = filter === "all" ? wins : wins.filter((w) => w.comp === filter);

    grid.innerHTML = filtered
      .map(
        (w) => `
        <div class="win-card" data-win="${escapeHtml(w.id)}">
          <div class="flex justify-between items-center">
            <span class="comp-badge ${escapeHtml(w.comp)}">${escapeHtml(w.comp)}</span>
            <span class="text-muted">${escapeHtml(w.when || "")}</span>
          </div>
          <div class="win-title">${escapeHtml(w.title)}</div>
          <div class="win-desc">${escapeHtml(w.desc)}</div>
          <div class="win-meta">
            <span class="card-badge">Evidence: ${escapeHtml(w.evidence || "")}</span>
          </div>
        </div>
      `
      )
      .join("");

    // filter buttons
    $$(".filter-btn[data-comp]").forEach((b) => {
      b.addEventListener("click", () => {
        $$(".filter-btn[data-comp]").forEach((x) => x.classList.remove("active"));
        b.classList.add("active");
        renderBrag(window.DRI_DATA);
      });
    });

    // add win modal
    const modal = $("#add-win-modal");
    const close = () => (modal.style.display = "none");
    $("#brag-add").addEventListener("click", () => (modal.style.display = "flex"));
    modal.querySelector(".modal-overlay").addEventListener("click", close);
    modal.querySelector(".modal-close").addEventListener("click", close);

    $("#win-save").addEventListener("click", () => {
      const title = $("#win-title").value.trim();
      const desc = $("#win-desc").value.trim();
      const comp = $("#win-comp").value;
      const evidence = $("#win-evidence").value.trim();
      if (!title || !desc) return;
      window.DRI_DATA.wins.unshift({
        id: "w-" + Math.random().toString(16).slice(2, 8),
        title,
        desc,
        comp,
        evidence,
        when: "Just now"
      });
      $("#win-title").value = "";
      $("#win-desc").value = "";
      $("#win-evidence").value = "";
      close();
      renderBrag(window.DRI_DATA);
    });

    // year-end review generator
    $("#brag-generate-review").addEventListener("click", () => {
      const grouped = (window.DRI_DATA.wins || []).reduce((acc, w) => {
        (acc[w.comp] ||= []).push(w);
        return acc;
      }, {});

      const lines = [
        "Year-End Review (demo)",
        "",
        "Note: This draft uses only items logged in the Brag Board. Replace demo items and attach evidence links."
      ];
      for (const [comp, items] of Object.entries(grouped)) {
        lines.push("", comp.toUpperCase());
        for (const it of items) {
          lines.push(`- ${it.title} | Evidence: ${it.evidence || "(add link)"}`);
        }
      }
      alert(lines.join("\n"));
    });
  }

  function renderDecisions(data) {
    const list = $("#decision-list");
    const filter = $(".filter-btn.active[data-dtype]")?.dataset.dtype || "all";

    const map = {
      "p-level": "P-Level Classification",
      "go-nogo": "Go/No-Go",
      resource: "Resource Tradeoff",
      escalation: "Escalation"
    };

    const rows = (data.decisions || []).filter((d) => !isSnoozed("dec", d.id));
    const filtered = filter === "all" ? rows : rows.filter((d) => d.type === map[filter]);

    list.innerHTML = filtered
      .map(
        (d) => `
        <div class="decision-item" data-decision="${escapeHtml(d.id)}">
          <div class="flex justify-between items-center">
            <div>
              <div class="decision-title">${escapeHtml(d.title)}</div>
              <div class="text-muted" style="margin-top:6px;">${escapeHtml(d.type)} | ${escapeHtml(d.when || "")}</div>
            </div>
            <button class="btn btn-sm btn-secondary" data-snooze-dec="${escapeHtml(d.id)}">Not Relevant</button>
          </div>
          <div class="decision-body">${escapeHtml(d.body || "")}</div>
          <div class="decision-meta">
            ${d.initiativeId ? `<span class="card-badge">${escapeHtml(d.initiativeId)}</span>` : ""}
            ${d.tenet ? `<span class="card-badge">Tenet: ${escapeHtml(d.tenet)}</span>` : ""}
          </div>
          <div class="output-card" style="margin-top:12px;">
            <h4>Expected vs actual</h4>
            <pre>Expected: ${escapeHtml(d.expected || "")}
Actual: ${escapeHtml(d.actual || "")}</pre>
          </div>
        </div>
      `
      )
      .join("");

    // filters
    $$(".filter-btn[data-dtype]").forEach((b) => {
      b.addEventListener("click", () => {
        $$(".filter-btn[data-dtype]").forEach((x) => x.classList.remove("active"));
        b.classList.add("active");
        renderDecisions(window.DRI_DATA);
      });
    });

    list.querySelectorAll("button[data-snooze-dec]").forEach((b) => {
      b.addEventListener("click", () => {
        snooze("dec", b.dataset.snoozeDec);
        renderAll();
      });
    });

    // patterns (demo)
    $("#patterns-content").innerHTML = `
      <div class="text-muted">Demo pattern engine. With real Jira + KPI data, this should compare predicted outcomes to measured outcomes and highlight systematic bias.</div>
      <div class="mt-12">
        <div class="card-badge">Example: Under-estimated L&D timeline by ~30% (placeholder)</div>
      </div>
    `;
  }

  function renderAll() {
    const data = window.DRI_DATA;
    if (!data) return;

    renderMissionControl(data);
    renderWorkstreams(data);
    renderComms(data);
    renderSentiment(data);
    renderWorldview(data);
    renderRecommender(data);
    // intake and gap and qbr are wired once
    renderBrag(data);
    renderDecisions(data);

    // Update nav badges (rough)
    $("#nav-badge-ws").textContent = String((data.initiatives || []).filter((i) => i.lifecycle === "Active").length);
    $("#nav-badge-cq").textContent = String((data.comms?.unreplied || []).filter((t) => !isSnoozed("comms", t.id)).length);
    $("#nav-badge-ai").textContent = String((data.recommender || []).filter((r) => !isSnoozed("rec", r.id)).length);
    $("#nav-badge-cs").textContent = String((data.collaborators || []).filter((c) => ["Cooling", "Drifting", "Strained"].includes(c.state)).length);
  }

  document.addEventListener("DOMContentLoaded", () => {
    // wire one-time event handlers
    renderIntake();
    renderGapAnalysis();
    renderQBR(window.DRI_DATA);

    // workstreams filter default active
    // Ensure filter button active state exists
    const wsFilter = $(".filter-btn[data-filter='active-measuring']");
    if (wsFilter) wsFilter.classList.add("active");

    renderAll();
  });

  // expose for rerender
  window.DRI_RENDER = { renderAll };
  // internal helper for this module
  window.renderAll = renderAll;
})();
