# Goldie

Eigenständige mobile Web-App, Stand 13. Oktober 2026. WeTime wurde nur als Codevorlage gelesen; keine WeTime-Dateien, Zugangsdaten oder Nutzerdaten wurden übernommen.

## Start

Node.js 20 oder neuer: `npm run dev`, anschließend `http://127.0.0.1:4173` öffnen. Es werden keine zusätzlichen Pakete benötigt. `npm test` prüft die Domain- und API-Grenzen, `npm run build` erstellt die statische Oberfläche in `dist`. Für eine spätere Veröffentlichung benötigt `/api` einen separaten Server. Die Adresse auf dem Mac ist kein Testziel auf einem anderen Handy.

## Belegt: dieser Stand

- Navigation Heute · Planen · Goldie · Unterlagen · Mehr. Flexible mobile Oberfläche nach der gelieferten Bildvorlage; eigenständiges Vogelbild, echte dynamische Karten, große Berührungsflächen, beschriftete Eingaben, native Dialoge und anpassbare Schrift/Kontraste.
- Termine mit Datum/Uhrzeit/Ort, tatsächlicher Kalenderwoche, Monats- und Wochenwechsel; Anlegen, Bearbeiten, Löschen und Rückgängig.
- Listen für Einkauf, Packen, eigene Listen, Essensplan und Vorräte; einzelne Einträge hinzufügen, abhaken und entfernen.
- Routinen mit Startdatum, Uhrzeit und täglicher/wöchentlicher/einmaliger Wiederholung; Tagesstatus. Bereiche Persönlich, Haushalt, Trinken und Medikamente.
- Kontakte mit Telefon/E-Mail und Markierung als wichtiger Kontakt. Anruf- und Nachrichtenübergaben zeigen Ziel und Inhalt vor einer bewussten Bestätigung. Die App kann keine Zustellung bestätigen.
- Unterlagenangaben, Arten und Fristen, Notizen, Medikamentenangaben sowie Vorhaben für Ausflüge, Reisen, Feiern und Gemeinschaft mit Schritten und manueller Packliste.
- Nachrichtenentwürfe und Entwürfe individueller Les-/Schreibfreigaben. Freigabeentwürfe geben niemandem Zugriff.
- Einfache lokale Texteingaben an Goldie erzeugen bearbeitbare Entwürfe. Das ist ein regelbasierter Vorbereitungspfad, kein verbundener KI-Assistent. Unbekannte Angaben werden im Entwurf nicht ersetzt. Systemsprachausgabe nach Nutzeraktion; separater lokaler Mikrofontest verwirft Audio ohne Übertragung.
- Lokale Suche über eigene Einträge, persönliche Einstellungen und Download der eigenen Angaben als JSON.

## Grenzen: noch nicht verbunden

Die ausdrückliche Produktentscheidung lautet Konto und Synchronisierung. Lokaler Browser-Speicher (`goldie-preparation-v1`) ist ausschließlich der Zwischenstand für die Vorbereitung. Es gibt keine simulierten Konten und keinen behaupteten Cloud-Erfolg. Bei Speicherfehlern wird kein Erfolg bestätigt. Auf gemeinsam genutzten Geräten sind diese lokalen Angaben ohne Konto zugänglich; für die Vorbereitung keine sensiblen Originaldaten eingeben.

Supabase Auth/Postgres/Storage/Realtime, OpenAI KI/Transkription/Sprache/Realtime, Google Places und Web Push mit Supabase Cron/Edge Functions werden im zweiten Schritt verbunden. Alle API-Operationen geben derzeit HTTP 503 `integration_not_connected` zurück, auch bei nachträglich eingetragenen Umgebungsvariablen. `.env.example` enthält nur leere Konfigurationsplätze.

Unterlagen speichern derzeit keine Dateien. Routinen lösen keine Hintergrundbenachrichtigungen aus. Gemeinschaftsangebote, aktuelle Veranstaltungen, Geschenk- und Produktsuche benötigen tatsächliche Quellen; keine erfundenen Ergebnisse. Automatische Packlisten, Rezeptdaten, Kalenderimporte, Wetter und vollständige WeTime-Familienabläufe sind in diesem Stand nicht übernommen. Die seniorengerechten manuellen Bereiche sind vorbereitet; sie ersetzen diese Anbindungen nicht.

## Schlussfolgerung: technische Übernahme

WeTime ist eine React/TanStack-Web-App mit Supabase- und KI-Funktionen. Goldie übernimmt in diesem Stand Konzepte, keine pauschale Kopie der stark familiengebundenen Oberfläche. Die eigene Oberfläche ist als unabhängige, paketfreie Browser-App aufgebaut. Die Datenmodelle und APIs bleiben getrennt; die Supabase-Migration ist ausschließlich für ein neues Goldie-Projekt vorgesehen. Goldie verwendet keine Service-Role-Schlüssel im Browser.

Das Schema bereitet Benutzerbesitz, explizite Einzelfreigaben, private Dateien und Gesprächsmitgliedschaften vor. SQL ist noch nicht auf einer Datenbank ausgeführt. Vor Verbindung müssen echte JWT-/RLS-Tests, Konfliktbehandlung, Uploadrechte, Freigabewiderruf und Zustellung bei geschlossener App nachgewiesen werden. Details stehen in [server/README.md](server/README.md).

## Prüfungen und Annahmen

12 Domain-/API-Tests bestanden zunächst. Browserprüfung auf 390 × 844: Navigation, leerer Start ohne Beispieldaten, unklarer Termin ohne vorbelegtes Datum, Termin speichern/löschen/rückgängig, Einkaufsliste hinzufügen/abhaken und Erhalt nach Neuladen. Testeinträge wurden anschließend entfernt. Unabhängige Codeprüfung fand Fehler bei Datumsvorbelegung, zukünftigem Routinebeginn, doppelten Planungsschritten und überholenden Mikrofonanfragen; alle wurden korrigiert.

Kein echter Konto-, Mikrofon-, OpenAI-, Such-, Datei-, Push- oder Mehrbenutzertest durchgeführt. Screenreader, reale Mobilgeräte und vollständige Barrierefreiheit sind noch nicht abgenommen. Keine Veröffentlichung.

Keine Annahmen über reale Personen, Termine oder Nutzerdaten. Offene Angaben bleiben leer. Nutzerentscheidungen: mobile Web-App; vorgeschlagene Bereiche und Ergänzungen übernehmen; Konto/Synchronisierung und WeTime-Anbieter vorbereiten; echte Verbindungen gemeinsam im zweiten Schritt.

## Bildvorlage

`design/layout-reference.png` ist die übermittelte visuelle Referenz. Sie wird nicht als App-Oberfläche verwendet. `assets/goldie-mascot.png` wurde mit ImageGen aus der Vorlage abgeleitet (ein Durchlauf): „Extract/recreate only the golden yellow bird mascot perched on a slender horizontal branch with sparse sage green and beige botanical leaves. Transparent background, isolated asset. Match fine textured feathers, friendly black eyes, tiny orange beak, raised right wing, warm watercolor illustration. Single bird and branch, no interface, text, cards, panel or border.“
