// Lets the messages pages tell the sidebar/header nav badges to refetch
// immediately after a conversation is marked read, instead of waiting for
// the next full mount of those components.
const MESSAGES_READ_EVENT = "youmindo:messages-read";

export function notifyMessagesRead() {
  window.dispatchEvent(new Event(MESSAGES_READ_EVENT));
}

export function onMessagesRead(callback: () => void) {
  window.addEventListener(MESSAGES_READ_EVENT, callback);
  return () => window.removeEventListener(MESSAGES_READ_EVENT, callback);
}
