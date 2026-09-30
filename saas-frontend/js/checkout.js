/* global Cashfree */
(() => {
  const API_BASE = (window.BIZ_API_BASE_URL || '').replace(/\/$/, '');
  let printAfterUnlock = false;
  let gatesApplied = false;
  const modal = () => document.getElementById('checkoutModal');
  const error = message => { document.getElementById('checkoutError').textContent = message || ''; };
  const createCard = () => {
    const card = document.createElement('aside');
    card.className = 'paywall-overlay-card';
    card.innerHTML = '<div class="lock-icon">🔒</div><span class="paywall-price">₹49 only</span><h3>Unlock Complete Action Plan & Compliance Blueprint</h3><p>Get the complete 10-point legal analysis, statutory checklist, and download the official PDF report.</p><button class="unlock-cta" type="button">Unlock Everything for ₹49</button>';
    card.querySelector('button').addEventListener('click', openCheckout);
    return card;
  };
  const gate = (selector, itemSelector, visibleCount) => {
    const root = document.querySelector(selector);
    if (!root) return;
    if (root.dataset.gated && root.querySelector('.paywall-overlay-card')) return;
    if (root.dataset.gated) { delete root.dataset.gated; root.classList.remove('gated-section'); }
    const items = [...root.querySelectorAll(itemSelector)];
    if (items.length <= visibleCount) return;
    root.dataset.gated = 'true'; root.classList.add('gated-section');
    items.slice(visibleCount).forEach(item => item.classList.add('locked-item'));
    root.append(createCard());
  };
  const gateRegistrations = () => {
    const root = document.getElementById('registrations');
    if (!root) return;
    if (root.dataset.gated && root.querySelector('.paywall-overlay-card')) return;
    if (root.dataset.gated) { delete root.dataset.gated; root.classList.remove('gated-section'); }
    root.dataset.gated = 'true'; root.classList.add('gated-section');
    root.querySelectorAll('.reg-next').forEach(item => item.classList.add('locked-item'));
    root.append(createCard());
  };
  const applyGates = () => {
    if (document.body.classList.contains('is-unlocked') || !document.getElementById('dashboard') || document.getElementById('dashboard').classList.contains('hidden')) return;
    gate('#analysis', '.analysis-item', 2);
    gate('#documents', '.check', 2);
    gate('#compliance', '.time-item', 2);
    gate('#actionPlan', '.action', 1);
    gateRegistrations();
    gatesApplied = true;
  };
  const openCheckout = () => { error(''); modal().classList.add('is-open'); modal().setAttribute('aria-hidden', 'false'); document.getElementById('customerName').focus(); };
  const closeCheckout = () => { modal().classList.remove('is-open'); modal().setAttribute('aria-hidden', 'true'); };
  const unlock = access => {
    if (access.mode !== 'paid' || !access.token || !access.order_id) {
      error('Access could not be verified by the server. Please contact support.');
      return;
    }
    document.body.classList.add('is-unlocked');
    document.querySelectorAll('.paywall-overlay-card').forEach(card => card.remove());
    const printButton = document.getElementById('printBtn');
    if (printButton && !document.getElementById('premiumBadge')) { const badge = document.createElement('span'); badge.id = 'premiumBadge'; badge.className = 'premium-badge'; badge.textContent = 'Verified Premium Access'; printButton.after(badge); }
    closeCheckout(); const toast = document.getElementById('unlockToast'); toast.classList.add('show'); setTimeout(() => toast.classList.remove('show'), 5000);
    if (printAfterUnlock) { printAfterUnlock = false; setTimeout(() => window.print(), 350); }
  };
  const assessmentSummary = () => ({ recommendation: typeof state !== 'undefined' ? state.rec?.key || null : null, fit_score: typeof state !== 'undefined' ? state.rec?.fit || null : null });
  const pay = async event => {
    event.preventDefault(); error('');
    const name = document.getElementById('customerName').value.trim();
    const email = document.getElementById('customerEmail').value.trim();
    const phone = document.getElementById('customerPhone').value.trim();
    if (!name || !/^\S+@\S+\.\S+$/.test(email) || !/^[6-9]\d{9}$/.test(phone)) { error('Enter your full name, a valid email, and a 10-digit Indian mobile number.'); return; }
    if (!API_BASE) { error('Payments are not configured yet. Set window.BIZ_API_BASE_URL to your private backend URL before going live.'); return; }
    const button = document.getElementById('checkoutSubmit'); button.disabled = true; button.textContent = 'Creating secure order…';
    try {
      const created = await fetch(`${API_BASE}/api/create-order`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ customer_name: name, customer_email: email, customer_phone: phone, assessment_summary: assessmentSummary() }) }).then(async response => { const body = await response.json(); if (!response.ok) throw new Error(body.error || 'Could not create the payment order.'); return body; });
      if (typeof Cashfree !== 'function') throw new Error('Cashfree checkout could not be loaded. Check your connection and try again.');
      const cf = Cashfree({ mode: created.mode || 'sandbox' });
      await cf.checkout({ paymentSessionId: created.payment_session_id, redirectTarget: '_modal' });
      const verified = await fetch(`${API_BASE}/api/verify-payment`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ order_id: created.order_id }) }).then(async response => { const body = await response.json(); if (!response.ok || !body.success) throw new Error(body.error || 'Payment is not yet confirmed. If you completed payment, try again shortly.'); return body; });
      unlock({ mode: 'paid', order_id: created.order_id, email, token: verified.token, timestamp: Date.now() });
    } catch (err) { error(err.message || 'Payment could not be completed. Please try again.'); }
    finally { button.disabled = false; button.textContent = 'Continue to secure payment · ₹49'; }
  };
  document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('checkoutForm').addEventListener('submit', pay); document.getElementById('checkoutClose').addEventListener('click', closeCheckout); modal().addEventListener('click', event => { if (event.target === modal()) closeCheckout(); });
    const printButton = document.getElementById('printBtn'); if (printButton) { printButton.onclick = () => { if (document.body.classList.contains('is-unlocked')) window.print(); else { printAfterUnlock = true; openCheckout(); } }; }
    new MutationObserver(applyGates).observe(document.body, { childList: true, subtree: true }); applyGates();
  });
})();
