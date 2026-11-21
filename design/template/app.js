/* UI and drawing. Colours come from the CSS tokens (never hard-code hex here), fonts in canvas
   are named directly ("Iosevka Charon Mono"), never VT323. Redraw on resize: xallace-type.js
   fires one resize after the webfonts have loaded. */
(function () {
  'use strict';
  const M = window.AppModel;
  const $ = id => document.getElementById(id);

  const PRESETS = [
    { D: 100, n: 6, d: 11, Da: 140, startDeg: 0 },
    { D: 180, n: 8, d: 18, Da: 230, startDeg: 22 },
    { D: 60, n: 12, d: 16, Da: 80, startDeg: 0 }
  ];
  const state = Object.assign({}, PRESETS[0]);
  const fmt = (v, dp = 2) => v.toFixed(dp).replace('-', '−');

  function token(name) { return getComputedStyle(document.documentElement).getPropertyValue(name).trim(); }

  /* ---------- tabs ---------- */
  document.querySelectorAll('.tab-btn').forEach(btn => btn.addEventListener('click', () => {
    document.querySelectorAll('.tab-btn').forEach(b => { b.classList.toggle('active', b === btn); b.setAttribute('aria-selected', b === btn); });
    document.querySelectorAll('.view').forEach(v => v.classList.toggle('active', v.id === 'view-' + btn.dataset.view));
    draw();
  }));

  /* ---------- inputs ---------- */
  const inputs = { D: 'in-D', n: 'in-n', d: 'in-d', Da: 'in-Da', startDeg: 'in-a' };
  function syncInputs() { for (const k in inputs) $(inputs[k]).value = state[k]; }
  for (const k in inputs) $(inputs[k]).addEventListener('input', e => {
    state[k] = Number(e.target.value);
    document.querySelectorAll('.preset-btn').forEach(b => b.classList.remove('active'));
    update();
  });
  document.querySelectorAll('.preset-btn').forEach(btn => btn.addEventListener('click', () => {
    Object.assign(state, PRESETS[Number(btn.dataset.preset)]);
    document.querySelectorAll('.preset-btn').forEach(b => b.classList.toggle('active', b === btn));
    syncInputs(); update();
  }));
  $('opt-numbers').addEventListener('change', draw);

  /* ---------- readouts ---------- */
  function setVerdict(id, ok, value, sub) {
    const cell = $(id);
    cell.classList.toggle('pass', ok); cell.classList.toggle('fail', !ok);
    cell.querySelector('.v-value').textContent = value;
    cell.querySelector('.v-sub').textContent = sub;
  }
  function update() {
    const r = M.evaluate(state);
    $('o-D').textContent = fmt(state.D, 0) + ' mm';
    $('o-n').textContent = state.n;
    $('o-d').textContent = fmt(state.d, 1) + ' mm';
    $('o-Da').textContent = fmt(state.Da, 0) + ' mm';
    $('o-a').textContent = state.startDeg + '°';
    setVerdict('v-holes', r.holesClear, r.holesClear ? 'PASS' : 'FAIL', 'ligament s − d = ' + fmt(r.ligament) + ' mm');
    setVerdict('v-edge', r.edgeClear, r.edgeClear ? 'PASS' : 'FAIL', 'edge (Da − D − d)/2 = ' + fmt(r.edge) + ' mm');
    $('v-chord').querySelector('.v-value').textContent = fmt(r.chord) + ' mm';
    $('tbl').innerHTML = '<tr><th>#</th><td>angle</td><td>x</td><td>y</td></tr>' + r.centres.map(c =>
      `<tr><th>${c.i}</th><td>${fmt(c.angleDeg, 1)}°</td><td>${fmt(c.x, 3)}</td><td>${fmt(c.y, 3)}</td></tr>`).join('');
    draw();
  }

  /* ---------- drawing ---------- */
  function draw() {
    const cv = $('fig');
    if (!cv.offsetParent) return;                      // hidden view
    const dpr = window.devicePixelRatio || 1;
    const w = cv.clientWidth, h = cv.clientHeight;
    cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr);
    const g = cv.getContext('2d');
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    const C = {
      paper: token('--draw-paper'), grid: token('--draw-grid'), ink: token('--draw-ink'),
      soft: token('--draw-ink-soft'), dim: token('--draw-dim'), fill: token('--draw-part-fill'),
      accent: token('--accent'), fail: token('--st-fail')
    };
    g.fillStyle = C.paper; g.fillRect(0, 0, w, h);
    g.strokeStyle = C.grid; g.lineWidth = 1;
    for (let x = 0.5; x < w; x += 24) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, h); g.stroke(); }
    for (let y = 0.5; y < h; y += 24) { g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke(); }

    const r = M.evaluate(state);
    const k = (Math.min(w, h) - 56) / Math.max(state.Da, state.D + state.d);
    const cx = w / 2, cy = h / 2;
    const P = (x, y) => [cx + x * k, cy - y * k];

    // part
    g.beginPath(); g.arc(cx, cy, state.Da / 2 * k, 0, 2 * Math.PI);
    g.fillStyle = C.fill; g.fill(); g.strokeStyle = C.ink; g.lineWidth = 1.6; g.stroke();
    // centre lines and pitch circle (dash-dot)
    g.setLineDash([14, 3, 2, 3]); g.strokeStyle = C.dim; g.lineWidth = 1;
    const ext = state.Da / 2 * k + 14;
    g.beginPath(); g.moveTo(cx - ext, cy); g.lineTo(cx + ext, cy); g.moveTo(cx, cy - ext); g.lineTo(cx, cy + ext); g.stroke();
    g.beginPath(); g.arc(cx, cy, state.D / 2 * k, 0, 2 * Math.PI); g.stroke();
    g.setLineDash([]);
    // holes
    const showNo = $('opt-numbers').checked;
    g.font = '500 11px "Iosevka Charon Mono", ui-monospace, monospace';
    g.textAlign = 'center'; g.textBaseline = 'middle';
    r.centres.forEach(c => {
      const [x, y] = P(c.x, c.y);
      g.beginPath(); g.arc(x, y, state.d / 2 * k, 0, 2 * Math.PI);
      g.fillStyle = C.paper; g.fill();
      g.strokeStyle = r.holesClear && r.edgeClear ? C.ink : C.fail; g.lineWidth = 1.4; g.stroke();
      if (showNo) {
        const a = Math.atan2(c.y, c.x), off = state.d / 2 * k + 10;
        g.fillStyle = C.soft; g.fillText(String(c.i), x + Math.cos(a) * off, y - Math.sin(a) * off);
      }
    });
    // chord dimension between hole 1 and 2
    if (r.centres.length > 1) {
      const [x1, y1] = P(r.centres[0].x, r.centres[0].y), [x2, y2] = P(r.centres[1].x, r.centres[1].y);
      g.strokeStyle = C.accent; g.fillStyle = C.accent; g.lineWidth = 1.2;
      g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.stroke();
      const mx = (x1 + x2) / 2, my = (y1 + y2) / 2, nx = mx - cx, ny = my - cy, nl = Math.hypot(nx, ny) || 1;
      g.font = '600 12px "Iosevka Charon Mono", ui-monospace, monospace';
      const label = 's = ' + fmt(r.chord) + ' mm', tw = g.measureText(label).width;
      const lx = mx - nx / nl * 34, ly = my - ny / nl * 34;   // inside the pitch circle, on a paper patch
      g.fillStyle = C.paper; g.fillRect(lx - tw / 2 - 4, ly - 9, tw + 8, 18);
      g.fillStyle = C.accent; g.fillText(label, lx, ly);
    }
  }

  window.addEventListener('resize', draw);
  syncInputs();
  update();
})();
