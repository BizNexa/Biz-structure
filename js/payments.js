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
    if (!dialog.open) {
      if (dialog.showModal) dialog.showModal(); else dialog.setAttribute('open', '');
    }
    dialog.querySelector(view === 'restore' ? '#accessCode' : view === 'buy' ? '#buyerEmail' : '#copyAccess').focus();
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
    dialog.innerHTML = `<header class="payment-header"><h2 id="paymentTitle">Biz Matrix</h2><button class="payment-close" type="button" aria-label="Close" title="Close">&times;</button></header>
      <section data-payment-view="buy"><h3>Full Report</h3><p class="payment-price">&#8377;49 <span>one-time payment</span></p><p>Full content and PDF download.</p><form id="purchaseForm"><label for="buyerEmail">Email (optional)</label><input id="buyerEmail" name="email" type="email" autocomplete="email" maxlength="254"><button id="payPhonePe" class="btn primary" type="submit" data-network>Pay &#8377;49 with PhonePe</button></form><button id="checkPayment" class="btn" type="button" data-network hidden>Check Payment Status</button><button class="payment-link" type="button" data-restore>Already purchased?</button></section>
      <section data-payment-view="restore" hidden><h3>Restore Purchase</h3><form id="restoreForm"><label for="accessCode">Access code</label><input id="accessCode" autocomplete="off" spellcheck="false" required pattern="BIZ-[A-Za-z0-9_-]{43}"><button class="btn primary" type="submit" data-network>Restore Access</button></form></section>
      <section data-payment-view="receipt" hidden><h3>Payment Verified</h3><dl class="receipt-details"><dt>Total paid</dt><dd>&#8377;49</dd><dt>Order</dt><dd id="receiptOrder"></dd><dt>Date</dt><dd id="receiptDate"></dd></dl><label for="receiptCode">Access code</label><input id="receiptCode" readonly><div class="receipt-actions"><button class="btn" id="copyAccess" type="button">Copy Access Code</button><button class="btn primary" id="receiptDownload" type="button">Download Full PDF</button></div><p class="receipt-note">Keep your access code private.</p></section>
      <p id="paymentMessage" role="status" aria-live="polite"></p>`;
    document.body.appendChild(dialog);
    dialog.querySelector('#purchaseForm').insertAdjacentHTML('beforeend', '<p class="payment-terms">By continuing, you agree to the <a href="terms/" target="_blank" rel="noopener">Terms</a>, <a href="privacy-policy/" target="_blank" rel="noopener">Privacy Policy</a> and <a href="refund-policy/" target="_blank" rel="noopener">Refund Policy</a>.</p>');
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
        await ensureSession();
        const order = await api('/orders', { email: dialog.querySelector('#buyerEmail').value });
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
