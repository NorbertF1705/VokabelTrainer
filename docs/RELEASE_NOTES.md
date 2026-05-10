# Release Notes – VokabelTrainer PWA

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
