/* Biz Matrix quick quiz: 3 or 4 taps, an indicative structure from the real decision engine, then a hand-off
   into the full assessment with those answers already filled in. Needs js/engine.js on the page.
   Mount: <div class="bm-quiz" data-bm-quiz data-assess="../assessment/" data-sample="../assets/sample-report.pdf"></div> */
(function () {
  "use strict";
  var Q = [
    { id: "objective", t: "What are you starting?", o: [["profit", "A business to earn profit", "Shop, services, startup, trading, practice"], ["nonprofit", "A non-profit", "NGO, charity, foundation"]] },
    { id: "founders", t: "How many owners at the start?", o: [["one", "Just me", "One owner"], ["two_to_six", "2 to 6 people", "Partners or co-founders"], ["seven_plus", "7 or more", "A larger group"]] },
    { id: "liability", t: "How important is it to protect your personal assets?", s: "Your own savings, house and property, if the business owes money.", o: [["critical", "Very important", "Personal assets must be protected"], ["preferred", "Important", "But cost and simplicity matter too"], ["acceptable", "Not important", "Small, low-risk work"]] },
    { id: "funding", t: "How will you fund it?", skip: function (a) { return a.objective === "nonprofit"; }, o: [["bank", "Own money or bank loans", "No outside shareholders"], ["vc", "Investors", "Angel or venture capital, now or later"]] }
  ];
  var BASE = { esop: "no", compliance: "moderate", exit: "none", foreign: "none", profit_level: "lt_25L", credibility: "low", business: "small", residency: "resident", extraction: "withdraw" };
  var KEY = "bizmatrix.assessment.v2";
  var esc = function (s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); };
  var track = function (n, p) { if (window.bmTrack) window.bmTrack(n, p || {}); };
  var LOCK = '<svg viewBox="0 0 24 24" width="15" height="15" aria-hidden="true"><rect x="5" y="11" width="14" height="9" rx="2" fill="none" stroke="currentColor" stroke-width="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';

  function mount(el) {
    var assess = el.getAttribute("data-assess") || "../assessment/", sample = el.getAttribute("data-sample") || "../assets/sample-report.pdf";
    var a = {}, step = 0, started = false;
    var visible = function () { return Q.filter(function (q) { return !(q.skip && q.skip(a)); }); };

    function render() {
      var qs = visible(), q = qs[step];
      if (!q) return result();
      var dots = qs.map(function (_, i) { return '<i class="' + (i < step ? "done" : i === step ? "on" : "") + '"></i>'; }).join("");
      el.innerHTML =
        '<div class="bq-top"><span class="bq-kicker">Quick check · ' + qs.length + ' taps</span><span class="bq-dots" aria-hidden="true">' + dots + "</span></div>" +
        '<div class="bq-body bq-in"><p class="bq-step">Question ' + (step + 1) + " of " + qs.length + "</p>" +
        '<h2 class="bq-q" tabindex="-1">' + esc(q.t) + "</h2>" + (q.s ? '<p class="bq-sub">' + esc(q.s) + "</p>" : "") +
        '<div class="bq-opts" role="group" aria-label="' + esc(q.t) + '">' +
        q.o.map(function (o) { return '<button type="button" class="bq-opt' + (a[q.id] === o[0] ? " on" : "") + '" data-v="' + o[0] + '"><b>' + esc(o[1]) + "</b><small>" + esc(o[2]) + "</small></button>"; }).join("") +
        "</div>" + (step ? '<button type="button" class="bq-back">← Back</button>' : '<p class="bq-note">Free, no sign-up. Takes 20 seconds.</p>') + "</div>";
      el.querySelectorAll(".bq-opt").forEach(function (b) {
        b.onclick = function () {
          if (!started) { started = true; track("quiz_start"); }
          a[q.id] = b.getAttribute("data-v");
          if (q.id === "objective" && a.objective === "nonprofit") delete a.funding;
          b.classList.add("on");
          setTimeout(function () { step++; render(); focusQ(); }, 160);
        };
      });
      var back = el.querySelector(".bq-back"); if (back) back.onclick = function () { step = Math.max(0, step - 1); render(); focusQ(); };
    }
    function focusQ() { var h = el.querySelector(".bq-q, .bq-res-name"); if (h && el.getBoundingClientRect().top > -40) try { h.focus({ preventScroll: true }); } catch (e) { /* older browsers */ } }

    function result() {
      var E = window.BizEngine, inp = Object.assign({}, BASE, a, { funding: a.funding || "bank" });
      if (inp.funding === "vc") inp.esop = "yes";
      var r = null, why = [], name = "", none = false;
      try { r = E.evaluate(inp); none = !r.verdict || r.verdict === "NONE"; if (!none) { name = E.NAME[r.verdict]; why = E.explain(r, inp).why.filter(function (w) { return !/profit/i.test(w); }).slice(0, 2); /* the quick check does not ask about profit */ } } catch (e) { none = true; }
      var noneWhy = a.objective === "nonprofit" ? "A Section 8 company needs at least two founders, and the other non-profit forms (trusts, societies) are outside this tool." : "Raising money from investors needs shares, and a company that issues shares to investors needs at least two founders.";
      var ru = r && r.runner_up ? E.NAME[r.runner_up] : "";
      track("quiz_complete", { structure: r && r.verdict });
      el.innerHTML =
        '<div class="bq-top"><span class="bq-kicker">Your quick result</span><button type="button" class="bq-redo">Start over</button></div>' +
        '<div class="bq-body bq-in">' +
        (none
          ? '<p class="bq-step">No single structure fits these answers yet</p><h2 class="bq-res-name" tabindex="-1">Let’s look closer</h2><p class="bq-why1">' + esc(noneWhy) + "</p>"
          : '<p class="bq-step">Your likely structure</p><h2 class="bq-res-name" tabindex="-1">' + esc(name) + "</h2>" +
            (why.length ? '<ul class="bq-why">' + why.map(function (w) { return "<li>" + esc(w) + "</li>"; }).join("") + "</ul>" : "") +
            (ru ? '<p class="bq-ru">Runner-up: ' + esc(ru) + ". Your State, sector, turnover and team can change the order.</p>" : "")) +
        '<div class="bq-locked" aria-label="Included after the full assessment">' +
          ["Registrations you need, with authority and timing", "Documents to collect, and who provides each", "First-year and recurring compliance calendar"].map(function (t) { return '<div class="bq-lk"><span class="bq-lk-i">' + LOCK + "</span><span>" + esc(t) + '</span><span class="bq-blur" aria-hidden="true"></span></div>'; }).join("") +
        "</div>" +
        '<a class="btn bq-go" href="' + esc(assess) + '" data-cta="quiz-continue">Confirm my result, free →</a>' +
        '<p class="bq-fine">Your ' + Object.keys(a).length + ' answers carry over. About 15 more questions, 3 to 5 minutes. Indicative only until then. <a href="' + esc(sample) + '" target="_blank" rel="noopener" data-sample="quiz">See a sample report</a></p>' +
        "</div>";
      el.querySelector(".bq-go").addEventListener("click", function () { prefill(); track("quiz_continue", { structure: r && r.verdict }); });
      el.querySelector(".bq-redo").onclick = function () { a = {}; step = 0; render(); focusQ(); };
      focusQ();
    }

    // Carry the answers into the full assessment (it restores this saved draft on load).
    function prefill() {
      try {
        var cur = JSON.parse(localStorage.getItem(KEY) || "null");
        if (cur && cur.done) return; // never overwrite a finished assessment
        var ans = Object.assign({}, cur && cur.answers || {}, a);
        localStorage.setItem(KEY, JSON.stringify({ v: 2, answers: ans, i: 0, done: false, at: Date.now(), from: "quiz" }));
      } catch (e) { /* storage blocked: the assessment simply starts from question 1 */ }
    }
    render();
  }

  function init() { document.querySelectorAll("[data-bm-quiz]").forEach(function (el) { if (window.BizEngine) mount(el); }); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();
