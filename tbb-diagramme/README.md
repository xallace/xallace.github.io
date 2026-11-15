# Diagrams – Tabellenbuch Metall p. 58

Interactive learning aid for page 58 "3.1 Diagrams – Cartesian Coordinate System" of
*Tabellenbuch Metall*, 48th edition (Europa-Lehrmittel), cf. DIN 461 and DIN EN ISO 80000-2.
All texts and graphics are independently created. Only the underlying rules (paraphrased)
and worked example values come from the book (`P1`, `P2`, disc-spring table, reading at `s = 0.9 mm`).

Open `index.html` by double-clicking. The app requires no server, no external libraries, and no internet connection
(classic scripts, SVG).

## Tabs

| Tab | Contents |
|---|---|
| 1 Coordinate System | Drag points, add by clicking, or type (`P3(−1.5; 2)`, `Q(2 \| −1)`, `P(3.5, 1.5)`). Displays all three notations, quadrant, path from origin (`x` first, then `y`). Arrowheads or parallel arrows. Practice exercises "Place point" and "Read coordinates" with diagnostic feedback (`x`/`y` swapped, wrong sign). |
| 2 Diagram Layout | `σ`-`ε` diagram with all book annotations. Tap any rule to highlight its element in the diagram. Toggle between arrowheads and parallel arrows, unit placement between numbers or behind the symbol, line-width ratio `1 : 2 : 4`. "Find errors" injects 2–3 of 7 rule violations. |
| 3 Window & Scales | Thermal expansion of a `1000 mm` rod with and without zero origin side by side; rotational speed `n = vc/(π·d)` with linear or logarithmic scales and cursor readout. |
| 4 Spring Characteristic | Editable book table, draggable points. Curve as smooth interpolation or polyline, read `F` from `s` or `s` from `F` via point `A`, tangent and spring rate at `A`, reading exercise with tolerance. |

Top right: "Load Book Values" resets all tabs to the page examples.
The dark Blueprint theme is default. "Light Mode" switches to the light theme; the preference is saved in the browser, and `?theme=light` or `?theme=dark` forces either mode.
Tabs are directly addressable by hash: `#koordinaten`, `#aufbau`, `#skalen`, `#feder`.

## Assumptions and Notes

- **Ordinate symbol:** The book prints `δ` in both `σ`-`ε` figures. Unit `N/mm²` and abscissa `ε` indicate stress `σ`; the app uses `σ` and notes this explicitly.
- **Spring characteristic curve:** The book draws the curve freehand and reads `F ≈ 1250 N`. The app provides:
  - a monotone cubic interpolation (Fritsch-Carlson, slopes matching `scipy.interpolate.PchipInterpolator`): `1245.9 N`, rounded `1250 N`;
  - the polyline: `1225 N`.

  The difference is intentionally shown: reading intermediate values depends on how the curve is interpolated between measured points.
- **`σ`-`ε` curve in Tab 2:** Sample curve `σ = 140 N/mm² · tanh(ε / 0.16 %)` without reference to a specific material.
- **Thermal expansion coefficients in Tab 3:** Steel `≈ 12`, Copper `≈ 16.5`, Aluminum `≈ 23.5 · 10⁻⁶/K` are rounded guide values, not taken from a specific table.
- **Line widths:** Line groups `0.18/0.35/0.7`, `0.25/0.5/1`, and `0.35/0.7/1.4 mm` illustrate the `1 : 2 : 4` ratio. On screen, the relative ratio is preserved.
- **Comma notation:** When entering decimal commas (also supported alongside decimal points), `P(x, y)` is only unambiguous with a space after the separating comma. `P(1,5,2)` is rejected as ambiguous.

## Verification

```
node tests/verify.js                     # Calculation core: 41 checks, e.g., F(0.9 mm) = 1245.9 N / 1225 N
node tests/screenshots.js <output-dir>   # Headless Edge: captures states from tests/steps.json as PNGs
```

`screenshots.js` creates an Edge profile `%TEMP%\edge-shot-*` per run; delete afterward if needed.

## Structure

```
index.html, style.css
js/core.js            Number formatting (decimal point, minus sign), point notations, scales, PCHIP, inversion
js/svg.js             SVG helpers: text with *italic*/_{sub}/^{sup}, arrows, dragging
js/ui.js              Segmented controls, feedback, tab registry
js/tab-*.js           One module per tab
js/app.js             Hash routing, theme toggle, book-value reset
tests/                verify.js, screenshots.js, steps.json
```
