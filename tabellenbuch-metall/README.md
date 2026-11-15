# Tabellenbuch Metall • Interactive Learning Models

Central hub and collection of interactive learning models for **Tabellenbuch Metall** (48th ed., Europa-Lehrmittel), cf. DIN 461, DIN ISO 128, and DIN EN ISO 80000-2.

Live at: **[https://xallace.github.io/tabellenbuch-metall/](https://xallace.github.io/tabellenbuch-metall/)**

## Included Book Pages & Modules

| Page | Chapter | Topic | Path |
| :--- | :--- | :--- | :--- |
| **p. 58** | K · 3.1 Diagrams | **Cartesian Coordinate System**: Point notations `P(x; y)` / `P(x \| y)` / `P(x, y)`, diagram structure per DIN 461 with fault-finding mode, zoomed range with/without origin, logarithmic speed scales ($n = v_\text{c} / (\pi \cdot d)$), and disc spring characteristic curve $F(s)$ (PCHIP vs. piecewise linear). | [`s58-diagramme/`](s58-diagramme/) |
| **p. 59** | K · 3.1 Diagrams | **Polar Coordinate Systems & Area Charts**: Elevated-temperature strength diagram ($R_\text{m}$, $R_\text{e}$ vs. $T$) with scattered data points, polar coordinate system ($360^\circ$ graduation, pole, $+\varphi$, $r$), roundness inspection of a turned bushing ($10\,\text{mm} \mathrel{\hat{=}} 5\,\mu\text{m}$, magnification $2000 : 1$), plus column, bar, and pie charts ($\text{CuZn36Pb3}$, $\alpha = 10.8^\circ$). | [`s59-polarkoordinaten/`](s59-polarkoordinaten/) |
| **p. 60** | K · 3.2 Basic Constructions | **Line Segments, Perpendiculars, Angles**: All 6 classic compass-and-straightedge constructions with step-by-step animation and geometric proofs: parallel to a line segment (rhombus $ACDP$), bisecting a segment ($r > \frac{1}{2}\,\overline{AB}$), dropping a perpendicular, erecting a perpendicular at point $P$ (Thales' theorem), bisecting an angle, and dividing a segment into $n = 5$ equal parts (intercept theorem). | [`s60-grundkonstruktionen/`](s60-grundkonstruktionen/) |
| **p. 61** | K · 3.2 Basic Constructions | **Tangents, Circular Arcs, Polygons**: 6 compass-and-straightedge constructions: tangent through circle point $P$ ($\overline{CD} \perp \overline{MP}$), tangent from external point $P$ to circle (Thales' theorem, $\triangle MTP$), corner fillet ($t = r/\tan(\alpha/2)$), connecting two circles via inner arc $R_\text{i}$ and outer arc $R_\text{a}$ (cam profile), Bion's universal regular polygon approximation ($n=3\dots 10$, pentagon 99.15 % accuracy), and hexagon/dodecagon in circumcircle with across-flats dimensioning per DIN EN ISO 4014. | [`s61-tangenten-vielecke/`](s61-tangenten-vielecke/) |
| **p. 62** | K · 3.2 Basic Constructions | **Incircle, Circumcircle, Ellipse, Spiral**: 6 constructions: triangle incircle (angle bisectors, foot of perpendicular, $r = A/s$), triangle circumcircle (perpendicular bisectors, $R = abc/4A$, Thales' theorem), finding the center of a circle (two chords $AB$ and $CD$ with perpendicular bisectors), two-circle ellipse construction (De La Hire's auxiliary circles with eccentricity $e = \sqrt{a^2-b^2}$), ellipse in parallelogram (axonometry & isometry per DIN ISO 5456-3), and 4-center spiral with $C^1$-continuous quarter-circle arcs ($s = a/4$). | [`s62-kreise-ellipse-spirale/`](s62-kreise-ellipse-spirale/) |
| **p. 14** | M · 1.2 Formulas | **Formulas, Equations, Diagrams**: Quantity equation for cutting speed ($v_\text{c} = \pi \cdot d \cdot n$) with units carried through the calculation, animated turning and milling views, numerical-value equation ($M = 9550 \cdot P / n$) with prescribed units, linear function ($y = m \cdot x + b$), and break-even analysis ($K_\text{G} = E$). | [`s14-formeln/`](s14-formeln/) |

## Automated Verification

```bash
node s14-formeln/tests/verify.js              # 49 checks against the values on p. 14
node s58-diagramme/tests/verify.js            # 41 checks against the values on p. 58
node s59-polarkoordinaten/tests/verify.js     # 52 checks against the values on p. 59
node s60-grundkonstruktionen/tests/verify.js  # 62 checks against the constructions on p. 60
node s61-tangenten-vielecke/tests/verify.js   # 24 checks against the constructions on p. 61
node s62-kreise-ellipse-spirale/tests/verify.js # 25 checks against the constructions on p. 62
```
