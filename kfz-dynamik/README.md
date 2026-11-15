# KfzDyn – Vehicle Dynamics

Interactive web app for exploring the simulation models from
M. Mitschke, H. Wallentowitz: *Dynamik der Kraftfahrzeuge*, 5th ed., Springer Vieweg 2014.
One tab per part of the book, translated into English. Equation numbers and page references correspond to that edition.

Live: <https://xallace.github.io/kfz-dynamik/>

The app implements the textbook equations but reproduces neither prose nor figures. A few curves are digitized from
plots where no closed-form equation is provided (see below).

## Getting Started

Open `index.html` in a browser, including directly via `file://`. All scripts are classic non-module scripts;
three.js and KaTeX are bundled locally under `vendor/`. Only the Inter and JetBrains Mono fonts are loaded from Google Fonts;
offline, the page falls back to system fonts.

Tabs can be selected directly via the URL hash: `index.html#reifen`, `#fahrleistung`, `#bremsung`, `#schwingung`,
`#fahrverhalten`, `#pruefung`.

## Contents

| Tab | Textbook | Contents |
|---|---|---|
| I Tires | Ch. 2, Figs. 2.1, 2.44, Table 2.3 | 3D wheel/road view with coordinate frames, angles, forces, and Mz (forces on the wheel or on the road); HSRI model: Fx(Sx), Fy(α), friction diagram, Mz(α) |
| II Performance | Ch. 5, 7, Figs. 7.1, 7.10, 7.11 | Tractive force & power diagrams, engine map, ẍ/g per gear, standing-start acceleration, vmax, gradeability |
| II Braking | Ch. 9, Figs. 9.4, 9.9, 9.13, Table 9.1 | Ideal and fixed brake force distribution, lock boundaries, friction utilization, braking efficiency, stopping distance |
| III Vibrations | Ch. 11–13, Table 13.1, Figs. 13.2, 13.12 | Quarter-car with seat-occupant: magnification functions, weighted spectra, K-values, conflict diagram, animation on stochastic road |
| IV Handling | Ch. 20–22, Tables 21.7, 22.4 | Linear single-track model with steering compliance: steady cornering, vch/vcrit, natural frequency and damping, steering inputs with top-down animation, frequency response |
| Verification & Sources | – | Comparison with textbook numerical examples, discrepancies, assumptions, licenses |

## Structure

```
index.html, style.css
js/engine/   DOM-free simulation kernels, also run in Node.js
  core.js        complex numbers, linear solver, interpolation, Runge-Kutta, PRNG
  reifen.js      HSRI tire model (Table 2.3)
  laengs.js      driving resistances, tractive force, driving performance
  bremsung.js    brake force distribution, stopping distance
  schwingung.js  three-mass quarter-car, road PSD, K-values, time simulation
  einspur.js     single-track (bicycle) model
  data.js        example vehicles from Tables 13.1, 21.7; road classes Table 11.5; reaction times Table 9.1; digitized points Fig. 2.44
  pruefung.js    verification suite against textbook values
tests/       verify.js (kernels vs. textbook), screenshots.js (UI check in Headless Edge)
js/ui/       chart.js (Canvas charts), controls.js (sliders, KPIs, formulas), reifen3d.js (three.js)
js/tabs/     one module per tab, initialized lazily on first open
js/app.js    tab manager
```

## Verification

```
node tests/verify.js
```

UI verification: `tests/screenshots.js` renders every tab in Headless Edge, logs console errors, and checks horizontal
overflow (usage documented in the file header).

As of 2026-10-21: 57 passed, 0 failed, 10 known deviations. The same list appears in the
“Verification & Sources” tab. Examples: stopping distance from 80 km/h 59.79 m (book 59.7), vmax 39.5 m/s (≈ 40),
0–100 km/h 18.2 s (18), σF 256.9 N (257), all SQ and vch values from Table 21.7, overshoot Veh. 1 7.9 % (8.9 %).

### Discrepancies in the Textbook

- p. 218: stopping time printed as 4.4 s; Eq. (9.19a) with the example numbers yields 4.6 s.
- Table 2.3: adhesion-zone Fx = cx·Sx is linearized and jumps at s̄R = 0.5; implemented here with the factor 1/(1 − Sx).
- Table 2.3: nx in partial sliding places Fy/cy inside the parentheses multiplied by lL·tan α (wrong units); placed outside here.
- Figs. 13.2 i/k/l are mutually inconsistent; K foot is 7.6 instead of 5.9, making Ktotal 25.6 instead of ≈ 23.6.
- Weighting functions in Fig. 12.7 and Fig. 13.2 differ by 30–50 % below 2 Hz. Default is Fig. 13.2.

### Assumptions

- 205/60 R 15 tire: μ01 = 1.17, kR = 0.32, a = 0.09 s/m fitted to Fig. 2.44 (measurement speed 60 km/h assumed);
  cα(Fz) shaped like Fig. 2.37, scaled to 50 kN/rad at 4 kN; cγ = 0.1·cα estimated. Peak Fx is 4.15 kN vs. 4.83 kN measured.
- Braking: φ = 0.76 inferred from the numbers on p. 227.
- Driving performance: 0–100 km/h distance 311 m; the book states “approx. 280 m”.
- Vibrations: static wheel load derived from masses; animated road profile synthesized from 200 cosine waves with random phases.
- Single-track model: Tψ̇max and overshoot for Veh. 2 and 7 differ by up to 15 % from Table 22.4; cause unresolved.

### Digitized Curves

- Full-load engine torque from Fig. 7.1c
- Weighting curves B(f): seat and foot from Fig. 13.2 f/k; seat, foot, and hand from Fig. 12.7 b–d
- Measured data points Fx(Sx) and Fy(α) from Fig. 2.44

## Licenses

- three.js r128, MIT License (`vendor/three/LICENSE`)
- KaTeX 0.16.8, MIT License (`vendor/katex/LICENSE`)
