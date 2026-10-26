// Erzeugt von build.mjs – nicht von Hand bearbeiten
(() => {
'use strict';
// ---- svg.js ----
// SVG-Bausteine als Strings: Linien, Pfeile, Toleranzrahmen, Bezugsdreiecke, Symbole nach ISO 1101.
// Alles liefert Text, damit die Zeichnungen auch in Node (tests/verify.mjs) geprüft werden können.

const f1 = (v) => (Math.round(v * 10) / 10).toString();

const line = (x1, y1, x2, y2, cls = 'part') =>
  `<line class="${cls}" x1="${f1(x1)}" y1="${f1(y1)}" x2="${f1(x2)}" y2="${f1(y2)}"/>`;

const rect = (x, y, w, h, cls = 'part') =>
  `<rect class="${cls}" x="${f1(x)}" y="${f1(y)}" width="${f1(w)}" height="${f1(h)}"/>`;

const circle = (cx, cy, r, cls = 'part') =>
  `<circle class="${cls}" cx="${f1(cx)}" cy="${f1(cy)}" r="${f1(r)}"/>`;

const path = (d, cls = 'part') => `<path class="${cls}" d="${d}"/>`;

const poly = (pts, cls = 'part', closed = false) =>
  `<${closed ? 'polygon' : 'polyline'} class="${cls}" points="${pts.map(([x, y]) => `${f1(x)},${f1(y)}`).join(' ')}"/>`;

const text = (x, y, s, cls = 'lbl', anchor = 'middle') =>
  `<text class="${cls}" x="${f1(x)}" y="${f1(y)}" text-anchor="${anchor}">${s}</text>`;

// Gefüllte Pfeilspitze an (x2, y2), Linie von (x1, y1)
function arrow(x1, y1, x2, y2, cls = 'thin', size = 7) {
  const a = Math.atan2(y2 - y1, x2 - x1), w = size * 0.32;
  const bx = x2 - size * Math.cos(a), by = y2 - size * Math.sin(a);
  const head = [[x2, y2], [bx + w * Math.sin(a), by - w * Math.cos(a)], [bx - w * Math.sin(a), by + w * Math.cos(a)]];
  return line(x1, y1, bx, by, cls) + poly(head, 'head', true);
}

// Bemaßung zwischen zwei Punkten mit Pfeilen an beiden Enden.
// Beschriftung neben der Maßlinie: side = 1 oberhalb (waagerecht) bzw. rechts (senkrecht), side = -1 gegenüber
function dim(x1, y1, x2, y2, label, side = 1, cls = 'dimtxt') {
  const mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
  const vert = Math.abs(x2 - x1) < Math.abs(y2 - y1);
  const s = side < 0 ? -1 : 1;
  const tx = vert ? mx + s * 5 : mx, ty = vert ? my + 3.5 : my - s * 4 + (s < 0 ? 8 : 0);
  return arrow(mx, my, x1, y1, 'thin', 6) + arrow(mx, my, x2, y2, 'thin', 6) + (label ? text(tx, ty, label, cls, vert ? (s > 0 ? 'start' : 'end') : 'middle') : '');
}

// Theoretisch genaues Maß (TED): Wert im Rahmen
function ted(x, y, s) {
  const w = s.length * 6.4 + 8;
  return rect(x - w / 2, y - 10, w, 14, 'tedbox') + text(x, y, s, 'dimtxt');
}

// Bezugsdreieck auf einer Fläche bei (x, y); dir: Richtung vom Werkstück weg
function datum(x, y, letter, dir = 'down', len = 14) {
  const v = { down: [0, 1], up: [0, -1], left: [-1, 0], right: [1, 0] }[dir];
  const n = [-v[1], v[0]], s = 5.5, h = 8;
  const tri = [[x + n[0] * s, y + n[1] * s], [x - n[0] * s, y - n[1] * s], [x + v[0] * h, y + v[1] * h]];
  const ex = x + v[0] * (h + len), ey = y + v[1] * (h + len), b = 15;
  const bx = ex + (v[0] === 0 ? -b / 2 : v[0] > 0 ? 0 : -b), by = ey + (v[1] === 0 ? -b / 2 : v[1] > 0 ? 0 : -b);
  return poly(tri, 'datumtri', true) + line(x + v[0] * h, y + v[1] * h, ex, ey, 'thin') +
    rect(bx, by, b, b, 'framebox') + text(bx + b / 2, by + b / 2 + 4.2, letter, 'frametxt');
}

// Welliger Linienzug (Ist-Element), deterministisch über die Phase
function wavePts(x1, y1, x2, y2, amp, n = 48, phase = 0) {
  const pts = [], dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy), nx = -dy / L, ny = dx / L;
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const w = amp * (0.55 * Math.sin(2 * Math.PI * (1.3 * t) + phase) + 0.3 * Math.sin(2 * Math.PI * (3.1 * t) + 1.7 * phase) + 0.15 * Math.sin(2 * Math.PI * 6.7 * t));
    pts.push([x1 + dx * t + nx * w, y1 + dy * t + ny * w]);
  }
  return pts;
}

// Abstand eines Punktes von der Geraden durch p0 mit Richtung u (vorzeichenbehaftet)
const sdist = (p, p0, u) => ((p[0] - p0[0]) * -u[1] + (p[1] - p0[1]) * u[0]) / Math.hypot(u[0], u[1]);

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

const symbolIds = Object.keys(S);

function sym(id, x, y, size = 16) {
  if (!S[id]) throw new Error(`Unbekanntes Symbol ${id}`);
  return `<g class="sym" transform="translate(${f1(x)} ${f1(y)}) scale(${(size / 16).toFixed(4)})">${S[id]}</g>`;
}

const symbolSvg = (id, px = 40) =>
  `<svg class="symsvg" viewBox="-2 -2 20 20" width="${px}" height="${px}" aria-hidden="true">${sym(id, 0, 0)}</svg>`;

// Toleranzrahmen: Symbol | Wert | Bezüge. Liefert {svg, w, h}
function frame(x, y, { s, value, dia = false, mods = [], datums = [] }, h = 18) {
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

const fig = (body, label) =>
  `<svg class="fig" viewBox="0 0 240 150" role="img" aria-label="${label}">${body}</svg>`;

// ---- data.js ----
// Inhalte: 14 Toleranzarten nach DIN EN ISO 1101, Grundsätze nach DIN EN ISO 8015:2011, Regeln für den Toleranzrahmen.
// Eigene Formulierungen. Quellen: ISO 8015:2011 Abschnitt 5, ISO 5459:2011 Abschnitt 7.2.2,
// B. Klein, Toleranzdesign (5. Aufl. 2021) Tab. 7.1, G. Henzold, GD&T (3rd ed 2021), ZEISS GPS-Poster (VIII/2023).

const GROUPS = [
  { id: 'form', name: 'Formtoleranzen', rule: 'Eine Formtoleranz hat keinen Bezug. Sie begrenzt nur die Gestalt eines einzelnen Elements, die Zone darf beliebig liegen.' },
  { id: 'richtung', name: 'Richtungstoleranzen', rule: 'Richtungstoleranzen brauchen einen Bezug. Die Zone ist im Winkel zum Bezug ausgerichtet, ihr Abstand dazu ist frei. Sie begrenzen die Form des Elements gleich mit.' },
  { id: 'ort', name: 'Ortstoleranzen', rule: 'Ortstoleranzen legen die Zone an einen festen Ort, beschrieben durch theoretisch genaue Maße zum Bezug. Sie begrenzen Richtung und Form gleich mit.' },
  { id: 'lauf', name: 'Lauftoleranzen', rule: 'Lauftoleranzen gelten immer zu einer Bezugsachse. Gemessen wird beim Drehen um diese Achse, das Ergebnis enthält Form- und Lageanteile zusammen.' },
];

// datum: 'nein' | 'ja' | 'optional' (Profil, Position)
// dia: Ø vor dem Toleranzwert zulässig (zylinderförmige oder kreisförmige Zone)
// mmr: Maximum-Material-Bedingung Ⓜ nach ISO 2692 anwendbar (nur abgeleitete Elemente von Maßelementen)
const TYPES = [
  { id: 'gerad', name: 'Geradheit', en: 'straightness', group: 'form', datum: 'nein', dia: true, mmr: true,
    element: 'Linie auf einer Fläche, Kante oder Achse',
    zone: 'zwei parallele Geraden im Abstand t; bei Achsen mit Ø ein Zylinder Ø t',
    includes: '—',
    check: 'Messlineal oder Haarlineal und Lichtspalt, Messuhr entlang einer Führung, KMG',
    note: 'Steht der Pfeil auf der Maßlinie eines Durchmessers, ist die Achse toleriert, dann mit Ø im Rahmen.' },
  { id: 'eben', name: 'Ebenheit', en: 'flatness', group: 'form', datum: 'nein', dia: false, mmr: false,
    element: 'ebene Fläche (oder Mittelebene)',
    zone: 'zwei parallele Ebenen im Abstand t',
    includes: 'Geradheit aller Linien in der Fläche',
    check: 'Tuschierplatte, Messuhr über Messplatte, KMG',
    note: 'Die Zone darf beliebig gekippt liegen. Die Lage zu anderen Flächen regelt erst eine Richtungstoleranz.' },
  { id: 'rund', name: 'Rundheit', en: 'roundness', group: 'form', datum: 'nein', dia: false, mmr: false,
    element: 'jeder Querschnitt eines Zylinders, Kegels oder einer Kugel',
    zone: 'in jedem Querschnitt zwei konzentrische Kreise mit Radiendifferenz t',
    includes: '—',
    check: 'Formmessgerät (Rundheitsmessung), nicht einfach mit der Bügelmessschraube: Gleichdicke fallen dort nicht auf',
    note: 'Ein Zweipunktmaß erkennt ungeradzahlige Unrundheit wie die Gleichdickform nicht, deshalb ist Rundheit eine eigene Anforderung.' },
  { id: 'zyl', name: 'Zylinderform', en: 'cylindricity', group: 'form', datum: 'nein', dia: false, mmr: false,
    element: 'ganze Mantelfläche eines Zylinders',
    zone: 'zwei koaxiale Zylinder mit Radiendifferenz t',
    includes: 'Rundheit, Geradheit der Mantellinien, Parallelität gegenüberliegender Mantellinien',
    check: 'Formmessgerät mit Längsachse, KMG',
    note: 'Strenger und teurer zu prüfen als Rundheit. Nur fordern, wenn die Funktion die ganze Fläche braucht, z. B. Gleitlagersitz.' },
  { id: 'linie', name: 'Linienprofil', en: 'line profile', group: 'form', groups: ['form', 'richtung', 'ort'], datum: 'optional', dia: false, mmr: false,
    element: 'beliebige Linie (Kontur in einem Schnitt)',
    zone: 'zwei Hüllkurven von Kreisen Ø t, deren Mittelpunkte auf der Sollkontur liegen',
    includes: 'mit Bezug: auch Richtung oder Ort der Kontur',
    check: 'Profilschablone, Konturmessgerät, KMG',
    note: 'Die Sollkontur muss durch theoretisch genaue Maße (im Rahmen) festgelegt sein. Ohne Bezug Formtoleranz, mit Bezug Richtungs- oder Ortstoleranz.' },
  { id: 'flaeche', name: 'Flächenprofil', en: 'surface profile', group: 'form', groups: ['form', 'richtung', 'ort'], datum: 'optional', dia: false, mmr: false,
    element: 'beliebige Fläche (Freiform)',
    zone: 'zwei Hüllflächen von Kugeln Ø t, deren Mittelpunkte auf der Sollfläche liegen',
    includes: 'mit Bezug: auch Richtung oder Ort der Fläche',
    check: 'KMG oder optischer Scanner gegen das CAD-Modell',
    note: 'Die gebräuchlichste Toleranz für Freiformflächen und Gussteile, oft als Flächenprofil zu einem Bezugssystem A|B|C.' },
  { id: 'para', name: 'Parallelität', en: 'parallelism', group: 'richtung', datum: 'ja', dia: true, mmr: true,
    element: 'Fläche, Linie oder Achse',
    zone: 'zwei zum Bezug parallele Ebenen (oder Geraden) im Abstand t; bei Achsen mit Ø ein Zylinder Ø t',
    includes: 'Ebenheit bzw. Geradheit des tolerierten Elements',
    check: 'Messuhr über Messplatte, Teil auf Bezugsfläche A aufgelegt',
    note: 'Die Zone ist zum Bezug ausgerichtet, nicht zur Ausgleichsfläche des Ist-Elements.' },
  { id: 'recht', name: 'Rechtwinkligkeit', en: 'perpendicularity', group: 'richtung', datum: 'ja', dia: true, mmr: true,
    element: 'Fläche, Linie oder Achse',
    zone: 'zwei zum Bezug senkrechte Ebenen im Abstand t; bei Achsen mit Ø ein Zylinder Ø t',
    includes: 'Ebenheit bzw. Geradheit des tolerierten Elements',
    check: 'Winkel und Lichtspalt, Messuhr am Messständer, KMG',
    note: 'Bei einer Bohrung zur Planfläche A wird meist die Achse toleriert: ⊥ Ø t | A.' },
  { id: 'neig', name: 'Neigung', en: 'angularity', group: 'richtung', datum: 'ja', dia: true, mmr: true,
    element: 'Fläche, Linie oder Achse',
    zone: 'zwei parallele Ebenen im Abstand t, im theoretisch genauen Winkel zum Bezug',
    includes: 'Ebenheit bzw. Geradheit des tolerierten Elements',
    check: 'Sinuslineal oder Winkelvorrichtung mit Messuhr, KMG',
    note: 'Der Sollwinkel steht als theoretisch genaues Maß im Rahmen (z. B. 30°) und hat selbst keine Toleranz.' },
  { id: 'pos', name: 'Position', en: 'position', group: 'ort', datum: 'optional', dia: true, mmr: true,
    element: 'Punkt, Achse, Mittelebene oder Fläche',
    zone: 'meist Zylinder Ø t um die Nennlage, die durch theoretisch genaue Maße zum Bezugssystem festgelegt ist',
    includes: 'Richtung und Form des tolerierten Elements',
    check: 'KMG, bei Ⓜ auch Lehre',
    note: 'Position ersetzt die Koordinatenmaßtoleranzen ±. Der Kreis um das Toleranzquadrat einer ±-Bemaßung hat 57 % mehr Fläche (π/2), ohne dass die Funktion leidet. Ohne Bezug nur für die Lage innerhalb eines Lochbilds.' },
  { id: 'koax', name: 'Koaxialität / Konzentrizität', en: 'coaxiality / concentricity', group: 'ort', datum: 'ja', dia: true, mmr: true,
    element: 'Achse (Koaxialität) oder Mittelpunkt (Konzentrizität, mit ACS)',
    zone: 'Zylinder Ø t koaxial zur Bezugsachse; bei Konzentrizität Kreis Ø t',
    includes: 'Richtung und Geradheit der Achse',
    check: 'KMG oder Formmessgerät; die Achse muss erst aus Querschnitten ermittelt werden',
    note: 'In der Werkstatt oft durch Rundlauf ersetzt, weil Rundlauf direkt mit der Messuhr prüfbar ist.' },
  { id: 'sym', name: 'Symmetrie', en: 'symmetry', group: 'ort', datum: 'ja', dia: false, mmr: true,
    element: 'Mittelebene (oder Mittellinie)',
    zone: 'zwei parallele Ebenen im Abstand t, symmetrisch zur Bezugsmittelebene',
    includes: 'Parallelität der Mittelebene zum Bezug',
    check: 'Messuhr mit Umschlagmessung (Teil wenden), KMG',
    note: 'Typisch für Nuten und Passfedernuten zur Wellenmitte.' },
  { id: 'lauf', name: 'Rundlauf / Planlauf', en: 'circular run-out', group: 'lauf', datum: 'ja', dia: false, mmr: false,
    element: 'Kreislinie in jedem Querschnitt (radial) oder auf jedem Messzylinder (axial)',
    zone: 'radial: zwei konzentrische Kreise um die Bezugsachse im Abstand t; axial: zwei Kreise auf einem Messzylinder',
    includes: 'radial: Rundheit und Koaxialität im jeweiligen Querschnitt',
    check: 'Teil zwischen Spitzen oder in Prismen drehen, Messuhr anlegen',
    note: 'Der Pfeil steht senkrecht auf der Fläche: radial auf dem Mantel, axial auf der Planfläche.' },
  { id: 'gesamt', name: 'Gesamtrundlauf / Gesamtplanlauf', en: 'total run-out', group: 'lauf', datum: 'ja', dia: false, mmr: false,
    element: 'ganze Mantelfläche oder ganze Planfläche',
    zone: 'radial: zwei koaxiale Zylinder um die Bezugsachse im Abstand t; axial: zwei zur Achse senkrechte Ebenen',
    includes: 'radial: Rundlauf, Zylinderform, Koaxialität; axial: Planlauf, Ebenheit, Rechtwinkligkeit zur Achse',
    check: 'drehen und gleichzeitig die Messuhr entlang (bzw. quer) führen, Spanne über alles',
    note: 'Gesamtplanlauf ergibt dieselbe Zone wie Rechtwinkligkeit einer Fläche zur Achse.' },
];

const typeById = Object.fromEntries(TYPES.map((t) => [t.id, t]));
const inGroup = (g) => TYPES.filter((t) => (t.groups || [t.group]).includes(g));

const DATUM_TEXT = { nein: 'kein Bezug', ja: 'Bezug erforderlich', optional: 'mit oder ohne Bezug' };

// Grundsätze nach DIN EN ISO 8015:2011, Abschnitt 5 (eigene Kurzfassung)
const PRINCIPLES = [
  { n: '5.1', name: 'Grundsatz des Aufrufens', text: 'Steht auf der Zeichnung auch nur eine GPS-Angabe, gilt das ganze ISO-GPS-System, samt 20 °C Referenztemperatur und den Entscheidungsregeln nach ISO 14253-1. Der Vermerk „Tolerierung ISO 8015“ im Schriftfeld ist dafür nicht nötig.', exam: 'Eine Zeichnung mit einem einzigen Form- und Lagesymbol ist bereits eine GPS-Zeichnung.' },
  { n: '5.2', name: 'Grundsatz der GPS-Normenhierarchie', text: 'Grundnormen, globale, allgemeine und ergänzende GPS-Normen bauen aufeinander auf. Regeln weiter oben gelten, solange eine Norm weiter unten nicht ausdrücklich etwas anderes festlegt.', exam: 'ISO 8015 ist Grundnorm, ISO 1101 allgemeine Norm, ISO 2768 ergänzende Norm.' },
  { n: '5.3', name: 'Grundsatz der bestimmenden Zeichnung', text: 'Es gilt nur, was in der Zeichnung (im weiten Sinn: der ganzen Produktdokumentation) steht. Was dort fehlt, kann nicht eingefordert werden.', exam: 'Fehlt eine Toleranz, darf der Fertiger nicht auf „üblich“ verwiesen werden.' },
  { n: '5.4', name: 'Grundsatz des Geometrieelements', text: 'Jede Angabe gilt für ein ganzes Geometrieelement zwischen seinen natürlichen Kanten und nur für dieses eine. Teilbereiche oder mehrere Elemente brauchen eine eigene Kennzeichnung, z. B. ACS oder CZ.', exam: 'Zwei gleiche Bohrungen ohne CZ haben zwei getrennte Toleranzzonen.' },
  { n: '5.5', name: 'Grundsatz der Unabhängigkeit', text: 'Jede Anforderung wird für sich erfüllt. Eine Maßtoleranz begrenzt die Form nicht, außer durch eine besondere Angabe wie Ⓔ (Hüllbedingung), Ⓜ oder CZ.', exam: 'Die wichtigste Abweichung von der alten DIN 7167, die die Hüllbedingung überall voraussetzte.' },
  { n: '5.6', name: 'Grundsatz der Dezimaldarstellung', text: 'Nicht angegebene Nachkommastellen sind Nullen: 10 heißt 10,000…', exam: 'Eine Angabe ohne Toleranz ist deshalb nicht „ungefähr“, sondern unendlich genau gemeint.' },
  { n: '5.7', name: 'Grundsatz der Standardfestlegung', text: 'Jede Angabe ohne Modifikator benutzt den in der zuständigen Norm festgelegten Standardoperator. Beispiel: 30 H6 meint das örtliche Zweipunktmaß nach ISO 14405-1.', exam: 'Modifikatoren wie GG, GX oder ACS ändern den Standard und sind in der Zeichnung sichtbar.' },
  { n: '5.8', name: 'Grundsatz der Referenzbedingungen', text: 'Alle Angaben gelten bei 20 °C (ISO 1) und am sauberen Werkstück. Andere Bedingungen, etwa Feuchte, müssen auf der Zeichnung stehen.', exam: 'Bei Kunststoffteilen oft wichtig: Feuchte und Temperatur angeben.' },
  { n: '5.9', name: 'Grundsatz des starren Werkstücks', text: 'Das Werkstück gilt als unendlich steif und wird im freien Zustand ohne äußere Kräfte betrachtet, auch ohne Schwerkraft. Andere Zustände regelt z. B. ISO 10579 (Ⓕ).', exam: 'Dünnwandige Teile brauchen eine Angabe zum Einspannzustand.' },
  { n: '5.10', name: 'Grundsatz der Dualität', text: 'Die Spezifikation beschreibt, was gelten soll, unabhängig vom Messverfahren. Die Prüfung setzt das mit einem Verifikationsoperator möglichst nah um.', exam: 'Die Zeichnung schreibt kein Messgerät vor.' },
  { n: '5.11', name: 'Grundsatz der Funktionsbeherrschung', text: 'Die Spezifikation soll die Funktion des Teils abbilden. Je weniger das gelingt, desto mehrdeutiger ist die Beschreibung der Funktion.', exam: 'Tolerieren nach Funktion, nicht nach Gewohnheit.' },
  { n: '5.12', name: 'Grundsatz der allgemeinen Spezifikation', text: 'Allgemeintoleranzen im Schriftfeld gelten nur dort, wo keine Einzelangabe der gleichen Art steht. Widersprechen sich zwei, gilt die großzügigere.', exam: 'Beispiel: ISO 2768-mK im Schriftfeld, eine Einzeltoleranz am Element geht vor.' },
  { n: '5.13', name: 'Grundsatz der Verantwortlichkeit', text: 'Für die Mehrdeutigkeit der Spezifikation ist der Konstrukteur verantwortlich. Die Messunsicherheit trägt, wer die Übereinstimmung nachweist (ISO 14253-1).', exam: 'Wer prüft, muss seine Messunsicherheit kennen und berücksichtigen.' },
];

// Datumsbuchstaben: I, O, Q und X sollen nach ISO 5459:2011, 7.2.2 nicht verwendet werden
const BAD_LETTERS = ['I', 'O', 'Q', 'X'];

// Prüft einen Toleranzrahmen. Rückgabe: Liste {level: 'bad'|'warn'|'ok', text}
function checkFrame({ type, dia = false, mmr = false, datums = [] }) {
  const t = typeById[type];
  if (!t) return [{ level: 'bad', text: 'Unbekannte Toleranzart.' }];
  const out = [];
  const ds = datums.filter(Boolean);
  if (t.datum === 'nein' && ds.length) out.push({ level: 'bad', text: `${t.name} ist eine Formtoleranz und hat keinen Bezug.` });
  if (t.datum === 'ja' && !ds.length) out.push({ level: 'bad', text: `${t.name} braucht einen Bezug, sonst ist die Lage der Zone nicht bestimmt.` });
  if (t.id === 'pos' && !ds.length) out.push({ level: 'warn', text: 'Position ohne Bezug legt nur die Lage innerhalb eines Lochbilds fest, nicht zum Werkstück.' });
  if (dia && !t.dia) out.push({ level: 'bad', text: `Ø ist bei ${t.name} nicht sinnvoll: die Zone ist nicht zylinder- oder kreisförmig.` });
  if (mmr && !t.mmr) out.push({ level: 'bad', text: `Ⓜ geht bei ${t.name} nicht: die Maximum-Material-Bedingung gilt nur für Achsen und Mittelebenen von Maßelementen (ISO 2692).` });
  if (mmr && t.mmr && ['gerad', 'para', 'recht', 'neig', 'pos', 'koax'].includes(t.id) && !dia) out.push({ level: 'warn', text: 'Ⓜ setzt ein Maßelement voraus; bei einer Achse steht dann meist auch Ø vor dem Wert.' });
  for (const d of ds) {
    for (const ch of d.replace('-', '')) if (BAD_LETTERS.includes(ch)) out.push({ level: 'bad', text: `Bezugsbuchstabe ${ch} soll nicht verwendet werden (Verwechslungsgefahr, ISO 5459).` });
  }
  if (new Set(ds).size !== ds.length) out.push({ level: 'bad', text: 'Derselbe Bezug steht zweimal im Rahmen.' });
  if (ds.length > 3) out.push({ level: 'bad', text: 'Ein Bezugssystem hat höchstens drei Bezüge (primär, sekundär, tertiär).' });
  if (['lauf', 'gesamt', 'koax'].includes(t.id) && ds.length && ds.length > 1 && !ds.some((d) => d.includes('-'))) out.push({ level: 'warn', text: 'Bei Lauf und Koaxialität ist meist eine gemeinsame Bezugsachse wie A-B gemeint, nicht ein Bezugssystem A|B.' });
  if (!out.length) out.push({ level: 'ok', text: 'Formal zulässiger Toleranzrahmen.' });
  return out;
}

const frameOk = (spec) => !checkFrame(spec).some((r) => r.level === 'bad');

// ---- figures.js ----
// Eigene Zeichnungen je Toleranzart: Zeichnungseintrag, Toleranzzone, Abweichung.
// Die Abweichung f wird aus dem gezeichneten Ist-Profil berechnet, nicht geschätzt.


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

const FIG = {
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

// ---- app.js ----




const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const num = (v, d = 2) => v.toFixed(d).replace('.', ',');

// ---------- Design und Reiter ----------
function store(k, v) { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch { return null; } }
function setTheme(dark) {
  document.body.classList.toggle('theme-blueprint', dark);
  $('#theme-label').textContent = dark ? 'Heller Modus' : 'Blueprint';
  store('gps-theme', dark ? 'dark' : 'light');
}
setTheme(store('gps-theme') !== 'light');
$('#btn-theme').addEventListener('click', () => setTheme(!document.body.classList.contains('theme-blueprint')));

function showTab(id, sub) {
  if (!$(`#tab-${id}`)) id = 'uebersicht';
  $$('.tabs button').forEach((b) => b.classList.toggle('active', b.dataset.tab === id));
  $$('.tab').forEach((s) => s.classList.toggle('active', s.id === `tab-${id}`));
  if (id === 'toleranzarten' && sub) showType(sub);
}
$$('.tabs button').forEach((b) => b.addEventListener('click', () => { history.replaceState(null, '', `#${b.dataset.tab}`); showTab(b.dataset.tab); }));
const fromHash = () => { const [a, b] = location.hash.slice(1).split('/'); showTab(a || 'uebersicht', b); };
window.addEventListener('hashchange', fromHash);

const badge = (t) => `<span class="dbadge d-${t.datum}">${DATUM_TEXT[t.datum]}</span>`;

// ---------- 1 Übersicht ----------
$('#overview').innerHTML = GROUPS.map((g) => `
  <div class="card group-card">
    <h3>${g.name}</h3>
    <div class="symgrid">${inGroup(g.id).map((t) => `
      <button class="symcard" data-id="${t.id}" title="${esc(t.name)} im Detail">
        ${symbolSvg(t.id, 38)}<span class="sname">${esc(t.name)}</span>${badge(t.groups ? { datum: g.id === "form" ? "nein" : "ja" } : t)}
      </button>`).join('')}</div>
    <p class="note">${esc(g.rule)}</p>
  </div>`).join('');
$$('.symcard').forEach((b) => b.addEventListener('click', () => { location.hash = `toleranzarten/${b.dataset.id}`; }));

// ---------- 2 Toleranzarten im Detail ----------
let curGroup = 'form';
function renderGroup(g, focus) {
  curGroup = g;
  $$('#grp-seg button').forEach((b) => b.classList.toggle('on', b.dataset.v === g));
  const grp = GROUPS.find((x) => x.id === g);
  const list = TYPES.filter((t) => t.group === g);
  const extra = g === 'richtung' || g === 'ort'
    ? `<p class="note">Linien- und Flächenprofil gehören mit Bezug ebenfalls zu dieser Gruppe, siehe Formtoleranzen.</p>` : '';
  $('#types').innerHTML = `
    <div class="rulebox"><b>Merksatz ${esc(grp.name)}:</b> ${esc(grp.rule)}</div>${extra}
    <div class="tolwrap"><table class="toltable">
      <thead><tr><th>Symbol</th><th>Zeichnung</th><th>Toleranzzone</th><th>Abweichung</th></tr></thead>
      <tbody>${list.map((t) => `
        <tr id="row-${t.id}" class="${t.id === focus ? 'focus' : ''}">
          <td class="symcell">${symbolSvg(t.id, 34)}<b>${esc(t.name)}</b><span class="en">${esc(t.en)}</span>${badge(t)}</td>
          <td>${FIG[t.id].draw()}</td><td>${FIG[t.id].zone()}</td><td>${FIG[t.id].dev()}</td>
        </tr>
        <tr class="info"><td colspan="4"><dl>
          <dt>Toleriertes Element</dt><dd>${esc(t.element)}</dd>
          <dt>Toleranzzone</dt><dd>${esc(t.zone)}</dd>
          <dt>Begrenzt gleich mit</dt><dd>${esc(t.includes)}</dd>
          <dt>Prüfung</dt><dd>${esc(t.check)}</dd>
          <dt>Hinweis</dt><dd>${esc(t.note)}</dd>
        </dl></td></tr>`).join('')}</tbody>
    </table></div>`;
  if (focus) $(`#row-${focus}`)?.scrollIntoView({ block: 'start', behavior: 'smooth' });
}
function showType(id) { const t = typeById[id]; if (t) renderGroup(t.group, id); }
$('#grp-seg').innerHTML = GROUPS.map((g) => `<button data-v="${g.id}">${esc(g.name)}</button>`).join('');
$$('#grp-seg button').forEach((b) => b.addEventListener('click', () => renderGroup(b.dataset.v)));
renderGroup('form');

// ---------- 3 Toleranzrahmen lesen und bauen ----------
$('#b-type').innerHTML = GROUPS.map((g) => `<optgroup label="${g.name}">${TYPES.filter((t) => t.group === g.id).map((t) => `<option value="${t.id}">${t.name}</option>`).join('')}</optgroup>`).join('');
function builder() {
  const spec = { type: $('#b-type').value, dia: $('#b-dia').checked, mmr: $('#b-mmr').checked, datums: ['#b-d1', '#b-d2', '#b-d3'].map((s) => $(s).value.trim().toUpperCase()).filter(Boolean) };
  const t = typeById[spec.type], val = $('#b-val').value.trim() || '0,1';
  const fr = frame(6, 6, { s: t.id, value: val, dia: spec.dia, mods: spec.mmr ? ['Ⓜ'] : [], datums: spec.datums }, 22);
  $('#b-svg').setAttribute('viewBox', `0 0 ${f1(fr.w + 12)} 34`);
  $('#b-svg').innerHTML = fr.svg;
  const res = checkFrame(spec);
  $('#b-check').innerHTML = res.map((r) => `<li class="${r.level}">${esc(r.text)}</li>`).join('');
  const roles = ['primärer', 'sekundärer', 'tertiärer'];
  const ds = spec.datums.map((d, i) => `${roles[i]} Bezug ${d}${d.includes('-') ? ' (gemeinsame Achse)' : ''}`);
  $('#b-read').innerHTML = `<p><b>${esc(t.name)}</b> (${GROUPS.find((g) => g.id === t.group).name.replace(/en$/, '')}). Toleranzwert t = ${esc((spec.dia ? 'Ø ' : '') + val)} mm.</p>
    <p>Die Zone: ${esc(t.zone)}.</p>
    <p>${ds.length ? `Ausgerichtet bzw. festgelegt über ${esc(ds.join(', '))}. Die Reihenfolge im Rahmen ist die Reihenfolge beim Ausrichten.` : 'Ohne Bezug: die Zone darf beliebig liegen.'}</p>
    ${spec.mmr ? '<p>Ⓜ: Weicht das Maßelement vom Maximum-Material-Maß ab, wird die Toleranz um diesen Betrag größer (ISO 2692).</p>' : ''}`;
}
$$('#tab-rahmen input, #tab-rahmen select').forEach((el) => el.addEventListener('input', builder));
$$('#b-examples button').forEach((b) => b.addEventListener('click', () => {
  const [type, val, dia, mmr, d1, d2, d3] = b.dataset.ex.split('|');
  Object.assign($('#b-type'), { value: type }); $('#b-val').value = val; $('#b-dia').checked = dia === '1'; $('#b-mmr').checked = mmr === '1';
  $('#b-d1').value = d1 || ''; $('#b-d2').value = d2 || ''; $('#b-d3').value = d3 || ''; builder();
}));
builder();

// ---------- 4 Grundsätze ISO 8015 ----------
$('#principles').innerHTML = PRINCIPLES.map((p) => `
  <div class="pcard"><div class="pnum">${p.n}</div><div><b>${esc(p.name)}</b><p>${esc(p.text)}</p><p class="note">Praxis: ${esc(p.exam)}</p></div></div>`).join('');

function envelope() {
  const d = +$('#e-d').value, f = +$('#e-f').value, E = $('#e-E').checked;
  $('#e-d-out').textContent = `${num(d)} mm`; $('#e-f-out').textContent = `${num(f)} mm`;
  const okSize = d >= 19.9 - 1e-9 && d <= 20.0 + 1e-9, hull = d + f, okHull = hull <= 20.0 + 1e-9;
  // Zeichnung: Welle mit Durchbiegung, stark überhöht (1 mm ≙ 400 px quer)
  const k = 400, r = 30 + (d - 20) * k / 2, bow = f * k, mid = 70;
  const curve = (s) => `M30 ${f1(mid + s * r)} Q120 ${f1(mid + s * r - 2 * bow)} 210 ${f1(mid + s * r)}`;
  let svg = path(curve(-1), 'part') + path(curve(1), 'part') + line(30, mid - r, 30, mid + r) + line(210, mid - r, 210, mid + r) +
    path(`M20 ${mid} Q120 ${f1(mid - 2 * bow)} 220 ${mid}`, 'center');
  // Hüllzylinder Ø20,0 liegt mittig zur halben Durchbiegung; berührt die Welle genau bei d + f = 20,0
  const c = mid - bow / 2;
  if (E) svg += line(20, c - 30, 220, c - 30, okHull ? 'zone' : 'warnline') + line(20, c + 30, 220, c + 30, okHull ? 'zone' : 'warnline') + text(120, 18, 'Hülle Ø20,0 (Maximum-Material-Maß)', 'zonetxt');
  svg += text(120, 140, `Zweipunktmaß ${num(d)} · Krümmung ${num(f)} · Hülle ${num(hull)}`, 'small');
  $('#e-svg').innerHTML = svg;
  const verdict = (ok, s) => `<li class="${ok ? 'ok' : 'bad'}">${ok ? '✓' : '✗'} ${s}</li>`;
  $('#e-res').innerHTML = verdict(okSize, `Örtliches Zweipunktmaß ${num(d)} liegt ${okSize ? 'in' : 'außerhalb'} 19,90 … 20,00`) +
    (E ? verdict(okHull, `Hülle ${num(d)} + ${num(f)} = ${num(hull)} ${okHull ? '≤' : '>'} 20,00`)
      : `<li class="warn">Ohne Ⓔ begrenzt das Maß die Krümmung nicht. Dafür braucht es eine eigene Geradheitstoleranz oder die Allgemeintoleranz.</li>`);
}
$$('#e-d, #e-f, #e-E').forEach((el) => el.addEventListener('input', envelope));
envelope();

// ---------- 5 Übung ----------
let score = { ok: 0, n: 0 }, current = null;
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const shuffle = (arr) => arr.map((v) => [Math.random(), v]).sort((a, b) => a[0] - b[0]).map((x) => x[1]);
const others = (t, n, key = 'name') => shuffle(TYPES.filter((x) => x[key] !== t[key])).slice(0, n).map((x) => x[key]);

function makeQuestion(kind = pick(['sym', 'datum', 'group', 'frame', 'zone'])) {
  const t = pick(TYPES);
  if (kind === 'sym') return { q: 'Welche Toleranzart hat dieses Symbol?', svg: symbolSvg(t.id, 64), choices: shuffle([t.name, ...others(t, 3)]), answer: t.name, why: `${t.name}: ${t.zone}.` };
  if (kind === 'datum') return { q: `Braucht ${t.name} einen Bezug?`, choices: ['kein Bezug', 'Bezug erforderlich', 'mit oder ohne Bezug'], answer: DATUM_TEXT[t.datum], why: GROUPS.find((g) => g.id === t.group).rule };
  if (kind === 'group') return { q: 'Zu welcher Gruppe gehört dieses Symbol?', svg: symbolSvg(t.id, 64), choices: GROUPS.map((g) => g.name), answer: GROUPS.find((g) => g.id === t.group).name, why: `${t.name} ist eine ${GROUPS.find((g) => g.id === t.group).name.replace(/en$/, '')}.` };
  if (kind === 'zone') return { q: `Welche Toleranzart hat diese Zone: ${t.zone}?`, choices: shuffle([t.name, ...others(t, 3)]), answer: t.name, why: `${t.name}: ${t.element}.` };
  // Toleranzrahmen auf Zulässigkeit prüfen; die Hälfte der Aufgaben enthält einen typischen Fehler
  const bad = Math.random() < 0.55;
  let spec = { type: t.id, dia: t.dia && Math.random() < 0.5, mmr: false, datums: t.datum === 'nein' ? [] : ['A', 'B'].slice(0, t.datum === 'optional' ? Math.round(Math.random()) : 1) };
  if (['lauf', 'gesamt'].includes(t.id)) spec.datums = ['A-B'];
  if (bad) {
    const errs = [];
    if (t.datum === 'nein') errs.push({ datums: ['A'] });
    if (t.datum === 'ja') errs.push({ datums: [] });
    if (!t.dia) errs.push({ dia: true });
    if (!t.mmr) errs.push({ mmr: true });
    errs.push({ datums: [pick(['I', 'O', 'Q'])] });
    spec = { ...spec, ...pick(errs) };
  }
  const ok = frameOk(spec), r = checkFrame(spec).filter((x) => x.level === 'bad');
  const fr = frame(4, 4, { s: t.id, value: '0,05', dia: spec.dia, mods: spec.mmr ? ['Ⓜ'] : [], datums: spec.datums }, 22);
  return { q: 'Ist dieser Toleranzrahmen zulässig?', svg: `<svg class="qframe" viewBox="0 0 ${f1(fr.w + 8)} 30">${fr.svg}</svg>`, choices: ['zulässig', 'nicht zulässig'], answer: ok ? 'zulässig' : 'nicht zulässig', why: ok ? `${t.name}: formal zulässig.` : r.map((x) => x.text).join(' ') };
}

function ask() {
  current = makeQuestion($('#q-kind').value || undefined);
  $('#q-text').textContent = current.q;
  $('#q-svg').innerHTML = current.svg || '';
  $('#q-feedback').textContent = ''; $('#q-feedback').className = 'feedback';
  $('#q-choices').innerHTML = current.choices.map((c) => `<button class="btn ghost choice">${esc(c)}</button>`).join('');
  $$('#q-choices .choice').forEach((b) => b.addEventListener('click', () => answer(b)));
}
function answer(b) {
  if (!current || current.done) return;
  current.done = true; score.n++;
  const ok = b.textContent === current.answer;
  if (ok) score.ok++;
  $$('#q-choices .choice').forEach((x) => { x.disabled = true; if (x.textContent === current.answer) x.classList.add('right'); });
  if (!ok) b.classList.add('wrong');
  $('#q-feedback').className = `feedback ${ok ? 'ok' : 'bad'}`;
  $('#q-feedback').textContent = `${ok ? 'Richtig.' : `Nicht ganz: ${current.answer}.`} ${current.why}`;
  $('#q-score').textContent = `${score.ok} / ${score.n}`;
}
$('#q-next').addEventListener('click', ask);
$('#q-kind').addEventListener('change', ask);
ask();

fromHash();

})();
