// Stores the temporary browser-tab marker used to identify guest mode.
const GUEST_SESSION_KEY = 'goforlift.guest';

export function startGuestSession() {
  sessionStorage.setItem(GUEST_SESSION_KEY, 'true');
}

export function isGuestSession() {
  return sessionStorage.getItem(GUEST_SESSION_KEY) === 'true';
}

export function clearGuestSession() {
  sessionStorage.removeItem(GUEST_SESSION_KEY);
}
