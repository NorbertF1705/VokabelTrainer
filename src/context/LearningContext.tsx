import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { storageGet, storageSet } from '../utils/storage';
import { migrateV12ToV13 } from '../migrations/v12_to_v13';
import { DEFAULT_SETTINGS, makeEmptyFileState } from '../config/default_settings';
import { ALL_FILE_IDS, fileExists, getFile } from '../config/file_config';
import {
  CURRENT_SCHEMA_VERSION,
  KEY_ACTIVE_FILE,
  KEY_SCHEMA_VERSION,
  KEY_SETTINGS,
  fileKey,
} from '../config/storage_keys';
import { BOX_INTERVALS } from '../constants/theme';
import type {
  AppSettings,
  CardProgress,
  FileId,
  FileState,
  VocabularyItem,
} from '../data/vocabulary_types';

// Re-exports für Screens
export type { Language, QueryDirection, CardProgress, FileId, FileState, AppSettings } from '../data/vocabulary_types';

// ── Context-Shape ─────────────────────────────────────────────────────────────

interface LearningContextValue {
  loaded: boolean;
  activeFileId: FileId | null;
  fileStates: Record<FileId, FileState>;
  vocabularyByFile: Record<FileId, VocabularyItem[]>;
  settings: AppSettings;
  isSessionActive: boolean;

  updateSettings: (patch: Partial<AppSettings>) => void;
  selectFile: (fileId: FileId) => Promise<void>;
  setSessionActive: (active: boolean) => void;

  addCustomVocab: (item: Omit<VocabularyItem, 'id' | 'isCustom'>) => void;
  removeCustomVocab: (vocabId: string) => void;

  markCard: (vocabId: string, correct: boolean) => void;
  getCardProgress: (vocabId: string) => CardProgress | undefined;
  getDueCards: () => VocabularyItem[];
  getNewCards: () => VocabularyItem[];
  resetProgress: () => void;

  getBoxCounts: () => number[];
  getTotalStats: () => { total: number; learned: number; dueToday: number; successRate: number };
  recordTrainingDay: () => void;
  getTrainingConsistency: (days: number) => { rate: number; daysActive: number; totalDays: number };
}

const Ctx = createContext<LearningContextValue | null>(null);

// ── SR-Hilfsfunktionen (1:1 aus v1.2) ────────────────────────────────────────

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
  if (progress.lastReviewed === null) return false; // neue Karte – über getNewCards einführen
  if (progress.nextDate != null) {
    return localDateStr(new Date()) >= progress.nextDate;
  }
  // Rückwärtskompatibilität für Karten ohne nextDate
  const interval = BOX_INTERVALS[progress.box - 1];
  if (interval === 0) return true;
  const last = new Date(progress.lastReviewed);
  const diffDays = (Date.now() - last.getTime()) / (1000 * 60 * 60 * 24);
  return diffDays >= interval;
}

// ── Content-Version-Reconcile ─────────────────────────────────────────────────

function reconcileContentVersion(
  state: FileState,
  newVocabulary: VocabularyItem[],
  newContentVersion: number,
): FileState {
  const validIds = new Set(newVocabulary.map((v) => v.id));
  for (const v of state.customVocabulary) validIds.add(v.id);
  const cleanedProgress: Record<string, CardProgress> = {};
  for (const [id, p] of Object.entries(state.progress)) {
    if (validIds.has(id)) cleanedProgress[id] = p;
  }
  return { ...state, progress: cleanedProgress, contentVersion: newContentVersion };
}

// ── Provider ──────────────────────────────────────────────────────────────────

export function LearningProvider({ children }: { children: ReactNode }) {
  const [loaded, setLoaded] = useState(false);
  const [activeFileId, setActiveFileId] = useState<FileId | null>(null);
  const [fileStates, setFileStates] = useState<Record<FileId, FileState>>({});
  const [vocabularyByFile, setVocabularyByFile] = useState<Record<FileId, VocabularyItem[]>>({});
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [isSessionActive, setSessionActive] = useState(false);

  // Refs für pagehide-Flush (immer aktueller State ohne Stale-Closure-Risiko)
  const fileStatesRef = useRef(fileStates);
  const activeFileIdRef = useRef(activeFileId);
  const settingsRef = useRef(settings);
  const vocabularyByFileRef = useRef(vocabularyByFile);
  useEffect(() => { fileStatesRef.current = fileStates; }, [fileStates]);
  useEffect(() => { activeFileIdRef.current = activeFileId; }, [activeFileId]);
  useEffect(() => { settingsRef.current = settings; }, [settings]);
  useEffect(() => { vocabularyByFileRef.current = vocabularyByFile; }, [vocabularyByFile]);

  // ── Bootstrap ───────────────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        if (navigator.storage?.persist) {
          try { await navigator.storage.persist(); } catch { /* tolerieren */ }
        }

        await migrateV12ToV13();

        const rawSettings = await storageGet(KEY_SETTINGS);
        const loadedSettings: AppSettings = rawSettings
          ? { ...DEFAULT_SETTINGS, ...JSON.parse(rawSettings) }
          : DEFAULT_SETTINGS;

        let loadedActiveId = await storageGet(KEY_ACTIVE_FILE);
        if (!fileExists(loadedActiveId)) loadedActiveId = null;

        const states: Record<FileId, FileState> = {};
        for (const id of ALL_FILE_IDS) {
          const raw = await storageGet(fileKey(id));
          if (raw) {
            try {
              states[id] = JSON.parse(raw) as FileState;
            } catch {
              states[id] = makeEmptyFileState(id, getFile(id)!.contentVersion);
            }
          } else {
            states[id] = makeEmptyFileState(id, getFile(id)!.contentVersion);
          }
        }

        const vocabMap: Record<FileId, VocabularyItem[]> = {};
        if (loadedActiveId) {
          const manifest = getFile(loadedActiveId)!;
          const { vocabulary } = await manifest.loader();
          vocabMap[loadedActiveId] = vocabulary;
          const state = states[loadedActiveId];
          if (state.contentVersion !== manifest.contentVersion) {
            states[loadedActiveId] = reconcileContentVersion(state, vocabulary, manifest.contentVersion);
          }
        }

        if (cancelled) return;
        setSettings(loadedSettings);
        setActiveFileId(loadedActiveId);
        setFileStates(states);
        setVocabularyByFile(vocabMap);
        setLoaded(true);
      } catch (e) {
        console.error('[LearningContext] Bootstrap-Fehler:', e);
        if (!cancelled) {
          setSettings(DEFAULT_SETTINGS);
          setActiveFileId(null);
          setFileStates({});
          setVocabularyByFile({});
          setLoaded(true);
        }
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // ── Debounced Save pro FileState ────────────────────────────────────────────
  const saveTimersRef = useRef<Record<FileId, ReturnType<typeof setTimeout> | null>>({});
  useEffect(() => {
    if (!loaded) return;
    for (const [id, state] of Object.entries(fileStates)) {
      const existing = saveTimersRef.current[id];
      if (existing) clearTimeout(existing);
      saveTimersRef.current[id] = setTimeout(() => {
        storageSet(fileKey(id), JSON.stringify(state)).catch((e) =>
          console.error(`[LearningContext] Save fehlgeschlagen (${id}):`, e),
        );
      }, 300);
    }
  }, [fileStates, loaded]);

  // ── Settings sofort speichern ───────────────────────────────────────────────
  useEffect(() => {
    if (!loaded) return;
    storageSet(KEY_SETTINGS, JSON.stringify(settings)).catch((e) =>
      console.error('[LearningContext] Settings-Save fehlgeschlagen:', e),
    );
  }, [settings, loaded]);

  // ── ActiveFileId sofort speichern ───────────────────────────────────────────
  useEffect(() => {
    if (!loaded || !activeFileId) return;
    storageSet(KEY_ACTIVE_FILE, activeFileId).catch((e) =>
      console.error('[LearningContext] ActiveFileId-Save fehlgeschlagen:', e),
    );
  }, [activeFileId, loaded]);

  // ── pagehide-Flush ──────────────────────────────────────────────────────────
  useEffect(() => {
    const flush = () => {
      try {
        localStorage.setItem(KEY_SETTINGS, JSON.stringify(settingsRef.current));
        localStorage.setItem(KEY_SCHEMA_VERSION, CURRENT_SCHEMA_VERSION);
        if (activeFileIdRef.current) {
          localStorage.setItem(KEY_ACTIVE_FILE, activeFileIdRef.current);
        }
        for (const [id, state] of Object.entries(fileStatesRef.current)) {
          localStorage.setItem(fileKey(id) + '_backup', JSON.stringify(state));
        }
      } catch (e) {
        console.warn('[LearningContext] pagehide-Flush fehlgeschlagen:', e);
      }
    };
    window.addEventListener('pagehide', flush);
    const onVisibility = () => { if (document.visibilityState === 'hidden') flush(); };
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      window.removeEventListener('pagehide', flush);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);

  // ── selectFile ──────────────────────────────────────────────────────────────
  const selectFile = useCallback(async (fileId: FileId) => {
    if (!fileExists(fileId)) {
      console.warn(`[LearningContext] selectFile: unbekannte FileId ${fileId}`);
      return;
    }
    const manifest = getFile(fileId)!;

    // Vokabelliste lazy laden falls noch nicht im Cache
    if (!vocabularyByFileRef.current[fileId]) {
      try {
        const { vocabulary } = await manifest.loader();
        setVocabularyByFile((prev) => ({ ...prev, [fileId]: vocabulary }));
      } catch (e) {
        console.error(`[LearningContext] Vokabelladen fehlgeschlagen (${fileId}):`, e);
      }
    }

    setFileStates((prev) => {
      const existing = prev[fileId];
      if (existing) {
        return { ...prev, [fileId]: { ...existing, lastOpenedAt: new Date().toISOString() } };
      }
      return {
        ...prev,
        [fileId]: { ...makeEmptyFileState(fileId, manifest.contentVersion), lastOpenedAt: new Date().toISOString() },
      };
    });

    setActiveFileId(fileId);
    setSessionActive(false);
  }, []);

  // ── updateSettings ──────────────────────────────────────────────────────────
  const updateSettings = useCallback((patch: Partial<AppSettings>) => {
    setSettings((s) => ({ ...s, ...patch }));
  }, []);

  // ── Helfer: aktiven FileState mutieren ─────────────────────────────────────
  const mutateActiveFile = useCallback((mutator: (s: FileState) => FileState) => {
    setFileStates((prev) => {
      const id = activeFileIdRef.current;
      if (!id || !prev[id]) return prev;
      return { ...prev, [id]: mutator(prev[id]) };
    });
  }, []);

  // ── markCard (SR-Logik aus v1.2, ohne lang-Parameter) ──────────────────────
  const markCard = useCallback((vocabId: string, correct: boolean) => {
    mutateActiveFile((s) => {
      const current = s.progress[vocabId];
      const newBox = correct ? Math.min((current?.box ?? 1) + 1, 6) : 1;

      const today = todayDate();
      const todayStr = localDateStr(today);
      let nextDate: string | null;
      if (!correct) {
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        nextDate = localDateStr(tomorrow);
      } else if (newBox >= 6) {
        nextDate = null;
      } else {
        const intervalDays = BOX_INTERVALS[newBox - 1] as number;
        const next = new Date(today);
        next.setDate(next.getDate() + intervalDays);
        nextDate = localDateStr(next);
      }

      const isNewCard = !current || current.lastReviewed === null;
      const prevDailyCount = s.dailyStats.date === todayStr ? s.dailyStats.count : 0;
      const prevNewCount = s.dailyNewStats.date === todayStr ? s.dailyNewStats.count : 0;

      return {
        ...s,
        progress: {
          ...s.progress,
          [vocabId]: {
            box: newBox,
            lastReviewed: new Date().toISOString(),
            nextDate,
            correctCount: (current?.correctCount ?? 0) + (correct ? 1 : 0),
            incorrectCount: (current?.incorrectCount ?? 0) + (correct ? 0 : 1),
          },
        },
        dailyStats: { date: todayStr, count: prevDailyCount + 1 },
        dailyNewStats: isNewCard
          ? { date: todayStr, count: prevNewCount + 1 }
          : s.dailyNewStats,
      };
    });
  }, [mutateActiveFile]);

  // ── addCustomVocab ──────────────────────────────────────────────────────────
  const addCustomVocab = useCallback((item: Omit<VocabularyItem, 'id' | 'isCustom'>) => {
    const newItem: VocabularyItem = { ...item, id: `custom_${Date.now()}`, isCustom: true };
    mutateActiveFile((s) => ({
      ...s,
      customVocabulary: [...s.customVocabulary, newItem],
    }));
  }, [mutateActiveFile]);

  // ── removeCustomVocab ───────────────────────────────────────────────────────
  const removeCustomVocab = useCallback((vocabId: string) => {
    mutateActiveFile((s) => {
      const nextProgress = { ...s.progress };
      delete nextProgress[vocabId];
      return {
        ...s,
        customVocabulary: s.customVocabulary.filter((v) => v.id !== vocabId),
        progress: nextProgress,
      };
    });
  }, [mutateActiveFile]);

  // ── resetProgress ───────────────────────────────────────────────────────────
  const resetProgress = useCallback(() => {
    mutateActiveFile((s) => ({ ...s, progress: {} }));
  }, [mutateActiveFile]);

  // ── recordTrainingDay ───────────────────────────────────────────────────────
  const recordTrainingDay = useCallback(() => {
    const today = localDateStr(new Date());
    mutateActiveFile((s) => {
      if (s.trainingLog.includes(today)) return s;
      return { ...s, trainingLog: [...s.trainingLog, today] };
    });
  }, [mutateActiveFile]);

  // ── getCardProgress ─────────────────────────────────────────────────────────
  const getCardProgress = useCallback((vocabId: string): CardProgress | undefined => {
    const id = activeFileIdRef.current;
    if (!id) return undefined;
    return fileStatesRef.current[id]?.progress[vocabId];
  }, []);

  // ── getDueCards ─────────────────────────────────────────────────────────────
  const getDueCards = useCallback((): VocabularyItem[] => {
    const id = activeFileIdRef.current;
    if (!id) return [];
    const state = fileStatesRef.current[id];
    const vocab = vocabularyByFileRef.current[id];
    if (!state || !vocab) return [];

    const todayStr = localDateStr(todayDate());
    const reviewedToday = state.dailyStats.date === todayStr ? state.dailyStats.count : 0;
    const { dailyCardLimit } = settingsRef.current;
    const effectiveLimit = dailyCardLimit > 0
      ? Math.max(0, dailyCardLimit - reviewedToday)
      : Infinity;
    if (effectiveLimit === 0) return [];

    const allVocab = [...vocab, ...state.customVocabulary];
    const due = allVocab
      .filter((v) => {
        const p = state.progress[v.id];
        return p && isCardDue(p);
      })
      .sort((a, b) => {
        const pa = state.progress[a.id];
        const pb = state.progress[b.id];
        if (pa.box !== pb.box) return pa.box - pb.box;
        if (!pa.nextDate && !pb.nextDate) return 0;
        if (!pa.nextDate) return -1;
        if (!pb.nextDate) return 1;
        return pa.nextDate.localeCompare(pb.nextDate);
      });
    return isFinite(effectiveLimit) ? due.slice(0, effectiveLimit) : due;
  }, []);

  // ── getNewCards ─────────────────────────────────────────────────────────────
  const getNewCards = useCallback((): VocabularyItem[] => {
    const id = activeFileIdRef.current;
    if (!id) return [];
    const state = fileStatesRef.current[id];
    const vocab = vocabularyByFileRef.current[id];
    if (!state || !vocab) return [];

    const { dailyNewCardLimit } = settingsRef.current;
    if (dailyNewCardLimit === 0) return [];

    const todayStr = localDateStr(todayDate());
    const introducedToday = state.dailyNewStats.date === todayStr ? state.dailyNewStats.count : 0;
    const remaining = dailyNewCardLimit === -1
      ? Infinity
      : Math.max(0, dailyNewCardLimit - introducedToday);
    if (remaining === 0) return [];

    const allVocab = [...vocab, ...state.customVocabulary];
    const newCards = allVocab.filter((v) => {
      const p = state.progress[v.id];
      return !p || p.lastReviewed === null;
    });
    return isFinite(remaining) ? newCards.slice(0, remaining) : newCards;
  }, []);

  // ── getBoxCounts ────────────────────────────────────────────────────────────
  const getBoxCounts = useCallback((): number[] => {
    const id = activeFileIdRef.current;
    const state = id ? fileStatesRef.current[id] : null;
    const vocab = id ? vocabularyByFileRef.current[id] : null;
    const counts = [0, 0, 0, 0, 0, 0];
    if (!state || !vocab) return counts;
    const allVocab = [...vocab, ...state.customVocabulary];
    allVocab.forEach((v) => {
      const prog = state.progress[v.id];
      const boxIdx = prog ? Math.min(Math.max(prog.box - 1, 0), 5) : 0;
      counts[boxIdx]++;
    });
    return counts;
  }, []);

  // ── getTotalStats ───────────────────────────────────────────────────────────
  const getTotalStats = useCallback(() => {
    const id = activeFileIdRef.current;
    const state = id ? fileStatesRef.current[id] : null;
    const vocab = id ? vocabularyByFileRef.current[id] : null;
    if (!state || !vocab) return { total: 0, learned: 0, dueToday: 0, successRate: 0 };

    const allVocab = [...vocab, ...state.customVocabulary];
    let correct = 0, incorrect = 0, learned = 0, dueToday = 0;
    allVocab.forEach((v) => {
      const prog = state.progress[v.id];
      if (prog) {
        correct += prog.correctCount;
        incorrect += prog.incorrectCount;
        if (prog.box >= 6) learned++;
        if (isCardDue(prog)) dueToday++;
      }
    });
    const successRate = correct + incorrect > 0 ? Math.round((correct / (correct + incorrect)) * 100) : 0;
    return { total: allVocab.length, learned, dueToday, successRate };
  }, []);

  // ── getTrainingConsistency (aus v1.2, ohne lang-Parameter) ─────────────────
  const getTrainingConsistency = useCallback((days: number): { rate: number; daysActive: number; totalDays: number } => {
    const id = activeFileIdRef.current;
    const log = (id ? fileStatesRef.current[id]?.trainingLog : null) ?? [];
    const today = new Date();

    let effectiveDays = days;
    if (log.length > 0) {
      const firstEntry = [...log].sort()[0];
      const [y, m, d] = firstEntry.split('-').map(Number);
      const firstDate = new Date(y, m - 1, d);
      const daysSinceFirst = Math.round((todayDate().getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24));
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
  }, []);

  // ── Context-Wert ────────────────────────────────────────────────────────────
  const value = useMemo<LearningContextValue>(() => ({
    loaded,
    activeFileId,
    fileStates,
    vocabularyByFile,
    settings,
    isSessionActive,
    updateSettings,
    selectFile,
    setSessionActive,
    addCustomVocab,
    removeCustomVocab,
    markCard,
    getCardProgress,
    getDueCards,
    getNewCards,
    resetProgress,
    getBoxCounts,
    getTotalStats,
    recordTrainingDay,
    getTrainingConsistency,
  }), [
    loaded, activeFileId, fileStates, vocabularyByFile, settings, isSessionActive,
    updateSettings, selectFile, addCustomVocab, removeCustomVocab,
    markCard, getCardProgress, getDueCards, getNewCards, resetProgress,
    getBoxCounts, getTotalStats, recordTrainingDay, getTrainingConsistency,
  ]);

  if (!loaded) return null;
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useLearning(): LearningContextValue {
  const v = useContext(Ctx);
  if (!v) throw new Error('useLearning muss innerhalb LearningProvider verwendet werden');
  return v;
}
