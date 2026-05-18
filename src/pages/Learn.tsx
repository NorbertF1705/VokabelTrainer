import { useState, useCallback, useMemo, useEffect } from 'react';
import { useLearning } from '../context/LearningContext';
import { useActiveFile } from '../hooks/useActiveFile';
import FlashCard from '../components/FlashCard';
import { Colors } from '../constants/theme';
import { LANGUAGE_LABELS } from '../config/file_config';
import { VocabularyItem } from '../data/vocabulary';

type SessionMode = 'due' | 'all' | 'quiz' | 'type';

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function levenshtein(a: string, b: string): number {
  const m = a.length, n = b.length;
  const dp: number[] = Array.from({ length: n + 1 }, (_, i) => i);
  for (let i = 1; i <= m; i++) {
    let prev = dp[0];
    dp[0] = i;
    for (let j = 1; j <= n; j++) {
      const temp = dp[j];
      dp[j] = a[i - 1] === b[j - 1] ? prev : 1 + Math.min(prev, dp[j], dp[j - 1]);
      prev = temp;
    }
  }
  return dp[n];
}

function evaluateTypedAnswer(input: string, correct: string, tolerant: boolean): 'correct' | 'almost' | 'wrong' {
  const a = input.trim().toLowerCase();
  const b = correct.trim().toLowerCase();
  if (a === b) return 'correct';
  if (tolerant) {
    const maxDist = b.length <= 5 ? 1 : 2;
    if (levenshtein(a, b) <= maxDist) return 'almost';
  }
  return 'wrong';
}

function generateQuizOptions(correct: string, allVocab: VocabularyItem[], field: keyof VocabularyItem): string[] {
  const wrong = allVocab
    .filter(v => (v[field] as string) !== correct)
    .sort(() => Math.random() - 0.5)
    .slice(0, 3)
    .map(v => v[field] as string);
  return [...wrong, correct].sort(() => Math.random() - 0.5);
}

let _voices: SpeechSynthesisVoice[] = [];
if ('speechSynthesis' in window) {
  const loadVoices = () => { _voices = window.speechSynthesis.getVoices(); };
  loadVoices();
  window.speechSynthesis.addEventListener('voiceschanged', loadVoices);
}

function pickVoice(lang: string): SpeechSynthesisVoice | null {
  const voices = _voices.length ? _voices : window.speechSynthesis.getVoices();
  return (
    voices.find(v => v.lang === lang) ??
    voices.find(v => v.lang.startsWith(lang.split('-')[0])) ??
    null
  );
}

function speak(text: string, lang: string) {
  if (!('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = lang;
  u.rate = 0.85;
  const voice = pickVoice(lang);
  if (voice) u.voice = voice;
  window.speechSynthesis.speak(u);
}

export default function Learn() {
  const { settings, getDueCards, getNewCards, getCardProgress, markCard, recordTrainingDay, setSessionActive } = useLearning();
  const activeFile = useActiveFile();
  const allVocabulary = activeFile?.allVocabulary ?? [];
  const voiceCode = activeFile?.manifest.voice ?? 'en-US';
  const langLabel = activeFile ? LANGUAGE_LABELS[activeFile.manifest.language] : '';
  const { queryDirection, dailyCardLimit, quizAutoSpeak, flashcardAutoSpeak, typingTolerant } = settings;

  const [sessionMode, setSessionMode] = useState<SessionMode>('due');
  const [sessionCards, setSessionCards] = useState<VocabularyItem[] | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [effectiveDirection, setEffectiveDirection] = useState<'de-to-foreign' | 'foreign-to-de'>('de-to-foreign');
  const [isFlipped, setIsFlipped] = useState(false);
  const [flipReset, setFlipReset] = useState(0);
  const [flipKey, setFlipKey] = useState(0);
  const [sessionDone, setSessionDone] = useState(false);
  const [sessionStats, setSessionStats] = useState({ correct: 0, incorrect: 0 });
  const [quizOptions, setQuizOptions] = useState<string[]>([]);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [quizAnswerCorrect, setQuizAnswerCorrect] = useState<boolean | null>(null);
  const [quizFlipKey, setQuizFlipKey] = useState(0);
  const [typedAnswer, setTypedAnswer] = useState('');
  const [typeResult, setTypeResult] = useState<'correct' | 'almost' | 'wrong' | null>(null);
  const [sessionNewCards, setSessionNewCards] = useState(0);

  const dueCards = getDueCards();

  useEffect(() => {
    if (queryDirection === 'random') {
      setEffectiveDirection(Math.random() < 0.5 ? 'de-to-foreign' : 'foreign-to-de');
    } else {
      setEffectiveDirection(queryDirection);
    }
  }, [queryDirection, currentIndex, sessionCards]);

  const answerField: keyof VocabularyItem = useMemo(() => {
    return effectiveDirection === 'de-to-foreign' ? 'translation' : 'german';
  }, [effectiveDirection]);

  const currentCard = sessionCards?.[currentIndex];

  useEffect(() => {
    if (sessionMode !== 'quiz' || !currentCard) return;
    const correct = currentCard[answerField] as string;
    setQuizOptions(generateQuizOptions(correct, allVocabulary, answerField));
    setSelectedAnswer(null);
    setQuizAnswerCorrect(null);
  }, [currentIndex, sessionMode, currentCard]);

  const progress = sessionCards ? currentIndex / sessionCards.length : 0;

  const frontText = currentCard
    ? effectiveDirection === 'de-to-foreign' ? currentCard.german : currentCard.translation
    : '';

  const backText = currentCard
    ? effectiveDirection === 'de-to-foreign' ? currentCard.translation : currentCard.german
    : '';

  const exitSession = useCallback(() => {
    setSessionCards(null);
    setSessionActive(false);
  }, [setSessionActive]);

  const startSession = useCallback((mode: SessionMode) => {
    const allVocab = activeFile?.allVocabulary ?? [];
    let cards: VocabularyItem[];
    let newCount = 0;
    if (mode === 'due' || mode === 'type') {
      const revCards = getDueCards();
      const newC = getNewCards();
      newCount = newC.length;
      cards = [...revCards, ...newC];
      if (cards.length === 0) return;
    } else if (mode === 'quiz') {
      const due = getDueCards();
      const base = due.length > 0 ? due : allVocab;
      const shuffled = shuffle(base);
      cards = dailyCardLimit > 0 ? shuffled.slice(0, dailyCardLimit) : shuffled;
    } else {
      cards = shuffle([...allVocab]);
    }
    setSessionMode(mode);
    setSessionCards(cards);
    setSessionNewCards(newCount);
    setCurrentIndex(0);
    setIsFlipped(false);
    setFlipReset(r => r + 1);
    setSessionDone(false);
    setSessionStats({ correct: 0, incorrect: 0 });
    setSelectedAnswer(null);
    setQuizAnswerCorrect(null);
    setQuizFlipKey(0);
    setTypedAnswer('');
    setTypeResult(null);
    setSessionActive(true);
  }, [activeFile, getDueCards, getNewCards, dailyCardLimit, setSessionActive]);

  const speakWord = () => {
    if (!currentCard) return;
    const text = isFlipped ? backText : frontText;
    const lang = isFlipped
      ? (effectiveDirection === 'de-to-foreign' ? voiceCode : 'de-DE')
      : (effectiveDirection === 'de-to-foreign' ? 'de-DE' : voiceCode);
    speak(text, lang);
  };

  useEffect(() => {
    if (!sessionCards || sessionDone) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (sessionMode === 'type') {
        if (e.code === 'Enter') {
          e.preventDefault();
          if (typeResult !== null) {
            advanceCard(typeResult !== 'wrong');
          }
        }
        return;
      }
      if (sessionMode === 'quiz') {
        if (selectedAnswer !== null && (e.code === 'Enter' || e.code === 'Space')) {
          e.preventDefault();
          advanceCard(quizAnswerCorrect!);
          return;
        }
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
  }, [sessionMode, sessionCards, sessionDone, isFlipped, quizOptions, selectedAnswer, quizAnswerCorrect, typeResult]);

  const advanceCard = (correct: boolean) => {
    if (!currentCard || !sessionCards) return;
    markCard(currentCard.id, correct);
    const newStats = { correct: sessionStats.correct + (correct ? 1 : 0), incorrect: sessionStats.incorrect + (correct ? 0 : 1) };
    setSessionStats(newStats);
    const nextIndex = currentIndex + 1;
    if (nextIndex >= sessionCards.length) {
      recordTrainingDay();
      setSessionDone(true);
      setSessionActive(false);
    } else {
      setCurrentIndex(nextIndex);
      setIsFlipped(false);
      setFlipReset(r => r + 1);
      setTypedAnswer('');
      setTypeResult(null);
    }
  };

  const handleQuizAnswer = (answer: string) => {
    if (selectedAnswer !== null || !currentCard) return;
    const correct = answer === (currentCard[answerField] as string);
    setSelectedAnswer(answer);
    setQuizAnswerCorrect(correct);
    setQuizFlipKey(k => k + 1);
    if (quizAutoSpeak) {
      const textToSpeak = currentCard[answerField] as string;
      const lang = answerField === 'translation' ? voiceCode : 'de-DE';
      speak(textToSpeak, lang);
    }
  };

  const handleTypeSubmit = () => {
    if (!currentCard || typeResult !== null || typedAnswer.trim() === '') return;
    const correct = currentCard[answerField] as string;
    setTypeResult(evaluateTypedAnswer(typedAnswer, correct, typingTolerant));
  };

  const boxNumber = currentCard ? (getCardProgress(currentCard.id)?.box ?? 1) : 1;
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
            { mode: 'type' as SessionMode, colors: ['#F59E0B', '#D97706'], emoji: '✍️', title: 'Eingabe-Modus', sub: 'Antworte durch Tippen' },
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
          <div style={{ display: 'flex', gap: 12, marginBottom: sessionNewCards > 0 ? 16 : 32, width: '100%' }}>
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
          {sessionNewCards > 0 && (
            <div style={{ background: '#FFF8E1', border: '2px solid #F59E0B', borderRadius: 12, padding: '10px 16px', marginBottom: 32, width: '100%', textAlign: 'center' }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: '#B45309' }}>
                ✨ {sessionNewCards} neue {sessionNewCards === 1 ? 'Karte' : 'Karten'} eingeführt
              </span>
            </div>
          )}
          <button onClick={exitSession} style={{ width: '100%', border: 'none', cursor: 'pointer', padding: 0, borderRadius: 16, overflow: 'hidden', boxShadow: '0 4px 16px rgba(45,27,105,0.18)' }}>
            <div style={{ background: 'linear-gradient(90deg, #A78BFA, #7C3AED)', padding: 18, textAlign: 'center', fontSize: 18, fontWeight: 800, color: '#fff' }}>
              Neue Sitzung
            </div>
          </button>
        </div>
      </div>
    );
  }

  // ── Eingabe-Modus ────────────────────────────────────────
  if (sessionMode === 'type') {
    const correctAnswer2 = currentCard ? (currentCard[answerField] as string) : '';
    const resultColors = {
      correct: { bg: '#E0F9EC', border: Colors.success, text: Colors.success, label: '✓ Richtig!' },
      almost:  { bg: '#FFF8E1', border: '#F59E0B',      text: '#B45309',      label: '~ Fast richtig' },
      wrong:   { bg: '#FFE5E5', border: Colors.danger,   text: Colors.danger,  label: '✗ Falsch' },
    };
    const rc = typeResult ? resultColors[typeResult] : null;

    return (
      <div style={{ background: Colors.background, flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
        <div style={topBar}>
          <button onClick={exitSession} style={{ color: 'rgba(255,255,255,0.8)', fontSize: 18, fontWeight: 700, cursor: 'pointer', border: 'none', background: 'none', width: 36, height: 36 }}>✕</button>
          <span style={{ color: '#fff', fontSize: 15, fontWeight: 700 }}>{currentIndex + 1} / {sessionCards.length}</span>
          <button onClick={speakWord} style={{ width: 36, height: 36, borderRadius: 18, background: 'rgba(255,255,255,0.15)', border: 'none', cursor: 'pointer', fontSize: 18 }}>🔈</button>
        </div>
        <div style={{ height: 4, background: 'rgba(45,27,105,0.15)' }}>
          <div style={{ height: 4, background: Colors.accent, width: `${progress * 100}%`, transition: 'width 0.3s' }} />
        </div>
        <div style={{ flex: 1, padding: '24px 20px 20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Frage */}
          <div style={{ background: Colors.card, borderRadius: 16, padding: '24px 20px', textAlign: 'center', boxShadow: '0 2px 8px rgba(45,27,105,0.08)' }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
              {effectiveDirection === 'de-to-foreign' ? 'Deutsch' : langLabel}
            </div>
            <div style={{ fontSize: 26, fontWeight: 900, color: Colors.text }}>{frontText}</div>
            {currentCard?.emoji && <div style={{ fontSize: 32, marginTop: 8 }}>{currentCard.emoji}</div>}
          </div>

          {/* Eingabefeld */}
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
              {effectiveDirection === 'de-to-foreign' ? langLabel : 'Deutsch'}
            </div>
            <input
              autoFocus
              value={typedAnswer}
              onChange={e => { if (typeResult === null) setTypedAnswer(e.target.value); }}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); typeResult === null ? handleTypeSubmit() : advanceCard(typeResult !== 'wrong'); } }}
              placeholder="Antwort eingeben…"
              style={{
                width: '100%', boxSizing: 'border-box',
                padding: '14px 16px', fontSize: 18, fontWeight: 700,
                border: `2px solid ${rc ? rc.border : Colors.border}`,
                borderRadius: 12, outline: 'none',
                background: rc ? rc.bg : Colors.card,
                color: rc ? rc.text : Colors.text,
                transition: 'border-color 0.2s, background 0.2s',
              }}
            />
          </div>

          {/* Ergebnis */}
          {rc && (
            <div style={{ background: rc.bg, border: `2px solid ${rc.border}`, borderRadius: 12, padding: '12px 16px' }}>
              <div style={{ fontSize: 16, fontWeight: 800, color: rc.text }}>{rc.label}</div>
              {typeResult !== 'correct' && (
                <div style={{ fontSize: 14, color: Colors.text, marginTop: 4 }}>
                  Richtig: <strong>{correctAnswer2}</strong>
                </div>
              )}
              {typeResult === 'almost' && (
                <div style={{ fontSize: 12, color: Colors.textMuted, marginTop: 2 }}>Tipptolerant aktiv – wird als richtig gewertet</div>
              )}
            </div>
          )}

          {/* Buttons */}
          {typeResult === null ? (
            <button
              onClick={handleTypeSubmit}
              disabled={typedAnswer.trim() === ''}
              style={{
                padding: '15px 0', border: 'none', borderRadius: 12, fontSize: 16, fontWeight: 800,
                background: typedAnswer.trim() !== '' ? 'linear-gradient(90deg, #A78BFA, #7C3AED)' : Colors.border,
                color: typedAnswer.trim() !== '' ? '#fff' : Colors.textMuted,
                cursor: typedAnswer.trim() !== '' ? 'pointer' : 'default',
                boxShadow: typedAnswer.trim() !== '' ? '0 4px 16px rgba(45,27,105,0.25)' : 'none',
                transition: 'all 0.2s',
              }}
            >
              Prüfen
            </button>
          ) : (
            <button
              onClick={() => advanceCard(typeResult !== 'wrong')}
              style={{
                padding: '15px 0', border: 'none', borderRadius: 12, fontSize: 16, fontWeight: 800,
                background: 'linear-gradient(90deg, #A78BFA, #7C3AED)', color: '#fff',
                cursor: 'pointer', boxShadow: '0 4px 16px rgba(45,27,105,0.25)',
              }}
            >
              Weiter <span style={{ fontSize: 12, fontWeight: 500, opacity: 0.85 }}>Enter</span>
            </button>
          )}
        </div>
      </div>
    );
  }

  // ── Quiz-Modus ───────────────────────────────────────────
  if (sessionMode === 'quiz') {
    return (
      <div style={{ background: Colors.background, flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={topBar}>
          <button onClick={exitSession} style={{ color: 'rgba(255,255,255,0.8)', fontSize: 18, fontWeight: 700, cursor: 'pointer', border: 'none', background: 'none', width: 36, height: 36 }}>✕</button>
          <span style={{ color: '#fff', fontSize: 15, fontWeight: 700 }}>{currentIndex + 1} / {sessionCards.length}</span>
          <button onClick={speakWord} style={{ width: 36, height: 36, borderRadius: 18, background: 'rgba(255,255,255,0.15)', border: 'none', cursor: 'pointer', fontSize: 18 }}>🔈</button>
        </div>
        <div style={{ height: 4, background: 'rgba(45,27,105,0.15)', flexShrink: 0 }}>
          <div style={{ height: 4, background: Colors.accent, width: `${progress * 100}%`, transition: 'width 0.3s' }} />
        </div>
        <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', padding: '16px 20px 20px', gap: 12 }}>
          <div style={{ flex: 1, minHeight: 0, display: 'flex', alignItems: 'center', overflow: 'hidden' }}>
            <FlashCard
              frontText={frontText}
              backText={backText}
              frontLang={effectiveDirection === 'de-to-foreign' ? 'Deutsch' : langLabel}
              backLang={effectiveDirection === 'de-to-foreign' ? langLabel : 'Deutsch'}
              emoji={currentCard!.emoji}
              category={currentCard!.category}
              boxNumber={boxNumber}
              inflections={currentCard!.inflections}
              onFlip={(flipped) => setIsFlipped(flipped)}
              forceReset={flipReset}
              flipKey={quizFlipKey}
            />
          </div>
          <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
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
                  style={{ background: bg, border: `2px solid ${border}`, borderRadius: 12, padding: '12px 16px', fontSize: 16, fontWeight: 700, color: textColor, cursor: selectedAnswer !== null ? 'default' : 'pointer', boxShadow: '0 2px 8px rgba(45,27,105,0.08)', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: 12, textAlign: 'left' }}
                >
                  <span style={{ minWidth: 24, height: 24, borderRadius: 6, background: selectedAnswer !== null ? 'rgba(0,0,0,0.08)' : 'rgba(45,27,105,0.1)', color: selectedAnswer !== null ? textColor : Colors.textMuted, fontSize: 13, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{idx + 1}</span>
                  {option}
                </button>
              );
            })}
            <button
              onClick={() => selectedAnswer !== null && advanceCard(quizAnswerCorrect!)}
              style={{
                marginTop: 4, padding: '14px 0',
                background: selectedAnswer !== null ? 'linear-gradient(90deg, #A78BFA, #7C3AED)' : Colors.border,
                border: 'none', borderRadius: 12, fontSize: 16, fontWeight: 800,
                color: selectedAnswer !== null ? '#fff' : Colors.textMuted,
                cursor: selectedAnswer !== null ? 'pointer' : 'default',
                boxShadow: selectedAnswer !== null ? '0 4px 16px rgba(45,27,105,0.25)' : 'none',
                transition: 'all 0.2s',
              }}
            >
              Weiter
              {selectedAnswer !== null && (
                <span style={{ display: 'inline-block', fontSize: 12, fontWeight: 500, opacity: 0.85, marginLeft: 8 }}>Enter / Leertaste</span>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Karteikarten-Modus ───────────────────────────────────
  return (
    <div style={{ background: Colors.background, flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      <div style={topBar}>
        <button onClick={exitSession} style={{ color: 'rgba(255,255,255,0.8)', fontSize: 18, fontWeight: 700, cursor: 'pointer', border: 'none', background: 'none', width: 36, height: 36 }}>✕</button>
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
            frontLang={effectiveDirection === 'de-to-foreign' ? 'Deutsch' : langLabel}
            backLang={effectiveDirection === 'de-to-foreign' ? langLabel : 'Deutsch'}
            emoji={currentCard!.emoji}
            category={currentCard!.category}
            boxNumber={boxNumber}
            inflections={currentCard!.inflections}
            onFlip={(flipped) => {
              setIsFlipped(flipped);
              if (flipped && flashcardAutoSpeak && currentCard) {
                const lang = effectiveDirection === 'de-to-foreign' ? voiceCode : 'de-DE';
                speak(backText, lang);
              }
            }}
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
