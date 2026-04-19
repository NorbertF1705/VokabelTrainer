export type Language = 'english' | 'spanish';

export const LANGUAGE_CONFIG = {
  english: { label: 'Englisch', flag: '🇬🇧', abbr: 'EN', speechCode: 'en-US', placeholder: 'English word' },
  spanish: { label: 'Spanisch', flag: '🇪🇸', abbr: 'ES', speechCode: 'es-ES', placeholder: 'Palabra en español' },
} as const satisfies Record<Language, { label: string; flag: string; abbr: string; speechCode: string; placeholder: string }>;

export const ALL_LANGUAGES = Object.keys(LANGUAGE_CONFIG) as Language[];
