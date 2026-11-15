# Basic Geometric Constructions: Tangents, Arcs, Polygons – Tabellenbuch Metall p. 61

Interactive study and simulation companion to page 61, "3.2 Basic Geometric Constructions – Tangents, Circular Arcs, Polygons" from
**Mechanical & Metal Trades Handbook (Tabellenbuch Metall)**, 48th edition (Europa-Lehrmittel), Section **K** (Engineering Drawing / Technical Communication).
All texts, explanations, mathematical calculation cores, and vector graphics were authored independently; the six classical compass-and-straightedge constructions and their numbering follow the handbook.

Open `index.html` by double-clicking it. The application requires no web server, no external libraries, and no internet connection (zero dependencies).

---

## The 6 Tabs (Basic Constructions)

| Tab | Basic Construction (p. 61) | Interactive Features & Geometric Core |
| :--- | :--- | :--- |
| **1 Tangent at P** (`#tangente-p`) | **Tangent through circle point P** ($P$ on circle) | Extend radial line $\overline{MP}$, symmetric auxiliary circle around $P$ of radius $r_1 \to A, B$, and perpendicular bisector $CD$ with $r_2 > r_1$. Draggable tangency point $P$ on the circle, orthogonality verification ($\overline{CD} \perp \overline{MP}$, $90.0^\circ$). |
| **2 Tangent from P** (`#tangente-aussen`) | **Tangent from external point P to circle** ($P$ outside) | Bisect $\overline{MP} \to A$, Thales circle around $A$ of radius $r = \overline{AM} = \frac{1}{2}\,\overline{MP}$. Intersection $T$ yields tangent $\overline{PT}$. Thales' theorem ($\angle MTP = 90^\circ$), Pythagorean check $R^2 + L^2 = \overline{MP}^2$, freely draggable point $P$, toggle both tangents ($T$ and $T'$). |
| **3 Corner Fillet** (`#rundung-winkel`) | **Rounding an angle** (fillet with radius $r$) | Parallels to the angle legs at offset distance $r \to$ center $M$. Perpendiculars from $M$ onto the legs $\to$ tangency points $C$ and $D$. Smooth tangential transition ($C^1$). Adjustable angle $\alpha$ ($30^\circ\dots 145^\circ$), tangent length $t = r / \tan(\alpha/2)$, vertex offset $SM = r / \sin(\alpha/2)$, kite proof. |
| **4 Circle Blend** (`#kreisverbindung`) | **Connecting two circles with circular arcs** | Concave fillet with inner radius $R_i$ (arcs $R_i + r_1$, $R_i + r_2 \to A$) and convex envelope with outer radius $R_a$ (arcs $R_a - r_1$, $R_a - r_2 \to D$). Tangency points $B, C, E, F$ on centerlines (collinearity). Toggleable full blend contour (cam, flange, and connecting-rod profile). |
| **5 Polygon in Circle** (`#vieleck-umkreis`) | **Regular polygon inscribed in a circle** (e.g., pentagon) | Bion's general construction: divide vertical diameter $\overline{AB}$ into $n$ equal parts (per p. 60). Arc of radius $r = \overline{AB}$ centered at $A \to$ pole points $C, D$ at distance $R\sqrt{3}$. Rays through odd division marks (for odd $n$) or even marks (for even $n$). Selectable side count $n \in \{3\dots 10\}$; 99.15% accuracy for pentagon, 100% for hexagon. |
| **6 Hexagon, Dodecagon** (`#sechseck-zwoelfeck`) | **Inscribed hexagon & dodecagon** | Strike arcs around $A$ and $B$ with unchanged compass radius $r = d/2 \to$ exact hexagon ($s = r$). Additional center strikes at $C$ and $D$ for dodecagon ($30^\circ$ spacing). Engineering dimensions: width across flats $AF = d\frac{\sqrt{3}}{2}$ for hex bolts (DIN EN ISO 4014 / DIN 931) and width across corners $e = d$. |

---

## Automated Checks

```bash
node tests/verify.js                   # Geometric calculation core: 24 analytical checks across all 6 constructions
node tests/screenshots.js <output-dir> # Headless Edge: generates PNG screenshots of states from tests/steps.json
```
