import { useState, useCallback, useMemo, useEffect } from 'react';
import { useLearning } from '../context/LearningContext';
import FlashCard from '../components/FlashCard';
import { Colors } from '../constants/theme';
import { VocabularyItem } from '../data/vocabulary';

type SessionMode = 'due' | 'all' | 'quiz';

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function generateQuizOptions(correct: string, allVocab: VocabularyItem[], field: keyof VocabularyItem): string[] {
  const wrong = allVocab
    .filter(v => (v[field] as string) !== correct)
    .sort(() => Math.random() - 0.5)
    .slice(0, 3)
    .map(v => v[field] as string);
  return [...wrong, correct].sort(() => Math.random() - 0.5);
}

function speak(text: string, lang: string) {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = lang;
    u.rate = 0.85;
    window.speechSynthesis.speak(u);
  }
}

export default function Learn() {
  const { selectedLanguage, queryDirection, getDueCards, allVocabulary, getCardProgress, markCard, dailyCardLimit } = useLearning();

  const [sessionMode, setSessionMode] = useState<SessionMode>('due');
  const [sessionCards, setSessionCards] = useState<VocabularyItem[] | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [flipReset, setFlipReset] = useState(0);
  const [flipKey, setFlipKey] = useState(0);
  const [sessionDone, setSessionDone] = useState(false);
  const [sessionStats, setSessionStats] = useState({ correct: 0, incorrect: 0 });
  const [quizOptions, setQuizOptions] = useState<string[]>([]);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);

  const dueCards = useMemo(() => getDueCards(selectedLanguage), [selectedLanguage]);

  const answerField: keyof VocabularyItem = useMemo(() => {
    if (queryDirection === 'de-to-foreign') return selectedLanguage === 'english' ? 'english' : 'spanish';
    return 'german';
  }, [queryDirection, selectedLanguage]);

  const currentCard = sessionCards?.[currentIndex];

  useEffect(() => {
    if (sessionMode !== 'quiz' || !currentCard) return;
    const correct = currentCard[answerField] as string;
    setQuizOptions(generateQuizOptions(correct, allVocabulary, answerField));
    setSelectedAnswer(null);
  }, [currentIndex, sessionMode, currentCard]);

  const progress = sessionCards ? currentIndex / sessionCards.length : 0;

  const frontText = currentCard
    ? queryDirection === 'de-to-foreign'
      ? currentCard.german
      : selectedLanguage === 'english' ? currentCard.english : currentCard.spanish
    : '';

  const backText = currentCard
    ? queryDirection === 'de-to-foreign'
      ? selectedLanguage === 'english' ? currentCard.english : currentCard.spanish
      : currentCard.german
    : '';

  const startSession = useCallback((mode: SessionMode) => {
    let cards: VocabularyItem[];
    if (mode === 'due') {
      cards = getDueCards(selectedLanguage); // bereits sortiert: Phase ASC, Datum ASC
      if (cards.length === 0) return; // In Lobby bleiben – "Toll gemacht!" wird dort angezeigt
    } else if (mode === 'quiz') {
      const base = dueCards.length > 0 ? dueCards : allVocabulary;
      const shuffled = shuffle(base);
      cards = dailyCardLimit > 0 ? shuffled.slice(0, dailyCardLimit) : shuffled;
    } else {
      cards = shuffle([...allVocabulary]);
    }
    setSessionMode(mode);
    setSessionCards(cards);
    setCurrentIndex(0);
    setIsFlipped(false);
    setFlipReset(r => r + 1);
    setSessionDone(false);
    setSessionStats({ correct: 0, incorrect: 0 });
    setSelectedAnswer(null);
  }, [selectedLanguage, allVocabulary, getDueCards, dueCards, dailyCardLimit]);

  const speakWord = () => {
    if (!currentCard) return;
    const text = isFlipped ? backText : frontText;
    const lang = isFlipped
      ? (queryDirection === 'de-to-foreign' ? (selectedLanguage === 'english' ? 'en-US' : 'es-ES') : 'de-DE')
      : (queryDirection === 'de-to-foreign' ? 'de-DE' : (selectedLanguage === 'english' ? 'en-US' : 'es-ES'));
    speak(text, lang);
  };

  useEffect(() => {
    if (!sessionCards || sessionDone) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (sessionMode === 'quiz') {
        const num = parseInt(e.key);
        if (num >= 1 && num <= 4 && quizOptions[num - 1] !== undefined) {
          e.preventDefault();
          handleQuizAnswer(quizOptions[num - 1]);
        }
      } else {
        if (e.code === 'Enter') {
          e.preventDefault();
          setFlipKey(k => k + 1);
        } else if (e.code === 'ShiftLeft') {
          e.preventDefault();
          if (isFlipped) advanceCard(false);
        } else if (e.code === 'ShiftRight') {
          e.preventDefault();
          if (isFlipped) advanceCard(true);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [sessionMode, sessionCards, sessionDone, isFlipped, quizOptions]);

  const advanceCard = (correct: boolean) => {
    if (!currentCard || !sessionCards) return;
    markCard(currentCard.id, selectedLanguage, correct);
    const newStats = { correct: sessionStats.correct + (correct ? 1 : 0), incorrect: sessionStats.incorrect + (correct ? 0 : 1) };
    setSessionStats(newStats);
    const nextIndex = currentIndex + 1;
    if (nextIndex >= sessionCards.length) {
      setSessionDone(true);
    } else {
      setCurrentIndex(nextIndex);
      setIsFlipped(false);
      setFlipReset(r => r + 1);
    }
  };

  const handleQuizAnswer = (answer: string) => {
    if (selectedAnswer !== null || !currentCard) return;
    setSelectedAnswer(answer);
    const correct = answer === (currentCard[answerField] as string);
    setTimeout(() => advanceCard(correct), 1900);
  };

  const boxNumber = currentCard ? getCardProgress(currentCard.id, selectedLanguage).box : 1;
  const correctAnswer = currentCard ? (currentCard[answerField] as string) : '';

  // ── Lobby ──────────────────────────────────────────────────
  if (!sessionCards) {
    return (
      <div style={{ background: Colors.background, flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={topBar}>
          <span style={screenTitle}>🧠 Lernen</span>
        </div>
        <div style={{ padding: 20, paddingTop: 28, flex: 1 }}>
          <h2 style={{ fontSize: 26, fontWeight: 900, color: Colors.text, marginBottom: 24 }}>Sitzung starten</h2>

          {([
            { mode: 'due' as SessionMode, colors: ['#FF6B6B', '#FF8E53'], emoji: '🎯', title: 'Fällige Karten', sub: `${dueCards.length} Karten heute fällig` },
            { mode: 'all' as SessionMode, colors: ['#A78BFA', '#7C3AED'], emoji: '🔁', title: 'Alle Vokabeln', sub: `Alle ${allVocabulary.length} Karten üben` },
            { mode: 'quiz' as SessionMode, colors: ['#4ECDC4', '#2ECC71'], emoji: '🧩', title: 'Quiz', sub: `Multiple Choice mit ${dailyCardLimit > 0 ? Math.min(dailyCardLimit, (dueCards.length || allVocabulary.length)) : (dueCards.length || allVocabulary.length)} Karten` },
          ] as const).map(({ mode, colors, emoji, title, sub }) => (
            <button
              key={mode}
              onClick={() => startSession(mode)}
              style={{
                width: '100%', border: 'none', cursor: 'pointer', padding: 0,
                borderRadius: 16, overflow: 'hidden', marginBottom: 14,
                boxShadow: '0 4px 16px rgba(45,27,105,0.18)',
              }}
            >
              <div style={{
                background: `linear-gradient(135deg, ${colors[0]}, ${colors[1]})`,
                padding: '20px 24px', display: 'flex', alignItems: 'center', gap: 16,
              }}>
                <span style={{ fontSize: 40 }}>{emoji}</span>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontSize: 18, fontWeight: 800, color: '#fff' }}>{title}</div>
                  <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', fontWeight: 500, marginTop: 2 }}>{sub}</div>
                </div>
              </div>
            </button>
          ))}

          {dueCards.length === 0 && (
            <div style={{ background: Colors.card, borderRadius: 16, padding: 28, textAlign: 'center', marginTop: 16, boxShadow: '0 2px 8px rgba(45,27,105,0.08)' }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>🎉</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: Colors.text, marginBottom: 8 }}>Toll gemacht!</div>
              <div style={{ fontSize: 14, color: Colors.textMuted, lineHeight: 1.5 }}>Alle fälligen Karten sind erledigt. Morgen gibt es wieder neue!</div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── Session Done ─────────────────────────────────────────
  if (sessionDone) {
    const total = sessionStats.correct + sessionStats.incorrect;
    const rate = total > 0 ? Math.round((sessionStats.correct / total) * 100) : 0;
    return (
      <div style={{ background: Colors.background, flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={topBar}><span style={screenTitle}>🧠 Lernen</span></div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 32 }}>
          <div style={{ fontSize: 72, marginBottom: 16 }}>{rate >= 80 ? '🏆' : rate >= 50 ? '👍' : '💪'}</div>
          <h2 style={{ fontSize: 28, fontWeight: 900, color: Colors.text, marginBottom: 28 }}>Sitzung beendet!</h2>
          <div style={{ display: 'flex', gap: 12, marginBottom: 32, width: '100%' }}>
            {[
              { label: 'Richtig', val: sessionStats.correct, color: Colors.success },
              { label: 'Falsch', val: sessionStats.incorrect, color: Colors.danger },
              { label: 'Erfolg', val: `${rate}%`, color: Colors.purple },
            ].map(({ label, val, color }) => (
              <div key={label} style={{ flex: 1, background: Colors.card, borderRadius: 12, padding: 16, textAlign: 'center', borderTop: `4px solid ${color}`, boxShadow: '0 2px 8px rgba(45,27,105,0.08)' }}>
                <div style={{ fontSize: 30, fontWeight: 900, color }}>{val}</div>
                <div style={{ fontSize: 12, color: Colors.textMuted, fontWeight: 600, marginTop: 2 }}>{label}</div>
              </div>
            ))}
          </div>
          <button onClick={() => setSessionCards(null)} style={{ width: '100%', border: 'none', cursor: 'pointer', padding: 0, borderRadius: 16, overflow: 'hidden', boxShadow: '0 4px 16px rgba(45,27,105,0.18)' }}>
            <div style={{ background: 'linear-gradient(90deg, #A78BFA, #7C3AED)', padding: 18, textAlign: 'center', fontSize: 18, fontWeight: 800, color: '#fff' }}>
              Neue Sitzung
            </div>
          </button>
        </div>
      </div>
    );
  }

  // ── Quiz-Modus ───────────────────────────────────────────
  if (sessionMode === 'quiz') {
    return (
      <div style={{ background: Colors.background, flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={topBar}>
          <button onClick={() => setSessionCards(null)} style={{ color: 'rgba(255,255,255,0.8)', fontSize: 18, fontWeight: 700, cursor: 'pointer', border: 'none', background: 'none', width: 36, height: 36 }}>✕</button>
          <span style={{ color: '#fff', fontSize: 15, fontWeight: 700 }}>{currentIndex + 1} / {sessionCards.length}</span>
          <button onClick={speakWord} style={{ width: 36, height: 36, borderRadius: 18, background: 'rgba(255,255,255,0.15)', border: 'none', cursor: 'pointer', fontSize: 18 }}>🔈</button>
        </div>
        <div style={{ height: 4, background: 'rgba(45,27,105,0.15)' }}>
          <div style={{ height: 4, background: Colors.accent, width: `${progress * 100}%`, transition: 'width 0.3s' }} />
        </div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: 20, gap: 16, overflow: 'hidden' }}>
          <div style={{ flex: 1, background: Colors.card, borderRadius: 24, padding: 28, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 32px rgba(45,27,105,0.18)' }}>
            <span style={{ fontSize: 72, marginBottom: 16 }}>{currentCard!.emoji}</span>
            <span style={{ fontSize: 34, fontWeight: 900, color: Colors.text, textAlign: 'center', letterSpacing: -0.5, marginBottom: 8 }}>{frontText}</span>
            <span style={{ fontSize: 13, color: Colors.textMuted, fontWeight: 600 }}>
              {queryDirection === 'de-to-foreign' ? (selectedLanguage === 'english' ? '→ Englisch' : '→ Spanisch') : '→ Deutsch'}
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {quizOptions.map((option, idx) => {
              let bg = Colors.card, border = Colors.border, textColor = Colors.text;
              if (selectedAnswer !== null) {
                if (option === correctAnswer) { bg = '#E0F9EC'; border = Colors.success; textColor = Colors.success; }
                else if (option === selectedAnswer) { bg = '#FFE5E5'; border = Colors.danger; textColor = Colors.danger; }
              }
              return (
                <button
                  key={idx}
                  onClick={() => handleQuizAnswer(option)}
                  disabled={selectedAnswer !== null}
                  style={{ background: bg, border: `2px solid ${border}`, borderRadius: 12, padding: '15px 20px', fontSize: 17, fontWeight: 700, color: textColor, cursor: selectedAnswer !== null ? 'default' : 'pointer', boxShadow: '0 2px 8px rgba(45,27,105,0.08)', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: 12, textAlign: 'left' }}
                >
                  <span style={{ minWidth: 24, height: 24, borderRadius: 6, background: selectedAnswer !== null ? 'rgba(0,0,0,0.08)' : 'rgba(45,27,105,0.1)', color: selectedAnswer !== null ? textColor : Colors.textMuted, fontSize: 13, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{idx + 1}</span>
                  {option}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // ── Karteikarten-Modus ───────────────────────────────────
  return (
    <div style={{ background: Colors.background, flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      <div style={topBar}>
        <button onClick={() => setSessionCards(null)} style={{ color: 'rgba(255,255,255,0.8)', fontSize: 18, fontWeight: 700, cursor: 'pointer', border: 'none', background: 'none', width: 36, height: 36 }}>✕</button>
        <span style={{ color: '#fff', fontSize: 15, fontWeight: 700 }}>{currentIndex + 1} / {sessionCards.length}</span>
        <button onClick={speakWord} style={{ width: 36, height: 36, borderRadius: 18, background: 'rgba(255,255,255,0.15)', border: 'none', cursor: 'pointer', fontSize: 18 }}>🔈</button>
      </div>
      <div style={{ height: 4, background: 'rgba(45,27,105,0.15)', flexShrink: 0 }}>
        <div style={{ height: 4, background: Colors.accent, width: `${progress * 100}%`, transition: 'width 0.3s' }} />
      </div>
      <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', padding: 20, justifyContent: 'space-between' }}>
        <div style={{ flex: 1, minHeight: 0, display: 'flex', alignItems: 'center' }}>
          <FlashCard
            frontText={frontText}
            backText={backText}
            emoji={currentCard!.emoji}
            category={currentCard!.category}
            boxNumber={boxNumber}
            inflections={currentCard!.inflections}
            onFlip={setIsFlipped}
            forceReset={flipReset}
            flipKey={flipKey}
          />
        </div>

        {isFlipped ? (
          <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
            <button
              onClick={() => advanceCard(false)}
              style={{ flex: 1, padding: '17px 0', background: '#FFE5E5', borderRadius: 16, border: `2px solid ${Colors.danger}`, fontSize: 16, fontWeight: 800, color: Colors.danger, cursor: 'pointer' }}
            >
              ✗  Falsch
              <span style={{ display: 'block', fontSize: 11, fontWeight: 500, opacity: 0.7, marginTop: 2 }}>⇧ Links</span>
            </button>
            <button
              onClick={() => advanceCard(true)}
              style={{ flex: 1, padding: '17px 0', background: '#E0F9EC', borderRadius: 16, border: `2px solid ${Colors.success}`, fontSize: 16, fontWeight: 800, color: Colors.success, cursor: 'pointer' }}
            >
              ✓  Richtig
              <span style={{ display: 'block', fontSize: 11, fontWeight: 500, opacity: 0.7, marginTop: 2 }}>⇧ Rechts</span>
            </button>
          </div>
        ) : (
          <p style={{ textAlign: 'center', color: Colors.textMuted, fontSize: 14, marginTop: 20, fontWeight: 500 }}>
            Klicken oder <kbd style={{ background: Colors.card, border: `1px solid ${Colors.border}`, borderRadius: 4, padding: '1px 6px', fontFamily: 'inherit', fontSize: 13 }}>Enter</kbd> zum Umdrehen
          </p>
        )}
      </div>
    </div>
  );
}

const topBar: React.CSSProperties = {
  background: 'linear-gradient(135deg, #2D1B69, #5B2D8E)',
  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  padding: '12px 20px', flexShrink: 0,
};

const screenTitle: React.CSSProperties = {
  fontSize: 20, fontWeight: 800, color: '#fff',
};
