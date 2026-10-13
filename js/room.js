/**
 * room.js — Cart UI, activity log, threshold, and per-person breakdown for CartShare.
 */

document.addEventListener('DOMContentLoaded', () => {
  'use strict';

  // ── Guard: redirect if no user/room ─────────────────────────────────
  const user = Storage.getUser();
  const params = new URLSearchParams(window.location.search);
  const roomCode = (params.get('room') || '').toUpperCase();

  if (!user || !roomCode || !Storage.roomExists(roomCode)) {
    const msg = encodeURIComponent('Please join or create a room first.');
    window.location.href = `index.html?msg=${msg}`;
    return;
  }

  // ── DOM refs ────────────────────────────────────────────────────────
  const roomCodeEl = document.getElementById('room-code-display');
  const copyBtn = document.getElementById('btn-copy-code');
  const participantsList = document.getElementById('participants-list');
  const leaveBtn = document.getElementById('btn-leave');
  const addForm = document.getElementById('add-item-form');
  const itemNameInput = document.getElementById('item-name');
  const itemPriceInput = document.getElementById('item-price');
  const itemQtyInput = document.getElementById('item-qty');
  const itemCategoryInput = document.getElementById('item-category');
  const cartBody = document.getElementById('cart-body');
  const emptyCart = document.getElementById('empty-cart');
  const subtotalEl = document.getElementById('subtotal');
  const progressBar = document.getElementById('delivery-progress');
  const progressText = document.getElementById('delivery-text');
  const thresholdInput = document.getElementById('threshold-input');
  const thresholdBtn = document.getElementById('btn-set-threshold');
  const thresholdSection = document.getElementById('threshold-edit-section');
  const breakdownBody = document.getElementById('breakdown-body');
  const logList = document.getElementById('activity-log');
  const toastContainer = document.getElementById('toast-container');
  const receiptLink = document.getElementById('receipt-link');

  // ── Init ────────────────────────────────────────────────────────────
  roomCodeEl.textContent = roomCode;
  if (receiptLink) receiptLink.href = `receipt.html?room=${roomCode}`;

  // Show threshold edit only for room creator
  const room = Storage.getRoom(roomCode);
  if (room && room.createdBy === user.name) {
    thresholdSection.classList.remove('d-none');
  }

  render();
  Sync.init(roomCode, () => render());

  // ── Copy code ───────────────────────────────────────────────────────
  copyBtn.addEventListener('click', () => {
    navigator.clipboard.writeText(roomCode).then(() => {
      toast('Room code copied!', 'success');
    }).catch(() => {
      // Fallback
      const ta = document.createElement('textarea');
      ta.value = roomCode;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      toast('Room code copied!', 'success');
    });
  });

  // ── Leave room ──────────────────────────────────────────────────────
  leaveBtn.addEventListener('click', () => {
    Storage.addLog(roomCode, { user: user.name, action: 'left the room' });
    Storage.leaveRoom(roomCode, user.name);
    Sync.notify();
    Storage.clearUser();
    Sync.destroy();
    window.location.href = 'index.html';
  });

  // ── Add item ────────────────────────────────────────────────────────
  addForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = itemNameInput.value.trim();
    const price = parseFloat(itemPriceInput.value);
    const qty = parseInt(itemQtyInput.value, 10);
    const category = itemCategoryInput.value.trim();

    // Validation
    if (!name) { itemNameInput.classList.add('is-invalid'); return; }
    if (isNaN(price) || price <= 0) { itemPriceInput.classList.add('is-invalid'); return; }
    if (isNaN(qty) || qty < 1 || !Number.isInteger(qty)) { itemQtyInput.classList.add('is-invalid'); return; }

    const item = Storage.addItem(roomCode, {
      name,
      price: Math.round(price * 100) / 100,
      qty,
      category: category || 'General',
      addedBy: user.name
    });

    Storage.addLog(roomCode, {
      user: user.name,
      action: 'added item',
      detail: `${item.name} (×${item.qty})`
    });

    Sync.notify();
    addForm.reset();
    itemQtyInput.value = '1';
    render();
    toast(`"${item.name}" added to cart`, 'success');
  });

  // Clear inline validation on input
  [itemNameInput, itemPriceInput, itemQtyInput].forEach(el => {
    el.addEventListener('input', () => el.classList.remove('is-invalid'));
  });

  // ── Set threshold ───────────────────────────────────────────────────
  if (thresholdBtn) {
    thresholdBtn.addEventListener('click', () => {
      const val = parseFloat(thresholdInput.value);
      if (isNaN(val) || val <= 0) {
        thresholdInput.classList.add('is-invalid');
        return;
      }
      Storage.setThreshold(roomCode, Math.round(val * 100) / 100);
      Storage.addLog(roomCode, {
        user: user.name,
        action: 'changed delivery threshold',
        detail: `$${val.toFixed(2)}`
      });
      Sync.notify();
      render();
      toast('Delivery threshold updated', 'info');
    });
    thresholdInput.addEventListener('input', () => thresholdInput.classList.remove('is-invalid'));
  }

  // ── Render everything ───────────────────────────────────────────────
  function render() {
    const room = Storage.getRoom(roomCode);
    if (!room) {
      // Room was deleted in another tab
      toast('This room no longer exists.', 'danger');
      setTimeout(() => {
        Storage.clearUser();
        window.location.href = 'index.html?msg=' + encodeURIComponent('Room was deleted.');
      }, 1500);
      return;
    }

    renderParticipants(room);
    renderCart(room);
    renderTotals(room);
    renderBreakdown(room);
    renderLog(room);
  }

  function renderParticipants(room) {
    participantsList.innerHTML = '';
    room.participants.forEach(p => {
      const badge = document.createElement('span');
      badge.className = 'badge bg-primary me-1 mb-1 participant-badge';
      badge.textContent = p;
      if (p === user.name) {
        badge.classList.replace('bg-primary', 'bg-success');
        badge.textContent += ' (you)';
      }
      participantsList.appendChild(badge);
    });
  }

  function renderCart(room) {
    cartBody.innerHTML = '';
    if (!room.items.length) {
      emptyCart.classList.remove('d-none');
      return;
    }
    emptyCart.classList.add('d-none');

    room.items.forEach(item => {
      const tr = document.createElement('tr');
      tr.className = 'cart-row';

      // Name + category
      const tdName = document.createElement('td');
      const nameSpan = document.createElement('span');
      nameSpan.textContent = item.name;
      nameSpan.className = 'fw-semibold';
      tdName.appendChild(nameSpan);
      if (item.category && item.category !== 'General') {
        const catBadge = document.createElement('span');
        catBadge.className = 'badge bg-secondary ms-2 badge-category';
        catBadge.textContent = item.category;
        tdName.appendChild(catBadge);
      }
      tr.appendChild(tdName);

      // Price
      const tdPrice = document.createElement('td');
      tdPrice.textContent = '$' + item.price.toFixed(2);
      tr.appendChild(tdPrice);

      // Qty (editable)
      const tdQty = document.createElement('td');
      const qtyWrap = document.createElement('div');
      qtyWrap.className = 'd-flex align-items-center gap-1 qty-controls';

      const minusBtn = document.createElement('button');
      minusBtn.className = 'btn btn-sm btn-outline-secondary qty-btn';
      minusBtn.textContent = '−';
      minusBtn.setAttribute('aria-label', 'Decrease quantity');
      minusBtn.addEventListener('click', () => changeQty(item, -1));

      const qtySpan = document.createElement('span');
      qtySpan.className = 'qty-value';
      qtySpan.textContent = item.qty;

      const plusBtn = document.createElement('button');
      plusBtn.className = 'btn btn-sm btn-outline-secondary qty-btn';
      plusBtn.textContent = '+';
      plusBtn.setAttribute('aria-label', 'Increase quantity');
      plusBtn.addEventListener('click', () => changeQty(item, 1));

      qtyWrap.appendChild(minusBtn);
      qtyWrap.appendChild(qtySpan);
      qtyWrap.appendChild(plusBtn);
      tdQty.appendChild(qtyWrap);
      tr.appendChild(tdQty);

      // Line total
      const tdTotal = document.createElement('td');
      tdTotal.className = 'fw-semibold';
      tdTotal.textContent = '$' + (item.price * item.qty).toFixed(2);
      tr.appendChild(tdTotal);

      // Added by
      const tdBy = document.createElement('td');
      tdBy.textContent = item.addedBy;
      tr.appendChild(tdBy);

      // Remove
      const tdRemove = document.createElement('td');
      const removeBtn = document.createElement('button');
      removeBtn.className = 'btn btn-sm btn-outline-danger remove-btn';
      removeBtn.innerHTML = '<i class="bi bi-trash"></i>';
      removeBtn.setAttribute('aria-label', `Remove ${item.name}`);
      removeBtn.addEventListener('click', () => removeItem(item));
      tdRemove.appendChild(removeBtn);
      tr.appendChild(tdRemove);

      cartBody.appendChild(tr);
    });
  }

  function renderTotals(room) {
    const total = room.items.reduce((s, i) => s + i.price * i.qty, 0);
    subtotalEl.textContent = '$' + total.toFixed(2);

    const threshold = room.threshold || 75;
    thresholdInput.value = threshold;
    const pct = Math.min((total / threshold) * 100, 100);
    progressBar.style.width = pct + '%';
    progressBar.setAttribute('aria-valuenow', pct.toFixed(0));

    if (total >= threshold) {
      progressBar.classList.remove('bg-warning');
      progressBar.classList.add('bg-success');
      progressText.innerHTML = '<i class="bi bi-check-circle-fill text-success"></i> Free delivery unlocked!';
    } else {
      progressBar.classList.remove('bg-success');
      progressBar.classList.add('bg-warning');
      const remaining = (threshold - total).toFixed(2);
      progressText.innerHTML = `You need <strong>$${remaining}</strong> more for free delivery`;
    }
  }

  function renderBreakdown(room) {
    breakdownBody.innerHTML = '';
    const perPerson = {};
    room.items.forEach(item => {
      const key = item.addedBy;
      if (!perPerson[key]) perPerson[key] = 0;
      perPerson[key] += item.price * item.qty;
    });

    Object.entries(perPerson).sort((a, b) => b[1] - a[1]).forEach(([person, amount]) => {
      const tr = document.createElement('tr');
      const tdName = document.createElement('td');
      tdName.textContent = person;
      const tdAmount = document.createElement('td');
      tdAmount.className = 'fw-semibold';
      tdAmount.textContent = '$' + amount.toFixed(2);
      tr.appendChild(tdName);
      tr.appendChild(tdAmount);
      breakdownBody.appendChild(tr);
    });
  }

  function renderLog(room) {
    logList.innerHTML = '';
    const log = room.log || [];
    if (!log.length) {
      const li = document.createElement('li');
      li.className = 'list-group-item text-muted text-center';
      li.textContent = 'No activity yet.';
      logList.appendChild(li);
      return;
    }
    log.forEach(entry => {
      const li = document.createElement('li');
      li.className = 'list-group-item log-entry d-flex justify-content-between align-items-start';

      const left = document.createElement('div');
      const strong = document.createElement('strong');
      strong.textContent = entry.user;
      left.appendChild(strong);
      left.appendChild(document.createTextNode(' ' + entry.action));
      if (entry.detail) {
        const detail = document.createElement('span');
        detail.className = 'text-muted ms-1';
        detail.textContent = '— ' + entry.detail;
        left.appendChild(detail);
      }

      const timeEl = document.createElement('small');
      timeEl.className = 'text-muted text-nowrap ms-2';
      timeEl.textContent = relativeTime(entry.timestamp);

      li.appendChild(left);
      li.appendChild(timeEl);
      logList.appendChild(li);
    });
  }

  // ── Actions ─────────────────────────────────────────────────────────

  function changeQty(item, delta) {
    const newQty = item.qty + delta;
    if (newQty < 1) return;
    const oldQty = item.qty;
    Storage.updateItemQty(roomCode, item.id, newQty);
    Storage.addLog(roomCode, {
      user: user.name,
      action: 'changed quantity',
      detail: `${item.name}: ${oldQty} → ${newQty}`
    });
    Sync.notify();
    render();
  }

  function removeItem(item) {
    if (!confirm(`Remove "${item.name}" from the cart?`)) return;
    Storage.removeItem(roomCode, item.id);
    Storage.addLog(roomCode, {
      user: user.name,
      action: 'removed item',
      detail: item.name
    });
    Sync.notify();
    render();
    toast(`"${item.name}" removed`, 'warning');
  }

  // ── Utilities ───────────────────────────────────────────────────────

  function relativeTime(ts) {
    const diff = Math.floor((Date.now() - ts) / 1000);
    if (diff < 5) return 'just now';
    if (diff < 60) return diff + 's ago';
    const mins = Math.floor(diff / 60);
    if (mins < 60) return mins + ' min ago';
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return hrs + 'h ago';
    const days = Math.floor(hrs / 24);
    return days + 'd ago';
  }

  function toast(message, type = 'info') {
    const el = document.createElement('div');
    el.className = `toast align-items-center text-bg-${type} border-0 show`;
    el.setAttribute('role', 'alert');
    el.innerHTML = `
      <div class="d-flex">
        <div class="toast-body">${escapeHtml(message)}</div>
        <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
      </div>`;
    toastContainer.appendChild(el);
    setTimeout(() => {
      el.classList.remove('show');
      setTimeout(() => el.remove(), 300);
    }, 3000);
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }
});
