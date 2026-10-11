(() => {
  const keys = { session: 'bizmatrix.phonepe.session.v1', order: 'bizmatrix.phonepe.order.v1', draft: 'bizmatrix.assessment.v1' };
  const storage = {
    get(key) { try { return localStorage.getItem(key); } catch { return null; } },
    set(key, value) { try { localStorage.setItem(key, value); } catch { /* Access remains available in this tab. */ } },
    remove(key) { try { localStorage.removeItem(key); } catch { /* Storage may be disabled. */ } }
  };
  let token = storage.get(keys.session), premium = false, receipt = null, config = null;
  let pendingOrder = storage.get(keys.order), busy = false, dialog, lastFocus;
  const base = String(window.BIZ_API_BASE_URL || '').replace(/\/$/, '');
  const publicEntities = JSON.parse(JSON.stringify(ENTITIES));
  const publicNotes = JSON.parse(JSON.stringify(DOC_NOTES));

  async function api(endpoint, body, authenticated = true) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000);
    try {
      const response = await fetch(base + '/api' + endpoint, {
        method: body === undefined ? 'GET' : 'POST',
        headers: { ...(body === undefined ? {} : { 'Content-Type': 'application/json' }), ...(authenticated && token ? { Authorization: 'Bearer ' + token } : {}) },
        ...(body === undefined ? {} : { body: JSON.stringify(body) }),
        credentials: 'omit', cache: 'no-store', signal: controller.signal
      });
      const result = await response.json();
      if (!response.ok) throw Object.assign(new Error(result.error || 'The request could not be completed.'), { status: response.status });
      return result;
    } catch (error) {
      if (error.status) throw error;
      throw new Error('The payment service could not be reached. Please try again shortly.');
    } finally { clearTimeout(timeout); }
  }

  async function ensureSession() {
    if (!token) {
      token = (await api('/session', {}, false)).token;
      storage.set(keys.session, token);
    }
  }

  function refreshReport() {
    if (state.rec?.key) {
      const tab = document.querySelector('.tab[aria-selected="true"]')?.dataset.tab || 'overview';
      renderDashboard(); activateTab(tab);
    }
    document.querySelectorAll('[data-buy]').forEach(button => button.classList.toggle('hidden', premium));
    document.querySelectorAll('[data-receipt]').forEach(button => button.classList.toggle('hidden', !premium));
    document.querySelectorAll('.preview-badge').forEach(badge => { badge.textContent = premium ? 'Full Report Unlocked' : '35% Free Preview'; });
  }

  async function unlock(access) {
    if (!access.premium) return false;
    const catalog = await api('/premium/content');
    if (catalog.version !== 1 || !catalog.entities || Object.keys(publicEntities).some(key => !catalog.entities[key]?.docs || !catalog.entities[key]?.comp) || !catalog.registrations?.groups) throw new Error('The full report could not be loaded. Please try again.');
    for (const key of Object.keys(publicEntities)) ENTITIES[key] = catalog.entities[key];
    Object.assign(DOC_NOTES, catalog.docNotes);
    RG.hydrate(catalog.registrations);
    receipt = access.receipt;
    premium = true;
    pendingOrder = null; storage.remove(keys.order);
    refreshReport();
    return true;
  }

  function revoke() {
    premium = false; receipt = null;
    for (const key of Object.keys(publicEntities)) ENTITIES[key] = publicEntities[key];
    for (const key of Object.keys(DOC_NOTES)) delete DOC_NOTES[key];
    Object.assign(DOC_NOTES, publicNotes);
    RG.resetContent();
    refreshReport();
  }

  function message(text, error = false) {
    const element = dialog.querySelector('#paymentMessage');
    element.textContent = text;
    element.classList.toggle('payment-error', error);
  }

  function show(view) {
    lastFocus = document.activeElement;
    dialog.querySelectorAll('[data-payment-view]').forEach(panel => { panel.hidden = panel.dataset.paymentView !== view; });
    message('');
    const titles = { buy: 'Unlock your full action plan', restore: 'Restore your purchase', receipt: 'Payment verified' };
    dialog.querySelector('#paymentTitle').textContent = titles[view];
    dialog.querySelector('.pay-kicker').hidden = view !== 'buy';
    if (!dialog.open) {
      if (dialog.showModal) dialog.showModal(); else dialog.setAttribute('open', '');
    }
    dialog.querySelector(view === 'restore' ? '#accessCode' : view === 'buy' ? '#buyerName' : '#copyAccess').focus();
    if (view === 'receipt') fillReceipt();
    if (view === 'buy') {
      dialog.querySelector('#checkPayment').hidden = !pendingOrder;
      dialog.querySelector('#payPhonePe').disabled = !config?.available;
      if (!config?.available) message('Checkout is currently unavailable. Please try again later.');
    }
  }

  function close() {
    if (dialog.close) dialog.close(); else dialog.removeAttribute('open');
    lastFocus?.focus();
  }

  function fillReceipt() {
    if (!receipt) return;
    dialog.querySelector('#receiptOrder').textContent = receipt.orderId;
    dialog.querySelector('#receiptDate').textContent = new Date(receipt.paidAt).toLocaleDateString('en-IN');
    dialog.querySelector('#receiptCode').value = receipt.recoveryCode;
    dialog.querySelector('#receiptDownload').disabled = !state.rec?.key;
  }

  function saveDraft() {
    storage.set(keys.draft, JSON.stringify({ answers: state.answers, docs: state.docs, index: state.i }));
  }

  function restoreDraft() {
    try {
      const draft = JSON.parse(storage.get(keys.draft));
      if (!draft?.answers) return;
      const answers = {};
      for (const question of ALLQ) {
        const value = draft.answers[question.id];
        const choices = question.opts.map(option => option[0]);
        if (question.type === 'multi') {
          if (Array.isArray(value) && value.length && value.every(item => choices.includes(item))) answers[question.id] = value;
        } else if (choices.includes(value)) answers[question.id] = value;
      }
      state.answers = answers;
      state.i = Math.min(Object.keys(answers).length, ALLQ.length - 1);
      state.docs = draft.docs && typeof draft.docs === 'object' ? draft.docs : {};
      if (Object.keys(answers).length === ALLQ.length) generate(); else renderQuestion();
    } catch { /* An invalid draft never grants payment access. */ }
  }

  async function checkPayment() {
    if (!pendingOrder) return;
    await ensureSession();
    const result = await api('/orders/' + encodeURIComponent(pendingOrder) + '/verify', {});
    if (await unlock(result)) {
      const url = new URL(window.location.href); url.searchParams.delete('phonepe_order_id');
      window.history.replaceState({}, '', url.href);
      show('receipt');
      message('Payment verified. Your full report and PDF are unlocked.');
    } else if (['FAILED', 'EXPIRED'].includes(result.state)) {
      pendingOrder = null; storage.remove(keys.order);
      dialog.querySelector('#checkPayment').hidden = true;
      message('Payment was not completed. You can try again.', true);
    } else message('Payment is still pending. Check again after completing it in PhonePe.');
    return result;
  }

  async function run(action) {
    if (busy) return;
    busy = true;
    dialog.setAttribute('aria-busy', 'true');
    dialog.querySelectorAll('[data-network]').forEach(button => { button.disabled = true; });
    try { await action(); }
    catch (error) { message(error.message, true); }
    finally {
      busy = false; dialog.removeAttribute('aria-busy');
      dialog.querySelectorAll('[data-network]').forEach(button => { button.disabled = false; });
      dialog.querySelector('#payPhonePe').disabled = !config?.available;
    }
  }

  async function openCheckout() {
    if (premium) return show('receipt');
    show('buy');
    await run(async () => {
      config = await api('/config', undefined, false);
      if (!config.available) message('Checkout is currently unavailable. Please try again later.');
      else message('One-time payment. Total: Rs. 49.');
    });
  }

  async function initialize() {
    document.querySelector('.assess-top').insertAdjacentHTML('beforeend', '<div class="purchase-actions assess-purchase"><button class="btn primary" type="button" data-buy>Unlock for &#8377;49</button><button class="btn" type="button" data-restore>Restore Access</button><button class="btn hidden" type="button" data-receipt>Purchase Receipt</button></div>');
    dialog = document.createElement('dialog');
    dialog.className = 'payment-dialog';
    dialog.setAttribute('aria-labelledby', 'paymentTitle');
    dialog.innerHTML = `<div class="pay-top"><span class="pay-lock" aria-hidden="true"><svg viewBox="0 0 24 24" width="22" height="22"><rect x="5" y="11" width="14" height="9" rx="2" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M8 11V8a4 4 0 0 1 8 0v3" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg></span><button class="payment-close" type="button" aria-label="Close" title="Close">&times;</button></div>
      <p class="pay-kicker">One-time premium access</p>
      <h2 id="paymentTitle">Unlock your full action plan</h2>
      <section data-payment-view="buy"><p class="pay-copy">Get the complete legal analysis, statutory checklist, compliance calendar and PDF-ready report.</p><div class="pay-price"><div><b>One-Time Report Access</b><small>Inclusive of all taxes</small></div><strong>&#8377;49</strong></div><form id="purchaseForm"><label for="buyerName">Full name<input id="buyerName" name="name" autocomplete="name" required maxlength="80" placeholder="Your full name"></label><label for="buyerEmail">Email address<input id="buyerEmail" name="email" type="email" autocomplete="email" required maxlength="254" placeholder="you@example.com"></label><label for="buyerPhone">WhatsApp phone<input id="buyerPhone" name="phone" inputmode="numeric" autocomplete="tel" required maxlength="10" pattern="[6-9][0-9]{9}" placeholder="10-digit Indian mobile number"></label><button id="payPhonePe" class="btn primary pay-submit" type="submit" data-network>Continue to secure payment &#183; &#8377;49</button></form><button id="checkPayment" class="btn" type="button" data-network hidden>Check payment status</button><button class="payment-link" type="button" data-restore>Already purchased? Restore access</button><p class="pay-note">Payments are processed securely by PhonePe over HTTPS. We do not collect card or UPI details on this page.</p></section>
      <section data-payment-view="restore" hidden><p class="pay-copy">Enter the access code from your purchase receipt.</p><form id="restoreForm"><label for="accessCode">Access code<input id="accessCode" autocomplete="off" spellcheck="false" required pattern="BIZ-[A-Za-z0-9_-]{43}" placeholder="BIZ-…"></label><button class="btn primary pay-submit" type="submit" data-network>Restore access</button></form></section>
      <section data-payment-view="receipt" hidden><p class="pay-copy">Your full report and PDF are unlocked on this browser.</p><dl class="receipt-details"><dt>Total paid</dt><dd>&#8377;49</dd><dt>Order</dt><dd id="receiptOrder"></dd><dt>Date</dt><dd id="receiptDate"></dd></dl><label for="receiptCode">Access code<input id="receiptCode" readonly></label><div class="receipt-actions"><button class="btn" id="copyAccess" type="button">Copy access code</button><button class="btn primary" id="receiptDownload" type="button">Download full PDF</button></div><p class="receipt-note">Keep your access code private. You can use it to restore this purchase later.</p></section>
      <p id="paymentMessage" role="status" aria-live="polite"></p>`;
    document.body.appendChild(dialog);
    dialog.querySelector('#payPhonePe').insertAdjacentHTML('beforebegin', '<p class="payment-terms">By continuing, you agree to the <a href="../terms/" target="_blank" rel="noopener">Terms</a>, <a href="../privacy-policy/" target="_blank" rel="noopener">Privacy Policy</a> and <a href="../refund-policy/" target="_blank" rel="noopener">Refunds</a>.</p>');
    try {
      const savedBuyer = JSON.parse(storage.get('bizmatrix.buyer.v1') || '{}');
      if (savedBuyer.name) dialog.querySelector('#buyerName').value = savedBuyer.name;
      if (savedBuyer.email) dialog.querySelector('#buyerEmail').value = savedBuyer.email;
      if (savedBuyer.phone) dialog.querySelector('#buyerPhone').value = savedBuyer.phone;
    } catch { /* A saved buyer profile is only a convenience. */ }
    dialog.querySelector('.payment-close').onclick = close;
    document.addEventListener('click', event => {
      const button = event.target.closest('[data-buy],[data-restore],[data-receipt]');
      if (!button) return;
      if (button.hasAttribute('data-buy')) openCheckout();
      else if (button.hasAttribute('data-restore')) show('restore'); else show('receipt');
    });
    dialog.querySelector('#purchaseForm').onsubmit = event => {
      event.preventDefault();
      run(async () => {
        const name = dialog.querySelector('#buyerName').value.trim();
        const email = dialog.querySelector('#buyerEmail').value.trim();
        const phone = dialog.querySelector('#buyerPhone').value.trim();
        if (name.length < 2) throw new Error('Enter your full name.');
        if (email.length > 254 || !/^\S+@\S+\.\S+$/.test(email)) throw new Error('Enter a valid email address.');
        if (!/^[6-9]\d{9}$/.test(phone)) throw new Error('Enter a 10-digit Indian mobile number.');
        storage.set('bizmatrix.buyer.v1', JSON.stringify({ name, email, phone }));
        await ensureSession();
        const order = await api('/orders', { email });
        if (order.alreadyPaid) { await unlock(order); show('receipt'); return; }
        const checkout = new URL(order.checkoutUrl);
        if (order.amount !== 4900 || checkout.protocol !== 'https:' || !checkout.hostname.endsWith('.phonepe.com')) throw new Error('Checkout could not be verified. Please try again.');
        pendingOrder = order.orderId; storage.set(keys.order, pendingOrder); saveDraft();
        window.location.assign(checkout.href);
      });
    };
    dialog.querySelector('#checkPayment').onclick = () => run(checkPayment);
    dialog.querySelector('#restoreForm').onsubmit = event => {
      event.preventDefault();
      run(async () => {
        await ensureSession();
        const access = await api('/restore-access', { code: dialog.querySelector('#accessCode').value.trim() });
        await unlock(access); show('receipt'); message('Your purchase has been restored.');
      });
    };
    dialog.querySelector('#copyAccess').onclick = async () => {
      const input = dialog.querySelector('#receiptCode');
      try { await navigator.clipboard.writeText(input.value); message('Access code copied.'); }
      catch { input.focus(); input.select(); message('Select and copy your access code.'); }
    };
    dialog.querySelector('#receiptDownload').onclick = () => { if (premium) { close(); pdfNow(); } };
    document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') saveDraft(); });
    document.getElementById('newBtn').addEventListener('click', () => { if (!state.rec) storage.remove(keys.draft); });
    try {
      config = await api('/config', undefined, false);
      if (token) {
        let access;
        try { access = await api('/access'); }
        catch (error) { if (error.status !== 401) throw error; token = null; storage.remove(keys.session); revoke(); }
        if (access) await unlock(access);
      }
      const returnedOrder = new URL(window.location.href).searchParams.get('phonepe_order_id');
      if (returnedOrder && /^BIZ_[a-f0-9]{32}$/.test(returnedOrder)) { pendingOrder = returnedOrder; storage.set(keys.order, pendingOrder); }
      if (storage.get(keys.draft)) restoreDraft();
      if (pendingOrder && !premium) {
        show('buy');
        await run(checkPayment);
      }
    } catch { /* The free preview remains usable when checkout is offline. */ }
  }

  window.BizPayments = Object.freeze({ isPremium: () => premium, openCheckout });
  window.BizPaymentsReady = new Promise(resolve => document.addEventListener('DOMContentLoaded', () => { initialize().finally(resolve); }, { once: true }));
})();
