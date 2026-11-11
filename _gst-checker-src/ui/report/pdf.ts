/**
 * Biz Matrix-style PDF report (mirrors bizmatrix.in js/report.js): Inter typeface, gold left bar on the
 * cover, verdict seal, "SECTION 0n" headings with a gold rule, fillable checklist boxes, gold page chips.
 * Works in the browser (downloadReport) and in Node (buildReport with assets read from disk).
 */
import { jsPDF } from 'jspdf';
import type { ResultView } from '../../engine';
import { en } from '../i18n/en';

export interface ReportAssets {
  fonts?: { regular: string; semibold: string; extrabold: string } | null; // binary strings
  logo?: string | null; // data URL (PNG)
}

type RGB = [number, number, number];
const C: Record<string, RGB> = {
  forest: [31, 35, 40], gold: [201, 162, 39], goldT: [125, 96, 19], goldS: [245, 238, 220], soft: [251, 248, 241],
  ink: [31, 35, 40], body: [58, 61, 66], muted: [94, 90, 82], line: [233, 225, 207], white: [255, 255, 255],
  red: [180, 35, 24], redS: [252, 232, 230], green: [30, 122, 76], greenS: [229, 243, 236], amb: [154, 91, 7], ambS: [251, 240, 220],
};
const CAT: Record<string, string> = en.categories;

export function buildReport(v: ResultView, inputs: [string, string][], turnoverLabel: string | null, assets: ReportAssets = {}): jsPDF {
  const doc = new jsPDF({ unit: 'pt', format: 'a4', compress: true });
  const fontsOk = !!assets.fonts;
  if (assets.fonts) {
    doc.addFileToVFS('Inter-Regular.ttf', assets.fonts.regular);
    doc.addFont('Inter-Regular.ttf', 'Inter', 'normal');
    doc.addFileToVFS('Inter-SemiBold.ttf', assets.fonts.semibold);
    doc.addFont('Inter-SemiBold.ttf', 'Inter', 'bold');
    doc.addFileToVFS('Inter-ExtraBold.ttf', assets.fonts.extrabold);
    doc.addFont('Inter-ExtraBold.ttf', 'InterX', 'normal');
  }
  const F = fontsOk ? 'Inter' : 'helvetica';
  const FX = fontsOk ? 'InterX' : 'helvetica';
  const T = (s: string) => {
    s = String(s ?? '').replace(/[‘’]/g, "'").replace(/[“”]/g, '"').replace(/→/g, '->');
    return fontsOk ? s.replace(/[^\x09\x0A\x20-\x7E\xA0-ɏ‐-‧₹]/g, '') : s.replace(/₹/g, 'Rs ').replace(/[–—]/g, '-').replace(/[^\x09\x0A\x20-\x7E]/g, '');
  };
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const M = 44;
  const CW = W - 2 * M;
  const bottom = H - 58;
  const fill = (c: RGB) => doc.setFillColor(...c);
  const stroke = (c: RGB) => doc.setDrawColor(...c);
  const ink = (c: RGB) => doc.setTextColor(...c);
  const font = (w: 'r' | 'b' | 'x', size?: number) => {
    if (w === 'x') doc.setFont(FX, 'normal');
    else doc.setFont(F, w === 'b' ? 'bold' : 'normal');
    if (size) doc.setFontSize(size);
  };
  let y = M;
  let sec = 0;
  const newPage = () => {
    doc.addPage();
    y = 64;
  };
  const need = (n: number) => {
    if (y + n > bottom) newPage();
  };
  const para = (text: string, o: { size?: number; color?: RGB; x?: number; width?: number; after?: number; w?: 'r' | 'b' } = {}) => {
    const size = o.size ?? 9.6;
    font(o.w ?? 'r', size);
    ink(o.color ?? C.body);
    const lines = doc.splitTextToSize(T(text), o.width ?? CW);
    const lh = size * 1.42;
    need(lines.length * lh + 4);
    doc.text(lines, o.x ?? M, y + size);
    y += lines.length * lh + (o.after ?? 6);
  };
  const section = (title: string, outline: string) => {
    sec++;
    if (y > 64) {
      if (y + 140 > bottom) newPage();
      else y += 18;
    }
    doc.outline.add(null, outline, { pageNumber: doc.getNumberOfPages() });
    font('b', 8.5);
    ink(C.goldT);
    doc.text('SECTION ' + String(sec).padStart(2, '0'), M, y + 8);
    font('x', 19);
    ink(C.forest);
    doc.text(T(title), M, y + 30);
    fill(C.gold);
    doc.rect(M, y + 38, 36, 2.5, 'F');
    y += 56;
  };
  const h3 = (s: string) => {
    need(40);
    font('b', 11.5);
    ink(C.goldT);
    doc.text(T(s), M, y + 11);
    y += 20;
  };
  const bullets = (items: string[], color: RGB = C.ink) => {
    for (const it of items) {
      font('r', 9.5);
      const ls = doc.splitTextToSize(T(it), CW - 14);
      need(ls.length * 13.5 + 4);
      fill(C.gold);
      doc.circle(M + 3, y + 6.5, 1.9, 'F');
      ink(color);
      doc.text(ls, M + 12, y + 9.5);
      y += ls.length * 13.5 + 4;
    }
    y += 4;
  };
  const callout = (title: string, lines: string[], bg: RGB, bar: RGB, numbered = false) => {
    font('r', 9.3);
    const wrapped = lines.map((l, i) => doc.splitTextToSize(T((numbered ? `${i + 1}. ` : '') + l), CW - 32));
    const h = 26 + wrapped.reduce((n, l) => n + l.length * 12.5 + 4, 0) + 8;
    need(h + 8);
    fill(bg);
    doc.roundedRect(M, y, CW, h, 6, 6, 'F');
    fill(bar);
    doc.rect(M, y, 3.5, h, 'F');
    font('b', 10.5);
    ink(bar);
    doc.text(T(title), M + 16, y + 18);
    let yy = y + 34;
    font('r', 9.3);
    ink(C.ink);
    for (const l of wrapped) {
      doc.text(l, M + 16, yy);
      yy += l.length * 12.5 + 4;
    }
    y += h + 12;
  };
  const chip = (text: string, x: number, yy: number, bg: RGB, fg: RGB) => {
    font('b', 7.6);
    const w = doc.getTextWidth(T(text)) + 14;
    fill(bg);
    doc.roundedRect(x, yy - 9.5, w, 14, 7, 7, 'F');
    ink(fg);
    doc.text(T(text), x + 7, yy);
    return w;
  };
  const checkbox = (x: number, yy: number, id: string) => {
    try {
      const Ctor = (doc as unknown as { AcroFormCheckBox: new () => Record<string, unknown> }).AcroFormCheckBox;
      const cb = new Ctor();
      Object.assign(cb, { fieldName: id, x, y: yy, width: 10, height: 10, appearanceState: 'Off', value: 'Off' });
      (doc as unknown as { addField: (f: unknown) => void }).addField(cb);
    } catch {
      /* viewer-only box */
    }
    stroke(C.goldT);
    doc.setLineWidth(0.8);
    doc.roundedRect(x, yy, 10, 10, 2, 2, 'S');
    doc.setLineWidth(0.5);
  };

  const verdictTitle = en.verdict[v.verdict].title;
  const seal = en.verdict[v.verdict].seal;
  const sealColor: RGB = v.verdict === 'MANDATORY' ? C.red : v.verdict === 'NEEDS_CA_REVIEW' ? C.amb : C.green;
  const dateStr = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
  const rid = 'BM-GST-' + Date.now().toString(36).toUpperCase().slice(-6);
  const law = (() => {
    const [yy, mm, dd] = v.lawDate.split('-').map(Number);
    return new Date(yy, mm - 1, dd).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
  })();
  const registering = v.verdict === 'MANDATORY' || v.verdict === 'NEEDS_CA_REVIEW';

  /* ================= COVER ================= */
  fill(C.gold);
  doc.rect(0, 0, 8, H, 'F');
  if (assets.logo) doc.addImage(assets.logo, 'PNG', M, 46, 150, 35);
  else {
    font('x', 20);
    ink(C.goldT);
    doc.text('Biz Matrix', M, 70);
  }
  font('b', 8.5);
  ink(C.goldT);
  doc.text('GST REGISTRATION REPORT', W - M, 60, { align: 'right' });
  font('r', 8.5);
  ink(C.muted);
  doc.text(T('Law as on ' + law), W - M, 74, { align: 'right' });
  stroke(C.line);
  doc.setLineWidth(0.6);
  doc.line(M, 98, W - M, 98);

  let cy = 140;
  font('b', 10);
  ink(C.muted);
  doc.text('OUR FINDING', M, cy);
  font('x', 28);
  ink(C.forest);
  const tl = doc.splitTextToSize(T(verdictTitle), CW - 150);
  doc.text(tl, M, cy + 34);
  cy += 34 + tl.length * 32;
  font('r', 11);
  ink(C.body);
  const hl = doc.splitTextToSize(T(v.headline), CW - 150);
  doc.text(hl, M, cy);
  cy += hl.length * 15 + 10;
  chip(v.applyWithin ? 'APPLY WITHIN: ' + v.applyWithin.toUpperCase() : registering ? 'CONFIRM THE OPEN POINTS' : 'NO REGISTRATION NEEDED NOW', M, cy + 4, C.goldS, C.goldT);
  cy += 26;

  const gx = W - M - 58;
  const gy = 196;
  doc.setLineWidth(2);
  stroke(C.goldT);
  doc.circle(gx, gy, 52, 'S');
  doc.setLineWidth(0.8);
  doc.setLineDashPattern([2, 2], 0);
  doc.circle(gx, gy, 46, 'S');
  doc.setLineDashPattern([], 0);
  doc.setLineWidth(0.5);
  font('x', seal.length > 9 ? 11 : 14);
  ink(sealColor);
  const sl = doc.splitTextToSize(seal, 80);
  doc.text(sl, gx, gy + (sl.length > 1 ? -2 : 4), { align: 'center' });
  font('b', 6.8);
  ink(C.goldT);
  doc.text('GST REGISTRATION', gx, gy + 22, { align: 'center' });

  // At a glance tiles
  y = Math.max(cy + 10, 300);
  font('b', 8.5);
  ink(C.muted);
  doc.text('AT A GLANCE', M, y);
  y += 10;
  const tiles: [string, string][] = [
    ['Limit in your State', v.stateLimitLakh ? `₹${v.stateLimitLakh} lakh` : '-'],
    ['Your turnover', turnoverLabel ?? '-'],
    ['Apply within', v.applyWithin ?? 'Not needed now'],
    ['Documents', String(v.docCount)],
  ];
  const tw = (CW - 3 * 8) / 4;
  tiles.forEach(([k, val], i) => {
    const x0 = M + i * (tw + 8);
    fill(C.soft);
    stroke(C.line);
    doc.roundedRect(x0, y, tw, 56, 6, 6, 'FD');
    font('b', 7.2);
    ink(C.muted);
    doc.text(T(k.toUpperCase()), x0 + 10, y + 16);
    font('x', val.length > 14 ? 10 : 13);
    ink(C.forest);
    doc.text(doc.splitTextToSize(T(val), tw - 18), x0 + 10, y + 34);
  });
  y += 76;

  // Inputs
  font('b', 8.5);
  ink(C.muted);
  doc.text('YOUR INPUTS', M, y);
  y += 8;
  const half = Math.ceil(inputs.length / 2);
  const colW = (CW - 16) / 2;
  [inputs.slice(0, half), inputs.slice(half)].forEach((col, ci) => {
    let yy = y;
    col.forEach(([k, val]) => {
      const x0 = M + ci * (colW + 16);
      stroke(C.line);
      doc.line(x0, yy, x0 + colW, yy);
      font('b', 7.6);
      ink(C.muted);
      doc.text(T(k.toUpperCase()), x0, yy + 11);
      font('r', 9);
      ink(C.ink);
      const vl = doc.splitTextToSize(T(val), colW);
      doc.text(vl[0] + (vl.length > 1 ? '…' : ''), x0, yy + 23);
      yy += 30;
    });
  });

  const fy = H - 120;
  stroke(C.line);
  doc.line(M, fy, W - M, fy);
  font('b', 9);
  ink(C.ink);
  doc.text(T('Prepared using the Biz Matrix GST Registration Checker on ' + dateStr), M, fy + 18);
  font('r', 8.5);
  ink(C.muted);
  doc.text(T(`Report ID ${rid}  ·  Rulebook v${v.rulesetVersion}  ·  Law as on ${law}`), M, fy + 32);
  font('r', 8);
  doc.text(doc.splitTextToSize(T(en.result.disclaimer.replace('{date}', law)), CW), M, fy + 50);

  /* ================= PAGE 2: WHAT MATTERS ================= */
  newPage();
  if (v.confirm.length) callout('Points to confirm with a GST professional', v.confirm, C.ambS, C.amb, true);
  const extraReasons = v.reasons.filter((r) => r !== v.headline);
  if (extraReasons.length) {
    section('Why this is the result', 'Why');
    bullets(extraReasons);
  }

  /* ================= SECTION: HOW TO REGISTER ================= */
  if (registering && (v.routes.length || v.steps.length)) {
    section('What you need to do', 'What to do');
    for (const r of v.routes) {
      font('r', 9.2);
      const ls = doc.splitTextToSize(T(r.text), CW - 32);
      const h = 34 + ls.length * 12.5;
      need(h + 10);
      fill(C.soft);
      stroke(C.line);
      doc.roundedRect(M, y, CW, h, 6, 6, 'FD');
      fill(C.gold);
      doc.rect(M, y, 3.5, h, 'F');
      font('b', 11);
      ink(C.ink);
      doc.text(T(r.name), M + 16, y + 18);
      const nw = doc.getTextWidth(T(r.name));
      chip(r.form, M + 24 + nw, y + 18, C.goldS, C.goldT);
      font('r', 9.2);
      ink(C.body);
      doc.text(ls, M + 16, y + 34);
      y += h + 10;
    }
    if (v.options.length) {
      h3('Faster options you may qualify for');
      for (const o of v.options) {
        need(30 + o.conditions.length * 14);
        font('b', 10);
        ink(C.ink);
        doc.text(T(o.name), M, y + 10);
        y += 16;
        bullets(o.conditions, C.body);
      }
    }
    if (v.steps.length) {
      h3('Steps on the GST portal');
      need(120);
      const sw = CW / v.steps.length;
      const ly = y + 14;
      stroke(C.line);
      doc.setLineWidth(1);
      doc.line(M + 12, ly, M + CW - sw + 12, ly);
      doc.setLineWidth(0.5);
      let maxH = 0;
      v.steps.forEach((s, i) => {
        const cx = M + i * sw + 12;
        if (i === 0) {
          fill(C.gold);
          doc.circle(cx, ly, 11, 'F');
        } else {
          fill(C.white);
          stroke(C.goldT);
          doc.setLineWidth(1.2);
          doc.circle(cx, ly, 11, 'FD');
          doc.setLineWidth(0.5);
        }
        font('b', 9);
        ink(i === 0 ? C.forest : C.goldT);
        doc.text(String(i + 1), cx, ly + 3.2, { align: 'center' });
        font('b', 9.4);
        ink(C.ink);
        doc.text(T(s.title), cx - 11, ly + 28);
        font('r', 7.8);
        ink(C.muted);
        const dl = doc.splitTextToSize(T(s.detail), sw - 10);
        doc.text(dl, cx - 11, ly + 42);
        maxH = Math.max(maxH, 42 + dl.length * 10);
      });
      y = ly + maxH + 14;
    }
    if (v.deadlineDays) para('Apply within 30 days of becoming liable. If you do, the registration counts from the day you became liable; if you apply later, it counts only from the date of grant.', { color: C.body });
  }

  /* ================= SECTION: DOCUMENTS ================= */
  if (v.docCount) {
    section(v.checklistIsVoluntary ? 'Documents if you register voluntarily' : 'Document checklist', 'Document checklist');
    para('Tick each item as you collect it.', { color: C.muted, size: 9 });
    for (const g of v.groups) {
      h3(CAT[g.category] ?? g.category);
      for (const r of g.rows) {
        font('r', 8.8);
        const dl = doc.splitTextToSize(T(r.detail + (r.template ? ' Use the standard format.' : '')), CW - 24);
        const h = 16 + dl.length * 11.5 + 8;
        need(h);
        checkbox(M, y + 2, r.id);
        font('b', 10);
        ink(C.ink);
        doc.text(doc.splitTextToSize(T(r.name), CW - 24)[0], M + 20, y + 11);
        font('r', 8.8);
        ink(C.body);
        doc.text(dl, M + 20, y + 25);
        y += h;
        stroke(C.line);
        doc.line(M + 20, y - 4, W - M, y - 4);
      }
    }
    if (v.beforeNotes.length) {
      h3('Before you apply');
      bullets(v.beforeNotes, C.body);
    }
  }

  /* ================= SECTION: AFTER / VOLUNTARY ================= */
  if (v.afterNotes.length) {
    section('After you get your GSTIN', 'After registration');
    bullets(v.afterNotes);
  } else if (!registering) {
    section('Should you register voluntarily?', 'Voluntary registration');
    h3('Benefits');
    bullets(en.result.voluntaryPros);
    h3('Obligations');
    bullets(en.result.voluntaryCons);
  }

  /* ================= NEXT STEPS ================= */
  section('Your next steps', 'Next steps');
  v.nextSteps.forEach((st, i) => {
    need(32);
    stroke(C.goldT);
    doc.setLineWidth(1);
    doc.circle(M + 9, y + 8, 9, 'S');
    doc.setLineWidth(0.5);
    font('b', 8.5);
    ink(C.goldT);
    doc.text(String(i + 1), M + 9, y + 11, { align: 'center' });
    font('r', 9.8);
    ink(C.ink);
    const ls = doc.splitTextToSize(T(st), CW - 30);
    doc.text(ls, M + 26, y + 11);
    y += Math.max(26, ls.length * 13 + 10);
  });
  y += 6;
  para(en.result.disclaimer.replace('{date}', law), { color: C.muted, size: 8.4 });

  /* ================= HEADERS & FOOTERS ================= */
  const n = doc.getNumberOfPages();
  for (let i = 2; i <= n; i++) {
    doc.setPage(i);
    fill(C.gold);
    doc.rect(0, 0, W, 4, 'F');
    font('b', 7.5);
    ink(C.muted);
    doc.text(T('BIZ MATRIX  ·  GST REGISTRATION REPORT  ·  ' + verdictTitle.toUpperCase()), M, 26);
    stroke(C.line);
    doc.setLineWidth(0.5);
    doc.line(M, H - 40, W - M, H - 40);
    font('r', 7.2);
    ink(C.muted);
    doc.text(T(`General guidance, law as on ${law}. Not legal or tax advice.  ·  Rulebook v${v.rulesetVersion}  ·  ${rid}`), M, H - 26);
    fill(C.gold);
    doc.roundedRect(W - M - 48, H - 35, 48, 14, 7, 7, 'F');
    font('b', 7.5);
    ink(C.ink);
    doc.text(i + ' / ' + n, W - M - 24, H - 25, { align: 'center' });
  }
  doc.setProperties({ title: 'Biz Matrix GST Registration Report', subject: 'GST registration requirement, route and documents', author: 'Biz Matrix', creator: 'Biz Matrix GST Registration Checker' });
  return doc;
}

/* ---------------- Browser download ---------------- */
let cached: ReportAssets | null = null;
async function binary(url: string): Promise<string> {
  const buf = new Uint8Array(await (await fetch(url)).arrayBuffer());
  let s = '';
  for (let i = 0; i < buf.length; i += 0x8000) s += String.fromCharCode.apply(null, Array.from(buf.subarray(i, i + 0x8000)));
  return s;
}
async function dataUrl(url: string): Promise<string | null> {
  try {
    const b = await (await fetch(url)).blob();
    return await new Promise((res, rej) => {
      const fr = new FileReader();
      fr.onload = () => res(fr.result as string);
      fr.onerror = rej;
      fr.readAsDataURL(b);
    });
  } catch {
    return null;
  }
}
async function loadAssets(): Promise<ReportAssets> {
  if (cached) return cached;
  let fonts: ReportAssets['fonts'] = null;
  try {
    const [regular, semibold, extrabold] = await Promise.all(['fonts/Inter-Regular.ttf', 'fonts/Inter-SemiBold.ttf', 'fonts/Inter-ExtraBold.ttf'].map(binary));
    fonts = { regular, semibold, extrabold };
  } catch {
    fonts = null;
  }
  cached = { fonts, logo: await dataUrl('assets/bizmatrix-logo.png') };
  return cached;
}

export async function downloadReport(v: ResultView, inputs: [string, string][], turnoverLabel: string | null) {
  const doc = buildReport(v, inputs, turnoverLabel, await loadAssets());
  const blob = doc.output('blob');
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'Biz_Matrix_GST_Registration_Report.pdf';
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    a.remove();
    URL.revokeObjectURL(url);
  }, 2000);
  return { pages: doc.getNumberOfPages(), bytes: blob.size };
}
