# Tabellenbuch Metall • S. 62: Inkreis, Umkreis, Kreismittelpunkt, Ellipse, Spirale

Interaktives Lehrmodell und geometrischer Konstruktionsassistent zu **Tabellenbuch Metall** (48. Auflage, Europa-Lehrmittel), Kapitel 3.2 *Geometrische Grundkonstruktionen* (S. 62):

1. **Inkreis eines Dreiecks**: Winkelhalbierende $w_\alpha$ und $w_\beta$, Schnittpunkt $M$, Lotfußpunkte, Inkreisradius $r = A_\triangle / s$.
2. **Umkreis eines Dreiecks**: Mittelsenkrechte auf $AB$ und $BC$, Schnittpunkt $M$, Umkreisradius $R = \frac{a \cdot b \cdot c}{4 A_\triangle}$, Satz des Thales und Lage von $M$ bei spitz-, recht- und stumpfwinkligen Dreiecken.
3. **Bestimmung des Kreismittelpunktes**: Zwei beliebige Sehnen $AB$ und $CD$, Konstruktion der Mittelsenkrechten, Bestimmung von $M$ mit Werkstatthinweisen zum optimalen Schnittwinkel.
4. **Ellipsenkonstruktion aus zwei Kreisen (Scheitelkreismethode)**: Großer und kleiner Kreis um $M$ ($d = AB, d = CD$), Strahlen durch $M$ mit Schnittpunkten $E$ und $F$, Parallelen zu den Hauptachsen, Brennpunkte $F_1, F_2$ und Exzentrizität $e = \sqrt{a^2 - b^2}$.
5. **Ellipsenkonstruktion in einem Parallelogramm**: Affine Konstruktion für axonometrische Schrägbilder (Isometrie und Dimetrie nach DIN ISO 5456-3) mittels Teilung in 1, 2, 3 und Übertragung über Hilfshalbkreis mit $r = MC$.
6. **Spirale (Näherungskonstruktion mit dem Zirkel)**: 4-Zentren-Archimedische Spirale mit Zentralquadrat $s = a/4$, tangential stetige Viertelkreisbögen ($C^1$-Übergänge), Radienfolge $r_k = k \cdot a/4$ und Ganghöhe $a$.

## Automatisierte Verifikation

Alle mathematischen Algorithmen und Konstruktionen sind mit Node.js verifiziert:

```bash
node tests/verify.js
```

## Features

- **Schritt-für-Schritt-Player**: Jeder Konstruktionsschritt (0 bis 6) kann manuell oder per automatischer Animation durchlaufen werden.
- **Interaktive Ziehpunkte**: Dreiecksecken $A, B, C$ können frei im Canvas gezogen werden.
- **Blueprint-Modus**: Umschaltbar zwischen hellem Königsblau-Design und kontrastreichem Blueprint-Dunkelmodus.
- **Diagnose-Übungen**: Integriertes Quiz mit dynamischen Berechnungs- und Konstruktionsfragen.
- **Keine Abhängigkeiten**: Pure Vanilla JS, SVG und CSS ohne externe Bibliotheken.
