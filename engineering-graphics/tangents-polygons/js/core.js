/* DOM-free geometric calculation core for Plate V:
   "Basic Geometric Constructions – Tangents, Circular Arcs, Polygons"
   1. Tangent through circle point P
   2. Tangent from an external point P to a circle (Thales' theorem)
   3. Corner fillet (rounding an angle with radius r)
   4. Connecting two circles with tangent arcs (inner fillet Ri, outer blend Ra)
   5. Regular polygon inscribed in a circle (e.g., pentagon, Bion's general construction)
   6. Hexagon and dodecagon inscribed in a circle
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

  function polarPt(c, r, deg) {
    const a = deg * DEG;
    return { x: c.x + r * Math.cos(a), y: c.y + r * Math.sin(a) };
  }

  function angleBetween(c, p) {
    return normDeg(Math.atan2(p.y - c.y, p.x - c.x) * RAD);
  }

  function angleVectorsDeg(u, v) {
    const lu = len(u), lv = len(v);
    if (lu < 1e-12 || lv < 1e-12) return 0;
    const c = Math.max(-1, Math.min(1, dot(u, v) / (lu * lv)));
    return +(Math.acos(c) * RAD).toFixed(8);
  }

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

  // Intersection points of two circles (c1, r1) and (c2, r2)
  function intersectCircles(c1, r1, c2, r2) {
    const dVec = sub(c2, c1);
    const d = len(dVec);
    if (d < 1e-10) return { ok: false, reason: 'concentric', d };
    if (d > r1 + r2 + 1e-9) return { ok: false, reason: 'too_far', d, maxD: r1 + r2 };
    if (d < Math.abs(r1 - r2) - 1e-9) return { ok: false, reason: 'nested', d, minD: Math.abs(r1 - r2) };

    const a = (r1 * r1 - r2 * r2 + d * d) / (2 * d);
    const h2 = r1 * r1 - a * a;
    const h = Math.sqrt(Math.max(0, h2));

    const u = scale(dVec, 1 / d);
    const pMid = add(c1, scale(u, a));
    const vPerp = perp(u);

    const pLeft = add(pMid, scale(vPerp, h));
    const pRight = sub(pMid, scale(vPerp, h));
    return { ok: true, d, a, h, points: [pLeft, pRight] };
  }

  // Intersection point of two lines (p1 -> p2) and (p3 -> p4)
  function intersectLines(p1, p2, p3, p4) {
    const d1 = sub(p2, p1);
    const d2 = sub(p4, p3);
    const denom = cross(d1, d2);
    if (Math.abs(denom) < 1e-10) return null;
    const num = cross(sub(p3, p1), d2);
    const t = num / denom;
    return add(p1, scale(d1, t));
  }

  // ================================================================ 1. Tangent through circle point P
  // Given: circle (M, R) and point P on the circle.
  // 1. Draw MP and extend it.
  // 2. Circle around P with radius r1 yields intersections A and B on line MP.
  // 3. Arcs around A and B with radius r2 > r1 yield intersections C and D.
  // 4. CD is perpendicular to PM (desired tangent).
  function constructTangentAtPoint(M, P, r1, r2) {
    const R = dist(M, P);
    if (R < 1e-6) return { ok: false, reason: 'p_equals_m' };
    const u = unit(sub(P, M));
    const extP = add(P, scale(u, r1 * 1.5)); // Ray extended past P

    if (r1 <= 0) return { ok: false, reason: 'r1_nonpositive' };
    const A = sub(P, scale(u, r1));
    const B = add(P, scale(u, r1));

    if (r2 <= r1 + 1e-7) {
      return {
        ok: false,
        stepFailed: 3,
        reason: 'r2_too_small',
        M, P, R, u, A, B, r1, r2,
        minR2: r1
      };
    }

    const inter = intersectCircles(A, r2, B, r2);
    const [C, D] = inter.points; // C left of line MP, D right
    const tangentDir = unit(sub(D, C));
    const perpAngle = angleVectorsDeg(u, tangentDir);

    return {
      ok: true,
      M, P, R: +R.toFixed(6),
      u, extP,
      A, B, C, D,
      r1: +r1.toFixed(6),
      r2: +r2.toFixed(6),
      halfAB: +r1.toFixed(6),
      heightCD: +inter.h.toFixed(6),
      perpAngleDeg: +perpAngle.toFixed(6),
      dotProduct: +(dot(u, tangentDir)).toFixed(6)
    };
  }

  // ================================================================ 2. Tangent from an external point P to the circle
  // Given: circle (M, R) and external point P.
  // 1. Bisect MP. A is the midpoint.
  // 2. Circle around A with radius r_A = |AM|. T is the tangent point.
  // 3. Connect T to P.
  // 4. MT is perpendicular to PT (Thales' theorem).
  function constructTangentFromPoint(M, R, P) {
    const d = dist(M, P);
    if (d <= R + 1e-6) {
      return {
        ok: false,
        reason: 'p_inside_or_on_circle',
        M, R, P, d,
        minDist: R
      };
    }

    // 1. Midpoint A of MP
    const A = mid(M, P);
    const rA = d / 2;

    // 2. Thales circle around A of radius rA intersects circle (M, R) at T1 (top) and T2 (bottom)
    const inter = intersectCircles(M, R, A, rA);
    const [T1, T2] = inter.points;

    // Tangent length L = sqrt(d^2 - R^2)
    const L = Math.sqrt(Math.max(0, d * d - R * R));
    const angleMTP1 = angleVectorsDeg(sub(T1, M), sub(P, T1));
    const angleMTP2 = angleVectorsDeg(sub(T2, M), sub(P, T2));
    const apexAngle = 2 * Math.asin(Math.min(1, R / d)) * RAD;

    return {
      ok: true,
      M, R: +R.toFixed(6),
      P, d: +d.toFixed(6),
      A, rA: +rA.toFixed(6),
      T1, T2,
      tangentLen: +L.toFixed(6),
      angleMTPDeg1: +angleMTP1.toFixed(6),
      angleMTPDeg2: +angleMTP2.toFixed(6),
      apexAngleDeg: +apexAngle.toFixed(6),
      halfApexDeg: +(apexAngle / 2).toFixed(6)
    };
  }

  // ================================================================ 3. Corner fillet (rounding an angle)
  // Given: vertex S, leg points A and B (angle ASB), fillet radius r.
  // 1. Draw parallels to AS and BS at distance r. Their intersection M is the arc center.
  // 2. Drop perpendiculars from M onto AS and BS -> tangent points C and D.
  // 3. Circular arc around M with radius r from C to D.
  function constructFilletCorner(S, A, B, r) {
    const uA = unit(sub(A, S));
    const uB = unit(sub(B, S));
    const alphaDeg = angleVectorsDeg(uA, uB);

    if (alphaDeg < 5 || alphaDeg > 175) {
      return { ok: false, reason: 'angle_extreme', alphaDeg };
    }
    if (r <= 0) return { ok: false, reason: 'radius_nonpositive' };

    // Inward normals
    // Cross product uA x uB determines orientation
    const orient = cross(uA, uB);
    const sign = orient >= 0 ? 1 : -1;
    const nA = scale(perp(uA), -sign);
    const nB = scale(perp(uB), sign);

    // Parallels at distance r
    const pA1 = add(S, scale(nA, r));
    const pA2 = add(A, scale(nA, r));
    const pB1 = add(S, scale(nB, r));
    const pB2 = add(B, scale(nB, r));

    // Intersection M of the parallels
    const M = intersectLines(pA1, pA2, pB1, pB2);
    if (!M) return { ok: false, reason: 'parallel_lines' };

    // Perpendiculars from M onto the legs
    const prA = projectPointOnLine(M, S, A);
    const prB = projectPointOnLine(M, S, B);
    const C = prA.foot;
    const D = prB.foot;

    const tanLen = r / Math.tan((alphaDeg / 2) * DEG);
    const centerDist = r / Math.sin((alphaDeg / 2) * DEG);
    const arcLen = r * (180 - alphaDeg) * DEG;

    return {
      ok: true,
      S, A, B, r: +r.toFixed(6),
      alphaDeg: +alphaDeg.toFixed(6),
      uA, uB, nA, nB,
      pA1, pA2, pB1, pB2,
      M, C, D,
      tanLen: +tanLen.toFixed(6),
      centerDist: +centerDist.toFixed(6),
      arcLen: +arcLen.toFixed(6),
      distMC: +dist(M, C).toFixed(6),
      distMD: +dist(M, D).toFixed(6),
      distSC: +dist(S, C).toFixed(6),
      distSD: +dist(S, D).toFixed(6)
    };
  }

  // ================================================================ 4. Connecting two circles with circular arcs
  // Given: circle 1 (M1, r1), circle 2 (M2, r2); inner radius Ri, outer radius Ra.
  // 1. Circle around M1 with Ri + r1.
  // 2. Circle around M2 with Ri + r2 -> intersection A.
  // 3. Connect A to M1 and M2 -> tangency points B and C for Ri.
  // 4. Circle around M1 with Ra - r1.
  // 5. Circle around M2 with Ra - r2 -> intersection D.
  // 6. Connect D through M1 and M2 and extend -> tangency points E and F for Ra.
  function constructTwoCircleBlend(M1, r1, M2, r2, Ri, Ra) {
    const a = dist(M1, M2);
    if (a < 1e-6) return { ok: false, reason: 'concentric_circles', a };

    // Inner radius Ri: arcs with R1 = Ri + r1, R2 = Ri + r2
    const R1i = Ri + r1;
    const R2i = Ri + r2;
    const interInner = intersectCircles(M1, R1i, M2, R2i);

    // Outer radius Ra: arcs with R1 = Ra - r1, R2 = Ra - r2
    if (Ra <= Math.max(r1, r2)) {
      return {
        ok: false,
        reason: 'ra_too_small_for_circles',
        minRa: Math.max(r1, r2),
        Ra, r1, r2
      };
    }
    const R1a = Ra - r1;
    const R2a = Ra - r2;
    const interOuter = intersectCircles(M1, R1a, M2, R2a);

    if (!interInner.ok) {
      return {
        ok: false,
        reason: 'inner_arcs_no_intersect',
        interInner, a, R1i, R2i
      };
    }
    if (!interOuter.ok) {
      return {
        ok: false,
        reason: 'outer_arcs_no_intersect',
        interOuter, a, R1a, R2a
      };
    }

    // A is the inner arc center (top)
    // D is the outer arc center (bottom)
    const A = interInner.points[0];
    const D = interOuter.points[1];

    // Tangency points for Ri:
    // B on circle 1: from A toward M1 at distance r1 from M1
    const uAM1 = unit(sub(M1, A));
    const B = add(M1, scale(uAM1, -r1)); // = A + scale(uAM1, Ri)

    // C on circle 2: from A toward M2 at distance r2 from M2
    const uAM2 = unit(sub(M2, A));
    const C = add(M2, scale(uAM2, -r2)); // = A + scale(uAM2, Ri)

    // Tangency points for Ra:
    // E on circle 1: from D through M1 extended by r1
    const uDM1 = unit(sub(M1, D));
    const E = add(M1, scale(uDM1, r1)); // = D + scale(uDM1, Ra)

    // F on circle 2: from D through M2 extended by r2
    const uDM2 = unit(sub(M2, D));
    const F = add(M2, scale(uDM2, r2)); // = D + scale(uDM2, Ra)

    return {
      ok: true,
      M1, r1: +r1.toFixed(6),
      M2, r2: +r2.toFixed(6),
      centerDist: +a.toFixed(6),
      Ri: +Ri.toFixed(6),
      Ra: +Ra.toFixed(6),
      R1i: +R1i.toFixed(6),
      R2i: +R2i.toFixed(6),
      R1a: +R1a.toFixed(6),
      R2a: +R2a.toFixed(6),
      A, B, C,
      D, E, F,
      distAB: +dist(A, B).toFixed(6),
      distAC: +dist(A, C).toFixed(6),
      distDE: +dist(D, E).toFixed(6),
      distDF: +dist(D, F).toFixed(6)
    };
  }

  // ================================================================ 5. Regular polygon inscribed in a circle (e.g. pentagon)
  // Given: circle of diameter d = 2R, vertical diameter AB (A bottom, B top).
  // 1. Divide AB into n equal parts (1..n-1).
  // 2. Strike arc of radius AB = 2R around A -> pole points C and D on horizontal axis.
  //    Exact distance: x = ± R * sqrt(3).
  // 3. Connect C and D through odd division points (for odd n), or even division points (for even n).
  //    Intersections with the circle give the polygon vertices.
  function constructRegularPolygonApprox(M, R, n = 5) {
    if (R <= 0 || n < 3 || n > 12) return { ok: false, reason: 'invalid_params' };
    const d = 2 * R;

    // In SVG: y points downward. B is top (M.y - R), A is bottom (M.y + R).
    const A = { x: M.x, y: M.y + R };
    const B = { x: M.x, y: M.y - R };

    // 1. Division points along AB (k = 0..n: k=0 is A bottom, k=n is B top)
    const divisionPoints = [];
    for (let k = 0; k <= n; k++) {
      divisionPoints.push({
        num: k,
        pt: lerp(A, B, k / n)
      });
    }

    // 2. Pole points C and D: arc of radius 2R around A cuts horizontal axis through M
    const poleDist = R * Math.sqrt(3);
    const C = { x: M.x - poleDist, y: M.y };
    const D = { x: M.x + poleDist, y: M.y };

    function rayCircleIntersect(Pk) {
      const Y = Pk.y - M.y;
      const a = 3 * R * R + Y * Y;
      const discr = 4 * R * R * (3 * R * R - 2 * Y * Y);
      const t = (6 * R * R + Math.sqrt(Math.max(0, discr))) / (2 * a);
      const dx = poleDist * (t - 1);
      const dy = t * Y;
      return {
        ptRight: { x: M.x + dx, y: M.y + dy },
        ptLeft: { x: M.x - dx, y: M.y + dy }
      };
    }

    const constructedVertices = [];
    const rays = [];

    if (n % 2 === 1) {
      // Odd polygon: B is the apex vertex
      constructedVertices.push({ idx: 0, pt: B, label: 'B' });

      const oddIndices = [];
      for (let k = n - 2; k >= 1; k -= 2) oddIndices.push(k);

      const rightPts = [];
      const leftPts = [];

      for (const k of oddIndices) {
        const Pk = divisionPoints[k].pt;
        const { ptRight, ptLeft } = rayCircleIntersect(Pk);

        rightPts.push({ pt: ptRight, k, from: C });
        leftPts.unshift({ pt: ptLeft, k, from: D });

        rays.push({ from: C, through: Pk, to: ptRight, k });
        rays.push({ from: D, through: Pk, to: ptLeft, k });
      }

      for (const r of rightPts) constructedVertices.push({ idx: constructedVertices.length, pt: r.pt, k: r.k });
      for (const l of leftPts) constructedVertices.push({ idx: constructedVertices.length, pt: l.pt, k: l.k });

    } else {
      // Even polygon: B (top) and A (bottom) are apex vertices
      constructedVertices.push({ idx: 0, pt: B, label: 'B' });

      const evenIndices = [];
      for (let k = n - 2; k >= 2; k -= 2) evenIndices.push(k);

      const rightPts = [];
      const leftPts = [];

      for (const k of evenIndices) {
        const Pk = divisionPoints[k].pt;
        const { ptRight, ptLeft } = rayCircleIntersect(Pk);

        rightPts.push({ pt: ptRight, k, from: C });
        leftPts.unshift({ pt: ptLeft, k, from: D });

        rays.push({ from: C, through: Pk, to: ptRight, k });
        rays.push({ from: D, through: Pk, to: ptLeft, k });
      }

      for (const r of rightPts) constructedVertices.push({ idx: constructedVertices.length, pt: r.pt, k: r.k });
      constructedVertices.push({ idx: constructedVertices.length, pt: A, label: 'A' });
      for (const l of leftPts) constructedVertices.push({ idx: constructedVertices.length, pt: l.pt, k: l.k });
    }

    // Mathematically exact vertices for comparison:
    const exactVertices = [];
    for (let i = 0; i < n; i++) {
      const a = -90 + (i * 360) / n;
      exactVertices.push(polarPt(M, R, a));
    }

    // Edge lengths and accuracy comparison
    const edgeLengths = [];
    let maxEdgeDev = 0;
    const exactEdgeLen = 2 * R * Math.sin(Math.PI / n);

    for (let i = 0; i < n; i++) {
      const p1 = constructedVertices[i].pt;
      const p2 = constructedVertices[(i + 1) % n].pt;
      const elen = dist(p1, p2);
      edgeLengths.push(+elen.toFixed(4));
      const dev = Math.abs(elen - exactEdgeLen);
      if (dev > maxEdgeDev) maxEdgeDev = dev;
    }

    return {
      ok: true,
      M, R: +R.toFixed(6),
      d: +d.toFixed(6),
      n, A, B, C, D,
      poleDist: +poleDist.toFixed(6),
      divisionPoints,
      rays,
      vertices: constructedVertices,
      exactVertices,
      exactEdgeLen: +exactEdgeLen.toFixed(4),
      edgeLengths,
      maxEdgeDev: +maxEdgeDev.toFixed(4),
      relAccuracyPct: +(100 * (1 - maxEdgeDev / exactEdgeLen)).toFixed(2)
    };
  }

  // ================================================================ 6. Hexagon and dodecagon inscribed in a circle
  // Given: circle with diameter d = 2r.
  // Hexagon:
  // 1. Arcs of radius r = d/2 around A.
  // 2. Arcs of radius r around B.
  // 3. Connecting lines form a regular hexagon (side length s = r).
  // Dodecagon:
  // Additional centers at C and D (horizontal axis endpoints).
  function constructHexagonDodecagon(M, R, mode = 'hexagon') {
    if (R <= 0) return { ok: false, reason: 'radius_nonpositive' };
    const d = 2 * R;

    // A top (-90°), B bottom (+90°)
    const A = { x: M.x, y: M.y - R }; // 270° or -90° (top)
    const B = { x: M.x, y: M.y + R }; // 90° (bottom)
    const C = { x: M.x - R, y: M.y }; // 180° (left)
    const D = { x: M.x + R, y: M.y }; // 0° (right)

    // Arcs around A with radius R cut circle at 30° and 150° from top (±60°):
    // Standard angles: A is at -90°. -90° ± 60° = -150° (210°) and -30° (330°).
    const pA1 = polarPt(M, R, -30);
    const pA2 = polarPt(M, R, -150);

    // Arcs around B with radius R cut circle at 90° ± 60° = 30° and 150°:
    const pB1 = polarPt(M, R, 30);
    const pB2 = polarPt(M, R, 150);

    // The 6 hexagon vertices clockwise from A (top):
    // A (-90°), pA1 (-30°), pB1 (30°), B (90°), pB2 (150°), pA2 (210°)
    const hexVertices = [A, pA1, pB1, B, pB2, pA2];

    // Additional compass centers for dodecagon at C (-180°) and D (0°):
    // Arcs around D (0°) cut circle at 0° ± 60° = -60° and +60°.
    // Arcs around C (180°) cut circle at 180° ± 60° = 120° and 240°.
    const pD1 = polarPt(M, R, -60);
    const pD2 = polarPt(M, R, 60);
    const pC1 = polarPt(M, R, 120);
    const pC2 = polarPt(M, R, 240);

    // 12 vertices every 30° from A (-90°):
    // -90°, -60°, -30°, 0° (D), 30°, 60°, 90° (B), 120°, 150°, 180° (C), 210°, 240°
    const dodecaVertices = [
      A, pD1, pA1, D, pB1, pD2, B, pC1, pB2, C, pA2, pC2
    ];

    // Mechanical engineering metrics:
    // Hexagon: across-flats width AF (SW) = 2 * r_i = 2 * R * cos(30°) = R * sqrt(3) = d * sqrt(3) / 2
    const swHex = d * (Math.sqrt(3) / 2);
    const sHex = R; // Side length s = R
    const rInHex = R * (Math.sqrt(3) / 2);

    // Dodecagon: side length s12 = 2 * R * sin(15°) = R * sqrt(2 - sqrt(3))
    const sDodeca = 2 * R * Math.sin(15 * DEG);
    const rInDodeca = R * Math.cos(15 * DEG);

    return {
      ok: true,
      M, R: +R.toFixed(6),
      d: +d.toFixed(6),
      mode,
      A, B, C, D,
      pA1, pA2, pB1, pB2,
      pD1, pD2, pC1, pC2,
      hexVertices,
      dodecaVertices,
      sHex: +sHex.toFixed(4),
      swHex: +swHex.toFixed(4),
      rInHex: +rInHex.toFixed(4),
      sDodeca: +sDodeca.toFixed(4),
      rInDodeca: +rInDodeca.toFixed(4)
    };
  }

  const api = {
    DEG, RAD, MINUS, THIN,
    fmt, parseNum,
    pt, add, sub, scale, dot, cross, len, dist, mid, lerp, unit, perp, normDeg, polarPt,
    angleBetween, angleVectorsDeg, projectPointOnLine, intersectCircles, intersectLines,
    constructTangentAtPoint,
    constructTangentFromPoint,
    constructFilletCorner,
    constructTwoCircleBlend,
    constructRegularPolygonApprox,
    constructHexagonDodecagon
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  } else {
    root.Core = api;
  }
})(typeof globalThis !== 'undefined' ? globalThis : this);
