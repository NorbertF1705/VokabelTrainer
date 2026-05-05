NEUE SPRACHE HINZUFÜGEN — SCHRITT-FÜR-SCHRITT-ANLEITUNG
==========================================================

Beispiel: Französisch hinzufügen


SCHRITT 1 — Vokabeldatei erstellen
------------------------------------
Neue Datei: src/data/vocabulary_fr.ts

Inhalt: ein exportiertes Array VOCABULARY_FR mit Einträgen vom Typ VocabularyItem.
Jeder Eintrag hat folgende Felder:
  - id          (eindeutiger String, z.B. "fr_001")
  - german      (deutsches Wort)
  - translation (Übersetzung in der neuen Sprache)
  - category    (eine der Kategorien aus ALL_CATEGORIES in src/data/vocabulary.ts)
  - inflections (optional, z.B. Pluralform)
  - isCustom    (nicht setzen, wird automatisch auf false gesetzt)

Beispiel-Eintrag:
  { id: 'fr_001', german: 'Hund', translation: 'chien', category: 'Tiere' }


SCHRITT 2 — Vokabeldatei exportieren
--------------------------------------
Datei: src/data/vocabulary.ts

Zeile hinzufügen:
  export { VOCABULARY_FR } from './vocabulary_fr';


SCHRITT 3 — Sprache registrieren
----------------------------------
Datei: src/constants/languages.ts

a) Den Typ Language erweitern:
   export type Language = 'english' | 'spanish' | 'french';

b) Einen Eintrag in LANGUAGE_CONFIG hinzufügen:
   french: {
     label: 'Französisch',
     flag: '🇫🇷',
     abbr: 'FR',
     speechCode: 'fr-FR',
     placeholder: 'Mot en français'
   }

Hinweis: speechCode muss ein gültiger BCP-47-Sprachcode sein (für Web Speech API).


SCHRITT 4 — LearningContext anpassen
--------------------------------------
Datei: src/context/LearningContext.tsx

Drei Stellen müssen geändert werden:

a) Import oben ergänzen:
   import { VOCABULARY_EN, VOCABULARY_ES, VOCABULARY_FR, VocabularyItem } from '../data/vocabulary';

b) Im State-Interface LearningState ein neues Feld hinzufügen:
   customVocabularyFR: VocabularyItem[];

c) In der Funktion getVocabularyForLang den neuen Case ergänzen:
   case 'french': return [...VOCABULARY_FR, ...customVocabularyFR];

   Außerdem die Initialisierung und Persistenz von customVocabularyFR
   analog zu customVocabularyEN und customVocabularyES einbauen.


SCHRITT 5 — Fertig
--------------------
Alle Seiten (Home, Learn, Vocabulary, Statistics, Settings) verwenden
ALL_LANGUAGES aus constants/languages.ts und getVocabularyForLang aus
dem Context. Sie passen sich automatisch an die neue Sprache an —
kein weiterer Aufwand nötig.


HINWEIS
--------
Der aufwändigste Teil ist Schritt 1: das Erstellen der Vokabelliste.
Die restlichen Schritte sind reine Code-Anpassungen und dauern wenige Minuten.
