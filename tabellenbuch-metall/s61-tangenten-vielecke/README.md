# Geometrische Grundkonstruktionen: Tangenten, Kreisbögen, Vielecke – Tabellenbuch Metall S. 61

Interaktive Lern- und Simulationshilfe zur Seite 61 „3.2 Geometrische Grundkonstruktionen – Tangenten, Kreisbögen, Vielecke“ aus
**Tabellenbuch Metall**, 48. Auflage (Europa-Lehrmittel), Fachbereich **K** (Technische Kommunikation).
Sämtliche Texte, Erklärungen, mathematischen Rechenkerne und Vektorgrafiken sind eigenständig erstellt; aus dem Buch stammen sinngemäß die
sechs klassischen Zirkel- und Linealkonstruktionen sowie deren Nummerierung.

`index.html` per Doppelklick öffnen. Die Anwendung benötigt keinen Webserver, keine externen Bibliotheken und keine Internetverbindung (Zero Dependencies).

---

## Die 6 Reiter (Grundkonstruktionen)

| Reiter | Grundkonstruktion (S. 61) | Interaktive Funktionen & Geometrischer Kern |
| :--- | :--- | :--- |
| **1 Tangente in P** (`#tangente-p`) | **Tangente durch Kreispunkt P** ($P$ auf Kreis) | Verlängern des Radiusstrahls $\overline{MP}$, symmetrischer Hilfskreis um $P$ mit $r_1 \to A, B$ und Mittelsenkrechte $CD$ mit $r_2 > r_1$. Ziehbarer Berührpunkt $P$ auf der Kreislinie, Orthogonalitätsnachweis ($\overline{CD} \perp \overline{MP}$, $90{,}0^\circ$). |
| **2 Tangente von P** (`#tangente-aussen`) | **Tangente von einem Punkt P an den Kreis** ($P$ außen) | Halbierung $\overline{MP} \to A$, Thaleskreis um $A$ mit $r = \overline{AM} = \frac{1}{2}\,\overline{MP}$. Schnittpunkt $T$ liefert Tangente $\overline{PT}$. Satz des Thales ($\angle MTP = 90^\circ$), Pythagoras-Prüfung $R^2 + L^2 = \overline{MP}^2$, frei ziehbarer Punkt $P$, Umschaltung beider Tangenten ($T$ und $T'$). |
| **3 Rundung am Winkel** (`#rundung-winkel`) | **Rundung am Winkel** (Ausrundung mit Radius $r$) | Parallelen zu den Schenkeln im Abstand $r \to$ Schnittpunkt $M$. Lote von $M$ auf die Schenkel $\to$ Übergangspunkte $C$ und $D$. Stetiger tangentialer Übergang ($C^1$). Einstellbarer Winkel $\alpha$ ($30^\circ\dots 145^\circ$), Tangentenabschnitt $t = r / \tan(\alpha/2)$, Scheitelabstand $SM = r / \sin(\alpha/2)$, Drachenviereck-Beweis. |
| **4 Kreisverbindung** (`#kreisverbindung`) | **Verbindung zweier Kreise durch Kreisbögen** | Konkave Ausrundung mit Innenradius $R_i$ (Bögen $R_i + r_1$, $R_i + r_2 \to A$) und konvexe Hülle mit Außenradius $R_a$ (Bögen $R_a - r_1$, $R_a - r_2 \to D$). Berührpunkte $B, C, E, F$ auf den Zentrenverbindungen (Kollinearität). Umschaltbare Vollkontur (Nocken-, Flansch- und Pleuelkopf). |
| **5 Vieleck im Umkreis** (`#vieleck-umkreis`) | **Regelmäßiges Vieleck im Umkreis** (z. B. Fünfeck) | Universalkonstruktion nach Bion: Vertikaler Durchmesser $\overline{AB}$ in $n$ gleiche Teile teilen (nach S. 60). Kreisbogen mit $r = \overline{AB}$ um $A \to$ Polpunkte $C, D$ im Abstand $R\sqrt{3}$. Polstrahlen durch ungerade Teilpunkte (bei ungeradem $n$) bzw. gerade Teilpunkte (bei geradem $n$). Wählbare Eckzahl $n \in \{3\dots 10\}$, 99,15% Genauigkeit beim Fünfeck, 100% beim Sechseck. |
| **6 Sechseck, Zwölfeck** (`#sechseck-zwoelfeck`) | **Sechseck, Zwölfeck im Umkreis** | Mit unverändertem Zirkelradius $r = d/2$ Bögen um $A$ und $B$ schlagen $\to$ exaktes Sechseck ($s = r$). Zusätzliche Einstiche in $C$ und $D$ für Zwölfeck ($30^\circ$-Teilung). Technische Bemaßung: Schlüsselweite $SW = d\frac{\sqrt{3}}{2}$ für Sechskantschrauben (DIN EN ISO 4014 / DIN 931) und Eckenmaß $e = d$. |

---

## Automatisierte Prüfungen

```bash
node tests/verify.js                      # Geometrischer Rechenkern: 24 analytische Prüfungen über alle 6 Konstruktionen
node tests/screenshots.js <ausgabeordner> # Headless-Edge: Generiert PNG-Screenshots der Zustände aus tests/steps.json
```
