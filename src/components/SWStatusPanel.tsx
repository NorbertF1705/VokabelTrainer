import { useState, useEffect, useCallback } from 'react';
import { Colors } from '../constants/theme';
import { showSWOverlay } from '../utils/swOverlay';

interface SWInfo {
  online: boolean;
  swState: 'none' | 'installing' | 'waiting' | 'active';
  swScriptUrl: string;
  swScope: string;
  cacheNames: string[];
  cacheSizes: Record<string, number>;
  lastChecked: string;
  controllerState: string;
}

export default function SWStatusPanel() {
  const [info, setInfo] = useState<SWInfo | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [checking, setChecking] = useState(false);

  const collect = useCallback(async () => {
    const online = navigator.onLine;
    let swState: SWInfo['swState'] = 'none';
    let swScriptUrl = '—';
    let swScope = '—';
    let controllerState = '—';

    if ('serviceWorker' in navigator) {
      const regs = await navigator.serviceWorker.getRegistrations();
      if (regs.length > 0) {
        const reg = regs[0];
        swScope = reg.scope;
        if (reg.installing) { swState = 'installing'; swScriptUrl = reg.installing.scriptURL; }
        else if (reg.waiting) { swState = 'waiting'; swScriptUrl = reg.waiting.scriptURL; }
        else if (reg.active) { swState = 'active'; swScriptUrl = reg.active.scriptURL; }
      }
      if (navigator.serviceWorker.controller) {
        controllerState = navigator.serviceWorker.controller.state;
      }
    }

    const cacheNames: string[] = [];
    const cacheSizes: Record<string, number> = {};
    if ('caches' in window) {
      const names = await caches.keys();
      for (const name of names) {
        cacheNames.push(name);
        const cache = await caches.open(name);
        const keys = await cache.keys();
        cacheSizes[name] = keys.length;
      }
    }

    setInfo({
      online,
      swState,
      swScriptUrl,
      swScope,
      cacheNames,
      cacheSizes,
      lastChecked: new Date().toLocaleTimeString('de-DE'),
      controllerState,
    });
  }, []);

  useEffect(() => { collect(); }, [collect]);

  const checkUpdate = async () => {
    setChecking(true);
    try {
      const regs = await navigator.serviceWorker.getRegistrations();
      await Promise.all(regs.map(r => r.update()));
    } catch (_) {}
    await collect();
    setChecking(false);
  };

  const swColor = (state: SWInfo['swState']) => {
    if (state === 'active') return '#2ECC71';
    if (state === 'waiting') return '#FF9F43';
    if (state === 'installing') return '#4ECDC4';
    return Colors.danger;
  };

  return (
    <section style={{ marginBottom: 28 }}>
      <p style={sectionTitle}>PWA / Service Worker Status</p>
      <div style={{ background: Colors.card, borderRadius: 16, overflow: 'hidden', boxShadow: '0 2px 8px rgba(45,27,105,0.08)' }}>

        {/* Kompakt-Zeile: immer sichtbar */}
        <button
          onClick={() => { setExpanded(e => !e); if (!info) collect(); }}
          style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', background: 'transparent', border: 'none', cursor: 'pointer' }}
        >
          <span style={{ fontSize: 22, width: 32, textAlign: 'center' }}>🛰️</span>
          <div style={{ flex: 1, textAlign: 'left' }}>
            <div style={{ fontSize: 16, fontWeight: 600, color: Colors.text }}>Service Worker</div>
            {info && (
              <div style={{ fontSize: 12, marginTop: 2, display: 'flex', gap: 8 }}>
                <Dot color={info.online ? '#2ECC71' : Colors.danger} label={info.online ? 'Online' : 'Offline'} />
                <Dot color={swColor(info.swState)} label={info.swState === 'none' ? 'Kein SW' : info.swState} />
              </div>
            )}
          </div>
          <span style={{ fontSize: 18, color: Colors.textMuted }}>{expanded ? '▲' : '▼'}</span>
        </button>

        {/* Detailansicht */}
        {expanded && info && (
          <div style={{ borderTop: `1px solid ${Colors.border}`, padding: '14px 16px 16px' }}>

            <Row label="Netzwerk" value={info.online ? '✅ Online' : '❌ Offline'} />
            <Row label="SW-Status" value={info.swState} valueColor={swColor(info.swState)} />
            <Row label="Controller" value={info.controllerState || '—'} />
            <Row label="Scope" value={info.swScope} small />
            <Row label="Script" value={info.swScriptUrl.replace(location.origin, '')} small />
            <Row label="Geprüft" value={info.lastChecked} />

            {info.cacheNames.length > 0 && (
              <div style={{ marginTop: 10 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 6 }}>Caches</div>
                {info.cacheNames.map(name => (
                  <div key={name} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 12, color: Colors.textMuted, maxWidth: '75%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: Colors.text }}>{info.cacheSizes[name]} Einträge</span>
                  </div>
                ))}
              </div>
            )}

            {info.cacheNames.length === 0 && (
              <div style={{ marginTop: 8, fontSize: 13, color: Colors.danger }}>⚠️ Kein Cache gefunden</div>
            )}

            <div style={{ marginTop: 14, display: 'flex', gap: 8 }}>
              <button
                onClick={checkUpdate}
                disabled={checking || !info.online}
                style={{
                  flex: 1, padding: '11px 0',
                  background: checking || !info.online ? Colors.border : '#EDE8FF',
                  border: `2px solid ${checking || !info.online ? Colors.border : Colors.purple}`,
                  borderRadius: 10, fontSize: 14, fontWeight: 700,
                  color: checking || !info.online ? Colors.textMuted : Colors.purple,
                  cursor: checking || !info.online ? 'not-allowed' : 'pointer',
                }}
              >
                {checking ? '⏳ Prüfe ...' : '🔄 Update'}
              </button>
              <button
                onClick={() => showSWOverlay()}
                style={{
                  flex: 1, padding: '11px 0',
                  background: '#1a1a1a', border: '2px solid #333',
                  borderRadius: 10, fontSize: 14, fontWeight: 700,
                  color: '#0f0', fontFamily: 'monospace', cursor: 'pointer',
                }}
              >
                {'>'}_  Overlay
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

function Dot({ color, label }: { color: string; label: string }) {
  return (
    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
      <span style={{ width: 8, height: 8, borderRadius: 4, background: color, display: 'inline-block' }} />
      <span style={{ color: Colors.textMuted, fontWeight: 600 }}>{label}</span>
    </span>
  );
}

function Row({ label, value, valueColor, small }: { label: string; value: string; valueColor?: string; small?: boolean }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
      <span style={{ fontSize: 13, color: Colors.textMuted, fontWeight: 600, flexShrink: 0 }}>{label}</span>
      <span style={{
        fontSize: small ? 11 : 13, fontWeight: 700,
        color: valueColor ?? Colors.text,
        textAlign: 'right', maxWidth: '65%',
        wordBreak: 'break-all',
      }}>{value}</span>
    </div>
  );
}

const sectionTitle: React.CSSProperties = {
  fontSize: 13, fontWeight: 800, color: Colors.textMuted,
  textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10,
};
