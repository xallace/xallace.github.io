# Basic Geometric Constructions: Segments, Perpendiculars, Angles – Tabellenbuch Metall p. 60

Interactive study companion to page 60, "3.2 Basic Geometric Constructions – Segments, Perpendiculars, Angles" from
**Mechanical & Metal Trades Handbook (Tabellenbuch Metall)**, 48th edition (Europa-Lehrmittel), Section **K** (Engineering Drawing / Technical Communication).
All explanations, texts, and vector graphics were authored independently; the six classical compass-and-straightedge constructions and their numbering follow the handbook.

Open `index.html` by double-clicking it. The application requires no server, no external libraries, and no internet connection.

## The 6 Tabs (Basic Constructions)

| Tab | Basic Construction (p. 60) | Interactive Features & Geometric Core |
| :--- | :--- | :--- |
| **1 Parallel** (`#parallele`) | **Parallel line to a segment** ($\overline{AB}$, point $P$ on $g'$) | 4-step compass construction using a single radius $r = \overline{AP}$ ($1\to C$, $2\to$ arc around $P$, $3\to D$, $4\to g'$). Toggleable rhombus proof ($ACDP$), perpendicular distance $h$, draggable points $P, A, B$, and step-by-step animation. |
| **2 Bisect Segment** (`#halbieren`) | **Bisecting a line segment** (perpendicular bisector $m$) | Arcs 1 and 2 around $A$ and $B$ with $r > \frac{1}{2}\,\overline{AB}$; line 3 through the intersections yields midpoint $M$ ($\overline{AM} = \overline{MB}$, $90^\circ$). Adjustable ratio $r / \overline{AB}$ including an interactive limit check for $r \le \frac{1}{2}\,\overline{AB}$. |
| **3 Drop Perpendicular** (`#lot`) | **Dropping a perpendicular** (from point $P$ onto line $g$) | Arc 1 ($r_1 > d$) around $P$ cuts $A$ and $B$ on $g$; arcs 2 and 3 ($r > \frac{1}{2}\,\overline{AB}$) around $A$ and $B$ yield $C$; line 4 ($\overline{PC}$) is perpendicular to $g$. Freely draggable point $P$ and kite proof. |
| **4 Perpendicular at P** (`#senkrechte`) | **Erecting a perpendicular at point P** | Endpoint construction with **a single compass radius $r$**: arc 1 around $P \to A$, arc 2 around $A \to B$ ($60^\circ$), arc 3 around $B$, extend line $\overline{AB} \to C$, perpendicular 5 ($\overline{PC} = r\sqrt{3}$). Toggleable Thales circle around $B$ ($\overline{AC} = 2r$) and Left/Right side switch. |
| **5 Bisect Angle** (`#winkel`) | **Bisecting an angle** (angle bisector $w_\alpha$) | Arc 1 around vertex $S \to A, B$; arcs 2 and 3 ($r > \frac{1}{2}\,\overline{AB}$) around $A$ and $B \to C$; line 4 ($\overline{SC}$) splits $\alpha$ into $\alpha/2$ and $\alpha/2$. Draggable angle leg ($\alpha = 24^\circ\dots 156^\circ$) and congruence proof $\triangle SAC \cong \triangle SBC$. |
| **6 Divide Segment** (`#teilen`) | **Dividing a line segment** (intercept theorem, $n = 5$) | Auxiliary ray at an arbitrary angle $\beta$ from $A$, $n$ equal compass steps $1'\dots n'$, line $\overline{n'B}$, and parallels through all step points ($\Delta l = \overline{AB}/n$). Selectable part count $n \in \{3,4,5,6,7,8\}$ and draggable auxiliary ray. |

## Automated Checks

```bash
node tests/verify.js                   # Geometric calculation core: 62 checks across all 6 constructions
node tests/screenshots.js <output-dir> # Headless Edge: renders states from tests/steps.json to PNG
```
