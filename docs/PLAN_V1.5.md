# VokabelTrainer – Entwicklungsplan V1.4.13 → V1.5 „Beispielsätze"

> Ziel: KI-generierte Beispielsätze zu bereits (mindestens einmal) abgefragten Vokabeln
> als **Cloze-Frage-Variante innerhalb des bestehenden Eingabe-Modus** einstreuen —
> **kein** eigenständiger „Satzmodus" mit eigenem Kandidaten-Pool. Beispielsätze werden
> als **separate, lazy geladene Datendateien** pro Vokabelpaket gepflegt — analog zum
> bestehenden Lazy-Loading-Pattern der Vokabeldateien selbst. Kein Server, keine neue
> Storage-Schema-Version nötig: Fortschritt bleibt vollständig im bestehenden
> 6-Fächer-System pro Vokabel-`id` verankert.

**Strategiewechsel gegenüber der ersten Fassung dieses Plans:** Ein eigenständiger
Satzmodus mit Filterung auf „Fach ≥ 2" hat dasselbe Pool-Problem wie der bestehende
Quiz-Modus (dort mit `QUIZ_MIN_POOL` + Fach-1-Beförderung notdürftig gelöst) — bei
frischem Paket oder wenig aktiven Karten wäre die Kachel leer oder fast leer. Statt
eines eigenen Pools wird die Satzfrage **pro Karte innerhalb einer ohnehin schon
nicht-leeren Session** (Eingabe-Modus) eingeblendet: Der Pool ist immer der bestehende
`due`/`new`-Pool, Satzfragen sind eine Beimischung, kein Alles-oder-Nichts-Screen.

Vorgelagerte Abschätzung (Kosten, Volumen): einmalige KI-Generierungskosten im
niedrigen einstelligen Euro-Bereich (Claude Haiku 4.5 + Batch-API), Zusatzvolumen
pro Paket ca. 150–190 Bytes/Beispielsatz, nur beim Start einer Eingabe-Modus-Session
mit aktivierten Satzkarten nachgeladen.

---

## Status-Legende
- `[ ]` offen
- `[x]` erledigt
- `[~]` in Arbeit

---

## Block A – Datenmodell & Typen

Betrifft: `src/data/vocabulary_types.ts`, `src/config/default_settings.ts`,
`src/migrations/v12_to_v13.ts` (Fix, siehe A3)

- [x] **A1** – Neuen Typ `ExampleSentence` anlegen

  ```diff
  --- a/src/data/vocabulary_types.ts
  +++ b/src/data/vocabulary_types.ts
  @@
   export interface VocabularyItem {
     id: string;
     german: string;
     translation: string;
     emoji: string;
     category: Category;
     inflections?: string;
     isCustom?: boolean;
   }
  +
  +/** Ein KI-generierter Beispielsatz zu einer Vokabel (v1.5). */
  +export interface ExampleSentence {
  +  id: string;           // z. B. "g2001-1" (vocabId + laufende Nummer)
  +  vocabId: string;      // FK -> VocabularyItem.id
  +  target: string;       // Satz in der Zielsprache
  +  native: string;       // deutsche Übersetzung des Satzes
  +  answer: string;       // exakte Form der Vokabel in `target` (Cloze-Maskierung + Abgleich)
  +  nativeAnswer: string; // exakte Form der Vokabel in `native` (nur fürs Hervorheben, kein Abgleich)
  +}
  ```

  _Warum eigene `answer`/`nativeAnswer`-Felder statt Ableitung aus `translation`/`german`:_
  Die im Satz verwendete Form weicht oft von der Grundform ab ("to accept" → "accepted",
  "annehmen" → "nimmt … an"). Separat gespeicherte exakte Wortformen machen Maskierung,
  Tipp-Abgleich **und** die optische Hervorhebung im deutschen Hilfssatz exakt, ohne
  fragile Regex-/Stamm-Heuristik auf `target`/`native`.

- [x] **A2** – `FileManifestEntry` um optionalen `examplesLoader` erweitern

  ```diff
   export interface FileManifestEntry {
     id: FileId;
     language: Language;
     displayName: string;
     shortLabel: string;
     voice: string;
     contentVersion: number;
     loader: () => Promise<{ vocabulary: VocabularyItem[] }>;
  +  /** Fehlt dieses Feld, bietet das Paket keinen Satzmodus an (z. B. es/tr-basic anfangs). */
  +  examplesLoader?: () => Promise<{ examples: ExampleSentence[] }>;
   }
  ```

- [x] **A3** – `AppSettings` um Opt-out-Schalter erweitern (Betrifft zusätzlich
  `src/config/default_settings.ts`) — da Satzkarten den gewohnten Eingabe-Modus
  verändern, bekommt der Nutzer eine Einstellung, um sie ganz abzuschalten:

  ```diff
   export interface AppSettings {
     queryDirection: QueryDirection;
     quizAutoSpeak: boolean;
     flashcardAutoSpeak: boolean;
     typingTolerant: boolean;
  +  includeSentences: boolean;   // Satzkarten im Eingabe-Modus einstreuen (v1.5)
   }
  ```

  ```diff
   export const DEFAULT_SETTINGS: AppSettings = {
     queryDirection: 'de-to-foreign',
     quizAutoSpeak: false,
     flashcardAutoSpeak: false,
     typingTolerant: false,
  +  includeSentences: true,
   };
  ```

**Akzeptanzkriterium:** ✓ `npx tsc -b` läuft fehlerfrei durch. Eine bislang nicht im
Plan erfasste Stelle in `v12_to_v13.ts`, die `AppSettings` direkt als Objektliteral
statt per Spread von `DEFAULT_SETTINGS` konstruiert, musste dafür ebenfalls um
`includeSentences` ergänzt werden. Der Settings-Toggle selbst (`Settings.tsx`) folgt
erst in Block E6 — hier nur das Typsystem.

---

## Block B – Beispieldaten: Ablage & Konfiguration

Betrifft: `src/data/examples/`, `src/config/file_config.ts`

- [x] **B1** – Verzeichnis `src/data/examples/` anlegen, ein File pro Vokabelpaket,
  analog zu `src/data/vocabulary/`:

  ```ts
  // src/data/examples/en-grund2-v1.ts
  import type { ExampleSentence } from '../vocabulary_types';

  export const EXAMPLES_EN_GRUND2: ExampleSentence[] = [
    {
      id: 'g2001-1',
      vocabId: 'g2001',
      target: 'She will accept the invitation tomorrow.',
      native: 'Sie wird die Einladung morgen annehmen.',
      answer: 'accept',
      nativeAnswer: 'annehmen',
    },
    // ...
  ];
  ```

- [x] **B2** – `FILE_CONFIG` in `file_config.ts` um `examplesLoader` je Paket ergänzen
  (nur für Pakete, für die bereits Beispiele existieren — siehe Rollout-Phasen):

  ```diff
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
  +  examplesLoader: () =>
  +    import('../data/examples/en-grund2-v1').then((m) => ({
  +      examples: m.EXAMPLES_EN_GRUND2,
  +    })),
   },
  ```

- [x] **B3** – `file_config.ts` Hilfsfunktion `hasExamples(id: FileId): boolean` ergänzen
  (`!!getFile(id)?.examplesLoader`) — steuert, ob im Eingabe-Modus überhaupt versucht
  wird, Beispielsätze für das aktive Paket zu laden.

**Akzeptanzkriterium:** ✓ `npm run build` erzeugt für `en-grund2-v1` einen eigenen
zusätzlichen Chunk (`en-grund2-v1-B3jaWCic.js`, 0,04 kB — noch leeres
Platzhalter-Array), getrennt vom 49-kB-Vokabel-Chunk desselben Pakets; landet nicht
im initialen Bundle. Kleine kosmetische Notiz: Vite vergibt beiden Chunks denselben
Basisnamen `en-grund2-v1-*` mit unterschiedlichem Hash — funktional kein Problem
(eindeutige Dateien), aber in `dist/assets/` auf den ersten Blick nicht sofort
unterscheidbar. Bei Bedarf später über `build.rollupOptions.output.chunkFileNames`
lösbar, für jetzt nicht relevant.

---

## Block C – Beispielsatz-Beschaffung: zwei Quellen

Betrifft: `scripts/generate-examples.ts` (neu), `package.json`,
`src/data/examples/en-klett-v1.ts` (interaktiv, nicht per Skript)

`en-klett-v1` hat eine eigene, bessere Quelle als KI-Generierung: Die Vokabelliste
wurde 2026-08 aus fotografierten Seiten des Klett-Grundwortschatz-Buchs transkribiert
(siehe Commits `83fa38d`…`e264417`) — die Fotos liegen z. T. noch vor und zeigen
laut Rückmeldung auch Beispielsätze, die beim ersten Erfassen nicht mit übernommen
wurden. Für dieses Paket daher **Extraktion statt Generierung** (Block C-II); für
alle anderen Pakete bleibt es bei KI-Generierung (Block C-I), jetzt mit
automatisierter statt manueller Qualitätsprüfung.

### C-I. KI-Generierung (für `en-basic-v1`, `en-a2b1-v1`, `en-grund2-v1`, `es-basic-v1`, `tr-basic-v1`)

- [ ] **C1** – Node-Skript `scripts/generate-examples.ts`:
  1. Liest die Vokabelliste eines Pakets ein (z. B. `VOCABULARY_EN_GRUND2`)
  2. Batcht in Gruppen von ~25 Wörtern pro Request (Kosten-/Overhead-Amortisierung)
  3. Ruft Claude (Haiku 4.5, Batch API) mit `output_config.format` / strict Tool-Schema
     auf, das `ExampleSentence[]` (ohne `id`) erzwingt — Modell liefert `target`,
     `native`, `answer`, `nativeAnswer` je Wort; Anzahl Sätze/Wort als Parameter
     (Default: 1). Zielsprache wird aus `FileManifestEntry.language` des jeweiligen
     Pakets abgeleitet (`en`/`es`/`tr`) und geht in den Prompt — das Skript ist
     sprachagnostisch, nicht auf Englisch zugeschnitten. Prompt verlangt explizit,
     dass `answer` **wortwörtlich** als Teilstring in `target` und `nativeAnswer`
     **wortwörtlich** als Teilstring in `native` vorkommt (Voraussetzung für Block C3)
  4. Vergibt IDs (`{vocabId}-{n}`), schreibt Ergebnis nach `src/data/examples/<fileId>.ts`
  5. **Automatisierte Qualitätsprüfung statt manueller Stichprobe:** ruft pro Satz
     einen zweiten, unabhängigen Claude-Prompt auf ("Ist dieser Satz grammatikalisch
     korrekt, natürlich formuliert und bedeutungstreu zur Vokabel? ja/nein +
     Begründung"). Bei „nein" wird der Satz **einmal automatisch neu generiert**;
     bleibt das Ergebnis auch dann negativ, wird der Eintrag mit
     `// FLAGGED: <Begründung>` kommentiert statt stillschweigend übernommen — keine
     Kaufmannspause auf einen Menschen, aber offensichtliche Ausreißer landen nicht
     unbemerkt in der App. Kostenmäßig verdoppelt das die Generierungskosten
     etwa — bleibt bei den bereits ermittelten Beträgen weiterhin im Cent- bis
     niedrigen Euro-Bereich.

- [ ] **C2** – `package.json`-Script `"generate:examples": "tsx scripts/generate-examples.ts"`

- [ ] **C3** – Lint-Check (Teil von `npm run build` oder separates Script), gilt für
  **beide** Quellen (C-I **und** C-II):
  - jedes `ExampleSentence.vocabId` muss in der zugehörigen `VocabularyItem[]`-Liste
    existieren → verhindert stille Verwaisung bei späteren Vokabellisten-Änderungen
    (kein automatisches Reconciling wie bei `contentVersion`, da Beispiele bewusst
    außerhalb des Progress-Schemas liegen)
  - `target.includes(answer)` und `native.includes(nativeAnswer)` müssen beide gelten
    (case-sensitive Teilstring-Prüfung) → ohne diese Garantie können weder Maskierung
    noch Hervorhebung (Block E1) funktionieren; Verstöße blockieren den Build statt
    erst zur Laufzeit als kaputte Anzeige aufzufallen
  - kein `// FLAGGED:`-Kommentar darf im Build-Output verbleiben (nur relevant für
    C-I-Ausgaben)

**Akzeptanzkriterium (C-I):** Ein Lauf von `npm run generate:examples -- en-grund2-v1`
erzeugt eine valide, kompilierende `src/data/examples/en-grund2-v1.ts`; der
Lint-Check schlägt bei verwaisten `vocabId`s, bei `answer`/`nativeAnswer`, die nicht
wortwörtlich in `target`/`native` vorkommen, und bei verbliebenen `FLAGGED`-Einträgen
fehl.

### C-II. Extraktion aus Quellenfotos (nur `en-klett-v1`)

Kein Skript — dieselbe Art interaktiver Sitzung, in der auch die Vokabelliste selbst
seitenweise erfasst wurde (Fotos im Chat, Transkription direkt in die TS-Datei).

- [x] **C4** – Fotos der Buchseiten (S. 13–116, dieselben wie bei der
  Wort-Erfassung) erneut bereitstellen; pro Seite prüfen, ob dort Beispielsätze
  zur jeweiligen Vokabel abgebildet sind
  — Statt Chat-Relay (Gemini) direkt per Filesystem-Zugriff: 10 parallele
  Hintergrund-Agenten haben alle 53 JPGs (S. 13–116) gelesen und transkribiert
  (4.128 Einträge, JSONL, `kind: headword|phrase` + `parent`-Zuordnung).

- [x] **C5** – Wo vorhanden: Satz + (falls im Buch abgedruckt) deutsche Übersetzung
  transkribieren, sonst deutsche Übersetzung selbst ergänzen; `vocabId` durch Abgleich
  des Stichworts gegen die bestehende `VOCABULARY_EN_KLETT`-Liste zuordnen (`kl001`
  … `kl2056`); Ergebnis nach `src/data/examples/en-klett-v1.ts` im selben
  `ExampleSentence`-Format wie C-I
  — 2.039/2.047 Stichwörter automatisch gematcht (99,6 %); von 2.081
  Unterphrasen wurden nur die ~537 mit echter Satzstruktur (Subjekt+Verb/
  Satzzeichen) weiterverarbeitet, reine Kollokationen ohne Kontext (~1.544)
  verworfen (Nutzerentscheidung). 5 parallele Agenten haben je Satzpaar die
  exakte Wortform (`answer`/`nativeAnswer`) für Maskierung/Hervorhebung
  bestimmt; alle Substrings wurden zusätzlich unabhängig per Python
  verifiziert (`answer in target`, `nativeAnswer in native`). Ergebnis:
  **476 Beispielsätze** für **351 von 2056** Vokabeln in
  `src/data/examples/en-klett-v1.ts`, `examplesLoader` in `file_config.ts`
  verdrahtet. Manuell im Eingabe-Modus verifiziert (Cloze-Maskierung,
  Hervorhebung, Abgleich).

- [x] **C6** – Für Vokabeln **ohne** Beispielsatz im Buch: zunächst **weglassen**,
  nicht durch KI-Generierung auffüllen. `getExampleFor()` liefert für diese Vokabeln
  einfach `null` (Design aus Block D3 trägt das bereits) — vermeidet eine unmarkierte
  Vermischung von „aus dem Lehrbuch" und „KI-erfunden" innerhalb desselben Pakets.
  Bei Bedarf später als eigener, gekennzeichneter Nachtrag möglich.
  — 8 im Buch gefundene, aber in `VOCABULARY_EN_KLETT` fehlende Stichwörter
  (`accidentally`, `accordingly`, `must`, `my`, `shall`, `spite`, `striking`,
  `waiter`) auf Nutzerwunsch übersprungen, nicht als neue Vokabeln ergänzt.

**Akzeptanzkriterium (C-II):** `src/data/examples/en-klett-v1.ts` enthält nur Sätze,
die nachweislich aus den Buchfotos stammen; besteht denselben C3-Lint-Check wie
KI-generierte Pakete; keine stillschweigend erfundenen Lücken-Füller. ✅ erfüllt.

---

## Block D – LearningContext-Erweiterung

Betrifft: `src/context/LearningContext.tsx`

- [x] **D1** – Neuer State `examplesByFile: Record<FileId, ExampleSentence[]>`
  (parallel zu `vocabularyByFile`, aber **nicht** beim Bootstrap eager geladen)

- [x] **D2** – Neue Methode `ensureExamplesLoaded(fileId: FileId): Promise<boolean>`
  (unverändert zur ersten Fassung)

  ```ts
  const ensureExamplesLoaded = useCallback(async (fileId: FileId): Promise<boolean> => {
    if (examplesByFileRef.current[fileId]) return true;
    const manifest = getFile(fileId);
    if (!manifest?.examplesLoader) return false;
    const { examples } = await manifest.examplesLoader();
    setExamplesByFile((prev) => ({ ...prev, [fileId]: examples }));
    return true;
  }, []);
  ```

  **Geänderter Aufrufpunkt:** nicht mehr beim Öffnen eines eigenen Satzmodus, sondern
  beim Start **jeder Eingabe-Modus-Session**, wenn `settings.includeSentences` aktiv
  ist und `hasExamples(activeFileId)` `true` liefert. Schlägt das Laden fehl oder gibt
  es keine Beispiele, läuft die Session einfach ganz normal ohne Satzkarten weiter —
  kein Fehlerzustand, keine leere Session möglich.

- [x] **D3** – Neue Methode `getExampleFor(vocabId)` **statt** eines eigenen
  Kandidaten-Pools — reine Einzelkarten-Lookup-Funktion, die pro bereits im
  `due`/`new`-Pool befindlicher Karte entscheidet, ob eine Satzvariante infrage kommt:

  ```ts
  // Schwelle gelockert: nicht mehr "Fach >= 2", sondern "schon einmal abgefragt"
  // (dasselbe Kriterium, das getNewCards() für "nicht mehr neu" verwendet) — das
  // allein vergrößert den Pool an sich schon deutlich, bevor die strukturelle
  // Frage (eigener Modus vs. Beimischung) überhaupt greift.
  const getExampleFor = useCallback((vocabId: string): ExampleSentence | null => {
    if (!activeFileId || !settings.includeSentences) return null;
    const state = fileStates[activeFileId];
    const examples = examplesByFile[activeFileId];
    if (!state || !examples) return null;

    const progress = state.progress[vocabId];
    if (!progress || progress.lastReviewed === null) return null; // noch nie geübt

    const candidates = examples.filter((ex) => ex.vocabId === vocabId);
    if (candidates.length === 0) return null;
    return candidates[Math.floor(Math.random() * candidates.length)];
  }, [activeFileId, fileStates, examplesByFile, settings.includeSentences]);
  ```

  Kein `shuffleArr`, kein Pool-Aufbau, keine Mindestgröße zu prüfen — die Funktion
  liefert einfach `null`, wenn (noch) keine Satzvariante möglich ist, und der
  aufrufende Code in `Learn.tsx` fällt dann auf die normale Wortkarte zurück.

- [x] **D4** – `ensureExamplesLoaded`, `getExampleFor` und `examplesByFile` in
  `LearningContextValue` und den `useMemo`-Value/Dependency-Array aufnehmen.

**Akzeptanzkriterium:** ✓ `npx tsc -b` fehlerfrei. Im Browser mit injiziertem
IndexedDB-Testfortschritt verifiziert: `getExampleFor()` liefert einen passenden Satz
für eine bereits geübte, fällige Karte und `null` für alle anderen Fälle (siehe
Block-E-Verifikation unten für den vollständigen End-to-End-Nachweis).

---

## Block E – Neue Komponente & Integration in den Eingabe-Modus

Betrifft: `src/components/SentenceCard.tsx` (neu), `src/pages/Learn.tsx`,
`src/pages/Settings.tsx`

- [x] **E1** – `src/components/SentenceCard.tsx` anlegen — reine Anzeige-Komponente
  (kein eigener Screen mehr, kein Exit-Button, keine Fortschrittsleiste — die liefert
  weiterhin die umgebende Eingabe-Modus-Ansicht): zeigt `example.target` mit
  maskierter Vokabel (`___`), darunter `example.native` als Hilfestellung — darin wird
  `nativeAnswer` **optisch hervorgehoben** (z. B. fett + Akzentfarbe), damit sofort
  erkennbar ist, welches deutsche Wort dem gesuchten Zielwort entspricht. Die
  Auswertung bleibt vollständig in `Learn.tsx` (`evaluateTypedAnswer()`).

  Maskierung und Hervorhebung teilen sich dieselbe kleine Hilfsfunktion (neu:
  `src/utils/sentenceHighlight.ts`), die einen Satz an einer gegebenen Teilphrase in
  `{ before, match, after }` zerlegt:

  ```ts
  // src/utils/sentenceHighlight.ts
  export function splitAt(sentence: string, phrase: string): { before: string; match: string; after: string } | null {
    const idx = sentence.indexOf(phrase);
    if (idx === -1) return null; // sollte durch Block-C3-Lint nie vorkommen
    return { before: sentence.slice(0, idx), match: sentence.slice(idx, idx + phrase.length), after: sentence.slice(idx + phrase.length) };
  }
  ```

  In `SentenceCard.tsx`: `splitAt(target, answer)` → `match` wird durch das
  Eingabefeld/eine Blank-Markierung ersetzt; `splitAt(native, nativeAnswer)` →
  `match` wird in ein hervorgehobenes `<span>`/`<mark>` gewrapped. Liefert `splitAt`
  `null` (Datenqualitätsproblem trotz Lint, z. B. bei nachträglich von Hand editierten
  Beispieldateien), wird der Satz unverändert ohne Maskierung/Hervorhebung gezeigt —
  Anzeige bleibt intakt, nur ohne den optischen Zusatznutzen.

- [x] **E2** – `Learn.tsx`: **kein** neuer `SessionMode`-Wert — `type SessionMode`
  bleibt `'due' | 'all' | 'quiz' | 'type'` unverändert.

- [x] **E3** – Beim Start einer `'type'`-Session (`startSession('type')`):
  `ensureExamplesLoaded(activeFile.manifest.id)` anstoßen (fire-and-forget, kein
  Blocker für den Session-Start — Karten ohne bereits geladene Beispiele zeigen
  einfach die Wortkarte, bis der Ladevorgang durch ist).

- [x] **E4** – Pro aktueller Karte im `'type'`-Branch: `getExampleFor(currentCard.id)`
  abfragen. Ist das Ergebnis nicht `null`, `SentenceCard` statt des bisherigen
  Wort-Prompts rendern; Eingabefeld, Tastatur-Shortcuts bleiben unverändert.

  **Tatsächliche Umsetzung weicht leicht vom ursprünglichen Diff-Entwurf ab:** Die
  Variable `correctAnswer` (ohne Suffix) wird bereits im Quiz-Modus-Branch verwendet
  und darf dort nicht durch die Satzvariante beeinflusst werden. Stattdessen wurde
  ausschließlich innerhalb des `'type'`-Branchs eine lokale `currentExample` +
  `effectiveCorrectAnswer` ergänzt, und `handleTypeSubmit()` (component-weit, vor den
  Branches definiert) ruft `getExampleFor()` direkt auf:

  ```diff
   const handleTypeSubmit = () => {
     if (!currentCard || typeResult !== null || typedAnswer.trim() === '') return;
  -  const correct = currentCard[answerField] as string;
  +  const example = getExampleFor(currentCard.id);
  +  const correct = example ? example.answer : (currentCard[answerField] as string);
     setTypeResult(evaluateTypedAnswer(typedAnswer, correct, typingTolerant));
   };
   ...
   if (sessionMode === 'type') {
     const correctAnswer2 = currentCard ? (currentCard[answerField] as string) : '';
  +  const currentExample = currentCard ? getExampleFor(currentCard.id) : null;
  +  const effectiveCorrectAnswer = currentExample ? currentExample.answer : correctAnswer2;
     ...
     {/* Frage */}
  -  <div>{frontText}</div>
  +  {currentExample
  +    ? <SentenceCard example={currentExample} langLabel={langLabel} />
  +    : <div>{frontText}</div>}
     ...
  -  Richtig: <strong>{correctAnswer2}</strong>
  +  Richtig: <strong>{effectiveCorrectAnswer}</strong>
  ```

  _Hinweis zur Abfragerichtung:_ Die Satzvariante ist bewusst **richtungsunabhängig**
  — unabhängig von `settings.queryDirection` wird immer der zielsprachige Satz mit
  maskiertem zielsprachigem Wort gezeigt (deutscher Satz nur als Hilfestellung). Ein
  Cloze mit maskiertem deutschem Wort im deutschen Satz wäre ein eigenes Feature und
  ist hier bewusst nicht im Scope.

- [x] **E5** – `markCard(currentCard.id, correct)` bleibt unverändert — eine richtig
  beantwortete Satzkarte zählt wie eine richtige Wortkarte für dieselbe `vocabId` und
  bewegt sie im bestehenden 6-Fächer-System weiter. Keine separate Progress-Struktur.

- [x] **E6** – `Settings.tsx`: neuer Toggle „Beispielsätze einstreuen"
  (`settings.includeSentences`, via `updateSettings`) — unter der bestehenden
  „Eingabe-Modus"-Sektion, direkt unter `typingTolerant`.

**Akzeptanzkriterium:** ✓ Vollständig im Browser end-to-end verifiziert (Dev-Server,
Paket `en-grund2-v1`, ein temporärer Testeintrag + per IndexedDB injizierter
Lernstand, danach zurückgesetzt):
- Eingabe-Modus lief mit **leeren** Beispieldaten unverändert normal durch (Fallback
  auf Wortkarte, keine Konsolenfehler)
- Mit Testdaten erschien die Satzkarte korrekt maskiert und mit hervorgehobenem
  deutschen Wort ("She will **\_\_\_\_** hello to everyone." / "Sie wird jedem Hallo
  **sagen**.")
- Eingabe "say" wurde korrekt gegen `example.answer` geprüft ("✓ Richtig!")
- Settings-Toggle schaltet `includeSentences` sichtbar um, keine Konsolenfehler in
  allen getesteten Zuständen

---

## Block F – Versionierung, PWA-Cache, Dokumentation

- [x] **F1** – `src/version.ts`: `APP_VERSION = '1.5.0'`
- [x] **F2** – `package.json`: `"version": "1.5.0"`
- [x] **F3** – `vite.config.ts`: `cacheName: 'static-assets-v3'`
  _(neue Asset-Chunks — erzwingt SW-Cache-Invalidierung auf allen Clients)_
- [x] **F4** – `docs/RELEASE_NOTES.md`: v1.5.0-Eintrag
- [x] **F5** – `docs/Benutzerdokumentation.md` + `.html`: Satzfragen-Feature
  dokumentiert (Eingabe-Modus-Kapitel + Einstellungen-Tabelle + Changelog)
- [x] **F6** – `docs/Entwicklerdokumentation.html`: `ExampleSentence`,
  `examples/`-Verzeichnis, State-Tabelle, ausführlicher Changelog-Eintrag inkl.
  Strategiewechsel-Begründung dokumentiert

**Akzeptanzkriterium:** ✓ `npx tsc -b` und `npm run build` laufen fehlerfrei; alle
vier Doku-/Metadaten-Stellen zeigen v1.5.0 (per `grep` im Build-Output verifiziert,
da die Browser-Pane-Navigation zu dieser Route eine unabhängige Eigenart zeigte —
`curl` bestätigte 200 OK mit korrektem Inhalt). **Kein KI-generiertes Skript**
(`generate-examples.ts`) dokumentiert, da bewusst noch nicht existent — bleibt Teil
von Block C.

---

## Reihenfolge der Umsetzung

```
Block A (Typen)
  → Block B (Datenablage + Config)
  → Block C (Generierungs-Pipeline)   ─┐  kann parallel zu D/E entwickelt werden,
  → Block D (Context-Erweiterung)     ─┤  sobald Block A/B stehen (Pipeline braucht
  → Block E (UI: Integration Eingabe-Modus) ─┘  nur die Typen, nicht den fertigen Context)
  → Block F (Versionierung + Docs)
```

---

## Rollout-Phasen (Empfehlung)

Kriterium für die Reihenfolge bei den KI-generierten Paketen ist ausschließlich der
**Beschaffungsaufwand**, nicht die Sprache — Spanisch und Türkisch sind vollwertiger
Bestand (je 500 Wörter, eigene `FileManifestEntry` mit `voice: 'es-ES'`/`'tr-TR'`)
und werden entsprechend gleichrangig zu den englischen Basis-Paketen behandelt.
`en-klett-v1` läuft als eigener Track über Extraktion (C-II) und ist zeitlich
unabhängig von den anderen Phasen — kann parallel starten, sobald die Fotos wieder
vorliegen, ist aber inhaltlich aufwendiger (fotoweise Sichtung von S. 13–116) als ein
Skript-Lauf und läuft deswegen praktisch nach dem Pilot an, nicht davor.

| Phase | Umfang | Quelle | Zweck |
|---|---|---|---|
| **Pilot** | `en-grund2-v1` (500 Wörter), 1 Satz/Wort | KI-Generierung (C-I) | UX & Mechanik an **einem** Paket validieren, bevor in den Rest investiert wird — Sprache hier beliebig, Englisch nur weil es das aktuell meistgenutzte Paket ist |
| **Ausbau 1** | + `en-basic-v1`, `es-basic-v1`, `tr-basic-v1`, `en-a2b1-v1` (je 485–500 Wörter) | KI-Generierung (C-I) | Alle übrigen "kleinen" Pakete gleichzeitig, sprachunabhängig — gleicher Aufwand pro Paket |
| **Ausbau 2 (eigener Track)** | `en-klett-v1` (2056 Wörter) | Extraktion aus Buchfotos (C-II) | Größter Bestand, aber **kein** Generierungs- oder Prüfaufwand wie bei C-I — dafür fotoweise Sichtungsaufwand; startet sobald Fotos vorliegen, unabhängig vom Fortschritt der anderen Pakete |

---

## Geänderte Dateien – Übersicht

### Neu angelegt
| Datei | Beschreibung |
|---|---|
| `src/data/examples/<fileId>.ts` | Beispielsätze je Vokabelpaket — KI-generiert (C-I) für alle Pakete außer `en-klett-v1`, dort aus Buchfotos extrahiert (C-II) |
| `src/components/SentenceCard.tsx` | Reine Anzeige: maskierter Zielsatz + hervorgehobenes Wort im deutschen Hilfssatz (kein eigener Screen) |
| `src/utils/sentenceHighlight.ts` | `splitAt()` — zerlegt einen Satz an einer Teilphrase, für Maskierung und Hervorhebung gemeinsam genutzt |
| `scripts/generate-examples.ts` | Batch-Generierung via Claude API, schreibt `examples/`-Dateien |

### Geändert
| Datei | Wesentliche Änderung |
|---|---|
| `src/data/vocabulary_types.ts` | `ExampleSentence`-Typ, `examplesLoader?` auf `FileManifestEntry`, `includeSentences` auf `AppSettings` |
| `src/config/file_config.ts` | `examplesLoader` je Paket, `hasExamples()` Helfer |
| `src/config/default_settings.ts` | `includeSentences: true` in `DEFAULT_SETTINGS` |
| `src/context/LearningContext.tsx` | `examplesByFile`-State, `ensureExamplesLoaded()`, `getExampleFor()` (Einzelkarten-Lookup, kein Pool) |
| `src/pages/Learn.tsx` | `'type'`-Branch zeigt `SentenceCard` statt Wort-Prompt, wenn `getExampleFor()` einen Treffer liefert — kein neuer `SessionMode`, keine neue Lobby-Kachel |
| `src/pages/Settings.tsx` | Neuer Toggle „Beispielsätze im Eingabe-Modus einstreuen" |
| `src/version.ts`, `package.json` | `'1.5.0'` |
| `vite.config.ts` | `cacheName: 'static-assets-v3'` |

---

## Storage-Schema-Vergleich

| v1.4 | v1.5 |
|---|---|
| `CURRENT_SCHEMA_VERSION = '3'` | **unverändert** — keine Migration nötig |
| `FileState.progress[vocabId]` trägt Fach/SR-Daten | unverändert; Satzmodus liest/schreibt dieselben Einträge |
| Vokabeln eager geladen, ein Chunk/Paket | + Beispielsätze **lazy** geladen, ein zusätzlicher Chunk/Paket (nur bei erstem Satzmodus-Aufruf) |

Bewusste Design-Entscheidung: **keine** separate SR-Verfolgung pro Beispielsatz in
v1.5 (kein neues `sentenceProgress`-Feld). Ein Satz gilt als Vertreter seiner
Vokabel; Fortschritt bleibt 1:1 im bestehenden Fächer-System. Eine feinere
Verfolgung (pro Satz statt pro Vokabel) wäre ein späteres, eigenständiges
Schema-Upgrade (dann mit Migration analog `v12_to_v13.ts`) — hier bewusst
zurückgestellt, um v1.5 migrationsfrei zu halten.

---

## Definition of Done für V1.5 (Pilot-Phase)

- [ ] Alle Punkte in Block A–F sind `[x]` (Pilot-Scope: `en-grund2-v1`)
- [ ] `npm run build` läuft ohne TypeScript-Fehler durch
- [ ] Separater Lazy-Chunk für `en-grund2-v1`-Beispiele in `dist/`, nicht im initialen Bundle
- [ ] `npm run generate:examples -- en-grund2-v1` erzeugt valide, gelintete Beispieldatei
- [ ] Eingabe-Modus läuft für Pakete mit **und** ohne Beispieldaten identisch durch (nie leer)
- [ ] Satzkarten erscheinen ausschließlich für bereits mindestens einmal abgefragte Vokabeln
- [ ] Toggle „Beispielsätze einstreuen" in den Einstellungen schaltet die Beimischung ab
- [ ] Satzkarten nutzen bestehende Fächer-Logik ohne neues Storage-Schema
- [ ] Automatisierte Qualitätsprüfung (C1.5) durchgelaufen, keine offenen `FLAGGED`-Einträge
- [ ] Alle Docs auf v1.5.0 aktualisiert
