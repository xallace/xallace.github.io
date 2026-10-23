/* Geometrischer Rechenkern ohne DOM für Tabellenbuch Metall S. 60:
   „3.2 Geometrische Grundkonstruktionen – Strecken, Lote, Winkel“
   1. Parallele zu einer Strecke
   2. Halbieren einer Strecke (Mittelsenkrechte)
   3. Fällen eines Lotes
   4. Errichten einer Senkrechten im Punkt P (60°-Bögen / Satz des Thales)
   5. Halbieren eines Winkels (Winkelhalbierende)
   6. Teilen einer Strecke in n gleiche Teile (Strahlensatz)
   Läuft im Browser (window.Core) und in Node (module.exports) für tests/verify.js. */
(function (root) {
  'use strict';

  const MINUS = '−';
  const THIN = ' ';
  const DEG = Math.PI / 180;
  const RAD = 180 / Math.PI;

  // Zahl im deutschen Format: Dezimalkomma, echtes Minuszeichen, ohne überflüssige Nullen.
  function fmt(v, dec = 1, opts = {}) {
    if (!isFinite(v)) return '–';
    if (Math.abs(v) < 0.5 * Math.pow(10, -dec)) v = 0;
    let s = Math.abs(v).toFixed(dec);
    if (!opts.keepZeros && s.includes('.')) s = s.replace(/0+$/, '').replace(/\.$/, '');
    let [int, frac] = s.split('.');
    if (opts.group && int.length > 4) int = int.replace(/\B(?=(\d{3})+(?!\d))/g, THIN);
    s = frac ? int + ',' + frac : int;
    const sign = v < 0 && !opts.noMinus ? MINUS : (v > 0 && opts.plus ? '+' : '');
    return sign + s;
  }

  function parseNum(str) {
    const s = String(str).trim().replace(/[−–]/g, '-').replace(/[°%\s]|mm/g, '').replace(',', '.');
    if (s === '' || !/^[-+]?(\d+\.?\d*|\.\d+)$/.test(s)) return NaN;
    return Number(s);
  }

  // ================================================================ Euklidische 2D-Vektorgeometrie
  // Mathematisches Koordinatensystem (x nach rechts, y nach oben) oder Bildschirmkoordinaten:
  // Alle rein metrischen Größen (Abstände, Teilverhältnisse, Orthogonalität) sind koordinatenunabhängig.
  function pt(x, y) { return { x: +x, y: +y }; }
  function add(a, b) { return { x: a.x + b.x, y: a.y + b.y }; }
  function sub(a, b) { return { x: a.x - b.x, y: a.y - b.y }; }
  function scale(v, s) { return { x: v.x * s, y: v.y * s }; }
  function dot(a, b) { return a.x * b.x + a.y * b.y; }
  function cross(a, b) { return a.x * b.y - a.y * b.x; }
  function len(v) { return Math.hypot(v.x, v.y); }
  function dist(a, b) { return Math.hypot(b.x - a.x, b.y - a.y); }
  function mid(a, b) { return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }; }
  function lerp(a, b, t) { return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t }; }

  function unit(v) {
    const l = Math.hypot(v.x, v.y);
    return l < 1e-12 ? { x: 1, y: 0 } : { x: v.x / l, y: v.y / l };
  }

  // Drehung um +90° im mathematischen Sinn: (-y, x)
  function perp(v) { return { x: -v.y, y: v.x }; }

  function normDeg(deg) {
    const d = ((deg % 360) + 360) % 360;
    return Math.abs(d - 360) < 1e-9 || Math.abs(d) < 1e-9 ? 0 : +d.toFixed(8);
  }

  // Punkt in Richtung deg (mathematisch: 0° rechts, +90° oben) im Abstand r von c
  function polarPt(c, r, deg) {
    const a = deg * DEG;
    return { x: c.x + r * Math.cos(a), y: c.y + r * Math.sin(a) };
  }

  // Winkel von c nach p in Grad [0, 360) im mathematischen Sinn (y nach oben)
  function angleBetween(c, p) {
    return normDeg(Math.atan2(p.y - c.y, p.x - c.x) * RAD);
  }

  // Kleinster ungerichteter Winkel zwischen zwei Vektoren u und v in Grad [0, 180]
  function angleVectorsDeg(u, v) {
    const lu = len(u), lv = len(v);
    if (lu < 1e-12 || lv < 1e-12) return 0;
    const c = Math.max(-1, Math.min(1, dot(u, v) / (lu * lv)));
    return +(Math.acos(c) * RAD).toFixed(8);
  }

  // Orthogonalprojection von P auf die Gerade durch A und B
  function projectPointOnLine(P, A, B) {
    const ab = sub(B, A);
    const l2 = dot(ab, ab);
    if (l2 < 1e-12) return { foot: { x: A.x, y: A.y }, t: 0, dist: dist(P, A), signedDist: 0 };
    const ap = sub(P, A);
    const t = dot(ap, ab) / l2;
    const foot = lerp(A, B, t);
    const d = dist(P, foot);
    const signedDist = cross(ab, ap) / Math.sqrt(l2);
    return { foot, t, dist: d, signedDist };
  }

  // Schnittpunkte zweier Kreise (c1, r1) und (c2, r2).
  // Liefert { ok, reason, d, points: [pLeft, pRight] } bezogen auf den gerichteten Vektor c1 -> c2.
  function intersectCircles(c1, r1, c2, r2) {
    const dVec = sub(c2, c1);
    const d = len(dVec);
    if (d < 1e-9) return { ok: false, reason: 'concentric', d, points: [] };
    if (d > r1 + r2 + 1e-9) return { ok: false, reason: 'too_far', d, points: [] };
    if (d < Math.abs(r1 - r2) - 1e-9) return { ok: false, reason: 'contained', d, points: [] };
    const a = (r1 * r1 - r2 * r2 + d * d) / (2 * d);
    const h2 = Math.max(0, r1 * r1 - a * a);
    const h = Math.sqrt(h2);
    const u = scale(dVec, 1 / d);
    const n = perp(u); // links von c1 -> c2 (im math. System: +y bei waagrechtem c1->c2)
    const base = add(c1, scale(u, a));
    const p1 = add(base, scale(n, h));
    const p2 = sub(base, scale(n, h));
    return { ok: h > 1e-7, tangent: h <= 1e-7, reason: h > 1e-7 ? 'two_points' : 'tangent', d, a, h, base, points: [p1, p2] };
  }

  // Schnittpunkte eines Kreises (center, r) mit der Geraden durch A und B.
  // Die beiden Schnittpunkte sind entlang der Richtung A -> B sortiert (t1 <= t2).
  function intersectCircleLine(center, r, A, B) {
    const pr = projectPointOnLine(center, A, B);
    if (pr.dist > r + 1e-9) return { ok: false, reason: 'too_small', minRadius: pr.dist, foot: pr.foot, points: [] };
    const halfChord = Math.sqrt(Math.max(0, r * r - pr.dist * pr.dist));
    const u = unit(sub(B, A));
    const pA = sub(pr.foot, scale(u, halfChord));
    const pB = add(pr.foot, scale(u, halfChord));
    return {
      ok: halfChord > 1e-7,
      tangent: halfChord <= 1e-7,
      reason: halfChord > 1e-7 ? 'two_points' : 'tangent',
      foot: pr.foot,
      distToLine: pr.dist,
      halfChord,
      chord: 2 * halfChord,
      points: [pA, pB]
    };
  }

  // ================================================================ 1. Parallele zu einer Strecke (S. 60 oben)
  // Gegeben: Strecke AB und Punkt P auf gesuchter Parallele g'.
  // 1. Kreisbogen mit Radius r um A ergibt Schnittpunkt C (auf AB).
  //    Im Buch ist r = |AP| gewählt, sodass Kreisbogen 1 durch P und C verläuft (Raute ACDP).
  //    Wird ein eigener Radius r >= Abstand(P, AB) übergeben, entspricht das der verallgemeinerten Rauten-/Parallelogramm-Konstruktion:
  //    Bei Buch-Standard (r == null) ist r = |AP|.
  // 2. Kreisbogen mit Radius r um P.
  // 3. Kreisbogen mit Radius r um C ergibt Schnittpunkt D.
  // 4. Verbindungslinie PD ist Parallele g' zu AB.
  function constructParallel(A, B, P, rCustom = null) {
    const abLen = dist(A, B);
    const u = unit(sub(B, A));
    const pr = projectPointOnLine(P, A, B);
    const r = rCustom != null ? +rCustom : dist(A, P);
    if (r < pr.dist - 1e-7 || r <= 0) {
      return { ok: false, reason: 'radius_too_small', minRadius: pr.dist, distH: pr.dist };
    }
    // 1. Schnittpunkt C auf dem Strahl A -> B im Abstand r von A
    const C = add(A, scale(u, r));
    // Bei r == |AP| (Buch): P, A, C, D bilden eine Raute der Seitenlänge r, und D = P + (C - A).
    // Bei beliebigem r: Kreisbogen 1 mit Radius r um A -> C; falls r != |AP|, schneidet Bogen 2 (Radius |AP| oder r) ...
    // Damit Schritt 1..3 exakt mit einem einzigen Zirkelradius r funktioniert, ist im Buch r = |AP|!
    // Falls rCustom gesetzt wird, verschieben wir P entlang des Strahls AP auf Abstand rCustom oder berechnen den Kreisschnitt (P, r) mit (C, r).
    const inter = intersectCircles(P, r, C, r);
    if (!inter.ok && !inter.tangent) {
      return { ok: false, reason: 'arcs_do_not_meet', r, C, distH: pr.dist };
    }
    // Wähle den Schnittpunkt D, für den PD in Richtung AB zeigt (dot(D - P, u) > 0)
    const [d1, d2] = inter.points;
    const D = dot(sub(d1, P), u) >= dot(sub(d2, P), u) ? d1 : d2;
    const angleDiff = angleVectorsDeg(sub(B, A), sub(D, P));
    const isRhombus = Math.abs(dist(A, P) - r) < 1e-5;
    return {
      ok: true,
      A, B, P, C, D,
      r: +r.toFixed(6),
      abLen: +abLen.toFixed(6),
      distAP: +dist(A, P).toFixed(6),
      distAC: +dist(A, C).toFixed(6),
      distPD: +dist(P, D).toFixed(6),
      distCD: +dist(C, D).toFixed(6),
      distH: +pr.dist.toFixed(6),
      footP: pr.foot,
      isRhombus,
      angleDiffDeg: +angleDiff.toFixed(6)
    };
  }

  // ================================================================ 2. Halbieren einer Strecke (Mittelsenkrechte)
  // Gegeben: Strecke AB.
  // 1. Kreisbogen 1 mit Radius r um A; r > 1/2 AB.
  // 2. Kreisbogen 2 mit gleichem Radius r um B (ergibt Schnittpunkte S1 und S2).
  // 3. Verbindungslinie S1-S2 ist die Mittelsenkrechte bzw. Halbierende der Strecke AB (Mittelpunkt M).
  function constructBisector(A, B, r) {
    const abLen = dist(A, B);
    const halfAB = abLen / 2;
    const M = mid(A, B);
    if (r <= halfAB + 1e-9) {
      return {
        ok: false,
        reason: Math.abs(r - halfAB) <= 1e-7 ? 'tangent_equal_half' : 'radius_too_small',
        A, B, M, r, abLen, halfAB, minRadius: halfAB
      };
    }
    const inter = intersectCircles(A, r, B, r);
    const [S1, S2] = inter.points; // S1 oben (links von A->B), S2 unten
    const h = Math.sqrt(Math.max(0, r * r - halfAB * halfAB));
    const angleDeg = angleVectorsDeg(sub(B, A), sub(S1, S2));
    return {
      ok: true,
      A, B, M, S1, S2,
      r: +r.toFixed(6),
      abLen: +abLen.toFixed(6),
      halfAB: +halfAB.toFixed(6),
      distAM: +dist(A, M).toFixed(6),
      distMB: +dist(M, B).toFixed(6),
      heightH: +h.toFixed(6),
      perpAngleDeg: +angleDeg.toFixed(6)
    };
  }

  // ================================================================ 3. Fällen eines Lotes (von Punkt P auf Gerade g)
  // Gegeben: Gerade g (durch G1, G2) und Punkt P.
  // 1. Beliebiger Kreisbogen 1 (Radius r1) um P ergibt Schnittpunkte A und B auf g.
  // 2. Kreisbogen 2 mit Radius r2 um A; r2 > 1/2 AB.
  // 3. Kreisbogen 3 mit gleichem Radius r2 um B (Schnittpunkt C).
  // 4. Die Verbindungslinie des Schnittpunktes C mit P ist das gesuchte Lot (Lotfußpunkt F auf g).
  function constructDropPerp(G1, G2, P, r1, r2) {
    const pr = projectPointOnLine(P, G1, G2);
    const d = pr.dist;
    if (r1 <= d + 1e-7) {
      return {
        ok: false,
        stepFailed: 1,
        reason: 'r1_too_small',
        minR1: d,
        distP: d,
        foot: pr.foot
      };
    }
    const cl = intersectCircleLine(P, r1, G1, G2);
    const [A, B] = cl.points;
    const abLen = cl.chord;
    const halfAB = abLen / 2;
    if (r2 <= halfAB + 1e-7) {
      return {
        ok: false,
        stepFailed: 2,
        reason: 'r2_too_small',
        A, B, foot: pr.foot,
        distP: d, r1, r2,
        abLen, halfAB, minR2: halfAB
      };
    }
    const inter = intersectCircles(A, r2, B, r2);
    // Wähle C auf der P gegenüberliegenden Seite der Geraden g (wie im Buch)
    const [c1, c2] = inter.points;
    const C = dist(c1, P) >= dist(c2, P) ? c1 : c2;
    const perpDeg = angleVectorsDeg(sub(G2, G1), sub(P, C));
    return {
      ok: true,
      G1, G2, P, A, B, C,
      foot: pr.foot,
      r1: +r1.toFixed(6),
      r2: +r2.toFixed(6),
      distP: +d.toFixed(6),
      abLen: +abLen.toFixed(6),
      halfAB: +halfAB.toFixed(6),
      distFC: +dist(pr.foot, C).toFixed(6),
      perpAngleDeg: +perpDeg.toFixed(6)
    };
  }

  // ================================================================ 4. Errichten einer Senkrechten im Punkt P
  // Gegeben: Gerade g und Punkt P auf g.
  // 1. Kreisbogen 1 um P mit beliebigem Radius r ergibt Schnittpunkt A auf g.
  // 2. Kreisbogen 2 mit gleichem Radius r um Punkt A ergibt Schnittpunkt B auf Kreisbogen 1 (gleichseitiges Dreieck PAB, 60°).
  // 3. Kreisbogen 3 mit gleichem Radius r um B.
  // 4. A und B verbinden und Gerade verlängern (Schnittpunkt C auf Kreisbogen 3, |BC| = r, Thaleskreis um B).
  // 5. Punkt C mit Punkt P verbinden (Senkrechte in P, |PC| = r * sqrt(3)).
  function constructErectPerp(P, lineDeg = 0, r = 100, side = 'left', up = 1) {
    if (r <= 0) return { ok: false, reason: 'invalid_radius' };
    // Im Buch liegt A links von P auf der waagrechten Geraden g (side === 'left' -> Richtung lineDeg + 180°)
    const dirA = side === 'left' ? lineDeg + 180 : lineDeg;
    const A = polarPt(P, r, dirA);
    // B bildet mit P und A ein gleichseitiges Dreieck (60° von PA in die obere Halbebene):
    // Wenn A links von P liegt (180°), liegt B bei 120° von P aus (bzw. 60° von A aus).
    const sign = (side === 'left' ? -1 : 1) * (up >= 0 ? 1 : -1);
    const degBFromP = dirA + sign * 60;
    const B = polarPt(P, r, degBFromP);
    // 4. Gerade A -> B über B hinaus um r verlängern ergibt C auf Kreisbogen 3 um B:
    const uAB = unit(sub(B, A));
    const C = add(B, scale(uAB, r));
    const vecG = polarPt({ x: 0, y: 0 }, 1, lineDeg);
    const vecPC = sub(C, P);
    const perpDeg = angleVectorsDeg(vecG, vecPC);
    return {
      ok: true,
      P, A, B, C,
      r: +r.toFixed(6),
      distPA: +dist(P, A).toFixed(6),
      distAB: +dist(A, B).toFixed(6),
      distBP: +dist(B, P).toFixed(6),
      distBC: +dist(B, C).toFixed(6),
      distAC: +dist(A, C).toFixed(6),
      distPC: +dist(P, C).toFixed(6),
      expectedPC: +(r * Math.sqrt(3)).toFixed(6),
      anglePAB: +angleVectorsDeg(sub(P, A), sub(B, A)).toFixed(6),
      perpAngleDeg: +perpDeg.toFixed(6)
    };
  }

  // ================================================================ 5. Halbieren eines Winkels
  // Gegeben: Winkel α am Scheitelpunkt S (zwischen Schenkel 1 unter startDeg und Schenkel 2 unter startDeg + alphaDeg).
  // 1. Beliebiger Kreisbogen 1 (Radius r1) um S ergibt Schnittpunkte A und B.
  // 2. Kreisbogen 2 mit Radius r2 um A; r2 > 1/2 AB.
  // 3. Kreisbogen 3 mit gleichem Radius r2 um B ergibt Schnittpunkt C.
  // 4. Verbindungslinie SC ist die gesuchte Winkelhalbierende (teilt α in α/2 und α/2).
  function constructAngleBisector(S, startDeg, alphaDeg, r1, r2) {
    if (alphaDeg <= 0 || alphaDeg >= 180) {
      return { ok: false, reason: 'invalid_angle', alphaDeg };
    }
    const degB = startDeg;
    const degA = startDeg + alphaDeg;
    const B = polarPt(S, r1, degB);
    const A = polarPt(S, r1, degA);
    const abLen = dist(A, B);
    const halfAB = abLen / 2;
    if (r2 <= halfAB + 1e-7) {
      return {
        ok: false,
        reason: 'r2_too_small',
        S, A, B, r1, r2, alphaDeg,
        abLen: +abLen.toFixed(6),
        halfAB: +halfAB.toFixed(6),
        minR2: +halfAB.toFixed(6)
      };
    }
    const inter = intersectCircles(B, r2, A, r2);
    // Wähle den weiter vom Scheitel S entfernten Schnittpunkt C in Richtung Winkelmitte
    const midDeg = startDeg + alphaDeg / 2;
    const midDir = polarPt({ x: 0, y: 0 }, 1, midDeg);
    const [c1, c2] = inter.points;
    const C = dot(sub(c1, S), midDir) >= dot(sub(c2, S), midDir) ? c1 : c2;
    const halfAngle1 = angleVectorsDeg(sub(B, S), sub(C, S));
    const halfAngle2 = angleVectorsDeg(sub(A, S), sub(C, S));
    return {
      ok: true,
      S, A, B, C,
      r1: +r1.toFixed(6),
      r2: +r2.toFixed(6),
      alphaDeg: +alphaDeg.toFixed(6),
      halfAlphaDeg: +(alphaDeg / 2).toFixed(6),
      measuredHalf1: +halfAngle1.toFixed(6),
      measuredHalf2: +halfAngle2.toFixed(6),
      abLen: +abLen.toFixed(6),
      halfAB: +halfAB.toFixed(6),
      distSC: +dist(S, C).toFixed(6)
    };
  }

  // ================================================================ 6. Teilen einer Strecke (Strahlensatz)
  // Gegeben: Strecke AB soll in n gleiche Teile geteilt werden (im Buch: n = 5).
  // 1. Strahl von A unter beliebigem Winkel β (im Buch nach rechts-unten).
  // 2. Auf dem Strahl von A aus mit dem Zirkel n beliebige, aber gleich große Teile (Schrittweite s) abtragen -> 1', 2', ..., n'.
  // 3. Endpunkt n' mit B verbinden.
  // 4. Parallelen zu n'B durch die anderen Teilpunkte 1'...(n-1)' ziehen -> Teilpunkte 1..n auf AB.
  function constructDivideSegment(A, B, n = 5, rayAngleDeg = -32, stepLen = 30) {
    const count = Math.max(2, Math.min(20, Math.round(n)));
    const abLen = dist(A, B);
    if (abLen < 1e-6 || stepLen <= 0) return { ok: false, reason: 'invalid_geometry' };
    const lineDeg = angleBetween(A, B);
    const absRayDeg = lineDeg + rayAngleDeg;
    const rayPts = []; // 1' .. n'
    const divPts = []; // 1 .. n (wobei n = B)
    for (let k = 1; k <= count; k++) {
      rayPts.push({
        k,
        label: `${k}′`,
        pt: polarPt(A, k * stepLen, absRayDeg),
        distFromA: +(k * stepLen).toFixed(6)
      });
      divPts.push({
        k,
        label: String(k),
        pt: lerp(A, B, k / count),
        distFromA: +(abLen * k / count).toFixed(6),
        ratio: +(k / count).toFixed(6)
      });
    }
    const endRay = rayPts[count - 1].pt;
    const parallelAngleDeg = angleBetween(endRay, B);
    const partLen = abLen / count;
    return {
      ok: true,
      A, B,
      n: count,
      abLen: +abLen.toFixed(6),
      partLen: +partLen.toFixed(6),
      stepLen: +stepLen.toFixed(6),
      totalRayLen: +(count * stepLen).toFixed(6),
      rayAngleDeg: + Math.abs(rayAngleDeg).toFixed(6),
      parallelLen: +dist(endRay, B).toFixed(6),
      parallelAngleDeg: +parallelAngleDeg.toFixed(6),
      rayPts,
      divPts
    };
  }

  const Core = {
    MINUS, fmt, parseNum,
    pt, add, sub, scale, dot, cross, len, dist, mid, lerp, unit, perp,
    normDeg, polarPt, angleBetween, angleVectorsDeg,
    projectPointOnLine, intersectCircles, intersectCircleLine,
    constructParallel, constructBisector, constructDropPerp,
    constructErectPerp, constructAngleBisector, constructDivideSegment
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = Core;
  else root.Core = Core;
})(this);
