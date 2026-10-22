# Polarkoordinatensysteme, Flächendiagramme – Tabellenbuch Metall S. 59

Interaktive Lernhilfe zur Seite 59 „3.1 Diagramme – Polarkoordinatensysteme, Flächendiagramme“ aus
Tabellenbuch Metall, 48. Auflage (Europa-Lehrmittel), vgl. DIN 461 (1973-03) und DIN EN ISO 80000-2 (2013-08).
Texte und Grafiken sind eigenständig erstellt. Aus dem Buch stammen die Regeln (sinngemäß)
und die Beispielwerte (Warmfestigkeitsdiagramm $R_\text{m}/R_\text{e}$, Maßstab $10\,\text{mm} \mathrel{\hat{=}} 5\,\mu\text{m}$ der Rundheitsprüfung, Säulendiagramm 2013–2016, Kreisflächendiagramm $65/25/5/5\,\%$ sowie Legierung $\text{CuZn36Pb3}$ mit $3\,\%$ Blei $\to \alpha = 10{,}8^\circ$).

Das Buch nennt zu den Diagrammen keine Zahlen. Diese Werte sind deshalb aus der Abbildung abgelesen:

- Messwerte $R_\text{m}$ und $R_\text{e}$ bei 0 … 600 °C, auf etwa ± 10 N/mm² genau.
- Säulen 2013–2016: 3,4 / 2,7 / 2,2 / 3,7 Mio €, auf etwa ± 0,05 Mio € genau.
- Rundheits-Messschrieb: aus dem Bild digitalisiert und als Fourier-Reihe (Harmonische 2 … 5) nachgebildet. Er hat die Dreiecksform eines Dreibackenfutters mit Erhebungen bei etwa 90°, 210° und 330°.

Nicht aus dem Buch stammen die dritte Kennlinie $R_\text{e2}$ (□, erfundener Werkstoff 2) sowie die Vorlagen CuSn8 und CuNi18Zn20.

`index.html` per Doppelklick öffnen. Die App braucht keinen Server, keine Bibliotheken und kein Netz
(klassische Skripte, SVG).

## Reiter

| Reiter | Inhalt |
|---|---|
| 1 Mehrere Kennlinien | Warmfestigkeitsdiagramm (Festigkeit $R_\text{m}$, $R_\text{e}$ in $\text{N/mm}^2$ über Temperatur $T$ in $^\circ\text{C}$) mit stark streuenden Messwerten ($\times$, $\bigcirc$, optional 3. Kennlinie $R_\text{e2}$ eines zweiten Werkstoffs mit $\square$). Umschalten zwischen Farb-/Formelzeichen-Kennzeichnung und Linienarten nach DIN 461 (Volllinie, Strichlinie, Strichpunktlinie), Ausgleichskurve, Streuband oder ungeglättetem Linienzug. Messpunkte sind im Diagramm senkrecht ziehbar; Ableseübung mit Toleranz. |
| 2 Polarkoordinaten | Polarkoordinatensystem mit $360^\circ$-Teilung, Nullpunkt (Pol), Winkelzuordnung ($0^\circ$ rechts waagrecht), positivem Winkelabtrag $+\varphi$ entgegen dem Uhrzeigersinn, Radius $r$ und konzentrischen Kreisen. Punkte ziehen, per Klick setzen oder als `P(r; φ)` eintippen; einblendbares kartesisches Stützdreieck ($x = r \cdot \cos\varphi$, $y = r \cdot \sin\varphi$) und Übung mit Fehlerdiagnose (Drehsinn / $0^\circ$-Lage). |
| 3 Rundheitsprüfung | Polardiagramm einer Rundheitsmessmaschine im Maßstab $10\,\text{mm} \mathrel{\hat{=}} 5\,\mu\text{m}$ (Vergrößerung $2000 : 1$). Simulation der Unrundheit einer gedrehten Buchse durch zu starkes Spannen im Backenfutter (Buchbeispiel, 2-Backen-Ovalität, 3-Backen-Gleichdick, 4-Backenfutter): Nach dem Ausspannen hat die Bohrung an jeder Backe eine Erhebung. Mit einstellbarer Spannverformung, Toleranzband der Breite $t$ (mittig zwischen größter und kleinster Abweichung), drehbarem Messtaster und Maßstabs-/Ableseübung. |
| 4 Flächendiagramme | Kreisflächendiagramm mit Mittelpunktswinkel $\alpha = \frac{360^\circ \cdot x\,\%}{100\,\%}$ (Buchbeispiel Legierung $\text{CuZn36Pb3}$ mit $\text{Pb} = 3\,\% \to 10{,}8^\circ$, $\text{Zn} = 36\,\% \to 129{,}6^\circ$, $\text{Cu} = 61\,\% \to 219{,}6^\circ$ sowie $65/25/5/5\,\%$), ziehbare Sektorgrenzen, editierbare Tabelle, Säulen-/Balkendiagramm „Umsatz in Mio € (2013–2016)“ zum Ziehen und Umschalten sowie Rechenübungen. |

Oben rechts: „← S. 58“ wechselt zur Schwester-App der vorangehenden Buchseite,
„Buchwerte laden“ setzt alle Reiter auf die Beispiele von Seite 59 zurück,
Das dunkle Blueprint-Design ist Standard. „Heller Modus“ schaltet auf das helle Design um; die Wahl wird im Browser gespeichert, `?theme=light` bzw. `?theme=dark` erzwingt eines der beiden.
Reiter sind per Adresse erreichbar: `#kennlinien`, `#polar`, `#rundheit`, `#flaechen`.

## Prüfung

```
node tests/verify.js                      # Rechenkern: 52 Prüfungen gegen die Buchwerte von S. 59
node tests/screenshots.js <ausgabeordner> # Headless-Edge: Zustände aus tests/steps.json als PNG
```

## Aufbau

```
index.html, style.css
js/core.js            Zahlenformat, PCHIP, Streuung, Polarkoordinaten, Rundheitsmaßstab, Mittelpunktswinkel
js/svg.js             SVG-Hilfen: Text mit *kursiv*/_{tief}/^{hoch}, Pfeile, Marker (○, ×, □), Kreisbögen & Sektoren
js/ui.js              Segmentschalter, Rückmeldungen, Register der Reiter
js/tab-kennlinien.js  Reiter 1: Diagramme mit mehreren Kennlinien & streuenden Messwerten
js/tab-polar.js       Reiter 2: Polarkoordinatensystem (360°-Teilung, Pol, +φ, r)
js/tab-rundheit.js    Reiter 3: Beispiel Rundheitsprüfung einer gedrehten Buchse (10 mm ≙ 5 µm)
js/tab-flaechen.js    Reiter 4: Säulen-/Balkendiagramm und Kreisflächendiagramm (Mittelpunktswinkel α)
js/app.js             Reiterwechsel per Hash, Design, Buchwerte
tests/                verify.js, screenshots.js, steps.json
```
