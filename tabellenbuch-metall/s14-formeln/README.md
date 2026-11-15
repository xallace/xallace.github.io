# Formulas, Equations, Diagrams – Tabellenbuch Metall p. 14

Interactive learning aid for page 14 "1.2 Formulas" of *Tabellenbuch Metall*, 48th edition
(Europa-Lehrmittel), chapter Technical Mathematics. All texts and graphics are independently created.
Only the underlying rules (paraphrased) and worked example values come from the book (`vc` with `d = 200 mm`,
`n = 630/min`; `M` with `P = 15 kW`, `n = 750/min`; `y = 0.5 · x + 1`; `KG = 60 €/unit · M + 200 000 €`,
`E = 110 €/unit · M`).

Open `index.html` by double-clicking. The app requires no server, no external libraries, and no internet connection
(classic scripts, HTML math typesetting, SVG).

## Tabs

| Tab | Contents |
|---|---|
| 1 Formulas | Quantity equation `vc = π · d · n`, solve for `vc`, `n`, or `d`. `d` in `mm`, `cm`, or `m`; `n` in `1/min` or `1/s`; the step-by-step calculation shows each unit conversion as a fraction (`1 m / 1000 mm`, `1 min / 60 s`). Turning or milling as an animated view (slowed 50×) with circumference and distance per minute. Tap formula parts so symbols, operators, constants, or numerical values highlight throughout the calculation. Practice exercise with diagnostic feedback ("off by a factor of 1000"). |
| 2 Numerical-Value Equations | `M = 9550 · P / n`, solve for `M`, `P`, or `n`. Toggle "`P` entered in W (wrong)" shows the 1000× oversized result. `M`–`n` hyperbola at constant power with draggable operating point `A`, table of prescribed units, derivation of `9550` from `M = P / (2π · n)`, comparison of quantity vs. numerical-value equation. Practice exercise featuring the W trap. |
| 3 Linear Function | `y = m · x + b` with draggable points `B(0 | b)` and `P(1 | b + m)`, slope triangle, dimension `b`, x-intercept. Value table as in the book with editable `x` values. Practice exercise "Read line equation" with diagnostic feedback (sign error, `Δx` and `Δy` swapped). |
| 4 Cost & Break-Even | Total cost solid line, revenue dashed line as in the book, loss and profit shading, break-even point readout, quantity `M` selectable by clicking or dragging. Tap legend variables to highlight the corresponding element in the diagram. Value table for `M = 0`, `BEP`, and `M`, plus step-by-step break-even calculation. Presets: Book example, Turned part, Injection-molded part, Stamped part. Practice exercise on break-even and profit/loss. |

Top right: "Load Book Values" resets all tabs to the page examples.
The dark Blueprint theme is default. "Light Mode" switches to the light theme; the preference is saved in the browser, and `?theme=light` or `?theme=dark` forces either mode.
Tabs are directly addressable by hash: `#formeln`, `#zahlenwert`, `#linear`, `#kosten`. Legacy URLs from the previous version (`#tab-overview`, `#tab-vc`, `#tab-torque`, `#tab-linear`, `#tab-breakeven`, `#tab-quiz`, `#tab-book`) redirect to the matching tab.

## Assumptions and Notes

- **Revenue function:** The book prints "`E = E/Stück · M`" (revenue per unit times quantity). The app preserves `E/unit · M` to stay faithful to the book notation.
- **Turned part, Injection-molded part, Stamped part presets:** freely chosen realistic numerical examples, not from the book; labeled accordingly in the app.
- **9550:** The exact factor is `60 000 / (2π) = 9549.297`. The app calculates with `9550` like the book and displays the exact value and `+0.0074 %` deviation beside it.
- **Removed compared to earlier version:** empirical material cutting-speed tables (`vc` reference values without verified source), overview board, and separate quiz tab (each tab now includes its own interactive exercise).

## Verification

```
node tests/verify.js                     # Calculation core: 49 checks, including 395.84 m/min, 191 N·m, BEP = 4000 units
node tests/screenshots.js <output-dir>   # Headless Edge: captures states from tests/steps.json as PNGs
```

`screenshots.js` creates an Edge profile `%TEMP%\edge-shot-*` per run; delete afterward if needed.

## Structure

```
index.html, style.css
js/core.js            Number formatting (decimal point, minus sign, thousands), input parsing, scales, page formulas
js/svg.js             SVG helpers: text with *italic*/_{sub}/^{sup}, arrows, dragging
js/ui.js              Segmented controls, feedback, math typesetting (fractions, steps), tab registry
js/tab-*.js           One module per tab
js/app.js             Hash routing, theme toggle, book-value reset
tests/                verify.js, screenshots.js, steps.json
```
