import type { AppSettings, DailyStats, FileState, FileId } from '../data/vocabulary_types';

export const DEFAULT_SETTINGS: AppSettings = {
  queryDirection: 'de-to-foreign',
  dailyCardLimit: 20,
  dailyNewCardLimit: 5,
  quizAutoSpeak: false,
  flashcardAutoSpeak: false,
  typingTolerant: false,
};

export const EMPTY_DAILY_STATS: DailyStats = { date: '', count: 0 };

export function makeEmptyFileState(fileId: FileId, contentVersion: number): FileState {
  return {
    fileId,
    schemaVersion: 3,
    contentVersion,
    progress: {},
    customVocabulary: [],
    dailyStats: { ...EMPTY_DAILY_STATS },
    dailyNewStats: { ...EMPTY_DAILY_STATS },
    trainingLog: [],
    lastOpenedAt: null,
  };
}
