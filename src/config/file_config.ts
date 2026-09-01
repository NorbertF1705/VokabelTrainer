import type { FileId, FileManifestEntry, Language } from '../data/vocabulary_types';

export const FILE_CONFIG: Record<FileId, FileManifestEntry> = {
  'en-basic-v1': {
    id: 'en-basic-v1',
    language: 'en',
    displayName: 'Englisch – Grundwortschatz',
    shortLabel: '🇬🇧 Englisch · Grundwortschatz',
    voice: 'en-US',
    contentVersion: 1,
    loader: () =>
      import('../data/vocabulary/en-basic-v1').then((m) => ({
        vocabulary: m.VOCABULARY_EN_BASIC,
      })),
  },
  'en-grund2-v1': {
    id: 'en-grund2-v1',
    language: 'en',
    displayName: 'Englisch – Grundwortschatz 2',
    shortLabel: '🇬🇧 Englisch · Grundwortschatz 2',
    voice: 'en-US',
    contentVersion: 1,
    loader: () =>
      import('../data/vocabulary/en-grund2-v1').then((m) => ({
        vocabulary: m.VOCABULARY_EN_GRUND2,
      })),
    examplesLoader: () =>
      import('../data/examples/en-grund2-v1').then((m) => ({
        examples: m.EXAMPLES_EN_GRUND2,
      })),
  },
  'en-a2b1-v1': {
    id: 'en-a2b1-v1',
    language: 'en',
    displayName: 'Englisch – Aufbauwortschatz (A2–B1)',
    shortLabel: '🇬🇧 Englisch · Aufbauwortschatz',
    voice: 'en-US',
    contentVersion: 1,
    loader: () =>
      import('../data/vocabulary/en-a2b1-v1').then((m) => ({
        vocabulary: m.VOCABULARY_EN_A2B1,
      })),
  },
  'en-klett-v1': {
    id: 'en-klett-v1',
    language: 'en',
    displayName: 'Englisch – Grundwortschatz (Klett)',
    shortLabel: '🇬🇧 Englisch · Klett Grundwortschatz',
    voice: 'en-US',
    contentVersion: 1,
    loader: () =>
      import('../data/vocabulary/en-klett-v1').then((m) => ({
        vocabulary: m.enKlettV1,
      })),
    examplesLoader: () =>
      import('../data/examples/en-klett-v1').then((m) => ({
        examples: m.EXAMPLES_EN_KLETT,
      })),
  },
  'es-basic-v1': {
    id: 'es-basic-v1',
    language: 'es',
    displayName: 'Spanisch – Grundwortschatz',
    shortLabel: '🇪🇸 Spanisch · Grundwortschatz',
    voice: 'es-ES',
    contentVersion: 1,
    loader: () =>
      import('../data/vocabulary/es-basic-v1').then((m) => ({
        vocabulary: m.VOCABULARY_ES_BASIC,
      })),
  },
  'tr-basic-v1': {
    id: 'tr-basic-v1',
    language: 'tr',
    displayName: 'Türkisch – Grundwortschatz',
    shortLabel: '🇹🇷 Türkisch · Grundwortschatz',
    voice: 'tr-TR',
    contentVersion: 1,
    loader: () =>
      import('../data/vocabulary/tr-basic-v1').then((m) => ({
        vocabulary: m.VOCABULARY_TR_BASIC,
      })),
  },
  'fr-basic-v1': {
    id: 'fr-basic-v1',
    language: 'fr',
    displayName: 'Französisch – Grundwortschatz',
    shortLabel: '🇫🇷 Französisch · Grundwortschatz',
    voice: 'fr-FR',
    contentVersion: 1,
    loader: () =>
      import('../data/vocabulary/fr-basic-v1').then((m) => ({
        vocabulary: m.VOCABULARY_FR_BASIC,
      })),
  },
};

export const ALL_FILE_IDS: ReadonlyArray<FileId> = Object.keys(FILE_CONFIG) as FileId[];

export const FALLBACK_FILE_ID: FileId = 'en-basic-v1';

export function getFile(id: FileId | null | undefined): FileManifestEntry | null {
  if (!id) return null;
  return FILE_CONFIG[id] ?? null;
}

export function fileExists(id: FileId | null | undefined): boolean {
  return !!getFile(id);
}

export function hasExamples(id: FileId | null | undefined): boolean {
  return !!getFile(id)?.examplesLoader;
}

export function listFiles(): FileManifestEntry[] {
  return ALL_FILE_IDS.map((id) => FILE_CONFIG[id]);
}

export function groupFilesByLanguage(): Array<{ language: Language; files: FileManifestEntry[] }> {
  const groups = new Map<Language, FileManifestEntry[]>();
  for (const f of listFiles()) {
    const arr = groups.get(f.language) ?? [];
    arr.push(f);
    groups.set(f.language, arr);
  }
  return Array.from(groups.entries()).map(([language, files]) => ({ language, files }));
}

export const LANGUAGE_LABELS: Record<Language, string> = {
  en: 'Englisch',
  es: 'Spanisch',
  tr: 'Türkisch',
  fr: 'Französisch',
};

/** Mapping v1.2-selectedLanguage → v1.3-FileId (nur für Migration). */
export const LEGACY_LANGUAGE_TO_FILE: Record<string, FileId> = {
  english: 'en-basic-v1',
  spanish: 'es-basic-v1',
};
