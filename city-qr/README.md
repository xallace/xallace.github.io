# City QR (Metro QR) — 3D Procedural Metropolis QR Code Generator

> **Inspired by [Bubbbly Bloom](https://www.bubbbly.com/bloom)**: Reimagining the interactive 3D flower bouquet QR morph into a thriving, procedural 3D metropolis skyline that seamlessly transforms into a 100% scannable QR code.

[![Three.js](https://img.shields.io/badge/Three.js-r128-black?logo=three.js)](https://threejs.org/)
[![WebGL](https://img.shields.io/badge/WebGL-2.0-red?logo=webgl)](https://www.khronos.org/webgl/)
[![Web Audio API](https://img.shields.io/badge/Web%20Audio%20API-Synthesizer-blue)](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)
[![QR Code](https://img.shields.io/badge/QR%20Code-Level%20H%20(30%25%20ECC)-green)](https://en.wikipedia.org/wiki/QR_code)

---

## 🌆 Overview

**City QR** is an interactive WebGL experience built with Three.js. Rather than generating a conventional flat barcode, it procedurally constructs an entire 3D city skyline where each skyscraper represents a dark module of a QR code.

When viewed at an angle, the scene appears as a dynamic architectural model with varied building heights, glowing skyscraper windows, illuminated street grids, corner citadels, and moving vehicle headlights. 

With a single tap on the canvas or via the control drawer, the camera smoothly glides into an orthogonal top-down perspective, building rooftops flatten into uniform planes, and module footprints expand seamlessly to close street avenues — snapping into a **crystal-clear, 100% scannable QR code** that any modern smartphone camera can immediately read.

---

## ✨ Features

- **Seamless 3D $\leftrightarrow$ QR Morphing:**
  - Smooth cubic-bezier camera interpolation between perspective fly-around and top-down scanning position.
  - Dynamic footprint expansion: Buildings occupy 82% footprint in 3D mode (leaving streets and avenues visible) and morph to 100% in QR mode to create unbroken, solid finder patterns and data blocks.
  - Rooftop elevation leveling: Dynamic skyscraper heights collapse into a unified focal plane ($y = 0.35$), eliminating perspective parallax and shadow interference.

- **Monumental Finder Pattern Citadels:**
  - The three essential $7 \times 7$ corner QR position detection patterns are translated into monumental architectural citadels:
    - Central monolith tower with glowing helipad beacon.
    - Tiered defensive courtyard walls.
    - Perimeter street moat isolating the finder pattern for instant optical scanning.

- **100% Real Scannability:**
  - Kazuhiko Arase QR engine with **Level H Error Correction (30% data recovery)**.
  - High-contrast module surfaces and anti-glare flat material switching during scan mode.
  - Tested across iOS Camera, Android Google Lens, and standard barcode readers.

- **5 Architectural Styles:**
  1. **Metropolis:** Glass and steel towers with lit office windows, accent spire antennas, and rooftop helipads.
  2. **Cyberpunk:** Thin, spiky monoliths with glowing multicolour windows, neon bands, holographic billboards, and beacon masts.
  3. **Art Deco:** Stepped sandstone ziggurats with fluted facades, gold cornices, and golden spires.
  4. **Voxel City:** Whole-unit blocks in a flat colour palette, stacked setbacks, rooftop units, and parks with blocky trees.
  5. **Sci-Fi Megacity:** Podium arcologies with slender towers, glass domes, halo rings, glowing hull strips, and energy conduits between the landmark towers.
  - Every style collapses into the same flat, dark, matte module plane in QR mode, so scannability does not depend on the style.

- **6 Atmospheric Lighting Palettes:**
  - **Midnight Neon:** Deep obsidian pavement, bright cyan and magenta window glows, dark night fog.
  - **Sunset Gold:** Warm amber directional rays, golden hour roof reflections, dusk purple shadows.
  - **Daylight Clean:** Crisp high-key architectural render with soft directional sunlight and realistic ambient occlusion.
  - **Matrix Cyber:** Terminal phosphor green luminescence over digital dark gridlines.
  - **Synthwave 80s:** Retro sunset gradient, hot pink neon towers, and vibrant grid glow.
  - **Blueprint CAD:** Technical monochrome indigo blueprints with wireframe highlights.

- **Interactive Procedural Web Audio:**
  - Built-in polyphonic synthesizer generating mechanical camera glide whooshes, digital scan confirmation chimes, and ambient city hums without external audio assets.

- **Full Export & Sharing Tools:**
  - High-res 2x supersampled PNG canvas capture (`engine.capture()`).
  - Shareable URL serialization (`?u=...&style=...&palette=...&mode=...`).
  - Pre-configured quick presets (Portfolio, GitHub, Wikipedia, TypingMind).
  - 100% self-contained: offline vendor bundle (`three.min.js`, `OrbitControls.js`, `qrcode.min.js`).

---

## 🚀 Getting Started

Simply open `index.html` in any modern web browser supporting WebGL:

```bash
# Optional local HTTP server (or open index.html directly)
python -m http.server 8080
# Open http://localhost:8080
```

---

## 🎮 Controls

| Interaction | Action |
| :--- | :--- |
| **Canvas Tap / Click** | Toggle between **3D City Skyline** and **2D Scannable QR Code** |
| **Left Click + Drag** | Orbit camera around city (in 3D mode) |
| **Right Click + Drag** | Pan camera |
| **Scroll Wheel / Pinch** | Zoom in / out |
| **Control Drawer (Top-Right)** | Customize URL, Style, Palette, Day/Night, and Scan Mode |
| **Snapshot Button** | Export ultra-crisp PNG capture |
| **Share Link** | Copy permalink with customized parameters to clipboard |

---

## 📁 Project Structure

```text
demos/city-qr/
├── index.html          # Web app container, glassmorphic HUD & drawer
├── style.css           # Glassmorphism design, scanner HUD reticle, responsive layout
├── app.js              # State manager, URL debounce, presets, Web Audio synth
├── city-engine.js      # Three.js procedural city generator, QR builder, morph engine
├── vendor/
│   ├── three.min.js      # Three.js r128
│   ├── OrbitControls.js  # Camera navigation
│   └── qrcode.min.js     # Kazuhiko Arase QR Generator (Level H)
└── README.md           # Documentation & technical details
```

---

## 🔬 Technical Implementation Highlights

### 1. Unified Grid to Barcode Topology
Every QR code module is assigned a coordinate $(r, c)$ in the matrix. Dark modules instantiate a building group containing a primary tower, random architectural add-ons (helipads, setback tiers, antennas), and custom window textures.

```javascript
// Dynamic footprint expansion for flawless scanner detection
const footprint = isQRMode ? 1.0 : 0.82;
mesh.scale.set(footprint, currentHeight, footprint);
```

### 2. Camera Bezier Glide
The camera position and target vector are smoothly interpolated via cubic Hermite easing between the 3D perspective angle $(r=45, \theta=45^\circ, \phi=55^\circ)$ and the top-down scanning position $(0, 52, 0)$ looking straight down at $(0, 0, 0)$.

### 3. Tap vs. Drag Disambiguation
To enable effortless tap-to-morph interaction without conflicting with Three.js `OrbitControls` rotation, pointer start/end positions and timestamps are measured:

```javascript
const dist = Math.hypot(endX - startX, endY - startY);
const elapsed = endTime - startTime;
if (dist < 8 && elapsed < 400) {
  toggleMode(); // Smooth morph
}
```

---

## 📄 License
MIT License. Created by Walter Lehn ([@xallace](https://github.com/xallace)).
