# Plate I · Engineering Formulas & Break-Even Analysis

Interactive engineering math studio covering quantity equations, numerical-value equations, linear functions, and break-even production analysis per **DIN EN ISO 80000-2**. All code, graphics, and worked scenarios are independently created.

Live at: **[https://xallace.github.io/engineering-graphics/formulas-equations/](https://xallace.github.io/engineering-graphics/formulas-equations/)**

## Tabs & Interactive Models

| Tab | Module | Key Equations & Features |
| :--- | :--- | :--- |
| **1 Formulas** | `#formeln` | Quantity equation $v_c = \pi \cdot d \cdot n$ with carried units (`mm`, `cm`, `m`, `1/min`, `1/s`), animated turning/milling diagrams, interactive formula component highlighting, and practice quiz. |
| **2 Numerical-Value Eq.** | `#zahlenwert` | Torque equation $M = 9550 \cdot P / n$ (`kW`, `1/min` → `N·m`), unit-error trap demonstration, derivation of $60\,000 / 2\pi$, and interactive hyperbola operating point. |
| **3 Linear Function** | `#linear` | $y = m \cdot x + b$ with draggable points **B** and **P**, slope triangle, live editable value table, and line-reading exercises. |
| **4 Cost & Break-Even** | `#kosten` | Production total cost $K_G = K_v \cdot M + K_f$ vs. revenue $E = E/\text{unit} \cdot M$, CNC housing & batch manufacturing presets, profit/loss regions, and break-even exercises. |

## Verification

```bash
node tests/verify.js
```
