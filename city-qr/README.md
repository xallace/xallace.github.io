# City QR (Metro QR) — 3D Procedural Metropolis QR Code Generator

> **Inspired by [Bubbbly Bloom](https://www.bubbbly.com/bloom)**: Reimagining the interactive 3D flower bouquet QR morph as a procedural 3D city skyline that transforms into a scannable QR code.

[![Three.js](https://img.shields.io/badge/Three.js-r128-black?logo=three.js)](https://threejs.org/)
[![WebGL](https://img.shields.io/badge/WebGL-2.0-red?logo=webgl)](https://www.khronos.org/webgl/)
[![Web Audio API](https://img.shields.io/badge/Web%20Audio%20API-Synthesizer-blue)](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)
[![QR Code](https://img.shields.io/badge/QR%20Code-Level%20H%20(30%25%20ECC)-green)](https://en.wikipedia.org/wiki/QR_code)

---

## 🌆 Overview

**City QR** is an interactive WebGL experience built with Three.js. Rather than generating a conventional flat barcode, it procedurally constructs an entire 3D city skyline where each building represents a dark module of a QR code and each street a light module.

When viewed at an angle, the scene appears as an architectural model with varied building heights, lit windows, landmark towers on the three corner markers, and cars driving along the grid lines.

With a tap on the canvas or the button in the control panel, the camera glides into a straight top-down view, the buildings flatten into one roof plane, and their footprints expand to close the streets between neighbouring modules, turning the skyline into a scannable QR code.

---

## ✨ Features

- **Seamless 3D $\leftrightarrow$ QR Morphing:**
  - Cubic ease-in-out camera glide on a sphere around the look-at point, ending upright in the top-down scanning view.
  - Dynamic footprint expansion: Buildings occupy 66–94% of a module in 3D mode, depending on the style (leaving streets and avenues visible) and morph to 100% in QR mode to create unbroken, solid finder patterns and data blocks.
  - Rooftop leveling: All building heights collapse into one roof plane ($y = 0.35$); a top-down fill light takes over from the sun, so shadows barely register.

- **Landmark Finder Patterns:**
  - The three $7 \times 7$ corner position markers are built as rings of uniform height around a $3 \times 3$ cluster of landmark towers. In the Sci-Fi style, energy conduits link the three landmarks.

- **Scannability:**
  - Kazuhiko Arase QR engine with **Level H Error Correction (30% data recovery)**.
  - In QR mode, all building surfaces turn dark and matte, glow and fog fade out, and the top-down light cannot glare off the roofs.
  - The code is framed with the 4-module quiet zone into the part of the screen not covered by the header, hint bar and control panel, in landscape and portrait.
  - Verified by decoding rendered screenshots with OpenCV across all styles and palettes.

- **5 Architectural Styles:**
  1. **Metropolis:** Glass and steel towers with lit office windows, accent spire antennas, and rooftop helipads.
  2. **Cyberpunk:** Thin, spiky monoliths with glowing multicolour windows, neon bands, holographic billboards, and beacon masts.
  3. **Art Deco:** Stepped sandstone ziggurats with fluted facades, gold cornices, and golden spires.
  4. **Voxel City:** Whole-unit blocks in a flat colour palette, stacked setbacks, rooftop units, and parks with blocky trees.
  5. **Sci-Fi Megacity:** Podium arcologies with slender towers, glass domes, halo rings, glowing hull strips, and energy conduits between the landmark towers.
  - Every style collapses into the same flat, dark, matte module plane in QR mode, so scannability does not depend on the style.

- **6 Lighting Palettes:**
  - **Midnight:** Near-black sky and fog, cyan window light and accents.
  - **Sunset:** Orange sunlight, amber windows, dusky purple sky and ambient light.
  - **Daylight:** Light grey sky, white sunlight, pale blue windows.
  - **Matrix:** Black-green sky, phosphor-green windows and accents.
  - **Synthwave:** Deep violet sky, magenta accents, hot pink windows.
  - **Blueprint:** Navy sky, blue-tinted buildings, sky-blue accents.

- **Procedural Web Audio:**
  - Short sounds synthesized with oscillators, no audio files: a click for buttons, a rising sweep for the 3D $\leftrightarrow$ QR transition, and a chime for the PNG export.

- **Export & Sharing Tools:**
  - PNG export at twice the on-screen resolution (`engine.capture(2)`).
  - Shareable URL parameters (`?u=...&style=...&palette=...`).
  - Quick presets (Portfolio, GitHub, Wikipedia, TypingMind).
  - Libraries bundled locally (`three.min.js`, `OrbitControls.js`, `qrcode.min.js`); only the web fonts load from Google Fonts.

---

## 🚀 Getting Started

`app.js` is an ES module, and browsers do not load modules from `file://` URLs, so serve the folder over HTTP:

```bash
python -m http.server 8080
# Open http://localhost:8080
```

---

## 🎮 Controls

| Interaction | Action |
| :--- | :--- |
| **Canvas Tap / Click** | Toggle between **3D City Skyline** and **2D Scannable QR Code** |
| **Hint Bar (Bottom)** | Same toggle |
| **Left Click + Drag** | Orbit camera around the city |
| **Right Click + Drag** | Pan camera |
| **Scroll Wheel / Pinch** | Zoom in / out |
| **Control Panel (Top Right; gear button on phones)** | Link to encode, presets, style, palette, QR toggle |
| **Enter in the Link Field** | Encode the link and switch to the QR view |
| **Download PNG** | Save the current view as PNG |
| **Copy Link** | Copy the page URL with the current link, style and palette to the clipboard |

---

## 📁 Project Structure

```text
city-qr/
├── index.html          # Web app container, glassmorphic HUD & control panel
├── style.css           # Glassmorphism design, scanner HUD reticle, responsive layout
├── app.js              # State manager, URL debounce, presets, Web Audio synth, QR framing insets
├── city-engine.js      # Three.js procedural city generator, style kits, QR builder, morph engine
├── vendor/
│   ├── three.min.js      # Three.js r128
│   ├── OrbitControls.js  # Camera navigation
│   └── qrcode.min.js     # Kazuhiko Arase QR Generator (Level H)
└── README.md           # Documentation & technical details
```

---

## 🔬 Technical Implementation Highlights

### 1. Unified Grid to Barcode Topology
Every QR code module is assigned a coordinate $(r, c)$ in the matrix. Each dark module gets a building whose body box becomes the QR module; the active style adds setback tiers, antennas, domes and other decor, which collapse or shrink away during the morph.

```javascript
// t = 0: 3D skyline, t = 1: QR code
const footprint = THREE.MathUtils.lerp(this.footprint3D, 1.0, t);
const h = THREE.MathUtils.lerp(b.bodyHeight, QR_ROOF_HEIGHT, t);
b.bodyMesh.scale.set(footprint, h, footprint);
```

### 2. Camera Glide
The camera moves on a sphere around a look-at point that itself moves in a straight line: radius, polar angle and azimuth are interpolated with cubic ease-in-out. The 3D view sits at $(26, 32, 26)$ looking at $(0, 1.5, 0)$, about $r \approx 48$, azimuth $45^\circ$, polar angle $\approx 50^\circ$. The top-down distance is computed so that the symbol plus quiet zone fills the free screen area, and the look-at point shifts sideways when the control panel covers part of the screen. Interpolating the azimuth avoids the rotation snap that a straight Cartesian move produces when the camera arrives directly overhead.

### 3. Tap vs. Drag Disambiguation
To enable effortless tap-to-morph interaction without conflicting with Three.js `OrbitControls` rotation, pointer start/end positions and timestamps are measured:

```javascript
const dist = Math.hypot(e.clientX - pointerDownPos.x, e.clientY - pointerDownPos.y);
const time = performance.now() - pointerDownTime;
if (dist < 8 && time < 400) {
  engine.toggleViewMode(); // Smooth morph
}
```

---

## 📄 License
MIT License. Created by Walter Lehn ([@xallace](https://github.com/xallace)).
