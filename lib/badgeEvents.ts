// Lets any page that resolves a sidebar-badge-worthy task (a message thread
// read, a daily task completed, a pending appointment approved/declined,
// etc.) tell the nav badges to refetch immediately, instead of waiting for
// the next full mount of those components.
const BADGES_CHANGED_EVENT = "youmindo:badges-changed";

export function notifyBadgesChanged() {
  window.dispatchEvent(new Event(BADGES_CHANGED_EVENT));
}

export function onBadgesChanged(callback: () => void) {
  window.addEventListener(BADGES_CHANGED_EVENT, callback);
  return () => window.removeEventListener(BADGES_CHANGED_EVENT, callback);
}
