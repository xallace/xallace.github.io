# Polar Coordinate Systems, Area Charts – Tabellenbuch Metall p. 59

Interactive study aid for page 59 *"3.1 Diagramme – Polarkoordinatensysteme, Flächendiagramme"* (3.1 Diagrams – Polar Coordinate Systems, Area Charts) from *Tabellenbuch Metall*, 48th edition (Verlag Europa-Lehrmittel), cf. DIN 461 (1973-03) and DIN EN ISO 80000-2 (2013-08).
All text and graphics were created independently. Rules (paraphrased) and example values are taken from the book (high-temperature strength chart $R_\text{m}/R_\text{e}$, roundness testing scale $10\,\text{mm} \mathrel{\hat{=}} 5\,\mu\text{m}$, column chart 2013–2016, pie chart $65/25/5/5\,\%$, and alloy $\text{CuZn36Pb3}$ with $3\,\%$ lead $\to \alpha = 10.8^\circ$).

Because the textbook does not print numeric tables for those plots, the following values were digitized directly from the figures:

- Measured values $R_\text{m}$ and $R_\text{e}$ at $0 \dots 600\,^\circ\text{C}$, accurate to roughly $\pm 10\,\text{N/mm}^2$.
- Columns 2013–2016: 3.4 / 2.7 / 2.2 / 3.7 €M, accurate to roughly $\pm 0.05$ €M.
- Roundness trace: digitized from the textbook plot and reconstructed as a Fourier series (harmonics 2 … 5). It shows the 3-lobe triangular shape of a 3-jaw chuck with high spots near 90°, 210°, and 330°.

Not from the book are the third curve $R_\text{e2}$ (□, synthetic Material 2) and the presets CuSn8 and CuNi18Zn20.

Open `index.html` directly (double-click). The app needs no server, no external libraries, and no network connection (vanilla scripts, SVG).

## Tabs

| Tab | Contents |
|---|---|
| 1 Multiple Curves | High-temperature strength chart (strength $R_\text{m}$, $R_\text{e}$ in $\text{N/mm}^2$ vs. temperature $T$ in $^\circ\text{C}$) with heavily scattered measurements ($\times$, $\bigcirc$, optional 3rd curve $R_\text{e2}$ of a second material with $\square$). Switch between color/symbol labels and DIN 461 line styles (solid, dashed, dash-dot), fitted curve, scatter band, or unsmoothed polyline. Data points can be dragged vertically; reading exercise with tolerance. |
| 2 Polar Coordinates | Polar coordinate system with $360^\circ$ graduation, origin (pole), angle reference ($0^\circ$ horizontal right), positive angle $+\varphi$ counterclockwise, radius $r$, and concentric circles. Drag points, click to place, or enter `P(r; φ)`; optional Cartesian reference triangle ($x = r \cdot \cos\varphi$, $y = r \cdot \sin\varphi$) and exercise with error diagnostics (rotation direction / $0^\circ$ orientation). |
| 3 Roundness Testing | Polar chart of a roundness measuring machine at scale $10\,\text{mm} \mathrel{\hat{=}} 5\,\mu\text{m}$ (magnification $2000 : 1$). Simulates out-of-roundness of a turned bushing caused by excessive chuck clamping force (book example, 2-jaw ovality, 3-jaw trilobe, 4-jaw chuck): after unclamping, the bore develops a high spot at each jaw. Adjustable clamping deformation, tolerance band of width $t$ (centered between maximum and minimum deviation), rotatable probe, and scale/reading exercise. |
| 4 Area Charts | Pie chart with central angle $\alpha = \frac{360^\circ \cdot x\,\%}{100\,\%}$ (book example alloy $\text{CuZn36Pb3}$ with $\text{Pb} = 3\,\% \to 10.8^\circ$, $\text{Zn} = 36\,\% \to 129.6^\circ$, $\text{Cu} = 61\,\% \to 219.6^\circ$, plus $65/25/5/5\,\%$), draggable sector boundaries, editable table, draggable/switchable column and horizontal bar chart "Revenue in €M (2013–2016)", and calculation exercises. |

Top right: "← p. 58" navigates to the companion app for the preceding page,
"Load Book Values" resets all tabs to the page 59 examples,
Dark Blueprint Mode is the default. "Light Mode" switches to the light theme; the preference is saved in the browser, and `?theme=light` or `?theme=dark` forces either mode.
Tabs are accessible via URL hash: `#kennlinien`, `#polar`, `#rundheit`, `#flaechen`.

## Verification

```
node tests/verify.js                   # Calculation core: 52 checks against page 59 book values
node tests/screenshots.js <outdir>     # Headless Edge: captures states from tests/steps.json as PNGs
```

## Structure

```
index.html, style.css
js/core.js            Number format, PCHIP, scatter, polar coordinates, roundness scale, central angle
js/svg.js             SVG helpers: text with *italic*/_{sub}/^{sup}, arrows, markers (○, ×, □), arcs & sectors
js/ui.js              Segmented switches, feedback, tab registry
js/tab-kennlinien.js  Tab 1: Charts with multiple curves & scattered measurements
js/tab-polar.js       Tab 2: Polar coordinate system (360° scale, pole, +φ, r)
js/tab-rundheit.js    Tab 3: Example roundness testing of a turned bushing (10 mm ≙ 5 µm)
js/tab-flaechen.js    Tab 4: Column/bar chart and pie chart (central angle α)
js/app.js             Hash tab switching, theme, book defaults
tests/                verify.js, screenshots.js, steps.json
```
