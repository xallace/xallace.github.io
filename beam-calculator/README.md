# 📐 BeamLab · Simply Supported Beam with Uniformly Distributed Load (UDL)
### Modern Recreation & Engineering Enhancement of [StructX Beam Formulas 001](https://structx.com/Beam_Formulas_001.html)

[![Web App](https://img.shields.io/badge/Demo-Live%20Simulator-38bdf8)](https://xallace.github.io/beam-calculator/)
[![Standard](https://img.shields.io/badge/Standard-Eurocode%203%20%2F%20DIN%20%2F%20AISC-10b981)]()
[![License](https://img.shields.io/badge/License-MIT-purple.svg)]()

---

### 🌟 Project Overview

**BeamLab** modernizes and reimagines the classic [StructX Beam Formulas 001](https://structx.com/Beam_Formulas_001.html) (2014) into an interactive, high-precision structural mechanics web application. 

Instead of static, low-resolution raster images and outdated HTML table forms, **BeamLab** delivers:
* **Interactive High-DPI Vector Diagrams (SVG)**: Free Body Diagram (FBD), Shear Force Diagram (SFD), Bending Moment Diagram (BMD), and Euler-Bernoulli Deflection Curve.
* **Interactive Probe Cursor ($x$)**: Drag anywhere along the beam to inspect internal shear $V(x)$, bending moment $M(x)$, and deflection $\delta(x)$ in real time.
* **Cross-Section Modeler**: Real-time geometric second moment of area ($I$) and section modulus ($W$) calculation for Rectangular solids, I-Beams (IPE / HEB), Hollow boxes (RHS / SHS), Solid bars, and Tubes.
* **Material Database**: Built-in modulus of elasticity ($E$) and yield strength for Structural Steel (S235/S355), Stainless Steel (304), Aluminium (6082-T6), Timber (C24), and Concrete (C25/30).
* **Dual Unit System**: Seamless 1-click toggle between **Metric (SI / Eurocode)** and **Imperial (US Customary / AISC)** with automated parameter conversion.
* **Live Mathematical Substitution**: Step-by-step formula derivation with active user parameters substituted dynamically.
* **Export & Sharing**: One-click clipboard report generation, print-ready CSS for PDF generation, and shareable URL state hash.

---

### 📐 Structural Mechanics Reference & Equations

For a simply supported beam with span $L$ under uniform distributed load $w$:

| Quantity | Formula | Eurocode / DIN / AISC Notation |
| :--- | :--- | :--- |
| **Reaction Forces** | $R_A = R_B = \frac{w \cdot L}{2}$ | Vertical bearing reactions |
| **Maximum Shear Force** | $V_{\max} = R_A = \frac{w \cdot L}{2}$ | Shear at ends ($x = 0, x = L$) |
| **Shear at Distance $x$** | $V(x) = w \cdot \left(\frac{L}{2} - x\right)$ | Linear distribution |
| **Maximum Bending Moment** | $M_{\max} = \frac{w \cdot L^2}{8}$ | Parabolic peak at midspan ($x = L/2$) |
| **Moment at Distance $x$** | $M(x) = \frac{w \cdot x}{2} \cdot (L - x)$ | Parabolic curve |
| **Maximum Deflection** | $\delta_{\max} = \frac{5 \cdot w \cdot L^4}{384 \cdot E \cdot I}$ | Elastic curve peak at midspan |
| **Deflection at Distance $x$** | $\delta(x) = \frac{w \cdot x}{24 \cdot E \cdot I} \left(L^3 - 2 L x^2 + x^3\right)$ | 4th-order polynomial |
| **Bearing Rotation Angle** | $\theta_A = \theta_B = \frac{w \cdot L^3}{24 \cdot E \cdot I}$ | Slope at supports (radians) |
| **Maximum Bending Stress** | $\sigma_{\max} = \frac{M_{\max}}{W_y} = \frac{M_{\max} \cdot (h / 2)}{I_y}$ | Outer fiber extreme stress |

---

### 💻 Technologies

* **Frontend**: Modern Vanilla JavaScript (ES6 Modules), HTML5, CSS3 Custom Properties.
* **Graphics**: Scalable Vector Graphics (SVG) with parametric mathematical path generation.
* **Design System**: Obsidian/Titanium dark architecture, technical glassmorphism, responsive mobile-first grid.
* **Zero Dependencies**: 100% lightweight native browser code with zero build step required.

---

### 👤 Author

Developed by **Walter Lehn (@xallace)**  
*Technischer Produktdesigner (IHK) · Mechanical & Computational Systems*  
Portfolio: [xallace.github.io](https://xallace.github.io)
