# VokabelTrainer – Entwicklungsplan V1.2.2 → V1.3

> Ziel: Das bisherige Zwei-Sprachen-Parallelmodell durch eine flexible Einzeldatei-Architektur ersetzen.
> Statt Englisch und Spanisch immer gleichzeitig zu verwalten, ist genau eine Vokabeldatei aktiv.
> Die Datei kann jederzeit über einen Selektor im App-Header gewechselt werden.
> Der bestehende Lernstand wird idempotent migriert – kein Datenverlust.

---

## Status-Legende
- `[ ]` offen
- `[x]` erledigt
- `[~]` in Arbeit

---

## Block A – Neue Typen, Konfiguration und Storage-Schema

Betrifft: `src/data/vocabulary_types.ts`, `src/config/`

- [x] **A1** – `FileId`, `FileLanguage`, `FileState`, `AppSettings`, `FileManifestEntry` Typen anlegen  
  _(Erweiterung von `vocabulary_types.ts`; `FileState` enthält `progress`, `customVocab`, `dailyStats`, `dailyNewStats`, `trainingLog`)_

- [x] **A2** – `src/config/storage_keys.ts` anlegen  
  _(Alle Storage-Schlüssel als Konstanten: `VT_SCHEMA_VERSION`, `VT_ACTIVE_FILE_ID`, `VT_SETTINGS`, `vtFileKey(id)`)_

- [x] **A3** – `src/config/default_settings.ts` anlegen  
  _(`DEFAULT_SETTINGS: AppSettings` mit allen Defaults; `makeEmptyFileState()` Factory)_

- [x] **A4** – `src/config/file_config.ts` anlegen  
  _(`FILE_CONFIG: FileManifestEntry[]` als zentrales Manifest; jeder Eintrag hat `id`, `language`, `label`, `shortLabel`, `flag`, `voice`, `load: () => Promise<VocabularyItem[]>`; außerdem `getFile(id)`, `groupFilesByLanguage()`, `LANGUAGE_LABELS`)_

**Akzeptanzkriterium:** Alle Typen und Konfigurationen kompilieren fehlerfrei. ✓

---

## Block B – Vocabulary-Lazy-Loading (Code Splitting)

Betrifft: `src/data/vocabulary/`

- [x] **B1** – `src/data/vocabulary/en-basic-v1.ts` anlegen  
  _(Schlanker Re-Export-Wrapper: `export { VOCABULARY_EN as VOCABULARY_EN_BASIC } from '../vocabulary_en'`)_

- [x] **B2** – `src/data/vocabulary/es-basic-v1.ts` anlegen  
  _(Analog für Spanisch: `export { VOCABULARY_ES as VOCABULARY_ES_BASIC } from '../vocabulary_es'`)_

- [x] **B3** – `load`-Funktion in `FILE_CONFIG` per Dynamic Import verdrahten  
  _(Vite bündelt jeden Wrapper als eigenen Chunk; Vocabulary wird erst bei Auswahl des Lernpakets geladen)_

**Akzeptanzkriterium:** `npm run build` erzeugt separate Chunks `en-basic-v1` und `es-basic-v1`. ✓

---

## Block C – Migration v1.2 → v1.3

Betrifft: `src/migrations/v12_to_v13.ts`

- [x] **C1** – `migrateV12toV13()` Funktion anlegen  
  _(Liest `vokabeltrainer_state` aus IndexedDB/localStorage; schreibt `vt:schemaVersion`, `vt:activeFileId`, `vt:settings`, `vt:file:en-basic-v1`; v1.2-Blob bleibt als Backup erhalten)_

- [x] **C2** – Idempotenz sicherstellen  
  _(Liegt `vt:schemaVersion = "3"` bereits vor, ist die Funktion ein No-Op)_

- [x] **C3** – Sprachzuordnung: EN-Fortschritt → `vt:file:en-basic-v1`, ES wird ignoriert  
  _(v1.2 hatte immer EN als aktiven Stand; ES-Daten bleiben im Backup erhalten)_

**Akzeptanzkriterium:** Bestehender Lernstand wird nach Update korrekt übernommen; kein Datenverlust. ✓

---

## Block D – Neuer Hook und neue Komponenten

Betrifft: `src/hooks/`, `src/components/`, `src/pages/FirstRun.tsx`

- [x] **D1** – `src/hooks/useActiveFile.ts` anlegen  
  _(Gibt `{ manifest, state, builtIn, allVocabulary } | null` zurück; liest aktive FileId aus Context; lädt Vocabulary via `FILE_CONFIG`)_

- [x] **D2** – `src/components/FileSelectorButton.tsx` anlegen  
  _(Zeigt `shortLabel` + ▾ des aktiven Pakets; öffnet `FileSelectorModal` beim Antippen)_

- [x] **D3** – `src/components/FileSelectorModal.tsx` anlegen  
  _(Bottom-Sheet mit allen verfügbaren Paketen; zeigt Fortschrittsstand pro Paket; `ConfirmSwitchDialog` wenn Session aktiv)_

- [x] **D4** – `src/pages/FirstRun.tsx` anlegen  
  _(Willkommensbildschirm beim ersten Start; Pakete nach Sprache gruppiert; Auswahl setzt `activeFileId`)_

**Akzeptanzkriterium:** Erststart zeigt Willkommensbildschirm; Header-Button wechselt Paket. ✓

---

## Block E – LearningContext Rewrite

Betrifft: `src/context/LearningContext.tsx`

- [x] **E1** – State-Struktur auf v1.3 umstellen  
  _(`loaded`, `activeFileId`, `fileStates: Record<FileId, FileState>`, `vocabularyByFile: Record<FileId, VocabularyItem[]>`, `settings: AppSettings`, `isSessionActive`)_

- [x] **E2** – Async-Laden beim Mount  
  _(Prüft `vt:schemaVersion`; führt Migration aus; lädt alle `vt:file:*`-Keys; setzt `loaded = true`)_

- [x] **E3** – Methoden ohne `lang`-Parameter neu implementieren  
  _(`getCardProgress(id)`, `markCard(id, correct)`, `getDueCards()`, `getNewCards()`, `getBoxCounts()`, `getTotalStats()`, `getTrainingConsistency(days)`, `recordTrainingDay()`, `addCustomVocab(item)`, `removeCustomVocab(id)`, `resetProgress()`)_

- [x] **E4** – `switchFile(id)` Methode  
  _(Lädt Vocabulary per Dynamic Import falls noch nicht gecacht; setzt `activeFileId`; speichert `vt:activeFileId`)_

- [x] **E5** – `updateSettings(partial)` Methode  
  _(Merged Partial<AppSettings> in `settings`; schreibt `vt:settings`)_

- [x] **E6** – Debounced Save pro FileState  
  _(300ms Debounce; `pagehide`/`visibilitychange`-Flush für Offline-Sicherheit; `navigator.storage.persist()` beim Start)_

- [x] **E7** – `stateRef` für stale-closure-freien pagehide-Flush  
  _(Ref hält immer den aktuellen State; `useEffect` registriert Flush-Handler einmalig)_

**Akzeptanzkriterium:** Context kompiliert; alle Methoden ohne Sprachparameter; Fortschritt wird pro Paket gespeichert. ✓

---

## Block F – Screen-Adaptationen

Betrifft: `src/App.tsx`, `src/components/Layout.tsx`, alle 5 Pages

- [x] **F1** – `src/App.tsx` umschreiben  
  _(Innere `AppRoutes`-Komponente: `activeFileId === null` → `<FirstRun />`; sonst normale Routes unter `<Layout>`)_

- [x] **F2** – `src/components/Layout.tsx` umschreiben  
  _(Dunkler Header-Streifen mit `FileSelectorButton` rechts; `<Outlet />` darunter)_

- [x] **F3** – `src/pages/Home.tsx` anpassen  
  _(Sprach-Toggle entfernt; `settings.queryDirection` + `updateSettings`; `useActiveFile()` für Abfragerichtungs-Abkürzung)_

- [x] **F4** – `src/pages/Learn.tsx` anpassen  
  _(`useActiveFile()` für `voiceCode` und `langLabel`; `allVocabulary = activeFile?.allVocabulary ?? []`; alle Context-Calls ohne lang-Param; `exitSession`-Helper)_

- [x] **F5** – `src/pages/Vocabulary.tsx` anpassen  
  _(Sprach-Tabs entfernt; `useActiveFile().allVocabulary`; `addCustomVocab`/`removeCustomVocab` ohne lang-Param)_

- [x] **F6** – `src/pages/Statistics.tsx` anpassen  
  _(Zweisprachige Übersichts-Kacheln entfernt; Sprach-Tabs entfernt; alle Stats-Calls ohne lang-Param)_

- [x] **F7** – `src/pages/Settings.tsx` anpassen  
  _("Lernsprache"-Abschnitt entfernt; alle Settings über `updateSettings({...})`; Werte aus `settings.xxx`)_

**Akzeptanzkriterium:** `npm run build` 0 Fehler; alle 5 Seiten rendern korrekt. ✓

---

## Block G – Versioning, PWA-Cache und Dokumentation

- [x] **G1** – `src/version.ts`: `APP_VERSION = '1.3.0'`
- [x] **G2** – `package.json`: `"version": "1.3.0"`
- [x] **G3** – `vite.config.ts`: `cacheName: 'static-assets-v2'`  
  _(Erzwingt Cache-Invalidierung auf allen Clients beim nächsten Service-Worker-Update)_
- [x] **G4** – `docs/RELEASE_NOTES.md`: v1.3.0-Eintrag hinzugefügt
- [x] **G5** – `docs/Benutzerdokumentation.md`: Vollständig auf v1.3 aktualisiert
- [x] **G6** – `docs/Benutzerdokumentation.html`: Auf v1.3 aktualisiert (neue Abschnitte, Nummern, Changelog)
- [x] **G7** – `docs/Entwicklerdokumentation.html`: Auf v1.3 aktualisiert (alle betroffenen Abschnitte)

**Akzeptanzkriterium:** Alle Docs zeigen v1.3.0; kein Verweis mehr auf alten Zwei-Sprachen-Ansatz in Pflichtfeldern. ✓

---

## Reihenfolge der Umsetzung

```
Block A (Typen/Config)
  → Block B (Vocabulary-Lazy)
  → Block C (Migration)
  → Block D (Hook + Komponenten)
  → Block E (LearningContext Rewrite)
  → Block F (Screen-Adaptationen)
  → Block G (Versioning + Docs)
```

Jeder Block baut auf dem vorherigen auf. Block B und C können parallel nach Block A begonnen werden.

---

## Geänderte Dateien – Übersicht

### Neu angelegt
| Datei | Beschreibung |
|---|---|
| `src/config/storage_keys.ts` | Storage-Schlüssel-Konstanten |
| `src/config/default_settings.ts` | DEFAULT_SETTINGS, makeEmptyFileState() |
| `src/config/file_config.ts` | FILE_CONFIG Manifest, Loader-Funktionen |
| `src/migrations/v12_to_v13.ts` | Idempotente Migration v1.2-Blob → v1.3-Schema |
| `src/hooks/useActiveFile.ts` | Typsicherer Zugriff auf Manifest + State + Vocabulary |
| `src/data/vocabulary/en-basic-v1.ts` | Lazy-Wrapper für englischen Grundwortschatz |
| `src/data/vocabulary/es-basic-v1.ts` | Lazy-Wrapper für spanischen Grundwortschatz |
| `src/components/FileSelectorButton.tsx` | Header-Button zum Öffnen des Paket-Selektors |
| `src/components/FileSelectorModal.tsx` | Bottom-Sheet zur Paket-Auswahl + Bestätigungsdialog |
| `src/pages/FirstRun.tsx` | Willkommensbildschirm bei erstem Start |

### Vollständig umgeschrieben
| Datei | Wesentliche Änderung |
|---|---|
| `src/context/LearningContext.tsx` | v1.3-State-Schema, alle Methoden ohne lang-Param |
| `src/App.tsx` | AppRoutes mit FirstRun-Gate |
| `src/components/Layout.tsx` | Header mit FileSelectorButton |
| `src/pages/Home.tsx` | Sprach-Toggle entfernt |
| `src/pages/Learn.tsx` | useActiveFile(), keine lang-Params |
| `src/pages/Vocabulary.tsx` | Sprach-Tabs entfernt, neue API |
| `src/pages/Statistics.tsx` | Zweisprachige Kacheln entfernt |
| `src/pages/Settings.tsx` | Lernsprache-Zeile entfernt, updateSettings |

### Kleinere Änderungen
| Datei | Änderung |
|---|---|
| `src/data/vocabulary_types.ts` | v1.3 Typen ergänzt |
| `src/version.ts` | `'1.3.0'` |
| `package.json` | `"version": "1.3.0"` |
| `vite.config.ts` | `cacheName: 'static-assets-v2'` |

---

## Storage-Schema-Vergleich

| v1.2 | v1.3 |
|---|---|
| Ein Schlüssel `vokabeltrainer_state` (großes JSON) | `vt:schemaVersion`, `vt:activeFileId`, `vt:settings`, `vt:file:<id>` |
| Sprachen `EN` / `ES` als feste Felder im State | Beliebig viele Dateien via FileId |
| Fortschrittskey `{vocabId}_{lang}` | `{vocabId}` (sprachunabhängig innerhalb der Datei) |

---

## Definition of Done für V1.3

- [x] Alle Punkte in Block A–G sind `[x]`
- [x] `npm run build` läuft ohne TypeScript-Fehler durch
- [x] Separate Lazy-Chunks für `en-basic-v1` und `es-basic-v1` in `dist/`
- [x] Erststart-Screen erscheint beim ersten Aufruf ohne gespeicherten State
- [x] Bestehender v1.2-Lernstand wird automatisch migriert (kein Datenverlust)
- [x] Paket-Wechsel während Session zeigt Bestätigungsdialog
- [x] Alle Docs auf v1.3.0 aktualisiert
