# 🌐 Walter (@xallace) — Engineering & Portfolio Hub

> Official GitHub Pages Portfolio: `xallace.github.io`  
> Live URL: [https://xallace.github.io](https://xallace.github.io)

Central portfolio landing page showcasing physical simulation systems, mechanical engineering (CAD/CAE), and high-performance Python automation pipelines.

---

## 🚀 Showcased Projects & Modules

* **[pla-100](https://xallace.github.io/pla-100.html)** *(WIP)* — Parametric 14-part precision linear axis (`PLA-100`) with Three.js WebGL CAD inspector & STEP AP214 download.
* **[kfz-dynamik](https://xallace.github.io/kfz-dynamik/)** — *KfzDyn*: Interactive vehicle dynamics models from Mitschke/Wallentowitz (*Dynamik der Kraftfahrzeuge*, 5th ed.) with 3D wheel forces, longitudinal performance, braking, quarter-car vibrations & single-track handling.
* **[vsusp-sim](https://xallace.github.io/vsusp-sim/)** — *VSuspLab*: Front-view suspension kinematics for double wishbone (SLA) & MacPherson — instant centers, roll center migration, camber, KPI/scrub & bump steer; drag wheels/body on the diagram, CSV sweeps. Installable mobile web app (PWA), works offline.
* **[beam-calculator](https://xallace.github.io/beam-calculator/)** — *BeamLab*: Euler-Bernoulli simply supported beam calculator (`StructX 001`) with real-time SFD/BMD/deflection curves, Eurocode profiles & KaTeX step-by-step math.
* **[tabellenbuch-metall](https://xallace.github.io/tabellenbuch-metall/)** — *Tabellenbuch Metall (48. Aufl.)* central hub uniting:
  * **[S. 14 · Formeln, Gleichungen, Diagramme](https://xallace.github.io/tabellenbuch-metall/s14-formeln/)** ($v_c = \pi \cdot d \cdot n$, $M = 9550 \cdot P / n$, linear functions & break-even $K_G = E$).
  * **[S. 58 · Diagramme: Kartesisches Koordinatensystem](https://xallace.github.io/tabellenbuch-metall/s58-diagramme/)** (DIN 461 chart anatomy, fault-finding exercises, suppressed zero & log scales, reading a disc-spring characteristic curve).
  * **[S. 59 · Diagramme: Polarkoordinatensysteme & Flächendiagramme](https://xallace.github.io/tabellenbuch-metall/s59-polarkoordinaten/)** (multiple characteristic curves with scatter bands $R_m/R_e$, polar coordinates, $2000:1$ roundness check of a turned bushing & alloy composition charts).
* **[web-cad-studio](https://xallace.github.io/web-cad-studio/)** — Parametric 3D CAD modeling & cross-section inspection studio with STL/OBJ export.
* **[cycloid-simulation](https://xallace.github.io/cycloid-simulation/)** — Wankel rotary engine, robotics cycloidal reducers & roulette curves with 1-click AutoCAD DXF/SVG export.
* **[carousel-simulation](https://xallace.github.io/carousel-simulation/)** — 3D Three.js centripetal physics & cable tension modeling.
* **[lever-simulation](https://xallace.github.io/lever-simulation/)** — Archimedean lever principle & torque dynamics ($\alpha = \tau / I$).
* **[abacus](https://xallace.github.io/abacus/)** — Interactive bi-quinary Soroban, Suanpan, Schoty & Roman hand-abacus laboratory.
* **[number-pyramid](https://xallace.github.io/number-pyramid/)** — Pascal combinatorics lab & constraint-based arithmetic solver.
* **[city-qr](https://xallace.github.io/city-qr/)** — Procedural 3D metropolis that morphs seamlessly into a scannable Level-H QR code.
* **[speed-cad](https://xallace.github.io/speed-cad/)** — *SpeedCAD: Blueprint Blitz* 3D CAD speedrunner game with LiveSplits & Web Audio.
* **[cosmic-card-studio](https://xallace.github.io/cosmic-card-studio/)** — 3D parallax card studio with holographic foil shaders.
* **[lingua-ai](https://xallace.github.io/languages.html)** — Sentence-synchronized bilingual reader (DE ↔ UA) & LLM story generator.
* **[google-page-two](https://xallace.github.io/google-page-two/)** — Searchable guide to 26 underrated Google tools & search operators.
* **[pdf-toc-injector](https://github.com/xallace/pdf-toc-injector)** — Heuristic outline extraction & sub-second PDF bookmark injection engine (PyMuPDF).
* **Engineering Monographies** — Historical linkage mechanisms (I. I. Artobolevsky) & Astronautics historical foundations.

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
