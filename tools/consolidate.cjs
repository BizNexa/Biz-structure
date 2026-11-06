// Phase 6: merge policy pages into the 5 Support pages, leave redirect stubs, rewrite links, install one footer.
// Content is moved verbatim (only the page's own <h2> become <h3> inside the merged section).
const fs = require("fs"), path = require("path");
const ROOT = path.join(__dirname, "..");
const R = f => fs.readFileSync(path.join(ROOT, f), "utf8"), W = (f, s) => fs.writeFileSync(path.join(ROOT, f), s);
const MERGE = [
  ["disclaimer", "terms", "disclaimer"],
  ["cookie-policy", "privacy-policy", "cookies"],
  ["grievance-redressal", "contact", "grievance"],
  ["corporate-information", "contact", "company"],
  ["accessibility", "contact", "accessibility"]
];
const MAP = Object.fromEntries(MERGE.map(([s, t, a]) => [s, `${t}/#${a}`]));

function main(html) { const m = html.match(/<main class="page-shell">([\s\S]*?)<\/main>/); if (!m) throw new Error("no main"); return m[1]; }
function parts(html) {
  const m = main(html);
  const h1 = (m.match(/<h1>([\s\S]*?)<\/h1>/) || [])[1] || "";
  const updated = (m.match(/<p class="updated">([\s\S]*?)<\/p>/) || [])[1] || "";
  const copy = (m.match(/<div class="page-copy">([\s\S]*)<\/div>\s*$/) || [])[1];
  if (copy === undefined) throw new Error("no page-copy");
  return { h1, updated, copy };
}
const already = (html, id) => html.includes(`id="${id}"`);

// 1. merge sources into targets
const sources = {};
for (const [src, tgt, anchor] of MERGE) {
  const s = R(`${src}/index.html`);
  if (/http-equiv="refresh"/.test(s)) { console.log("skip (already a redirect):", src); continue; }
  sources[src] = s;
  const { h1, updated, copy } = parts(s);
  let t = R(`${tgt}/index.html`);
  if (already(t, anchor)) { console.log("skip (already merged):", src); continue; }
  const body = copy.replace(/<h2>/g, "<h3>").replace(/<\/h2>/g, "</h3>").replace(/\n      /g, "\n        ");
  const section = `\n      <section class="merged" id="${anchor}" aria-labelledby="${anchor}-h">\n        <h2 id="${anchor}-h">${h1}</h2>\n        ${updated ? `<p class="updated">${updated}</p>` : ""}\n        ${body.trim()}\n      </section>\n    `;
  t = t.replace(/(<div class="page-copy">[\s\S]*)(<\/div>\s*<\/main>)/, (m, a, b) => a.replace(/\s*$/, "") + section + b);
  W(`${tgt}/index.html`, t);
  console.log("merged", src, "->", tgt + "#" + anchor);
}
// 1b. "On this page" for targets with merged sections
for (const tgt of [...new Set(MERGE.map(m => m[1]))]) {
  let t = R(`${tgt}/index.html`);
  if (t.includes('class="on-page"')) continue;
  const secs = MERGE.filter(m => m[1] === tgt).map(([, , a]) => { const h = (t.match(new RegExp(`id="${a}-h">([^<]*)<`)) || [])[1]; return h ? `<a href="#${a}">${h}</a>` : ""; }).filter(Boolean);
  if (!secs.length) continue;
  t = t.replace(/(<div class="page-copy">)/, `$1\n      <nav class="on-page" aria-label="On this page"><span>On this page:</span> ${secs.join(" · ")}</nav>`);
  W(`${tgt}/index.html`, t);
}
// 2. redirect stubs for the old URLs
for (const [src] of MERGE) {
  const s = R(`${src}/index.html`); if (/http-equiv="refresh"/.test(s)) continue;
  const title = (s.match(/<title>([^<]*)<\/title>/) || [])[1] || src;
  const to = "../" + MAP[src], abs = "https://www.bizmatrix.in/" + MAP[src];
  W(`${src}/index.html`, `<!doctype html>
<html lang="en-IN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${title}</title>
  <meta name="robots" content="noindex,follow">
  <link rel="canonical" href="${abs}">
  <meta http-equiv="refresh" content="0; url=${to}">
  <script>location.replace(${JSON.stringify(to)} + location.search);</script>
</head>
<body style="font:16px/1.6 system-ui,sans-serif;padding:24px">
  <p>This page has moved. Continue to <a href="${to}">${abs.replace("https://", "")}</a>.</p>
</body>
</html>
`);
  console.log("redirect", src, "->", MAP[src]);
}
// 3. footer + link rewrite on every published page
const pages = ["index.html", ...fs.readdirSync(ROOT, { withFileTypes: true }).filter(d => d.isDirectory() && fs.existsSync(path.join(ROOT, d.name, "index.html")) && !["github-pages-deployment", "saas-frontend", "_design", "node_modules", "worker", "tools", "tests", "saas-backend"].includes(d.name)).map(d => d.name + "/index.html")];
const footer = p => `<footer class="bm-footer">
    <div class="bm-footer-in">
      <section class="bm-f-about" aria-labelledby="bmFootAbout">
        <h2 id="bmFootAbout">About Us</h2>
        <p>Biz Matrix helps Indian founders choose the right business structure and see the registrations, documents and compliances that follow, before they incorporate.</p>
        <p>Recommendations follow a published rulebook of legal rules and weighted factors. They are structured decision support, not legal, tax or professional advice.</p>
      </section>
      <nav class="bm-f-support" aria-labelledby="bmFootSupport">
        <h2 id="bmFootSupport">Support</h2>
        <ul>
          <li><a href="${p}terms/">Terms of Service</a></li>
          <li><a href="${p}privacy-policy/">Privacy Policy</a></li>
          <li><a href="${p}refund-policy/">Refund Policy</a></li>
          <li><a href="${p}shipping-delivery/">Shipping and Delivery Policy</a></li>
          <li><a href="${p}contact/">Contact Us</a></li>
        </ul>
      </nav>
    </div>
    <p class="bm-f-copy">&copy; 2026 Biz Matrix. All rights reserved.</p>
  </footer>`;
for (const f of pages) {
  let s = R(f); if (/http-equiv="refresh"/.test(s)) continue;
  const p = f === "index.html" ? "" : "../";
  // footer
  if (!s.includes('class="bm-footer"')) {
    if (/<footer class="site-footer">[\s\S]*?<\/footer>/.test(s)) s = s.replace(/<footer class="site-footer">[\s\S]*?<\/footer>/, footer(p));
    else if (/<footer>[\s\S]*?<\/footer>/.test(s)) s = s.replace(/<footer>[\s\S]*?<\/footer>/, footer(p));
    else console.log("no footer found:", f);
  }
  // stylesheet
  if (!s.includes("css/footer.css")) s = s.replace("</head>", `<link rel="stylesheet" href="${p}css/footer.css"></head>`);
  // links to merged pages (relative and absolute forms)
  for (const [src] of MERGE) {
    const to = MAP[src];
    s = s.split(`href="${p}${src}/"`).join(`href="${p}${to}"`).split(`href="../${src}/"`).join(`href="../${to}"`).split(`href="${src}/"`).join(`href="${to}"`).split(`href="/${src}/"`).join(`href="/${to}"`).split(`https://www.bizmatrix.in/${src}/`).join(`https://www.bizmatrix.in/${to}`);
  }
  W(f, s);
}
// 4. sitemap: drop merged URLs
let sm = R("sitemap.xml");
for (const [src] of MERGE) sm = sm.replace(new RegExp(`\\s*<url>\\s*<loc>https://www\\.bizmatrix\\.in/${src}/</loc>[\\s\\S]*?</url>`), "");
W("sitemap.xml", sm);
console.log("pages updated:", pages.length);
