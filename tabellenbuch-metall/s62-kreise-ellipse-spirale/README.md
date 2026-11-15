# Tabellenbuch Metall • p. 62: Incircle, Circumcircle, Circle Center, Ellipse, Spiral

Interactive teaching model and geometric construction assistant for **Tabellenbuch Metall** (Mechanical & Metal Trades Handbook, 48th Edition, Europa-Lehrmittel), Chapter 3.2 *Basic Geometric Constructions* (p. 62):

1. **Incircle of a Triangle**: Angle bisectors $w_\alpha$ and $w_\beta$, intersection $M$, perpendicular feet, incircle radius $r = A_\triangle / s$.
2. **Circumcircle of a Triangle**: Perpendicular bisectors on $AB$ and $BC$, intersection $M$, circumcircle radius $R = \frac{a \cdot b \cdot c}{4 A_\triangle}$, Thales' theorem, and location of $M$ for acute, right-angled, and obtuse triangles.
3. **Determining the Center of a Circle**: Two arbitrary chords $AB$ and $CD$, construction of perpendicular bisectors, determination of $M$ with workshop notes on optimal intersection angle.
4. **Ellipse Construction from Two Circles (Concentric-Circle Method)**: Major and minor circles centered at $M$ ($d = AB, d = CD$), rays through $M$ intersecting at $E$ and $F$, parallels to the principal axes, foci $F_1, F_2$, and linear eccentricity $e = \sqrt{a^2 - b^2}$.
5. **Ellipse Construction in a Parallelogram**: Affine construction for axonometric pictorials (isometry and dimetry per DIN ISO 5456-3) via division into 1, 2, 3 and transfer using an auxiliary semicircle with $r = MC$.
6. **Spiral (Approximate Construction with a Compass)**: Four-center Archimedean spiral with central square $s = a/4$, tangentially continuous quarter-circle arcs ($C^1$ transitions), radius sequence $r_k = k \cdot a/4$, and pitch $a$.

## Automated Verification

All mathematical algorithms and constructions are verified with Node.js:

```bash
node tests/verify.js
```

## Features

- **Step-by-Step Player**: Every construction step (0 to 6) can be stepped through manually or played with automatic animation.
- **Interactive Drag Handles**: Triangle vertices $A, B, C$ can be dragged freely on the canvas.
- **Blueprint Mode**: Toggle between light royal-blue theme and high-contrast Blueprint dark mode.
- **Diagnostic Exercises**: Built-in quiz with dynamic calculation and construction questions.
- **Zero Dependencies**: Pure vanilla JS, SVG, and CSS with no external libraries.
