import type { AppSettings, DailyStats, FileState, FileId } from '../data/vocabulary_types';

export const DEFAULT_SETTINGS: AppSettings = {
  queryDirection: 'de-to-foreign',
  quizAutoSpeak: false,
  flashcardAutoSpeak: false,
  typingTolerant: false,
  includeSentences: true,
};

export const DEFAULT_DAILY_CARD_LIMIT = 30;
export const DEFAULT_DAILY_NEW_CARD_LIMIT = 5;

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
    dailyCardLimit: DEFAULT_DAILY_CARD_LIMIT,
    dailyNewCardLimit: DEFAULT_DAILY_NEW_CARD_LIMIT,
  };
}
