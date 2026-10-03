/**
 * auth.js — Login, join, leave, validation for CartShare (index.html).
 */

document.addEventListener('DOMContentLoaded', () => {
  'use strict';

  const form = document.getElementById('auth-form');
  const nameInput = document.getElementById('display-name');
  const codeInput = document.getElementById('room-code');
  const createBtn = document.getElementById('btn-create');
  const joinBtn = document.getElementById('btn-join');
  const nameError = document.getElementById('name-error');
  const codeError = document.getElementById('code-error');
  const globalAlert = document.getElementById('global-alert');

  // Show redirect-back message if any
  const params = new URLSearchParams(window.location.search);
  if (params.get('msg')) {
    showGlobal(decodeURIComponent(params.get('msg')), 'warning');
  }

  // ── Validation ──────────────────────────────────────────────────────

  function clearErrors() {
    nameError.textContent = '';
    codeError.textContent = '';
    nameInput.classList.remove('is-invalid');
    codeInput.classList.remove('is-invalid');
  }

  function validateName() {
    const v = nameInput.value.trim();
    if (!v) {
      nameError.textContent = 'Display name is required.';
      nameInput.classList.add('is-invalid');
      return null;
    }
    if (v.length > 30) {
      nameError.textContent = 'Name must be 30 characters or fewer.';
      nameInput.classList.add('is-invalid');
      return null;
    }
    return v;
  }

  function validateCode() {
    const v = codeInput.value.trim().toUpperCase();
    if (!v) {
      codeError.textContent = 'Room code is required to join.';
      codeInput.classList.add('is-invalid');
      return null;
    }
    if (!/^[A-Z0-9]{6}$/.test(v)) {
      codeError.textContent = 'Code must be exactly 6 alphanumeric characters.';
      codeInput.classList.add('is-invalid');
      return null;
    }
    return v;
  }

  function showGlobal(msg, type = 'danger') {
    globalAlert.className = `alert alert-${type}`;
    globalAlert.textContent = msg;
    globalAlert.classList.remove('d-none');
  }

  // ── Create Room ─────────────────────────────────────────────────────

  createBtn.addEventListener('click', () => {
    clearErrors();
    const name = validateName();
    if (!name) return;

    const room = Storage.createRoom(name);
    Storage.setUser(name, room.code);
    Storage.addLog(room.code, { user: name, action: 'created the room' });

    window.location.href = `room.html?room=${room.code}`;
  });

  // ── Join Room ───────────────────────────────────────────────────────

  joinBtn.addEventListener('click', () => {
    clearErrors();
    const name = validateName();
    const code = validateCode();
    if (!name || !code) return;

    if (!Storage.roomExists(code)) {
      showGlobal(`Room "${code}" does not exist. Check the code or create a new room.`);
      return;
    }

    const room = Storage.joinRoom(code, name);
    if (!room) {
      showGlobal('Failed to join room. Please try again.');
      return;
    }

    Storage.setUser(name, code);
    Storage.addLog(code, { user: name, action: 'joined the room' });

    window.location.href = `room.html?room=${code}`;
  });

  // Pressing Enter in code field triggers Join
  codeInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      joinBtn.click();
    }
  });

  // Clear inline errors on input
  nameInput.addEventListener('input', () => {
    nameInput.classList.remove('is-invalid');
    nameError.textContent = '';
  });
  codeInput.addEventListener('input', () => {
    codeInput.classList.remove('is-invalid');
    codeError.textContent = '';
  });
});
