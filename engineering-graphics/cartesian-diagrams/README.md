# Plate II · Cartesian Coordinate Systems & DIN 461 Diagrams

Interactive study tool for Cartesian coordinates, DIN 461 technical chart layout, coordinate windows, logarithmic speed charts, and PCHIP spring characteristic curves. All prose, SVG graphics, and reference datasets are independently authored.

Live at: **[https://xallace.github.io/engineering-graphics/cartesian-diagrams/](https://xallace.github.io/engineering-graphics/cartesian-diagrams/)**

## Tabs

| Tab | Module | Interactive Features |
| :--- | :--- | :--- |
| **1 Coordinate System** | `#koordinaten` | Drag & place points, switch notation `P(x; y)` / `P(x \| y)` / `P(x, y)`, and test sign/order awareness. |
| **2 Diagram Layout** | `#aufbau` | DIN 461 anatomy inspector (`1 : 2 : 4` line-width ratios, unit placement, italicized symbols) + Fault-Finder quiz. |
| **3 Window & Scales** | `#skalen` | Suppressed-zero thermal expansion window (`Steel`, `Brass`, `Aluminum`) and linear vs. log-log speed scale comparison. |
| **4 Spring Curve** | `#feder` | Editable disc-spring value table, PCHIP vs. polyline curve comparison, tangent rate $R$, and inverse readout. |

## Verification

```bash
node tests/verify.js
```
