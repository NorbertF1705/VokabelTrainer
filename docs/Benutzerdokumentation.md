# VokabelTrainer – Benutzerdokumentation

**Version:** 1.3.1  
**Stand:** Mai 2026

---

## Überblick

VokabelTrainer ist eine offline-fähige Web-App zum Lernen von Vokabeln. Die App nutzt ein Karteikartensystem mit intelligentem Wiederholungsalgorithmus (Spaced Repetition) und läuft vollständig auf dem iPhone – ohne Internetverbindung und ohne App Store.

Es ist immer genau ein **Lernpaket** (Vokabeldatei) aktiv. Aktuell verfügbare Pakete:
- 🇬🇧 Englisch – Grundwortschatz
- 🇪🇸 Spanisch – Grundwortschatz

Das aktive Paket kann jederzeit über den Selektor oben rechts gewechselt werden.

Die App gliedert sich in fünf Bereiche, die über die Navigationsleiste am unteren Bildschirmrand erreichbar sind:

| Tab | Funktion |
|---|---|
| 🏠 Home | Tagesübersicht, Lernen starten |
| 🧠 Lernen | Karteikarten-Sitzung starten |
| 📚 Vokabeln | Vokabeln durchsuchen und eigene hinzufügen |
| 📊 Statistik | Lernfortschritt und Regelmäßigkeit |
| ⚙️ Einstellungen | Lernmodi, Limits konfigurieren |

---

## 1. App starten (Ersteinrichtung)

> Diese Schritte sind nur einmal notwendig. Danach läuft die App direkt vom iPhone-Homescreen.

**Voraussetzung:** Mac und iPhone befinden sich im selben WLAN.

**Schritt 1 – App auf dem Mac bereitstellen**

Terminal auf dem Mac öffnen und im Projektverzeichnis eingeben:

```bash
npm run build
npx serve -s dist
```

Das Terminal zeigt eine Netzwerkadresse, z. B.:

```
Network: http://192.168.1.42:3000
```

**Schritt 2 – App auf dem iPhone öffnen**

1. Safari auf dem iPhone öffnen
2. Die Netzwerkadresse aus dem Terminal eingeben (z. B. `http://192.168.1.42:3000`)
3. App wird im Browser geladen

**Schritt 3 – App zum Homescreen hinzufügen**

1. Teilen-Symbol in Safari antippen ( □↑ )
2. **„Zum Home-Bildschirm"** wählen
3. Namen bestätigen → **„Hinzufügen"** antippen

Die App erscheint als Icon auf dem Homescreen und kann jederzeit offline gestartet werden.

---

## 2. Erststart und Lernpaket-Auswahl

Beim allerersten Start der App erscheint ein Willkommensbildschirm. Hier wird das Lernpaket gewählt, mit dem gestartet werden soll. Die Auswahl lässt sich später jederzeit über den Selektor im Header ändern.

---

## 3. Lernpaket wechseln

Am oberen Rand der App befindet sich ein kleiner Button, der den Namen des aktiven Lernpakets anzeigt (z. B. „🇬🇧 Englisch · Grundwortschatz ▾"). Ein Tipp öffnet ein Auswahlblatt mit allen verfügbaren Paketen.

- Der Lernfortschritt jedes Pakets wird separat gespeichert und bleibt beim Wechseln erhalten.
- Läuft gerade eine Lernsitzung, erscheint ein Bestätigungsdialog, bevor die Sitzung beendet wird.

---

## 4. Startseite (Home)

Die Startseite zeigt die Tagesübersicht und dient als schneller Einstieg ins Lernen.

**Abfragerichtung**

Bestimmt, welche Seite der Karteikarte zuerst angezeigt wird:

| Option | Beschreibung |
|---|---|
| DE → EN/ES | Deutsches Wort wird gezeigt, Fremdwort muss erinnert werden |
| EN/ES → DE | Fremdwort wird gezeigt, deutsche Bedeutung muss erinnert werden |
| 🎲 Zufall | Richtung wechselt zufällig bei jeder Karte |

**Tagesbanner**

Das farbige Banner zeigt, wie viele Karten heute fällig sind. Ein Antippen startet direkt die Lernsitzung. Darunter erscheint ggf. die Anzahl neuer Karten, die heute eingeführt werden.

**Lernkartei-Übersicht**

Sechs Kacheln zeigen, wie viele Karten sich aktuell in welchem Fach befinden.

**Lernen starten**

Der Button „🚀 Lernen starten" führt direkt zum Lernen-Tab.

---

## 5. Lernen

Der Lernen-Tab bietet vier verschiedene Lernmodi. Vor dem Start wird ein Auswahlbildschirm angezeigt.

### Lernmodi

| Modus | Beschreibung |
|---|---|
| 🎯 Fällige Karten | Zeigt alle heute fälligen Wiederholungen plus neue Karten (bis zum konfigurierten Tageslimit) |
| 🔁 Alle Vokabeln | Zeigt alle Karten des aktiven Pakets in zufälliger Reihenfolge als Karteikarten |
| 🧩 Quiz | Multiple-Choice mit vier Antwortmöglichkeiten |
| ✍️ Eingabe-Modus | Antwort wird getippt und auf Korrektheit geprüft |

### Karteikarten-Modus (Fällige Karten / Alle Vokabeln)

1. Die Vorderseite der Karte wird angezeigt (gemäß gewählter Abfragerichtung)
2. Karte antippen oder **Enter** drücken → Rückseite wird aufgedeckt
3. Selbst bewerten:

| Schaltfläche | Tastatur | Bedeutung |
|---|---|---|
| ✗ Falsch | Shift + ← | Karte fällt auf Fach 1 zurück |
| ✓ Richtig | Shift + → | Karte rückt ein Fach vor |

### Quiz-Modus

1. Vorderseite der Karte und vier Antwortoptionen werden angezeigt
2. Die richtige Antwort antippen (oder Taste **1–4** drücken)
3. Richtige Antwort wird grün, falsche rot hervorgehoben
4. **Weiter** antippen oder **Enter / Leertaste** drücken

### Eingabe-Modus

1. Das zu übersetzende Wort wird angezeigt
2. Antwort in das Textfeld tippen
3. **Prüfen** antippen oder **Enter** drücken
4. Ergebnis wird angezeigt:
   - ✓ Richtig – Antwort war korrekt
   - ~ Fast richtig – Tippfehler innerhalb der Toleranzgrenze (nur wenn Tipptolerant aktiv)
   - ✗ Falsch – mit Anzeige der richtigen Antwort
5. **Weiter** antippen oder **Enter** drücken

> Ob „fast richtig" als korrekt gewertet wird, hängt von der Einstellung **Tipptolerant** ab (siehe Kapitel 8).

### Audio

In allen Lernmodi ist oben rechts der 🔈-Button verfügbar, der das aktuell angezeigte Wort vorliest. Alternativ kann das Vorlesen automatisch nach dem Aufdecken der Antwort aktiviert werden (siehe Einstellungen).

### Sitzungsende

Nach der letzten Karte erscheint eine Auswertung mit:
- Anzahl richtig / falsch beantworteter Karten
- Erfolgsquote in Prozent
- Anzahl neu eingeführter Karten (falls vorhanden)

„Neue Sitzung" kehrt zum Auswahlbildschirm zurück.

---

## 6. Vokabeln

Der Vokabeln-Tab zeigt alle Vokabeln des aktiven Lernpakets und erlaubt das Hinzufügen eigener Einträge.

### Anzeige und Filter

Das Suchfeld filtert nach deutschem Wort oder Übersetzung.

Zusätzlich stehen zwei scrollbare Filterzeilen bereit:

- **Kategorie:** Tiere, Essen & Trinken, Körper, Kleidung, Natur & Wetter, Zuhause, Transport, Sport & Freizeit, Berufe, Technologie, Orte, Verben, Diverses
- **Fach:** Alle Fächer, Fach 1–6

Jeder Listeneintrag zeigt: Emoji, deutsches Wort, Übersetzung, Beugungsformen (falls vorhanden), Kategorie und das aktuelle Fach als farbigen Kreis.

### Eigene Vokabel hinzufügen

1. **+ Neu** antippen
2. Formular ausfüllen:

| Feld | Beschreibung |
|---|---|
| Emoji | Symbol zur Veranschaulichung (Standard: 📝) |
| Deutsch | Deutsches Wort (Pflicht) |
| Fremdsprache | Übersetzung in der aktiven Sprache (Pflicht) |
| Beugungsformen | Plural, Konjugation o. Ä. (optional) |
| Kategorie | Thematische Zuordnung |

3. **Speichern** antippen

Die neue Vokabel wird dem aktiven Lernpaket hinzugefügt.

### Eigene Vokabel löschen

Eigene Vokabeln sind mit einem 🗑️-Symbol gekennzeichnet. Antippen → Löschung bestätigen.

> Fest eingebaute Vokabeln können weder bearbeitet noch gelöscht werden.

---

## 7. Spaced Repetition (Wiederholungsalgorithmus)

Die App verwendet ein 6-Fach-Karteikartensystem. Je öfter eine Vokabel korrekt beantwortet wird, desto länger der Abstand bis zur nächsten Wiederholung.

| Fach | Intervall bis zur nächsten Wiederholung |
|---|---|
| Fach 1 | sofort (immer fällig) |
| Fach 2 | 1 Tag |
| Fach 3 | 3 Tage |
| Fach 4 | 7 Tage |
| Fach 5 | 14 Tage |
| Fach 6 ✓ | gelernt – wird nicht mehr abgefragt |

**Richtig beantwortet:** Karte rückt ein Fach vor (max. Fach 6).  
**Falsch beantwortet:** Karte fällt auf Fach 1 zurück.  
**Neue Karten** starten immer in Fach 1.

---

## 8. Statistik

Der Statistik-Tab gibt einen Überblick über den Lernfortschritt des aktiven Lernpakets.

- **Lernkartei – Fächer:** Balkendiagramm mit der Verteilung der Karten auf Fach 1–6
- **Trainings-Regelmäßigkeit:** Kalenderansicht der letzten 7 Tage; darunter Prozentwerte für 7, 30 und 90 Tage
- **Fortschritt nach Kategorie:** Für jede Kategorie wird der Anteil fertiger und in Bearbeitung befindlicher Karten angezeigt

**Fortschritt zurücksetzen**

Der Button am Ende der Seite setzt alle Karten des aktiven Pakets auf Fach 1 zurück. Eigene Vokabeln bleiben dabei erhalten.

---

## 9. Einstellungen

| Einstellung | Beschreibung |
|---|---|
| **Abfragerichtung** | DE → Fremdsprache, Fremdsprache → DE, Zufällig |
| **Quiz – Lösung vorlesen** | Spricht die richtige Antwort beim Antippen vor |
| **Karteikarten – Lösung vorlesen** | Spricht die Rückseite automatisch beim Aufdecken vor |
| **Tipptolerant** | Kleine Tippfehler im Eingabe-Modus werden als richtig gewertet (Toleranz: 1–2 Zeichen je nach Wortlänge) |
| **Karten pro Tag** | Begrenzt die fälligen Karten pro Sitzung: 10 / 20 / 30 / 50 / ∞ |
| **Neue Karten pro Tag** | Wie viele unbekannte Karten pro Sitzung eingeführt werden: 0 / 3 / 5 / 10 / ∞ |

**Fortschritt zurücksetzen** setzt alle Karten des aktiven Pakets auf Fach 1 zurück (eigene Vokabeln bleiben erhalten).

---

## 10. Datenspeicherung & Datenschutz

Alle Daten (Vokabeln, Lernfortschritt, Einstellungen) werden **ausschließlich lokal auf dem Gerät** gespeichert (IndexedDB mit localStorage als Fallback). Es werden keine Daten an externe Server übertragen.

Der Lernfortschritt jedes Lernpakets wird getrennt gespeichert und bleibt beim Paket-Wechsel erhalten.

> **Hinweis:** Wird in Safari „Verlauf und Website-Daten löschen" ausgeführt, können auch App-Daten betroffen sein. Für dauerhaften Schutz die App über das Homescreen-Icon starten (nicht direkt im Safari-Browser).

---

## 11. Häufige Fragen

**Die App zeigt nach längerem Nichtbenutzen einen Fehler.**  
→ Mac einschalten, `npx serve -s dist` im Projektverzeichnis starten, App einmal über WLAN öffnen. Danach läuft sie wieder offline.

**Ich habe die Netzwerkadresse des Macs vergessen.**  
→ Mac-Terminal: `ipconfig getifaddr en0` gibt die aktuelle WLAN-IP aus.

**Kann ich die App auf mehreren Geräten nutzen?**  
→ Ja. Gleiche URL auf jedem Gerät in Safari öffnen und zum Homescreen hinzufügen. Daten werden jedoch nicht zwischen Geräten synchronisiert.

**Wie viele Vokabeln sind eingebaut?**  
→ Die App enthält fest eingebaute Vokabeln für Englisch und Spanisch in 13 Kategorien. Eigene Einträge können beliebig ergänzt werden.

**Was passiert, wenn ich eine Vokabel falsch beantworte?**  
→ Die Karte fällt auf Fach 1 zurück und wird sofort wieder fällig.

**Bleibt mein Lernfortschritt beim Wechsel des Lernpakets erhalten?**  
→ Ja. Jedes Lernpaket hat seinen eigenen Fortschritt, der unabhängig gespeichert wird.

---

*VokabelTrainer – Privates Lernprojekt*
