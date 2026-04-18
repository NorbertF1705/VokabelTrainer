export type Category =
  | 'Tiere'
  | 'Essen & Trinken'
  | 'Körper'
  | 'Kleidung'
  | 'Natur & Wetter'
  | 'Zuhause'
  | 'Transport'
  | 'Sport & Freizeit'
  | 'Berufe'
  | 'Technologie'
  | 'Orte'
  | 'Verben'
  | 'Diverses';

export interface VocabularyItem {
  id: string;
  german: string;
  translation: string;
  emoji: string;
  category: Category;
  inflections?: string;
  isCustom?: boolean;
}
