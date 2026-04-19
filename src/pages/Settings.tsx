import { useLearning } from '../context/LearningContext';
import { Colors } from '../constants/theme';
import { LANGUAGE_CONFIG, ALL_LANGUAGES } from '../constants/languages';
import SWStatusPanel from '../components/SWStatusPanel';

const CARD_LIMITS = [
  { label: '10', value: 10 },
  { label: '20', value: 20 },
  { label: '30', value: 30 },
  { label: '50', value: 50 },
  { label: '∞', value: 0 },
];

export default function Settings() {
  const { selectedLanguage, setLanguage, queryDirection, setQueryDirection, dailyCardLimit, setDailyCardLimit, resetProgress, quizAutoSpeak, setQuizAutoSpeak, flashcardAutoSpeak, setFlashcardAutoSpeak } = useLearning();

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
            {ALL_LANGUAGES.map((lang, idx) => {
              const { flag: emoji, label } = LANGUAGE_CONFIG[lang];
              return (
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
            );})}
          </div>
        </section>

        {/* Abfragerichtung */}
        <section style={{ marginBottom: 28 }}>
          <p style={sectionTitle}>Abfragerichtung</p>
          <div style={card}>
            {[
              { dir: 'de-to-foreign' as const, emoji: '🇩🇪', label: 'Deutsch → Fremdsprache' },
              { dir: 'foreign-to-de' as const, emoji: '🔄', label: 'Fremdsprache → Deutsch' },
              { dir: 'random' as const, emoji: '🎲', label: 'Zufällig gemischt' },
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

        {/* Quiz – Antwort vorlesen */}
        <section style={{ marginBottom: 28 }}>
          <p style={sectionTitle}>Quiz</p>
          <div style={card}>
            <button
              onClick={() => setQuizAutoSpeak(!quizAutoSpeak)}
              style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', background: 'transparent', border: 'none', cursor: 'pointer' }}
            >
              <span style={{ fontSize: 22, width: 32, textAlign: 'center' }}>🔈</span>
              <div style={{ flex: 1, textAlign: 'left' }}>
                <div style={{ fontSize: 16, fontWeight: 600, color: Colors.text }}>Lösung vorlesen</div>
                <div style={{ fontSize: 12, color: Colors.textMuted, marginTop: 2 }}>Spricht die richtige Antwort beim Antippen vor</div>
              </div>
              <div style={{
                width: 44, height: 26, borderRadius: 13,
                background: quizAutoSpeak ? Colors.purple : Colors.border,
                position: 'relative', transition: 'background 0.2s', flexShrink: 0,
              }}>
                <div style={{
                  position: 'absolute', top: 3, left: quizAutoSpeak ? 21 : 3,
                  width: 20, height: 20, borderRadius: 10, background: '#fff',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.2)', transition: 'left 0.2s',
                }} />
              </div>
            </button>
          </div>
        </section>

        {/* Karteikarten – Antwort vorlesen */}
        <section style={{ marginBottom: 28 }}>
          <p style={sectionTitle}>Karteikarten</p>
          <div style={card}>
            <button
              onClick={() => setFlashcardAutoSpeak(!flashcardAutoSpeak)}
              style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', background: 'transparent', border: 'none', cursor: 'pointer' }}
            >
              <span style={{ fontSize: 22, width: 32, textAlign: 'center' }}>🔈</span>
              <div style={{ flex: 1, textAlign: 'left' }}>
                <div style={{ fontSize: 16, fontWeight: 600, color: Colors.text }}>Lösung vorlesen</div>
                <div style={{ fontSize: 12, color: Colors.textMuted, marginTop: 2 }}>Spricht die Rückseite beim Umdrehen vor</div>
              </div>
              <div style={{
                width: 44, height: 26, borderRadius: 13,
                background: flashcardAutoSpeak ? Colors.purple : Colors.border,
                position: 'relative', transition: 'background 0.2s', flexShrink: 0,
              }}>
                <div style={{
                  position: 'absolute', top: 3, left: flashcardAutoSpeak ? 21 : 3,
                  width: 20, height: 20, borderRadius: 10, background: '#fff',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.2)', transition: 'left 0.2s',
                }} />
              </div>
            </button>
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

        <SWStatusPanel />

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
