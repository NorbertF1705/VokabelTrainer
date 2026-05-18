# Release Notes – VokabelTrainer PWA

---

## v1.3.0 — 2026-05-18

### Architektur: Einzelne aktive Vokabeldatei

Version 1.3 ersetzt das bisherige Zwei-Sprachen-Parallelmodell durch eine flexible Einzeldatei-Architektur. Statt Englisch und Spanisch immer gleichzeitig zu verwalten, ist jetzt jeweils genau eine Vokabeldatei aktiv. Die Datei kann jederzeit über einen Selektor im App-Header gewechselt werden.

**Sichtbare Änderungen für den Benutzer:**

- **Erststart:** Beim ersten Öffnen der App erscheint ein Willkommensbildschirm zur Auswahl des Lernpakets
- **Datei-Selektor im Header:** Kleiner Button oben rechts zeigt die aktive Datei; Tipp öffnet ein Bottom-Sheet zum Wechseln
- **Home:** Sprach-Toggle (EN / ES) entfernt; Abfragerichtung-Buttons bleiben
- **Vokabeln:** Sprach-Tabs entfernt; die Liste zeigt immer die aktive Datei
- **Statistik:** Zweisprachige Übersichts-Kacheln und Sprach-Tabs entfernt; Statistik gilt für die aktive Datei
- **Einstellungen:** „Lernsprache"-Abschnitt entfernt
- **Datei-Wechsel während Session:** Bestätigungsdialog schützt vor ungewolltem Sitzungsabbruch

**Interne Änderungen:**

- Neues Storage-Schema v3: Schlüssel `vt:schemaVersion`, `vt:activeFileId`, `vt:settings`, `vt:file:<id>`
- Idempotente Migration v1.2 → v1.3: bestehender Lernstand wird automatisch übernommen, v1.2-Blob bleibt als Backup erhalten
- Vokabeldaten werden per Dynamic Import (Code Splitting) lazy geladen
- `file_config.ts` als zentrale Manifest-Datei für alle Vokabeldateien
- Vocabulary-Dateien unter `src/data/vocabulary/` als schlanke Re-Export-Wrapper
- `useActiveFile()` Hook für typsicheren Zugriff auf Manifest + State + Vokabular

---

## v1.2.2 — 2026-05-10

### Bugfix: Lernstand bleibt nach App-Updates erhalten

Beim Einspielen einer neuen App-Version konnte es vorkommen, dass der gesamte Lernstand zurückgesetzt wurde. Ursachen waren ein Race-Condition mit dem 300ms-Debounce beim Speichern sowie iOS-seitige IndexedDB-Eviction bei Service-Worker-Updates.

**Maßnahmen:**
- `navigator.storage.persist()` — iOS signalisieren, IndexedDB-Daten zu schützen
- Duales Schreiben: jeder Save schreibt synchron ein localStorage-Backup
- Backup-Fallback beim Lesen: bei leerem IndexedDB-Ergebnis wird das Backup herangezogen
- `pagehide`/`visibilitychange`-Flush: State wird unmittelbar vor Seitenentladen gesichert

---

## v1.2.1 — 2026-05-10

### Verbesserungen
- **Sprachausgabe**: Die App wählt nun explizit die passende Systemstimme für jede Sprache (Deutsch, Englisch, Spanisch). Ein Voice-Cache auf Modulebene umgeht einen bekannten Browser-Bug, bei dem `getVoices()` beim ersten Aufruf noch leer ist.

### Dokumentation
- Benutzerdokumentation als HTML veröffentlicht
- Entwicklerdokumentation als HTML veröffentlicht (inkl. technischer Beschreibung der Sprachausgabe-Logik)

---

## v1.2.0 — 2026-05-06

### Übersicht
Version 1.2 bringt zwei neue Lernfeatures und stellt das V1-Design exakt wieder her,
das durch den V2-Entwicklungszweig unbeabsichtigt verändert worden war.

---

### Neu: Eingabe-Modus mit Tipptolerant

Die App kennt jetzt einen vierten Lernmodus neben Karteikarten, Alle Vokabeln und Quiz.

**Eingabe-Modus (✍️)**
- Die Frage wird angezeigt, die Antwort wird getippt
- Sofortiges Feedback nach dem Prüfen: grün (richtig), orange (fast richtig), rot (falsch)
- Bei falscher oder fast-richtiger Antwort wird die korrekte Schreibweise eingeblendet

**Tipptolerant-Einstellung**
- Zu finden unter Einstellungen → Eingabe-Modus
- Wenn aktiv: kleine Tippfehler werden als richtig gewertet
- Toleranz: 1 Zeichen bei Wörtern ≤ 5 Buchstaben, 2 Zeichen bei längeren Wörtern
- Groß-/Kleinschreibung wird grundsätzlich ignoriert

---

### Neu: Gestuftes Einführen neuer Karten

Neue Vokabeln (noch nie gelernt) werden jetzt kontrolliert in den Lernablauf eingeführt,
statt undifferenziert in der Wiederholungsschlange zu landen.

**Neue Karten pro Tag (Einstellungen)**
- Wählbare Werte: 0 / 3 / 5 / 10 / ∞ (Standard: 5)
- Gilt pro Sprache unabhängig
- Der Zähler wird täglich zurückgesetzt

**Verhalten**
- Fällige Karten (Wiederholung) erscheinen zuerst, neue Karten am Ende der Session
- Home-Bildschirm zeigt "+ Y neue Karten" im Fälligkeits-Banner wenn neue verfügbar sind
- Session-Abschluss zeigt "✨ X neue Karten eingeführt" wenn neue Karten in der Session waren
- Nach der ersten Bewertung treten neue Karten regulär in den Wiederholungsrhythmus ein

---

### Design-Restore

Das V1-Design des Home-Bildschirms wurde exakt wiederhergestellt:
- Header mit zentriertem 🎓, vollem Padding und Untertitel
- Einfacher "Fällig heute"-Banner (eine Sprache, große Zahl)
- Versionsanzeige (`v1.2.0`) im Header übernommen aus v1.0.1-Hotfix
- Sektionsreihenfolge: Sprache → Richtung → Banner → Lernkartei-Status → Start

---

### Interne Verbesserungen (aus V2 übernommen)

Diese Änderungen haben keinen sichtbaren Design-Einfluss, verbessern aber
die Codequalität und legen Grundlagen für künftige Erweiterungen:

- Vokabeldaten aufgeteilt in `vocabulary_en.ts` und `vocabulary_es.ts`
- `LANGUAGE_CONFIG` / `ALL_LANGUAGES` Konstanten für einfachere Spracherweiterung
- Unabhängige Lernfortschrittsprofile pro Sprache (IndexedDB)
- Zufällig-Richtung (🎲) als dritte Abfrage-Option
- Quiz: kein Auto-Advance mehr, Weiter per Klick oder Enter/Leertaste
- Karteikarten und Quiz: optionales automatisches Vorlesen der Lösung (Einstellungen)
- Konsistenz-Tracking: Lerntage werden pro Sprache aufgezeichnet

---

## v1.0.1 — 2026-04-25

- Bugfix: Beugungsformen werden jetzt in der Zielsprache angezeigt (EN/ES statt DE)
- Versionsanzeige (`v{APP_VERSION}`) im App-Header eingeführt
- Beugungsformen für unregelmäßige Verben ergänzt

---

## v1.0.0 — 2026-04-18

Erste stabile Version.

- Lernkartei-System mit 6 Fächern (Spaced Repetition)
- Sprachen: Deutsch ↔ Englisch, Deutsch ↔ Spanisch
- Modi: Karteikarten, Alle Vokabeln, Quiz (Multiple Choice)
- Eigene Vokabeln hinzufügen und löschen
- Statistiken: Fachverteilung, Konsistenz, Kategorien
- PWA: installierbar, Offline-Betrieb, Service Worker
- Web Speech API: Vokabeln vorlesen lassen
- Tägliches Kartenlimit einstellbar
