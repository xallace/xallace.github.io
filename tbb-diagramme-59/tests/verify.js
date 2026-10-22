// Prüft den Rechenkern gegen die Werte von Tabellenbuch Metall S. 59: node tests/verify.js
'use strict';
const path = require('path');
const C = require(path.join(__dirname, '..', 'js', 'core.js'));

let pass = 0, fail = 0;
function check(name, got, want, tol = 0) {
  const ok = typeof want === 'number' ? Math.abs(got - want) <= tol : got === want;
  if (ok) pass++; else fail++;
  console.log(`${ok ? 'ok  ' : 'FEHL'} ${name}: ${got}${ok ? '' : `  (erwartet ${want}${tol ? ' ± ' + tol : ''})`}`);
}

// 1. Zahlenformat & Hilfsfunktionen
check('fmt 10.8', C.fmt(10.8), '10,8');
check('fmt +3.5 mit Pluszeichen', C.fmt(3.5, 1, { plus: true }), '+3,5');
check('fmt -3.5 mit Minuszeichen', C.fmt(-3.5, 1, { plus: true }), '−3,5');
check('parseNum „10,8°“', C.parseNum('10,8°'), 10.8);
check('parseNum „65 %“', C.parseNum('65 %'), 65);

// 2. Mehrere Kennlinien & Streuung (Festigkeit Rm und Re über Temperatur)
const TEMPS = [0, 100, 200, 300, 400, 500, 600];
// Messwerte aus der Abbildung abgelesen, wie in js/tab-kennlinien.js
const RmPairs = [[1650, 1705], [1550, 1605], [1455, 1510], [1430, 1480], [1355, 1440], [1050, 1170], [425, 545]];
const RePairs = [[1205, 1255], [1160, 1200], [1125, 1165], [1070, 1120], [1020, 1065], [840, 920], [375, 485]];
const stRm = C.scatterStats(RmPairs), stRe = C.scatterStats(RePairs);
check('Rm Mittelwert bei 0 °C', stRm.means[0], 1677.5);
check('Rm Streuspanne bei 500 °C', stRm.spans[5], 120);
check('Re Mittelwert bei 400 °C', stRe.means[4], 1042.5);
const fRm = C.pchip(TEMPS, stRm.means), fRe = C.pchip(TEMPS, stRe.means);
let monoDec = true;
for (let T = 0; T < 600; T += 2) {
  if (fRm(T + 2) > fRm(T) || fRe(T + 2) > fRe(T) || fRm(T) <= fRe(T)) monoDec = false;
}
check('Rm(T) und Re(T) streng monoton fallend & Rm > Re', monoDec, true);
const t1000 = C.invert(fRm, 1000, 0, 600);
check('Umkehrung fallende Kennlinie fRm(T) = 1000 N/mm²', fRm(t1000), 1000, 1e-6);

// 3. Polarkoordinatensystem (DIN 461: 360°-Teilung, 0° rechts, +φ gegen Uhrzeigersinn)
check('normDeg 360° → 0°', C.normDeg(360), 0);
check('normDeg −90° → 270°', C.normDeg(-90), 270);
check('polarToCart r=4, φ=0° → x=4, y=0', `${C.polarToCart(4, 0).x};${C.polarToCart(4, 0).y}`, '4;0');
check('polarToCart r=4, φ=90° → x=0, y=4', `${C.polarToCart(4, 90).x};${C.polarToCart(4, 90).y}`, '0;4');
check('polarToCart r=4, φ=180° → x=-4, y=0', `${C.polarToCart(4, 180).x};${C.polarToCart(4, 180).y}`, '-4;0');
check('polarToCart r=4, φ=270° → x=0, y=-4', `${C.polarToCart(4, 270).x};${C.polarToCart(4, 270).y}`, '0;-4');
const cp = C.cartToPolar(-2, -2);
check('cartToPolar (-2, -2) Winkel 225°', cp.deg, 225, 1e-6);
const scr90 = C.polarToScreen(300, 250, 100, 90);
check('polarToScreen 90° liegt senkrecht über dem Pol', `${scr90[0]};${scr90[1]}`, '300;150');
const backPol = C.screenToPolar(300, 250, 300, 150, 25);
check('screenToPolar Umkehrung r=4, φ=90°', `${backPol.r};${backPol.deg}`, '4;90');
const pp1 = C.parsePolar('P1(3,5; 60°)');
check('parsePolar P1(3,5; 60°)', `${pp1.name}:${pp1.r};${pp1.deg}`, 'P1:3.5;60');
const pp2 = C.parsePolar('Q(4 | 270)');
check('parsePolar Q(4 | 270)', `${pp2.name}:${pp2.r};${pp2.deg}`, 'Q:4;270');
check('polarText semi', C.polarText('P1', 3.5, 45, 'semi'), 'P1(3,5; 45°)');
check('polarRegion Pol', C.polarRegion(0, 45), 'Nullpunkt (Pol)');
check('polarRegion 0°-Achse', C.polarRegion(3, 0), '0°-Achse (rechts)');
check('upperPolarCurve periodisch 0° = 360°', C.upperPolarCurve(0), C.upperPolarCurve(360), 1e-9);

// 4. Rundheitsprüfung (Buch: 10 mm ≙ 5 µm, Vergrößerung 2000 : 1)
check('Maßstab 10 mm ≙ 5 µm: 5 µm → 10 mm', C.umToMm(5, 5), 10);
check('Maßstab 10 mm ≙ 5 µm: 3,5 µm → 7 mm', C.umToMm(3.5, 5), 7);
check('Maßstab 10 mm ≙ 5 µm: 8 mm → 4 µm', C.mmToUm(8, 5), 4);
check('Vergrößerung bei 10 mm ≙ 5 µm ist 2000 : 1', C.magnification(5), 2000);
const stOval = C.roundnessStats('oval', 3.5);
check('Ovalität A=3,5 µm: Max = +3,5 µm', stOval.max, 3.5, 1e-4);
check('Ovalität: Erhebung an der Backe bei 0°', stOval.maxDeg, 0);
check('Ovalität A=3,5 µm: Min = −3,5 µm', stOval.min, -3.5, 1e-4);
check('Ovalität: Einschnürung zwischen den Backen bei 90°', stOval.minDeg, 90);
check('Ovalität A=3,5 µm: Unrundheit RONt = 7,0 µm', stOval.ront, 7.0, 1e-4);
const st3Jaw = C.roundnessStats('3jaw', 3.0);
check('3-Backenfutter A=3,0 µm: Unrundheit RONt = 6,0 µm', st3Jaw.ront, 6.0, 1e-4);
// Buchbild: Dreiecksform, Erhebungen bei etwa 90°, 210°, 330°, Einschnürungen bei etwa 30°, 150°, 270°
const stBook = C.roundnessStats('book', 4);
check('Buchbild A=4 µm: Unrundheit = 2 · A = 8 µm', stBook.ront, 8, 0.02);
for (const d of [90, 210, 330]) check(`Buchbild: Erhebung bei ${d}°`, C.roundnessDelta(d, 'book', 1) > 0.6, true);
for (const d of [30, 150, 270]) check(`Buchbild: Einschnürung bei ${d}°`, C.roundnessDelta(d, 'book', 1) < -0.6, true);
check('Buchbild: größte Erhebung bei etwa 330°', stBook.maxDeg, 330, 10);

// 5. Flächendiagramme & Mittelpunktswinkel α = 360° · x % / 100 %
// Buchbeispiel S. 59: Legierung CuZn36Pb3 → Bleianteil 3 % → α = 10,8°
check('Buchbeispiel CuZn36Pb3: Pb 3 % → α = 10,8°', C.pctToAngle(3), 10.8, 1e-9);
check('CuZn36Pb3: Zn 36 % → α = 129,6°', C.pctToAngle(36), 129.6, 1e-9);
check('CuZn36Pb3: Cu 61 % → α = 219,6°', C.pctToAngle(61), 219.6, 1e-9);
check('CuZn36Pb3: Winkelsumme = 360°', C.pctToAngle(3) + C.pctToAngle(36) + C.pctToAngle(61), 360, 1e-9);
// Oberes Buch-Kreisdiagramm: 65 %, 25 %, 5 %, 5 %
check('Kreisdiagramm 25 % → α = 90°', C.pctToAngle(25), 90, 1e-9);
check('Kreisdiagramm 65 % → α = 234°', C.pctToAngle(65), 234, 1e-9);
check('Kreisdiagramm 5 % → α = 18°', C.pctToAngle(5), 18, 1e-9);
check('Umkehrung 10,8° → 3 %', C.angleToPct(10.8), 3, 1e-9);
const alloy = C.parseAlloy('CuZn36Pb3');
check('parseAlloy CuZn36Pb3 liefert Cu=61, Zn=36, Pb=3', alloy.map(e => `${e.sym}:${e.pct}`).join(','), 'Cu:61,Zn:36,Pb:3');

console.log(`\n${pass} bestanden, ${fail} fehlgeschlagen`);
process.exit(fail ? 1 : 0);
