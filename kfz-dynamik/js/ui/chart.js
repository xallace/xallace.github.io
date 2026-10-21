/* KChart – kleine Canvas-Diagrammkomponente für die Buchdiagramme.
   Linien und Punkte, lineare/logarithmische Achsen, optionale rechte y-Achse,
   Annotationen (Linien, Punkte, Flächen, Text), Fadenkreuz mit Werten, Legende zum Ausblenden. */
(function (root) {
  'use strict';

  const fmtNum = (v, digits) => {
    if (!isFinite(v)) return '–';
    const a = Math.abs(v);
    const d = digits !== undefined ? digits : a >= 1000 ? 0 : a >= 100 ? 1 : a >= 10 ? 2 : a >= 1 ? 2 : a >= 0.01 ? 3 : 4;
    return v.toLocaleString('de-DE', { minimumFractionDigits: 0, maximumFractionDigits: d });
  };

  function niceStep(span, target) {
    const raw = span / Math.max(target, 1);
    const mag = Math.pow(10, Math.floor(Math.log10(raw)));
    const n = raw / mag;
    return (n < 1.5 ? 1 : n < 3 ? 2 : n < 7 ? 5 : 10) * mag;
  }

  function linTicks(min, max, target) {
    const step = niceStep(max - min, target);
    const out = [];
    for (let v = Math.ceil(min / step - 1e-9) * step; v <= max + step * 1e-9; v += step) out.push(Math.abs(v) < step * 1e-9 ? 0 : v);
    return { ticks: out, step };
  }

  function logTicks(min, max) {
    const out = [];
    for (let e = Math.floor(Math.log10(min)); e <= Math.ceil(Math.log10(max)); e++) {
      for (const m of [1, 2, 5]) {
        const v = m * Math.pow(10, e);
        if (v >= min * 0.999 && v <= max * 1.001) out.push(v);
      }
    }
    return { ticks: out, step: null };
  }

  function cssVar(name, fallback) {
    const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    return v || fallback;
  }

  class KChart {
    constructor(container, opts = {}) {
      this.opts = Object.assign({ height: 300, xLabel: '', yLabel: '', y2Label: '', xLog: false, yLog: false,
        hover: 'x', legend: true, pad: 0.05, aspect: null }, opts);
      this.series = [];
      this.annotations = [];
      this.hidden = new Set();
      this.container = container;
      container.classList.add('kchart');
      this.wrap = document.createElement('div');
      this.wrap.className = 'kchart-canvas-wrap';
      this.canvas = document.createElement('canvas');
      this.wrap.appendChild(this.canvas);
      this.tip = document.createElement('div');
      this.tip.className = 'kchart-tip';
      this.wrap.appendChild(this.tip);
      container.appendChild(this.wrap);
      if (this.opts.legend) {
        this.legendEl = document.createElement('div');
        this.legendEl.className = 'kchart-legend';
        container.appendChild(this.legendEl);
      }
      this.mouse = null;
      this.canvas.addEventListener('mousemove', (e) => { this.mouse = this._local(e); this.draw(); });
      this.canvas.addEventListener('mouseleave', () => { this.mouse = null; this.draw(); });
      this.canvas.addEventListener('touchmove', (e) => { this.mouse = this._local(e.touches[0]); this.draw(); }, { passive: true });
      this.canvas.addEventListener('touchend', () => { this.mouse = null; this.draw(); });
      this.ro = new ResizeObserver(() => this.draw());
      this.ro.observe(this.wrap);
    }

    _local(e) {
      const r = this.canvas.getBoundingClientRect();
      return { x: e.clientX - r.left, y: e.clientY - r.top };
    }

    setOptions(o) { Object.assign(this.opts, o); this.draw(); }

    set(series, annotations = []) {
      this.series = series;
      this.annotations = annotations;
      this._legend();
      this.draw();
    }

    _legend() {
      if (!this.legendEl) return;
      this.legendEl.innerHTML = '';
      this.series.filter((s) => s.name && !s.noLegend).forEach((s) => {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'kchart-leg' + (this.hidden.has(s.name) ? ' off' : '');
        const sw = document.createElement('span');
        sw.className = 'sw' + (s.dash ? ' dash' : '') + (s.points && !s.line ? ' dot' : '');
        sw.style.setProperty('--c', s.color);
        b.appendChild(sw);
        b.appendChild(document.createTextNode(s.name));
        b.addEventListener('click', () => {
          if (this.hidden.has(s.name)) this.hidden.delete(s.name); else this.hidden.add(s.name);
          this._legend(); this.draw();
        });
        this.legendEl.appendChild(b);
      });
    }

    _range(axis) {
      const o = this.opts;
      const key = axis === 'x' ? 'x' : 'y';
      const isLog = axis === 'x' ? o.xLog : axis === 'y' ? o.yLog : false;
      let lo = Infinity, hi = -Infinity;
      for (const s of this.series) {
        if (this.hidden.has(s.name)) continue;
        if (axis !== 'x' && (s.axis === 'right') !== (axis === 'y2')) continue;
        const arr = s[key];
        for (let i = 0; i < arr.length; i++) {
          const v = arr[i];
          if (!isFinite(v) || (isLog && v <= 0)) continue;
          if (v < lo) lo = v; if (v > hi) hi = v;
        }
      }
      for (const a of this.annotations) {
        if (a.fit === false) continue;
        if (axis === 'x' && a.type === 'point') { lo = Math.min(lo, a.x); hi = Math.max(hi, a.x); }
        if (axis === 'y' && a.type === 'point' && a.axis !== 'right') { lo = Math.min(lo, a.y); hi = Math.max(hi, a.y); }
      }
      const pre = axis === 'x' ? 'x' : axis === 'y' ? 'y' : 'y2';
      if (o[pre + 'Min'] !== undefined) lo = o[pre + 'Min'];
      if (o[pre + 'Max'] !== undefined) hi = o[pre + 'Max'];
      if (!isFinite(lo) || !isFinite(hi)) { lo = isLog ? 1 : 0; hi = isLog ? 10 : 1; }
      if (hi === lo) { hi = lo + (Math.abs(lo) || 1); }
      if (isLog) return { lo, hi, log: true };
      const pad = (hi - lo) * o.pad;
      if (o[pre + 'Min'] === undefined) lo -= pad;
      if (o[pre + 'Max'] === undefined) hi += pad;
      if (o[pre + 'Min'] === undefined && lo < 0 && this.series.every((s) => s[key].every((v) => !(v < 0)))) lo = 0;
      return { lo, hi, log: false };
    }

    draw() {
      const W = this.wrap.clientWidth;
      if (!W) return;
      const H = this.opts.aspect ? Math.round(W * this.opts.aspect) : this.opts.height;
      const dpr = window.devicePixelRatio || 1;
      if (this.canvas.width !== Math.round(W * dpr) || this.canvas.height !== Math.round(H * dpr)) {
        this.canvas.width = Math.round(W * dpr); this.canvas.height = Math.round(H * dpr);
        this.canvas.style.width = W + 'px'; this.canvas.style.height = H + 'px';
      }
      const ctx = this.canvas.getContext('2d');
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);

      const col = {
        grid: cssVar('--chart-grid', 'rgba(255,255,255,0.07)'), axis: cssVar('--chart-axis', 'rgba(255,255,255,0.35)'),
        text: cssVar('--text-secondary', '#94a3b8'), strong: cssVar('--text-primary', '#e2e8f0'),
        cross: cssVar('--chart-cross', 'rgba(255,255,255,0.35)'),
      };
      const hasRight = this.series.some((s) => s.axis === 'right');
      const m = { l: 58, r: hasRight ? 58 : 16, t: 12, b: 40 };
      const pw = W - m.l - m.r, ph = H - m.t - m.b;
      const xr = this._range('x'), yr = this._range('y'), y2r = hasRight ? this._range('y2') : null;
      const map = (r, v, a, b) => {
        if (r.log) return a + (Math.log10(v) - Math.log10(r.lo)) / (Math.log10(r.hi) - Math.log10(r.lo)) * (b - a);
        return a + (v - r.lo) / (r.hi - r.lo) * (b - a);
      };
      const X = (v) => map(xr, v, m.l, m.l + pw);
      const Y = (v) => map(yr, v, m.t + ph, m.t);
      const Y2 = (v) => map(y2r, v, m.t + ph, m.t);
      const inv = (r, px, a, b) => {
        const t = (px - a) / (b - a);
        return r.log ? Math.pow(10, Math.log10(r.lo) + t * (Math.log10(r.hi) - Math.log10(r.lo))) : r.lo + t * (r.hi - r.lo);
      };
      this._geom = { X, Y, Y2, m, pw, ph };

      ctx.font = '11px ' + cssVar('--font-mono', 'monospace');
      // Gitter und Achsen
      const xt = xr.log ? logTicks(xr.lo, xr.hi) : linTicks(xr.lo, xr.hi, Math.max(3, Math.floor(pw / 80)));
      const yt = yr.log ? logTicks(yr.lo, yr.hi) : linTicks(yr.lo, yr.hi, Math.max(3, Math.floor(ph / 45)));
      ctx.strokeStyle = col.grid; ctx.lineWidth = 1;
      ctx.fillStyle = col.text;
      ctx.textAlign = 'center'; ctx.textBaseline = 'top';
      for (const v of xt.ticks) {
        const px = Math.round(X(v)) + 0.5;
        ctx.beginPath(); ctx.moveTo(px, m.t); ctx.lineTo(px, m.t + ph); ctx.stroke();
        ctx.fillText(fmtNum(v, xt.step ? Math.max(0, -Math.floor(Math.log10(xt.step) + 1e-9)) : undefined), px, m.t + ph + 6);
      }
      ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
      for (const v of yt.ticks) {
        const py = Math.round(Y(v)) + 0.5;
        ctx.beginPath(); ctx.moveTo(m.l, py); ctx.lineTo(m.l + pw, py); ctx.stroke();
        ctx.fillText(fmtNum(v, yt.step ? Math.max(0, -Math.floor(Math.log10(yt.step) + 1e-9)) : undefined), m.l - 6, py);
      }
      if (y2r) {
        const y2t = linTicks(y2r.lo, y2r.hi, Math.max(3, Math.floor(ph / 45)));
        ctx.textAlign = 'left';
        for (const v of y2t.ticks) ctx.fillText(fmtNum(v, Math.max(0, -Math.floor(Math.log10(y2t.step) + 1e-9))), m.l + pw + 6, Y2(v));
      }
      // Nulllinien betonen
      ctx.strokeStyle = col.axis;
      if (!yr.log && yr.lo < 0 && yr.hi > 0) { const py = Math.round(Y(0)) + 0.5; ctx.beginPath(); ctx.moveTo(m.l, py); ctx.lineTo(m.l + pw, py); ctx.stroke(); }
      if (!xr.log && xr.lo < 0 && xr.hi > 0) { const px = Math.round(X(0)) + 0.5; ctx.beginPath(); ctx.moveTo(px, m.t); ctx.lineTo(px, m.t + ph); ctx.stroke(); }
      ctx.strokeRect(m.l + 0.5, m.t + 0.5, pw, ph);

      // Achsbeschriftungen
      ctx.fillStyle = col.text; ctx.font = '12px ' + cssVar('--font-sans', 'sans-serif');
      ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
      ctx.fillText(this.opts.xLabel, m.l + pw / 2, H - 2);
      ctx.save(); ctx.translate(12, m.t + ph / 2); ctx.rotate(-Math.PI / 2); ctx.textBaseline = 'middle';
      ctx.fillText(this.opts.yLabel, 0, 0); ctx.restore();
      if (y2r && this.opts.y2Label) {
        ctx.save(); ctx.translate(W - 10, m.t + ph / 2); ctx.rotate(Math.PI / 2); ctx.textBaseline = 'middle';
        ctx.fillText(this.opts.y2Label, 0, 0); ctx.restore();
      }

      ctx.save();
      ctx.beginPath(); ctx.rect(m.l, m.t, pw, ph); ctx.clip();

      // Flächen-Annotationen zuerst
      for (const a of this.annotations) {
        if (a.type === 'poly') {
          ctx.fillStyle = a.color; ctx.beginPath();
          a.pts.forEach(([x, y], i) => (i ? ctx.lineTo(X(x), Y(y)) : ctx.moveTo(X(x), Y(y))));
          ctx.closePath(); ctx.fill();
        } else if (a.type === 'xband') {
          ctx.fillStyle = a.color; ctx.fillRect(X(a.x0), m.t, X(a.x1) - X(a.x0), ph);
        }
      }

      // Serien
      for (const s of this.series) {
        if (this.hidden.has(s.name)) continue;
        const Yf = s.axis === 'right' ? Y2 : Y;
        ctx.strokeStyle = s.color; ctx.fillStyle = s.color;
        ctx.lineWidth = s.width || 2;
        ctx.setLineDash(s.dash || []);
        if (s.line !== false) {
          ctx.beginPath();
          let pen = false;
          for (let i = 0; i < s.x.length; i++) {
            const xv = s.x[i], yv = s.y[i];
            if (!isFinite(xv) || !isFinite(yv) || (xr.log && xv <= 0) || (yr.log && yv <= 0)) { pen = false; continue; }
            const px = X(xv), py = Yf(yv);
            if (!pen) { ctx.moveTo(px, py); pen = true; } else ctx.lineTo(px, py);
          }
          ctx.stroke();
        }
        ctx.setLineDash([]);
        if (s.points) {
          for (let i = 0; i < s.x.length; i++) {
            if (!isFinite(s.x[i]) || !isFinite(s.y[i])) continue;
            ctx.beginPath(); ctx.arc(X(s.x[i]), Yf(s.y[i]), s.r || 3, 0, Math.PI * 2);
            if (s.hollow) ctx.stroke(); else ctx.fill();
          }
        }
      }

      // Linien- und Punkt-Annotationen
      ctx.font = '11px ' + cssVar('--font-sans', 'sans-serif');
      for (const a of this.annotations) {
        ctx.strokeStyle = a.color || col.axis; ctx.fillStyle = a.color || col.text;
        ctx.setLineDash(a.dash || [4, 4]); ctx.lineWidth = a.width || 1;
        if (a.type === 'vline') {
          const px = X(a.x); ctx.beginPath(); ctx.moveTo(px, m.t); ctx.lineTo(px, m.t + ph); ctx.stroke();
          if (a.label) {
            // Beschriftung links der Linie, wenn sie rechts aus dem Diagramm ragen würde
            const left = px + 4 + ctx.measureText(a.label).width > m.l + pw;
            ctx.setLineDash([]); ctx.textAlign = left ? 'right' : 'left'; ctx.textBaseline = 'top';
            ctx.fillText(a.label, px + (left ? -4 : 4), m.t + 4 + (a.row || 0) * 14);
          }
        } else if (a.type === 'hline') {
          const py = (a.axis === 'right' ? Y2 : Y)(a.y); ctx.beginPath(); ctx.moveTo(m.l, py); ctx.lineTo(m.l + pw, py); ctx.stroke();
          if (a.label) { ctx.setLineDash([]); ctx.textAlign = 'right'; ctx.textBaseline = 'bottom'; ctx.fillText(a.label, m.l + pw - 4, py - 2); }
        } else if (a.type === 'segment') {
          ctx.beginPath(); ctx.moveTo(X(a.x0), Y(a.y0)); ctx.lineTo(X(a.x1), Y(a.y1)); ctx.stroke();
          if (a.label) { ctx.setLineDash([]); ctx.textAlign = 'left'; ctx.textBaseline = 'bottom'; ctx.fillText(a.label, X(a.x1) + 3, Y(a.y1) - 1); }
        } else if (a.type === 'point') {
          ctx.setLineDash([]);
          const px = X(a.x), py = (a.axis === 'right' ? Y2 : Y)(a.y);
          ctx.beginPath(); ctx.arc(px, py, a.r || 5, 0, Math.PI * 2);
          ctx.fillStyle = a.fill || a.color || col.strong; ctx.fill();
          ctx.lineWidth = 2; ctx.strokeStyle = cssVar('--bg-primary', '#000'); ctx.stroke();
          if (a.label) {
            // unter den Punkt, wenn oben kein Platz ist; nach links, wenn rechts kein Platz ist
            const w = ctx.measureText(a.label).width;
            const right = a.align === 'right' || (a.align !== 'left' && px + 8 + w > m.l + pw);
            const below = py - 18 < m.t;
            ctx.fillStyle = a.color || col.strong; ctx.textAlign = right ? 'right' : 'left'; ctx.textBaseline = below ? 'top' : 'bottom';
            ctx.fillText(a.label, px + (right ? -8 : 8), below ? py + 4 : py - 4);
          }
        } else if (a.type === 'text') {
          ctx.setLineDash([]); ctx.textAlign = a.align || 'left'; ctx.textBaseline = 'middle';
          ctx.fillText(a.label, X(a.x), Y(a.y));
        }
      }
      ctx.setLineDash([]);
      ctx.restore();

      this._hover(ctx, { X, Y, Y2, m, pw, ph, xr, yr, inv, col });
    }

    _hover(ctx, g) {
      const tip = this.tip;
      if (!this.mouse || this.mouse.x < g.m.l || this.mouse.x > g.m.l + g.pw || this.mouse.y < g.m.t || this.mouse.y > g.m.t + g.ph) {
        tip.style.display = 'none'; return;
      }
      const rows = [];
      if (this.opts.hover === 'nearest') {
        let best = null;
        for (const s of this.series) {
          if (this.hidden.has(s.name) || s.noHover) continue;
          const Yf = s.axis === 'right' ? g.Y2 : g.Y;
          for (let i = 0; i < s.x.length; i++) {
            if (!isFinite(s.x[i]) || !isFinite(s.y[i])) continue;
            const d = Math.hypot(g.X(s.x[i]) - this.mouse.x, Yf(s.y[i]) - this.mouse.y);
            if (!best || d < best.d) best = { d, s, i, px: g.X(s.x[i]), py: Yf(s.y[i]) };
          }
        }
        if (!best || best.d > 40) { tip.style.display = 'none'; return; }
        ctx.beginPath(); ctx.arc(best.px, best.py, 5, 0, Math.PI * 2); ctx.strokeStyle = best.s.color; ctx.lineWidth = 2; ctx.stroke();
        const lab = best.s.labels ? best.s.labels[best.i] : '';
        rows.push(`<b style="color:${best.s.color}">${best.s.name || ''}</b>${lab ? ' · ' + lab : ''}`);
        rows.push(`${this.opts.xShort || 'x'} = ${fmtNum(best.s.x[best.i])}`);
        rows.push(`${this.opts.yShort || 'y'} = ${fmtNum(best.s.y[best.i])}`);
        this._placeTip(rows, best.px, best.py, g);
        return;
      }
      const xv = g.inv(g.xr, this.mouse.x, g.m.l, g.m.l + g.pw);
      ctx.strokeStyle = g.col.cross; ctx.setLineDash([3, 3]); ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(this.mouse.x + 0.5, g.m.t); ctx.lineTo(this.mouse.x + 0.5, g.m.t + g.ph); ctx.stroke(); ctx.setLineDash([]);
      rows.push(`<b>${this.opts.xShort || this.opts.xLabel} = ${fmtNum(xv)}</b>`);
      for (const s of this.series) {
        if (this.hidden.has(s.name) || !s.name || s.noHover) continue;
        const y = interpSeries(s, xv);
        if (y === null) continue;
        const Yf = s.axis === 'right' ? g.Y2 : g.Y;
        ctx.beginPath(); ctx.arc(g.X(xv), Yf(y), 3.5, 0, Math.PI * 2); ctx.fillStyle = s.color; ctx.fill();
        rows.push(`<span style="color:${s.color}">■</span> ${s.name}: ${fmtNum(y)}`);
      }
      if (rows.length < 2) { tip.style.display = 'none'; return; }
      this._placeTip(rows, this.mouse.x, this.mouse.y, g);
    }

    _placeTip(rows, px, py, g) {
      const tip = this.tip;
      tip.innerHTML = rows.join('<br>');
      tip.style.display = 'block';
      const tw = tip.offsetWidth, th = tip.offsetHeight;
      let left = px + 14, top = py - th - 10;
      if (left + tw > g.m.l + g.pw) left = px - tw - 14;
      if (top < 0) top = py + 14;
      tip.style.left = left + 'px'; tip.style.top = top + 'px';
    }
  }

  // y(x) für Serien mit (abschnittsweise) monotoner x-Folge; nimmt den ersten passenden Abschnitt
  function interpSeries(s, x) {
    const xs = s.x, ys = s.y;
    for (let i = 1; i < xs.length; i++) {
      const a = xs[i - 1], b = xs[i];
      if (!isFinite(a) || !isFinite(b) || !isFinite(ys[i]) || !isFinite(ys[i - 1])) continue;
      if ((x >= a && x <= b) || (x <= a && x >= b)) {
        if (a === b) return ys[i];
        return ys[i - 1] + (ys[i] - ys[i - 1]) * (x - a) / (b - a);
      }
    }
    return null;
  }

  root.KChart = KChart;
  root.KFmt = fmtNum;
})(window);
