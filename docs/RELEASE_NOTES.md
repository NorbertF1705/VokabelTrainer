# Release Notes – VokabelTrainer PWA

---

## v1.5.3 — 2026-09-01

### Neuer Lernmodus: „Neue Karten lernen ohne Quiz"

Fünfter Lernmodus in der Lobby, direkt nach Quiz einsortiert. Nutzt exakt
dieselbe Fach-2-Pool-Logik wie Quiz (`startQuizPool()`, mindestens 30
Karten, bei Bedarf dauerhaft aus Fach 1 aufgefüllt, keine Fach-Änderung
durch die Bewertung dank `lockBox`) — fragt die Karten aber als normale
Karteikarte mit Umdrehen und Selbstbewertung Richtig/Falsch statt per
Multiple-Choice ab. Wie im Quiz-Modus erscheinen dabei nie Satzfragen
(v1.5.0), auch wenn zur Vokabel ein Beispielsatz vorläge.

**Geändert:** Die Lobby-Buttons im Lernen-Tab stehen jetzt in der
Reihenfolge Quiz, Neue Karten lernen ohne Quiz, Fällige Karten, Eingabe,
Alle Vokabeln.

---

## v1.5.2 — 2026-08-31

### Bugfix: Beugungsformen wurden doppelt vorgelesen und angezeigt

Bei 103 unregelmäßigen Verben in „Englisch – Grundwortschatz (Klett)" (z. B. „to hold")
stand die Beugungsform gleich zweimal in den Daten: einmal in Klammern direkt hinter der
Vokabel (`to hold (held, held)`) und einmal separat im eigenen Beugungsformen-Feld
(`held · held`). Auf der Karte erschien sie dadurch doppelt, und die Sprachausgabe las
sie zweimal vor. Die redundante Klammer wurde aus den Vokabeldaten entfernt — betroffene
Einträge zeigen die Beugungsform jetzt nur noch an der vorgesehenen Stelle unter der
Vokabel. Übersetzungen mit eigenständigen Zusatzangaben in Klammern (z. B. „to think
(of)") sind davon nicht betroffen.

---

## v1.5.1 — 2026-08-31

### Bugfix: Kein ungewollter Tastatur-Sprung im Eingabe-Modus

Auf Mobilgeräten öffnete sich beim Erscheinen jeder Karte im Eingabe-Modus (auch bei
den Satzkarten aus v1.5.0) sofort die virtuelle Tastatur, wodurch die Fragekarte aus
dem sichtbaren Bereich geschoben wurde, bevor sie gelesen werden konnte. Der
Auto-Fokus wird jetzt nur noch auf Geräten mit Maus/physischer Tastatur gesetzt; auf
Touch-Geräten bleibt die Karte sichtbar, bis aktiv auf das Eingabefeld getippt wird.

---

## v1.4.13 — 2026-08-30

### Bugfixes: Sprachausgabe, Quiz-Karten-Darstellung, Auswahl-Kontrast

- **Beugungsformen werden mitgesprochen:** Die Sprachausgabe las bisher nur die
  Übersetzung vor, obwohl unregelmäßige Verbformen (z. B. „held · held") auf der
  Karte sichtbar waren. Sie werden jetzt direkt im Anschluss mitgesprochen.
- **Quiz-Karte nicht mehr abgeschnitten:** Die Karte im Quizmodus hatte eine feste,
  nur an der Bildschirmhöhe orientierte Größe, die den tatsächlich verfügbaren Platz
  neben den Antwortoptionen ignorierte — bei wenig Platz wurde das Icon oben
  abgeschnitten. Größe und Emoji skalieren jetzt mit dem tatsächlich verfügbaren
  Platz mit.
- **Abfragerichtung-Auswahl besser erkennbar:** Der ausgewählte Button auf der
  Startseite wirkte durch einen blassen Pastell-Hintergrund eher wie deaktiviert.
  Er zeigt jetzt denselben kräftigen Farbverlauf wie andere aktive Elemente der App.

---

## v1.5.0 — 2026-08-30

### Grundlage für Beispielsätze im Eingabe-Modus

Der Eingabe-Modus kann jetzt zu bereits mindestens einmal abgefragten Vokabeln
gelegentlich einen **Lückensatz** statt der einzelnen Vokabel zeigen (Cloze-Test):
Der Zielsatz erscheint mit maskierter Vokabel, darunter der deutsche Satz mit
optisch hervorgehobenem Wort als Hilfestellung. Bewertet wird weiterhin exakt wie
gewohnt (Eingabefeld, Tipptoleranz, Enter-Bestätigung).

**Sichtbare Änderungen für den Benutzer:**

- **Einstellungen → Eingabe-Modus:** neuer Schalter „Beispielsätze einstreuen"
  (standardmäßig aktiv)
- Kein neuer Lernmodus, keine neue Kachel — die Satzfrage ist eine Beimischung
  innerhalb der bestehenden „Fällige Karten" / „Eingabe-Modus"-Sitzung

**Inhalt:** Für **Englisch – Grundwortschatz (Klett)** stehen ab sofort 476
Beispielsätze für 351 der 2056 Vokabeln bereit, extrahiert aus den Originalfotos
des Lehrbuchs (S. 13–116). Für alle anderen Lernpakete legt diese Version zunächst
nur die technische Grundlage (Datenmodell, Lazy-Loading, UI-Integration) — solange
für ein Paket noch keine Beispielsätze vorliegen, verhält sich der Eingabe-Modus
unverändert wie bisher.

**Interne Änderungen:**

- Neuer Typ `ExampleSentence` (`src/data/vocabulary_types.ts`), optionales Feld
  `examplesLoader` auf `FileManifestEntry`
- Beispielsätze liegen als eigene, lazy geladene Dateien unter
  `src/data/examples/<fileId>.ts` — analog zum bestehenden Lazy-Loading der
  Vokabeldateien selbst; kein neues Storage-Schema, kein Server
- `LearningContext`: `getExampleFor(vocabId)` als reiner Einzelkarten-Lookup statt
  eines eigenen Kandidaten-Pools — Session kann dadurch nie leer werden
- Neue Komponente `SentenceCard.tsx` + Hilfsfunktion `splitAt()`
  (`src/utils/sentenceHighlight.ts`) für Maskierung und Hervorhebung

Details: `docs/PLAN_V1.5.md`

---

## v1.3.1 — 2026-05-19

### Bugfixes

- **Fällige Karten sofort korrekt anzeigen:** Beim App-Start und nach dem Wechsel des Lernpakets zeigte die Startseite kurzzeitig „0 Karten fällig", obwohl Karten vorhanden waren. Ursache war ein Timing-Problem: Die Berechnungsfunktionen lasen aus internen Zwischenspeichern (Refs), die erst nach dem ersten Render aktualisiert wurden. Die Funktionen lesen nun direkt aus dem aktuellen Zustand und zeigen sofort den richtigen Wert.
- **Fach-3-Farbe in der Statistik:** Die Farbe für Fach 3 im Balkendiagramm „Lernkartei – Fächer" wurde von hellem Gelb (#FFE66D) auf kräftiges Amber (#D97706) geändert. Der Zahlenwert ist damit auf hellem Hintergrund deutlich besser lesbar.

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
