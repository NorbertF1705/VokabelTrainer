import { useNavigate } from 'react-router-dom';
import { useLearning, Language, QueryDirection } from '../context/LearningContext';
import { Colors, BOX_LABELS } from '../constants/theme';
import { LANGUAGE_CONFIG, ALL_LANGUAGES } from '../constants/languages';

export default function Home() {
  const navigate = useNavigate();
  const { selectedLanguage, queryDirection, setLanguage, setQueryDirection, getDueCards, getBoxCounts } = useLearning();

  const boxCounts = getBoxCounts(selectedLanguage);

  const langConfig = ALL_LANGUAGES.map(lang => ({
    lang,
    label: LANGUAGE_CONFIG[lang].label,
    flag: LANGUAGE_CONFIG[lang].flag,
  }));

  const abbr = LANGUAGE_CONFIG[selectedLanguage].abbr;
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
        padding: '16px 20px 28px',
        borderBottomLeftRadius: 24, borderBottomRightRadius: 24,
      }}>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
          <button
            onClick={() => { window.open('', '_self'); window.close(); }}
            style={{
              background: 'rgba(255,255,255,0.15)', border: 'none', cursor: 'pointer',
              borderRadius: 8, padding: '5px 12px',
              fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.75)',
              letterSpacing: 0.3,
            }}
          >
            ✕ Beenden
          </button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <span style={{ fontSize: 48, marginBottom: 8 }}>🎓</span>
          <h1 style={{ fontSize: 28, fontWeight: 900, color: '#fff', letterSpacing: -1, margin: 0, textAlign: 'center' }}>Norbert's VokabelTrainer</h1>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', marginTop: 6, fontWeight: 500 }}>
            Lerne täglich – Schritt für Schritt
          </p>
        </div>
      </div>

      <div style={{ padding: '0 20px 32px' }}>
        {/* Language Selector */}
        <section style={{ marginTop: 24 }}>
          <p style={sectionTitle}>Sprache</p>
          <div style={{ display: 'flex', gap: 10 }}>
            {langConfig.map(({ lang, label, flag }) => (
              <button
                key={lang}
                onClick={() => setLanguage(lang)}
                style={{
                  ...toggleBtn,
                  ...(selectedLanguage === lang ? toggleBtnActive : {}),
                }}
              >
                <span style={{ fontSize: 20 }}>{flag}</span>
                <span style={{
                  fontSize: 15, fontWeight: 700,
                  color: selectedLanguage === lang ? Colors.purple : Colors.textMuted,
                }}>{label}</span>
              </button>
            ))}
          </div>
        </section>

        {/* Direction Selector */}
        <section style={{ marginTop: 24 }}>
          <p style={sectionTitle}>Abfragerichtung</p>
          <div style={{ display: 'flex', gap: 10 }}>
            {dirConfig.map(({ dir, label }) => (
              <button
                key={dir}
                onClick={() => setQueryDirection(dir)}
                style={{
                  ...toggleBtn,
                  ...(queryDirection === dir ? toggleBtnActive : {}),
                }}
              >
                <span style={{
                  fontSize: 16, fontWeight: 800,
                  color: queryDirection === dir ? Colors.purple : Colors.textMuted,
                }}>{label}</span>
              </button>
            ))}
          </div>
        </section>

        {/* Due Today – per Language */}
        <section style={{ marginTop: 24 }}>
          <p style={sectionTitle}>Karten fällig heute</p>
          <div style={{ display: 'flex', gap: 10 }}>
            {langConfig.map(({ lang, label, flag }) => {
              const due = getDueCards(lang).length;
              return (
                <button
                  key={lang}
                  onClick={() => { setLanguage(lang); navigate('/learn'); }}
                  style={{
                    flex: 1, padding: '18px 24px', border: 'none', cursor: 'pointer',
                    borderRadius: 16, overflow: 'hidden',
                    boxShadow: '0 4px 16px rgba(45,27,105,0.18)',
                    background: due > 0
                      ? 'linear-gradient(90deg, #FF6B6B, #FF8E53)'
                      : 'linear-gradient(90deg, #2ECC71, #27AE60)',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  }}
                >
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontSize: 18, fontWeight: 800, color: '#fff' }}>
                      {flag} {label}
                    </div>
                    <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.9)', fontWeight: 600, marginTop: 2 }}>
                      {due} {due === 1 ? 'Karte fällig' : 'Karten fällig'}
                    </div>
                  </div>
                  <span style={{ fontSize: 20, color: '#fff', fontWeight: 900 }}>→</span>
                </button>
              );
            })}
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

        {/* Phase 6 Boxes */}
        <section style={{ marginTop: 24 }}>
          <p style={sectionTitle}>Lernkartei – Status {LANGUAGE_CONFIG[selectedLanguage].label}</p>
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
