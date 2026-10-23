# Tabellenbuch Metall • Interaktive Lehrmodelle (S. 14, S. 58, S. 59, S. 60 & S. 61)

Zentrale Übersichtsseite und Sammlung interaktiver Lehrmodelle zum **Tabellenbuch Metall** (48. Auflage, Europa-Lehrmittel), vgl. DIN 461, DIN ISO 128 und DIN EN ISO 80000-2.

Live unter: **[https://xallace.github.io/tabellenbuch-metall/](https://xallace.github.io/tabellenbuch-metall/)**

## Enthaltene Buchseiten & Module

| Seite | Kapitel | Thema | Pfad |
| :--- | :--- | :--- | :--- |
| **S. 58** | K · 3.1 Diagramme | **Kartesisches Koordinatensystem**: Punkte `P(x; y)` / `P(x \| y)` / `P(x, y)`, Diagrammaufbau nach DIN 461 mit Fehlersuche, Ausschnitt mit/ohne Nullpunkt, logarithmische Drehzahlskalen ($n = v_\text{c} / (\pi \cdot d)$) und Tellerfeder-Kennlinie $F(s)$ (PCHIP vs. Polygonzug). | [`s58-diagramme/`](s58-diagramme/) |
| **S. 59** | K · 3.1 Diagramme | **Polarkoordinatensysteme & Flächendiagramme**: Warmfestigkeitsdiagramm ($R_\text{m}$, $R_\text{e}$ über $T$) mit streuenden Messwerten, Polarkoordinatensystem ($360^\circ$-Teilung, Pol, $+\varphi$, $r$), Rundheitsprüfung einer gedrehten Buchse ($10\,\text{mm} \mathrel{\hat{=}} 5\,\mu\text{m}$, Vergrößerung $2000 : 1$) sowie Säulen-, Balken- und Kreisflächendiagramme ($\text{CuZn36Pb3}$, $\alpha = 10{,}8^\circ$). | [`s59-polarkoordinaten/`](s59-polarkoordinaten/) |
| **S. 60** | K · 3.2 Grundkonstruktionen | **Strecken, Lote, Winkel**: Alle 6 klassischen Zirkel- und Linealkonstruktionen mit Schritt-Animation und geometrischen Beweisen: Parallele zu einer Strecke (Raute $ACDP$), Halbieren einer Strecke ($r > \frac{1}{2}\,\overline{AB}$), Fällen eines Lotes, Errichten einer Senkrechten im Punkt $P$ (Satz des Thales), Winkelhalbierende sowie Streckenteilung in $n = 5$ gleiche Teile (Strahlensatz). | [`s60-grundkonstruktionen/`](s60-grundkonstruktionen/) |
| **S. 61** | K · 3.2 Grundkonstruktionen | **Tangenten, Kreisbögen, Vielecke**: 6 Zirkel- und Linealkonstruktionen: Tangente durch Kreispunkt $P$ ($\overline{CD} \perp \overline{MP}$), Tangente von äußerem Punkt $P$ an Kreis (Satz des Thales, $\triangle MTP$), Rundung am Winkel ($t = r/\tan(\alpha/2)$), Verbindung zweier Kreise durch Innenbogen $R_\text{i}$ und Außenbogen $R_\text{a}$ (Nockenkontur), Universalkonstruktion für regelmäßige Vielecke nach Bion ($n=3\dots 10$, Fünfeck 99,15 % Genauigkeit) sowie Sechseck/Zwölfeck im Umkreis mit Schlüsselweiten nach DIN EN ISO 4014. | [`s61-tangenten-vielecke/`](s61-tangenten-vielecke/) |
| **S. 14** | M · 1.2 Formeln | **Formeln, Gleichungen, Diagramme**: Größengleichung Schnittgeschwindigkeit ($v_\text{c} = \pi \cdot d \cdot n$) mit 2D-Zerspanungkinematik, hergeleitete Zahlenwertgleichung ($M = 9550 \cdot P / n$), lineare Funktionen ($y = m \cdot x + b$) und Break-Even-Kostenkalkulation ($K_\text{G} = E$). | [`s14-formeln/`](s14-formeln/) |

## Automatisierte Prüfungen

```bash
node s58-diagramme/tests/verify.js          # 41 Prüfungen gegen die Buchwerte von S. 58
node s59-polarkoordinaten/tests/verify.js   # 52 Prüfungen gegen die Buchwerte von S. 59
node s60-grundkonstruktionen/tests/verify.js # 62 Prüfungen gegen die Konstruktionen von S. 60
node s61-tangenten-vielecke/tests/verify.js  # 24 Prüfungen gegen die Konstruktionen von S. 61
```
