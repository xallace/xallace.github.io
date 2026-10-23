# Geometrische Grundkonstruktionen: Strecken, Lote, Winkel – Tabellenbuch Metall S. 60

Interaktive Lernhilfe zur Seite 60 „3.2 Geometrische Grundkonstruktionen – Strecken, Lote, Winkel“ aus
**Tabellenbuch Metall**, 48. Auflage (Europa-Lehrmittel), Fachbereich **K** (Technische Kommunikation).
Sämtliche Texte, Erklärungen und Vektorgrafiken sind eigenständig erstellt; aus dem Buch stammen sinngemäß die
sechs klassischen Zirkel- und Linealkonstruktionen sowie deren Nummerierung.

`index.html` per Doppelklick öffnen. Die Anwendung benötigt keinen Server, keine externen Bibliotheken und keine Internetverbindung.

## Die 6 Reiter (Grundkonstruktionen)

| Reiter | Grundkonstruktion (S. 60) | Interaktive Funktionen & Geometrischer Kern |
| :--- | :--- | :--- |
| **1 Parallele** (`#parallele`) | **Parallele zu einer Strecke** ($\overline{AB}$, Punkt $P$ auf $g'$) | 4-stufige Zirkelkonstruktion mit gleichem Radius $r = \overline{AP}$ ($1\to C$, $2\to$ Bogen um $P$, $3\to D$, $4\to g'$). Einblendbarer Rauten-Beweis ($ACDP$), Lotabstand $h$, ziehbare Punkte $P, A, B$ und Schritt-Animation. |
| **2 Strecke halbieren** (`#halbieren`) | **Halbieren einer Strecke** (Mittelsenkrechte $m$) | Kreisbögen 1 und 2 um $A$ und $B$ mit $r > \frac{1}{2}\,\overline{AB}$, Verbindungslinie 3 durch die Schnittpunkte liefert den Mittelpunkt $M$ ($\overline{AM} = \overline{MB}$, $90^\circ$). Einstellbares Verhältnis $r / \overline{AB}$ inklusive anschaulicher Grenzwertprüfung für $r \le \frac{1}{2}\,\overline{AB}$. |
| **3 Lot fällen** (`#lot`) | **Fällen eines Lotes** (von Punkt $P$ auf Gerade $g$) | Kreisbogen 1 ($r_1 > d$) um $P$ schneidet $A$ und $B$ auf $g$ aus; Kreisbögen 2 und 3 ($r > \frac{1}{2}\,\overline{AB}$) um $A$ und $B$ liefern $C$; Gerade 4 ($\overline{PC}$) steht senkrecht auf $g$. Frei verschiebbarer Punkt $P$ und Drachenviereck-Beweis. |
| **4 Senkrechte in P** (`#senkrechte`) | **Errichten einer Senkrechten im Punkt P** | Randpunkt-Konstruktion mit **einem einzigen Zirkelradius $r$**: Bogen 1 um $P \to A$, Bogen 2 um $A \to B$ ($60^\circ$), Bogen 3 um $B$, Gerade $\overline{AB}$ verlängern $\to C$, Senkrechte 5 ($\overline{PC} = r\sqrt{3}$). Einblendbarer Thaleskreis um $B$ ($\overline{AC} = 2r$) und Umschaltung Links/Rechts. |
| **5 Winkel halbieren** (`#winkel`) | **Halbieren eines Winkels** (Winkelhalbierende $w_\alpha$) | Kreisbogen 1 um Scheitelpunkt $S \to A, B$; Bögen 2 und 3 ($r > \frac{1}{2}\,\overline{AB}$) um $A$ und $B \to C$; Verbindungslinie 4 ($\overline{SC}$) teilt $\alpha$ in $\alpha/2$ und $\alpha/2$. Ziehbarer Winkelschenkel ($\alpha = 24^\circ\dots 156^\circ$) und Kongruenzbeweis $\triangle SAC \cong \triangle SBC$. |
| **6 Strecke teilen** (`#teilen`) | **Teilen einer Strecke** (Strahlensatz, $n = 5$) | Hilfsstrahl unter beliebigem Winkel $\beta$ ab $A$, $n$ gleiche Zirkelschritte $1'\dots n'$, Verbindung $\overline{n'B}$ und Parallelen durch alle Teilpunkte ($\Delta l = \overline{AB}/n$). Wählbare Teilezahl $n \in \{3,4,5,6,7,8\}$ und ziehbarer Hilfsstrahl. |

## Automatisierte Prüfungen

```bash
node tests/verify.js                      # Geometrischer Rechenkern: 62 Prüfungen über alle 6 Konstruktionen
node tests/screenshots.js <ausgabeordner> # Headless-Edge: Zustände aus tests/steps.json als PNG
```
