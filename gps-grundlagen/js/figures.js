// Eigene Zeichnungen je Toleranzart: Zeichnungseintrag, Toleranzzone, Abweichung.
// Die Abweichung f wird aus dem gezeichneten Ist-Profil berechnet, nicht geschätzt.
import { line, rect, circle, path, poly, text, arrow, dim, ted, datum, wavePts, sdist, frame, fig, f1 } from './svg.js';

const frameAt = (x, y, spec) => frame(x, y, spec).svg;

// Mindestzone zweier Parallelen in Richtung u um einen Punktzug (Richtung fest vorgegeben)
function band(pts, p0, u) {
  const d = pts.map((p) => sdist(p, p0, u));
  return { lo: Math.min(...d), hi: Math.max(...d), f: Math.max(...d) - Math.min(...d) };
}
const offsetLine = (p0, u, off, len = 1) => {
  const L = Math.hypot(u[0], u[1]), n = [-u[1] / L, u[0] / L];
  return [p0[0] + n[0] * off, p0[1] + n[1] * off];
};

function zoneParallel({ p0, u, len, t, pts, dashCls = 'zone' }) {
  const L = Math.hypot(u[0], u[1]), e = [u[0] / L, u[1] / L];
  const a = offsetLine(p0, u, -t / 2), b = offsetLine(p0, u, t / 2);
  const fillPts = [a, [a[0] + e[0] * len, a[1] + e[1] * len], [b[0] + e[0] * len, b[1] + e[1] * len], b];
  return poly(fillPts, 'zonefill', true) +
    line(a[0], a[1], a[0] + e[0] * len, a[1] + e[1] * len, dashCls) +
    line(b[0], b[1], b[0] + e[0] * len, b[1] + e[1] * len, dashCls) +
    (pts ? poly(pts, 'real') : '');
}

// Abweichungsbild: Ist-Linie mit den beiden sie einschließenden Parallelen in Richtung u
function devParallel({ pts, p0, u, len, label = 'f', note }) {
  const { lo, hi, f } = band(pts, p0, u);
  const L = Math.hypot(u[0], u[1]), e = [u[0] / L, u[1] / L];
  const a = offsetLine(p0, u, lo), b = offsetLine(p0, u, hi);
  const mid = len * 0.86;
  const ma = [a[0] + e[0] * mid, a[1] + e[1] * mid], mb = [b[0] + e[0] * mid, b[1] + e[1] * mid];
  return line(a[0], a[1], a[0] + e[0] * len, a[1] + e[1] * len, 'devline') +
    line(b[0], b[1], b[0] + e[0] * len, b[1] + e[1] * len, 'devline') + poly(pts, 'real') +
    dim(ma[0], ma[1], mb[0], mb[1], label, 1, 'devtxt') + (note ? text(120, 143, note, 'small') : '');
}

const tLabel = (x, y, s) => text(x, y, s, 'zonetxt', 'start');

// Kreisprofil mit Rundheitsabweichung um (cx, cy)
function roundPts(cx, cy, r, amp, n = 90, e = [0, 0]) {
  const pts = [];
  for (let i = 0; i <= n; i++) {
    const a = (i / n) * 2 * Math.PI;
    const rr = r + amp * (0.6 * Math.sin(3 * a + 0.4) + 0.4 * Math.sin(5 * a + 1.1));
    pts.push([cx + e[0] + rr * Math.cos(a), cy + e[1] + rr * Math.sin(a)]);
  }
  return pts;
}
const radii = (pts, cx, cy) => pts.map(([x, y]) => Math.hypot(x - cx, y - cy));

// Kurve (quadratische Bézier) samt Abtastung und Normalen, für Profiltoleranzen
function bez(p0, p1, p2, n = 60) {
  const pts = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n, u = 1 - t;
    const x = u * u * p0[0] + 2 * u * t * p1[0] + t * t * p2[0], y = u * u * p0[1] + 2 * u * t * p1[1] + t * t * p2[1];
    const dx = 2 * u * (p1[0] - p0[0]) + 2 * t * (p2[0] - p1[0]), dy = 2 * u * (p1[1] - p0[1]) + 2 * t * (p2[1] - p1[1]);
    const L = Math.hypot(dx, dy);
    pts.push({ x, y, nx: -dy / L, ny: dx / L });
  }
  return pts;
}
const P0 = [40, 100], P1 = [120, 20], P2 = [200, 100];

function profileZone(sphere) {
  const c = bez(P0, P1, P2), r = 10;
  const outer = c.map((p) => [p.x + p.nx * r, p.y + p.ny * r]), inner = c.map((p) => [p.x - p.nx * r, p.y - p.ny * r]);
  const real = c.map((p, i) => { const w = r * 0.75 * Math.sin(i / 6.5) * Math.cos(i / 17); return [p.x + p.nx * w, p.y + p.ny * w]; });
  let circ = '';
  for (let i = 0; i <= 60; i += 10) circ += circle(c[i].x, c[i].y, r, 'zonecirc');
  return poly(outer.concat(inner.slice().reverse()), 'zonefill', true) + poly(outer, 'zone') + poly(inner, 'zone') +
    poly(c.map((p) => [p.x, p.y]), 'center') + circ + poly(real, 'real') +
    text(120, 128, sphere ? 'Kugeln Ø t, Mitten auf der Sollfläche' : 'Kreise Ø t, Mitten auf der Sollkontur', 'zonetxt') +
    text(120, 143, 'Sollkontur durch theoretisch genaue Maße', 'small');
}
function profileDev() {
  const c = bez(P0, P1, P2);
  const real = c.map((p, i) => { const w = 7.5 * Math.sin(i / 6.5) * Math.cos(i / 17); return { x: p.x + p.nx * w, y: p.y + p.ny * w, w }; });
  const ws = real.map((p) => p.w), f = 2 * Math.max(...ws.map(Math.abs));
  const k = real.reduce((m, p, i) => (Math.abs(p.w) > Math.abs(real[m].w) ? i : m), 0);
  return poly(c.map((p) => [p.x, p.y]), 'center') + poly(real.map((p) => [p.x, p.y]), 'real') +
    arrow(c[k].x, c[k].y, real[k].x, real[k].y, 'devline', 6) +
    text(real[k].x + 12, real[k].y - 6, 'f/2', 'devtxt', 'start') +
    text(120, 128, 'f = 2 · größter Abstand von der Sollkontur', 'devtxt') +
    text(120, 143, 'erfüllt, wenn f ≤ t', 'small');
}

// Welle seitlich (für Rundheit, Zylinderform)
function shaft(fr) {
  return rect(50, 70, 140, 44) + line(38, 92, 202, 92, 'center') + frameAt(100, 22, fr) + arrow(118, 40, 118, 70, 'thin');
}

// Messuhr über einer Welle
function gauge(x, y) {
  return rect(x - 13, y - 34, 26, 22, 'gauge') + line(x, y - 12, x, y, 'part') + circle(x, y - 23, 6.5, 'thin');
}

// Kreisringzone (zwei konzentrische Kreise)
const ring = (cx, cy, ro, ri) => circle(cx, cy, ro, 'zone') + circle(cx, cy, ri, 'zone') +
  `<path class="zonefill" fill-rule="evenodd" d="M${cx - ro} ${cy}a${ro} ${ro} 0 1 0 ${2 * ro} 0a${ro} ${ro} 0 1 0 ${-2 * ro} 0M${cx - ri} ${cy}a${ri} ${ri} 0 1 0 ${2 * ri} 0a${ri} ${ri} 0 1 0 ${-2 * ri} 0"/>`;

// Zwei koaxiale Zylinder in der Seitenansicht
const cylZone = () => rect(35, 30, 170, 80, 'zonefill') + line(35, 30, 205, 30, 'zone') + line(35, 110, 205, 110, 'zone') + line(35, 44, 205, 44, 'zone') + line(35, 96, 205, 96, 'zone') +
  path('M35 30a8 40 0 0 0 0 80M205 30a8 40 0 0 1 0 80', 'zone') + dim(222, 30, 222, 44, 't', 1, 'zonetxt') + line(207, 30, 226, 30, 'thin') + line(207, 44, 226, 44, 'thin');

const RAD30 = Math.PI / 6, U30 = [Math.cos(RAD30), Math.sin(RAD30)];

export const FIG = {
  gerad: {
    draw: () => fig(rect(40, 78, 150, 34) + frameAt(70, 24, { s: 'gerad', value: '0,1' }) + arrow(80, 42, 80, 78) + dim(204, 78, 204, 112, '34') + line(190, 78, 210, 78, 'thin') + line(190, 112, 210, 112, 'thin') +
      text(115, 134, 'toleriert: obere Kante in der Ansichtsebene', 'small'), 'Zeichnungseintrag Geradheit'),
    zone: () => fig(zoneParallel({ p0: [25, 75], u: [1, 0], len: 180, t: 40, pts: wavePts(25, 75, 205, 75, 13) }) +
      dim(218, 55, 218, 95, 't', 1, 'zonetxt') + line(205, 55, 222, 55, 'thin') + line(205, 95, 222, 95, 'thin') +
      text(120, 126, 'zwei parallele Geraden im Abstand t', 'zonetxt') + text(120, 142, 'beliebig ausgerichtet (kein Bezug)', 'small'), 'Toleranzzone Geradheit'),
    dev: () => fig(devParallel({ pts: wavePts(25, 75, 205, 75, 13), p0: [25, 75], u: [1, 0], len: 180, note: 'Abstand der Parallelen minimal (Tschebyschow)' }), 'Abweichung Geradheit'),
  },
  eben: {
    draw: () => fig(poly([[55, 78], [165, 78], [200, 52], [90, 52]], 'part', true) + rect(55, 78, 110, 34) + poly([[165, 78], [200, 52], [200, 86], [165, 112]], 'part', true) +
      frameAt(20, 14, { s: 'eben', value: '0,05' }) + poly([[40, 32], [40, 46], [110, 61]], 'thin') + arrow(110, 61, 125, 65, 'thin') + text(120, 134, 'toleriert: die gesamte Oberseite', 'small'), 'Zeichnungseintrag Ebenheit'),
    zone: () => fig(poly([[40, 62], [160, 62], [205, 34], [85, 34]], 'zone', true) + poly([[40, 100], [160, 100], [205, 72], [85, 72]], 'zone', true) +
      poly(wavePts(70, 80, 175, 54, 5), 'real') + dim(218, 34, 218, 72, 't', 1, 'zonetxt') + line(207, 34, 222, 34, 'thin') + line(207, 72, 222, 72, 'thin') +
      text(120, 126, 'zwei parallele Ebenen im Abstand t', 'zonetxt') + text(120, 142, 'Lage beliebig, nur die Form zählt', 'small'), 'Toleranzzone Ebenheit'),
    dev: () => fig(devParallel({ pts: wavePts(25, 78, 205, 78, 12, 48, 1.3), p0: [25, 78], u: [1, 0], len: 180, note: 'Schnitt: Abstand der einhüllenden Ebenen' }), 'Abweichung Ebenheit'),
  },
  rund: {
    draw: () => fig(shaft({ s: 'rund', value: '0,02' }) + text(120, 134, 'gilt in jedem Querschnitt senkrecht zur Achse', 'small'), 'Zeichnungseintrag Rundheit'),
    zone: () => fig(ring(120, 70, 52, 38) + poly(roundPts(120, 70, 45, 5.5), 'real') + dim(172, 70, 158, 70, 't', -1, 'zonetxt') + text(120, 141, 'zwei konzentrische Kreise, Radiendifferenz t', 'zonetxt'), 'Toleranzzone Rundheit'),
    dev: () => {
      const pts = roundPts(120, 70, 45, 5.5), r = radii(pts, 120, 70), rmax = Math.max(...r), rmin = Math.min(...r);
      return fig(circle(120, 70, rmax, 'devline') + circle(120, 70, rmin, 'devline') + poly(pts, 'real') + line(115, 70, 125, 70, 'thin') + line(120, 65, 120, 75, 'thin') +
        dim(120 - rmax, 70, 120 - rmin, 70, 'f', 1, 'devtxt') + text(120, 141, 'f = r_max − r_min um den Mindestzonen-Mittelpunkt', 'small'), 'Abweichung Rundheit');
    },
  },
  zyl: {
    draw: () => fig(shaft({ s: 'zyl', value: '0,03' }) + text(120, 134, 'gilt für die ganze Mantelfläche', 'small'), 'Zeichnungseintrag Zylinderform'),
    zone: () => fig(cylZone() + line(25, 70, 215, 70, 'center') + poly(wavePts(35, 37, 205, 37, 5), 'real') + poly(wavePts(35, 103, 205, 103, 5, 48, 2), 'real') +
      text(120, 134, 'zwei koaxiale Zylinder, Radiendifferenz t', 'zonetxt'), 'Toleranzzone Zylinderform'),
    dev: () => fig(devParallel({ pts: wavePts(25, 70, 205, 70, 11, 48, 2.2), p0: [25, 70], u: [1, 0], len: 180, note: 'räumlich: koaxiale Zylinder um alle Messpunkte' }), 'Abweichung Zylinderform'),
  },
  linie: {
    draw: () => fig(path('M40 120V100Q120 20 200 100V120Z') + frameAt(16, 14, { s: 'linie', value: '0,04' }) + poly([[36, 32], [36, 44], [70, 59]], 'thin') + arrow(70, 59, 80, 64, 'thin') +
      text(120, 140, 'ohne Bezug: wirkt als Formtoleranz der Kontur', 'small'), 'Zeichnungseintrag Linienprofil'),
    zone: () => fig(profileZone(false), 'Toleranzzone Linienprofil'),
    dev: () => fig(profileDev(), 'Abweichung Linienprofil'),
  },
  flaeche: {
    draw: () => fig(path('M40 120V100Q120 20 200 100V120Z') + path('M58 86Q138 6 218 86V106L200 120', 'thin') + line(200, 100, 218, 86, 'thin') + line(40, 100, 58, 86, 'thin') +
      frameAt(16, 14, { s: 'flaeche', value: '0,1' }) + poly([[36, 32], [36, 44], [70, 59]], 'thin') + arrow(70, 59, 80, 64, 'thin') + text(120, 140, 'gilt für die ganze gekrümmte Fläche', 'small'), 'Zeichnungseintrag Flächenprofil'),
    zone: () => fig(profileZone(true), 'Toleranzzone Flächenprofil'),
    dev: () => fig(profileDev(), 'Abweichung Flächenprofil'),
  },
  para: {
    draw: () => fig(rect(55, 58, 130, 44) + frameAt(90, 14, { s: 'para', value: '0,05', datums: ['A'] }) + arrow(140, 32, 140, 58) + datum(100, 102, 'A', 'down', 2) +
      text(120, 146, 'Oberseite parallel zur Unterseite A', 'small'), 'Zeichnungseintrag Parallelität'),
    zone: () => fig(rect(25, 112, 190, 6, 'datumplane') + text(205, 132, 'Bezug A', 'zonetxt', 'end') + zoneParallel({ p0: [25, 62], u: [1, 0], len: 180, t: 34, pts: wavePts(25, 60, 205, 66, 10) }) +
      dim(218, 45, 218, 79, 't', 1, 'zonetxt') + line(205, 45, 222, 45, 'thin') + line(205, 79, 222, 79, 'thin') + text(70, 132, 'Zone parallel zu A', 'zonetxt'), 'Toleranzzone Parallelität'),
    dev: () => fig(rect(25, 112, 190, 6, 'datumplane') + devParallel({ pts: wavePts(25, 56, 205, 70, 9), p0: [25, 63], u: [1, 0], len: 180, note: 'Einhüllende parallel zu A, nicht zum Ist-Verlauf' }), 'Abweichung Parallelität'),
  },
  recht: {
    draw: () => fig(path('M55 108H195V88H90V32H55Z') + frameAt(124, 20, { s: 'recht', value: '0,05', datums: ['A'] }) + poly([[124, 29], [110, 29], [110, 56]], 'thin') + arrow(110, 56, 90, 56, 'thin') +
      datum(150, 108, 'A', 'down', 2) + text(120, 146, 'Fläche des Stegs senkrecht zu A', 'small'), 'Zeichnungseintrag Rechtwinkligkeit'),
    zone: () => fig(rect(25, 118, 190, 6, 'datumplane') + text(205, 140, 'Bezug A', 'zonetxt', 'end') +
      zoneParallel({ p0: [120, 112], u: [0, -1], len: 90, t: 32, pts: wavePts(118, 112, 122, 22, 9) }) + dim(104, 14, 136, 14, '') + text(142, 17, 't', 'zonetxt', 'start') + text(60, 70, 'Zone ⊥ A', 'zonetxt'), 'Toleranzzone Rechtwinkligkeit'),
    dev: () => fig(rect(25, 118, 190, 6, 'datumplane') + devParallel({ pts: wavePts(116, 112, 128, 22, 8, 48, 0.7), p0: [120, 112], u: [0, -1], len: 90 }) +
      text(120, 143, 'Einhüllende senkrecht zu A', 'small'), 'Abweichung Rechtwinkligkeit'),
  },
  neig: {
    draw: () => fig(path('M45 108H195V62L152 37H45Z') + line(152, 37, 210, 37, 'thin') + path('M184 37A32 32 0 0 1 179.7 53', 'thin') + ted(206, 54, '30°') +
      frameAt(40, 8, { s: 'neig', value: '0,1', datums: ['A'] }) + poly([[104, 17], [189, 17], [189, 23]], 'thin') + arrow(189, 23, 174, 49, 'thin') + datum(100, 108, 'A', 'down', 2) +
      text(120, 146, 'Schräge im Winkel 30° (theoretisch genau) zu A', 'small'), 'Zeichnungseintrag Neigung'),
    zone: () => fig(rect(25, 118, 190, 6, 'datumplane') + text(60, 140, 'Bezug A', 'zonetxt', 'start') +
      zoneParallel({ p0: [30, 22], u: U30, len: 175, t: 28, pts: wavePts(30, 22, 30 + U30[0] * 175, 22 + U30[1] * 175, 8) }) +
      line(100, 118, 205, 118, 'thin') + path('M141 118A60 60 0 0 1 149 88', 'thin') + text(136, 110, '30°', 'zonetxt', 'end') + text(160, 30, 'Zone im Winkel zu A', 'zonetxt'), 'Toleranzzone Neigung'),
    dev: () => fig(rect(25, 118, 190, 6, 'datumplane') + devParallel({ pts: wavePts(30, 22, 30 + U30[0] * 175, 22 + U30[1] * 175, 9, 48, 1.1), p0: [30, 22], u: U30, len: 175 }) +
      text(120, 143, 'Einhüllende im Sollwinkel zu A', 'small'), 'Abweichung Neigung'),
  },
  pos: {
    draw: () => fig(rect(40, 40, 150, 80) + circle(120, 80, 13) + line(100, 80, 140, 80, 'center') + line(120, 60, 120, 100, 'center') +
      dim(40, 132, 120, 132, '') + line(120, 100, 120, 136, 'thin') + line(40, 120, 40, 136, 'thin') + ted(80, 145, '80') +
      dim(28, 120, 28, 80, '') + line(40, 120, 24, 120, 'thin') + line(24, 80, 100, 80, 'thin') + ted(16, 104, '40') +
      line(129, 71, 150, 50, 'thin') + line(150, 50, 196, 50, 'thin') + text(173, 47, 'Ø20', 'dimtxt') + line(190, 24, 190, 50, 'thin') +
      frameAt(96, 6, { s: 'pos', value: '0,1', dia: true, datums: ['A', 'B', 'C'] }) +
      datum(40, 60, 'B', 'left', 2) + datum(160, 120, 'C', 'down', 2), 'Zeichnungseintrag Position'),
    zone: () => fig(line(60, 70, 180, 70, 'center') + line(120, 15, 120, 125, 'center') + circle(120, 70, 36, 'zonefill') + circle(120, 70, 36, 'zone') +
      circle(134, 58, 3.4, 'realpt') + text(140, 53, 'Ist-Achse', 'zonetxt', 'start') + dim(84, 122, 156, 122, 'Ø t', -1, 'zonetxt') + line(84, 70, 84, 126, 'thin') + line(156, 70, 156, 126, 'thin') +
      text(120, 146, 'Zylinder Ø t um die Nennlage', 'small'), 'Toleranzzone Position'),
    dev: () => {
      const dx = 0.03, dy = 0.02, f = 2 * Math.hypot(dx, dy), c = (v) => String(v).replace('.', ',');
      return fig(line(60, 70, 180, 70, 'center') + line(120, 15, 120, 125, 'center') + circle(120, 70, 36, 'zone') + circle(162, 42, 3.4, 'realpt') +
        line(120, 70, 162, 42, 'devline') + text(145, 66, 'Δ', 'devtxt') + text(120, 128, `f = 2·√(${c(dx)}² + ${c(dy)}²) = ${c(f.toFixed(3))}`, 'devtxt') +
        text(120, 145, `Beispiel: ${c(f.toFixed(3))} ≤ 0,1 → in Ordnung`, 'small'), 'Abweichung Position');
    },
  },
  koax: {
    draw: () => fig(rect(30, 46, 90, 64) + rect(120, 62, 85, 32) + line(20, 78, 225, 78, 'center') + dim(52, 46, 52, 110, '') + text(57, 64, 'Ø40', 'dimtxt', 'start') + datum(52, 110, 'A', 'down', 4) +
      frameAt(110, 16, { s: 'koax', value: '0,03', dia: true, datums: ['A'] }) + line(214, 34, 214, 44, 'thin') + arrow(214, 34, 214, 62, 'thin') + line(205, 62, 218, 62, 'thin') + line(205, 94, 218, 94, 'thin') +
      dim(214, 62, 214, 94, '') + text(219, 72, 'Ø20', 'dimtxt', 'start') + line(174, 34, 214, 34, 'thin'), 'Zeichnungseintrag Koaxialität'),
    zone: () => fig(line(15, 78, 225, 78, 'center') + text(24, 72, 'Bezugsachse A', 'zonetxt', 'start') + rect(110, 64, 100, 28, 'zonefill') + line(110, 64, 210, 64, 'zone') + line(110, 92, 210, 92, 'zone') +
      path('M110 64a6 14 0 0 0 0 28M210 64a6 14 0 0 1 0 28', 'zone') + poly(wavePts(110, 80, 210, 74, 4), 'real') + dim(224, 64, 224, 92, '') + text(214, 112, 'Ø t', 'zonetxt', 'start') +
      text(120, 132, 'Zylinder Ø t koaxial zur Bezugsachse', 'zonetxt'), 'Toleranzzone Koaxialität'),
    dev: () => {
      const pts = wavePts(110, 80, 210, 74, 4), d = pts.map((p) => Math.abs(p[1] - 78)), m = Math.max(...d), k = d.indexOf(m);
      return fig(line(15, 78, 225, 78, 'center') + poly(pts, 'real') + arrow(pts[k][0], 78, pts[k][0], pts[k][1], 'devline', 5) +
        text(pts[k][0] + 8, 96, 'e_max', 'devtxt', 'start') + text(120, 128, 'f = 2 · e_max (größter Achsabstand)', 'devtxt') +
        text(120, 145, 'Ist-Achse aus den Mittelpunkten der Querschnitte', 'small'), 'Abweichung Koaxialität');
    },
  },
  sym: {
    draw: () => fig(path('M45 34H105V74H135V34H195V104H45Z') + line(120, 26, 120, 112, 'center') + dim(105, 26, 135, 26, '12') + line(105, 34, 105, 22, 'thin') + line(135, 34, 135, 22, 'thin') +
      frameAt(140, 4, { s: 'sym', value: '0,08', datums: ['A'] }) + poly([[140, 13], [128, 13], [128, 26]], 'thin') +
      dim(45, 118, 195, 118, '60') + line(45, 104, 45, 122, 'thin') + line(195, 104, 195, 122, 'thin') + datum(165, 118, 'A', 'down', 0), 'Zeichnungseintrag Symmetrie'),
    zone: () => fig(line(120, 10, 120, 135, 'center') + text(126, 130, 'Mittelebene A', 'zonetxt', 'start') + zoneParallel({ p0: [120, 120], u: [0, -1], len: 100, t: 30, pts: wavePts(124, 120, 116, 20, 6) }) +
      dim(105, 12, 135, 12, '') + text(141, 15, 't', 'zonetxt', 'start') + text(60, 70, 'symmetrisch zu A', 'zonetxt'), 'Toleranzzone Symmetrie'),
    dev: () => {
      const pts = wavePts(124, 120, 116, 20, 6), d = pts.map((p) => Math.abs(p[0] - 120)), m = Math.max(...d);
      return fig(line(120, 10, 120, 125, 'center') + poly(pts, 'real') + line(120 - m, 20, 120 - m, 120, 'devline') + line(120 + m, 20, 120 + m, 120, 'devline') +
        dim(120 - m, 132, 120 + m, 132, '') + text(120 + m + 6, 135, 'f', 'devtxt', 'start') + text(60, 60, 'Ist-Mittelebene', 'devtxt') +
        text(180, 60, 'f = 2 · größter', 'small') + text(180, 72, 'Abstand zu A', 'small'), 'Abweichung Symmetrie');
    },
  },
  lauf: {
    draw: () => fig(rect(25, 66, 40, 28) + rect(65, 46, 110, 68) + rect(175, 66, 40, 28) + line(15, 80, 225, 80, 'center') +
      frameAt(96, 8, { s: 'lauf', value: '0,1', datums: ['A-B'] }) + arrow(120, 26, 120, 46) + datum(45, 94, 'A', 'down', 4) + datum(195, 94, 'B', 'down', 4) +
      text(120, 145, 'radial in jedem Querschnitt, Bezugsachse A-B', 'small'), 'Zeichnungseintrag Rundlauf'),
    zone: () => fig(ring(120, 70, 52, 38) + poly(roundPts(120, 70, 45, 3.5, 90, [3, -2]), 'real') + line(114, 70, 126, 70, 'thin') + line(120, 64, 120, 76, 'thin') + text(128, 84, 'A-B', 'zonetxt', 'start') +
      dim(172, 70, 158, 70, 't', -1, 'zonetxt') + text(120, 141, 'konzentrische Kreise um die Bezugsachse', 'zonetxt'), 'Toleranzzone Rundlauf'),
    dev: () => fig(circle(120, 86, 44, 'part') + line(112, 86, 128, 86, 'thin') + line(120, 78, 120, 94, 'thin') + gauge(120, 42) + path('M160 66A44 44 0 0 1 164 96', 'thin') +
      poly([[164, 96], [160, 90], [168, 91]], 'head', true) + text(150, 24, 'Messuhr', 'devtxt', 'start') +
      text(120, 145, 'f = Anzeigespanne bei einer Umdrehung um A-B', 'small'), 'Abweichung Rundlauf'),
  },
  gesamt: {
    draw: () => fig(rect(25, 66, 40, 28) + rect(65, 46, 110, 68) + rect(175, 66, 40, 28) + line(15, 80, 225, 80, 'center') +
      frameAt(96, 8, { s: 'gesamt', value: '0,1', datums: ['A-B'] }) + arrow(120, 26, 120, 46) + datum(45, 94, 'A', 'down', 4) + datum(195, 94, 'B', 'down', 4) +
      text(120, 145, 'gilt für die ganze Mantelfläche auf einmal', 'small'), 'Zeichnungseintrag Gesamtrundlauf'),
    zone: () => fig(cylZone() + line(20, 70, 220, 70, 'center') + text(120, 66, 'Bezugsachse A-B', 'zonetxt') +
      poly(wavePts(35, 37, 205, 37, 4), 'real') + poly(wavePts(35, 103, 205, 103, 4, 48, 2.4), 'real') + text(120, 134, 'koaxiale Zylinder um die Bezugsachse', 'zonetxt'), 'Toleranzzone Gesamtrundlauf'),
    dev: () => fig(rect(40, 66, 160, 50) + line(25, 91, 215, 91, 'center') + gauge(80, 66) + arrow(98, 30, 170, 30, 'devline', 6) + text(134, 22, 'Messuhr wandert axial', 'devtxt') +
      text(120, 134, 'f = Anzeigespanne über die ganze Fläche', 'devtxt') + text(120, 147, 'Teil dreht um A-B, Messuhr fährt mit', 'small'), 'Abweichung Gesamtrundlauf'),
  },
};
