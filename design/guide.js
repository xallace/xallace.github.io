/* Style guide: tabs, accent switch, live token swatches, demo drawing. */
(function () {
  'use strict';
  const root = document.documentElement;
  const token = n => getComputedStyle(root).getPropertyValue(n).trim();
  const GROUPS = {
    'Surfaces': ['--bg-app', '--bg-panel', '--bg-card-solid', '--bg-glass', '--bg-hover'],
    'Text': ['--text-main', '--text-muted', '--text-dim', '--on-accent'],
    'Lines': ['--border', '--border-soft', '--border-strong'],
    'Accent (this app)': ['--accent', '--accent-soft', '--accent-line'],
    'The five accents': ['--ac-vermilion', '--ac-slate', '--ac-emerald', '--ac-cyan', '--ac-ochre'],
    'Status (fixed)': ['--st-ok', '--st-fail', '--st-warn', '--st-info', '--ok-bg', '--fail-bg', '--warn-bg', '--info-bg'],
    'Drawing': ['--draw-paper', '--draw-grid', '--draw-ink', '--draw-ink-soft', '--draw-dim', '--draw-part-fill']
  };

  function swatches() {
    const host = document.getElementById('swatches');
    host.innerHTML = Object.entries(GROUPS).map(([g, names]) =>
      `<div class="swatch-group"><div class="section-label">${g}</div>` + names.map(n => {
        const v = token(n);
        return `<div class="swatch"><span class="swatch-chip" style="background:${v}"></span><span><span class="swatch-name">${n}</span><span class="swatch-val">${v}</span></span></div>`;
      }).join('') + '</div>').join('');
  }

  document.querySelectorAll('.tab-btn').forEach(btn => btn.addEventListener('click', () => {
    document.querySelectorAll('.tab-btn').forEach(b => { b.classList.toggle('active', b === btn); b.setAttribute('aria-selected', b === btn); });
    document.querySelectorAll('.view').forEach(v => v.classList.toggle('active', v.id === 'view-' + btn.dataset.view));
    draw();
  }));
  document.querySelectorAll('#accent-pick .preset-btn').forEach(btn => btn.addEventListener('click', () => {
    root.dataset.accent = btn.dataset.accent;
    document.querySelectorAll('#accent-pick .preset-btn').forEach(b => b.classList.toggle('active', b === btn));
    swatches(); draw();
  }));

  function draw() {
    const cv = document.getElementById('demo-fig');
    if (!cv || !cv.offsetParent) return;
    const dpr = window.devicePixelRatio || 1, w = cv.clientWidth, h = cv.clientHeight;
    cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr);
    const g = cv.getContext('2d'); g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.fillStyle = token('--draw-paper'); g.fillRect(0, 0, w, h);
    g.strokeStyle = token('--draw-grid'); g.lineWidth = 1;
    for (let x = 0.5; x < w; x += 24) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, h); g.stroke(); }
    for (let y = 0.5; y < h; y += 24) { g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke(); }
    const cx = w / 2, cy = h / 2, R = Math.min(w, h) * 0.36;
    g.beginPath(); g.arc(cx, cy, R, 0, 2 * Math.PI); g.fillStyle = token('--draw-part-fill'); g.fill();
    g.strokeStyle = token('--draw-ink'); g.lineWidth = 1.6; g.stroke();
    g.setLineDash([14, 3, 2, 3]); g.strokeStyle = token('--draw-dim'); g.lineWidth = 1;
    g.beginPath(); g.moveTo(cx - R - 16, cy); g.lineTo(cx + R + 16, cy); g.moveTo(cx, cy - R - 16); g.lineTo(cx, cy + R + 16); g.stroke();
    g.beginPath(); g.arc(cx, cy, R * 0.68, 0, 2 * Math.PI); g.stroke(); g.setLineDash([]);
    for (let i = 0; i < 6; i++) {
      const a = i * Math.PI / 3;
      g.beginPath(); g.arc(cx + Math.cos(a) * R * 0.68, cy - Math.sin(a) * R * 0.68, R * 0.11, 0, 2 * Math.PI);
      g.fillStyle = token('--draw-paper'); g.fill(); g.strokeStyle = token('--draw-ink'); g.lineWidth = 1.4; g.stroke();
    }
    const x1 = cx + R * 0.68, x2 = cx + Math.cos(Math.PI / 3) * R * 0.68, y2 = cy - Math.sin(Math.PI / 3) * R * 0.68;
    g.strokeStyle = token('--accent'); g.fillStyle = token('--accent'); g.lineWidth = 1.2;
    g.beginPath(); g.moveTo(x1, cy); g.lineTo(x2, y2); g.stroke();
    g.font = '600 12px "Iosevka Charon Mono", ui-monospace, monospace'; g.textAlign = 'left'; g.textBaseline = 'middle';
    g.fillText('accent: dimension', (x1 + x2) / 2 + 14, (cy + y2) / 2 - 8);
    g.fillStyle = token('--draw-ink-soft'); g.font = '500 11px "Iosevka Charon Mono", ui-monospace, monospace';
    g.fillText('ink-soft: label · dim: centre lines', 12, h - 14);
  }

  window.addEventListener('resize', draw);
  swatches();
})();
