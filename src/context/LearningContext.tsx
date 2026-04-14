import React, { createContext, useContext, useEffect, useState } from 'react';
import { BUILT_IN_VOCABULARY, VocabularyItem } from '../data/vocabulary';
import { BOX_INTERVALS } from '../constants/theme';

export type Language = 'english' | 'spanish';
export type QueryDirection = 'de-to-foreign' | 'foreign-to-de';

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
  customVocabulary: VocabularyItem[];
  dailyCardLimit: number;
  dailyStats: { date: string; count: number };
}

interface LearningContextType extends LearningState {
  allVocabulary: VocabularyItem[];
  setLanguage: (lang: Language) => void;
  setQueryDirection: (dir: QueryDirection) => void;
  setDailyCardLimit: (limit: number) => void;
  getCardProgress: (vocabId: string, lang: Language) => CardProgress;
  markCard: (vocabId: string, lang: Language, correct: boolean) => void;
  addCustomVocabulary: (item: Omit<VocabularyItem, 'id' | 'isCustom'>) => void;
  deleteCustomVocabulary: (id: string) => void;
  getDueCards: (lang: Language) => VocabularyItem[];
  getBoxCounts: (lang: Language) => number[];
  resetProgress: () => void;
  getTotalStats: (lang: Language) => { total: number; learned: number; dueToday: number; successRate: number };
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

function todayDate(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function isCardDue(progress: CardProgress): boolean {
  if (progress.box >= 6) return false;
  // Neues Feld: nextDate hat Vorrang
  if (progress.nextDate != null) {
    return todayDate() >= new Date(progress.nextDate);
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
    customVocabulary: [],
    dailyCardLimit: 20,
    dailyStats: { date: '', count: 0 },
  });
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        // Rückwärtskompatibilität: dailyStats fehlt in alten Saves
        if (!parsed.dailyStats) {
          parsed.dailyStats = { date: '', count: 0 };
        }
        setState(parsed);
      } catch {
        // ignore parse errors
      }
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (loaded) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }
  }, [state, loaded]);

  const allVocabulary = [...BUILT_IN_VOCABULARY, ...state.customVocabulary];

  const setLanguage = (lang: Language) => setState(s => ({ ...s, selectedLanguage: lang }));
  const setQueryDirection = (dir: QueryDirection) => setState(s => ({ ...s, queryDirection: dir }));
  const setDailyCardLimit = (limit: number) => setState(s => ({ ...s, dailyCardLimit: limit }));

  const progressKey = (vocabId: string, lang: Language) => `${vocabId}_${lang}`;

  const getCardProgress = (vocabId: string, lang: Language): CardProgress =>
    state.progress[progressKey(vocabId, lang)] ?? defaultProgress();

  const markCard = (vocabId: string, lang: Language, correct: boolean) => {
    setState(s => {
      const key = progressKey(vocabId, lang);
      const current = s.progress[key] ?? defaultProgress();
      const newBox = correct ? Math.min(current.box + 1, 6) : 1;

      const today = todayDate();
      const todayStr = today.toISOString().split('T')[0];
      let nextDate: string | null;
      if (!correct) {
        // Falsch → Phase 1, morgen wieder fällig
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        nextDate = tomorrow.toISOString().split('T')[0];
      } else if (newBox >= 6) {
        // Phase 6 = gelernt, nie wieder fällig
        nextDate = null;
      } else {
        const intervalDays = BOX_INTERVALS[newBox - 1] as number;
        const next = new Date(today);
        next.setDate(next.getDate() + intervalDays);
        nextDate = next.toISOString().split('T')[0];
      }

      const prevDaily = s.dailyStats?.date === todayStr ? s.dailyStats : { date: todayStr, count: 0 };
      const newDailyStats = { date: todayStr, count: prevDaily.count + 1 };

      return {
        ...s,
        dailyStats: newDailyStats,
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

  const addCustomVocabulary = (item: Omit<VocabularyItem, 'id' | 'isCustom'>) => {
    const newItem: VocabularyItem = { ...item, id: `custom_${Date.now()}`, isCustom: true };
    setState(s => ({ ...s, customVocabulary: [...s.customVocabulary, newItem] }));
  };

  const deleteCustomVocabulary = (id: string) => {
    setState(s => ({ ...s, customVocabulary: s.customVocabulary.filter(v => v.id !== id) }));
  };

  const getDueCards = (lang: Language): VocabularyItem[] => {
    const todayStr = todayDate().toISOString().split('T')[0];
    const reviewedToday = state.dailyStats?.date === todayStr ? state.dailyStats.count : 0;
    const effectiveLimit = state.dailyCardLimit > 0
      ? Math.max(0, state.dailyCardLimit - reviewedToday)
      : Infinity;

    if (effectiveLimit === 0) return [];

    const due = allVocabulary
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
    allVocabulary.forEach(v => {
      const prog = getCardProgress(v.id, lang);
      counts[Math.min(Math.max(prog.box - 1, 0), 5)]++;
    });
    return counts;
  };

  const resetProgress = () => setState(s => ({ ...s, progress: {} }));

  const getTotalStats = (lang: Language) => {
    const total = allVocabulary.length;
    let correct = 0, incorrect = 0, learned = 0;
    allVocabulary.forEach(v => {
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
      getCardProgress,
      markCard,
      addCustomVocabulary,
      deleteCustomVocabulary,
      getDueCards,
      getBoxCounts,
      resetProgress,
      getTotalStats,
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
