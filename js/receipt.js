/**
 * receipt.js — Printable receipt page logic for CartShare.
 */

document.addEventListener('DOMContentLoaded', () => {
  'use strict';

  const params = new URLSearchParams(window.location.search);
  const roomCode = (params.get('room') || '').toUpperCase();

  if (!roomCode || !Storage.roomExists(roomCode)) {
    document.getElementById('receipt-content').innerHTML =
      '<div class="alert alert-danger">Room not found. <a href="index.html">Go back</a>.</div>';
    return;
  }

  const room = Storage.getRoom(roomCode);

  // Header
  document.getElementById('receipt-room-code').textContent = roomCode;
  document.getElementById('receipt-date').textContent = new Date().toLocaleString();
  document.getElementById('btn-back-to-room').href = `room.html?room=${roomCode}`;

  // Participants
  const partList = document.getElementById('receipt-participants');
  room.participants.forEach(p => {
    const li = document.createElement('li');
    li.textContent = p;
    partList.appendChild(li);
  });

  // Items table
  const tbody = document.getElementById('receipt-items-body');
  let subtotal = 0;
  room.items.forEach(item => {
    const lineTotal = item.price * item.qty;
    subtotal += lineTotal;
    const tr = document.createElement('tr');

    const cells = [
      item.name,
      item.qty,
      '$' + item.price.toFixed(2),
      '$' + lineTotal.toFixed(2),
      item.addedBy
    ];
    cells.forEach(text => {
      const td = document.createElement('td');
      td.textContent = text;
      tr.appendChild(td);
    });
    tbody.appendChild(tr);
  });

  // Subtotal
  document.getElementById('receipt-subtotal').textContent = '$' + subtotal.toFixed(2);

  // Delivery status
  const threshold = room.threshold || 75;
  const deliveryEl = document.getElementById('receipt-delivery');
  if (subtotal >= threshold) {
    deliveryEl.textContent = `✅ Free delivery unlocked (threshold: $${threshold.toFixed(2)})`;
    deliveryEl.className = 'text-success fw-semibold';
  } else {
    const diff = (threshold - subtotal).toFixed(2);
    deliveryEl.textContent = `$${diff} more needed for free delivery (threshold: $${threshold.toFixed(2)})`;
    deliveryEl.className = 'text-warning fw-semibold';
  }

  // Per-person breakdown
  const breakdownBody = document.getElementById('receipt-breakdown-body');
  const perPerson = {};
  room.items.forEach(item => {
    if (!perPerson[item.addedBy]) perPerson[item.addedBy] = 0;
    perPerson[item.addedBy] += item.price * item.qty;
  });
  Object.entries(perPerson).sort((a, b) => b[1] - a[1]).forEach(([person, amount]) => {
    const tr = document.createElement('tr');
    const tdName = document.createElement('td');
    tdName.textContent = person;
    const tdAmount = document.createElement('td');
    tdAmount.textContent = '$' + amount.toFixed(2);
    tr.appendChild(tdName);
    tr.appendChild(tdAmount);
    breakdownBody.appendChild(tr);
  });

  // Activity summary (last 10)
  const logList = document.getElementById('receipt-log');
  const log = (room.log || []).slice(0, 10);
  if (!log.length) {
    const li = document.createElement('li');
    li.textContent = 'No activity recorded.';
    logList.appendChild(li);
  } else {
    log.forEach(entry => {
      const li = document.createElement('li');
      const time = new Date(entry.timestamp).toLocaleTimeString();
      li.textContent = `[${time}] ${entry.user} ${entry.action}`;
      if (entry.detail) li.textContent += ` — ${entry.detail}`;
      logList.appendChild(li);
    });
  }

  // Print button
  document.getElementById('btn-print').addEventListener('click', () => {
    window.print();
  });
});
