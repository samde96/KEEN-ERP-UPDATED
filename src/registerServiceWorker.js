export function registerServiceWorker() {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return;
  }

  if (!import.meta.env.PROD) {
    window.addEventListener('load', () => {
      removeDevServiceWorkers();
    });
    return;
  }

  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/keen-sw.js').catch(() => {
      // The app can still run without the shell cache.
    });
  });
}

async function removeDevServiceWorkers() {
  try {
    const registrations = await navigator.serviceWorker.getRegistrations();
    await Promise.all(registrations.map((registration) => registration.unregister()));

    if ('caches' in window) {
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames
          .filter((cacheName) => cacheName.startsWith('keen-shell-'))
          .map((cacheName) => caches.delete(cacheName))
      );
    }
  } catch {
    // Dev should keep running even if the browser blocks service worker cleanup.
  }
}
