import { Outlet, NavLink } from 'react-router-dom';

const TABS = [
  { to: '/', icon: '🏠', label: 'Home', end: true },
  { to: '/learn', icon: '🧠', label: 'Lernen', end: false },
  { to: '/vocabulary', icon: '📚', label: 'Vokabeln', end: false },
  { to: '/statistics', icon: '📊', label: 'Statistik', end: false },
  { to: '/settings', icon: '⚙️', label: 'Einstellungen', end: false },
];

export default function Layout() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--c-bg)' }}>
      <main style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', overflowY: 'auto', overflowX: 'hidden', WebkitOverflowScrolling: 'touch' } as React.CSSProperties}>
        <Outlet />
      </main>

      <nav style={{
        display: 'flex',
        background: '#2D1B69',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        flexShrink: 0,
        boxShadow: '0 -2px 12px rgba(45,27,105,0.3)',
      }}>
        {TABS.map(tab => (
          <NavLink
            key={tab.to}
            to={tab.to}
            end={tab.end}
            style={({ isActive }) => ({
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '10px 4px',
              textDecoration: 'none',
              gap: 2,
              color: isActive ? '#FFE66D' : '#8A7FB0',
              transition: 'color 0.15s',
            })}
          >
            <span style={{ fontSize: 22 }}>{tab.icon}</span>
            <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.2 }}>{tab.label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
