/* Report section bar: numbered steps with counts, "seen" ticks, and Previous / Next at the end of each section,
   so readers can see every part of the report and move through it in order. Navigation goes through nav.js
   (data-tab / data-jump), so hash links and back/forward keep working. */
(function () {
  const SECTIONS = [
    ["overview", "Summary", "Your recommended structure"],
    ["analysis", "Analysis", "Why it fits, factor by factor"],
    ["documents", "Documents", "What to collect"],
    ["compliance", "Compliance", "Filings and due dates"],
    ["registrations", "Registrations", "Licences you need"],
    ["comparison", "Compare", "All structures side by side"],
    ["action", "Action plan", "Step-by-step next moves"]
  ];
  const bar = document.querySelector("#workspace .tabs");
  if (!bar) return;
  const seen = new Set(["overview"]);

  // 1. Numbered step buttons (same data-tab values, so nav.js handles the clicks)
  bar.classList.add("sx-bar");
  bar.setAttribute("role", "tablist");
  bar.setAttribute("aria-label", "Report sections");
  bar.innerHTML = SECTIONS.map(([id, label, hint], i) =>
    `<button class="tab sx-tab${i ? "" : " active"}" data-tab="${id}" role="tab" title="${hint}"><i class="sx-n" aria-hidden="true">${i + 1}</i><span class="sx-l">${label}</span><b class="sx-c" data-sx-count="${id}"></b></button>`
  ).join("");

  // 2. Previous / Next footer in every section
  SECTIONS.forEach(([id], i) => {
    const panel = document.getElementById("panel-" + id);
    if (!panel || panel.querySelector(".sx-foot")) return;
    const prev = SECTIONS[i - 1], next = SECTIONS[i + 1];
    const foot = document.createElement("nav");
    foot.className = "sx-foot";
    foot.setAttribute("aria-label", "Section navigation");
    foot.innerHTML =
      (prev ? `<button type="button" class="sx-prev" data-jump="${prev[0]}"><small>← Previous</small><b>${prev[1]}</b></button>` : `<span></span>`) +
      `<span class="sx-pos">Section ${i + 1} of ${SECTIONS.length}</span>` +
      (next ? `<button type="button" class="sx-next" data-jump="${next[0]}"><small>Next →</small><b>${next[1]}</b><em>${next[2]}</em></button>` : `<button type="button" class="sx-next sx-done" data-jump="overview"><small>You've reached the end</small><b>Back to Summary</b></button>`);
    panel.appendChild(foot);
  });

  // 3. "Seen" ticks follow whichever panel is visible
  function sync() {
    const open = SECTIONS.find(([id]) => { const p = document.getElementById("panel-" + id); return p && !p.classList.contains("hidden"); });
    if (open) seen.add(open[0]);
    bar.querySelectorAll(".sx-tab").forEach(b => {
      const on = open && b.dataset.tab === open[0];
      b.classList.toggle("sx-seen", seen.has(b.dataset.tab) && !on);
      b.setAttribute("aria-selected", on ? "true" : "false");
      if (on && bar.scrollWidth > bar.clientWidth) b.scrollIntoView({ block: "nearest", inline: "center", behavior: "smooth" });
    });
  }
  const mo = new MutationObserver(sync);
  SECTIONS.forEach(([id]) => { const p = document.getElementById("panel-" + id); if (p) mo.observe(p, { attributes: true, attributeFilter: ["class"] }); });

  // 4. Item counts on the tabs, refreshed when the report re-renders
  function counts() {
    try {
      if (!window.KB || typeof kbKey !== "function" || !kbKey()) return;
      const s = KB.summary(kbKey(), state.answers);
      const set = (id, n) => { const el = bar.querySelector(`[data-sx-count="${id}"]`); if (el) el.textContent = n ? String(n) : ""; };
      set("documents", s.docs);
      set("compliance", s.compInitial + s.compAnnual);
      set("registrations", s.regsMandatory + s.regsTriggered);
    } catch (e) { /* counts are a nicety; never break the report */ }
  }
  const dash = document.getElementById("dashboard");
  if (dash) new MutationObserver(() => { clearTimeout(counts.t); counts.t = setTimeout(counts, 60); }).observe(dash, { attributes: true, attributeFilter: ["class"] });
  const regs = document.getElementById("navReg");
  if (regs) new MutationObserver(counts).observe(regs, { childList: true, characterData: true, subtree: true });
  sync(); counts();
})();
