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
};

/** Mapping v1.2-selectedLanguage → v1.3-FileId (nur für Migration). */
export const LEGACY_LANGUAGE_TO_FILE: Record<string, FileId> = {
  english: 'en-basic-v1',
  spanish: 'es-basic-v1',
};
