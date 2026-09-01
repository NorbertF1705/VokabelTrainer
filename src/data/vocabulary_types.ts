// ── v1.2: unverändert ────────────────────────────────────────────────────────

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
  | 'Diverses'
  | 'Adjektive & Eigenschaften'
  | 'Gefühle & Emotionen'
  | 'Abstrakte Begriffe & Gesellschaft';

export interface VocabularyItem {
  id: string;
  german: string;
  translation: string;
  emoji: string;
  category: Category;
  inflections?: string;
  isCustom?: boolean;
}

/** Ein Beispielsatz zu einer Vokabel (v1.5) — KI-generiert oder aus Quellmaterial extrahiert. */
export interface ExampleSentence {
  id: string;           // z. B. "g2001-1" (vocabId + laufende Nummer)
  vocabId: string;      // FK -> VocabularyItem.id
  target: string;       // Satz in der Zielsprache
  native: string;       // deutsche Übersetzung des Satzes
  answer: string;       // exakte Form der Vokabel in `target` (Cloze-Maskierung + Abgleich)
  nativeAnswer: string; // exakte Form der Vokabel in `native` (nur fürs Hervorheben, kein Abgleich)
}

export interface CardProgress {
  box: number;
  lastReviewed: string | null;
  nextDate: string | null;
  correctCount: number;
  incorrectCount: number;
}

// ── v1.3: neu ────────────────────────────────────────────────────────────────

/** Sprachcode in BCP-47-Kurzform. */
export type Language = 'en' | 'es' | 'tr' | 'fr';

/** Identifier einer Vokabeldatei, z. B. "en-basic-v1". Stabil über Updates. */
export type FileId = string;

export type QueryDirection = 'de-to-foreign' | 'foreign-to-de' | 'random';

/** Globale App-Einstellungen — unabhängig von der aktiven Vokabeldatei. */
export interface AppSettings {
  queryDirection: QueryDirection;
  quizAutoSpeak: boolean;
  flashcardAutoSpeak: boolean;
  typingTolerant: boolean;
  includeSentences: boolean; // Satzkarten im Eingabe-Modus einstreuen (v1.5)
}

export interface DailyStats {
  date: string; // YYYY-MM-DD; "" = noch nie gelernt
  count: number;
}

/** Vollständiger Lernzustand einer einzelnen Vokabeldatei. */
export interface FileState {
  fileId: FileId;
  schemaVersion: 3;
  contentVersion: number;
  progress: Record<string, CardProgress>;
  customVocabulary: VocabularyItem[];
  dailyStats: DailyStats;
  dailyNewStats: DailyStats;
  trainingLog: string[]; // YYYY-MM-DD-Daten der Lerntage
  lastOpenedAt: string | null;
  dailyCardLimit: number;    // fällige Karten pro Tag (0 = unbegrenzt)
  dailyNewCardLimit: number; // neue Karten pro Tag (-1 = unbegrenzt, 0 = keine)
}

/** Metadaten einer Vokabeldatei (statisch, in file_config.ts definiert). */
export interface FileManifestEntry {
  id: FileId;
  language: Language;
  displayName: string;
  shortLabel: string;
  voice: string; // BCP-47 für Web Speech API
  contentVersion: number;
  loader: () => Promise<{ vocabulary: VocabularyItem[] }>;
  /** Fehlt dieses Feld, bietet das Paket (noch) keine Satzkarten an. */
  examplesLoader?: () => Promise<{ examples: ExampleSentence[] }>;
}
