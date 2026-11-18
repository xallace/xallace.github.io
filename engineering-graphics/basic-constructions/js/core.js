/* DOM-free geometric calculation core for Plate IV:
   "Basic Geometric Constructions – Segments, Perpendiculars, Angles"
   1. Parallel line to a line segment
   2. Bisecting a line segment (perpendicular bisector)
   3. Dropping a perpendicular
   4. Erecting a perpendicular at point P (60° arcs / Thales' theorem)
   5. Bisecting an angle (angle bisector)
   6. Dividing a line segment into n equal parts (intercept theorem)
   Runs in the browser (window.Core) and in Node (module.exports) for tests/verify.js. */
(function (root) {
  'use strict';

  const MINUS = '−';
  const THIN = ' ';
  const DEG = Math.PI / 180;
  const RAD = 180 / Math.PI;

  // Format number: English decimal point, true minus sign, trailing zeros trimmed by default.
  function fmt(v, dec = 1, opts = {}) {
    if (!isFinite(v)) return '–';
    if (Math.abs(v) < 0.5 * Math.pow(10, -dec)) v = 0;
    let s = Math.abs(v).toFixed(dec);
    if (!opts.keepZeros && s.includes('.')) s = s.replace(/0+$/, '').replace(/\.$/, '');
    let [int, frac] = s.split('.');
    if (opts.group && int.length > 4) int = int.replace(/\B(?=(\d{3})+(?!\d))/g, THIN);
    s = frac ? int + '.' + frac : int;
    const sign = v < 0 && !opts.noMinus ? MINUS : (v > 0 && opts.plus ? '+' : '');
    return sign + s;
  }

  function parseNum(str) {
    const s = String(str).trim().replace(/[−–]/g, '-').replace(/[°%\s]|mm/g, '').replace(',', '.');
    if (s === '' || !/^[-+]?(\d+\.?\d*|\.\d+)$/.test(s)) return NaN;
    return Number(s);
  }

  // ================================================================ Euclidean 2D Vector Geometry
  // Mathematical coordinate system (x right, y up) or screen coordinates:
  // All purely metric quantities (distances, division ratios, orthogonality) are coordinate-independent.
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

  // +90° counterclockwise rotation in mathematical coordinates: (-y, x)
  function perp(v) { return { x: -v.y, y: v.x }; }

  function normDeg(deg) {
    const d = ((deg % 360) + 360) % 360;
    return Math.abs(d - 360) < 1e-9 || Math.abs(d) < 1e-9 ? 0 : +d.toFixed(8);
  }

  // Point at distance r from c in direction deg (math convention: 0° right, +90° up)
  function polarPt(c, r, deg) {
    const a = deg * DEG;
    return { x: c.x + r * Math.cos(a), y: c.y + r * Math.sin(a) };
  }

  // Angle from c to p in degrees [0, 360) in math convention (y up)
  function angleBetween(c, p) {
    return normDeg(Math.atan2(p.y - c.y, p.x - c.x) * RAD);
  }

  // Smallest undirected angle between vectors u and v in degrees [0, 180]
  function angleVectorsDeg(u, v) {
    const lu = len(u), lv = len(v);
    if (lu < 1e-12 || lv < 1e-12) return 0;
    const c = Math.max(-1, Math.min(1, dot(u, v) / (lu * lv)));
    return +(Math.acos(c) * RAD).toFixed(8);
  }

  // Orthogonal projection of P onto the line through A and B
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

  // Intersection points of two circles (c1, r1) and (c2, r2).
  // Returns { ok, reason, d, points: [pLeft, pRight] } relative to the directed vector c1 -> c2.
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
    const n = perp(u); // left of c1 -> c2 (math convention: +y when c1->c2 is horizontal)
    const base = add(c1, scale(u, a));
    const p1 = add(base, scale(n, h));
    const p2 = sub(base, scale(n, h));
    return { ok: h > 1e-7, tangent: h <= 1e-7, reason: h > 1e-7 ? 'two_points' : 'tangent', d, a, h, base, points: [p1, p2] };
  }

  // Intersection points of circle (center, r) with the line through A and B.
  // The two intersections are ordered along direction A -> B (t1 <= t2).
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

  // ================================================================ 1. Parallel line to a line segment
  // Given: segment AB and point P on the desired parallel line g'.
  // 1. Arc of radius r around A gives intersection C (on AB).
  //    In the single-radius variant, r = |AP| so arc 1 passes through P and C (rhombus ACDP).
  //    If a custom radius r >= dist(P, AB) is supplied, this generalizes to a parallelogram/rhombus construction:
  //    With the default setting (r == null), r = |AP|.
  // 2. Arc of radius r around P.
  // 3. Arc of radius r around C gives intersection D.
  // 4. Line PD is the parallel line g' to AB.
  function constructParallel(A, B, P, rCustom = null) {
    const abLen = dist(A, B);
    const u = unit(sub(B, A));
    const pr = projectPointOnLine(P, A, B);
    const r = rCustom != null ? +rCustom : dist(A, P);
    if (r < pr.dist - 1e-7 || r <= 0) {
      return { ok: false, reason: 'radius_too_small', minRadius: pr.dist, distH: pr.dist };
    }
    // 1. Intersection C on ray A -> B at distance r from A
    const C = add(A, scale(u, r));
    // When r == |AP|: P, A, C, D form a rhombus of side r, and D = P + (C - A).
    // For arbitrary r: arc 1 of radius r around A -> C; if r != |AP|, arc 2 (radius |AP| or r)...
    // To keep steps 1..3 working with a single compass radius r, the standard construction uses r = |AP|.
    // When rCustom is set, we intersect circle (P, r) with circle (C, r).
    const inter = intersectCircles(P, r, C, r);
    if (!inter.ok && !inter.tangent) {
      return { ok: false, reason: 'arcs_do_not_meet', r, C, distH: pr.dist };
    }
    // Select intersection D so that PD points in the direction of AB (dot(D - P, u) > 0)
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

  // ================================================================ 2. Bisecting a line segment (perpendicular bisector)
  // Given: segment AB.
  // 1. Arc 1 of radius r around A; r > 1/2 AB.
  // 2. Arc 2 of the same radius r around B (gives intersections S1 and S2).
  // 3. Line S1-S2 is the perpendicular bisector dividing segment AB at midpoint M.
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
    const [S1, S2] = inter.points; // S1 above (left of A->B), S2 below
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

  // ================================================================ 3. Dropping a perpendicular (from point P to line g)
  // Given: line g (through G1, G2) and point P.
  // 1. Arbitrary arc 1 (radius r1) around P gives intersections A and B on g.
  // 2. Arc 2 of radius r2 around A; r2 > 1/2 AB.
  // 3. Arc 3 of the same radius r2 around B (intersection C).
  // 4. Line connecting intersection C and P is the desired perpendicular (foot F on g).
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
    // Choose C on the opposite side of line g from P
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

  // ================================================================ 4. Erecting a perpendicular at point P
  // Given: line g and point P on g.
  // 1. Arc 1 around P with arbitrary radius r gives intersection A on g.
  // 2. Arc 2 of the same radius r around A gives intersection B on arc 1 (equilateral triangle PAB, 60°).
  // 3. Arc 3 of the same radius r around B.
  // 4. Connect A and B and extend the line (intersection C on arc 3, |BC| = r, Thales circle around B).
  // 5. Connect point C to point P (perpendicular at P, |PC| = r * sqrt(3)).
  function constructErectPerp(P, lineDeg = 0, r = 100, side = 'left', up = 1) {
    if (r <= 0) return { ok: false, reason: 'invalid_radius' };
    // Default side places A to the left of P on horizontal line g (side === 'left' -> direction lineDeg + 180°)
    const dirA = side === 'left' ? lineDeg + 180 : lineDeg;
    const A = polarPt(P, r, dirA);
    // B forms an equilateral triangle with P and A (60° from PA into the upper half-plane):
    // When A lies left of P (180°), B lies at 120° from P (i.e., 60° from A).
    const sign = (side === 'left' ? -1 : 1) * (up >= 0 ? 1 : -1);
    const degBFromP = dirA + sign * 60;
    const B = polarPt(P, r, degBFromP);
    // 4. Extending ray A -> B past B by r yields C on arc 3 around B:
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

  // ================================================================ 5. Bisecting an angle
  // Given: angle α at vertex S (between leg 1 at startDeg and leg 2 at startDeg + alphaDeg).
  // 1. Arbitrary arc 1 (radius r1) around S gives intersections A and B.
  // 2. Arc 2 of radius r2 around A; r2 > 1/2 AB.
  // 3. Arc 3 of the same radius r2 around B gives intersection C.
  // 4. Line SC is the desired angle bisector (divides α into α/2 and α/2).
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
    // Choose the intersection C farther from vertex S along the angle midpoint direction
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

  // ================================================================ 6. Dividing a line segment (intercept theorem)
  // Given: segment AB to be divided into n equal parts (default: n = 5).
  // 1. Ray from A at an arbitrary angle β (drawn down-right by default).
  // 2. Step off n arbitrary but equal intervals (step length s) along the ray from A -> 1', 2', ..., n'.
  // 3. Connect endpoint n' to B.
  // 4. Draw parallels to n'B through the other division points 1'...(n-1)' -> division points 1..n on AB.
  function constructDivideSegment(A, B, n = 5, rayAngleDeg = -32, stepLen = 30) {
    const count = Math.max(2, Math.min(20, Math.round(n)));
    const abLen = dist(A, B);
    if (abLen < 1e-6 || stepLen <= 0) return { ok: false, reason: 'invalid_geometry' };
    const lineDeg = angleBetween(A, B);
    const absRayDeg = lineDeg + rayAngleDeg;
    const rayPts = []; // 1' .. n'
    const divPts = []; // 1 .. n (where n = B)
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
