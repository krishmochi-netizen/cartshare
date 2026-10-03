/**
 * sync.js — Cross-tab synchronisation for CartShare.
 * Uses the `storage` event (universal) with BroadcastChannel as enhancement.
 * Only this module listens for cross-tab events.
 */

const Sync = (() => {
  'use strict';

  let _channel = null;
  let _onUpdate = null; // callback: (roomCode) => void
  let _currentRoom = null;

  /** Initialise sync for a given room code and callback */
  function init(roomCode, onUpdate) {
    _currentRoom = roomCode.toUpperCase();
    _onUpdate = onUpdate;

    // 1. storage event (works in all browsers, fires in OTHER tabs)
    window.addEventListener('storage', _onStorageEvent);

    // 2. BroadcastChannel (enhancement — also fires in the SAME tab group)
    if (typeof BroadcastChannel !== 'undefined') {
      try {
        _channel = new BroadcastChannel('cartshare:sync:' + _currentRoom);
        _channel.onmessage = _onBroadcast;
      } catch (e) {
        console.warn('BroadcastChannel unavailable:', e);
      }
    }
  }

  /** Notify other tabs that data changed */
  function notify() {
    if (_channel) {
      try {
        _channel.postMessage({ type: 'update', room: _currentRoom, ts: Date.now() });
      } catch (e) {
        // Silently fail — storage event is the fallback
      }
    }
  }

  /** Handle native storage events (fires in OTHER tabs only) */
  function _onStorageEvent(e) {
    if (!_currentRoom || !_onUpdate) return;
    const expectedKey = Storage.roomKey(_currentRoom);
    if (e.key === expectedKey) {
      _onUpdate(_currentRoom);
    }
  }

  /** Handle BroadcastChannel messages (fires in all tabs including sender) */
  function _onBroadcast(e) {
    if (!_onUpdate) return;
    if (e.data && e.data.type === 'update' && e.data.room === _currentRoom) {
      _onUpdate(_currentRoom);
    }
  }

  /** Clean up listeners */
  function destroy() {
    window.removeEventListener('storage', _onStorageEvent);
    if (_channel) {
      try { _channel.close(); } catch (e) { /* ignore */ }
      _channel = null;
    }
    _onUpdate = null;
    _currentRoom = null;
  }

  return { init, notify, destroy };
})();
