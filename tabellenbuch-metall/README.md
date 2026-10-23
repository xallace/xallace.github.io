# Tabellenbuch Metall • Interaktive Lehrmodelle (S. 14, S. 58 & S. 59)

Zentrale Übersichtsseite und Sammlung interaktiver Lehrmodelle zum **Tabellenbuch Metall** (48. Auflage, Europa-Lehrmittel), vgl. DIN 461 und DIN EN ISO 80000-2.

Live unter: **[https://xallace.github.io/tabellenbuch-metall/](https://xallace.github.io/tabellenbuch-metall/)**

## Enthaltene Buchseiten & Module

| Seite | Kapitel | Thema | Pfad |
| :--- | :--- | :--- | :--- |
| **S. 58** | K · 3.1 Diagramme | **Kartesisches Koordinatensystem**: Punkte `P(x; y)` / `P(x \| y)` / `P(x, y)`, Diagrammaufbau nach DIN 461 mit Fehlersuche, Ausschnitt mit/ohne Nullpunkt, logarithmische Drehzahlskalen ($n = v_\text{c} / (\pi \cdot d)$) und Tellerfeder-Kennlinie $F(s)$ (PCHIP vs. Polygonzug). | [`s58-diagramme/`](s58-diagramme/) |
| **S. 59** | K · 3.1 Diagramme | **Polarkoordinatensysteme & Flächendiagramme**: Warmfestigkeitsdiagramm ($R_\text{m}$, $R_\text{e}$ über $T$) mit streuenden Messwerten, Polarkoordinatensystem ($360^\circ$-Teilung, Pol, $+\varphi$, $r$), Rundheitsprüfung einer gedrehten Buchse ($10\,\text{mm} \mathrel{\hat{=}} 5\,\mu\text{m}$, Vergrößerung $2000 : 1$) sowie Säulen-, Balken- und Kreisflächendiagramme ($\text{CuZn36Pb3}$, $\alpha = 10{,}8^\circ$). | [`s59-polarkoordinaten/`](s59-polarkoordinaten/) |
| **S. 14** | M · 1.2 Formeln | **Formeln, Gleichungen, Diagramme**: Größengleichung Schnittgeschwindigkeit ($v_\text{c} = \pi \cdot d \cdot n$) mit 2D-Zerspanungkinematik, hergeleitete Zahlenwertgleichung ($M = 9550 \cdot P / n$), lineare Funktionen ($y = m \cdot x + b$) und Break-Even-Kostenkalkulation ($K_\text{G} = E$). | [`s14-formeln/`](s14-formeln/) |

## Automatisierte Prüfungen

```bash
node s58-diagramme/tests/verify.js        # 41 Prüfungen gegen die Buchwerte von S. 58
node s59-polarkoordinaten/tests/verify.js # 52 Prüfungen gegen die Buchwerte von S. 59
```
