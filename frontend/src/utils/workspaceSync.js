// WA_INSTA_AUTOMATION/frontend/src/utils/workspaceSync.js

/**
 * Enterprise Cross-Tab Real-Time Sync Bus
 * Uses native BroadcastChannel API with localStorage event fallback.
 * Allows multiple open tabs in the same application to stay 100% in sync
 * without requiring page reloads or losing active form drafts.
 */

const CHANNEL_NAME = 'renic_workspace_sync_bus';
let channel = null;

if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
  try {
    channel = new BroadcastChannel(CHANNEL_NAME);
  } catch (err) {
    console.warn('[WorkspaceSync] BroadcastChannel init error:', err);
  }
}

/**
 * Broadcast an entity change or action to all other open tabs/windows
 * @param {string} type - Event type (e.g. 'RULE_SAVED', 'WORKFLOW_UPDATED', 'CUSTOMER_UPDATED', 'BILL_PAID')
 * @param {Object} [payload] - Updated object or identifiers
 */
export function broadcastWorkspaceEvent(type, payload = {}) {
  const eventData = {
    type,
    payload,
    timestamp: Date.now(),
    sourceTabId: window.__renicTabId || (window.__renicTabId = Math.random().toString(36).substring(2, 9))
  };

  // 1. BroadcastChannel (primary modern API)
  if (channel) {
    try {
      channel.postMessage(eventData);
    } catch (e) {
      console.warn('[WorkspaceSync] postMessage error:', e);
    }
  }

  // 2. localStorage fallback (cross-window storage event)
  try {
    localStorage.setItem('renic_last_sync_event', JSON.stringify(eventData));
  } catch (e) {
    // ignore quota/storage errors
  }
}

/**
 * Subscribe to cross-tab workspace events
 * @param {Function} callback - Called with (eventData) when an event occurs in another tab
 * @returns {Function} Unsubscribe cleanup function
 */
export function subscribeToWorkspaceEvents(callback) {
  if (typeof window === 'undefined') return () => {};

  const handleBroadcast = (event) => {
    if (event.data && typeof callback === 'function') {
      callback(event.data);
    }
  };

  const handleStorage = (event) => {
    if (event.key === 'renic_last_sync_event' && event.newValue) {
      try {
        const parsed = JSON.parse(event.newValue);
        if (parsed && typeof callback === 'function') {
          callback(parsed);
        }
      } catch (e) {}
    }
  };

  if (channel) {
    channel.addEventListener('message', handleBroadcast);
  }
  window.addEventListener('storage', handleStorage);

  return () => {
    if (channel) {
      channel.removeEventListener('message', handleBroadcast);
    }
    window.removeEventListener('storage', handleStorage);
  };
}
