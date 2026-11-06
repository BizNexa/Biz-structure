/* BizMatrix PDF report v2 — professional, action-oriented report built directly from the decision engine and
   knowledge base. Replaces pdfBuild() from app.js (same name, loaded later). Typeface: Inter (SIL OFL). */
const REPORT_FONTS = { loaded: null };
async function loadReportFonts(doc) {
  const files = [["Inter-Regular.ttf", "Inter", "normal"], ["Inter-SemiBold.ttf", "Inter", "bold"], ["Inter-ExtraBold.ttf", "InterX", "normal"]];
  try {
    if (!REPORT_FONTS.loaded) {
      REPORT_FONTS.loaded = await Promise.all(files.map(async ([f]) => {
        const buf = new Uint8Array(await (await fetch("../assets/fonts/" + f)).arrayBuffer());
        let s = ""; for (let i = 0; i < buf.length; i += 0x8000) s += String.fromCharCode.apply(null, buf.subarray(i, i + 0x8000));
        return s;
      }));
    }
    files.forEach(([f, name, style], i) => { doc.addFileToVFS(f, REPORT_FONTS.loaded[i]); doc.addFont(f, name, style); });
    return true;
  } catch (e) { console.warn("Report fonts unavailable, using Helvetica", e); REPORT_FONTS.loaded = null; return false; }
}

async function pdfBuild(meta) {
  meta = meta || {};
  try {
    if (!window.jspdf || typeof window.jspdf.jsPDF !== "function") throw new Error("PDF engine unavailable");
    toast("Building your report…");
    const key = state.rec.key, ent = ENTITIES[key], A = state.answers, R = state.rec.engine;
    const doc = new window.jspdf.jsPDF({ unit: "pt", format: "a4", compress: true });
    const fontsOk = await loadReportFonts(doc);
    const F = fontsOk ? "Inter" : "helvetica", FX = fontsOk ? "InterX" : "helvetica";
    const T = s => { s = String(s == null ? "" : s).replace(/[✓✔]/g, "Yes").replace(/☐/g, "[ ]").replace(/[\u{1F300}-\u{1FAFF}]/gu, ""); return fontsOk ? s.replace(/[^\x09\x0A\x20-\x7E\xA0-ɏ‐-‧‰-⁞₹←-↓−≤≥]/g, "") : pdfClean(s); };
    const W = doc.internal.pageSize.getWidth(), H = doc.internal.pageSize.getHeight(), M = 44, CW = W - 2 * M;
    const C = { forest: [11, 35, 28], emerald: [14, 107, 84], em2: [20, 135, 106], mint: [221, 241, 233], mint2: [240, 248, 244], gold: [201, 162, 39], goldS: [248, 239, 208], ink: [16, 38, 31], body: [52, 68, 62], muted: [100, 118, 111], line: [218, 228, 223], soft: [247, 251, 249], red: [185, 28, 28], redS: [253, 232, 232], amb: [161, 98, 7], ambS: [255, 243, 219], white: [255, 255, 255] };
    const fill = c => doc.setFillColor(...c), stroke = c => doc.setDrawColor(...c), ink = c => doc.setTextColor(...c);
    const font = (w, size) => { if (w === "x") doc.setFont(FX, "normal"); else doc.setFont(F, w === "b" ? "bold" : "normal"); if (size) doc.setFontSize(size); };
    const docs = KB.documents(key, A), regs = KB.registrations(key, A), comp = KB.compliances(key, A), plan = KB.actionPlan(key, A), sum = KB.summary(key, A);
    const flags = reviewFlags();
    const rid = "BM-" + Date.now().toString(36).toUpperCase().slice(-6) + "-" + key.slice(0, 3).toUpperCase();
    const dateStr = new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
    let y = M, sec = 0; const toc = [];
    const bottom = H - 58;
    const newPage = () => { doc.addPage(); y = 64; };
    const need = n => { if (y + n > bottom) newPage(); };
    const para = (text, opt = {}) => { font(opt.w || "r", opt.size || 9.5); ink(opt.color || C.body); const lines = doc.splitTextToSize(T(text), opt.width || CW); const lh = (opt.size || 9.5) * 1.42; need(lines.length * lh + 4); doc.text(lines, opt.x || M, y + (opt.size || 9.5)); y += lines.length * lh + (opt.after ?? 6); };
    const h2 = (title, sub) => {
      sec++; if (y > 64) { if (y + 120 > bottom) newPage(); else y += 10; }
      const pg = doc.getNumberOfPages(); toc.push([sec, title, pg, y]); doc.outline.add(null, sec + ". " + title, { pageNumber: pg });
      font("b", 8.5); ink(C.gold); doc.text("SECTION " + String(sec).padStart(2, "0"), M, y + 8);
      font("x", 19); ink(C.forest); doc.text(T(title), M, y + 30);
      fill(C.gold); doc.rect(M, y + 38, 36, 2.5, "F");
      y += 50; if (sub) para(sub, { color: C.muted, size: 9.5, after: 10 });
    };
    const h3 = t => { need(40); font("b", 11.5); ink(C.emerald); doc.text(T(t), M, y + 11); y += 20; };
    const callout = (title, text, tone = "mint") => {
      const bg = tone === "amber" ? C.ambS : tone === "red" ? C.redS : C.mint2, bar = tone === "amber" ? C.amb : tone === "red" ? C.red : C.emerald;
      font("r", 9.3); const lines = doc.splitTextToSize(T(text), CW - 28), h = 22 + lines.length * 13 + (title ? 14 : 0);
      need(h + 8); fill(bg); doc.roundedRect(M, y, CW, h, 6, 6, "F"); fill(bar); doc.rect(M, y, 3.5, h, "F");
      let yy = y + 18; if (title) { font("b", 10); ink(bar); doc.text(T(title), M + 16, yy); yy += 15; }
      font("r", 9.3); ink(C.ink); doc.text(lines, M + 16, yy); y += h + 10;
    };
    const table = (head, body, o = {}) => {
      if (!body.length) return;
      need(60);
      doc.autoTable(Object.assign({
        startY: y, head: [head], body, margin: { left: M, right: M, top: 64, bottom: 62 }, theme: "plain",
        styles: { font: F, fontSize: 8.4, cellPadding: { top: 5, bottom: 5, left: 6, right: 6 }, textColor: C.body, lineColor: C.line, lineWidth: { bottom: 0.5 }, valign: "top", overflow: "linebreak" },
        headStyles: { font: F, fontStyle: "bold", fillColor: C.forest, textColor: 255, fontSize: 8.2, lineWidth: 0 },
        alternateRowStyles: { fillColor: C.soft },
        didParseCell: d => { d.cell.text = (d.cell.text || []).map(T); if (o.pc) o.pc(d); },
        didDrawCell: d => { if (o.dc) o.dc(d); }
      }, o.opts || {}));
      y = doc.lastAutoTable.finalY + 14;
    };
    const chip = (text, x, yy, bg, fg) => { font("b", 7.4); const w = doc.getTextWidth(T(text)) + 12; fill(bg); doc.roundedRect(x, yy - 9, w, 13, 6.5, 6.5, "F"); ink(fg); doc.text(T(text), x + 6, yy); return w; };
    const check = (x, yy, id, on) => { const cb = new doc.AcroFormCheckBox(); cb.fieldName = id; cb.x = x; cb.y = yy; cb.width = 10; cb.height = 10; cb.appearanceState = on ? "On" : "Off"; cb.value = on ? "On" : "Off"; doc.addField(cb); stroke(C.emerald); doc.setLineWidth(0.8); doc.roundedRect(x, yy, 10, 10, 2, 2, "S"); };
    const short = (s, n) => { s = String(s || ""); return s.length > n ? s.slice(0, n - 1).trim() + "…" : s; };
    const url = p => { const m = String(p || "").match(/([a-z0-9-]+\.)+(gov\.in|nic\.in|org|in|com)(\/[^\s,;)]*)?/i); return m ? "https://" + m[0] : null; };

    /* ================= COVER ================= */
    fill(C.forest); doc.rect(0, 0, W, H * 0.62, "F");
    fill(C.emerald); doc.triangle(W * 0.48, H * 0.62, W, H * 0.30, W, H * 0.62, "F");
    fill(C.gold); doc.rect(0, H * 0.62, W, 5, "F");
    font("b", 8.5); ink(C.gold); doc.text("BIZ MATRIX  ·  BUSINESS STRUCTURE & REGISTRATION REPORT  ·  FY 2026-27", M, 54);
    font("r", 11); ink([206, 228, 218]); doc.text("Recommended structure", M, 118);
    font("x", 34); ink(C.white); const tl = doc.splitTextToSize(T(ent.name), W * 0.62); doc.text(tl, M, 156); let cy = 156 + tl.length * 38;
    const conf = confidenceLabel(); chip(conf.toUpperCase(), M, cy, C.gold, C.forest); cy += 30;
    if (meta.biz || meta.name) { font("b", 8.5); ink(C.gold); doc.text("PREPARED FOR", M, cy); font("x", 16); ink(C.white); doc.text(T(short(meta.biz || meta.name, 44)), M, cy + 20); font("r", 10); ink([206, 228, 218]); const sub = [meta.biz ? meta.name : "", meta.city].filter(Boolean).join("  ·  "); if (sub) doc.text(T(sub), M, cy + 36); cy += 52; }
    font("r", 9.5); ink([206, 228, 218]); doc.text(T("Prepared " + dateStr + "   ·   Report ID " + rid + "   ·   Rulebook v" + BizEngine.VERSION + ", law verified " + BizEngine.VERIFIED), M, cy + 4);
    // gauge
    const only = state.rec.confidence === "only eligible structure", fit = only ? 100 : state.rec.fit;
    const gx = W - M - 70, gy = 150, gr = 52; doc.setLineWidth(9); stroke([38, 82, 68]); doc.circle(gx, gy, gr, "S"); stroke(C.gold);
    for (let i = 0; i < 72 * fit / 100; i++) { const a0 = -Math.PI / 2 + i / 72 * 2 * Math.PI, a1 = -Math.PI / 2 + (i + 1.1) / 72 * 2 * Math.PI; doc.line(gx + gr * Math.cos(a0), gy + gr * Math.sin(a0), gx + gr * Math.cos(a1), gy + gr * Math.sin(a1)); }
    doc.setLineWidth(0.5); font("x", only ? 17 : 26); ink(C.white); doc.text(only ? "ONLY" : String(fit), gx, gy + (only ? 5 : 8), { align: "center" }); font("b", 7); ink(C.goldS); doc.text(only ? "ELIGIBLE" : "FIT / 100", gx, gy + 22, { align: "center" });
    // stat tiles
    const tiles = [[sum.regsMandatory + sum.regsTriggered, "Registrations to obtain"], [sum.docs, "Documents to collect"], [sum.compInitial, "First-year compliances"], [plan.length, "Actions in your plan"]];
    const tw = (CW - 3 * 10) / 4, ty = H * 0.62 + 34;
    tiles.forEach(([v, t], i) => { const x = M + i * (tw + 10); fill(C.mint2); doc.roundedRect(x, ty, tw, 70, 8, 8, "F"); font("x", 24); ink(C.emerald); doc.text(String(v), x + 14, ty + 34); font("r", 8.6); ink(C.muted); doc.text(doc.splitTextToSize(t, tw - 24), x + 14, ty + 52); });
    y = ty + 96;
    font("b", 10.5); ink(C.forest); doc.text("What this report gives you", M, y); y += 8;
    ["Why this structure fits, with the legal rules and weighted factors behind it", "Your personalised document checklist, step by step", "Every registration that applies to you, with portal, timing and penalty", "Your first-year and recurring compliance calendar", "A phased action plan with owners and deadlines, plus a one-page summary"].forEach(s => { y += 15; fill(C.gold); doc.circle(M + 3, y - 3, 2, "F"); font("r", 9.5); ink(C.body); doc.text(T(s), M + 12, y); });

    /* ================= CONTENTS (filled later) ================= */
    newPage(); const tocPage = doc.getNumberOfPages(); doc.outline.add(null, "Contents", { pageNumber: tocPage });

    /* ================= 1. AT A GLANCE ================= */
    newPage();
    h2("Your plan at a glance", "The short version. Every point is expanded in the sections that follow.");
    const x = BizEngine.explain(R, engineInputs(A));
    callout("Recommendation: " + ent.name, (only ? "This is the only structure that passes the legal hard rules for your answers. " : `Fit score ${state.rec.fit}/100 (${conf.toLowerCase()}${state.rec.margin != null ? `, ${state.rec.margin} points ahead of ${ENTITIES[state.rec.runnerUp].name}` : ""}). `) + x.why.slice(0, 3).join(" "));
    if (flags.length) callout("Talk to a professional before filing", flags.map(f => f + ": " + BizEngine.RULES[f].plain).join("  "), "amber");
    h3("Do these first");
    sum.next.forEach((p, i) => {
      need(40); fill(C.emerald); doc.circle(M + 9, y + 7, 9, "F"); font("b", 9); ink(C.white); doc.text(String(i + 1), M + 9, y + 10.5, { align: "center" });
      font("b", 10); ink(C.ink); doc.text(T(short(p.title, 80)), M + 26, y + 10); font("r", 8.6); ink(C.muted); doc.text(T("When: " + short(p.when, 60) + "   ·   Who: " + p.owner), M + 26, y + 23); y += 34;
    });
    h3("Key numbers");
    table(["Area", "For your profile", "Where"], [
      ["Registrations", `${sum.regsMandatory} mandatory, ${sum.regsTriggered} triggered by your answers, ${sum.regsRecommended} recommended`, "Section 5"],
      ["Documents", `${sum.docs} documents (${sum.docsMandatory} always required)`, "Section 4"],
      ["Compliance", `${sum.compInitial} first-year setup items, ${sum.compAnnual} recurring (${sum.monthly} monthly, ${sum.quarterly} quarterly)`, "Section 6"],
      ["Time & cost to form", `${sum.time["Typical time"] || "—"}; government cost: ${sum.time["Government cost"] || "—"}`, "Section 3"]
    ], { opts: { columnStyles: { 0: { cellWidth: 100, fontStyle: "bold", textColor: C.emerald }, 2: { cellWidth: 60 } } } });

    /* ================= 2. WHY THIS STRUCTURE ================= */
    h2("Why this structure", "Legal knock-out rules run first; the structures that survive are scored on nine weighted factors (BizMatrix Rulebook v" + BizEngine.VERSION + ").");
    const rk = state.rec.ranking.filter(r => r[1] != null);
    if (rk.length > 1) {
      const mx = rk[0][1], mn = Math.min(...rk.map(r => r[1])), bw = CW - 210;
      rk.forEach(([k, v], i) => { need(22); const top = i === 0, pct = mx === mn ? 1 : 0.25 + 0.75 * (v - mn) / (mx - mn); font(top ? "b" : "r", 9.5); ink(top ? C.emerald : C.body); doc.text(T(ENTITIES[k].name), M, y + 10); fill([234, 241, 238]); doc.roundedRect(M + 170, y + 2, bw, 10, 5, 5, "F"); fill(top ? C.emerald : [150, 186, 172]); doc.roundedRect(M + 170, y + 2, Math.max(10, bw * pct), 10, 5, 5, "F"); font("b", 9.5); doc.text(v.toFixed(1), W - M, y + 10, { align: "right" }); y += 20; });
      y += 6;
    }
    const fr = factorRows();
    if (fr.length) table(["Factor", "Weight", "Basis", ENTITIES[key].name, R.runner_up ? BizEngine.NAME[R.runner_up] : ""], fr.map(f => [f.name, f.weight, f.basis, f.top.toFixed(1), f.ru != null ? f.ru.toFixed(1) : ""]), { opts: { columnStyles: { 1: { halign: "center", cellWidth: 46 }, 2: { cellWidth: 58 }, 3: { halign: "center", fontStyle: "bold", textColor: C.emerald, cellWidth: 80 }, 4: { halign: "center", cellWidth: 80 } } } });
    const ex = exclusionRows();
    if (ex.length) { h3("Ruled out by law or regulation"); table(["Structure", "Rule", "Reason", "Citation"], ex.map(e => [e.e, e.ids.join(", "), e.plain, e.cite]), { opts: { columnStyles: { 0: { cellWidth: 92, fontStyle: "bold" }, 1: { cellWidth: 46 }, 3: { cellWidth: 120, textColor: C.muted } } } }); }

    /* ================= 3. ENTITY IN BRIEF ================= */
    h2(ent.name + " in brief", "The legal shape of your entity and what it takes to form and run it.");
    table(["Aspect", "Position"], Object.entries(docs.summary || {}).map(([k, v]) => [k, v]).concat([["Liability", ent.liability], ["Tax", ent.tax], ["Audit", ent.audit], ["Compliance load", ent.compliance], ["Funding routes", ent.funding]]).filter(r => r[1]), { opts: { columnStyles: { 0: { cellWidth: 130, fontStyle: "bold", textColor: C.emerald } } } });

    /* ================= 4. DOCUMENTS ================= */
    h2("Incorporation roadmap & document checklist", `${docs.docs.length} documents across ${docs.steps.length} steps, filtered to your answers. Tick each box in the PDF as you collect it.`);
    const legend = [["Law", C.redS, C.red], ["Portal practice", C.ambS, C.amb], ["Commonly asked", C.mint, C.emerald], ["Verify", [235, 235, 245], [80, 80, 140]]];
    let lx = M; legend.forEach(([t, b, f]) => { lx += chip(t, lx, y + 9, b, f) + 6; }); y += 22;
    const TAGC = { L: ["Law", C.redS, C.red], P: ["Portal", C.ambS, C.amb], C: ["Common", C.mint, C.emerald], U: ["Verify", [235, 235, 245], [80, 80, 140]] };
    docs.steps.forEach(s => {
      const list = docs.docs.filter(d => d.step === s.id);
      need(54); fill(C.emerald); doc.roundedRect(M, y, 30, 18, 4, 4, "F"); font("b", 8.5); ink(C.white); doc.text(s.id, M + 15, y + 12.5, { align: "center" });
      font("b", 11); ink(C.ink); doc.text(T(s.stage), M + 40, y + 12.5); y += 22; para(s.text, { color: C.muted, size: 8.8, x: M + 40, width: CW - 40, after: 4 });
      if (!list.length) { y += 4; return; }
      table(["", "Document", "Provided by", "Type", "Notes"], list.map(d => ["", d.name + (d.mandatory ? "" : " (if applicable)"), d.who, TAGC[d.tag] ? TAGC[d.tag][0] : d.tag, [d.trigger && "When: " + d.trigger, d.detail && d.detail.validity, d.detail && d.detail.notes].filter(Boolean).join(" · ")]), {
        opts: { columnStyles: { 0: { cellWidth: 22 }, 1: { cellWidth: 190, fontStyle: "bold", textColor: C.ink }, 2: { cellWidth: 82 }, 3: { cellWidth: 52 } } },
        pc: d => { if (d.section === "body" && d.column.index === 3 && list[d.row.index]) { const t = TAGC[list[d.row.index].tag]; if (t) { d.cell.styles.textColor = t[2]; d.cell.styles.fontStyle = "bold"; } } },
        dc: d => { const it = list[d.row.index]; if (d.section === "body" && d.column.index === 0 && it && d.cell.height > 14) check(d.cell.x + 6, d.cell.y + 5, "doc_" + it.id + "_" + d.row.index + "_" + doc.getNumberOfPages(), !!KBU.done[it.id]); }
      });
    });

    /* ================= 5. REGISTRATIONS ================= */
    h2("Registrations & licences you need", "Built from the Registration Master Map FY 2026-27 and your answers. Registration names link to the official portal.");
    const regTable = (title, list, tone) => {
      if (!list.length) return; h3(title + " (" + list.length + ")");
      table(["Registration", "Why it applies", "Authority & when", "Fee / if missed"], list.map(r => [r.name, r.why, [r.detail && r.detail.authority, r.detail && (r.detail.timeline || r.detail.validity)].filter(Boolean).join(" · ") || "—", [r.detail && r.detail.fee, r.detail && r.detail.penalty].filter(Boolean).join(" · ") || "—"]), {
        opts: { columnStyles: { 0: { cellWidth: 130, fontStyle: "bold", textColor: tone }, 1: { cellWidth: 140 } } },
        dc: d => { if (d.section === "body" && d.column.index === 0 && list[d.row.index]) { const u = url(list[d.row.index].detail && list[d.row.index].detail.portal); if (u) doc.link(d.cell.x, d.cell.y, d.cell.width, d.cell.height, { url: u }); } }
      });
    };
    regTable("Mandatory for your entity", regs.filter(r => r.level === "mandatory"), C.red);
    regTable("Triggered by your answers", regs.filter(r => r.level === "triggered"), C.amb);
    regTable("Watch: close to a threshold", regs.filter(r => r.level === "watch"), C.amb);
    regTable("Recommended (optional, but valuable)", regs.filter(r => r.level === "recommended"), C.emerald);

    /* ================= 6. COMPLIANCE ================= */
    h2("Compliance: first year and every year", "From the Initial & Annual Compliance Master (law as of 6 Nov 2026). Due dates are statutory; authorities often extend them by circular. Rows marked UV must be confirmed on the portal.");
    const ctab = (title, list) => { if (!list.length) return; h3(title + " (" + list.length + ")"); table(["Compliance", "When", "Form / law", "If missed"], list.map(r => [r.title, r.detail ? r.detail.due : "", r.detail ? [r.detail.form, r.detail.law].filter(Boolean).join(" — ") : "", r.detail ? r.detail.penalty : ""]), { opts: { columnStyles: { 0: { cellWidth: 150, fontStyle: "bold", textColor: C.ink }, 1: { cellWidth: 105 } } } }); };
    ctab("First-year setup (formation to end of first FY)", comp.filter(r => r.part === "initial"));
    const KL = { monthly: "Monthly", quarterly: "Quarterly", "half-yearly": "Half-yearly", annual: "Annual", event: "Event-based (when it happens)" };
    ["monthly", "quarterly", "half-yearly", "annual", "event"].forEach(k => ctab("Recurring: " + KL[k], comp.filter(r => r.part === "annual" && r.kind === k)));
    // month-by-month calendar
    const MON = ["Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar"], cal = MON.map(() => []);
    comp.filter(r => r.part === "annual" && r.detail && r.kind !== "monthly" && r.kind !== "event").forEach(r => { const due = r.detail.due; MON.forEach((m, i) => { const re = new RegExp("\\b(\\d{1,2})\\s*" + m + "|" + m + "[a-z]*\\s+(\\d{1,2})\\b", "i"); const mm = due.match(re); if (mm) cal[i].push((mm[1] || mm[2]) + " " + m + ": " + short(r.title, 46)); }); });
    if (cal.some(c => c.length)) {
      need(200); h3("FY 2026-27 calendar at a glance");
      const monthly = comp.filter(r => r.part === "annual" && r.kind === "monthly").map(r => short(r.title, 40));
      if (monthly.length) para("Every month: " + monthly.slice(0, 6).join("; ") + ".", { size: 8.8, color: C.muted });
      const cw = (CW - 3 * 8) / 4;
      for (let row = 0; row < 3; row++) {
        const items = [0, 1, 2, 3].map(c => cal[row * 4 + c].slice(0, 7)), hh = 26 + Math.max(1, ...items.map(i => i.length)) * 11.5;
        need(hh + 8);
        items.forEach((it, c) => { const x0 = M + c * (cw + 8); fill(C.soft); stroke(C.line); doc.roundedRect(x0, y, cw, hh, 6, 6, "FD"); fill(C.emerald); doc.roundedRect(x0, y, cw, 18, 6, 6, "F"); doc.rect(x0, y + 10, cw, 8, "F"); font("b", 8.5); ink(C.white); doc.text(MON[row * 4 + c] + (row * 4 + c < 9 ? " 2026" : " 2027"), x0 + 8, y + 12.5); font("r", 7.3); ink(C.body); it.forEach((t, k) => doc.text(T(doc.splitTextToSize(T(t), cw - 14)[0]), x0 + 7, y + 30 + k * 11.5)); if (!it.length) { ink(C.muted); doc.text("No fixed-date filing", x0 + 7, y + 30); } });
        y += hh + 8;
      }
    }

    /* ================= 7. ACTION PLAN ================= */
    h2("Your action plan", "Six phases from decision to a running, compliant business. Tick each action as you complete it.");
    const PRI = { Critical: [C.redS, C.red], High: [C.ambS, C.amb], Medium: [C.mint, C.emerald], Optional: [[236, 239, 238], C.muted] };
    Object.keys(KB.PHASES).forEach(k => {
      const items = plan.filter(p => String(p.phase) === String(k)); if (!items.length) return;
      need(70); fill(C.forest); doc.roundedRect(M, y, CW, 26, 6, 6, "F"); font("x", 11); ink(C.gold); doc.text("PHASE " + k, M + 12, y + 17); font("b", 11); ink(C.white); doc.text(T(KB.PHASES[k][0]), M + 72, y + 17); font("r", 9); ink([206, 228, 218]); doc.text(T(KB.PHASES[k][1]), W - M - 12, y + 17, { align: "right" }); y += 34;
      items.forEach((p, i) => {
        font("r", 8.8); const lines = doc.splitTextToSize(T(p.text), CW - 40), h = 30 + lines.length * 11.5;
        need(h + 4); check(M + 4, y + 3, "act_" + k + "_" + i, !!KBU.actDone[p.phase + p.title]);
        font("b", 10); ink(C.ink); const tt = T(short(p.title, 70)); doc.text(tt, M + 22, y + 11); const tw2 = doc.getTextWidth(tt); chip(p.priority, M + 30 + tw2, y + 11, PRI[p.priority][0], PRI[p.priority][1]);
        font("r", 8.8); ink(C.body); doc.text(lines, M + 22, y + 25);
        font("r", 8); ink(C.muted); doc.text(T("When: " + short(p.when, 70) + "   ·   Owner: " + p.owner + (p.ref ? "   ·   Ref " + p.ref : "")), M + 22, y + 25 + lines.length * 11.5 + 2);
        y += h + 6; stroke(C.line); doc.setLineWidth(0.4); doc.line(M + 22, y - 4, W - M, y - 4);
      });
      y += 6;
    });

    /* ================= 8. RISKS ================= */
    h2("Penalties to avoid", "The costliest misses for your profile. Diarise these first.");
    const risky = comp.filter(r => r.detail && /₹|per day|prosecution|imprisonment|disqualif|strike|cancel/i.test(r.detail.penalty)).slice(0, 12);
    table(["Compliance", "Due", "Consequence"], risky.map(r => [r.title, r.detail.due, r.detail.penalty]), { opts: { columnStyles: { 0: { cellWidth: 170, fontStyle: "bold", textColor: C.ink }, 1: { cellWidth: 120 }, 2: { textColor: C.red } } } });

    /* ================= 9. PORTALS ================= */
    h2("Official portals", "Use only official portals. Each link opens the site.");
    const portals = []; const seen = new Set();
    regs.forEach(r => { const u = url(r.detail && r.detail.portal); if (u && !seen.has(u)) { seen.add(u); portals.push([r.name, u.replace("https://", ""), u]); } });
    [["MCA (company / LLP filings)", "https://www.mca.gov.in"], ["Income Tax e-filing", "https://www.incometax.gov.in"], ["GST portal", "https://www.gst.gov.in"]].forEach(([n, u]) => { if (!seen.has(u)) portals.unshift([n, u.replace("https://", ""), u]); });
    table(["For", "Portal"], portals.map(p => [p[0], p[1]]), { opts: { columnStyles: { 0: { cellWidth: 260, fontStyle: "bold", textColor: C.ink }, 1: { textColor: C.emerald } } }, dc: d => { if (d.section === "body" && portals[d.row.index]) doc.link(d.cell.x, d.cell.y, d.cell.width, d.cell.height, { url: portals[d.row.index][2] }); } });

    /* ================= 10. SUMMARY ================= */
    newPage(); h2("Summary", "Everything that matters, on one page.");
    const block = (title, lines) => { need(30 + lines.length * 14); font("b", 10.5); ink(C.emerald); doc.text(T(title), M, y + 10); y += 18; lines.forEach(l => { font("r", 9.4); ink(C.ink); const ls = doc.splitTextToSize(T(l), CW - 14); need(ls.length * 13); fill(C.gold); doc.circle(M + 3, y + 6.5, 1.8, "F"); doc.text(ls, M + 12, y + 9); y += ls.length * 13 + 2; }); y += 6; };
    block("Decision", [`Form a ${ent.name}. ${only ? "It is the only structure your answers allow." : `Fit ${state.rec.fit}/100, ${conf.toLowerCase()}.`}`].concat(x.why.slice(0, 2)));
    block("Do first", sum.next.slice(0, 5).map(p => p.title + " (" + short(p.when, 40) + ")"));
    block("Registrations", [`${sum.regsMandatory} mandatory: ` + regs.filter(r => r.level === "mandatory").slice(0, 6).map(r => short(r.name, 34)).join(", ") + (sum.regsMandatory > 6 ? " …" : ""), `${sum.regsTriggered} triggered by your answers` + (sum.regsTriggered ? ": " + regs.filter(r => r.level === "triggered").slice(0, 6).map(r => short(r.name, 34)).join(", ") : ".")]);
    block("Documents", [`${sum.docs} documents across ${docs.steps.length} steps; start with founder KYC, premises proof and DSCs.`]);
    block("Compliance rhythm", [`First year: ${sum.compInitial} setup items. Then ${sum.monthly} monthly, ${sum.quarterly} quarterly and the annual filings in Section 6.`, "Keep one shared calendar; review it monthly with your CA / CS."]);
    const watch = plan.find(p => p.phase === 6 && /threshold/i.test(p.title)); if (watch) block("Watch", [watch.text]);
    if (flags.length) block("Get professional help on", flags.map(f => BizEngine.RULES[f].plain));
    callout("", "Structured decision support based on the law as verified on " + BizEngine.VERIFIED + ". Not legal, tax or professional advice for your specific facts. Confirm current notifications and state rules before filing.", "mint");

    /* ================= CONTENTS ================= */
    doc.setPage(tocPage); y = 64;
    font("b", 8.5); ink(C.gold); doc.text("CONTENTS", M, y + 8); font("x", 22); ink(C.forest); doc.text("What's inside", M, y + 34); fill(C.gold); doc.rect(M, y + 42, 36, 2.5, "F"); y += 70;
    toc.forEach(([n, t, p, yy]) => { fill(n % 2 ? C.soft : C.white); doc.rect(M, y - 15, CW, 28, "F"); font("x", 12); ink(C.gold); doc.text(String(n).padStart(2, "0"), M + 10, y + 3); font("b", 11); ink(C.ink); doc.text(T(t), M + 42, y + 3); font("b", 10); ink(C.emerald); doc.text(String(p), W - M - 10, y + 3, { align: "right" }); doc.link(M, y - 15, CW, 28, { pageNumber: p, top: yy }); y += 30; });
    y += 10; para("Tip: click a section to jump to it, use the bookmarks panel in your PDF reader, and tick the checkboxes as you complete each item.", { color: C.muted, size: 9 });

    /* ================= HEADERS & FOOTERS ================= */
    const n = doc.getNumberOfPages();
    for (let i = 2; i <= n; i++) {
      doc.setPage(i); fill(C.emerald); doc.rect(0, 0, W, 4, "F");
      font("b", 7.5); ink(C.muted); doc.text(T("BIZ MATRIX  ·  " + ent.name.toUpperCase() + (meta.biz ? "  ·  " + short(meta.biz, 36).toUpperCase() : "")), M, 26);
      if (i !== tocPage) { ink(C.emerald); doc.text("Contents", W - M, 26, { align: "right" }); doc.link(W - M - 44, 17, 44, 12, { pageNumber: tocPage }); }
      stroke(C.line); doc.setLineWidth(0.5); doc.line(M, H - 40, W - M, H - 40);
      font("r", 7.2); ink(C.muted); doc.text(T("Decision support, law verified " + BizEngine.VERIFIED + ". Not legal, tax or professional advice.  ·  Rulebook v" + BizEngine.VERSION + "  ·  " + rid), M, H - 26);
      fill(C.emerald); doc.roundedRect(W - M - 48, H - 35, 48, 14, 7, 7, "F"); font("b", 7.5); ink(C.white); doc.text(i + " / " + n, W - M - 24, H - 25, { align: "center" });
    }
    doc.setProperties({ title: "Biz Matrix Report - " + (meta.biz ? meta.biz + " - " : "") + ent.name, subject: "Business structure, registration and compliance plan", author: "Biz Matrix", creator: "Biz Matrix" });
    window.__lastPdf = doc;
    const blob = doc.output("blob"); if (!blob || !blob.size) throw new Error("Empty PDF generated");
    const u = URL.createObjectURL(blob), link = document.createElement("a");
    link.href = u; link.download = "Biz_Matrix_" + ((meta.biz || "").replace(/[^A-Za-z0-9]+/g, "_").replace(/^_|_$/g, "") || "Full_Report") + ".pdf"; link.style.display = "none"; document.body.appendChild(link); link.click();
    setTimeout(() => { link.remove(); URL.revokeObjectURL(u); }, 2000);
    toast("Your report is ready. Check your browser's Downloads folder.");
  } catch (e) {
    console.error("PDF error:", e);
    toast("PDF download could not be completed. Opening the print dialog so you can choose Save as PDF.");
    setTimeout(printNow, 120);
  }
}
