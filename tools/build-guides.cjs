// Builds the search guides: guides/index.html and guides/<slug>/index.html from tools/guides-content.cjs.
// Run: node tools/build-guides.cjs   (then node tools/bust-cache.cjs before pushing)
const fs = require("fs"), path = require("path");
const ROOT = path.join(__dirname, ".."), SITE = "https://www.bizmatrix.in";
const G = require("./guides-content.cjs");
const esc = s => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const strip = s => String(s).replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").replace(/\s+/g, " ").trim();
const TODAY = new Date().toISOString().slice(0, 10);

function head(R, { title, description, url, ld }) {
  return `<!DOCTYPE html>
<html lang="en-IN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="theme-color" content="#FBF8F1">
<title>${esc(title)} | Biz Matrix</title>
<meta name="description" content="${esc(description)}">
<meta name="robots" content="index,follow">
<link rel="canonical" href="${url}">
<meta property="og:site_name" content="Biz Matrix">
<meta property="og:locale" content="en_IN">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:type" content="article">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${SITE}/assets/og-image.png">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(title)}">
<meta name="twitter:description" content="${esc(description)}">
<meta name="twitter:image" content="${SITE}/assets/og-image.png">
<link rel="icon" href="${R}favicon.png" type="image/png">
<link rel="icon" href="${R}favicon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="${R}assets/apple-touch-icon.png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,600;12..96,800&family=Public+Sans:wght@400;500;600&family=Newsreader:opsz,wght@6..72,600&display=swap" rel="stylesheet">
<link rel="stylesheet" href="${R}css/tokens.css"><link rel="stylesheet" href="${R}css/landing.css"><link rel="stylesheet" href="${R}css/quiz.css"><link rel="stylesheet" href="${R}css/guides.css">
<script type="application/ld+json">${JSON.stringify(ld)}</script>
<script>document.documentElement.classList.add("js");</script>
<link rel="stylesheet" href="${R}css/dark.css"><script src="${R}js/theme.js"></script><link rel="stylesheet" href="${R}css/footer.css"><link rel="stylesheet" href="${R}css/whitegold.css"><link rel="stylesheet" href="${R}css/hub.css"></head>
<body>
<header>
  <div class="wrap bar">
    <a class="logo" href="${R}" aria-label="Biz Matrix home"><img src="${R}assets/bizmatrix-logo.webp" alt="Biz Matrix" width="867" height="202"></a>
    <nav aria-label="Main">
      <a class="l" href="${R}">All tools</a>
      <a class="l" href="${R}guides/">Guides</a>
      <a class="l" href="${R}business-structure/">Business Structure</a>
      <a class="l" href="${R}methodology/">How we decide</a>
      <a class="btn" href="${R}assessment/" data-cta="nav-assess">Start free assessment</a>
    </nav>
  </div>
</header>
<main id="top">
`;
}

function foot(R) {
  return `</main>
<footer class="bm-footer">
    <div class="bm-footer-in">
      <section class="bm-f-about" aria-labelledby="bmFootAbout">
        <h2 id="bmFootAbout">About Us</h2>
        <p>Biz Matrix helps Indian founders choose the right business structure and see the registrations, documents and compliances that follow, before they incorporate.</p>
        <p>Recommendations follow a published rulebook of legal rules and weighted factors. They are structured decision support, not legal, tax or professional advice.</p>
      </section>
      <nav class="bm-f-support" aria-labelledby="bmFootTools">
        <h2 id="bmFootTools">Tools</h2>
        <ul>
          <li><a href="${R}business-structure/">Business Structure Matrix</a></li>
          <li><a href="${R}gst-registration-checker/">GST Registration Checker</a></li>
          <li><a href="${R}income-tax-calculator/">Income Tax Calculator</a></li>
          <li><a href="${R}guides/">Guides</a></li>
          <li><a href="${R}methodology/">How we decide</a></li>
        </ul>
      </nav>
      <nav class="bm-f-support" aria-labelledby="bmFootSupport">
        <h2 id="bmFootSupport">Support</h2>
        <ul>
          <li><a href="${R}terms/">Terms of Service</a></li>
          <li><a href="${R}privacy-policy/">Privacy Policy</a></li>
          <li><a href="${R}refund-policy/">Refund Policy</a></li>
          <li><a href="${R}shipping-delivery/">Shipping and Delivery Policy</a></li>
          <li><a href="${R}contact/">Contact Us</a></li>
        </ul>
      </nav>
    </div>
    <p class="bm-f-copy">&copy; 2026 Biz Matrix. All rights reserved.</p>
  </footer>
<div class="sticky-cta" id="stickyCta" aria-hidden="true"><p><b>Find your structure, free</b>Full report ₹49, one-time</p><a class="btn" href="${R}assessment/" data-cta="sticky-assess" tabindex="-1">Start</a></div>
<script src="${R}js/engine.js" defer></script><script src="${R}js/quiz.js" defer></script><script src="${R}js/consent.js" defer></script>
<script>(function(){var b=document.getElementById("stickyCta"),hero=document.querySelector(".g-hero"),fin=document.querySelector(".final");if(!b||!hero||!("IntersectionObserver" in window))return;document.body.classList.add("has-sticky");var past=false,atEnd=false,set=function(){var on=past&&!atEnd;b.classList.toggle("show",on);b.setAttribute("aria-hidden",on?"false":"true");b.querySelector("a").tabIndex=on?0:-1};new IntersectionObserver(function(es){past=!es[0].isIntersecting;set()}).observe(hero);if(fin)new IntersectionObserver(function(es){atEnd=es[0].isIntersecting;set()}).observe(fin);document.querySelectorAll("[data-cta]").forEach(function(a){a.addEventListener("click",function(){if(window.bmTrack)bmTrack("cta_click",{location:a.dataset.cta})})})})();</script>
</body>
</html>
`;
}

const quiz = R => `<div class="bm-quiz" id="quiz" data-bm-quiz data-assess="${R}assessment/" data-sample="${R}assets/sample-report.pdf" aria-live="polite">
        <div class="bq-top"><span class="bq-kicker">Quick check</span></div>
        <div class="bq-body"><h2 class="bq-q">Which structure fits you?</h2><p class="bq-sub">Answer the free assessment to see your recommended structure and the registrations that follow.</p><a class="btn bq-go" href="${R}assessment/" style="margin-top:18px">Start free assessment</a></div>
      </div>`;

const finalCta = R => `<section class="final" id="start">
  <div class="wrap">
    <h2>Get the answer for your own business.</h2>
    <p class="lead">Answer 17 to 22 plain questions. Biz Matrix recommends one of seven structures, explains why, and lists the registrations, documents and compliances that follow.</p>
    <div class="btns"><a class="btn" href="${R}assessment/" data-cta="guide-final">Start free assessment</a></div>
    <p class="fine">Free result and 35% preview. Full report and PDF: ₹49, one-time. <a href="${R}assets/sample-report.pdf" target="_blank" rel="noopener" data-sample="guide-final">See a sample report</a></p>
  </div>
</section>
`;

function guidePage(g) {
  const R = "../../", url = `${SITE}/guides/${g.slug}/`;
  const ld = { "@context": "https://schema.org", "@graph": [
    { "@type": "Article", headline: g.h1, description: g.description, inLanguage: "en-IN", mainEntityOfPage: url, dateModified: TODAY,
      author: { "@type": "Organization", name: "Biz Matrix", url: SITE + "/" }, publisher: { "@type": "Organization", name: "Biz Matrix", logo: { "@type": "ImageObject", url: SITE + "/assets/bizmatrix-logo.png" } } },
    { "@type": "FAQPage", mainEntity: g.faqs.map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: strip(a) } })) },
    { "@type": "BreadcrumbList", itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE + "/" },
      { "@type": "ListItem", position: 2, name: "Guides", item: SITE + "/guides/" },
      { "@type": "ListItem", position: 3, name: g.h1, item: url } ] } ] };
  const toc = g.sections.map(s => `<li><a href="#${s.id}">${esc(s.h2)}</a></li>`).join("");
  const secs = g.sections.map((s, i) => `<section class="g-sec" id="${s.id}"><h2>${esc(s.h2)}</h2>${s.html}</section>` + (i === 1 ? `
        <aside class="g-mid" aria-label="Free check"><div><b>Not sure which applies to you?</b><span>Answer 4 quick questions and see your likely structure in 20 seconds.</span></div><a class="btn" href="#quiz" data-cta="guide-mid-${g.slug}">Take the quick check</a></aside>` : "")).join("\n        ");
  const rel = g.related.map(s => G.find(x => x.slug === s)).filter(Boolean).map(x => `<li><a href="../${x.slug}/"><b>${esc(x.h1)}</b><span>${esc(x.description)}</span></a></li>`).join("");
  return head(R, { title: g.title, description: g.description, url, ld }) + `<section class="g-hero">
  <div class="wrap">
    <nav class="g-crumbs" aria-label="Breadcrumb"><a href="${R}">Home</a><span aria-hidden="true">›</span><a href="../">Guides</a></nav>
    <p class="g-kicker">${esc(g.kicker)}</p>
    <h1>${esc(g.h1)}</h1>
    <div class="g-answer"><p class="g-answer-h">The short answer</p><p>${g.answer}</p></div>
  </div>
</section>
<div class="wrap g-grid">
  <article class="g-article">
    <nav class="g-toc" aria-label="On this page"><p>On this page</p><ol>${toc}<li><a href="#faq">Questions</a></li></ol></nav>
        ${secs}
    <section class="g-sec" id="faq"><h2>Questions</h2>
      ${g.faqs.map(([q, a]) => `<details class="g-faq"><summary>${esc(q)}</summary><p>${a}</p></details>`).join("\n      ")}
    </section>
    <p class="g-note">General information about Indian law, not legal, tax or professional advice for your situation. Fees, forms and thresholds change by notification and vary by State; confirm with a Chartered Accountant, Company Secretary or advocate before you file.</p>
    <section class="g-related" aria-labelledby="toolsH"><h2 id="toolsH">Free tools</h2><ul>
      <li><a href="${R}business-structure/#quiz" data-cta="guide-tool-quiz"><b>Find your business structure</b><span>4 quick taps, then a full plan of registrations and compliances</span></a></li>
      <li><a href="${R}entity-tax-comparison/#tool" data-cta="guide-tool-etc"><b>Entity Tax Comparison</b><span>Total tax as a proprietor, firm / LLP or Pvt Ltd for your profit</span></a></li>
      <li><a href="${R}gst-registration-checker/#checker" data-cta="guide-tool-gst"><b>GST Registration Checker</b><span>Do you need GST registration? About 2 minutes</span></a></li>
      <li><a href="${R}income-tax-calculator/#calculator" data-cta="guide-tool-itc"><b>Income Tax Calculator</b><span>Your tax for 2026-27, new vs old regime</span></a></li>
    </ul></section>
    <section class="g-related" aria-labelledby="relH"><h2 id="relH">Related guides</h2><ul>${rel}</ul></section>
  </article>
  <aside class="g-side" aria-label="Quick check">
    <div class="g-side-in">
      ${quiz(R)}
    </div>
  </aside>
</div>
` + finalCta(R) + foot(R);
}

function hubPage() {
  const R = "../", url = `${SITE}/guides/`;
  const ld = { "@context": "https://schema.org", "@graph": [
    { "@type": "CollectionPage", name: "Business structure and registration guides for India", url, inLanguage: "en-IN",
      hasPart: G.map(g => ({ "@type": "Article", headline: g.h1, url: `${SITE}/guides/${g.slug}/` })) },
    { "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: "Home", item: SITE + "/" }, { "@type": "ListItem", position: 2, name: "Guides", item: url }] } ] };
  return head(R, { title: "Business Structure and Registration Guides for India", description: "Plain-English guides for Indian founders: LLP vs Private Limited, proprietorship vs partnership, how to register an LLP, and documents for company registration.", url, ld }) + `<section class="g-hero g-hub">
  <div class="wrap g-hub-grid">
    <div>
      <nav class="g-crumbs" aria-label="Breadcrumb"><a href="${R}">Home</a></nav>
      <p class="g-kicker">Guides</p>
      <h1>Plain answers for starting a business in India.</h1>
      <p class="lead">Compare business structures, see how registration works and know which documents to collect. Then check which structure fits you.</p>
      <ul class="g-cards">
        ${G.map(g => `<li><a href="${g.slug}/"><span class="g-card-k">${esc(g.kicker)}</span><b>${esc(g.h1)}</b><span>${esc(g.description)}</span><i aria-hidden="true">Read the guide →</i></a></li>`).join("\n        ")}
      </ul>
    </div>
    <aside class="g-side" aria-label="Quick check"><div class="g-side-in">${quiz(R)}</div></aside>
  </div>
</section>
` + finalCta(R) + foot(R);
}

fs.mkdirSync(path.join(ROOT, "guides"), { recursive: true });
fs.writeFileSync(path.join(ROOT, "guides", "index.html"), hubPage());
for (const g of G) { const d = path.join(ROOT, "guides", g.slug); fs.mkdirSync(d, { recursive: true }); fs.writeFileSync(path.join(d, "index.html"), guidePage(g)); }
console.log("guides built:", G.length + 1, "pages");
