import { registerSW } from 'virtual:pwa-register';

/**
 * Registriert den Service Worker und stellt sicher, dass er beim App-Start
 * und nach Hintergrund-Phasen (iOS beendet SW nach ~30s) reaktiviert wird.
 */
export function initServiceWorker(): void {
  if (!('serviceWorker' in navigator)) return;

  // Initiale Registrierung via vite-plugin-pwa
  const updateSW = registerSW({
    // Stilles Auto-Update: neuer SW wird im Hintergrund installiert und
    // beim nächsten App-Start aktiv (kein störender Reload-Dialog)
    immediate: true,
    onRegisteredSW(_swUrl, registration) {
      if (!registration) return;

      // Stündlicher Update-Check (SW-Skript geändert → neuer Cache)
      setInterval(() => registration.update(), 60 * 60 * 1000);
    },
    onOfflineReady() {
      // App ist bereit für Offline-Betrieb – kein UI nötig
    },
  });

  // iOS-spezifisch: SW wird nach ~30s Hintergrund beendet.
  // Bei Rückkehr in den Vordergrund prüfen und ggf. neu aktivieren.
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState !== 'visible') return;

    navigator.serviceWorker.getRegistrations().then(registrations => {
      if (registrations.length === 0) {
        // SW wurde vollständig entfernt → App neu laden, damit er sich neu registriert
        updateSW(true);
      } else {
        // SW ist vorhanden → Update-Check anstoßen (reaktiviert inaktiven SW)
        registrations.forEach(reg => reg.update());
      }
    });
  });

  // pageshow: wird auf iOS beim Zurückkommen aus dem bfcache gefeuert
  // (Back-/Forward-Navigation, App-Switcher)
  window.addEventListener('pageshow', (event: PageTransitionEvent) => {
    if (!event.persisted) return;
    navigator.serviceWorker.getRegistrations().then(registrations => {
      registrations.forEach(reg => reg.update());
    });
  });
}
