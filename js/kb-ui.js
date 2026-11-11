/* Dashboard tabs driven by the BizMatrix knowledge base (js/kb.js). Loaded after preview.js and app.js;
   these declarations replace the earlier render functions of the same names. */
const KBU = { done: {}, regDone: {}, actDone: {}, regFilter: "all", regQuery: "" };
const TAGS = { L: ["Law", "tg-l"], P: ["Portal practice", "tg-p"], C: ["Commonly asked", "tg-c"], U: ["Verify", "tg-u"] };
const LEVEL = { mandatory: ["Mandatory", "m2"], triggered: ["Applies to you", "m1"], watch: ["Watch threshold", "m3"], recommended: ["Recommended", "m3"] };
const esc = s => escapeHtml(s == null ? "" : String(s));
const portalLink = p => { const m = String(p || "").match(/([a-z0-9-]+\.)+(gov\.in|nic\.in|org|in|com)(\/[^\s,;)]*)?/i); return m ? `<a href="https://${m[0]}" target="_blank" rel="noopener">${esc(m[0])}</a>` : esc(p); };
const lockLine = () => AccessProvider.isPremium() ? "" : `<span class="kb-lock" title="Included in the full report">🔒 Full report</span>`;

function kbKey() { return state.rec && state.rec.key; }

/* ---------------- Documents ---------------- */
KBU.docTag = KBU.docTag || "all"; KBU.docQuery = KBU.docQuery || "";
function renderDocs() {
  const key = kbKey(), d0 = KB.documents(key, state.answers), dq = KBU.docQuery.trim().toLowerCase();
  const d = Object.assign({}, d0, { docs: d0.docs.filter(x => (KBU.docTag === "all" || (KBU.docTag === "todo" ? !KBU.done[x.id] : x.tag === KBU.docTag)) && (!dq || (x.name + " " + x.who + " " + x.cat).toLowerCase().includes(dq))) });
  const g = KB.gate(d.docs);
  const byStep = new Map(d.steps.map(s => [s.id, { s, docs: [] }]));
  g.visible.forEach(x => { (byStep.get(x.step) || byStep.set(x.step, { s: { id: x.step, stage: x.cat, text: "" }, docs: [] }).get(x.step)).docs.push(x); });
  state.docs = {}; g.visible.forEach(x => { state.docs[x.id] = !!KBU.done[x.id]; });
  const summ = Object.entries(d.summary || {}).map(([k, v]) => `<div class="kb-fact"><span>${esc(k)}</span><b>${esc(v)}</b></div>`).join("");
  document.getElementById("documents").innerHTML =
    `<div class="kb-facts">${summ}</div>` +
    `<div class="cx-tools"><div class="cx-chips" role="group" aria-label="Filter documents">${[["all", "All"], ["todo", "Still to collect"], ["L", "Law"], ["P", "Portal practice"], ["C", "Commonly asked"], ["U", "Verify"]].map(([v, t]) => `<button type="button" class="cx-chip${KBU.docTag === v ? " on" : ""}" data-dt="${v}" aria-pressed="${KBU.docTag === v}">${t}</button>`).join("")}</div><label class="cx-search"><span class="sr-only">Search documents</span><input type="search" id="dxQ" placeholder="Search documents" value="${esc(KBU.docQuery)}"></label></div>` +
    `<p class="preview-count">${AccessProvider.isPremium() ? "Full checklist" : "35% free preview"}: ${g.visible.length} of ${g.total} documents for your profile · Tags: <span class="tg tg-l">Law</span> <span class="tg tg-p">Portal practice</span> <span class="tg tg-c">Commonly asked</span> <span class="tg tg-u">Verify</span></p>` +
    [...byStep.values()].filter(({ docs }) => docs.length || (KBU.docTag === "all" && !dq)).map(({ s, docs }) => `<div class="kb-step"><div class="kb-step-h"><span class="kb-step-n">${esc(s.id)}</span><div><h4>${esc(s.stage)}</h4><p>${esc(s.text)}</p></div></div>${docs.length ? docs.map(x => `<label class="kb-doc${KBU.done[x.id] ? " done" : ""}"><input type="checkbox" data-kdoc="${x.id}"${KBU.done[x.id] ? " checked" : ""}><span><b>${esc(x.name)}</b> <span class="tg ${TAGS[x.tag] ? TAGS[x.tag][1] : ""}">${TAGS[x.tag] ? TAGS[x.tag][0] : esc(x.tag)}</span>${x.mandatory ? "" : ' <span class="tg tg-o">If applicable</span>'}<small>${esc(x.who)}${x.trigger ? " · When: " + esc(x.trigger) : ""}</small>${x.detail && x.detail.notes ? `<small class="kb-d">${esc(x.detail.notes)}</small>` : ""}</span></label>`).join("") : `<p class="kb-empty">${g.locked ? "Documents for this step are in the full report." : "No separate documents for this step."}</p>`}</div>`).join("") +
    BlurredLock(`<div class="kb-step"><div class="kb-step-h"><div><h4>Remaining documents</h4></div></div>${g.hidden.map(x => `<label class="kb-doc"><input type="checkbox" disabled tabindex="-1"><span><b>${esc(x.name)}</b> <small>${esc(x.who)}</small></span></label>`).join("")}</div>`, g.locked, "documents");
  updateDocs();
  document.querySelectorAll("[data-dt]").forEach(b => b.onclick = () => { KBU.docTag = b.dataset.dt; renderDocs(); });
  const dqi = document.getElementById("dxQ"); dqi.oninput = () => { KBU.docQuery = dqi.value; const p = dqi.selectionStart; renderDocs(); const n = document.getElementById("dxQ"); n.focus(); n.setSelectionRange(p, p); };
  document.querySelectorAll("[data-kdoc]").forEach(i => i.onchange = () => { KBU.done[i.dataset.kdoc] = i.checked; state.docs[i.dataset.kdoc] = i.checked; i.closest(".kb-doc").classList.toggle("done", i.checked); updateDocs(); });
}

/* ---------------- Compliance (Phase 5: filter tiles, search, grouped expandable list) ---------------- */
const KIND_LABEL = { once: "One-time (first year)", monthly: "Monthly", quarterly: "Quarterly", "half-yearly": "Half-yearly", annual: "Annual", event: "Event-based" };
const STATUS = { VP: ["Verified", "Checked against an official government source."], VS: ["Secondary source", "Confirmed through reputable secondary sources citing the notification; primary text not opened."], UV: ["Confirm at portal", "Established position from the governing law, not re-verified in this compilation. Confirm on the named portal before relying on it."] };
const PERIODS = [["before", "Before incorporation", "Do these before or while you file to form the entity."], ["first30", "First 30 days", "Right after incorporation or before you start trading."], ["firstyear", "First year", "Setup items with longer windows, thresholds or continuing duties."], ["recurring", "Recurring", "Monthly, quarterly, annual and event-based filings."]];
function compPeriod(r) {
  if (r.part !== "initial") return "recurring";
  const t = ((r.detail && r.detail.due) || "") + " | " + r.title;
  if (/before any mca|name valid|one-time at formation|^continuous|name reservation|digital signature|incorporation: e-moa|minimum members/i.test(t)) return "before";
  if (/within (15|30) days|immediately|before (business starts|first|starting|commencement)|within 1 month/i.test(t)) return "first30";
  return "firstyear";
}
KBU.compFilter = KBU.compFilter || "all"; KBU.compQuery = KBU.compQuery || "";
function renderCompliance() {
  const sel = document.getElementById("compFilter"); if (sel) sel.hidden = true;
  const all = KB.compliances(kbKey(), state.answers);
  const counts = { all: all.length, initial: all.filter(r => r.part === "initial").length };
  ["monthly", "quarterly", "half-yearly", "annual", "event"].forEach(k => { counts[k] = all.filter(r => r.part === "annual" && r.kind === k).length; });
  const f = KBU.compFilter, q = KBU.compQuery.trim().toLowerCase();
  const list = all.filter(r => (f === "all" || (f === "initial" ? r.part === "initial" : r.part === "annual" && r.kind === f))
    && (!q || (r.title + " " + (r.detail ? [r.detail.form, r.detail.law, r.detail.authority, r.detail.applicability].join(" ") : "")).toLowerCase().includes(q)));
  const g = KB.gate(list);
  const tiles = [["all", "All"], ["initial", "First-year setup"], ["monthly", "Monthly"], ["quarterly", "Quarterly"], ["half-yearly", "Half-yearly"], ["annual", "Annual"], ["event", "Event-based"]].filter(([k]) => k === "all" || counts[k]);
  const row = r => {
    const d = r.detail, st = d && STATUS[d.status];
    if (!d) return `<div class="cx-row cx-locked"><div class="cx-sum"><span class="cx-title">${esc(r.title)}</span><span class="cx-when">${esc(KIND_LABEL[r.kind] || r.freq)}</span><span class="cx-applies">${lockLine()}</span></div></div>`;
    return `<details class="cx-row"><summary class="cx-sum"><span class="cx-title">${esc(r.title)}<small class="cx-freq">${esc(KIND_LABEL[r.kind] || r.freq)}</small></span><span class="cx-when"><span class="cx-lab">When</span>${esc(d.due)}</span><span class="cx-applies"><span class="cx-lab">Applies if</span>${esc(d.applicability)}</span><span class="cx-chev" aria-hidden="true"></span></summary>
      <div class="cx-body"><div><span class="cx-lab">Form</span>${esc(d.form || "—")}</div><div><span class="cx-lab">Law</span>${esc(d.law || "—")}</div><div><span class="cx-lab">If missed</span>${esc(d.penalty || "—")}</div><div><span class="cx-lab">Authority / portal</span>${portalLink(d.source || d.authority)}</div></div></details>`;
  };
  let groups = "";
  for (const [k, title, sub] of PERIODS) {
    const rows = g.visible.filter(r => compPeriod(r) === k);
    if (!rows.length) continue;
    groups += `<section class="cx-group"><div class="cx-gh"><h3>${title} <span class="num">(${rows.length})</span></h3><p>${sub}</p></div>${rows.map(row).join("")}</section>`;
  }
  document.getElementById("compliance").innerHTML =
    `<div class="cx-top"><span class="cx-badge">Compliance Intelligence Baseline verified to 5 October 2026</span><span class="cx-badge">Compliance Master: law as of 6 Nov 2026</span></div>
    <div class="cx-tiles" role="group" aria-label="Filter by frequency">${tiles.map(([k, t]) => `<button type="button" class="cx-tile${f === k ? " on" : ""}" data-cf="${k}" aria-pressed="${f === k}"><b class="num">${counts[k]}</b><span>${t}</span></button>`).join("")}</div>
    <div class="cx-tools"><label class="cx-search"><span class="sr-only">Search compliances</span><input type="search" id="cxQ" placeholder="Search by name, form or law" value="${esc(KBU.compQuery)}"></label>
      </div>
    <p class="preview-count">${AccessProvider.isPremium() ? "Full compliance list" : "35% free preview"}: ${g.visible.length} of ${g.total} obligations${f !== "all" || q ? " matching your filter" : " that apply to your profile"}. Tap a row for form, law, penalty and portal.</p>
    <p class="cx-note">Due dates are statutory as verified on ${BizEngine.VERIFIED}; authorities often extend them by circular. Confirm on the official portal before you file.</p>
    ${groups || '<p class="empty-preview">No obligations match this filter.</p>'}
    ${BlurredLock(g.hidden.map(row).join(""), g.locked, "compliance obligations")}`;
  document.querySelectorAll("[data-cf]").forEach(b => b.onclick = () => { KBU.compFilter = b.dataset.cf; renderCompliance(); });
  const qi = document.getElementById("cxQ"); qi.oninput = () => { KBU.compQuery = qi.value; const p = qi.selectionStart; renderCompliance(); const n = document.getElementById("cxQ"); n.focus(); n.setSelectionRange(p, p); };
}

/* ---------------- Registrations ---------------- */
function renderRegs() {
  const key = kbKey(), regs = KB.registrations(key, state.answers), $ = id => document.getElementById(id);
  const count = l => regs.filter(r => r.level === l).length, mand = regs.filter(r => r.level === "mandatory" || r.level === "triggered");
  const got = mand.filter(r => KBU.regDone[r.id]).length;
  $("navReg").textContent = mand.length;
  $("rgProf").innerHTML = "<b>Profile used:</b> " + [ENTITIES[key].name, ...REGQ.filter(q => !qSkipped(q, state.answers)).map(q => optionLabel(q, state.answers[q.id]))].filter(x => x && x !== "—").map(x => `<span class="ch">${esc(x)}</span>`).join("");
  $("rgKpi").innerHTML = [["mandatory", "Mandatory for your entity"], ["triggered", "Triggered by your answers"], ["recommended", "Recommended"]].map(([l, t]) => `<button type="button" class="card rk k${l === "mandatory" ? 2 : l === "triggered" ? 1 : 3}" data-kf="${l}"><span>${t}</span><b>${count(l)}</b></button>`).join("") + `<div class="card rk k4"><span>Readiness</span><b>${mand.length ? Math.round(got / mand.length * 100) : 0}%</b><small>${got} of ${mand.length} required obtained</small></div>`;
  const total = regs.length || 1;
  $("rgBar").innerHTML = [["mandatory", "m2"], ["triggered", "m1"], ["recommended", "m3"]].map(([l, c]) => `<i class="${c}" style="width:${count(l) / total * 100}%"></i>`).join("");
  $("rgChips").innerHTML = [["all", "All"], ["mandatory", "Mandatory"], ["triggered", "Applies to you"], ["recommended", "Recommended"]].map(([v, t]) => `<button type="button" data-kreg="${v}" class="${KBU.regFilter === v ? "on" : ""}" aria-pressed="${KBU.regFilter === v}">${t}</button>`).join("");
  const q = KBU.regQuery.toLowerCase();
  const filtered = regs.filter(r => (KBU.regFilter === "all" || r.level === KBU.regFilter || (KBU.regFilter === "recommended" && r.level === "watch")) && (!q || (r.name + " " + r.cat + " " + r.why).toLowerCase().includes(q)));
  const g = KB.gate(filtered);
  const card = r => `<div class="oc kb-reg v${r.level === "mandatory" ? 2 : r.level === "triggered" ? 1 : 3}${KBU.regDone[r.id] ? " dn" : ""}"><div class="oh"><span class="no">${esc(r.id)}</span><h3>${esc(r.name)}</h3><span class="b ${LEVEL[r.level][1]}">${LEVEL[r.level][0]}</span></div><p class="why"><b>Why:</b> ${esc(r.why)}.</p>${r.detail ? `<details class="kb-more"><summary>Authority, portal, timing and penalty</summary><div class="kb-grid"><div><span>Authority</span>${esc(r.detail.authority)}</div><div><span>Portal</span>${portalLink(r.detail.portal)}</div><div><span>When</span>${esc(r.detail.timeline || r.detail.validity || "")}</div><div><span>Law</span>${esc(r.detail.statute)}</div>${r.detail.fee ? `<div><span>Fee (approx.)</span>${esc(r.detail.fee)}</div>` : ""}${r.detail.penalty ? `<div><span>If missed</span>${esc(r.detail.penalty)}</div>` : ""}<div class="kb-wide"><span>Trigger / threshold</span>${esc(r.detail.trigger)} ${/V/.test(r.detail.tag || "") ? '<span class="tg tg-u">Verify</span>' : '<span class="tg tg-l">Confirmed</span>'}</div></div></details>` : `<p>${lockLine()}</p>`}<div class="ft"><span>${esc(r.cat)}</span><button class="rdone${KBU.regDone[r.id] ? " on" : ""}" data-kregd="${r.id}">${KBU.regDone[r.id] ? "✓ Obtained" : "Mark as obtained"}</button></div></div>`;
  let html = `<p class="preview-count">${AccessProvider.isPremium() ? "Full registration plan" : "35% free preview"}: ${g.visible.length} of ${g.total} registrations for your profile.</p>`;
  for (const l of ["mandatory", "triggered", "watch", "recommended"]) { const rows = g.visible.filter(r => r.level === l); if (rows.length) html += `<h2 class="gh">${LEVEL[l][0]} (${rows.length})</h2><div class="og">${rows.map(card).join("")}</div>`; }
  if (!filtered.length) html += '<p class="empty-preview">No registrations match these filters.</p>';
  $("rgOut").innerHTML = html + BlurredLock(`<div class="og">${g.hidden.map(card).join("")}</div>`, g.locked, "registrations");
  $("rgChips").querySelectorAll("[data-kreg]").forEach(b => b.onclick = () => { KBU.regFilter = b.dataset.kreg; renderRegs(); });
  $("rgKpi").querySelectorAll("[data-kf]").forEach(b => b.onclick = () => { KBU.regFilter = b.dataset.kf; renderRegs(); });
  $("rgOut").querySelectorAll("[data-kregd]").forEach(b => b.onclick = () => { KBU.regDone[b.dataset.kregd] = !KBU.regDone[b.dataset.kregd]; renderRegs(); });
  const qi = $("rgQ"); qi.oninput = () => { KBU.regQuery = qi.value; const pos = qi.selectionStart; renderRegs(); qi.focus(); qi.setSelectionRange(pos, pos); };
  kbSnap(regs);
}
function kbSnap(regs) {
  const key = kbKey(), s = KB.summary(key, state.answers), an = state.answers;
  const next = s.next[0];
  document.getElementById("snap").innerHTML = [[2, "Mandatory registrations", s.regsMandatory, "For a " + ENTITIES[key].name], [1, "Triggered by your answers", s.regsTriggered, "Licences and thresholds"], [4, "Documents to collect", s.docs, s.docsMandatory + " always required"], [3, "First-year compliances", s.compInitial, "+ " + s.compAnnual + " recurring"]].map(([k, t, v, sub]) => `<div class="card rk k${k}" data-jump="${k === 4 ? "documents" : k === 3 ? "compliance" : "registrations"}"><span>${t}</span><b>${v}</b><small>${esc(sub)}</small></div>`).join("");
  const sector = (REGQ[0].opts.find(o => o[0] === an.sector) || [])[1];
  document.getElementById("heroPills").innerHTML = [sector, an.state, s.regsMandatory + s.regsTriggered + " registrations to obtain"].filter(Boolean).map(x => `<span class="pill">${esc(x)}</span>`).join("");
  if (next) document.getElementById("heroPills").innerHTML += `<span class="pill">Next: ${esc(next.title)}</span>`;
}

/* ---------------- Action plan ---------------- */
function renderAction() {
  const plan = KB.actionPlan(kbKey(), state.answers), g = KB.gate(plan.map(p => ({ ...p, detail: true })));
  const byPhase = {}; g.visible.forEach(p => (byPhase[p.phase] = byPhase[p.phase] || []).push(p));
  const done = plan.filter((p, i) => KBU.actDone[p.phase + p.title]).length;
  document.getElementById("actionPlan").innerHTML =
    `<div class="kb-plan-head"><div><b>${plan.length}</b> actions in 6 phases · <b>${plan.filter(p => p.priority === "Critical").length}</b> critical</div><div class="kb-prog"><i style="width:${plan.length ? done / plan.length * 100 : 0}%"></i></div><small>${done} done</small></div>` +
    Object.keys(KB.PHASES).filter(k => byPhase[k]).map(k => `<section class="kb-phase"><div class="kb-phase-h"><span>${k}</span><div><h3>${KB.PHASES[k][0]}</h3><small>${KB.PHASES[k][1]}</small></div></div>${byPhase[k].map(p => { const id = p.phase + p.title; return `<label class="kb-act${KBU.actDone[id] ? " done" : ""}"><input type="checkbox" data-kact="${esc(id)}"${KBU.actDone[id] ? " checked" : ""}><div><div class="kb-act-t"><b>${esc(p.title)}</b><span class="pri pri-${p.priority.toLowerCase()}">${p.priority}</span></div><p>${esc(p.text)}</p><small>⏱ ${esc(p.when)} · 👤 ${esc(p.owner)}${p.ref ? " · Ref " + esc(p.ref) : ""}</small></div></label>`; }).join("")}</section>`).join("") +
    BlurredLock(g.hidden.map(p => `<div class="kb-act"><input type="checkbox" disabled tabindex="-1"><div><div class="kb-act-t"><b>${esc(p.title)}</b><span class="pri pri-${p.priority.toLowerCase()}">${p.priority}</span></div><p>${esc(p.text)}</p><small>${esc(p.when)} · ${esc(p.owner)}</small></div></div>`).join(""), g.locked, "action steps");
  document.querySelectorAll("[data-kact]").forEach(i => i.onchange = () => { KBU.actDone[i.dataset.kact] = i.checked; renderAction(); });
}

/* keep "New assessment" clean */
(function () { const b = document.getElementById("newBtn"); const o = b.onclick; b.onclick = function () { o.call(this); if (!state.rec) { KBU.done = {}; KBU.regDone = {}; KBU.actDone = {}; KBU.regFilter = "all"; KBU.regQuery = ""; } }; })();
