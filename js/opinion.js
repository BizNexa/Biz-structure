/* "The Advisory Opinion" — first viewport of the results dashboard.
   Presentation only: every figure comes from BizEngine, KB and ENTITIES; no legal text is rewritten. */
(function () {
  "use strict";
  const $ = id => document.getElementById(id), e2 = s => escapeHtml(s == null ? "" : String(s));
  // Display-only headline rates, verbatim from the BizMatrix comparison matrix v1.0 ("Base income-tax rate" row).
  const TAX_HEADLINE = { sole: "Slab (0–30%)", partnership: "30%", llp: "30%", opc: "22% (s.200)", private_limited: "22% (s.200)", public_limited: "22% (s.200)", section8: "Exempt if registered" };
  const SPEC = [["liability", "Liability"], ["compliance", "Compliance load"], ["legal", "Legal status"], ["members", "Membership"], ["ownership", "Ownership"], ["funding", "Funding"], ["audit", "Audit"], ["tax", "Tax"]];
  const reduce = () => window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;

  function lostOn(R) {
    if (!R.breakdown || !R.runner_up) return null;
    const a = R.breakdown[R.verdict], b = R.breakdown[R.runner_up];
    let best = null;
    BizEngine.FACTORS.forEach(f => { const gap = (a[f.id] - b[f.id]) / 10; if (!best || gap > best.gap) best = { gap, f }; });
    return best && best.gap > 0 ? best : null;
  }

  function countUp(root) {
    if (reduce()) return;
    root.querySelectorAll("[data-count]").forEach(el => {
      const end = parseFloat(el.dataset.count), dec = el.dataset.count.includes(".") ? 1 : 0, t0 = performance.now(), d = 700;
      const tick = t => { const p = Math.min(1, (t - t0) / d), v = end * (1 - Math.pow(1 - p, 3)); el.textContent = v.toFixed(dec); if (p < 1) requestAnimationFrame(tick); };
      el.textContent = (0).toFixed(dec); requestAnimationFrame(tick);
    });
  }

  function render() {
    const host = $("opinion"), key = state.rec && state.rec.key;
    if (!key) { host.hidden = true; document.querySelector(".content").classList.remove("adv"); return; }
    const e = ENTITIES[key], A = state.answers, R = state.rec.engine, only = state.rec.confidence === "only eligible structure";
    const s = KB.summary(key, A), docs = KB.documents(key, A), plan = KB.actionPlan(key, A);
    const drv = getPreviewItems(drivers(A, key), "drivers");
    const lost = lostOn(R), flags = reviewFlags();
    const regsTotal = s.regsMandatory + s.regsTriggered;
    const next = s.next[0];
    const steps = docs.steps;
    const first = steps[0] ? steps[0].stage : "Prepare";
    const reg = steps.length > 1 ? steps.slice(1).map(x => x.stage) : [];
    const spec = summaryPreview(e);
    const rows = SPEC.map(([f, label]) => {
      const vis = spec.visibleItems.some(x => x[1] === e[f]) || AccessProvider.isPremium();
      return { f, label, val: e[f], vis };
    });
    const visibleRows = rows.filter(r => r.vis && r.val), lockedRows = rows.length - visibleRows.length;
    const conf = confidenceLabel();
    const asm = assumptions(A);

    host.innerHTML = `
      <div class="op-memo">
        <div class="op-verdict">
          <p class="op-eyebrow">Our recommendation</p>
          <h1 class="op-name">${e2(e.name)}</h1>
          <p class="op-fit">${e2(e.best)}</p>
          <div class="op-seal-row">
            <div class="op-seal" role="img" aria-label="${only ? "Only eligible structure" : `Fit score ${state.rec.fit} out of 100`}"><div>${only ? `<b class="op-only">Only</b><small>ELIGIBLE</small>` : `<b class="num" data-count="${state.rec.fit}">${state.rec.fit}</b><small>FIT / 100</small>`}</div></div>
            <div class="op-seal-txt"><strong>${e2(conf)}</strong>${only ? "No other structure passes the legal hard rules for your answers." : `<span class="num">${state.rec.margin}</span> points ahead of the runner-up.`}</div>
          </div>
          <div class="op-cta">
            ${next ? `<button class="btn op-next" type="button" data-jump="action">Next: ${e2(next.title)} →</button>` : ""}
            <button class="btn" type="button" data-jump="compliance">View compliance</button>
            <button class="op-link" type="button" data-jump="documents">Prepare documents</button>
          </div>
        </div>
        <aside class="op-reasons" aria-labelledby="opWhy">
          <p class="op-eyebrow" id="opWhy">Why this result</p>
          <ol class="op-list">${drv.visibleItems.map(t => `<li>${e2(t)}</li>`).join("")}</ol>
          ${drv.remainingCount ? BlurredLock(`<ol class="op-list" start="${drv.visibleItems.length + 1}">${drivers(A, key).slice(drv.visibleItems.length).map(t => `<li>${e2(t)}</li>`).join("")}</ol>`, drv.remainingCount, drv.remainingCount > 1 ? "reasons" : "reason") : ""}
          ${R.runner_up ? `<div class="op-runner"><div><span>Runner-up: ${e2(BizEngine.NAME[R.runner_up])}</span><span class="num">${R.ranking[1][1].toFixed(1)}</span></div>${lost ? `<div><span>Lost most ground on</span><span>${e2(lost.f.name)} <span class="num">(−${lost.gap.toFixed(1)})</span></span></div>` : ""}</div>` : ""}
          ${flags.length ? `<p class="op-flag"><b>Talk to a professional:</b> ${flags.length} point${flags.length > 1 ? "s" : ""} depend on your specific facts (${flags.map(e2).join(", ")}).</p>` : ""}
        </aside>
      </div>
      <nav class="op-road" aria-label="Filing roadmap">
        <p class="op-eyebrow">Your filing roadmap</p>
        <ol class="op-steps">
          <li><button type="button" class="op-step now" data-jump="documents"><i>1</i><b>${e2(first)}</b><small>Week 0 · start here</small></button></li>
          <li><button type="button" class="op-step" data-jump="documents"><i>2</i><b>${reg.length ? (key === "sole" ? "Register the business" : key === "partnership" ? "Deed & registration" : "Incorporate") : "Register"}</b><small>${reg.length ? reg.length + " filing steps · weeks 1–3" : "Weeks 1–3"}</small></button></li>
          <li><button type="button" class="op-step" data-jump="registrations"><i>3</i><b>Registrations</b><span class="op-fig num" data-count="${regsTotal}">${regsTotal}</span><small class="num">${s.regsMandatory} mandatory + ${s.regsTriggered} triggered = ${regsTotal}</small></button></li>
          <li><button type="button" class="op-step" data-jump="documents"><i>4</i><b>Documents</b><span class="op-fig num" data-count="${s.docs}">${s.docs}</span><small class="num">${s.docsMandatory} always required</small></button></li>
          <li><button type="button" class="op-step" data-jump="compliance"><i>5</i><b>First-year compliance</b><span class="op-fig num" data-count="${s.compInitial}">${s.compInitial}</span><small class="num">+ ${s.compAnnual} recurring</small></button></li>
        </ol>
      </nav>
      <section class="op-spec" aria-labelledby="opSpec">
        <p class="op-eyebrow" id="opSpec">Entity profile</p>
        <dl>${visibleRows.map(r => r.f === "tax"
          ? `<div class="op-row"><dt>${r.label}</dt><dd><b class="num">${e2(TAX_HEADLINE[key] || "")}</b> base rate<sup><a href="#opTaxFn" aria-label="Tax footnote">1</a></sup></dd></div>`
          : `<div class="op-row"><dt>${r.label}</dt><dd>${e2(r.val)}</dd></div>`).join("")}</dl>
        ${visibleRows.some(r => r.f === "tax") ? `<p class="op-fn" id="opTaxFn"><sup>1</sup> ${e2(e.tax)}</p>` : ""}
        ${lockedRows && !AccessProvider.isPremium() ? BlurredLock(`<dl>${rows.filter(r => !(r.vis && r.val)).map(r => `<div class="op-row"><dt>${r.label}</dt><dd><span class="bm-skel-inline"></span></dd></div>`).join("")}</dl>`, lockedRows, lockedRows > 1 ? "profile items" : "profile item") : ""}
      </section>
      ${asm.length ? `<details class="op-asm"><summary><span class="op-eyebrow">Assumptions we made</span> <small>(${asm.length}) · tap to review or change</small></summary><ul>${asm.map(x => `<li><span>${e2(x.text)}</span><button type="button" class="op-link" data-change="${x.id}">Change</button></li>`).join("")}</ul></details>` : ""}`;
    host.hidden = false;
    document.querySelector(".content").classList.add("adv");
    host.querySelectorAll("[data-change]").forEach(b => b.addEventListener("click", () => changeAssumption(b.dataset.change)));
    host.classList.remove("op-in"); void host.offsetWidth; host.classList.add("op-in");
    countUp(host);
  }

  const baseDash = renderDashboard;
  renderDashboard = function () { baseDash.apply(this, arguments); render(); };
  const baseConflict = renderConflict;
  renderConflict = function () { baseConflict.apply(this, arguments); $("opinion").hidden = true; document.querySelector(".content").classList.remove("adv"); };

  // account menu
  const btn = $("acctBtn"), menu = $("acctMenu");
  const close = () => { menu.hidden = true; btn.setAttribute("aria-expanded", "false"); };
  btn.addEventListener("click", ev => { ev.stopPropagation(); const open = menu.hidden; menu.hidden = !open; btn.setAttribute("aria-expanded", String(open)); if (open) menu.querySelector("button:not(.hidden)").focus(); });
  menu.addEventListener("click", () => setTimeout(close, 0));
  document.addEventListener("click", ev => { if (!menu.hidden && !menu.contains(ev.target)) close(); });
  document.addEventListener("keydown", ev => { if (ev.key === "Escape" && !menu.hidden) { close(); btn.focus(); } });
  function changeAssumption(id) {
    state.answers["__ask_" + id] = true;
    const i = ALLQ.findIndex(q => q.id === id); if (i < 0) return;
    state.i = i;
    document.getElementById("dashboard").classList.add("hidden");
    document.getElementById("assessment").classList.remove("hidden");
    renderQuestion(); window.scrollTo({ top: 0 });
  }
  window.renderOpinion = render;
})();
