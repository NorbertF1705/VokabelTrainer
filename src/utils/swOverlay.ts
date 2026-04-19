export async function showSWOverlay(durationMs = 8000): Promise<void> {
  // Nur eine Instanz gleichzeitig
  document.getElementById('sw-overlay')?.remove();

  const lines: string[] = [`[${new Date().toLocaleTimeString('de-DE')}]`, ''];

  // Online-Status
  lines.push(`NET   ${navigator.onLine ? '✅ Online' : '❌ Offline'}`);

  // Service Worker
  if (!('serviceWorker' in navigator)) {
    lines.push('SW    nicht unterstützt');
  } else {
    const reg = await navigator.serviceWorker.getRegistration();
    if (!reg) {
      lines.push('SW    ❌ nicht registriert');
    } else {
      lines.push(`SW    scope: ${reg.scope.replace(location.origin, '')}`);
      lines.push(`      active:     ${reg.active?.state ?? '—'}`);
      lines.push(`      waiting:    ${reg.waiting?.state ?? '—'}`);
      lines.push(`      installing: ${reg.installing?.state ?? '—'}`);
    }
    const ctrl = navigator.serviceWorker.controller;
    lines.push(`CTRL  ${ctrl ? ctrl.state : '❌ kein Controller'}`);
  }

  // Caches
  if ('caches' in window) {
    lines.push('');
    const names = await caches.keys();
    if (names.length === 0) {
      lines.push('CACHE ⚠️ leer');
    } else {
      for (const name of names) {
        const cache = await caches.open(name);
        const count = (await cache.keys()).length;
        const short = name.length > 28 ? '…' + name.slice(-27) : name;
        lines.push(`CACHE ${short}`);
        lines.push(`      ${count} Einträge`);
      }
    }
  }

  const panel = document.createElement('div');
  panel.id = 'sw-overlay';
  panel.style.cssText = [
    'position:fixed', 'bottom:80px', 'left:10px', 'right:10px',
    'background:#000', 'color:#0f0', 'font-family:monospace',
    'font-size:12px', 'line-height:1.6', 'padding:12px 14px',
    'border-radius:10px', 'z-index:9999', 'opacity:0.93',
    'white-space:pre', 'overflow-x:auto',
    'box-shadow:0 4px 20px rgba(0,0,0,0.5)',
    'transition:opacity 0.5s',
  ].join(';');

  panel.textContent = lines.join('\n');
  document.body.appendChild(panel);

  // Antippen schließt sofort
  panel.addEventListener('click', () => panel.remove(), { once: true });

  // Auto-dismiss mit Fade-out
  setTimeout(() => {
    panel.style.opacity = '0';
    setTimeout(() => panel.remove(), 500);
  }, durationMs);
}
