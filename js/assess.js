/* Assessment experience (Phase 4): rail + question card, option icons, keyboard, auto-advance,
   rule references in a tooltip, saved progress, question transitions and the "Analysing" moment.
   Presentation only: questions, options and engine logic are unchanged. */
(function () {
  "use strict";
  const KEY = "bizmatrix.assessment.v2", SECS_PER_Q = 12;
  const $ = id => document.getElementById(id);
  const reduce = () => window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  const store = {
    get() { try { return JSON.parse(localStorage.getItem(KEY) || "null"); } catch (e) { return null; } },
    set(v) { try { localStorage.setItem(KEY, JSON.stringify(v)); return true; } catch (e) { return false; } },
    del() { try { localStorage.removeItem(KEY); } catch (e) { /* storage disabled */ } }
  };

  /* ---------- icons (24px stroke) ---------- */
  const P = {
    rupee: '<path d="M6 4h12M6 9h12M9 4c4 0 6 2 6 5s-2 5-6 5H7l8 7"/>',
    heart: '<path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6"/>',
    users: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c1-3.5 3.6-5.5 6.5-5.5s5.5 2 6.5 5.5"/><path d="M16 4.5a3.5 3.5 0 0 1 0 7M18.5 14.8c1.6.8 2.6 2.6 3 5.2"/>',
    home: '<path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
    plane: '<path d="M2 16l20-6-20-6 3 6zM5 10h8"/>',
    globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3.5 3 14.5 0 18M12 3c-3 3.5-3 14.5 0 18"/>',
    check: '<circle cx="12" cy="12" r="9"/><path d="M8 12.5l2.8 2.8L16.5 9.5"/>',
    x: '<circle cx="12" cy="12" r="9"/><path d="M9 9l6 6M15 9l-6 6"/>',
    question: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.7.4-1 1-1 1.7M12 17h.01"/>',
    calc: '<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M8 7h8M8 12h2M14 12h2M8 16h2M14 16h2"/>',
    scale: '<path d="M12 4v16M6 20h12M4 8h16M7 8l-3 6a3 3 0 0 0 6 0zM17 8l-3 6a3 3 0 0 0 6 0z"/>',
    badge: '<circle cx="12" cy="9" r="5"/><path d="M9 13.5L8 21l4-2 4 2-1-7.5"/>',
    bank: '<path d="M3 9l9-5 9 5M5 10v8M9.5 10v8M14.5 10v8M19 10v8M3 20h18"/>',
    shield: '<path d="M12 3l8 3v6c0 4.5-3.4 8-8 9-4.6-1-8-4.5-8-9V6z"/>',
    file: '<path d="M6 3h8l4 4v14H6z"/><path d="M14 3v4h4M9 13h6M9 17h6"/>',
    rocket: '<path d="M14 4c3-1 6-1 6-1s0 3-1 6l-6 6-5-5zM8 10l-3 1-2 4 4-1M14 16l-1 3-4 2 1-4M15 9h.01"/>',
    chart: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
    alert: '<path d="M12 3l10 18H2z"/><path d="M12 10v5M12 18h.01"/>',
    leaf: '<path d="M5 19c0-8 5-14 15-14 0 10-6 15-14 15M5 19l7-7"/>',
    wallet: '<rect x="3" y="6" width="18" height="14" rx="2"/><path d="M16 13h.01M3 10h18"/>',
    growth: '<path d="M3 17l6-6 4 4 8-8M15 7h6v6"/>',
    gauge: '<path d="M4 18a8 8 0 1 1 16 0"/><path d="M12 18l4-6"/>',
    building: '<rect x="5" y="3" width="14" height="18" rx="1"/><path d="M9 7h2M13 7h2M9 11h2M13 11h2M9 15h2M13 15h2"/>',
    store: '<path d="M4 9l1.5-5h13L20 9M4 9h16v11H4zM9 20v-6h6v6"/>',
    handshake: '<path d="M3 12l4-4 5 3 5-3 4 4-9 7z"/><path d="M8 13l3 3"/>',
    briefcase: '<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M9 7V4h6v3M3 13h18"/>',
    box: '<path d="M3 7l9-4 9 4v10l-9 4-9-4z"/><path d="M3 7l9 4 9-4M12 11v10"/>',
    ship: '<path d="M3 15l9 4 9-4-2-6H5zM12 3v6"/>',
    cart: '<circle cx="9" cy="20" r="1.5"/><circle cx="18" cy="20" r="1.5"/><path d="M2 3h3l3 12h11l2-8H6"/>',
    monitor: '<rect x="3" y="4" width="18" height="12" rx="2"/><path d="M8 20h8M12 16v4"/>',
    message: '<path d="M4 5h16v11H8l-4 4z"/>',
    factory: '<path d="M3 21V10l6 4V10l6 4V6l6 3v12z"/>',
    key: '<circle cx="8" cy="12" r="4"/><path d="M12 12h9M18 12v3M21 12v3"/>',
    flame: '<path d="M12 3c1 4 6 6 6 11a6 6 0 0 1-12 0c0-3 2-4 2-7 2 1 3 3 3 5 1-3 0-6 1-9z"/>',
    flask: '<path d="M9 3h6M10 3v6L4 19a1.5 1.5 0 0 0 1.3 2h13.4A1.5 1.5 0 0 0 20 19L14 9V3"/>',
    map: '<path d="M9 4L3 6v14l6-2 6 2 6-2V4l-6 2z"/><path d="M9 4v14M15 6v14"/>'
  };
  const OPT = {
    profit: "rupee", nonprofit: "heart", one: "user", two_to_six: "users", seven_plus: "users",
    resident: "home", nri: "plane", nri_all: "plane", foreign_national: "globe", foreign_all: "globe",
    ca_cs_cma: "calc", advocate: "scale", other_regulated: "badge", nbfc: "bank", insurance: "shield", other_licensed: "file",
    investment: "globe", contribution: "heart", bank: "bank", vc: "rocket", public: "chart",
    yes: "check", no: "x", unsure: "question", up_to_50: "users", "51_200": "users", over_200: "building",
    critical: "alert", preferred: "shield", acceptable: "leaf", lt_25L: "chart", "25L_2cr": "chart", gt_2cr: "chart",
    withdraw: "wallet", retain: "growth", low: "gauge", moderate: "gauge", high: "gauge",
    sell: "handshake", succession: "users", startup: "rocket", professional: "briefcase", small: "store",
    g: "box", s: "briefcase", b: "box", lt20: "chart", "20_40": "chart", "40_150": "chart", "150_500": "chart", gt500: "chart",
    import: "ship", export: "plane", marketplace: "cart", website: "monitor", sms: "message", govt: "building",
    "1_9": "users", "10_19": "users", "20_49": "users", "50p": "building", own: "home", rent: "key", relative: "key", factory: "factory", home: "home",
    y: "check", n: "x", h: "flask", x: "flame", some: "users"
  };
  const QDEF = { practice: { none: "check" }, foreign: { none: "home" }, workforce: { none: "user" }, trade: { none: "home" }, plant: { b: "flame" }, activities: {}, high: "gauge" };
  const icon = (q, v) => { const k = (QDEF[q.id] && QDEF[q.id][v]) || (q.id === "credibility" ? (v === "high" ? "building" : "store") : null) || (q.id === "activities" ? (v === "n" ? "x" : "file") : null) || OPT[v] || "file"; return `<span class="aq-ico" aria-hidden="true"><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${P[k] || P.file}</svg></span>`; };

  /* ---------- rule references → tooltip ---------- */
  const REF = /\s*\(((?:R-\d{3}[^)]*)|(?:factor F\d{2}[^)]*))\)/g;
  function splitRefs(text) { const refs = []; const clean = String(text || "").replace(REF, (m, r) => { refs.push(r); return ""; }).replace(/\s+\./g, ".").trim(); return { clean, refs }; }

  /* ---------- progress persistence ---------- */
  let restoring = false, savedOnce = false;
  function save() {
    if (restoring) return;
    if (!Object.keys(state.answers || {}).some(k => !k.startsWith("__"))) { store.del(); return; }
    const ok = store.set({ v: 2, answers: state.answers, i: state.i, done: !!(state.rec && state.rec.key), at: Date.now() });
    if (ok && !savedOnce) { savedOnce = true; const s = $("aqSaved"); if (s) s.hidden = false; }
  }
  function valid(q, v) {
    if (v === undefined) return false;
    const choices = (q.opts || []).map(o => o[0]);
    return q.type === "multi" ? Array.isArray(v) && v.length && v.every(x => choices.includes(x)) : choices.includes(v);
  }
  function restore() {
    const d = store.get(); if (!d || d.v !== 2 || !d.answers || !Object.keys(d.answers).some(k => !k.startsWith("__"))) return false;
    restoring = true;
    try {
      const a = {};
      Object.keys(d.answers).filter(k => k.startsWith("__ask_")).forEach(k => { a[k] = !!d.answers[k]; });
      state.answers = a;
      for (const q of ALLQ) if (valid(q, d.answers[q.id])) a[q.id] = d.answers[q.id];  // in order, so dependent option lists resolve
      const vis = ALLQ.map((q, i) => i).filter(i => !qSkipped(ALLQ[i], a));
      const firstOpen = vis.find(i => a[ALLQ[i].id] === undefined);
      if (d.done && firstOpen === undefined) { restoring = false; generate(); return true; }
      state.i = firstOpen !== undefined ? firstOpen : (vis.includes(d.i) ? d.i : vis[0] || 0);
      renderQuestion();
      const s = $("aqSaved"); if (s) { s.hidden = false; s.textContent = "Welcome back: we restored your saved answers."; }
      return true;
    } catch (e) { return false; } finally { restoring = false; }
  }
  function clear() { store.del(); savedOnce = false; }

  /* ---------- decorate each rendered question ---------- */
  let lastIndex = -1, autoTimer = null;
  function decorate() {
    const q = ALLQ[state.i]; if (!q) return;
    const card = document.querySelector(".assess-card");
    // transition direction
    const dir = state.i >= lastIndex ? "fwd" : "back"; lastIndex = state.i;
    const qEl = $("question"); qEl.classList.remove("aq-in-fwd", "aq-in-back"); void qEl.offsetWidth; if (!reduce()) qEl.classList.add("aq-in-" + dir);
    // why-we-ask + rule references
    const descEl = qEl.querySelector(".q-desc");
    const { clean, refs } = splitRefs(q.desc);
    const info = q.info || "";
    $("aqWhy").textContent = clean;
    if (descEl) descEl.outerHTML = `<details class="aq-why-m"><summary>Why we ask this</summary><p>${escapeHtml(clean)}</p></details>`;
    const title = qEl.querySelector(".q-title");
    if (title && info) { title.insertAdjacentHTML("beforeend", ` <span class="aq-info"><button type="button" class="aq-info-btn" aria-label="Legal basis for this question" aria-describedby="aqTip">i</button><span role="tooltip" id="aqTip" class="aq-tip">${escapeHtml(info)}</span></span>`); }
    // icons + numbers on option cards
    qEl.querySelectorAll(".option").forEach((o, i) => {
      if (!o.querySelector(".aq-ico")) o.insertAdjacentHTML("afterbegin", icon(q, o.dataset.v));
      if (i < 9) o.insertAdjacentHTML("beforeend", `<kbd class="aq-num" aria-hidden="true">${i + 1}</kbd>`);
      if (q.type !== "multi") o.addEventListener("click", () => scheduleAdvance(q), { once: false });
      else o.addEventListener("click", save);
    });
    const sel = $("selq"); if (sel) sel.addEventListener("change", () => { save(); });
    // rail progress
    const vis = ALLQ.map((x, i) => i).filter(i => !qSkipped(ALLQ[i], state.answers)), pos = Math.max(0, vis.indexOf(state.i)), left = vis.filter(i => i > state.i).length;
    $("aqBar").style.width = Math.round(pos / Math.max(1, vis.length) * 100) + "%";
    const mins = Math.max(1, Math.ceil((left + 1) * SECS_PER_Q / 60));
    $("aqLeft").textContent = left ? `About ${left} question${left > 1 ? "s" : ""} left · ~${mins} min` : "Last question · under a minute";
    card.setAttribute("aria-labelledby", "aqQTitle"); if (title) title.id = "aqQTitle";
    save();
  }
  function scheduleAdvance(q) {
    clearTimeout(autoTimer);
    save();
    if (q.id === "objective" || ALLQ[state.i] !== q) return;           // first question: let people read the result of their choice
    autoTimer = setTimeout(() => { if (ALLQ[state.i] === q && state.answers[q.id] !== undefined && !document.querySelector("#qMsg .warnbox")) $("nextQ").click(); }, reduce() ? 120 : 380);
  }

  /* ---------- analysing moment ---------- */
  function analyseThen(fn) {
    const box = document.createElement("div");
    box.className = "aq-analyse"; box.setAttribute("role", "status"); box.setAttribute("aria-live", "polite");
    const steps = ["Applying 25 legal rules", "Scoring 9 weighted factors", "Matching 120 registrations to your profile", "Building your compliance calendar"];
    box.innerHTML = `<div class="aq-an-card"><div class="aq-an-seal" aria-hidden="true"></div><h2>Analysing your answers</h2><ol>${steps.map(s => `<li>${s}</li>`).join("")}</ol></div>`;
    document.body.appendChild(box);
    const items = box.querySelectorAll("li"), step = reduce() ? 60 : 380;
    items.forEach((li, i) => setTimeout(() => li.classList.add("done"), step * (i + 1)));
    setTimeout(() => { try { fn(); } finally { box.classList.add("out"); setTimeout(() => box.remove(), reduce() ? 0 : 260); save(); } }, step * (items.length + 1));
  }

  /* ---------- keyboard ---------- */
  document.addEventListener("keydown", ev => {
    if (document.getElementById("assessment").classList.contains("hidden")) return;
    if (ev.altKey || ev.ctrlKey || ev.metaKey) return;
    const t = ev.target, typing = t && (t.tagName === "INPUT" || t.tagName === "SELECT" || t.tagName === "TEXTAREA" || t.isContentEditable);
    if (typing || document.querySelector("dialog[open]")) return;
    if (/^[1-9]$/.test(ev.key)) { const o = document.querySelectorAll("#question .option")[+ev.key - 1]; if (o) { ev.preventDefault(); o.click(); o.focus(); } return; }
    if (ev.key === "Enter" && !(t && t.classList && t.classList.contains("option")) && !(t && t.tagName === "BUTTON")) { ev.preventDefault(); $("nextQ").click(); return; }
    if (ev.key === "Backspace") { ev.preventDefault(); $("prevQ").click(); }
  });

  document.addEventListener("DOMContentLoaded", () => {
    const base = renderQuestion;
    renderQuestion = function () { base.apply(this, arguments); decorate(); };
    $("nextQ").addEventListener("click", () => clearTimeout(autoTimer), true);
    if (!restore()) renderQuestion();
  });
  window.addEventListener("pagehide", save);
  window.analyseThen = analyseThen;
  window.BizAssess = Object.freeze({ save, restore, clear });
})();
