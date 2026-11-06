/* Dashboard navigation.
   Root cause of the old bug: activateTab() only swapped which .tab-panel was visible; it never brought
   #workspace (which holds every panel, below the opinion block) into view and never touched the URL.
   goToSection() is now the single path for every sidebar item, tab and in-page jump. */
(function () {
  "use strict";
  const HASH = { overview: "summary", analysis: "analysis", documents: "documents", compliance: "compliance", registrations: "registration-planner", comparison: "entity-matrix", action: "action-plan" };
  const TAB = Object.fromEntries(Object.entries(HASH).map(([t, h]) => [h, t]));
  const reduce = () => window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  const ready = () => !document.getElementById("dashboard").classList.contains("hidden") && state.rec && state.rec.key;

  function setHeaderOffset() {
    const bar = document.querySelector(".topbar");
    document.documentElement.style.setProperty("--topbar-h", (bar ? Math.round(bar.getBoundingClientRect().height) : 72) + "px");
  }

  const offset = () => { const bar = document.querySelector(".topbar"); return (bar && getComputedStyle(bar).position === "sticky" ? bar.getBoundingClientRect().height : 0) + 12; };
  function goToSection(tab, opt) {
    opt = opt || {};
    if (!HASH[tab] || !document.getElementById("panel-" + tab)) return;
    activateTab(tab);
    document.getElementById("sidebar").classList.remove("open");
    const menu = document.getElementById("menuBtn"); if (menu) menu.setAttribute("aria-expanded", "false");
    setHeaderOffset();
    if (opt.scroll !== false) {
      const target = document.getElementById("workspace");
      // Measure after the panel switch (forces layout). "auto" would inherit the global CSS
      // scroll-behavior:smooth, so instant jumps must say "instant" explicitly.
      const want = () => Math.max(0, Math.round(target.getBoundingClientRect().top + window.scrollY - offset()));
      const instant = reduce() || opt.instant;
      window.scrollTo({ top: want(), behavior: instant ? "instant" : "smooth" });
      // Layout can shift while a long smooth scroll runs (count-ups, fonts): correct once it settles.
      clearTimeout(goToSection.t);
      const settle = () => { if (Math.abs(target.getBoundingClientRect().top - offset()) > 4) window.scrollTo({ top: want(), behavior: "instant" }); };
      if (!instant) { goToSection.t = setTimeout(settle, 900); window.addEventListener("scrollend", function once() { window.removeEventListener("scrollend", once); clearTimeout(goToSection.t); settle(); }); }
    }
    const h = "#" + HASH[tab];
    if (opt.push !== false && location.hash !== h) history.pushState({ tab }, "", h);
    else if (opt.replace) history.replaceState({ tab }, "", h);
    const panel = document.getElementById("panel-" + tab);
    if (opt.focus !== false && panel) { panel.setAttribute("tabindex", "-1"); panel.focus({ preventScroll: true }); }
  }

  // One delegated handler, in the capture phase, so the older per-button listeners never run twice.
  document.addEventListener("click", ev => {
    const el = ev.target.closest("[data-tab],[data-jump]");
    if (!el || !ready()) return;
    const tab = el.dataset.tab || el.dataset.jump;
    if (!HASH[tab]) return;
    ev.preventDefault(); ev.stopPropagation();
    // tabs in the tab bar are already in view: switch without moving the page unless the bar is off-screen
    const inBar = el.classList.contains("tab");
    const ws = document.getElementById("workspace").getBoundingClientRect();
    goToSection(tab, { scroll: !(inBar && ws.top >= 0 && ws.top < innerHeight * 0.6), focus: !inBar });
  }, true);

  // Back / forward and manually typed hashes
  function fromHash(push) {
    if (!ready()) return;
    const tab = TAB[location.hash.slice(1)];
    if (tab) goToSection(tab, { push: false, instant: !push });
    else { activateTab("overview"); window.scrollTo({ top: 0, behavior: reduce() ? "auto" : "smooth" }); }
  }
  window.addEventListener("popstate", () => fromHash(false));
  window.addEventListener("hashchange", () => fromHash(false));
  window.addEventListener("resize", setHeaderOffset);
  setHeaderOffset();

  // After a result is generated: honour a deep link if present, otherwise start clean at the top.
  const baseDash = renderDashboard;
  renderDashboard = function () {
    baseDash.apply(this, arguments);
    const tab = TAB[location.hash.slice(1)];
    if (tab && tab !== "overview") setTimeout(() => goToSection(tab, { push: false, instant: true }), 0);
    else if (location.hash && !tab) history.replaceState(null, "", location.pathname + location.search);
  };
  // Account menu on the question screen (the dashboard menu is wired in opinion.js)
  document.addEventListener("click", ev => {
    const btn = document.getElementById("acctBtnQ"), menu = document.getElementById("acctMenuQ"); if (!btn || !menu) return;
    if (btn.contains(ev.target)) { const open = menu.hidden; menu.hidden = !open; btn.setAttribute("aria-expanded", String(open)); if (open) (menu.querySelector("button:not(.hidden)") || btn).focus(); return; }
    if (!menu.hidden) { menu.hidden = true; btn.setAttribute("aria-expanded", "false"); }
  });
  document.addEventListener("keydown", ev => { const m = document.getElementById("acctMenuQ"); if (ev.key === "Escape" && m && !m.hidden) { m.hidden = true; document.getElementById("acctBtnQ").focus(); } });
  window.goToSection = goToSection;
  window.SECTION_HASH = HASH;
})();
