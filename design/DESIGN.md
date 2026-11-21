# xallace design freeze · v1.0

**Status:** frozen since 21.11.2026 · **Owner:** Walter Lehn · **Applies to:** every app and page on `xallace.github.io`
(the hub repo, its subfolders and the separate app repos served under it).

Read this before building or changing a portfolio app, whether you are Claude, agy or anyone else.

| File | Purpose |
|---|---|
| [`xallace-ui.css`](xallace-ui.css) | Frozen tokens and base components. Every new app loads it. |
| [`index.html`](index.html) | Living style guide, served at `https://xallace.github.io/design/` (not linked from the hub). |
| [`template/`](template/) | Starter app: copy it to start a new app. |
| [`check.mjs`](check.mjs) | Compliance check. Run it before every push. |
| [`DEVIATIONS.md`](DEVIATIONS.md) | Where the existing apps differ from v1.0, as of the freeze. |
| `/fonts/xallace-type.css`, `/fonts/xallace-type.js` | Type system (self-hosted fonts, OFL 1.1), part of the freeze. |

---

## 1 · Freeze rule

- The look described here is fixed. Do not add colours or fonts, and do not restyle components, on your own.
- Changes need **Walter's explicit OK**. Then bump the version and add a changelog line (§12):
  - **patch** (1.0.1): a fix that does not change the look;
  - **minor** (1.1): a new token or component;
  - **major** (2.0): a change to the existing look.
- App-specific CSS is allowed for layout and for parts that exist only in that app. It must use the tokens, not new values.
- Existing apps made before the freeze are *legacy*. Bring one in line with v1.0 only when Walter asks for that app
  (see `DEVIATIONS.md`).

## 2 · Page skeleton (mandatory)

```html
<!DOCTYPE html>
<html lang="en" data-accent="slate">          <!-- one of the five accents, §3 -->
<head>
  <meta charset="UTF-8" />
  <link rel="stylesheet" href="/fonts/xallace-type.css">
  <link rel="stylesheet" href="/design/xallace-ui.css">
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>App Name · short subject</title>
  <meta name="description" content="…" />
  <link rel="stylesheet" href="style.css" />  <!-- app-specific rules only -->
</head>
<body>
  <div class="app"> header · main.workspace · footer.site-footer </div>
  <script src="model.js"></script>             <!-- pure maths, tested by tests/verify.mjs -->
  <script src="app.js"></script>
  <script src="/fonts/xallace-type.js" defer></script>
</body>
</html>
```

The paths are root-relative because all repos share the origin `xallace.github.io`. Under `file://` the fonts and the UI
CSS are missing; that is accepted. Test with a local server that maps `/` to the hub clone (`check.mjs --browser` does this).

## 3 · Colour

**Dark only.** No light mode, no theme toggle, no `prefers-color-scheme: light`. `color-scheme: dark` is set by `xallace-ui.css`.

| Group | Tokens |
|---|---|
| Surfaces | `--bg-app #090d16` · `--bg-panel #0f151f` · `--bg-card-solid #111722` · `--bg-glass` · `--bg-hover` |
| Text | `--text-main #e9edf5` · `--text-muted #a8b3c5` · `--text-dim #7f8b9f` · `--on-accent #111722` (text on accent fills) |
| Lines | `--border` (0.19) · `--border-soft` (0.11) · `--border-strong` (accent 0.55) |
| Status, fixed | `--st-ok #58b691` · `--st-fail #ff695d` · `--st-warn #ed864b` · `--st-info #56a8e4` and the matching `--ok-bg`, `--fail-bg`, `--warn-bg`, `--info-bg` |
| Drawing | `--draw-paper #0a101a` · `--draw-grid` · `--draw-ink #e9edf5` · `--draw-ink-soft #a8b3c5` · `--draw-dim #7f8b9f` · `--draw-part-fill` |

**Accent: one per app**, chosen from five, set once on `<html data-accent="…">` (on `<html>`, not on `body`):

| Accent | Value | Typical use |
|---|---|---|
| `vermilion` | `#ff7d61` | default; the GD&T labs |
| `slate` | `#7aa3c8` | drawing and geometry tools |
| `emerald` | `#58b691` | |
| `cyan` | `#56a8e4` | |
| `ochre` | `#ed864b` | |

The accent drives active tabs, solid buttons, sliders, focus rings, dimension lines in drawings and links.
Derived tokens: `--accent`, `--accent-rgb`, `--accent-soft`, `--accent-line`, `--border-strong`.
Status colours do **not** follow the accent. A status always comes with a word (PASS, FAIL, CHECK …), never colour alone.
No other colours appear in the UI. `#000`/`#fff` are allowed only for print exports (§7).

## 4 · Type

| Role | Variable | Font | Use |
|---|---|---|---|
| Title | `--xt-title` | GFS Didot (Regular only) | h1, headings, big result values |
| Text | `--xt-text` | Libre Caslon Text | body text, explanations, table row labels |
| Sub | `--xt-sub` | Iosevka Charon | subtitles, tabs, buttons, form labels, footer |
| Mono | `--xt-mono` | Iosevka Charon Mono | numbers, code, readouts, canvas labels |
| Small | `--xt-small` | VT323 | only text **≤ 0.70rem (11.2 px)**: kickers, figure labels, chips |

- `xallace-ui.css` maps these to `--font-display`, `--font-ui`, `--font-sub`, `--font-mono`, `--font-small`.
- In CSS, name only the role variables, never a font name.
- GFS Didot has no bold. Do not set `font-weight` above 400 on titles; `font-synthesis-weight: none` stops fake bold.
- Canvas and SVG text never use VT323. Name `"Iosevka Charon Mono"` (or `"Iosevka Charon"`) directly with a monospace
  fallback. `xallace-type.js` fires one `resize` after the fonts load, so redraw on `resize`.
- Fallbacks: Georgia covers Cyrillic. Iosevka covers the GD&T glyphs ⌓ ⏥ ⌖ ⟂ ∥ Ⓜ.
- Banned: Inter, JetBrains Mono, Outfit, Roboto and other web fonts, and Google Fonts links.

## 5 · Layout and components

- **Header** (`.app-header`):
  - `← Portfolio` back chip (`.pill-btn.back-chip`) linking to `https://xallace.github.io/#<group>`;
  - `.brand-badge` with a small line icon;
  - `h1` with a `.sub-tag` (the standard or subject, e.g. `ISO 22081`) and a `.source-ref` line;
  - `.main-tabs` with numbered tabs `1 · Name`.
- **Workspace**:
  - `.workspace` with a maximum width of 1500 px;
  - `.split-layout`: **drawing left (`.stage-col`), controls right (`.control-col`)**;
  - the split stacks below 1060 px; below 640 px everything is one column and the tabs fill the width.
- **No horizontal scroll at 390 px** (phone), and none at 1440 px. Wide tables go in `.table-scroll`.
- **Components** (see the style guide):
  - `.verdict-strip` / `.verdict-cell.pass|fail|warn|info`;
  - `.plate-card` with `.plate-card-head`, `.plate-fig-label` (`FIG. n · TITLE`) and `.plate-canvas`;
  - `.panel-card`, `.control-section`, `.section-label`;
  - `.preset-btn`, `.slider-item`, `.field`;
  - `.spec-table`, `.chip.ok|fail|warn|info|not-verified`, `.issue-item`;
  - `.plate-heading`, `.plate-prose`, `.plate-list`, `.sources-footer-box`, `.site-footer`.
- **Guided tour, if any**: a banner below the header (see `iso22081-profile-lab`), with Prev / Next / ✕ as `.pill-btn`.

## 6 · Content

- UI language **English**. Units SI, lengths in mm. Use the real minus sign (−) in displayed numbers.
- Standards: name the number and clause or page. A claim you have not checked against the standard text gets
  `<span class="chip not-verified">not verified</span>`. Never write "according to ISO …" from memory.
- Do not embed protected texts (standards, textbook pages, Bible translations under copyright). Use your own wording and
  give references.
- Footer: `Model checks: node tests/verify.mjs` and, where a standard is involved, the sentence *"tests the app's own
  formulas, not conformity with the standard"*, plus a link to `xallace.github.io`.
- Never use the old wording "1967 Book Plate" (text, meta, comments).

## 7 · Drawings, exports, 3D

- **Canvas / on-screen SVG**:
  - take colours from the tokens (`getComputedStyle(document.documentElement).getPropertyValue('--draw-ink')`), not
    hex literals;
  - scale by `devicePixelRatio` and redraw on `resize`;
  - outlines in `--draw-ink`, centre and construction lines dash-dot in `--draw-dim`, dimensions in `--accent`,
    failures in `--st-fail`, the grid in `--draw-grid`;
  - text drawn over lines sits on a `--draw-paper` patch.
- **Exports** (SVG/DXF/PDF downloads): keep **light print colours**, black lines on white, ISO 128 line types.
  The dark theme is for the screen only.
- **three.js**:
  - vendored, e.g. `vendor/three/three.min.js`;
  - do not set `renderer.outputEncoding = THREE.sRGBEncoding` (it washes the dark scene out);
  - keep the lights dimmed;
  - background `--draw-paper`, edges as `LineSegments` in ink;
  - reference: `cycloid-simulation/scene3d.js`;
  - provide a fallback (still image plus download link) when WebGL is missing or a model fails to load, as `pla-100.html`
    does.

## 8 · Code

- Plain static files, no build step, classic `<script>` tags. Libraries are vendored or pinned to an exact version.
- Maths lives in a pure model file with no DOM access. It ends with
  `if (typeof module !== 'undefined') module.exports = api; else window.X = api;`,
  and `tests/verify.mjs` loads it with `createRequire`. All tests must pass before a push.
- Accessibility:
  - tabs use `role="tab"` and `aria-selected`;
  - focus is visible (`:focus-visible` uses the accent);
  - honour `prefers-reduced-motion`.

## 9 · Portfolio hub

- The hub (`/index.html`) keeps its own palette and layout. These rules govern the apps; the hub follows §4 (type) and §3 (dark only).
- A new app gets a card in the matching tab deck (Technical Design, Simulations, More Projects): `article.project-card` with
  `.serial-code` (e.g. `TD-07`), `.card-title` (optionally `data-tab-title` for a short tab label) and a CSS schematic
  `.<name>-vis` in `style.css`. Card blocks start with a comment indented by exactly 10 spaces.
- Commit pattern: `feat: add <Project> to landing page`. Stage single files only.

## 10 · Check before every push

```
node design/check.mjs <app folder> --browser      # run inside the xallace.github.io clone
node tests/verify.mjs                              # inside the app
```

- `check.mjs` reports three levels:
  - **error**: must be fixed before pushing;
  - **warn**: fix it, or say in the commit why not;
  - **note**: information.
- **Static checks:**
  - fonts linked;
  - banned fonts;
  - light-mode code;
  - VT323 in scripts or above 0.70rem;
  - colours outside the palette;
  - `outputEncoding`;
  - the old wording;
  - viewport, `lang`, back link, tests.
- **`--browser` checks** (headless Edge or Chrome, 390 and 1440 px):
  - horizontal overflow, naming the culprit elements;
  - console errors and failed requests;
  - light background;
  - rendered body and h1 fonts.
- A new app must pass with **0 errors and 0 warnings**.

## 11 · Working on it (Claude and agy)

- Before writing under `My Drive`, read `agy/KOORDINATION.md` and claim the folder there.
- New app:
  1. copy `design/template/` into a new repo;
  2. pick an accent;
  3. replace the model, the tests and the UI;
  4. run the checks;
  5. push;
  6. add the hub card.
- Git identity per commit (`git -c user.name=xallace -c user.email=…`), stage single files, no `git add -A` in the hub.
- Changing a legacy app: if Walter asks for it, fix its `DEVIATIONS.md` entries in the same commit and re-run the check.

## 12 · Changelog

| Version | Date | Change |
|---|---|---|
| 1.0 | 21.11.2026 | Freeze. Tokens and components extracted from `iso22081-profile-lab`; five accents; type system from 21.11. (`/fonts/`); style guide, template, `check.mjs`, deviation list. |
