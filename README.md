# 🌐 Walter (@xallace) — Engineering & Portfolio Hub

> Official GitHub Pages Portfolio: `xallace.github.io`  
> Live URL: [https://xallace.github.io](https://xallace.github.io)

Portfolio of Walter Lehn, Technical Product Designer (IHK): interactive physics and kinematics simulations, GD&T & CAD drafting plates, and Python tools. The web apps are built with AI coding agents and verified against engineering standards and analytical test suites.

---

## 🚀 Showcased Projects & Modules

### 📁 Technical Design & Standards (`#technical-design`)

* **[iso2692-mmr-lab](https://xallace.github.io/iso2692-mmr-lab/)** — *MMR / LMR Bonus Tolerance Lab*: Interactive 1967 book-plate lab for DIN EN ISO 2692 covering `Ⓜ` bonus tolerance & `MMVS` functional gauges, Zero-at-MMC (`Ø0 Ⓜ`), Reciprocity (`Ⓜ Ⓡ`), exact `+57.08%` cylindrical `Ø` vs. `±` area comparison, and `Ⓛ` minimum wall protection.
* **[iso5459-datum-lab](https://xallace.github.io/iso5459-datum-lab/)** — *3-2-1 Datum Reference Frame Lab*: Interactive 1967 book-plate inspection lab for DIN EN ISO 5459 covering 3D 6-DOF rigid locking, exact SE(2) `|A|B|C|` vs. `|A|C|B|` precedence flips, Common Datum `|A-B|`, cast Datum Targets (`A1`–`A3`), and ISO 5459 §7.2.2 frame validation.
* **[iso14405-banana-shaft](https://xallace.github.io/iso14405-banana-shaft/)** — *Banana Shaft Lab*: Interactive 1967 book-plate metrology lab for DIN EN ISO 14405-1 size operators (`LP`, `GG`, `GX`, `GN`, `GC`, `Ⓔ`), the `Ø20 H7/f7` bent-shaft assembly paradox, 3-lobe constant-width orbiform cross-sections, and official DIN EN ISO 286-2 fits.
* **[iso1101-straightness](https://xallace.github.io/iso1101-straightness/)** — *Straightness Lab*: Interactive 1967 book-plate 3D & 2D inspection lab for DIN EN ISO 1101:2017 intersection (`⟨[ // | A ]`, `⟨[ ⊥ | A ]`) and orientation (`⟨[ ⊥ | A ]⟩`, `⟨[ // | B ]⟩`) plane indicators with exact Chebyshev MZS solvers.
* **[gps-grundlagen](https://xallace.github.io/gps-grundlagen/)** — *GPS Fundamentals*: the 14 geometric tolerance types of DIN EN ISO 1101 with drawing callout, tolerance zone and deviation, a feature-control-frame checker, the 13 principles of DIN EN ISO 8015 with an envelope-requirement (Ⓔ) calculator, and exercises.
* **[engineering-graphics](https://xallace.github.io/engineering-graphics/)** — *Engineering Graphics & Math Studio*: 1967 Drafting Plate interactive suite uniting six plates:
  * **[Plate I · Engineering Formulas & Break-Even Analysis](https://xallace.github.io/engineering-graphics/formulas-equations/)** (ISO 80000-2 quantity equation $v_c = \pi \cdot d \cdot n$ with unit tracking, torque equation $M = 9550 \cdot P / n$, linear functions & break-even $K_G = E$).
  * **[Plate II · Cartesian Diagrams & DIN 461 Scaling](https://xallace.github.io/engineering-graphics/cartesian-diagrams/)** (DIN 461 four-quadrant coordinate anatomy, fault-finding exercises, 1-2-5 scaling & log grids, progressive spring characteristic curves).
  * **[Plate III · Polar Coordinates, Roundness & Area Charts](https://xallace.github.io/engineering-graphics/polar-area-charts/)** (multi-curve steel strength scatter bands $R_m/R_e$, 360° polar coordinate grid, $2000:1$ roundness deviation check & central-angle alloy/production charts).
  * **[Plate IV · Basic Geometric Constructions: Segments, Perpendiculars & Angles](https://xallace.github.io/engineering-graphics/basic-constructions/)** (6 compass-and-straightedge constructions with step animation per DIN ISO 128: parallel line via rhombus, perpendicular bisector, dropping a perpendicular, erecting a perpendicular at $P$ via Thales circle, angle bisector & dividing a segment via intercept theorem).
  * **[Plate V · Tangents, Circular Arcs & Regular Polygons](https://xallace.github.io/engineering-graphics/tangents-polygons/)** (6 compass-and-straightedge constructions: tangent at circle point $P$, tangent from external $P$ via Thales, corner fillet $t = r/\tan(\alpha/2)$, two-circle blend $R_i, R_a$, Bion regular polygon approximation & circumscribed hexagon/dodecagon with DIN EN ISO 4014 hex head geometry).
  * **[Plate VI · Incircle, Circumcircle, Ellipses & Spirals](https://xallace.github.io/engineering-graphics/conics-spirals/)** (6 compass-and-straightedge constructions: incenter & incircle $r = A/s$, circumcircle $R = abc/4A$, circle center via chords, concentric-circle ellipse, parallelogram affine ellipse per DIN ISO 5456-3 & 4-center smooth $C^1$ spiral).

### ⚙️ Interactive Simulations & Software

* **[pla-100](https://xallace.github.io/pla-100.html)** — *PLA-100 v2*: Collision-free FreeCAD 1.1 parametric precision linear axis (`21` named STEP AP214 solids, `0.00 mm³` B-Rep clashes, 58-turn helical `SFU1204` ball screw, `7001-B`/`6001` bearings, open motor lantern, live DIN 69051 / ISO 281 sizing & 2D ISO 128 drawing).
* **[packstation](https://xallace.github.io/packstation.html)** — *Packstation & Palletizing Robots*: browser-based digital twin with Three.js & Rapier.js WASM physics, barcode scanner, PLA-100 diverter, ZPA conveyor logic, and dual articulated palletizing robots.
* **[kfz-dynamik](https://xallace.github.io/kfz-dynamik/)** — *KfzDyn*: Interactive vehicle dynamics models from Mitschke/Wallentowitz (*Dynamik der Kraftfahrzeuge*, 5th ed.) with 3D wheel forces, longitudinal performance, braking, quarter-car vibrations & single-track handling.
* **[solar-utc-clock](https://xallace.github.io/solar-utc-clock/)** — *Helios & Chronos*: Dual astronomical solar & universal UTC decimal day percentage clocks with NOAA solar calculations, 60 FPS live mode & interactive time scrubber.
* **[beam-calculator](https://xallace.github.io/beam-calculator/)** — *BeamLab*: Euler-Bernoulli simply supported beam calculator (`StructX 001`) with real-time SFD/BMD/deflection curves, Eurocode profiles & KaTeX step-by-step math.
* **[web-cad-studio](https://xallace.github.io/web-cad-studio/)** — Parametric 3D CAD modeling studio (DIN ISO 841 Z-Up) for DIN 867 involute gears, EN 1092-1 weld-neck flanges, housings, DIN 332 shafts & DIN 933 bolts with section planes, 3D dimensions, exact signed-volume mass calculation & Binary/ASCII STL/OBJ import/export.
* **[cycloid-simulation](https://xallace.github.io/cycloid-simulation/)** — 1967 Book Plate 3D & 2D kinematics studio covering the Wankel 1:3 rotary engine, robotics cycloidal reducers (10:1 / 15:1) & roulette curves with 1-click AutoCAD DXF/SVG export.
* **[city-qr](https://xallace.github.io/city-qr/)** — Procedural 3D metropolis that morphs seamlessly into a scannable Level-H QR code.
* **[hoerbuch-generator](https://github.com/xallace/hoerbuch-generator)** — 6-stage CLI & Web Studio (`web.py`) pipeline generating CEFR-graded (`A1`–`B2`) language-learning audiobooks (`.mp3`), Anki decks (`.apkg`), and study guides from YouTube videos, URLs, or text.
* **[pdf-toc-injector](https://github.com/xallace/pdf-toc-injector)** — Heuristic outline extraction & sub-second PDF bookmark injection engine (PyMuPDF).

---

## 🛠️ How to Deploy to GitHub Pages

1. **Create Repository:**
   * Go to GitHub $\rightarrow$ New Repository.
   * Repository name: **`xallace.github.io`** *(must match your username exactly)*.
   * Visibility: **Public**.

2. **Push Local Files:**
   ```bash
   cd "G:\My Drive\agy\demos\xallace.github.io"
   git init
   git remote add origin https://github.com/xallace/xallace.github.io.git
   git add .
   git commit -m "feat: initial launch of central engineering portfolio"
   git branch -M main
   git push -u origin main
   ```

3. **Automatic Deployment:**
   * GitHub Pages is automatically provisioned for repositories named `<username>.github.io` from the `main` branch.
   * Your site will be live at `https://xallace.github.io` within 1-2 minutes.
