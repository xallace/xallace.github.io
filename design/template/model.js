/* Model: pure functions, no DOM. Loaded as a classic script in the browser (window.AppModel)
   and with require() in tests/verify.mjs. Keep all maths here so the tests cover it.
   Template example: bolt circle (pitch circle) geometry. Replace with your app's model. */
(function (root) {
  'use strict';

  const DEG = Math.PI / 180;

  /** Hole centres on a pitch circle. D = pitch circle diameter, n = holes, startDeg = angle of hole 1. */
  function holeCentres(D, n, startDeg) {
    const r = D / 2;
    const out = [];
    for (let i = 0; i < n; i++) {
      const a = (startDeg + (360 * i) / n) * DEG;
      out.push({ i: i + 1, angleDeg: startDeg + (360 * i) / n, x: r * Math.cos(a), y: r * Math.sin(a) });
    }
    return out;
  }

  /** Straight distance between neighbouring hole centres: s = D · sin(π / n). */
  function chord(D, n) {
    return D * Math.sin(Math.PI / n);
  }

  /** Full evaluation for the UI: geometry plus two pass/fail checks (pure geometry, no standard). */
  function evaluate(p) {
    const s = chord(p.D, p.n);
    const ligament = s - p.d;                       // material left between two holes
    const edge = (p.Da - p.D) / 2 - p.d / 2;        // material left between hole and outer edge
    return {
      chord: s,
      ligament,
      edge,
      holesClear: ligament > 0,
      edgeClear: edge > 0,
      centres: holeCentres(p.D, p.n, p.startDeg)
    };
  }

  const api = { holeCentres, chord, evaluate };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.AppModel = api;
})(this);
