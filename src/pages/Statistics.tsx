import { useLearning } from '../context/LearningContext';
import { ALL_CATEGORIES } from '../data/vocabulary';
import { Colors, BOX_LABELS } from '../constants/theme';

export default function Statistics() {
  const { selectedLanguage, getTotalStats, getBoxCounts, allVocabulary, getCardProgress, resetProgress } = useLearning();

  const stats = getTotalStats(selectedLanguage);
  const boxCounts = getBoxCounts(selectedLanguage);
  const langLabel = selectedLanguage === 'english' ? '🇬🇧 Englisch' : '🇪🇸 Spanisch';

  const catStats = ALL_CATEGORIES.map(cat => {
    const vocabs = allVocabulary.filter(v => v.category === cat);
    const learned = vocabs.filter(v => getCardProgress(v.id, selectedLanguage).box >= 6).length;
    const started = vocabs.filter(v => { const p = getCardProgress(v.id, selectedLanguage); return p.box > 1 && p.box < 6; }).length;
    return { cat, total: vocabs.length, learned, started };
  }).filter(c => c.total > 0);

  const handleReset = () => {
    if (window.confirm('Wirklich den gesamten Lernfortschritt löschen? Alle Karten werden auf Fach 1 zurückgesetzt. Eigene Vokabeln bleiben erhalten.')) {
      resetProgress();
    }
  };

  return (
    <div style={{ background: Colors.background, minHeight: '100%' }}>
      <div style={{ background: 'linear-gradient(135deg, #2D1B69, #5B2D8E)', padding: '12px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 20, fontWeight: 800, color: '#fff' }}>📊 Statistik</span>
        <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', fontWeight: 600 }}>{langLabel}</span>
      </div>

      <div style={{ padding: '20px 20px 40px' }}>
        {/* Summary */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 28 }}>
          {[
            { label: 'Fällig heute', val: stats.dueToday, color: Colors.boxColors[0] },
            { label: 'Gelernt', val: stats.learned, color: Colors.boxColors[5] },
            { label: 'Gesamt', val: stats.total, color: Colors.secondary },
            { label: 'Erfolgsquote', val: `${stats.successRate}%`, color: Colors.success },
          ].map(({ label, val, color }) => (
            <div key={label} style={{ background: Colors.card, borderRadius: 12, padding: '14px 16px', textAlign: 'center', borderTop: `4px solid ${color}`, boxShadow: '0 2px 8px rgba(45,27,105,0.08)' }}>
              <div style={{ fontSize: 36, fontWeight: 900, color }}>{val}</div>
              <div style={{ fontSize: 12, color: Colors.textMuted, fontWeight: 600, marginTop: 2 }}>{label}</div>
            </div>
          ))}
        </div>

        {/* Phase 6 Boxes */}
        <section style={{ marginBottom: 28 }}>
          <p style={sectionTitle}>Lernkartei – Fächer</p>
          {BOX_LABELS.map((label, i) => {
            const count = boxCounts[i];
            const pct = stats.total > 0 ? (count / stats.total) * 100 : 0;
            return (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <div style={{ width: 10, height: 10, borderRadius: 5, background: Colors.boxColors[i], flexShrink: 0 }} />
                <span style={{ width: 68, fontSize: 12, fontWeight: 700, color: Colors.text }}>{label}</span>
                <div style={{ flex: 1, height: 10, background: Colors.border, borderRadius: 5, overflow: 'hidden' }}>
                  <div style={{ height: 10, background: Colors.boxColors[i], borderRadius: 5, width: `${pct}%`, transition: 'width 0.4s' }} />
                </div>
                <span style={{ width: 28, fontSize: 13, fontWeight: 800, color: Colors.boxColors[i], textAlign: 'right' }}>{count}</span>
              </div>
            );
          })}
        </section>

        {/* Category Breakdown */}
        <section style={{ marginBottom: 28 }}>
          <p style={sectionTitle}>Fortschritt nach Kategorie</p>
          {catStats.map(({ cat, total, learned, started }) => {
            const pctLearned = total > 0 ? (learned / total) * 100 : 0;
            const pctStarted = total > 0 ? ((started + learned) / total) * 100 : 0;
            return (
              <div key={cat} style={{ background: Colors.card, borderRadius: 12, padding: '12px 14px', marginBottom: 8, boxShadow: '0 2px 6px rgba(45,27,105,0.06)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: Colors.text }}>{cat}</span>
                  <span style={{ fontSize: 13, fontWeight: 800, color: Colors.purple }}>{learned}/{total}</span>
                </div>
                <div style={{ height: 8, background: Colors.border, borderRadius: 4, overflow: 'hidden', position: 'relative', marginBottom: 6 }}>
                  <div style={{ position: 'absolute', left: 0, top: 0, height: 8, borderRadius: 4, background: Colors.secondary, width: `${pctStarted}%` }} />
                  <div style={{ position: 'absolute', left: 0, top: 0, height: 8, borderRadius: 4, background: Colors.boxColors[5], width: `${pctLearned}%` }} />
                </div>
                <div style={{ display: 'flex', gap: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <div style={{ width: 8, height: 8, borderRadius: 4, background: Colors.secondary }} />
                    <span style={{ fontSize: 11, color: Colors.textMuted, fontWeight: 500 }}>In Bearbeitung: {started}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <div style={{ width: 8, height: 8, borderRadius: 4, background: Colors.boxColors[5] }} />
                    <span style={{ fontSize: 11, color: Colors.textMuted, fontWeight: 500 }}>Gelernt: {learned}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </section>

        {/* Reset */}
        <button
          onClick={handleReset}
          style={{ width: '100%', padding: '14px 0', background: Colors.card, border: `2px solid ${Colors.danger}`, borderRadius: 12, fontSize: 14, fontWeight: 700, color: Colors.danger, cursor: 'pointer', boxShadow: '0 2px 6px rgba(45,27,105,0.06)' }}
        >
          🔄  Fortschritt zurücksetzen
        </button>
      </div>
    </div>
  );
}

const sectionTitle: React.CSSProperties = {
  fontSize: 13, fontWeight: 700, color: Colors.textMuted,
  textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12,
};
