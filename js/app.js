/* Core application behavior: nav, sidebar, search, persistence */

(function () {
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  const STORAGE_KEY = "dri_board_state_v1";

  function loadState() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}") || {};
    } catch {
      return {};
    }
  }

  function saveState(patch) {
    const current = loadState();
    const next = { ...current, ...patch };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    return next;
  }

  function nowISO() {
    return new Date().toISOString();
  }

  function setPanel(panelId) {
    $$(".panel").forEach((p) => p.classList.remove("active"));
    const panel = document.getElementById(panelId);
    if (panel) panel.classList.add("active");

    $$(".nav-item").forEach((i) => i.classList.remove("active"));
    const nav = $(`.nav-item[data-panel="${panelId}"]`);
    if (nav) nav.classList.add("active");

    const title = nav ? (nav.textContent || "").trim().replace(/\s+\d+\s*$/, "") : panelId;
    $("#panel-title").textContent = title;

    saveState({ activePanel: panelId, lastNavAt: nowISO() });
  }

  function toggleSidebar() {
    const sidebar = $("#sidebar");
    if (window.innerWidth <= 1024) {
      sidebar.classList.toggle("open");
    } else {
      sidebar.classList.toggle("collapsed");
      saveState({ sidebarCollapsed: sidebar.classList.contains("collapsed") });
    }
  }

  function initNav() {
    $$(".nav-item").forEach((item) => {
      item.addEventListener("click", () => {
        const panel = item.dataset.panel;
        setPanel(panel);
        // Close sidebar on mobile after navigation
        const sidebar = $("#sidebar");
        if (window.innerWidth <= 1024 && sidebar.classList.contains("open")) {
          sidebar.classList.remove("open");
        }
      });
    });

    $("#sidebar-toggle").addEventListener("click", toggleSidebar);

    // click outside sidebar closes on mobile
    document.addEventListener("click", (e) => {
      if (window.innerWidth > 1024) return;
      const sidebar = $("#sidebar");
      const toggle = $("#sidebar-toggle");
      if (!sidebar.classList.contains("open")) return;
      if (sidebar.contains(e.target) || toggle.contains(e.target)) return;
      sidebar.classList.remove("open");
    });
  }

  function initTabs() {
    $$(".tabs").forEach((tabsRoot) => {
      const tabs = $$(".tab", tabsRoot);
      tabs.forEach((tab) => {
        tab.addEventListener("click", () => {
          tabs.forEach((t) => t.classList.remove("active"));
          tab.classList.add("active");

          const tabName = tab.dataset.tab;
          const panel = tabsRoot.closest(".panel");
          if (!panel) return;

          $$(".tab-content", panel).forEach((c) => c.classList.remove("active"));
          const target = panel.querySelector(`#tab-${tabName}`);
          if (target) target.classList.add("active");
        });
      });
    });
  }

  function initGlobalSearch() {
    const input = $("#global-search");
    if (!input) return;

    input.addEventListener("keydown", (e) => {
      if (e.key !== "Enter") return;
      const q = input.value.trim().toLowerCase();
      if (!q) return;

      // Simple behavior: route to Workstreams and filter by query
      setPanel("workstreams");
      window.dispatchEvent(new CustomEvent("dri:search", { detail: { query: q } }));
    });
  }

  function applySavedUIState() {
    const state = loadState();
    if (state.sidebarCollapsed) {
      $("#sidebar").classList.add("collapsed");
    }
    if (state.activePanel) {
      setPanel(state.activePanel);
    }
  }

  window.DRI_APP = {
    loadState,
    saveState,
    setPanel
  };

  document.addEventListener("DOMContentLoaded", () => {
    initNav();
    initTabs();
    initGlobalSearch();
    applySavedUIState();
  });
})();
