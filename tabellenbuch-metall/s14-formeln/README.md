# Formeln, Gleichungen, Diagramme – Tabellenbuch Metall S. 14

Interaktive Lernhilfe zur Seite 14 „1.2 Formeln“ aus Tabellenbuch Metall, 48. Auflage
(Europa-Lehrmittel), Kapitel Technische Mathematik. Texte und Grafiken sind eigenständig erstellt.
Aus dem Buch stammen nur die Regeln (sinngemäß) und die Beispielwerte (vc mit d = 200 mm,
n = 630/min; M mit P = 15 kW, n = 750/min; y = 0,5 · x + 1; KG = 60 €/Stck · M + 200 000 €,
E = 110 €/Stck · M).

`index.html` per Doppelklick öffnen. Die App braucht keinen Server, keine Bibliotheken und kein Netz
(klassische Skripte, Formelsatz in HTML, SVG).

## Reiter

| Reiter | Inhalt |
|---|---|
| 1 Formeln | Größengleichung vc = π · d · n, gesucht vc, n oder d. d in mm, cm oder m, n in 1/min oder 1/s; der Rechengang zeigt jede Umrechnung als Bruch (1 m / 1000 mm, 1 min / 60 s). Drehen oder Fräsen als bewegtes Bild (50-fach verlangsamt) mit Umfang und Weg je Minute. Bestandteile einer Formel antippen: Formelzeichen, Operatoren, Konstanten oder Zahlen leuchten im Rechengang auf. Übung mit Diagnose „um den Faktor 1000 daneben“. |
| 2 Zahlenwertgleichungen | M = 9550 · P / n, gesucht M, P oder n. Schalter „P eingesetzt in W (falsch)“ zeigt das 1000-fach zu große Ergebnis. M-n-Hyperbel bei konstanter Leistung mit ziehbarem Betriebspunkt A, Tabelle der vorgeschriebenen Einheiten, Herleitung von 9550 aus M = P / (2π · n), Vergleich Größen- und Zahlenwertgleichung. Übung mit W-Falle. |
| 3 Lineare Funktion | y = m · x + b mit ziehbaren Punkten B(0 \| b) und P(1 \| b + m), Steigungsdreieck, Maß b, Nullstelle. Wertetabelle wie im Buch, x-Werte änderbar. Übung „Gerade ablesen“ mit Diagnose (Vorzeichen, Δx und Δy vertauscht). |
| 4 Kosten & Gewinnschwelle | Gesamtkosten durchgezogen, Erlös gestrichelt wie im Buch, Verlust- und Gewinnfläche, Gewinnschwelle mit Ablesung, Menge M per Klick oder Ziehen. Variablen der Buchlegende antippen: das Element leuchtet im Diagramm auf. Wertetabelle für M = 0, Gs und M, Rechengang für die Gewinnschwelle. Szenarien Buchbeispiel, Drehteil, Spritzgussteil, Stanzteil. Übung zu Gewinnschwelle und Ergebnis. |

Oben rechts: „Buchwerte laden“ setzt alle Reiter auf die Beispiele der Seite zurück.
Das dunkle Blueprint-Design ist Standard. „Heller Modus“ schaltet auf das helle Design um; die Wahl wird im Browser gespeichert, `?theme=light` bzw. `?theme=dark` erzwingt eines der beiden.
Reiter sind per Adresse erreichbar: `#formeln`, `#zahlenwert`, `#linear`, `#kosten`. Die Adressen der
Vorversion (`#tab-overview`, `#tab-vc`, `#tab-torque`, `#tab-linear`, `#tab-breakeven`, `#tab-quiz`, `#tab-book`) führen auf den passenden Reiter.

## Annahmen und Abweichungen

- **Erlösfunktion:** Das Buch druckt „E = E/Stück · M“. Die App übernimmt diese Schreibweise; gemeint ist der Erlös je Stück mal Menge.
- **Szenarien Drehteil, Spritzgussteil, Stanzteil:** frei gewählte Zahlenbeispiele, nicht aus dem Buch. Die App kennzeichnet sie so.
- **9550:** Der exakte Faktor ist 60 000 / (2π) = 9549,297. Die App rechnet wie das Buch mit 9550 und zeigt den exakten Wert und die Abweichung (+0,0074 %) daneben.
- **Gegenüber der Vorversion entfallen:** die Werkstoff-Richtwerte für vc (Quelle nicht belegt), die Übersichtstafel und der eigene Übungsreiter. Jeder Reiter hat jetzt seine eigene Übung.

## Prüfung

```
node tests/verify.js                     # Rechenkern: 49 Prüfungen, u. a. 395,84 m/min, 191 N · m, Gs = 4000 Stück
node tests/screenshots.js <ausgabeordner> # Headless-Edge: Zustände aus tests/steps.json als PNG
```

`screenshots.js` legt je Lauf ein Edge-Profil `%TEMP%\edge-shot-*` an; danach löschen.

## Aufbau

```
index.html, style.css
js/core.js            Zahlenformat (Dezimalkomma, Minuszeichen, Tausender), Eingabe lesen, Skalen, Formeln der Seite
js/svg.js             SVG-Hilfen: Text mit *kursiv*/_{tief}/^{hoch}, Pfeile, Ziehen
js/ui.js              Segmentschalter, Rückmeldungen, Formelsatz (Bruch, Rechengang), Register der Reiter
js/tab-*.js           je ein Reiter
js/app.js             Reiterwechsel per Hash, Design, Buchwerte
tests/                verify.js, screenshots.js, steps.json
```
