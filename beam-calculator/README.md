# BeamLab · Simply Supported Beam with Uniformly Distributed Load (UDL)
### Interactive Technical Book-Plate Recreation of [StructX Beam Formulas 001](https://structx.com/Beam_Formulas_001.html)

[![Web App](https://img.shields.io/badge/Demo-Live%20Plate-d94426)](https://xallace.github.io/beam-calculator/)
[![Standard](https://img.shields.io/badge/Standard-Eurocode%203%20%2F%20DIN%20%2F%20AISC-047857)]()
[![License](https://img.shields.io/badge/License-MIT-b45309.svg)]()

---

### Project Overview

**BeamLab** reimagines [StructX Beam Formulas 001](https://structx.com/Beam_Formulas_001.html) in a warm **1967 technical book-plate** style (parchment drafting canvas, ink linework, vermilion call-outs) designed to make beam statics intuitive for both students and engineers:

* **Synchronized 4-Plate Structural Diagrams (SVG)**: Free Body & Deformed Beam (with compression/tension fiber tinting and numbered call-outs), Shear Force Diagram (SFD), Bending Moment Diagram (BMD with Eurocode Tension-Down / Math-Up toggle), and Elastic Deflection Curve (with support tangent angles $\theta_A$ and $L/300$ serviceability limit).
* **Method-of-Sections Cut Plate**: Slice the beam live at any probe position $x$ to see how internal shear $V(x)$ and bending moment $M(x)$ balance the external load $w \cdot x$ and support reaction $R_A$.
* **Cross-Section & Fiber Stress Profile**: Real-time scaled cross-section drawing (IPE/HEB, rectangle, custom I-beam, RHS hollow box, solid bar, circular tube) paired with the linear bending stress distribution $\sigma(y)$ and $\pm f_y$ yield limits.
* **7-Stop Guided Tour & Real-World Scenarios**: One-click presets (*Office Girder*, *Overloaded Girder*, *Timber Joist*, *8m HEB 240*, *Aluminum Box Frame*) plus an interactive tour and plain-English live probe readout.
* **Live Step-by-Step KaTeX Math & Concepts Guide**: Full worked substitution updating with your exact parameters, plus seamless **SI ↔ US** unit conversion, shareable URL hash, clipboard report, and print/PDF sheet.

---

### Structural Mechanics Reference

For a prismatic simply supported beam of span $L$ under uniform distributed load $w$:

| Quantity | Formula | Notes |
| :--- | :--- | :--- |
| **Support Reactions** | $R_A = R_B = \frac{w \cdot L}{2}$ | Equal split by symmetry ($\sum F_y = 0, \sum M_A = 0$) |
| **Shear Force** | $V(x) = w\left(\frac{L}{2} - x\right)$ | Linear; peak $\pm \frac{wL}{2}$ at ends, zero at $x = L/2$ |
| **Bending Moment** | $M(x) = \frac{wx}{2}(L - x)$ | Parabolic; peak $M_{\max} = \frac{wL^2}{8}$ where $V = 0$ |
| **Elastic Deflection** | $\delta(x) = \frac{wx}{24EI}(L^3 - 2Lx^2 + x^3)$ | Peak $\delta_{\max} = \frac{5wL^4}{384EI}$ at midspan |
| **Support Rotation** | $\theta_A = \theta_B = \frac{wL^3}{24EI}$ | End slope at pin & roller bearings (radians) |
| **Bending Stress** | $\sigma(y) = \frac{M(x)\cdot y}{I_y}, \; \sigma_{\max} = \frac{M_{\max}}{W_y}$ | Compression at top flange, tension at bottom flange |

---

### Verification

Run the analytical mechanics test suite with Node.js:

```bash
node tests/verify.mjs
```

---

### Author

Developed by **Walter Lehn (@xallace)**  
*Technical Product Designer (IHK) · Mechanical & Computational Systems*  
Portfolio: [xallace.github.io](https://xallace.github.io)
