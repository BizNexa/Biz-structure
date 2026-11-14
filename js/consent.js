/* Analytics consent for bizmatrix.in.
   - Google Analytics 4 loads ONLY after the visitor clicks "Accept". Until then nothing is sent to Google Analytics.
   - The choice is stored in this browser (localStorage "bm_consent") and can be changed any time from
     "Cookie settings" in the footer.
   - window.bmTrack(name, params) records an event when consent was given, and does nothing otherwise.
   Set GA_ID to your GA4 Measurement ID (G-XXXXXXXXXX). While it is empty, no banner is shown and nothing loads. */
(function () {
  "use strict";
  var GA_ID = "G-12QWJZJMJ7";
  var KEY = "bm_consent_v2"; // v2 = analytics + advertising; earlier analytics-only choices are asked again
  var loaded = false;

  function read() { try { return localStorage.getItem(KEY); } catch (e) { return null; } }
  function write(v) { try { localStorage.setItem(KEY, v); } catch (e) { /* private mode: ask again next visit */ } }

  window.dataLayer = window.dataLayer || [];
  function gtag() { window.dataLayer.push(arguments); }

  function loadAnalytics() {
    if (loaded || !GA_ID) return;
    loaded = true;
    window.gtag = gtag;
    // Consent Mode v2: the visitor accepted analytics and advertising cookies on the banner
    gtag("consent", "default", { ad_storage: "granted", ad_user_data: "granted", ad_personalization: "granted", analytics_storage: "granted" });
    gtag("js", new Date());
    gtag("config", GA_ID, { anonymize_ip: true });
    var s = document.createElement("script");
    s.async = true;
    s.src = "https://www.googletagmanager.com/gtag/js?id=" + encodeURIComponent(GA_ID);
    document.head.appendChild(s);
  }

  window.bmTrack = function (name, params) {
    if (loaded && window.gtag) window.gtag("event", name, params || {});
  };

  var CSS = ".bm-consent{position:fixed;left:16px;right:16px;bottom:16px;z-index:9999;max-width:560px;margin:0 auto;background:var(--surface,#fff);color:var(--ink,#1F2328);border:1px solid var(--line,#E9E1CF);border-radius:16px;box-shadow:0 18px 50px rgba(31,35,40,.22);padding:16px 18px;font:15px/1.5 system-ui,-apple-system,'Segoe UI',sans-serif}" +
    ".bm-consent p{margin:0 0 12px}.bm-consent a{color:inherit;text-decoration:underline}" +
    ".bm-consent .bm-c-btns{display:flex;gap:10px;flex-wrap:wrap}" +
    ".bm-consent button{flex:1 1 140px;min-height:44px;border-radius:10px;font:600 15px system-ui,sans-serif;cursor:pointer;border:1px solid var(--line,#E9E1CF);background:transparent;color:inherit}" +
    ".bm-consent button.bm-c-yes{background:#C9A227;border-color:#C9A227;color:#1F2328}" +
    ".bm-c-link{background:none;border:0;padding:0;color:inherit;font:inherit;text-decoration:underline;cursor:pointer;min-height:44px}" +
    "@media print{.bm-consent{display:none!important}}";

  function privacyHref() {
    var path = location.pathname.replace(/[^/]*$/, "");
    var depth = path.split("/").filter(Boolean).length;
    return (depth ? new Array(depth + 1).join("../") : "") + "privacy-policy/#cookies";
  }

  function showBanner() {
    if (document.querySelector(".bm-consent")) return;
    if (!document.getElementById("bm-consent-css")) { var st = document.createElement("style"); st.id = "bm-consent-css"; st.textContent = CSS; document.head.appendChild(st); }
    var box = document.createElement("div");
    box.className = "bm-consent"; box.setAttribute("role", "dialog"); box.setAttribute("aria-label", "Analytics and advertising cookies");
    box.innerHTML = '<p>We would like to use Google Analytics and Google advertising cookies to count visits, measure our ads and show our ads to people who have visited. They are off unless you accept. Your assessment answers and tool inputs are never sent. <a href="' + privacyHref() + '">Privacy &amp; cookies</a></p>' +
      '<div class="bm-c-btns"><button type="button" class="bm-c-no">Reject</button><button type="button" class="bm-c-yes">Accept</button></div>';
    document.body.appendChild(box);
    box.querySelector(".bm-c-yes").onclick = function () { write("granted"); box.remove(); loadAnalytics(); };
    box.querySelector(".bm-c-no").onclick = function () { write("denied"); box.remove(); };
  }

  function addFooterLink() {
    var copy = document.querySelector(".bm-f-copy");
    if (!copy || copy.querySelector(".bm-c-link")) return;
    var b = document.createElement("button");
    b.type = "button"; b.className = "bm-c-link"; b.textContent = "Cookie settings";
    b.onclick = function () {
      if (read() === "granted" && loaded) { write("denied"); location.reload(); return; } // withdrawing consent: reload without analytics
      showBanner();
    };
    copy.appendChild(document.createTextNode(" · "));
    copy.appendChild(b);
  }

  function init() {
    if (!GA_ID) return; // not configured: no banner, no analytics
    if (!document.getElementById("bm-consent-css")) { var st = document.createElement("style"); st.id = "bm-consent-css"; st.textContent = CSS; document.head.appendChild(st); }
    addFooterLink();
    var c = read();
    if (c === "granted") loadAnalytics();
    else if (c !== "denied") showBanner();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();
