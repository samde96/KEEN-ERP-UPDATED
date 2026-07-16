export function registerServiceWorker() {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return;
  }

  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/keen-sw.js').catch(() => {
      // The app can still run without the shell cache.
    });
  });
}
