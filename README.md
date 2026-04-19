# Mallorca 2026 — Bachelor Abstimmung

Online-Umfrage für das Bachelor-Wochenende in Mallorca (7.–9., 6 Personen).

## Live

https://trajkovicv.github.io/pool-abstimmung-mallorca/

## Wie's funktioniert

- 17 Fragen zu Unterkunft, Freitag/Samstag/Sonntag, Essen, Transport, Budget, Must-Have/No-Go
- Jeder wählt seinen Namen (Marko, Saven, Vladan, Suheib, Vuk, Aramis)
- Antworten werden automatisch nach jeder Frage gespeichert
- Ergebnis-Tab zeigt live Zusammenfassung + Detail-Tabelle wer wie abgestimmt hat
- Stimme kann jederzeit geändert werden

## Technik

Vanilla HTML/CSS/JS, zero build step. Sync via [keyvalue.immanuel.co](https://keyvalue.immanuel.co) (anonymer Key-Value-Store mit CORS, kein Account nötig).

Jeder Name ist ein eigener Key im App-Scope `mallorca-ari-2026-bachelor-v1`; Werte sind base64url-encoded JSON-Votes.
