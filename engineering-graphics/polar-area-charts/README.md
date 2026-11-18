# Plate III · Polar Coordinates, Roundness Inspection & Area Charts

Interactive study suite covering multi-curve scatter envelopes, DIN 461 polar coordinate systems, `2000 : 1` roundness profile diagnostics, and central-angle area charts. All explanations, vector graphics, and datasets are independently created.

Live at: **[https://xallace.github.io/engineering-graphics/polar-area-charts/](https://xallace.github.io/engineering-graphics/polar-area-charts/)**

## Tabs

| Tab | Module | Interactive Features |
| :--- | :--- | :--- |
| **1 Multiple Curves** | `#kennlinien` | Synthetic elevated-temperature strength curves ($R_m$, $R_e$, $R_{e2}$), switchable PCHIP / scatter band / unsmoothed views, color vs. monochrome dashed print styles, and draggable points. |
| **2 Polar Coordinates** | `#polar` | DIN 461 360° polar coordinate sheet with eccentric cam trace $r(\varphi)$, angle/radius vectors, Cartesian triangle overlay, and interactive placement quizzes. |
| **3 Roundness Testing** | `#rundheit` | 2000:1 radial magnification profile for asymmetric trilobe, 2-jaw oval, 3-jaw, and 4-jaw chuck clamping deformation with pass/fail tolerance band $t$. |
| **4 Area Charts** | `#flaechen` | Live central-angle pie chart ($\alpha = 360^\circ \cdot x\% / 100\%$) with draggable sector dividers + interactive CNC workshop column/bar chart. |

## Verification

```bash
node tests/verify.js
```
