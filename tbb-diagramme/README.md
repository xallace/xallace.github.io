# Diagramme – Tabellenbuch Metall S. 58

Interaktive Lernhilfe zur Seite 58 „3.1 Diagramme – Kartesisches Koordinatensystem“ aus
Tabellenbuch Metall, 48. Auflage (Europa-Lehrmittel), vgl. DIN 461 und DIN EN ISO 80000-2.
Texte und Grafiken sind eigenständig erstellt. Aus dem Buch stammen nur die Regeln (sinngemäß)
und die Beispielwerte (P1, P2, Tellerfeder-Tabelle, Ablesestelle s = 0,9 mm).

`index.html` per Doppelklick öffnen. Die App braucht keinen Server, keine Bibliotheken und kein Netz
(klassische Skripte, SVG).

## Reiter

| Reiter | Inhalt |
|---|---|
| 1 Koordinatensystem | Punkte ziehen, per Klick hinzufügen oder eintippen (`P3(−1,5; 2)`, `Q(2 \| −1)`, `P(3,5, 1,5)`). Anzeige in allen drei Schreibweisen, Quadrant, Weg vom Nullpunkt (erst x, dann y). Pfeilspitzen oder Pfeile parallel zu den Achsen. Übung „Punkt setzen“ und „Ablesen“ mit Diagnose (x/y vertauscht, Vorzeichen falsch). |
| 2 Diagrammaufbau | σ-ε-Diagramm mit den Beschriftungen der Buchseite. Regel antippen: das Element leuchtet auf. Umschalten zwischen Pfeilspitzen und parallelen Pfeilen, Einheit zwischen den Zahlen oder hinter dem Formelzeichen, Liniengruppe 1 : 2 : 4. „Fehler finden“ baut 2–3 von 7 Regelverstößen ein. |
| 3 Ausschnitt & Skalen | Wärmedehnung eines 1000-mm-Stabs mit und ohne Nullpunkt nebeneinander; Drehzahl n = vc/(π·d) wahlweise linear oder logarithmisch geteilt, mit Ablesung unter dem Mauszeiger. |
| 4 Federkennlinie | Buchtabelle editierbar, Punkte ziehbar. Kennlinie als glatte Kurve oder Polygonzug, Ablesung F aus s oder s aus F über Punkt A, Tangente und Federrate in A, Ableseübung mit Toleranz. |

Oben rechts: „Buchwerte laden“ setzt alle Reiter auf die Beispiele der Seite zurück,
Das dunkle Blueprint-Design ist Standard. „Heller Modus“ schaltet auf das helle Design um; die Wahl wird im Browser gespeichert, `?theme=light` bzw. `?theme=dark` erzwingt eines der beiden.
Reiter sind per Adresse erreichbar: `#koordinaten`, `#aufbau`, `#skalen`, `#feder`.

## Annahmen und Abweichungen

- **Formelzeichen der Ordinate:** Das Buch druckt in beiden σ-ε-Bildern *δ*. Einheit N/mm² und
  Abszisse *ε* sprechen für die Spannung *σ*; die App verwendet *σ* und weist darauf hin.
- **Federkennlinie:** Das Buch zieht die Kennlinie freihand und liest *F* ≈ 1250 N ab. Die App bietet
  - eine monotone kubische Interpolation (Fritsch–Carlson, Steigungen wie `scipy.interpolate.PchipInterpolator`): 1245,9 N, gerundet 1250 N;
  - den Polygonzug: 1225 N.

  Die Differenz ist gewollt sichtbar: Das Ablesen hängt davon ab, wie die Kennlinie zwischen den Messpunkten verläuft.
- **σ-ε-Kurve in Reiter 2:** Beispielkurve σ = 140 N/mm² · tanh(ε / 0,16 %) ohne Werkstoffbezug.
- **Ausdehnungskoeffizienten in Reiter 3:** Stahl ≈ 12, Kupfer ≈ 16,5, Aluminium ≈ 23,5 · 10⁻⁶/K sind gerundete
  Richtwerte, nicht aus dem Tabellenbuch übernommen.
- **Linienbreiten:** Die Liniengruppen 0,18/0,35/0,7, 0,25/0,5/1 und 0,35/0,7/1,4 mm sind Beispiele für das
  Verhältnis 1 : 2 : 4. Am Bildschirm stimmt nur das Verhältnis.
- **Komma-Schreibweise:** Bei Dezimalkomma ist `P(x, y)` nur mit Leerzeichen nach dem trennenden Komma eindeutig.
  `P(1,5,2)` lehnt die Eingabe als mehrdeutig ab.

## Prüfung

```
node tests/verify.js                     # Rechenkern: 41 Prüfungen, u. a. F(0,9 mm) = 1245,9 N bzw. 1225 N
node tests/screenshots.js <ausgabeordner> # Headless-Edge: Zustände aus tests/steps.json als PNG
```

`screenshots.js` legt je Lauf ein Edge-Profil `%TEMP%\edge-shot-*` an; danach löschen.

## Aufbau

```
index.html, style.css
js/core.js            Zahlenformat (Dezimalkomma, Minuszeichen), Punkt-Schreibweisen, Skalen, PCHIP, Umkehrung
js/svg.js             SVG-Hilfen: Text mit *kursiv*/_{tief}/^{hoch}, Pfeile, Ziehen
js/ui.js              Segmentschalter, Rückmeldungen, Register der Reiter
js/tab-*.js           je ein Reiter
js/app.js             Reiterwechsel per Hash, Design, Buchwerte
tests/                verify.js, screenshots.js, steps.json
```
