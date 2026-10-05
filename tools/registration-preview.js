const publicRegistrationData = JSON.parse(JSON.stringify({ groups: G, provisions: P, descriptions: D2, stateFlags: S2, verification: VS, sourceRefs: SR }));
function resetRegistrationContent() { hydrateRegistrations(publicRegistrationData); }

function regPreview(forReport = false) {
  const premium = AccessProvider.isPremium();
  const all = items().filter(x => premium && !forReport && F === '0' ? x.v === 0 : x.v !== 0).sort((a, b) => [2, 1, 3, 0].indexOf(a.v) - [2, 1, 3, 0].indexOf(b.v) || a.i - b.i);
  const visibleItems = (premium ? all : all.filter(x => x.r.preview).slice(0, previewLimit(all.length))).map(x => ({ ...x, provisions: prov(x.i), authority: auth(x.i), verification: VT[VS[x.i] || 'B'], sources: SR[x.i] || '', obtained: Boolean(done[x.i]) }));
  return { visibleItems, totalItems: all.length, remainingCount: all.length - visibleItems.length };
}

function hydrateRegistrations(data) {
  if (!Array.isArray(data.groups)) throw new Error('Registration data is unavailable.');
  G.splice(0, G.length, ...data.groups);
  for (const [target, source] of [[P, data.provisions], [D2, data.descriptions], [S2, data.stateFlags], [VS, data.verification], [SR, data.sourceRefs]]) {
    for (const key of Object.keys(target)) delete target[key];
    Object.assign(target, source || {});
  }
}

function render() {
  const { n, m, dn } = stats();
  const preview = regPreview();
  $("navReg").textContent = n(2);
  $("rgProf").innerHTML = '<b>Profile used:</b> ' + [EN(), ...REGQ.map(q => optionLabel(q, state.answers[q.id]))].map(x => `<span class="ch">${escapeHtml(x)}</span>`).join('');
  $("rgKpi").innerHTML = [[2, 'Mandatory', n(2)], [1, 'Conditional', n(1)], [3, 'Advisory', n(3)], [0, 'Not applicable', n(0)]].map(([v, title, total]) => `<button type="button" class="card rk k${v}" data-kf="${v}"><span>${title}</span><b>${total}</b></button>`).join('') + `<div class="card rk k4"><span>Readiness (mandatory)</span><b>${m.length ? Math.round(dn / m.length * 100) : 0}%</b><small>${dn} of ${m.length} obtained</small></div>`;
  const applicableCount = n(2) + n(1) + n(3);
  $("rgBar").innerHTML = [2, 1, 3].map(v => `<i class="${L[v][1]}" style="width:${applicableCount ? n(v) / applicableCount * 100 : 0}%"></i>`).join('');
  $("rgChips").innerHTML = [['all', 'All applicable'], ['2', 'Mandatory'], ['1', 'Conditional'], ['3', 'Advisory'], ['0', 'Not applicable']].map(([v, title]) => `<button type="button" data-rf="${v}" aria-pressed="${F === v}" class="${F === v ? 'on' : ''}">${title}</button>`).join('') + `<button type="button" data-rs="s" aria-pressed="${Boolean(SS)}" class="${SS ? 'on' : ''}">State-specific only</button><button type="button" data-rs="i" aria-pressed="${Boolean(SI)}" class="${SI ? 'on' : ''}">Industry-specific only</button>`;
  const query = QS.toLowerCase();
  let html = previewNotice(preview);
  let matches = 0;
  for (const status of F === 'all' ? [2, 1, 3] : [+F]) {
    const rows = preview.visibleItems.filter(x => x.v === status && (!SS || x.r.s !== 'No') && (!SI || x.r.i === 'Yes') && (!query || (x.r.n + x.r.d + x.r.r).toLowerCase().includes(query)));
    matches += rows.length;
    if (rows.length) html += `<h2 class="gh">${L[status][0]} (${rows.length})</h2><p class="gn">${NT[status]}</p><div class="og">${rows.map(rcard).join('')}</div>`;
  }
  if (!matches) html += '<p class="empty-preview">No registrations match these filters.</p>';
  $("rgOut").innerHTML = html + LockedPremiumSection(preview.remainingCount, 'registration reviews');
}
