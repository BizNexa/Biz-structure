/* Dashboard tabs driven by the BizMatrix knowledge base (js/kb.js). Loaded after preview.js and app.js;
   these declarations replace the earlier render functions of the same names. */
const KBU = { done: {}, regDone: {}, actDone: {}, regFilter: "all", regQuery: "" };
const TAGS = { L: ["Law", "tg-l"], P: ["Portal practice", "tg-p"], C: ["Commonly asked", "tg-c"], U: ["Verify", "tg-u"] };
const LEVEL = { mandatory: ["Mandatory", "m2"], triggered: ["Applies to you", "m1"], watch: ["Watch threshold", "m3"], recommended: ["Recommended", "m3"] };
const esc = s => escapeHtml(s == null ? "" : String(s));
const portalLink = p => { const m = String(p || "").match(/([a-z0-9-]+\.)+(gov\.in|nic\.in|org|in|com)(\/[^\s,;)]*)?/i); return m ? `<a href="https://${m[0]}" target="_blank" rel="noopener">${esc(m[0])}</a>` : esc(p); };
const lockLine = () => `<span class="kb-lock" title="Included in the full report">🔒 Full report</span>`;

function kbKey() { return state.rec && state.rec.key; }

/* ---------------- Documents ---------------- */
function renderDocs() {
  const key = kbKey(), d = KB.documents(key, state.answers), g = KB.gate(d.docs);
  const byStep = new Map(d.steps.map(s => [s.id, { s, docs: [] }]));
  g.visible.forEach(x => { (byStep.get(x.step) || byStep.set(x.step, { s: { id: x.step, stage: x.cat, text: "" }, docs: [] }).get(x.step)).docs.push(x); });
  state.docs = {}; g.visible.forEach(x => { state.docs[x.id] = !!KBU.done[x.id]; });
  const summ = Object.entries(d.summary || {}).map(([k, v]) => `<div class="kb-fact"><span>${esc(k)}</span><b>${esc(v)}</b></div>`).join("");
  document.getElementById("documents").innerHTML =
    `<div class="kb-facts">${summ}</div>` +
    `<p class="preview-count">${AccessProvider.isPremium() ? "Full checklist" : "35% free preview"}: ${g.visible.length} of ${g.total} documents for your profile · Tags: <span class="tg tg-l">Law</span> <span class="tg tg-p">Portal practice</span> <span class="tg tg-c">Commonly asked</span> <span class="tg tg-u">Verify</span></p>` +
    [...byStep.values()].map(({ s, docs }) => `<div class="kb-step"><div class="kb-step-h"><span class="kb-step-n">${esc(s.id)}</span><div><h4>${esc(s.stage)}</h4><p>${esc(s.text)}</p></div></div>${docs.length ? docs.map(x => `<label class="kb-doc${KBU.done[x.id] ? " done" : ""}"><input type="checkbox" data-kdoc="${x.id}"${KBU.done[x.id] ? " checked" : ""}><span><b>${esc(x.name)}</b> <span class="tg ${TAGS[x.tag] ? TAGS[x.tag][1] : ""}">${TAGS[x.tag] ? TAGS[x.tag][0] : esc(x.tag)}</span>${x.mandatory ? "" : ' <span class="tg tg-o">If applicable</span>'}<small>${esc(x.who)}${x.trigger ? " · When: " + esc(x.trigger) : ""}</small>${x.detail ? `<small class="kb-d">${[x.detail.validity && "Rules: " + x.detail.validity, x.detail.form && "Used in: " + x.detail.form, x.detail.notes].filter(Boolean).map(esc).join(" · ")}</small>` : ""}</span></label>`).join("") : `<p class="kb-empty">${g.locked ? "Documents for this step are in the full report." : "No separate documents for this step."}</p>`}</div>`).join("") +
    LockedPremiumSection(g.locked, "documents");
  updateDocs();
  document.querySelectorAll("[data-kdoc]").forEach(i => i.onchange = () => { KBU.done[i.dataset.kdoc] = i.checked; state.docs[i.dataset.kdoc] = i.checked; i.closest(".kb-doc").classList.toggle("done", i.checked); updateDocs(); });
}

/* ---------------- Compliance ---------------- */
const KIND_LABEL = { once: "One-time (first year)", monthly: "Monthly", quarterly: "Quarterly", "half-yearly": "Half-yearly", annual: "Annual", event: "Event-based" };
function renderCompliance() {
  const sel = document.getElementById("compFilter");
  if (!sel.dataset.kb) { sel.innerHTML = '<option value="all">All obligations</option><option value="initial">First-year setup</option>' + ["monthly", "quarterly", "half-yearly", "annual", "event"].map(k => `<option value="${k}">${KIND_LABEL[k]}</option>`).join(""); sel.dataset.kb = 1; }
  const f = sel.value, all = KB.compliances(kbKey(), state.answers);
  const list = all.filter(r => f === "all" || (f === "initial" ? r.part === "initial" : r.kind === f && r.part === "annual"));
  const g = KB.gate(list);
  const part = p => g.visible.filter(r => r.part === p);
  const table = rows => `<div class="annual-table-wrap"><table class="annual-table kb-ct"><thead><tr><th>Compliance</th><th>When</th><th>Form &amp; law</th><th>Applies if</th><th>If missed</th></tr></thead><tbody>${rows.map(r => `<tr><td><b>${esc(r.title)}</b><small class="kb-freq">${esc(KIND_LABEL[r.kind] || r.freq)}</small></td>${r.detail ? `<td>${esc(r.detail.due)}</td><td>${esc(r.detail.form)}<small>${esc(r.detail.law)}</small></td><td>${esc(r.detail.applicability)}</td><td>${esc(r.detail.penalty)}</td>` : `<td colspan="4">${lockLine()}</td>`}</tr>`).join("")}</tbody></table></div>`;
  const ini = part("initial"), ann = part("annual");
  document.getElementById("compliance").innerHTML =
    `<div class="kb-kpis">${[["First-year setup", all.filter(r => r.part === "initial").length], ["Monthly", all.filter(r => r.kind === "monthly").length], ["Quarterly", all.filter(r => r.kind === "quarterly").length], ["Annual", all.filter(r => r.kind === "annual" && r.part === "annual").length], ["Event-based", all.filter(r => r.kind === "event").length]].map(([t, n]) => `<div class="card kb-kpi"><span>${t}</span><b>${n}</b></div>`).join("")}</div>` +
    `<p class="preview-count">${AccessProvider.isPremium() ? "Full compliance list" : "35% free preview"}: ${g.visible.length} of ${g.total} obligations that apply to your profile. Status UV/VS rows must be confirmed on the named portal. Due dates are statutory; authorities often extend them.</p>` +
    (ini.length ? `<h3 class="kb-h">Initial compliances: formation to end of first year</h3>${table(ini)}` : "") +
    (ann.length ? `<h3 class="kb-h">Annual &amp; periodic compliances</h3>${table(ann)}` : "") +
    (!ini.length && !ann.length ? '<p class="empty-preview">No preview obligations match this filter.</p>' : "") +
    LockedPremiumSection(g.locked, "compliance obligations");
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
  const card = r => `<div class="oc kb-reg v${r.level === "mandatory" ? 2 : r.level === "triggered" ? 1 : 3}${KBU.regDone[r.id] ? " dn" : ""}"><div class="oh"><span class="no">${esc(r.id)}</span><h3>${esc(r.name)}</h3><span class="b ${LEVEL[r.level][1]}">${LEVEL[r.level][0]}</span></div><p class="why"><b>Why:</b> ${esc(r.why)}.</p>${r.detail ? `<div class="kb-grid"><div><span>Authority</span>${esc(r.detail.authority)}</div><div><span>Portal</span>${portalLink(r.detail.portal)}</div><div><span>When</span>${esc(r.detail.timeline || r.detail.validity || "")}</div><div><span>Law</span>${esc(r.detail.statute)}</div>${r.detail.fee ? `<div><span>Fee (approx.)</span>${esc(r.detail.fee)}</div>` : ""}${r.detail.penalty ? `<div><span>If missed</span>${esc(r.detail.penalty)}</div>` : ""}<div class="kb-wide"><span>Trigger / threshold</span>${esc(r.detail.trigger)} ${/V/.test(r.detail.tag || "") ? '<span class="tg tg-u">Verify</span>' : '<span class="tg tg-l">Confirmed</span>'}</div></div>` : `<p>${lockLine()}</p>`}<div class="ft"><span>${esc(r.cat)}</span><button class="rdone${KBU.regDone[r.id] ? " on" : ""}" data-kregd="${r.id}">${KBU.regDone[r.id] ? "✓ Obtained" : "Mark as obtained"}</button></div></div>`;
  let html = `<p class="preview-count">${AccessProvider.isPremium() ? "Full registration plan" : "35% free preview"}: ${g.visible.length} of ${g.total} registrations for your profile.</p>`;
  for (const l of ["mandatory", "triggered", "watch", "recommended"]) { const rows = g.visible.filter(r => r.level === l); if (rows.length) html += `<h2 class="gh">${LEVEL[l][0]} (${rows.length})</h2><div class="og">${rows.map(card).join("")}</div>`; }
  if (!filtered.length) html += '<p class="empty-preview">No registrations match these filters.</p>';
  $("rgOut").innerHTML = html + LockedPremiumSection(g.locked, "registrations");
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
  document.querySelectorAll("#snap [data-jump]").forEach(x => x.onclick = () => activateTab(x.dataset.jump));
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
    LockedPremiumSection(g.locked, "action steps");
  document.querySelectorAll("[data-kact]").forEach(i => i.onchange = () => { KBU.actDone[i.dataset.kact] = i.checked; renderAction(); });
}

/* keep "New assessment" clean */
(function () { const b = document.getElementById("newBtn"); const o = b.onclick; b.onclick = function () { o.call(this); if (!state.rec) { KBU.done = {}; KBU.regDone = {}; KBU.actDone = {}; KBU.regFilter = "all"; KBU.regQuery = ""; } }; })();
