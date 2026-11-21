# Deviations from design freeze v1.0

As of 21.11.2026, measured with `node design/check.mjs <app> --browser` (390 and 1440 px, headless Edge).
These apps were built before the freeze. They are legacy and are brought in line **app by app, only when Walter asks**.
Re-run the check after a fix and update this list in the same commit.

Levels: **error** = breaks a hard rule, **warn** = should be fixed, **note** = information (e.g. not on `xallace-ui.css` yet, hard-coded drawing colours).

| App | Errors | Warnings | Notes | Rules hit (errors + warnings) |
|---|---:|---:|---:|---|
| engineering-graphics | 0 | 9 | 14 | palette×8, tests |
| cycloid-simulation | 0 | 6 | 5 | wording×4, back-link, palette |
| iso1101-straightness | 0 | 5 | 4 | wording×3, back-link, palette |
| beam-calculator | 0 | 4 | 3 | wording×3, palette |
| dostojewski-presentation | 0 | 4 | 2 | dark-only, tests, lang, back-link |
| gps-grundlagen | 0 | 4 | 1 | wording×3, palette |
| web-cad-studio | 0 | 4 | 4 | dark-only, tests, back-link, palette |
| city-qr | 0 | 3 | 2 | dark-only, tests, palette |
| gravrallye | 0 | 3 | 2 | tests, lang, back-link |
| iso14405-banana-shaft | 0 | 3 | 2 | wording×2, palette |
| iso22081-profile-lab | 0 | 3 | 1 | wording×2, palette |
| iso2692-mmr-lab | 0 | 3 | 2 | wording×2, palette |
| iso5459-datum-lab | 0 | 3 | 2 | wording×2, palette |
| solar-utc-clock | 0 | 3 | 2 | dark-only, tests, back-link |
| hub | 0 | 2 | 9 | dark-only, palette |
| kfz-dynamik | 0 | 2 | 9 | dark-only, palette |
| sol-system-orrery | 0 | 2 | 3 | back-link, palette |

## Retired

- **tabellenbuch-metall-formeln**: 21.11.2026, Walter's choice: replaced by a redirect to Engineering Graphics · Plate I (`/engineering-graphics/formulas-equations/`), old files only in git history.

## Details

### xallace.github.io/beam-calculator/
- **warn** `palette` style.css: 15 colour value(s) outside the frozen palette: #fb7158×4, rgb(24,23,21)×3, #151b26×2, rgb(17,23,34)×1, #0e141e×1, #f27166×1
- **warn** `wording` app.js: "1967 Book Plate" in a comment or string
- **warn** `wording` diagram-renderer.js: "1967 Book Plate" in a comment or string
- **warn** `wording` style.css: "1967 Book Plate" in a comment
- **note** `palette` app.js: 1 hard-coded colour(s) outside the palette (prefer tokens): #fbd×1
- **note** `palette` diagram-renderer.js: 2 hard-coded colour(s) outside the palette (prefer tokens): #0e141e×1, #151b25×1
- **note** `ui-css` index.html: not on /design/xallace-ui.css yet (legacy styles, own copy of the tokens)

### xallace.github.io/city-qr/
- **warn** `dark-only` .: no color-scheme: dark (form controls and scrollbars render light)
- **warn** `palette` style.css: 30 colour value(s) outside the frozen palette: rgb(0,240,255)×14, rgb(15,23,42)×3, #94a3b8×2, rgb(14,165,233)×2, #070a12×1, #f8fafc×1
- **warn** `tests` .: no tests/ folder (model checks: node tests/verify.mjs)
- **note** `palette` city-engine.js: 86 hard-coded colour(s) outside the palette (prefer tokens): #38bdf8×3, #00f0ff×2, #070a12×2, #1e293b×2, #180e1a×2, #22c55e×2
- **note** `ui-css` index.html: not on /design/xallace-ui.css yet (legacy styles, own copy of the tokens)

### cycloid-simulation
- **warn** `back-link` index.html: no link back to the portfolio
- **warn** `palette` style.css: 24 colour value(s) outside the frozen palette: #141a25×4, #fb7158×3, rgb(24,23,21)×3, #e5eaf2×3, rgb(229,234,242)×3, rgb(17,23,34)×1
- **warn** `wording` app.js: "1967 Book Plate" in a comment or string
- **warn** `wording` cycloid2d.js: "1967 Book Plate" in a comment or string
- **warn** `wording` scene3d.js: "1967 Book Plate" in a comment or string
- **warn** `wording` style.css: "1967 Book Plate" in a comment
- **note** `palette` app.js: 6 hard-coded colour(s) outside the palette (prefer tokens): #facc15×1, #60a5fa×1, #d94426×1, #181715×1, #0c2340×1, #faf5e8×1
- **note** `palette` cycloid2d.js: 12 hard-coded colour(s) outside the palette (prefer tokens): #101520×1, #9ca7ba×1, #0c2340×1, #091b33×1, rgb(147,197,253)×1, #f8fafc×1
- **note** `palette` math-engine.js: 4 hard-coded colour(s) outside the palette (prefer tokens): #181715×2, #d94426×1, #faf5e8×1
- **note** `palette` scene3d.js: 2 hard-coded colour(s) outside the palette (prefer tokens): rgb(10,16,26)×2
- **note** `ui-css` index.html: not on /design/xallace-ui.css yet (legacy styles, own copy of the tokens)

### dostojewski-presentation
- **warn** `back-link` index.html: no link back to the portfolio
- **warn** `dark-only` .: no color-scheme: dark (form controls and scrollbars render light)
- **warn** `lang` index.html: <html lang="en"> missing (UI language is English)
- **warn** `tests` .: no tests/ folder (model checks: node tests/verify.mjs)
- **note** `favicon` index.html: no <link rel="icon">: the browser asks for /favicon.ico (404)
- **note** `ui-css` index.html: not on /design/xallace-ui.css yet (legacy styles, own copy of the tokens)

### xallace.github.io/engineering-graphics/
- **warn** `palette` basic-constructions\style.css: 32 colour value(s) outside the frozen palette: #151b26×5, rgb(21,27,38)×5, #5bba73×2, #1e242f×2, #0d121c×2, #63a3e6×1
- **warn** `palette` cartesian-diagrams\style.css: 5 colour value(s) outside the frozen palette: #141a24×2, #0e131d×1, #141a25×1, rgb(24,23,21)×1
- **warn** `palette` conics-spirals\style.css: 44 colour value(s) outside the frozen palette: #151b26×8, rgb(21,27,38)×5, #5bba73×2, #1e242f×2, #0d121c×2, #63a3e6×1
- **warn** `palette` formulas-equations\style.css: 6 colour value(s) outside the frozen palette: #0e131d×2, #141a25×1, #1f2837×1, #f89338×1, rgb(24,23,21)×1
- **warn** `palette` plate-theme.css: 25 colour value(s) outside the frozen palette: #0e131d×3, rgb(24,23,21)×3, #141a24×2, #f2755c×2, #141a25×1, #b7c0d0×1
- **warn** `palette` polar-area-charts\style.css: 12 colour value(s) outside the frozen palette: #141a24×2, #0e131d×1, #141a25×1, rgb(24,23,21)×1, #f38a6b×1, #cfae55×1
- **warn** `palette` style.css: 11 colour value(s) outside the frozen palette: rgb(24,23,21)×4, #141a24×2, #f2755c×2, #0e131d×1, #82a2c0×1, rgb(20,26,36)×1
- **warn** `palette` tangents-polygons\style.css: 35 colour value(s) outside the frozen palette: #151b26×8, rgb(21,27,38)×5, #5bba73×2, #1e242f×2, #0d121c×2, #63a3e6×1
- **warn** `tests` .: no tests/ folder (model checks: node tests/verify.mjs)
- **note** `palette` conics-spirals\js\tab-ellipse-parallelogramm.js: 1 hard-coded colour(s) outside the palette (prefer tokens): rgb(99,163,230)×1
- **note** `palette` conics-spirals\js\tab-inkreis.js: 1 hard-coded colour(s) outside the palette (prefer tokens): rgb(99,163,230)×1
- **note** `palette` conics-spirals\js\tab-kreismittelpunkt.js: 1 hard-coded colour(s) outside the palette (prefer tokens): rgb(99,163,230)×1
- **note** `palette` conics-spirals\js\tab-spirale.js: 2 hard-coded colour(s) outside the palette (prefer tokens): rgb(99,163,230)×1, rgb(75,198,255)×1
- **note** `palette` conics-spirals\js\tab-umkreis.js: 1 hard-coded colour(s) outside the palette (prefer tokens): rgb(99,163,230)×1
- **note** `palette` tangents-polygons\js\tab-sechseck.js: 2 hard-coded colour(s) outside the palette (prefer tokens): rgb(75,198,255)×2
- **note** `palette` tangents-polygons\js\tab-vieleck-umkreis.js: 1 hard-coded colour(s) outside the palette (prefer tokens): rgb(75,198,255)×1
- **note** `ui-css` basic-constructions\index.html: not on /design/xallace-ui.css yet (legacy styles, own copy of the tokens)
- **note** `ui-css` cartesian-diagrams\index.html: not on /design/xallace-ui.css yet (legacy styles, own copy of the tokens)
- **note** `ui-css` conics-spirals\index.html: not on /design/xallace-ui.css yet (legacy styles, own copy of the tokens)
- **note** `ui-css` formulas-equations\index.html: not on /design/xallace-ui.css yet (legacy styles, own copy of the tokens)
- **note** `ui-css` index.html: not on /design/xallace-ui.css yet (legacy styles, own copy of the tokens)
- **note** `ui-css` polar-area-charts\index.html: not on /design/xallace-ui.css yet (legacy styles, own copy of the tokens)
- **note** `ui-css` tangents-polygons\index.html: not on /design/xallace-ui.css yet (legacy styles, own copy of the tokens)

### xallace.github.io/gps-grundlagen/
- **warn** `palette` style.css: 3 colour value(s) outside the frozen palette: #0e141e×1, #1d232e×1, rgb(24,23,21)×1
- **warn** `wording` js\app.js: "1967 Book Plate" in a comment or string
- **warn** `wording` js\bundle.js: "1967 Book Plate" in a comment or string
- **warn** `wording` style.css: "1967 Book Plate" in a comment
- **note** `ui-css` index.html: not on /design/xallace-ui.css yet (legacy styles, own copy of the tokens)

### gravrallye
- **warn** `back-link` index.html: no link back to the portfolio
- **warn** `lang` index.html: <html lang="en"> missing (UI language is English)
- **warn** `tests` .: no tests/ folder (model checks: node tests/verify.mjs)
- **note** `favicon` index.html: no <link rel="icon">: the browser asks for /favicon.ico (404)
- **note** `ui-css` index.html: not on /design/xallace-ui.css yet (legacy styles, own copy of the tokens)

### xallace.github.io (hub pages: index, cv, pla-100, packstation, redirects)
- **warn** `dark-only` .: no color-scheme: dark (form controls and scrollbars render light)
- **warn** `palette` style.css: 172 colour value(s) outside the frozen palette: rgb(56,189,248)×34, rgb(212,175,55)×11, #38bdf8×9, rgb(24,23,21)×6, rgb(168,85,247)×6, #030712×5
- **note** `favicon` cv.html: no <link rel="icon">: the browser asks for /favicon.ico (404)
- **note** `palette` main.js: 3 hard-coded colour(s) outside the palette (prefer tokens): rgb(56,189,248)×2, rgb(139,92,246)×1
- **note** `redirect` beam-calculator.html: redirect stub, skipped
- **note** `redirect` city-qr.html: redirect stub, skipped
- **note** `redirect` kfz-dynamik.html: redirect stub, skipped
- **note** `ui-css` cv.html: not on /design/xallace-ui.css yet (legacy styles, own copy of the tokens)
- **note** `ui-css` index.html: not on /design/xallace-ui.css yet (legacy styles, own copy of the tokens)
- **note** `ui-css` packstation.html: not on /design/xallace-ui.css yet (legacy styles, own copy of the tokens)
- **note** `ui-css` pla-100.html: not on /design/xallace-ui.css yet (legacy styles, own copy of the tokens)

### iso1101-straightness
- **warn** `back-link` index.html: no link back to the portfolio
- **warn** `palette` style.css: 13 colour value(s) outside the frozen palette: #fb7158×3, rgb(24,23,21)×3, rgb(17,23,34)×1, #66b093×1, #f27166×1, #0e141e×1
- **warn** `wording` draw2d.js: "1967 Book Plate" in a comment or string
- **warn** `wording` scene3d.js: "1967 Book Plate" in a comment or string
- **warn** `wording` style.css: "1967 Book Plate" in a comment
- **note** `palette` data.js: 1 hard-coded colour(s) outside the palette (prefer tokens): #0d121c×1
- **note** `palette` draw2d.js: 2 hard-coded colour(s) outside the palette (prefer tokens): #0e141e×1, rgb(14,20,30)×1
- **note** `palette` scene3d.js: 2 hard-coded colour(s) outside the palette (prefer tokens): #0d121c×1, rgb(10,16,26)×1
- **note** `ui-css` index.html: not on /design/xallace-ui.css yet (legacy styles, own copy of the tokens)

### iso14405-banana-shaft
- **warn** `palette` style.css: 3 colour value(s) outside the frozen palette: rgb(17,23,34)×1, #0e141e×1, #fb7158×1
- **warn** `wording` draw.js: "1967 Book Plate" in a comment or string
- **warn** `wording` style.css: "1967 Book Plate" in a comment
- **note** `palette` draw.js: 8 hard-coded colour(s) outside the palette (prefer tokens): #0e141e×1, #141a25×1, #95a0b4×1, #29303c×1, #181e29×1, #a487ff×1
- **note** `ui-css` index.html: not on /design/xallace-ui.css yet (legacy styles, own copy of the tokens)

### iso22081-profile-lab
- **warn** `palette` style.css: 5 colour value(s) outside the frozen palette: #fb7158×1, #f0745d×1, #d8885b×1, #66b093×1, #61a6d7×1
- **warn** `wording` draw.js: "1967 Book Plate" in a comment or string
- **warn** `wording` style.css: "1967 Book Plate" in a comment
- **note** `ui-css` index.html: not on /design/xallace-ui.css yet (legacy styles, own copy of the tokens)

### iso2692-mmr-lab
- **warn** `palette` style.css: 1 colour value(s) outside the frozen palette: #fb7158×1
- **warn** `wording` draw.js: "1967 Book Plate" in a comment or string
- **warn** `wording` style.css: "1967 Book Plate" in a comment
- **note** `palette` draw.js: 7 hard-coded colour(s) outside the palette (prefer tokens): rgb(21,27,38)×2, #0e141e×1, #151b26×1, #95a0b4×1, #29303c×1, #181e29×1
- **note** `ui-css` index.html: not on /design/xallace-ui.css yet (legacy styles, own copy of the tokens)

### iso5459-datum-lab
- **warn** `palette` style.css: 2 colour value(s) outside the frozen palette: #fb7158×1, #f0745d×1
- **warn** `wording` draw.js: "1967 Book Plate" in a comment or string
- **warn** `wording` style.css: "1967 Book Plate" in a comment
- **note** `palette` draw.js: 13 hard-coded colour(s) outside the palette (prefer tokens): rgb(21,27,38)×2, rgb(16,22,32)×2, #0e141e×1, #151b26×1, #95a0b4×1, #29303c×1
- **note** `ui-css` index.html: not on /design/xallace-ui.css yet (legacy styles, own copy of the tokens)

### xallace.github.io/kfz-dynamik/
- **warn** `dark-only` .: no color-scheme: dark (form controls and scrollbars render light)
- **warn** `palette` style.css: 36 colour value(s) outside the frozen palette: rgb(56,189,248)×5, rgb(2,6,23)×4, #070a12×2, #38bdf8×2, #34d399×2, #f87171×2
- **note** `palette` js\tabs\bremsung.js: 14 hard-coded colour(s) outside the palette (prefer tokens): #fbbf24×4, #475569×3, rgb(148,163,184)×1, #64748b×1, #94a3b8×1, rgb(56,189,248)×1
- **note** `palette` js\tabs\fahrleistung.js: 6 hard-coded colour(s) outside the palette (prefer tokens): #fbbf24×2, #e2e8f0×1, #64748b×1, #94a3b8×1, #475569×1
- **note** `palette` js\tabs\fahrverhalten.js: 13 hard-coded colour(s) outside the palette (prefer tokens): #fbbf24×4, #64748b×2, #94a3b8×2, rgb(56,189,248)×2, #f87171×1, rgb(148,163,184)×1
- **note** `palette` js\tabs\reifen.js: 7 hard-coded colour(s) outside the palette (prefer tokens): #fbbf24×4, #e2e8f0×2, #94a3b8×1
- **note** `palette` js\tabs\schwingung.js: 14 hard-coded colour(s) outside the palette (prefer tokens): #64748b×3, #94a3b8×3, #fbbf24×2, #cbd5e1×2, #111827×1, #1f2937×1
- **note** `palette` js\ui\chart.js: 2 hard-coded colour(s) outside the palette (prefer tokens): #94a3b8×1, #e2e8f0×1
- **note** `palette` js\ui\controls.js: 7 hard-coded colour(s) outside the palette (prefer tokens): #38bdf8×1, #f59e0b×1, #34d399×1, #f472b6×1, #a78bfa×1, #f87171×1
- **note** `palette` js\ui\reifen3d.js: 6 hard-coded colour(s) outside the palette (prefer tokens): #94a3b8×3, #e2e8f0×3
- **note** `ui-css` index.html: not on /design/xallace-ui.css yet (legacy styles, own copy of the tokens)

### sol-system-orrery
- **warn** `back-link` index.html: no link back to the portfolio
- **warn** `palette` styles.css: 121 colour value(s) outside the frozen palette: rgb(237,203,140)×23, rgb(5,9,15)×4, rgb(10,17,27)×4, rgb(8,14,23)×3, rgb(7,12,20)×3, #0a111b×2
- **note** `palette` src\catalog.js: 20 hard-coded colour(s) outside the palette (prefer tokens): #f6c96b×1, #ffe7ac×1, #a6a8a6×1, #d5d7d3×1, #e3cb99×1, #f7e7bd×1
- **note** `palette` src\scene.js: 13 hard-coded colour(s) outside the palette (prefer tokens): rgb(210,224,255)×2, rgb(218,141,48)×2, rgb(22,22,21)×1, rgb(244,238,224)×1, rgb(245,249,255)×1, rgb(255,245,214)×1
- **note** `ui-css` index.html: not on /design/xallace-ui.css yet (legacy styles, own copy of the tokens)

### solar-utc-clock
- **warn** `back-link` index.html: no link back to the portfolio
- **warn** `dark-only` .: no color-scheme: dark (form controls and scrollbars render light)
- **warn** `tests` .: no tests/ folder (model checks: node tests/verify.mjs)
- **note** `favicon` index.html: no <link rel="icon">: the browser asks for /favicon.ico (404)
- **note** `ui-css` index.html: not on /design/xallace-ui.css yet (legacy styles, own copy of the tokens)

### web-cad-studio
- **warn** `back-link` index.html: no link back to the portfolio
- **warn** `dark-only` .: no color-scheme: dark (form controls and scrollbars render light)
- **warn** `palette` style.css: 38 colour value(s) outside the frozen palette: rgb(0,136,255)×7, #0088ff×2, rgb(0,210,211)×2, rgb(21,23,29)×2, #121316×1, #1a1c23×1
- **warn** `tests` .: no tests/ folder (model checks: node tests/verify.mjs)
- **note** `favicon` index.html: no <link rel="icon">: the browser asks for /favicon.ico (404)
- **note** `palette` js\app.js: 22 hard-coded colour(s) outside the palette (prefer tokens): #323642×10, #a0a5b0×5, #d4af37×3, #00d2d3×2, #888×1, #15171d×1
- **note** `palette` js\cad-engine.js: 4 hard-coded colour(s) outside the palette (prefer tokens): rgb(18,20,27)×1, #ff5c5c×1, #2ecc71×1, #3498ff×1
- **note** `ui-css` index.html: not on /design/xallace-ui.css yet (legacy styles, own copy of the tokens)
