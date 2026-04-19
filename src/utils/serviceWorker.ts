import { registerSW } from 'virtual:pwa-register';

export function initServiceWorker(): void {
  if (!('serviceWorker' in navigator)) return;

  const updateSW = registerSW({
    immediate: true,
    onRegisteredSW(_swUrl, registration) {
      if (!registration) return;

      // Stündlicher Update-Check nur wenn online – verhindert Fehler bei offline/Server-down
      setInterval(() => {
        if (navigator.onLine) registration.update().catch(() => {});
      }, 60 * 60 * 1000);

      // Wenn Netzwerk zurückkommt, einmalig auf Updates prüfen
      window.addEventListener('online', () => {
        registration.update().catch(() => {});
      }, { once: false });
    },
    onOfflineReady() {},
  });

  // iOS-spezifisch: SW wird nach ~30s Hintergrund beendet.
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState !== 'visible') return;
    if (!navigator.onLine) return; // Server unerreichbar → kein Update-Versuch

    navigator.serviceWorker.getRegistrations().then(registrations => {
      if (registrations.length === 0) {
        // SW vollständig entfernt UND online → einmalig neu laden
        if (!sessionStorage.getItem('sw-reload-attempted')) {
          sessionStorage.setItem('sw-reload-attempted', '1');
          updateSW(true);
        }
      } else {
        registrations.forEach(reg => reg.update().catch(() => {}));
      }
    });
  });

  // pageshow: iOS bfcache (Back-/Forward-Navigation, App-Switcher)
  window.addEventListener('pageshow', (event: PageTransitionEvent) => {
    if (!event.persisted || !navigator.onLine) return;
    navigator.serviceWorker.getRegistrations().then(registrations => {
      registrations.forEach(reg => reg.update().catch(() => {}));
    });
  });
}
