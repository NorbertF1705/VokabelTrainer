import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const memoryStore = new Map<string, string>();

vi.mock('../../utils/storage', () => ({
  storageGet: vi.fn(async (key: string) => memoryStore.get(key) ?? null),
  storageSet: vi.fn(async (key: string, value: string) => {
    memoryStore.set(key, value);
  }),
}));

import { migrateV12ToV13, __test__ } from '../v12_to_v13';
import {
  CURRENT_SCHEMA_VERSION,
  KEY_ACTIVE_FILE,
  KEY_BACKUP_V12,
  KEY_SCHEMA_VERSION,
  KEY_SETTINGS,
  LEGACY_KEY_V12,
  fileKey,
} from '../../config/storage_keys';
import type { FileState } from '../../data/vocabulary_types';

// ── Fixtures ──────────────────────────────────────────────────────────────────

const V12_BLOB_EMPTY = JSON.stringify({
  selectedLanguage: 'english',
  queryDirection: 'de-to-foreign',
  progress: {},
  customVocabularyEN: [],
  customVocabularyES: [],
  dailyCardLimit: 20,
  dailyStats: { english: { date: '', count: 0 }, spanish: { date: '', count: 0 } },
  quizAutoSpeak: false,
  flashcardAutoSpeak: false,
  typingTolerant: false,
  dailyNewCardLimit: 5,
  dailyNewStats: { english: { date: '', count: 0 }, spanish: { date: '', count: 0 } },
  trainingLog: { english: [], spanish: [] },
});

const V12_BLOB_WITH_PROGRESS = JSON.stringify({
  selectedLanguage: 'spanish',
  queryDirection: 'foreign-to-de',
  progress: {
    apple_english: { box: 3, lastReviewed: '2026-05-10T10:00:00.000Z', nextDate: '2026-05-17', correctCount: 5, incorrectCount: 1 },
    cat_english:   { box: 1, lastReviewed: null, nextDate: null, correctCount: 0, incorrectCount: 0 },
    manzana_spanish: { box: 2, lastReviewed: '2026-05-09T08:30:00.000Z', nextDate: '2026-05-12', correctCount: 3, incorrectCount: 2 },
    weird_key_no_lang: { box: 1, lastReviewed: null, nextDate: null, correctCount: 0, incorrectCount: 0 },
  },
  customVocabularyEN: [{ id: 'custom_1', german: 'Apfelmus', translation: 'apple sauce', emoji: '🍎', category: 'Essen & Trinken', isCustom: true }],
  customVocabularyES: [],
  dailyCardLimit: 30,
  dailyNewCardLimit: 10,
  dailyStats:    { english: { date: '2026-05-10', count: 7 }, spanish: { date: '2026-05-10', count: 4 } },
  dailyNewStats: { english: { date: '2026-05-10', count: 2 }, spanish: { date: '2026-05-10', count: 1 } },
  trainingLog:   { english: ['2026-05-08', '2026-05-09', '2026-05-10'], spanish: ['2026-05-10'] },
  quizAutoSpeak: true,
  flashcardAutoSpeak: false,
  typingTolerant: true,
});

beforeEach(() => { memoryStore.clear(); vi.clearAllMocks(); });

// ── splitProgressByLanguage ───────────────────────────────────────────────────

describe('splitProgressByLanguage', () => {
  it('splittet nach Sprach-Suffix und entfernt das Suffix vom Key', () => {
    const flat = {
      apple_english: { box: 2, lastReviewed: null, nextDate: null, correctCount: 0, incorrectCount: 0 },
      manzana_spanish: { box: 3, lastReviewed: null, nextDate: null, correctCount: 0, incorrectCount: 0 },
    };
    const out = __test__.splitProgressByLanguage(flat);
    expect(Object.keys(out.english)).toEqual(['apple']);
    expect(Object.keys(out.spanish)).toEqual(['manzana']);
  });

  it('verwirft Keys ohne erkennbares Sprach-Suffix', () => {
    const flat = { odd_key: { box: 1, lastReviewed: null, nextDate: null, correctCount: 0, incorrectCount: 0 } };
    const out = __test__.splitProgressByLanguage(flat);
    expect(Object.keys(out.english)).toHaveLength(0);
    expect(Object.keys(out.spanish)).toHaveLength(0);
  });
});

// ── migrateV12ToV13 ───────────────────────────────────────────────────────────

describe('migrateV12ToV13', () => {
  it('macht nichts, wenn schemaVersion bereits "3" ist', async () => {
    memoryStore.set(KEY_SCHEMA_VERSION, '3');
    expect(await migrateV12ToV13()).toEqual({ migrated: false, reason: 'already-on-v3' });
  });

  it('setzt Schema-Marker bei fehlendem v1.2-Blob', async () => {
    expect(await migrateV12ToV13()).toEqual({ migrated: false, reason: 'no-legacy-data' });
    expect(memoryStore.get(KEY_SCHEMA_VERSION)).toBe('3');
  });

  it('migriert leeren v1.2-Blob korrekt', async () => {
    memoryStore.set(LEGACY_KEY_V12, V12_BLOB_EMPTY);
    const result = await migrateV12ToV13();
    expect(result).toEqual({ migrated: true, activeFileId: 'en-basic-v1' });
    expect(memoryStore.get(KEY_SCHEMA_VERSION)).toBe(CURRENT_SCHEMA_VERSION);
    expect(memoryStore.get(KEY_ACTIVE_FILE)).toBe('en-basic-v1');
    const settings = JSON.parse(memoryStore.get(KEY_SETTINGS)!);
    expect(settings).toMatchObject({ queryDirection: 'de-to-foreign', dailyCardLimit: 20, dailyNewCardLimit: 5 });
    const enFile = JSON.parse(memoryStore.get(fileKey('en-basic-v1'))!) as FileState;
    expect(enFile.progress).toEqual({});
    expect(enFile.customVocabulary).toEqual([]);
  });

  it('migriert befüllten v1.2-Blob inkl. Progress-Splitting', async () => {
    memoryStore.set(LEGACY_KEY_V12, V12_BLOB_WITH_PROGRESS);
    const result = await migrateV12ToV13();
    expect(result).toEqual({ migrated: true, activeFileId: 'es-basic-v1' });
    const enFile = JSON.parse(memoryStore.get(fileKey('en-basic-v1'))!) as FileState;
    expect(Object.keys(enFile.progress).sort()).toEqual(['apple', 'cat']);
    expect(enFile.progress.apple.box).toBe(3);
    expect(enFile.customVocabulary).toHaveLength(1);
    expect(enFile.dailyStats).toEqual({ date: '2026-05-10', count: 7 });
    expect(enFile.trainingLog).toHaveLength(3);
    const esFile = JSON.parse(memoryStore.get(fileKey('es-basic-v1'))!) as FileState;
    expect(Object.keys(esFile.progress)).toEqual(['manzana']);
    expect(esFile.progress.manzana.box).toBe(2);
  });

  it('schreibt Backup unter vt:backup:v1_2', async () => {
    memoryStore.set(LEGACY_KEY_V12, V12_BLOB_WITH_PROGRESS);
    await migrateV12ToV13();
    expect(memoryStore.get(KEY_BACKUP_V12)).toBe(V12_BLOB_WITH_PROGRESS);
  });

  it('löscht den alten v1.2-Hauptschlüssel NICHT', async () => {
    memoryStore.set(LEGACY_KEY_V12, V12_BLOB_WITH_PROGRESS);
    await migrateV12ToV13();
    expect(memoryStore.get(LEGACY_KEY_V12)).toBe(V12_BLOB_WITH_PROGRESS);
  });

  it('ist idempotent: zweiter Lauf macht nichts', async () => {
    memoryStore.set(LEGACY_KEY_V12, V12_BLOB_WITH_PROGRESS);
    expect((await migrateV12ToV13()).migrated).toBe(true);
    const backupBefore = memoryStore.get(KEY_BACKUP_V12);
    expect(await migrateV12ToV13()).toEqual({ migrated: false, reason: 'already-on-v3' });
    expect(memoryStore.get(KEY_BACKUP_V12)).toBe(backupBefore);
  });

  it('gibt parse-failed zurück bei kaputtem JSON', async () => {
    memoryStore.set(LEGACY_KEY_V12, '{not-json');
    expect(await migrateV12ToV13()).toEqual({ migrated: false, reason: 'parse-failed' });
    expect(memoryStore.get(KEY_SCHEMA_VERSION)).toBeUndefined();
  });

  it('gibt unknown-schema zurück bei strukturfremdem JSON', async () => {
    memoryStore.set(LEGACY_KEY_V12, JSON.stringify({ foo: 'bar' }));
    expect(await migrateV12ToV13()).toEqual({ migrated: false, reason: 'unknown-schema' });
  });

  it('fällt auf en-basic-v1 zurück bei unbekannter Sprache', async () => {
    memoryStore.set(LEGACY_KEY_V12, JSON.stringify({ selectedLanguage: 'klingon', progress: {}, customVocabularyEN: [], customVocabularyES: [] }));
    expect(await migrateV12ToV13()).toEqual({ migrated: true, activeFileId: 'en-basic-v1' });
  });
});
