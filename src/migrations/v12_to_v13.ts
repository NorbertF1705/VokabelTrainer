import { storageGet, storageSet } from '../utils/storage';
import { DEFAULT_SETTINGS, EMPTY_DAILY_STATS } from '../config/default_settings';
import { FALLBACK_FILE_ID, LEGACY_LANGUAGE_TO_FILE, fileExists } from '../config/file_config';
import {
  CURRENT_SCHEMA_VERSION,
  KEY_ACTIVE_FILE,
  KEY_BACKUP_V12,
  KEY_SCHEMA_VERSION,
  KEY_SETTINGS,
  LEGACY_KEY_V12,
  fileKey,
} from '../config/storage_keys';
import type {
  AppSettings,
  CardProgress,
  DailyStats,
  FileId,
  FileState,
  QueryDirection,
  VocabularyItem,
} from '../data/vocabulary_types';

// ── Migrationsergebnis ────────────────────────────────────────────────────────

export type MigrationResult =
  | { migrated: true; activeFileId: FileId }
  | { migrated: false; reason: MigrationSkipReason };

export type MigrationSkipReason =
  | 'already-on-v3'
  | 'no-legacy-data'
  | 'parse-failed'
  | 'unknown-schema'
  | 'write-failed';

// ── v1.2-Schema ───────────────────────────────────────────────────────────────

interface V12State {
  selectedLanguage: string;
  queryDirection?: string;
  progress?: Record<string, CardProgress>;
  customVocabularyEN?: VocabularyItem[];
  customVocabularyES?: VocabularyItem[];
  dailyCardLimit?: number;
  dailyNewCardLimit?: number;
  dailyStats?: Record<string, DailyStats>;
  dailyNewStats?: Record<string, DailyStats>;
  trainingLog?: Record<string, string[]>;
  quizAutoSpeak?: boolean;
  flashcardAutoSpeak?: boolean;
  typingTolerant?: boolean;
}

function isV12State(o: unknown): o is V12State {
  if (!o || typeof o !== 'object') return false;
  const s = o as Record<string, unknown>;
  return (
    typeof s.selectedLanguage === 'string' &&
    typeof s.progress === 'object' &&
    'customVocabularyEN' in s &&
    'customVocabularyES' in s
  );
}

// ── Progress-Splitter ─────────────────────────────────────────────────────────

function splitProgressByLanguage(flat: Record<string, CardProgress>): {
  english: Record<string, CardProgress>;
  spanish: Record<string, CardProgress>;
} {
  const out = {
    english: {} as Record<string, CardProgress>,
    spanish: {} as Record<string, CardProgress>,
  };
  for (const [key, value] of Object.entries(flat)) {
    if (key.endsWith('_english')) {
      out.english[key.slice(0, -'_english'.length)] = value;
    } else if (key.endsWith('_spanish')) {
      out.spanish[key.slice(0, -'_spanish'.length)] = value;
    }
  }
  return out;
}

// ── Hauptfunktion ─────────────────────────────────────────────────────────────

/**
 * Führt die Migration v1.2 → v1.3 aus.
 * Idempotent — bei bereits gesetztem vt:schemaVersion="3" passiert nichts.
 * Non-destruktiv — der originale v1.2-Blob bleibt erhalten.
 */
export async function migrateV12ToV13(): Promise<MigrationResult> {
  const currentSchema = await storageGet(KEY_SCHEMA_VERSION);
  if (currentSchema === CURRENT_SCHEMA_VERSION) {
    return { migrated: false, reason: 'already-on-v3' };
  }

  const raw = await storageGet(LEGACY_KEY_V12);
  if (raw == null || raw === '') {
    await storageSet(KEY_SCHEMA_VERSION, CURRENT_SCHEMA_VERSION);
    return { migrated: false, reason: 'no-legacy-data' };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (e) {
    console.error('[migration v12->v13] Parse-Fehler:', e);
    return { migrated: false, reason: 'parse-failed' };
  }

  if (!isV12State(parsed)) {
    console.warn('[migration v12->v13] Unbekanntes Schema, Migration übersprungen.');
    return { migrated: false, reason: 'unknown-schema' };
  }

  const v12 = parsed;

  try {
    await storageSet(KEY_BACKUP_V12, raw);

    const settings: AppSettings = {
      queryDirection: (v12.queryDirection as QueryDirection) ?? DEFAULT_SETTINGS.queryDirection,
      dailyCardLimit:
        typeof v12.dailyCardLimit === 'number'
          ? v12.dailyCardLimit
          : DEFAULT_SETTINGS.dailyCardLimit,
      dailyNewCardLimit:
        typeof v12.dailyNewCardLimit === 'number'
          ? v12.dailyNewCardLimit
          : DEFAULT_SETTINGS.dailyNewCardLimit,
      quizAutoSpeak: !!v12.quizAutoSpeak,
      flashcardAutoSpeak: !!v12.flashcardAutoSpeak,
      typingTolerant: !!v12.typingTolerant,
    };
    await storageSet(KEY_SETTINGS, JSON.stringify(settings));

    const split = splitProgressByLanguage(v12.progress ?? {});

    const englishFileId = LEGACY_LANGUAGE_TO_FILE.english;
    const spanishFileId = LEGACY_LANGUAGE_TO_FILE.spanish;

    const englishFile: FileState = {
      fileId: englishFileId,
      schemaVersion: 3,
      contentVersion: 1,
      progress: split.english,
      customVocabulary: Array.isArray(v12.customVocabularyEN) ? v12.customVocabularyEN : [],
      dailyStats: v12.dailyStats?.english ?? { ...EMPTY_DAILY_STATS },
      dailyNewStats: v12.dailyNewStats?.english ?? { ...EMPTY_DAILY_STATS },
      trainingLog: Array.isArray(v12.trainingLog?.english) ? v12.trainingLog!.english : [],
      lastOpenedAt: null,
    };
    const spanishFile: FileState = {
      fileId: spanishFileId,
      schemaVersion: 3,
      contentVersion: 1,
      progress: split.spanish,
      customVocabulary: Array.isArray(v12.customVocabularyES) ? v12.customVocabularyES : [],
      dailyStats: v12.dailyStats?.spanish ?? { ...EMPTY_DAILY_STATS },
      dailyNewStats: v12.dailyNewStats?.spanish ?? { ...EMPTY_DAILY_STATS },
      trainingLog: Array.isArray(v12.trainingLog?.spanish) ? v12.trainingLog!.spanish : [],
      lastOpenedAt: null,
    };

    await storageSet(fileKey(englishFileId), JSON.stringify(englishFile));
    await storageSet(fileKey(spanishFileId), JSON.stringify(spanishFile));

    const mapped = LEGACY_LANGUAGE_TO_FILE[v12.selectedLanguage];
    const activeFileId: FileId = fileExists(mapped) ? mapped! : FALLBACK_FILE_ID;
    await storageSet(KEY_ACTIVE_FILE, activeFileId);

    await storageSet(KEY_SCHEMA_VERSION, CURRENT_SCHEMA_VERSION);

    console.info(
      `[migration v12->v13] OK. Aktive Datei: ${activeFileId}, ` +
        `Progress EN/ES: ${Object.keys(split.english).length}/${Object.keys(split.spanish).length}`,
    );
    return { migrated: true, activeFileId };
  } catch (e) {
    console.error('[migration v12->v13] Schreibfehler, breche ab:', e);
    return { migrated: false, reason: 'write-failed' };
  }
}

// ── Export für Tests ──────────────────────────────────────────────────────────

export const __test__ = { isV12State, splitProgressByLanguage };
