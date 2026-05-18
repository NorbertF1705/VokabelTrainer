import { useLearning } from '../context/LearningContext';
import { useActiveFile } from '../hooks/useActiveFile';
import { ALL_CATEGORIES } from '../data/vocabulary';
import { Colors, BOX_LABELS } from '../constants/theme';

function localDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function getLast7Days(trainingLog: string[]): { date: string; trained: boolean; label: string }[] {
  const today = new Date();
  const days = [];
  const dayNames = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = localDateStr(d);
    days.push({ date: dateStr, trained: trainingLog.includes(dateStr), label: dayNames[d.getDay()] });
  }
  return days;
}

export default function Statistics() {
  const { getTotalStats, getBoxCounts, getCardProgress, resetProgress, getTrainingConsistency } = useLearning();
  const activeFile = useActiveFile();
  const allVocabulary = activeFile?.allVocabulary ?? [];
  const trainingLog = activeFile?.state.trainingLog ?? [];

  const stats = getTotalStats();
  const boxCounts = getBoxCounts();
  const last7 = getLast7Days(trainingLog);
  const c7 = getTrainingConsistency(7);
  const c30 = getTrainingConsistency(30);
  const c90 = getTrainingConsistency(90);

  const catStats = ALL_CATEGORIES.map(cat => {
    const vocabs = allVocabulary.filter(v => v.category === cat);
    const learned = vocabs.filter(v => (getCardProgress(v.id)?.box ?? 1) >= 6).length;
    const started = vocabs.filter(v => { const b = getCardProgress(v.id)?.box ?? 1; return b > 1 && b < 6; }).length;
    return { cat, total: vocabs.length, learned, started };
  }).filter(c => c.total > 0);

  const handleReset = () => {
    if (window.confirm('Wirklich den gesamten Lernfortschritt löschen? Alle Karten werden auf Fach 1 zurückgesetzt. Eigene Vokabeln bleiben erhalten.')) {
      resetProgress();
    }
  };

  return (
    <div style={{ background: Colors.background, minHeight: '100%' }}>
      <div style={{ background: 'linear-gradient(135deg, #2D1B69, #5B2D8E)', padding: '12px 20px' }}>
        <span style={{ fontSize: 20, fontWeight: 800, color: '#fff' }}>📊 Statistik</span>
      </div>

      <div style={{ padding: '20px 20px 40px' }}>

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

        {/* Training Consistency */}
        <section style={{ marginBottom: 28 }}>
          <p style={sectionTitle}>Trainings-Regelmäßigkeit</p>

          <div style={{ background: Colors.card, borderRadius: 16, padding: '16px 18px', boxShadow: '0 2px 8px rgba(45,27,105,0.08)', marginBottom: 12 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: Colors.textMuted, marginBottom: 12 }}>Letzte 7 Tage</div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              {last7.map(({ date, trained, label }) => (
                <div key={date} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 10,
                    background: trained ? 'linear-gradient(135deg, #A78BFA, #7C3AED)' : Colors.border,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 18,
                  }}>
                    {trained ? '✓' : ''}
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 700, color: trained ? Colors.purple : Colors.textMuted }}>{label}</span>
                </div>
              ))}
            </div>
          </div>

          {[
            { label: '7 Tage', c: c7 },
            { label: '30 Tage', c: c30 },
            { label: '90 Tage', c: c90 },
          ].map(({ label, c }) => {
            const color = c.rate >= 80 ? Colors.success : c.rate >= 50 ? Colors.secondary : Colors.danger;
            return (
              <div key={label} style={{ background: Colors.card, borderRadius: 12, padding: '12px 14px', marginBottom: 8, boxShadow: '0 2px 6px rgba(45,27,105,0.06)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: Colors.text }}>{label}</span>
                  <span style={{ fontSize: 13, fontWeight: 800, color }}>{c.rate}%{' '}
                    <span style={{ fontSize: 11, color: Colors.textMuted, fontWeight: 500 }}>({c.daysActive}/{c.totalDays} Tage)</span>
                  </span>
                </div>
                <div style={{ height: 8, background: Colors.border, borderRadius: 4, overflow: 'hidden' }}>
                  <div style={{ height: 8, background: color, borderRadius: 4, width: `${c.rate}%`, transition: 'width 0.4s' }} />
                </div>
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
