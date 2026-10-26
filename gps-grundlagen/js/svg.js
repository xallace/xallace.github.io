// SVG-Bausteine als Strings: Linien, Pfeile, Toleranzrahmen, Bezugsdreiecke, Symbole nach ISO 1101.
// Alles liefert Text, damit die Zeichnungen auch in Node (tests/verify.mjs) geprüft werden können.

export const f1 = (v) => (Math.round(v * 10) / 10).toString();

export const line = (x1, y1, x2, y2, cls = 'part') =>
  `<line class="${cls}" x1="${f1(x1)}" y1="${f1(y1)}" x2="${f1(x2)}" y2="${f1(y2)}"/>`;

export const rect = (x, y, w, h, cls = 'part') =>
  `<rect class="${cls}" x="${f1(x)}" y="${f1(y)}" width="${f1(w)}" height="${f1(h)}"/>`;

export const circle = (cx, cy, r, cls = 'part') =>
  `<circle class="${cls}" cx="${f1(cx)}" cy="${f1(cy)}" r="${f1(r)}"/>`;

export const path = (d, cls = 'part') => `<path class="${cls}" d="${d}"/>`;

export const poly = (pts, cls = 'part', closed = false) =>
  `<${closed ? 'polygon' : 'polyline'} class="${cls}" points="${pts.map(([x, y]) => `${f1(x)},${f1(y)}`).join(' ')}"/>`;

export const text = (x, y, s, cls = 'lbl', anchor = 'middle') =>
  `<text class="${cls}" x="${f1(x)}" y="${f1(y)}" text-anchor="${anchor}">${s}</text>`;

// Gefüllte Pfeilspitze an (x2, y2), Linie von (x1, y1)
export function arrow(x1, y1, x2, y2, cls = 'thin', size = 7) {
  const a = Math.atan2(y2 - y1, x2 - x1), w = size * 0.32;
  const bx = x2 - size * Math.cos(a), by = y2 - size * Math.sin(a);
  const head = [[x2, y2], [bx + w * Math.sin(a), by - w * Math.cos(a)], [bx - w * Math.sin(a), by + w * Math.cos(a)]];
  return line(x1, y1, bx, by, cls) + poly(head, 'head', true);
}

// Bemaßung zwischen zwei Punkten mit Pfeilen an beiden Enden.
// Beschriftung neben der Maßlinie: side = 1 oberhalb (waagerecht) bzw. rechts (senkrecht), side = -1 gegenüber
export function dim(x1, y1, x2, y2, label, side = 1, cls = 'dimtxt') {
  const mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
  const vert = Math.abs(x2 - x1) < Math.abs(y2 - y1);
  const s = side < 0 ? -1 : 1;
  const tx = vert ? mx + s * 5 : mx, ty = vert ? my + 3.5 : my - s * 4 + (s < 0 ? 8 : 0);
  return arrow(mx, my, x1, y1, 'thin', 6) + arrow(mx, my, x2, y2, 'thin', 6) + (label ? text(tx, ty, label, cls, vert ? (s > 0 ? 'start' : 'end') : 'middle') : '');
}

// Theoretisch genaues Maß (TED): Wert im Rahmen
export function ted(x, y, s) {
  const w = s.length * 6.4 + 8;
  return rect(x - w / 2, y - 10, w, 14, 'tedbox') + text(x, y, s, 'dimtxt');
}

// Bezugsdreieck auf einer Fläche bei (x, y); dir: Richtung vom Werkstück weg
export function datum(x, y, letter, dir = 'down', len = 14) {
  const v = { down: [0, 1], up: [0, -1], left: [-1, 0], right: [1, 0] }[dir];
  const n = [-v[1], v[0]], s = 5.5, h = 8;
  const tri = [[x + n[0] * s, y + n[1] * s], [x - n[0] * s, y - n[1] * s], [x + v[0] * h, y + v[1] * h]];
  const ex = x + v[0] * (h + len), ey = y + v[1] * (h + len), b = 15;
  const bx = ex + (v[0] === 0 ? -b / 2 : v[0] > 0 ? 0 : -b), by = ey + (v[1] === 0 ? -b / 2 : v[1] > 0 ? 0 : -b);
  return poly(tri, 'datumtri', true) + line(x + v[0] * h, y + v[1] * h, ex, ey, 'thin') +
    rect(bx, by, b, b, 'framebox') + text(bx + b / 2, by + b / 2 + 4.2, letter, 'frametxt');
}

// Welliger Linienzug (Ist-Element), deterministisch über die Phase
export function wavePts(x1, y1, x2, y2, amp, n = 48, phase = 0) {
  const pts = [], dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy), nx = -dy / L, ny = dx / L;
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const w = amp * (0.55 * Math.sin(2 * Math.PI * (1.3 * t) + phase) + 0.3 * Math.sin(2 * Math.PI * (3.1 * t) + 1.7 * phase) + 0.15 * Math.sin(2 * Math.PI * 6.7 * t));
    pts.push([x1 + dx * t + nx * w, y1 + dy * t + ny * w]);
  }
  return pts;
}

// Abstand eines Punktes von der Geraden durch p0 mit Richtung u (vorzeichenbehaftet)
export const sdist = (p, p0, u) => ((p[0] - p0[0]) * -u[1] + (p[1] - p0[1]) * u[0]) / Math.hypot(u[0], u[1]);

// Symbole der 14 Toleranzarten, gezeichnet im 16×16-Feld
const S = {
  gerad: '<path d="M2 8H14"/>',
  eben: '<path d="M2.5 11.5L5.5 4.5H13.5L10.5 11.5Z"/>',
  rund: '<circle cx="8" cy="8" r="5.2"/>',
  zyl: '<circle cx="8" cy="8" r="4"/><path d="M1.8 11.7L6.9 0.9M9.1 15.1L14.2 4.3"/>',
  linie: '<path d="M2 11.5A6 6 0 0 1 14 11.5"/>',
  flaeche: '<path d="M2 11.5A6 6 0 0 1 14 11.5Z"/>',
  para: '<path d="M3 13.5L8 2.5M8 13.5L13 2.5"/>',
  recht: '<path d="M8 2.5V13.5M2 13.5H14"/>',
  neig: '<path d="M2 13.5H14M2 13.5L12.5 3.5"/>',
  pos: '<circle cx="8" cy="8" r="4.3"/><path d="M8 1V15M1 8H15"/>',
  koax: '<circle cx="8" cy="8" r="2.6"/><circle cx="8" cy="8" r="5.8"/>',
  sym: '<path d="M3.5 4.5H12.5M1.5 8H14.5M3.5 11.5H12.5"/>',
  lauf: '<path d="M4 13.5L11 3.5"/><path class="fillsym" d="M12.2 1.8L12 6.2L8.7 3.9Z"/>',
  gesamt: '<path d="M2.5 13.5L8 5.5M7.5 13.5L13 5.5M2.5 13.5H7.5"/><path class="fillsym" d="M9.1 3.9L8.9 7.6L6.2 5.7Z"/><path class="fillsym" d="M14.1 3.9L13.9 7.6L11.2 5.7Z"/>',
};

export const symbolIds = Object.keys(S);

export function sym(id, x, y, size = 16) {
  if (!S[id]) throw new Error(`Unbekanntes Symbol ${id}`);
  return `<g class="sym" transform="translate(${f1(x)} ${f1(y)}) scale(${(size / 16).toFixed(4)})">${S[id]}</g>`;
}

export const symbolSvg = (id, px = 40) =>
  `<svg class="symsvg" viewBox="-2 -2 20 20" width="${px}" height="${px}" aria-hidden="true">${sym(id, 0, 0)}</svg>`;

// Toleranzrahmen: Symbol | Wert | Bezüge. Liefert {svg, w, h}
export function frame(x, y, { s, value, dia = false, mods = [], datums = [] }, h = 18) {
  const val = (dia ? 'Ø' : '') + value + mods.map((m) => ` ${m}`).join('');
  const vw = Math.max(26, val.length * 6.6 + 10);
  let out = rect(x, y, h, h, 'framebox') + sym(s, x + 2, y + 2, h - 4);
  let cx = x + h;
  out += rect(cx, y, vw, h, 'framebox') + text(cx + vw / 2, y + h / 2 + 4.2, val, 'frametxt');
  cx += vw;
  for (const d of datums) {
    const dw = Math.max(h, d.length * 7 + 8);
    out += rect(cx, y, dw, h, 'framebox') + text(cx + dw / 2, y + h / 2 + 4.2, d, 'frametxt');
    cx += dw;
  }
  return { svg: out, w: cx - x, h };
}

export const fig = (body, label) =>
  `<svg class="fig" viewBox="0 0 240 150" role="img" aria-label="${label}">${body}</svg>`;
