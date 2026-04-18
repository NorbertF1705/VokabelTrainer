import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { VOCABULARY_EN, VOCABULARY_ES, VocabularyItem } from '../data/vocabulary';
import { BOX_INTERVALS } from '../constants/theme';
import { storageGet, storageSet, migrateFromLocalStorage } from '../utils/storage';

export type Language = 'english' | 'spanish';
export type QueryDirection = 'de-to-foreign' | 'foreign-to-de' | 'random';

export interface CardProgress {
  box: number;
  lastReviewed: string | null;
  nextDate: string | null;
  correctCount: number;
  incorrectCount: number;
}

type ProgressMap = Record<string, CardProgress>;

interface LearningState {
  selectedLanguage: Language;
  queryDirection: QueryDirection;
  progress: ProgressMap;
  customVocabularyEN: VocabularyItem[];
  customVocabularyES: VocabularyItem[];
  dailyCardLimit: number;
  dailyStats: Record<Language, { date: string; count: number }>;
  quizAutoSpeak: boolean;
  flashcardAutoSpeak: boolean;
  trainingLog: Record<Language, string[]>; // per-language YYYY-MM-DD dates of completed due-card sessions
}

interface LearningContextType extends LearningState {
  allVocabulary: VocabularyItem[];
  setLanguage: (lang: Language) => void;
  setQueryDirection: (dir: QueryDirection) => void;
  setDailyCardLimit: (limit: number) => void;
  setQuizAutoSpeak: (enabled: boolean) => void;
  setFlashcardAutoSpeak: (enabled: boolean) => void;
  getCardProgress: (vocabId: string, lang: Language) => CardProgress;
  markCard: (vocabId: string, lang: Language, correct: boolean) => void;
  addCustomVocabulary: (item: Omit<VocabularyItem, 'id' | 'isCustom'>, lang: Language) => void;
  deleteCustomVocabulary: (id: string) => void;
  getDueCards: (lang: Language) => VocabularyItem[];
  getBoxCounts: (lang: Language) => number[];
  resetProgress: () => void;
  getTotalStats: (lang: Language) => { total: number; learned: number; dueToday: number; successRate: number };
  recordTrainingDay: (lang: Language) => void;
  getTrainingConsistency: (lang: Language, days: number) => { rate: number; daysActive: number; totalDays: number };
}

// Hilfsfunktion: migriert altes Format (customVocabulary mit english+spanish) ins neue Format
function migrateOldCustomVocab(raw: Record<string, unknown>): { en: VocabularyItem[]; es: VocabularyItem[] } {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const old: any[] = (raw as any).customVocabulary ?? [];
  const en: VocabularyItem[] = old.map((v: any) => ({
    id: v.id, german: v.german, translation: v.english ?? v.translation ?? '',
    emoji: v.emoji, category: v.category, inflections: v.inflections, isCustom: true,
  }));
  const es: VocabularyItem[] = old.map((v: any) => ({
    id: v.id + '_es', german: v.german, translation: v.spanish ?? v.translation ?? '',
    emoji: v.emoji, category: v.category, inflections: v.inflections, isCustom: true,
  }));
  return { en, es };
}

const STORAGE_KEY = 'vokabeltrainer_state';

const defaultProgress = (): CardProgress => ({
  box: 1,
  lastReviewed: null,
  nextDate: null,
  correctCount: 0,
  incorrectCount: 0,
});

const LearningContext = createContext<LearningContextType | null>(null);

function localDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function todayDate(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function isCardDue(progress: CardProgress): boolean {
  if (progress.box >= 6) return false;
  if (progress.nextDate != null) {
    return localDateStr(new Date()) >= progress.nextDate;
  }
  // Rückwärtskompatibilität für Karten ohne nextDate
  if (!progress.lastReviewed) return true;
  const interval = BOX_INTERVALS[progress.box - 1];
  if (interval === 0) return true;
  const last = new Date(progress.lastReviewed);
  const diffDays = (Date.now() - last.getTime()) / (1000 * 60 * 60 * 24);
  return diffDays >= interval;
}

export function LearningProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<LearningState>({
    selectedLanguage: 'english',
    queryDirection: 'de-to-foreign',
    progress: {},
    customVocabularyEN: [],
    customVocabularyES: [],
    dailyCardLimit: 20,
    dailyStats: { english: { date: '', count: 0 }, spanish: { date: '', count: 0 } },
    quizAutoSpeak: false,
    flashcardAutoSpeak: false,
    trainingLog: { english: [], spanish: [] },
  });
  const [loaded, setLoaded] = useState(false);
  // Track pending saves to avoid write-after-unmount issues
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    (async () => {
      // Migrate any existing localStorage data to IndexedDB on first run
      await migrateFromLocalStorage(STORAGE_KEY);

      const raw = await storageGet(STORAGE_KEY);
      if (raw) {
        try {
          const parsed = JSON.parse(raw);
          // Migrate old flat dailyStats format to per-language
          if (!parsed.dailyStats || !parsed.dailyStats.english) {
            const old = parsed.dailyStats ?? { date: '', count: 0 };
            parsed.dailyStats = {
              english: { date: old.date ?? '', count: old.count ?? 0 },
              spanish: { date: '', count: 0 },
            };
          }
          // Migrate old flat array format to per-language record
          if (!parsed.trainingLog || Array.isArray(parsed.trainingLog)) {
            const old: string[] = Array.isArray(parsed.trainingLog) ? parsed.trainingLog : [];
            parsed.trainingLog = { english: old, spanish: [] };
          }
          if (!parsed.trainingLog.english) parsed.trainingLog.english = [];
          if (!parsed.trainingLog.spanish) parsed.trainingLog.spanish = [];

          // Migration: altes Format hatte customVocabulary (mit english + spanish)
          if (parsed.customVocabulary !== undefined && parsed.customVocabularyEN === undefined) {
            const { en, es } = migrateOldCustomVocab(parsed);
            parsed.customVocabularyEN = en;
            parsed.customVocabularyES = es;
            delete parsed.customVocabulary;
          }
          if (!parsed.customVocabularyEN) parsed.customVocabularyEN = [];
          if (!parsed.customVocabularyES) parsed.customVocabularyES = [];

          setState(parsed);
        } catch {
          // ignore parse errors
        }
      }
      setLoaded(true);
    })();
  }, []);

  useEffect(() => {
    if (!loaded) return;
    // Debounce writes to avoid hammering IndexedDB on rapid state changes
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      storageSet(STORAGE_KEY, JSON.stringify(state));
    }, 300);
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, [state, loaded]);

  const getVocabForLang = (lang: Language): VocabularyItem[] =>
    lang === 'english'
      ? [...VOCABULARY_EN, ...state.customVocabularyEN]
      : [...VOCABULARY_ES, ...state.customVocabularyES];

  const allVocabulary = getVocabForLang(state.selectedLanguage);

  const setLanguage = (lang: Language) => setState(s => ({ ...s, selectedLanguage: lang }));
  const setQueryDirection = (dir: QueryDirection) => setState(s => ({ ...s, queryDirection: dir }));
  const setDailyCardLimit = (limit: number) => setState(s => ({ ...s, dailyCardLimit: limit }));
  const setQuizAutoSpeak = (enabled: boolean) => setState(s => ({ ...s, quizAutoSpeak: enabled }));
  const setFlashcardAutoSpeak = (enabled: boolean) => setState(s => ({ ...s, flashcardAutoSpeak: enabled }));

  const progressKey = (vocabId: string, lang: Language) => `${vocabId}_${lang}`;

  const getCardProgress = (vocabId: string, lang: Language): CardProgress =>
    state.progress[progressKey(vocabId, lang)] ?? defaultProgress();

  const markCard = (vocabId: string, lang: Language, correct: boolean) => {
    setState(s => {
      const key = progressKey(vocabId, lang);
      const current = s.progress[key] ?? defaultProgress();
      const newBox = correct ? Math.min(current.box + 1, 6) : 1;

      const today = todayDate();
      const todayStr = localDateStr(today);
      let nextDate: string | null;
      if (!correct) {
        // Falsch → Phase 1, morgen wieder fällig
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        nextDate = localDateStr(tomorrow);
      } else if (newBox >= 6) {
        // Phase 6 = gelernt, nie wieder fällig
        nextDate = null;
      } else {
        const intervalDays = BOX_INTERVALS[newBox - 1] as number;
        const next = new Date(today);
        next.setDate(next.getDate() + intervalDays);
        nextDate = localDateStr(next);
      }

      const langStats = s.dailyStats?.[lang];
      const prevDaily = langStats?.date === todayStr ? langStats : { date: todayStr, count: 0 };
      const newLangStats = { date: todayStr, count: prevDaily.count + 1 };

      return {
        ...s,
        dailyStats: { ...s.dailyStats, [lang]: newLangStats },
        progress: {
          ...s.progress,
          [key]: {
            box: newBox,
            lastReviewed: new Date().toISOString(),
            nextDate,
            correctCount: current.correctCount + (correct ? 1 : 0),
            incorrectCount: current.incorrectCount + (correct ? 0 : 1),
          },
        },
      };
    });
  };

  const addCustomVocabulary = (item: Omit<VocabularyItem, 'id' | 'isCustom'>, lang: Language) => {
    const newItem: VocabularyItem = { ...item, id: `custom_${Date.now()}`, isCustom: true };
    if (lang === 'english') {
      setState(s => ({ ...s, customVocabularyEN: [...s.customVocabularyEN, newItem] }));
    } else {
      setState(s => ({ ...s, customVocabularyES: [...s.customVocabularyES, newItem] }));
    }
  };

  const deleteCustomVocabulary = (id: string) => {
    setState(s => ({
      ...s,
      customVocabularyEN: s.customVocabularyEN.filter(v => v.id !== id),
      customVocabularyES: s.customVocabularyES.filter(v => v.id !== id),
    }));
  };

  const getDueCards = (lang: Language): VocabularyItem[] => {
    const todayStr = localDateStr(todayDate());
    const langStats = state.dailyStats?.[lang];
    const reviewedToday = langStats?.date === todayStr ? langStats.count : 0;
    const effectiveLimit = state.dailyCardLimit > 0
      ? Math.max(0, state.dailyCardLimit - reviewedToday)
      : Infinity;

    if (effectiveLimit === 0) return [];

    const due = getVocabForLang(lang)
      .filter(v => isCardDue(getCardProgress(v.id, lang)))
      .sort((a, b) => {
        const pa = getCardProgress(a.id, lang);
        const pb = getCardProgress(b.id, lang);
        // Phase ASC
        if (pa.box !== pb.box) return pa.box - pb.box;
        // Datum ASC (null = neue Karte = höchste Priorität)
        if (!pa.nextDate && !pb.nextDate) return 0;
        if (!pa.nextDate) return -1;
        if (!pb.nextDate) return 1;
        return pa.nextDate.localeCompare(pb.nextDate);
      });
    return isFinite(effectiveLimit) ? due.slice(0, effectiveLimit) : due;
  };

  const getBoxCounts = (lang: Language): number[] => {
    const counts = [0, 0, 0, 0, 0, 0];
    getVocabForLang(lang).forEach(v => {
      const prog = getCardProgress(v.id, lang);
      counts[Math.min(Math.max(prog.box - 1, 0), 5)]++;
    });
    return counts;
  };

  const recordTrainingDay = (lang: Language) => {
    const todayStr = localDateStr(new Date());
    setState(s => {
      const log = s.trainingLog[lang] ?? [];
      if (log.includes(todayStr)) return s;
      return { ...s, trainingLog: { ...s.trainingLog, [lang]: [...log, todayStr] } };
    });
  };

  const getTrainingConsistency = (lang: Language, days: number): { rate: number; daysActive: number; totalDays: number } => {
    const log = state.trainingLog[lang] ?? [];
    const today = new Date();

    // Denominator: only count days since the first recorded training day (can't be absent before tracking started)
    let effectiveDays = days;
    if (log.length > 0) {
      const firstEntry = [...log].sort()[0];
      const [y, m, d] = firstEntry.split('-').map(Number);
      const firstDate = new Date(y, m - 1, d);
      const msPerDay = 1000 * 60 * 60 * 24;
      const daysSinceFirst = Math.round((todayDate().getTime() - firstDate.getTime()) / msPerDay);
      effectiveDays = Math.min(days, daysSinceFirst + 1);
    }

    let daysActive = 0;
    for (let i = 0; i < days; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      if (log.includes(localDateStr(d))) daysActive++;
    }

    const rate = effectiveDays > 0 ? Math.round((daysActive / effectiveDays) * 100) : 0;
    return { rate, daysActive, totalDays: effectiveDays };
  };

  const resetProgress = () => setState(s => ({ ...s, progress: {} }));

  const getTotalStats = (lang: Language) => {
    const vocab = getVocabForLang(lang);
    const total = vocab.length;
    let correct = 0, incorrect = 0, learned = 0;
    vocab.forEach(v => {
      const prog = getCardProgress(v.id, lang);
      correct += prog.correctCount;
      incorrect += prog.incorrectCount;
      if (prog.box >= 6) learned++;
    });
    const successRate = correct + incorrect > 0 ? Math.round((correct / (correct + incorrect)) * 100) : 0;
    const dueToday = getDueCards(lang).length;
    return { total, learned, dueToday, successRate };
  };

  if (!loaded) return null;

  return (
    <LearningContext.Provider value={{
      ...state,
      allVocabulary,
      setLanguage,
      setQueryDirection,
      setDailyCardLimit,
      setQuizAutoSpeak,
      setFlashcardAutoSpeak,
      getCardProgress,
      markCard,
      addCustomVocabulary,
      deleteCustomVocabulary,
      getDueCards,
      getBoxCounts,
      resetProgress,
      getTotalStats,
      recordTrainingDay,
      getTrainingConsistency,
    }}>
      {children}
    </LearningContext.Provider>
  );
}

export function useLearning() {
  const ctx = useContext(LearningContext);
  if (!ctx) throw new Error('useLearning must be used within LearningProvider');
  return ctx;
}
