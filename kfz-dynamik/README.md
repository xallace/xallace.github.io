# KfzDyn – Dynamik der Kraftfahrzeuge

Web-App zum Ausprobieren der Rechenmodelle aus
M. Mitschke, H. Wallentowitz: *Dynamik der Kraftfahrzeuge*, 5. Auflage, Springer Vieweg 2014.
Ein Reiter je Buchteil, alles auf Deutsch. Gleichungsnummern und Seitenzahlen beziehen sich auf diese Auflage.

Live: <https://xallace.github.io/kfz-dynamik/>

Die App setzt die Gleichungen des Buchs um, übernimmt aber weder Texte noch Abbildungen. Einige Kurven sind aus
Diagrammen abgelesen (siehe unten).

## Start

`index.html` im Browser öffnen, auch direkt per `file://`. Alle Skripte sind klassische Skripte ohne ES-Module,
three.js und KaTeX liegen lokal unter `vendor/`. Nur die Schriften Inter und JetBrains Mono kommen von Google Fonts;
ohne Netz fällt die Seite auf Systemschriften zurück.

Der Reiter lässt sich über die Adresse wählen: `index.html#reifen`, `#fahrleistung`, `#bremsung`, `#schwingung`,
`#fahrverhalten`, `#pruefung`.

## Inhalt

| Reiter | Buch | Inhalt |
|---|---|---|
| I Reifen | Kap. 2, Abb. 2.1, 2.44, Tab. 2.3 | 3D-Ansicht Rad/Fahrbahn mit Koordinatensystemen, Winkeln, Kräften und Mz (Kräfte auf das Rad oder auf die Fahrbahn); HSRI-Modell: Fx(Sx), Fy(α), Kraftschlussdiagramm, Mz(α) |
| II Fahrleistungen | Kap. 5, 7, Abb. 7.1, 7.10, 7.11 | Zugkraft- und Leistungsschaubild, Motorkennlinie, ẍ/g je Gang, Beschleunigung aus dem Stand, vmax, Steigfähigkeit |
| II Bremsung | Kap. 9, Abb. 9.4, 9.9, 9.13, Tab. 9.1 | ideale und feste Bremskraftverteilung, Blockiergrenzen, Kraftschlussbeanspruchung, Gütegrad, Anhalteweg |
| III Schwingungen | Kap. 11–13, Tab. 13.1, Abb. 13.2, 13.12 | Viertelfahrzeug mit Sitz-Mensch: Vergrößerungsfunktionen, bewertete Spektren, K-Werte, Konfliktschaubild, Animation auf Zufallsstraße |
| IV Fahrverhalten | Kap. 20–22, Tab. 21.7, 22.4 | lineares Einspurmodell mit Lenkungselastizität: Kreisfahrt, vch/vkrit, Eigenfrequenz und Dämpfung, Lenkeingaben mit Draufsicht-Animation, Frequenzgang |
| Prüfung & Quellen | – | Vergleich mit den Zahlenbeispielen des Buchs, Unstimmigkeiten, Annahmen, Lizenzen |

## Aufbau

```
index.html, style.css
js/engine/   Rechenkerne ohne DOM, laufen auch in Node
  core.js        komplexe Zahlen, Gleichungslöser, Interpolation, Runge-Kutta, Zufallszahlen
  reifen.js      HSRI-Reifenmodell (Tab. 2.3)
  laengs.js      Fahrwiderstände, Zugkraft, Fahrleistungen
  bremsung.js    Bremskraftverteilung, Anhalteweg
  schwingung.js  Dreimassensystem, Unebenheitsspektrum, K-Werte, Zeitsimulation
  einspur.js     Einspurmodell
  data.js        Beispielfahrzeuge aus Tab. 13.1, 21.7, Straßenklassen Tab. 11.5, Reaktionsdauern Tab. 9.1, Messpunkte Abb. 2.44
  pruefung.js    Prüfliste gegen das Buch
tests/       verify.js (Rechenkerne gegen das Buch), screenshots.js (Oberfläche im Headless-Edge)
js/ui/       chart.js (Canvas-Diagramme), controls.js (Regler, Kennwerte, Formeln), reifen3d.js (three.js)
js/tabs/     ein Modul je Reiter, wird erst beim ersten Öffnen aufgebaut
js/app.js    Reiterverwaltung
```

## Prüfung

```
node tests/verify.js
```

Oberfläche: `tests/screenshots.js` rendert alle Reiter im Headless-Edge, meldet Konsolenfehler und horizontalen
Überlauf (Aufruf im Dateikopf).

Stand 21.10.2026: 57 bestanden, 0 fehlgeschlagen, 10 bekannte Abweichungen. Dieselbe Liste zeigt der Reiter
„Prüfung & Quellen“. Beispiele: Anhalteweg aus 80 km/h 59,79 m (Buch 59,7), vmax 39,5 m/s (≈ 40), 0–100 km/h 18,2 s (18),
σF 256,9 N (257), alle SQ und vch aus Tab. 21.7, Überschwingen Fzg. 1 7,9 % (8,9 %).

### Unstimmigkeiten im Buch

- S. 218: Anhaltedauer gedruckt 4,4 s, Gl. (9.19a) mit den Beispielzahlen ergibt 4,6 s.
- Tab. 2.3: Haftbereich Fx = cx·Sx ist linearisiert und springt bei s̄R = 0,5; hier mit Faktor 1/(1 − Sx) gerechnet.
- Tab. 2.3: nx im Teilgleitbereich hat Fy/cy in der mit lL·tan α multiplizierten Klammer (Einheit falsch); hier außerhalb.
- Abb. 13.2 i/k/l passen untereinander nicht; K Fuß 7,6 statt 5,9, damit Kges 25,6 statt ≈ 23,6.
- Bewertungsfunktionen Abb. 12.7 und Abb. 13.2 unterscheiden sich unter 2 Hz um 30–50 %. Standard ist Abb. 13.2.

### Annahmen

- Reifen 205/60 R 15: μ01 = 1,17, kR = 0,32, a = 0,09 s/m an Abb. 2.44 angepasst (Messgeschwindigkeit 60 km/h angenommen);
  cα(Fz) in der Form von Abb. 2.37, skaliert auf 50 kN/rad bei 4 kN; cγ = 0,1·cα geschätzt. Maximum Fx 4,15 kN statt 4,83 kN gemessen.
- Bremsung: φ = 0,76 aus den Zahlen auf S. 227 erschlossen.
- Fahrleistungen: Weg 0–100 km/h 311 m, das Buch nennt „ungefähr 280 m“.
- Schwingungen: statische Radlast aus den Massen; Straßenprofil der Animation aus 200 Kosinuswellen mit Zufallsphasen.
- Einspurmodell: Tψ̇max und Überschwingen von Fzg. 2 und 7 liegen bis 15 % neben Tab. 22.4, Ursache offen.

### Abgelesene Kurven

- Volllast-Drehmoment aus Abb. 7.1c
- Bewertungsfunktionen B(f): Sitz und Fuß aus Abb. 13.2 f/k, Sitz, Fuß und Hand aus Abb. 12.7 b–d
- Messpunkte Fx(Sx) und Fy(α) aus Abb. 2.44

## Lizenzen

- three.js r128, MIT-Lizenz (`vendor/three/LICENSE`)
- KaTeX 0.16.8, MIT-Lizenz (`vendor/katex/LICENSE`)
