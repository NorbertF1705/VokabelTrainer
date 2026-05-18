import { useNavigate } from 'react-router-dom';
import { useLearning } from '../context/LearningContext';
import type { QueryDirection } from '../context/LearningContext';
import { useActiveFile } from '../hooks/useActiveFile';
import { Colors, BOX_LABELS } from '../constants/theme';
import { APP_VERSION } from '../version';

export default function Home() {
  const navigate = useNavigate();
  const { settings, updateSettings, getDueCards, getNewCards, getBoxCounts } = useLearning();
  const activeFile = useActiveFile();

  const dueCards = getDueCards();
  const newCards = getNewCards();
  const boxCounts = getBoxCounts();
  const totalDue = dueCards.length;
  const totalNew = newCards.length;

  const abbr = activeFile ? activeFile.manifest.language.toUpperCase() : '??';
  const dirConfig: { dir: QueryDirection; label: string }[] = [
    { dir: 'de-to-foreign', label: `DE → ${abbr}` },
    { dir: 'foreign-to-de', label: `${abbr} → DE` },
    { dir: 'random', label: '🎲 Zufall' },
  ];

  return (
    <div style={{ background: Colors.background, minHeight: '100%' }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #2D1B69 0%, #5B2D8E 60%, #8B3DCC 100%)',
        padding: '32px 24px 28px',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        borderBottomLeftRadius: 24, borderBottomRightRadius: 24,
      }}>
        <span style={{ fontSize: 48, marginBottom: 8 }}>🎓</span>
        <h1 style={{ fontSize: 28, fontWeight: 900, color: '#fff', letterSpacing: -1, margin: 0, textAlign: 'center' }}>Norbert's VokabelTrainer</h1>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', marginTop: 6, fontWeight: 500 }}>
          Lerne täglich – Schritt für Schritt
        </p>
        <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 4, fontWeight: 500 }}>
          v{APP_VERSION}
        </p>
      </div>

      <div style={{ padding: '0 20px 32px' }}>
        {/* Direction Selector */}
        <section style={{ marginTop: 24 }}>
          <p style={sectionTitle}>Abfragerichtung</p>
          <div style={{ display: 'flex', gap: 10 }}>
            {dirConfig.map(({ dir, label }) => (
              <button
                key={dir}
                onClick={() => updateSettings({ queryDirection: dir })}
                style={{
                  ...toggleBtn,
                  ...(settings.queryDirection === dir ? toggleBtnActive : {}),
                }}
              >
                <span style={{
                  fontSize: 16, fontWeight: 800,
                  color: settings.queryDirection === dir ? Colors.purple : Colors.textMuted,
                }}>{label}</span>
              </button>
            ))}
          </div>
        </section>

        {/* Due Today Banner */}
        <button
          onClick={() => navigate('/learn')}
          style={{
            width: '100%', marginTop: 24, borderRadius: 16, overflow: 'hidden',
            border: 'none', cursor: 'pointer', padding: 0,
            boxShadow: '0 4px 16px rgba(45,27,105,0.18)',
          }}
        >
          <div style={{
            background: totalDue > 0
              ? 'linear-gradient(90deg, #FF6B6B, #FF8E53)'
              : 'linear-gradient(90deg, #2ECC71, #27AE60)',
            padding: '20px 24px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: 42, fontWeight: 900, color: '#fff', lineHeight: 1 }}>{totalDue}</div>
              <div style={{ fontSize: 15, color: 'rgba(255,255,255,0.9)', fontWeight: 600, marginTop: 4 }}>
                {totalDue === 1 ? 'Karte fällig heute' : 'Karten fällig heute'}
              </div>
              {totalNew > 0 && (
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', fontWeight: 500, marginTop: 3 }}>
                  + {totalNew} neue {totalNew === 1 ? 'Karte' : 'Karten'}
                </div>
              )}
            </div>
            <span style={{ fontSize: 32, color: '#fff', fontWeight: 900 }}>→</span>
          </div>
        </button>

        {/* Phase 6 Boxes */}
        <section style={{ marginTop: 24 }}>
          <p style={sectionTitle}>Lernkartei – Übersicht</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
            {BOX_LABELS.map((label, i) => (
              <div key={i} style={{
                background: Colors.card, borderRadius: 12, padding: '12px 8px',
                textAlign: 'center', boxShadow: '0 2px 8px rgba(45,27,105,0.08)',
                borderTop: `4px solid ${Colors.boxColors[i]}`,
              }}>
                <div style={{ fontSize: 28, fontWeight: 900, color: Colors.boxColors[i] }}>{boxCounts[i]}</div>
                <div style={{ fontSize: 11, color: Colors.textMuted, fontWeight: 600, marginTop: 2 }}>{label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Start Button */}
        <button
          onClick={() => navigate('/learn')}
          style={{
            width: '100%', marginTop: 24, padding: 0, border: 'none', cursor: 'pointer',
            borderRadius: 16, overflow: 'hidden', boxShadow: '0 4px 16px rgba(45,27,105,0.18)',
          }}
        >
          <div style={{
            background: 'linear-gradient(90deg, #A78BFA, #7C3AED)',
            padding: '18px 24px', textAlign: 'center',
            fontSize: 18, fontWeight: 800, color: '#fff',
          }}>
            🚀  Lernen starten
          </div>
        </button>
      </div>
    </div>
  );
}

const sectionTitle: React.CSSProperties = {
  fontSize: 13, fontWeight: 700, color: Colors.textMuted,
  textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10,
};

const toggleBtn: React.CSSProperties = {
  flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
  padding: '13px 10px', background: Colors.card, borderRadius: 12,
  boxShadow: '0 2px 8px rgba(45,27,105,0.08)',
  border: '2px solid transparent', cursor: 'pointer',
};

const toggleBtnActive: React.CSSProperties = {
  borderColor: Colors.purple, background: '#EDE8FF',
};
