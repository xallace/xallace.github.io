# Engineering Graphics & Math Studio (Plates I–VI)

Interactive browser-based engineering graphics and mathematics studio featuring six self-contained HTML5/SVG drafting plates aligned with **ISO 80000-2**, **DIN 461**, **DIN ISO 128**, **DIN ISO 5456-3**, and **DIN EN ISO 4014**.

## Plates Overview

| Plate | Module | Topics & Standards | Automated Checks |
| :--- | :--- | :--- | :--- |
| **Plate I** | [`formulas-equations/`](formulas-equations/) | Quantity & numerical-value equations (`v_c`, `M`), linear functions, break-even analysis (`ISO 80000-2`) | `node formulas-equations/tests/verify.js` (49 checks) |
| **Plate II** | [`cartesian-diagrams/`](cartesian-diagrams/) | Four-quadrant Cartesian grids, `1-2-5` axis scaling, logarithmic grids, spring curves (`DIN 461`) | `node cartesian-diagrams/tests/verify.js` (40 checks) |
| **Plate III** | [`polar-area-charts/`](polar-area-charts/) | Multi-curve scatter envelopes, 360° polar grids, 2000:1 roundness deviations, area charts (`DIN 461`) | `node polar-area-charts/tests/verify.js` (50 checks) |
| **Plate IV** | [`basic-constructions/`](basic-constructions/) | Parallels, segment bisectors, perpendiculars, angle bisectors, intercept theorem (`DIN ISO 128`) | `node basic-constructions/tests/verify.js` (62 checks) |
| **Plate V** | [`tangents-polygons/`](tangents-polygons/) | Tangents at & from point `P`, corner fillets, two-circle blends, regular polygons & hexagons (`DIN EN ISO 4014`) | `node tangents-polygons/tests/verify.js` (24 checks) |
| **Plate VI** | [`conics-spirals/`](conics-spirals/) | Incircle, circumcircle, circle center, concentric & parallelogram ellipses (`DIN ISO 5456-3`), `C¹` spiral | `node conics-spirals/tests/verify.js` (25 checks) |

All six plates share a cohesive **1967 Drafting Plate** design system (`plate-theme.css`) and run offline with zero external runtime dependencies.
