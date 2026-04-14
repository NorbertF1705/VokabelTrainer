import { useLearning } from '../context/LearningContext';
import { Colors } from '../constants/theme';

const CARD_LIMITS = [
  { label: '10', value: 10 },
  { label: '20', value: 20 },
  { label: '30', value: 30 },
  { label: '50', value: 50 },
  { label: '∞', value: 0 },
];

export default function Settings() {
  const { selectedLanguage, setLanguage, queryDirection, setQueryDirection, dailyCardLimit, setDailyCardLimit, resetProgress } = useLearning();

  const handleReset = () => {
    if (window.confirm('Wirklich den gesamten Lernfortschritt löschen? Alle Karten werden auf Fach 1 zurückgesetzt. Eigene Vokabeln bleiben erhalten.')) {
      resetProgress();
    }
  };

  return (
    <div style={{ background: Colors.background, minHeight: '100%' }}>
      <div style={{ background: 'linear-gradient(135deg, #2D1B69, #5B2D8E)', padding: '12px 20px' }}>
        <span style={{ fontSize: 20, fontWeight: 800, color: '#fff' }}>⚙️ Einstellungen</span>
      </div>

      <div style={{ padding: '20px 20px 40px' }}>
        {/* Sprache */}
        <section style={{ marginBottom: 28 }}>
          <p style={sectionTitle}>Lernsprache</p>
          <div style={card}>
            {[
              { lang: 'english' as const, emoji: '🇬🇧', label: 'Englisch' },
              { lang: 'spanish' as const, emoji: '🇪🇸', label: 'Spanisch' },
            ].map(({ lang, emoji, label }, idx) => (
              <div key={lang}>
                {idx > 0 && <div style={{ height: 1, background: Colors.border, margin: '0 16px' }} />}
                <button
                  onClick={() => setLanguage(lang)}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: 12,
                    padding: '14px 16px', background: selectedLanguage === lang ? '#EDE8FF' : 'transparent',
                    border: 'none', cursor: 'pointer',
                  }}
                >
                  <span style={{ fontSize: 22, width: 32, textAlign: 'center' }}>{emoji}</span>
                  <span style={{ flex: 1, fontSize: 16, fontWeight: 600, color: selectedLanguage === lang ? Colors.purple : Colors.text, textAlign: 'left' }}>{label}</span>
                  {selectedLanguage === lang && <span style={{ fontSize: 16, color: Colors.purple, fontWeight: 900 }}>✓</span>}
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* Abfragerichtung */}
        <section style={{ marginBottom: 28 }}>
          <p style={sectionTitle}>Abfragerichtung</p>
          <div style={card}>
            {[
              { dir: 'de-to-foreign' as const, emoji: '🇩🇪', label: 'Deutsch → Fremdsprache' },
              { dir: 'foreign-to-de' as const, emoji: '🔄', label: 'Fremdsprache → Deutsch' },
            ].map(({ dir, emoji, label }, idx) => (
              <div key={dir}>
                {idx > 0 && <div style={{ height: 1, background: Colors.border, margin: '0 16px' }} />}
                <button
                  onClick={() => setQueryDirection(dir)}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: 12,
                    padding: '14px 16px', background: queryDirection === dir ? '#EDE8FF' : 'transparent',
                    border: 'none', cursor: 'pointer',
                  }}
                >
                  <span style={{ fontSize: 22, width: 32, textAlign: 'center' }}>{emoji}</span>
                  <span style={{ flex: 1, fontSize: 16, fontWeight: 600, color: queryDirection === dir ? Colors.purple : Colors.text, textAlign: 'left' }}>{label}</span>
                  {queryDirection === dir && <span style={{ fontSize: 16, color: Colors.purple, fontWeight: 900 }}>✓</span>}
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* Karten pro Tag */}
        <section style={{ marginBottom: 28 }}>
          <p style={sectionTitle}>Karten pro Tag</p>
          <p style={{ fontSize: 12, color: Colors.textMuted, marginBottom: 10, fontWeight: 500 }}>Begrenzt die fälligen Karten pro Lernsitzung</p>
          <div style={{ display: 'flex', gap: 8 }}>
            {CARD_LIMITS.map(({ label, value }) => (
              <button
                key={label}
                onClick={() => setDailyCardLimit(value)}
                style={{
                  flex: 1, padding: '13px 0',
                  background: dailyCardLimit === value ? '#EDE8FF' : Colors.card,
                  border: `2px solid ${dailyCardLimit === value ? Colors.purple : Colors.border}`,
                  borderRadius: 12, fontSize: 17, fontWeight: 700,
                  color: dailyCardLimit === value ? Colors.purple : Colors.textMuted,
                  cursor: 'pointer', boxShadow: '0 2px 6px rgba(45,27,105,0.06)',
                }}
              >{label}</button>
            ))}
          </div>
        </section>

        {/* Fortschritt zurücksetzen */}
        <section style={{ marginBottom: 28 }}>
          <p style={sectionTitle}>Fortschritt</p>
          <button
            onClick={handleReset}
            style={{ width: '100%', padding: '14px 0', background: '#FFE5E5', border: `2px solid ${Colors.danger}`, borderRadius: 12, fontSize: 15, fontWeight: 700, color: Colors.danger, cursor: 'pointer' }}
          >
            🔄  Lernfortschritt zurücksetzen
          </button>
          <p style={{ fontSize: 12, color: Colors.textMuted, textAlign: 'center', marginTop: 8, fontWeight: 500 }}>Eigene Vokabeln bleiben erhalten</p>
        </section>

        {/* App beenden */}
        <section>
          <p style={sectionTitle}>App</p>
          <button
            onClick={() => window.close()}
            style={{ width: '100%', padding: '14px 0', background: '#F0F0F5', border: `2px solid ${Colors.border}`, borderRadius: 12, fontSize: 15, fontWeight: 700, color: Colors.textMuted, cursor: 'pointer' }}
          >
            ✕  App beenden
          </button>
        </section>
      </div>
    </div>
  );
}

const sectionTitle: React.CSSProperties = {
  fontSize: 13, fontWeight: 800, color: Colors.textMuted,
  textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10,
};

const card: React.CSSProperties = {
  background: Colors.card, borderRadius: 16, overflow: 'hidden',
  boxShadow: '0 2px 8px rgba(45,27,105,0.08)',
};
