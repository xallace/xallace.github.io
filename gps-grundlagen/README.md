# GPS Fundamentals • Geometrical Tolerances

Interactive learning guide to Geometrical Product Specifications (GPS) per DIN EN ISO 1101 and DIN EN ISO 8015:2011. Styled after the Mechanical Engineering Handbook apps: blueprint dark mode by default, toggleable to light mode.

## Tabs

| Tab | Content |
| :--- | :--- |
| 1 Overview | The 14 tolerance types in four groups (Form, Orientation, Location, Run-out) with symbol and datum rule. Line profile and surface profile appear in three groups. |
| 2 Tolerance Types | Four columns per tolerance type: Symbol, Drawing Callout, Tolerance Zone, Deviation. Below: tolerated feature, zone, controlled tolerances, inspection equipment, and a note. Key rule per group. |
| 3 Tolerance Frame | Assemble a frame (type, value, Ø, Ⓜ, up to three datums). The page reads it aloud in plain words and checks typical errors: datum on a form tolerance, missing datum on orientation or run-out, Ø or Ⓜ on the wrong tolerance type, datum letters I, O, Q, X, duplicate or more than three datums. |
| 4 ISO 8015 Principles | The 13 principles from Clause 5 summarized in plain language with practical relevance. Plus an interactive calculator comparing independency vs. envelope requirement Ⓔ on a shaft Ø20 −0.1. |
| 5 Practice | Randomized questions: identify symbol, assign group, datum required?, identify zone, validate tolerance frame. |

Direct entry via URL hash, e.g. `#toleranzarten/pos` or `#rahmen`.

## Sources

- DIN EN ISO 8015:2011-09, Clause 5 (Principles) — paraphrased summary, not verbatim quotes
- DIN EN ISO 5459:2011, 7.2.2 (avoid datum letters I, O, Q, X)
- DIN EN ISO 1101, ISO 2692 (Ⓜ), ISO 14405-1 (Ⓔ)
- B. Klein: Toleranzdesign im Maschinen- und Fahrzeugbau, 5th ed. 2021, Table 7.1 (14 tolerance types, datum required yes/no)
- G. Henzold: Geometrical Dimensioning and Tolerancing for Design, Manufacturing and Inspection, 3rd ed. 2021
- ZEISS: GPS Poster – Geometrical Product Specifications (VIII/2023)

All drawings are custom SVG illustrations. Deviation diagrams compute *f* directly from the plotted actual profile (minimum zone in the specified direction); curvatures are exaggerated.

## Verify

```
node tests/verify.mjs                 # data, rules, and all 42 drawings (150 checks)
node tests/verify.mjs --sheet x.svg   # additionally generate preview sheet of all drawings
```

Zero dependencies. Sources in `js/` are ES modules; `index.html` loads `js/bundle.js` so the page also runs when opened directly via `file://`. Rebuild after any change in `js/`:

```
node build.mjs
```
