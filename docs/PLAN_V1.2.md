# VokabelTrainer – Entwicklungsplan V1.0.1 → V1.2

> Ziel: V1-Design exakt erhalten, saubere interne Verbesserungen übernehmen,
> fehlende Features sauber draufbauen – sodass danach der V2-Branch gelöscht werden kann.

---

## Status-Legende
- `[ ]` offen
- `[x]` erledigt
- `[~]` in Arbeit

---

## Block A – Design-Restore (V1-Optik wiederherstellen)

Betrifft: `src/pages/Home.tsx`

- [x] **A1** – "✕ Beenden"-Button entfernen  
  _(wurde in V2 in den Header-Bereich eingebaut, war nie geplant)_

- [x] **A2** – Header-Layout auf V1 zurücksetzen  
  _(padding: `32px 24px 28px`, zentrierte Spalte mit großem 🎓, kein äußerer Wrapper-div)_

- [x] **A3** – Neuen "Karten fällig heute"-Abschnitt mit per-Language-Buttons entfernen  
  _(wurde in V2 eingebaut; der bestehende "Due Today Banner" aus V1 bleibt, er zeigt die Gesamtzahl)_

**Akzeptanzkriterium:** Home sieht visuell identisch zu V1.0.1 aus. ✓

---

## Block B – Interne Verbesserungen übernehmen (kein Design-Impact)

Diese Änderungen aus V2 sind gut und bleiben **unverändert**.

- [x] **B1** – Vocabulary-Split: `vocabulary_en.ts` / `vocabulary_es.ts` + `vocabulary_types.ts`
- [x] **B2** – `LANGUAGE_CONFIG` / `ALL_LANGUAGES` Konstanten in `src/constants/languages.ts`
- [x] **B3** – Per-Language-Persistenz in `LearningContext` (unabhängige Fortschrittsprofile)
- [x] **B4** – `recordTrainingDay` für Konsistenz-Tracking
- [x] **B5** – `effectiveDirection` in Learn.tsx (Random-Modus sauber gelöst)
- [x] **B6** – `translation`-Feld statt sprachspezifischer `english`/`spanish`-Keys in VocabularyItem
- [x] **B7** – Quiz-Verbesserung: kein Auto-Advance, Enter/Space zum Weiterschalten
- [x] **B8** – `quizAutoSpeak` + `flashcardAutoSpeak` Einstellungen + UI in Settings
- [x] **B9** – `SWStatusPanel` Debug-Komponente in Settings
- [x] **B10** – Zufällig-Richtung (`random`) als dritte Abfrage-Option

---

## Block C – Neues Feature: Tipptolerant

Betrifft: `src/context/LearningContext.tsx`, `src/pages/Settings.tsx`, `src/pages/Learn.tsx`

- [x] **C1** – State + Persistenz: `typingTolerant: boolean` in LearningContext hinzufügen  
  _(Default: `false`, wird in IndexedDB gespeichert)_

- [x] **C2** – Settings-UI: Toggle "Tipptolerant" in Einstellungen  
  _(Neue Sektion "Eingabe-Modus" mit Toggle und Beschreibung)_

- [x] **C3** – Auswertungslogik in Learn.tsx: Eingabe-Antwort mit Levenshtein-Distanz prüfen  
  _(Toleranz: 1 Zeichen bei Wörtern ≤ 5 Buchstaben, 2 Zeichen bei längeren Wörtern;  
  Groß/Kleinschreibung immer ignorieren)_

- [x] **C4** – Visuelles Feedback: Wenn Tipptolerant zutrifft, Antwort als "fast richtig" markieren  
  _(Gelb/orange + "Richtig: …"-Anzeige der korrekten Schreibweise; grün = exakt, rot = falsch)_

**Hinweis:** Tipptolerant greift nur im Freitext-Eingabemodus (neuer SessionMode `'type'`), nicht im Quiz-Modus.

---

## Block D – Neues Feature: Einführung neuer Karten in den gestuften Lernablauf

Betrifft: `src/context/LearningContext.tsx`, `src/pages/Learn.tsx`, `src/pages/Home.tsx`

### Konzept
Im klassischen Lernkartei-System werden neue (noch nie gesehene) Karten **kontrolliert eingeführt**.  
Aktuell landen alle Fach-1-Karten ohne Datum undifferenziert in der "Fällig"-Schlange.  
Ziel: Pro Session wird eine konfigurierbare Anzahl **neuer Karten** (box=1, kein `lastReviewed`)  
gezielt in die fälligen Karten gemischt.

### Umsetzung

- [x] **D1** – `getNewCards(lang)` Funktion in LearningContext  
  _(Gibt Karten zurück mit `lastReviewed === null`, respektiert tägliches Limit)_

- [x] **D2** – `dailyNewCardLimit` + `dailyNewStats` State in LearningContext (Default: 5)  
  _(Unabhängig vom `dailyCardLimit`; -1 = unbegrenzt, 0 = keine neuen Karten)_

- [x] **D3** – Settings-UI: "Neue Karten pro Tag" Selektor (Werte: 0, 3, 5, 10, ∞)  
  _(Amber/gelbe Farbgebung zur Unterscheidung vom "Karten pro Tag"-Selektor)_

- [x] **D4** – `startSession('due')` + `startSession('type')` in Learn.tsx: neue Karten mischen  
  _(Revision-Karten + neue Karten; `sessionNewCards` zählt eingeführte neue Karten)_

- [x] **D5** – Home.tsx: Zähler für neue Karten im Due-Today-Banner  
  _("+ Y neue Karten" als dritte Zeile, nur wenn Y > 0)_

- [x] **D6** – Session-Abschluss in Learn.tsx: "✨ X neue Karten eingeführt" Badge  
  _(Gelbes Badge unter den 3 Statistik-Kacheln, nur wenn neue Karten in Session waren)_

**Akzeptanzkriterium:** Eine Lernsession mit `due`-Modus enthält automatisch neue Karten,  
die danach in den Wiederholungsrhythmus eintreten. ✓

---

## Reihenfolge der Umsetzung

```
Block A  →  Block C  →  Block D
```

Block B ist bereits erledigt. Block A zuerst, damit wir auf einer sauberen V1-Basis aufbauen.  
Block C (Tipptolerant) ist in sich abgeschlossen und kann direkt nach A umgesetzt werden.  
Block D (Neue Karten) ist das komplexeste Feature und kommt zuletzt.

---

## Änderungsprotokoll

### Block D – erledigt (2026-05-05)

**`src/context/LearningContext.tsx`**
- `dailyNewCardLimit: number` (default 5; 0 = aus, -1 = unbegrenzt) zu `LearningState` hinzugefügt
- `dailyNewStats: Record<Language, {date, count}>` für tägliches Tracking neuer Karten
- `isCardDue`: Karten mit `lastReviewed === null` werden jetzt ausgeschlossen (neue Karte ≠ fällige Karte)
- `getNewCards(lang)`: gibt neue Karten respektiert `dailyNewCardLimit` minus bereits heute eingeführter
- `markCard`: erkennt Erst-Bewertung (`isNewCard = current.lastReviewed === null`) und inkrementiert `dailyNewStats`
- `setDailyNewCardLimit` Setter hinzugefügt und exponiert
- Migration beim Laden: `dailyNewCardLimit` und `dailyNewStats` werden gesetzt falls fehlend

**`src/pages/Settings.tsx`**
- `NEW_CARD_LIMITS` Array (0, 3, 5, 10, ∞=-1)
- Neue Sektion "Neue Karten pro Tag" mit amber-farbenen Buttons (vor SWStatusPanel)

**`src/pages/Learn.tsx`**
- `getNewCards` aus Context
- `sessionNewCards: number` State
- `startSession('due'|'type')`: kombiniert `getDueCards` + `getNewCards`, setzt `sessionNewCards`
- Session-Done-Screen: gelbes "✨ X neue Karten eingeführt" Badge (nur wenn > 0)

**`src/pages/Home.tsx`**
- `getNewCards` aus Context, `totalNew` berechnet
- Due-Today-Banner: "+ Y neue Karten" Zeile (nur wenn > 0)

---

### Block C – erledigt (2026-05-05)

**`src/context/LearningContext.tsx`**
- `typingTolerant: boolean` zu `LearningState` und `LearningContextType` hinzugefügt (Default: `false`)
- `setTypingTolerant` Setter hinzugefügt und im Provider exponiert

**`src/pages/Settings.tsx`**
- Neue Sektion "Eingabe-Modus" mit Toggle "Tipptolerant" eingefügt (zwischen Karteikarten und Karten pro Tag)

**`src/pages/Learn.tsx`**
- `levenshtein()` Funktion (O(n) Space) hinzugefügt
- `evaluateTypedAnswer()` Hilfsfunktion: `'correct' | 'almost' | 'wrong'` mit konfigurierbarer Toleranz
- Neuer `SessionMode: 'type'` eingeführt
- State-Variablen `typedAnswer`, `typeResult` hinzugefügt; Reset in `startSession` und `advanceCard`
- Keyboard-Handler für type-Modus: Enter = Prüfen / Weiter
- Neuer Lobby-Button "✍️ Eingabe-Modus" (amber/orange Gradient)
- Vollständige UI für type-Modus: Frage-Card, Eingabefeld, Ergebnis-Feedback, Prüfen/Weiter-Button
  - Grün = exakt richtig, Gelb/Orange = fast richtig (Tipptolerant), Rot = falsch
  - Bei "fast richtig" + falsch: korrekte Schreibweise wird angezeigt

---

### Block A – erledigt (2026-05-05)

**`src/pages/Home.tsx`**
- Header-div: `padding` von `16px 20px 28px` zurück auf `32px 24px 28px`; `display/flexDirection/alignItems` direkt auf Header-div gesetzt (kein innerer Wrapper-div mehr)
- "✕ Beenden"-Button (`onClick: window.close()`) vollständig entfernt
- Neuen Abschnitt "Karten fällig heute" (per-Language-Buttons mit `getDueCards(lang)`) entfernt
- Originalen "Due Today Banner" (einzelner großer Button, zeigt `totalDue` der gewählten Sprache) wiederhergestellt
- `dueCards` und `totalDue` Variablen wieder eingeführt
- Reihenfolge der Sektionen auf V1 zurückgesetzt: Direction → Due-Today-Banner → Lernkartei-Boxes → Start-Button
- Titel "Lernkartei – Übersicht" wiederhergestellt (war zu "Status {lang}" geändert worden)
- `LANGUAGE_CONFIG`/`ALL_LANGUAGES` und `random`-Richtung beibehalten (gute Verbesserungen aus V2)

---

## Definition of Done für V1.2

- [x] Alle Punkte in Block A, C und D sind `[x]`
- [x] `npm run build` läuft ohne Fehler durch
- [x] App verhält sich visuell identisch zu V1.0.1 (außer neuen Features)
- [x] V2-spezifischer Code: `SWStatusPanel` + `swOverlay.ts` bleiben als nützliches Debug-Tool in Settings (dokumentiert in Block B9)
- [x] Commit mit Tag `v1.2.0`
