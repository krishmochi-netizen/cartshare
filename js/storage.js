/**
 * storage.js — Data layer for CartShare.
 * ALL localStorage and sessionStorage reads/writes go through this module.
 * Keys are namespaced as `cartshare:room:<CODE>` and `cartshare:rooms`.
 */

const Storage = (() => {
  'use strict';

  const ROOM_PREFIX = 'cartshare:room:';
  const ROOMS_INDEX = 'cartshare:rooms';
  const USER_KEY = 'cartshare:user';

  // ── Helpers ──────────────────────────────────────────────────────────

  function _get(store, key) {
    try {
      const raw = store.getItem(key);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      console.warn(`Storage read error [${key}]:`, e);
      return null;
    }
  }

  function _set(store, key, value) {
    try {
      store.setItem(key, JSON.stringify(value));
      return true;
    } catch (e) {
      console.warn(`Storage write error [${key}]:`, e);
      return false;
    }
  }

  function _remove(store, key) {
    try {
      store.removeItem(key);
    } catch (e) {
      console.warn(`Storage remove error [${key}]:`, e);
    }
  }

  function roomKey(code) {
    return ROOM_PREFIX + code.toUpperCase();
  }

  /** Generate a random 6-character alphanumeric code */
  function generateCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no 0/O/1/I
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  // ── User (sessionStorage — per-tab) ─────────────────────────────────

  function getUser() {
    return _get(sessionStorage, USER_KEY);
  }

  function setUser(name, roomCode) {
    return _set(sessionStorage, USER_KEY, {
      name: name.trim(),
      room: roomCode.toUpperCase(),
      joinedAt: Date.now()
    });
  }

  function clearUser() {
    _remove(sessionStorage, USER_KEY);
  }

  // ── Room index (localStorage) ───────────────────────────────────────

  function _getRooms() {
    return _get(localStorage, ROOMS_INDEX) || [];
  }

  function _addToIndex(code) {
    const rooms = _getRooms();
    if (!rooms.includes(code)) {
      rooms.push(code);
      _set(localStorage, ROOMS_INDEX, rooms);
    }
  }

  function roomExists(code) {
    return _get(localStorage, roomKey(code)) !== null;
  }

  // ── Room CRUD ───────────────────────────────────────────────────────

  function getRoom(code) {
    return _get(localStorage, roomKey(code));
  }

  function saveRoom(code, data) {
    _set(localStorage, roomKey(code), data);
  }

  function createRoom(creatorName) {
    let code = generateCode();
    // Avoid collision (extremely unlikely)
    let attempts = 0;
    while (roomExists(code) && attempts < 20) {
      code = generateCode();
      attempts++;
    }
    const room = {
      code,
      createdBy: creatorName,
      createdAt: Date.now(),
      threshold: 75,
      participants: [creatorName],
      items: [],
      log: []
    };
    saveRoom(code, room);
    _addToIndex(code);
    return room;
  }

  function joinRoom(code, userName) {
    const room = getRoom(code);
    if (!room) return null;
    if (!room.participants.includes(userName)) {
      room.participants.push(userName);
    }
    saveRoom(code, room);
    return room;
  }

  function leaveRoom(code, userName) {
    const room = getRoom(code);
    if (!room) return;
    room.participants = room.participants.filter(n => n !== userName);
    saveRoom(code, room);
  }

  // ── Cart items ──────────────────────────────────────────────────────

  function _nextId(items) {
    if (!items.length) return 1;
    return Math.max(...items.map(i => i.id)) + 1;
  }

  function addItem(code, item) {
    const room = getRoom(code);
    if (!room) return null;
    item.id = _nextId(room.items);
    item.addedAt = Date.now();
    room.items.push(item);
    saveRoom(code, room);
    return item;
  }

  function removeItem(code, itemId) {
    const room = getRoom(code);
    if (!room) return null;
    const removed = room.items.find(i => i.id === itemId);
    room.items = room.items.filter(i => i.id !== itemId);
    saveRoom(code, room);
    return removed;
  }

  function updateItemQty(code, itemId, newQty) {
    const room = getRoom(code);
    if (!room) return null;
    const item = room.items.find(i => i.id === itemId);
    if (item) {
      item.qty = newQty;
      saveRoom(code, room);
    }
    return item;
  }

  // ── Threshold ───────────────────────────────────────────────────────

  function setThreshold(code, value) {
    const room = getRoom(code);
    if (!room) return;
    room.threshold = value;
    saveRoom(code, room);
  }

  // ── Activity log ────────────────────────────────────────────────────

  const LOG_CAP = 100;

  function addLog(code, entry) {
    const room = getRoom(code);
    if (!room) return;
    if (!room.log) room.log = [];
    entry.timestamp = Date.now();
    room.log.unshift(entry); // newest first
    if (room.log.length > LOG_CAP) room.log.length = LOG_CAP;
    saveRoom(code, room);
  }

  function getLog(code) {
    const room = getRoom(code);
    return room ? (room.log || []) : [];
  }

  // ── Public API ──────────────────────────────────────────────────────

  return {
    getUser,
    setUser,
    clearUser,
    generateCode,
    roomExists,
    getRoom,
    saveRoom,
    createRoom,
    joinRoom,
    leaveRoom,
    addItem,
    removeItem,
    updateItemQty,
    setThreshold,
    addLog,
    getLog,
    roomKey
  };
})();
