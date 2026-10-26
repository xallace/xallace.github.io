# GPS-Grundlagen • Form- und Lagetoleranzen

Interaktive Lernhilfe zur Geometrischen Produktspezifikation (GPS) nach DIN EN ISO 1101 und DIN EN ISO 8015:2011. Design wie die Tabellenbuch-Metall-Apps: Blueprint-Dunkelmodus als Standard, heller Modus umschaltbar.

## Reiter

| Reiter | Inhalt |
| :--- | :--- |
| 1 Übersicht | Die 14 Toleranzarten in vier Gruppen (Form, Richtung, Ort, Lauf) mit Symbol und Bezugsregel. Linien- und Flächenprofil erscheinen in drei Gruppen. |
| 2 Toleranzarten | Je Toleranzart vier Spalten: Symbol, Zeichnungseintrag, Toleranzzone, Abweichung. Darunter toleriertes Element, Zone, eingeschlossene Toleranzen, Prüfmittel und ein Hinweis. Merksatz je Gruppe. |
| 3 Toleranzrahmen | Rahmen zusammenstellen (Art, Wert, Ø, Ⓜ, bis zu drei Bezüge). Die Seite liest ihn in Worten vor und prüft typische Fehler: Bezug an einer Formtoleranz, fehlender Bezug bei Richtung und Lauf, Ø oder Ⓜ an der falschen Toleranzart, Bezugsbuchstaben I, O, Q, X, doppelte oder mehr als drei Bezüge. |
| 4 Grundsätze ISO 8015 | Die 13 Grundsätze aus Abschnitt 5 in eigenen Worten mit Praxisbezug. Dazu ein Rechner zur Unabhängigkeit gegenüber der Hüllbedingung Ⓔ an einer Welle Ø20 −0,1. |
| 5 Übung | Zufällige Aufgaben: Symbol erkennen, Gruppe zuordnen, Bezug nötig?, Zone erkennen, Toleranzrahmen auf Zulässigkeit prüfen. |

Direkteinstieg per Hash, z. B. `#toleranzarten/pos` oder `#rahmen`.

## Quellen

- DIN EN ISO 8015:2011-09, Abschnitt 5 (Grundsätze) — Wortlaut zusammengefasst, nicht zitiert
- DIN EN ISO 5459:2011, 7.2.2 (Bezugsbuchstaben I, O, Q, X nicht verwenden)
- DIN EN ISO 1101, ISO 2692 (Ⓜ), ISO 14405-1 (Ⓔ)
- B. Klein: Toleranzdesign im Maschinen- und Fahrzeugbau, 5. Aufl. 2021, Tab. 7.1 (14 Toleranzarten, Bezug erforderlich ja/nein)
- G. Henzold: Geometrical Dimensioning and Tolerancing for Design, Manufacturing and Inspection, 3rd ed 2021
- ZEISS: Poster GPS – Geometrische Produktspezifikation (VIII/2023)

Alle Zeichnungen sind eigene SVG-Darstellungen. Die Abweichungsbilder berechnen *f* aus dem gezeichneten Ist-Profil (Mindestzone in der vorgegebenen Richtung), die Krümmungen sind überhöht.

## Prüfen

```
node tests/verify.mjs                 # Daten, Regeln und alle 42 Zeichnungen (150 Prüfungen)
node tests/verify.mjs --sheet x.svg   # zusätzlich Vorschaubogen aller Zeichnungen
```

Keine Abhängigkeiten. Die Quellen in `js/` sind ES-Module; `index.html` lädt aber `js/bundle.js`, damit die Seite auch per Doppelklick (`file://`) läuft. Nach jeder Änderung in `js/` neu bauen:

```
node build.mjs
```
