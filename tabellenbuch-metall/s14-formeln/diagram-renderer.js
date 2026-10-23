/**
 * diagram-renderer.js - SVG and Canvas visualizers for Tabellenbuch Metall S. 14:
 * 1. Cutting Speed Kinematics (Lathe & Milling interactive Canvas)
 * 2. Motor Characteristic Curve Hyperbola M(n) (SVG)
 * 3. Linear Function Plotter y = m·x + b with slope triangle (SVG)
 * 4. Break-Even Diagram (Gesamtkosten, Erlös, Gewinnschwelle Gs, Verlust- & Gewinnzonen) (SVG)
 */

class CuttingSpeedCanvas {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    this.mode = 'lathe'; // 'lathe' | 'mill'
    this.diameterMm = 200;
    this.rpm = 630;
    this.vc = 395.84;
    this.angle = 0;
    this.isRunning = true;
    this.speedScale = 0.005; // visual rotation speed
    this.sparks = [];

    this.resize();
    window.addEventListener('resize', () => this.resize());
    this.animate = this.animate.bind(this);
    requestAnimationFrame(this.animate);
  }

  resize() {
    if (!this.canvas) return;
    const rect = this.canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = Math.floor(rect.width * dpr);
    this.canvas.height = Math.floor(rect.height * dpr);
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.width = rect.width;
    this.height = rect.height;
  }

  updateParams(dMm, rpm, vc) {
    this.diameterMm = dMm;
    this.rpm = rpm;
    this.vc = vc;
  }

  setMode(mode) {
    this.mode = mode;
  }

  togglePlay() {
    this.isRunning = !this.isRunning;
    return this.isRunning;
  }

  animate(timestamp) {
    if (this.isRunning) {
      // Rotation speed depends smoothly on rpm
      const angularVel = Math.min(Math.max(this.rpm, 10), 3000) * this.speedScale * 0.05;
      this.angle = (this.angle + angularVel) % (2 * Math.PI);

      // Random sparks / chips at tool point
      if (Math.random() < 0.4 && this.rpm > 20) {
        this.sparks.push({
          x: this.mode === 'lathe' ? this.cx + this.radiusPx : this.cx,
          y: this.cy,
          vx: (Math.random() - 0.2) * 2.5,
          vy: (Math.random() - 0.8) * 3,
          life: 1.0,
          decay: 0.03 + Math.random() * 0.03,
          size: 1.5 + Math.random() * 2,
          color: Math.random() > 0.5 ? '#f59e0b' : '#ef4444'
        });
      }
    }

    // Update sparks
    for (let i = this.sparks.length - 1; i >= 0; i--) {
      const s = this.sparks[i];
      s.x += s.vx;
      s.y += s.vy;
      s.vy += 0.08; // gravity
      s.life -= s.decay;
      if (s.life <= 0) {
        this.sparks.splice(i, 1);
      }
    }

    this.draw();
    requestAnimationFrame(this.animate);
  }

  draw() {
    if (!this.ctx) return;
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;

    ctx.clearRect(0, 0, w, h);

    this.cx = w * 0.46;
    this.cy = h * 0.5;

    // Radius scaled visually to canvas
    const maxDim = Math.min(w, h);
    // Logarithmic/proportional clamp for display
    const normalizedD = Math.max(10, Math.min(this.diameterMm, 1000));
    this.radiusPx = (maxDim * 0.32) * Math.pow(normalizedD / 200, 0.35);

    if (this.mode === 'lathe') {
      this.drawLathe(ctx);
    } else {
      this.drawMilling(ctx);
    }

    // Draw sparks
    for (const s of this.sparks) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, s.life);
      ctx.fillStyle = s.color;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  drawLathe(ctx) {
    const cx = this.cx;
    const cy = this.cy;
    const r = this.radiusPx;

    // Background chuck/spindle mount on left
    ctx.fillStyle = '#64748b';
    ctx.fillRect(cx - r - 45, cy - r * 1.15, 30, r * 2.3);
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 2;
    ctx.strokeRect(cx - r - 45, cy - r * 1.15, 30, r * 2.3);

    // Rotating workpiece cylinder
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(this.angle);

    // Radial gradient for metallic 3D cylinder face
    const grad = ctx.createRadialGradient(0, 0, r * 0.1, 0, 0, r);
    grad.addColorStop(0, '#f8fafc');
    grad.addColorStop(0.7, '#cbd5e1');
    grad.addColorStop(1, '#94a3b8');

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Center hole / bore
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.22, 0, Math.PI * 2);
    ctx.fill();

    // Machined face pattern / radial spokes
    ctx.strokeStyle = 'rgba(71, 85, 105, 0.4)';
    ctx.lineWidth = 2;
    for (let i = 0; i < 6; i++) {
      const a = (i * Math.PI) / 3;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * (r * 0.25), Math.sin(a) * (r * 0.25));
      ctx.lineTo(Math.cos(a) * (r * 0.95), Math.sin(a) * (r * 0.95));
      ctx.stroke();
    }

    ctx.restore();

    // Cutting tool (Drehmeißel) on the right side
    const toolX = cx + r;
    const toolY = cy;
    ctx.save();
    ctx.fillStyle = '#d97706'; // Carbide insert golden color
    ctx.beginPath();
    ctx.moveTo(toolX, toolY);
    ctx.lineTo(toolX + 35, toolY - 18);
    ctx.lineTo(toolX + 45, toolY);
    ctx.lineTo(toolX + 35, toolY + 18);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#b45309';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Tool holder (Stahlschaft)
    ctx.fillStyle = '#475569';
    ctx.fillRect(toolX + 35, toolY - 12, 65, 24);
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(toolX + 35, toolY - 12, 65, 24);

    // Tangential cutting velocity vector vc (downward at contact)
    const vcLen = Math.min(100, Math.max(40, (this.vc / 400) * 80));
    ctx.strokeStyle = '#dc2626';
    ctx.fillStyle = '#dc2626';
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.moveTo(toolX, toolY);
    ctx.lineTo(toolX, toolY + vcLen);
    ctx.stroke();

    // Arrow head for vc
    ctx.beginPath();
    ctx.moveTo(toolX, toolY + vcLen);
    ctx.lineTo(toolX - 6, toolY + vcLen - 12);
    ctx.lineTo(toolX + 6, toolY + vcLen - 12);
    ctx.closePath();
    ctx.fill();

    // Label for vc
    ctx.font = 'bold 13px Inter, sans-serif';
    ctx.fillText(`vc = ${this.vc.toFixed(1)} m/min`, toolX + 12, toolY + vcLen * 0.65);
    ctx.restore();

    // Rotation arrow n (counter-clockwise on top)
    ctx.save();
    ctx.strokeStyle = '#2563eb';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(cx, cy, r + 18, -Math.PI * 0.65, -Math.PI * 0.35);
    ctx.stroke();

    // Arrow head for n
    const headAngle = -Math.PI * 0.35;
    const ax = cx + (r + 18) * Math.cos(headAngle);
    const ay = cy + (r + 18) * Math.sin(headAngle);
    ctx.fillStyle = '#2563eb';
    ctx.beginPath();
    ctx.moveTo(ax, ay);
    ctx.lineTo(ax - 8, ay - 6);
    ctx.lineTo(ax - 3, ay + 8);
    ctx.closePath();
    ctx.fill();

    ctx.font = 'bold 12px Inter, sans-serif';
    ctx.fillStyle = '#2563eb';
    ctx.fillText(`n = ${this.rpm.toFixed(0)} min⁻¹`, cx - 35, cy - r - 26);
    ctx.restore();

    // Diameter dimension line d (vertical on left)
    ctx.save();
    const dimX = cx - r - 22;
    ctx.strokeStyle = '#059669';
    ctx.lineWidth = 1.5;

    // Extension lines
    ctx.beginPath();
    ctx.moveTo(cx, cy - r);
    ctx.lineTo(dimX - 12, cy - r);
    ctx.moveTo(cx, cy + r);
    ctx.lineTo(dimX - 12, cy + r);
    ctx.stroke();

    // Dimension line with arrows
    ctx.beginPath();
    ctx.moveTo(dimX, cy - r);
    ctx.lineTo(dimX, cy + r);
    ctx.stroke();

    // Dimension arrow heads
    this.drawArrowHead(ctx, dimX, cy - r, 0, -1, '#059669');
    this.drawArrowHead(ctx, dimX, cy + r, 0, 1, '#059669');

    // Dimension label
    ctx.save();
    ctx.translate(dimX - 8, cy);
    ctx.rotate(-Math.PI / 2);
    ctx.textAlign = 'center';
    ctx.font = 'bold 12px Inter, sans-serif';
    ctx.fillStyle = '#059669';
    ctx.fillText(`Ø d = ${this.diameterMm} mm`, 0, -4);
    ctx.restore();
    ctx.restore();
  }

  drawMilling(ctx) {
    const cx = this.cx;
    const cy = this.cy;
    const r = this.radiusPx * 0.75;

    // Workpiece block below milling cutter
    ctx.fillStyle = '#94a3b8';
    ctx.fillRect(cx - 120, cy + r - 10, 240, 75);
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 2;
    ctx.strokeRect(cx - 120, cy + r - 10, 240, 75);

    // Rotating milling tool
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(this.angle);

    ctx.fillStyle = '#cbd5e1';
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fill();

    // Flutes / Teeth of end mill
    ctx.fillStyle = '#0284c7';
    for (let i = 0; i < 4; i++) {
      const a = (i * Math.PI) / 2;
      ctx.beginPath();
      ctx.arc(Math.cos(a) * r, Math.sin(a) * r, 8, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    // Tangential speed arrow
    ctx.save();
    ctx.strokeStyle = '#dc2626';
    ctx.fillStyle = '#dc2626';
    ctx.lineWidth = 3;
    const vx = cx + r;
    const vy = cy;
    ctx.beginPath();
    ctx.moveTo(vx, vy);
    ctx.lineTo(vx, vy + 45);
    ctx.stroke();
    this.drawArrowHead(ctx, vx, vy + 45, 0, 1, '#dc2626');
    ctx.font = 'bold 12px Inter, sans-serif';
    ctx.fillText(`vc = ${this.vc.toFixed(1)} m/min`, vx + 10, vy + 30);
    ctx.restore();
  }

  drawArrowHead(ctx, x, y, dx, dy, color) {
    ctx.save();
    ctx.fillStyle = color;
    const angle = Math.atan2(dy, dx);
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(-8, -4);
    ctx.lineTo(-8, 4);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
}

// ---------------------------------------------------------------------------
// LINEAR FUNCTION PLOTTER (SVG)
// ---------------------------------------------------------------------------
class LinearFunctionPlotter {
  constructor(svgId) {
    this.svg = document.getElementById(svgId);
    this.m = 0.5;
    this.b = 1.0;
    this.samplePoints = [-2, 0, 2, 3];
    this.bounds = { xMin: -4, xMax: 5, yMin: -2, yMax: 4 };
  }

  update(m, b) {
    this.m = m;
    this.b = b;
    this.render();
  }

  toSvg(x, y, width, height, pad) {
    const plotW = width - 2 * pad;
    const plotH = height - 2 * pad;
    const sx = pad + ((x - this.bounds.xMin) / (this.bounds.xMax - this.bounds.xMin)) * plotW;
    const sy = height - pad - ((y - this.bounds.yMin) / (this.bounds.yMax - this.bounds.yMin)) * plotH;
    return { x: sx, y: sy };
  }

  render() {
    if (!this.svg) return;
    const width = 480;
    const height = 340;
    const pad = 42;
    this.svg.setAttribute('viewBox', `0 0 ${width} ${height}`);

    let html = `
      <defs>
        <marker id="axis-arrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M 0 1 L 10 5 L 0 9 z" fill="var(--text-color, #1e293b)" />
        </marker>
        <pattern id="grid-pattern" width="40" height="40" patternUnits="userSpaceOnUse">
          <path d="M 40 0 L 0 0 0 40" fill="none" stroke="var(--grid-color, rgba(148, 163, 184, 0.25))" stroke-width="1"/>
        </pattern>
      </defs>
      <!-- Background Grid -->
      <rect x="${pad}" y="${pad}" width="${width - 2 * pad}" height="${height - 2 * pad}" fill="none" stroke="var(--border-color, #cbd5e1)" stroke-width="1"/>
    `;

    // Zero axes coordinates
    const origin = this.toSvg(0, 0, width, height, pad);

    // Grid lines & labels
    for (let x = Math.ceil(this.bounds.xMin); x <= Math.floor(this.bounds.xMax); x++) {
      if (x === 0) continue;
      const pt = this.toSvg(x, 0, width, height, pad);
      html += `
        <line x1="${pt.x}" y1="${pad}" x2="${pt.x}" y2="${height - pad}" stroke="var(--grid-subtle, rgba(203, 213, 225, 0.4))" stroke-dasharray="3,3" />
        <line x1="${pt.x}" y1="${origin.y - 4}" x2="${pt.x}" y2="${origin.y + 4}" stroke="var(--text-color, #334155)" stroke-width="1.5" />
        <text x="${pt.x}" y="${origin.y + 18}" text-anchor="middle" font-size="11" font-weight="600" fill="var(--text-muted, #64748b)">${x}</text>
      `;
    }

    for (let y = Math.ceil(this.bounds.yMin); y <= Math.floor(this.bounds.yMax); y++) {
      if (y === 0) continue;
      const pt = this.toSvg(0, y, width, height, pad);
      html += `
        <line x1="${pad}" y1="${pt.y}" x2="${width - pad}" y2="${pt.y}" stroke="var(--grid-subtle, rgba(203, 213, 225, 0.4))" stroke-dasharray="3,3" />
        <line x1="${origin.x - 4}" y1="${pt.y}" x2="${origin.x + 4}" y2="${pt.y}" stroke="var(--text-color, #334155)" stroke-width="1.5" />
        <text x="${origin.x - 10}" y="${pt.y + 4}" text-anchor="end" font-size="11" font-weight="600" fill="var(--text-muted, #64748b)">${y}</text>
      `;
    }

    // Main X and Y Axes with Arrows
    html += `
      <!-- X-Axis -->
      <line x1="${pad - 15}" y1="${origin.y}" x2="${width - pad + 20}" y2="${origin.y}" stroke="var(--text-color, #1e293b)" stroke-width="2" marker-end="url(#axis-arrow)" />
      <text x="${width - pad + 26}" y="${origin.y + 4}" font-size="14" font-weight="bold" fill="var(--text-color, #1e293b)">x</text>

      <!-- Y-Axis -->
      <line x1="${origin.x}" y1="${height - pad + 15}" x2="${origin.x}" y2="${pad - 20}" stroke="var(--text-color, #1e293b)" stroke-width="2" marker-end="url(#axis-arrow)" />
      <text x="${origin.x - 14}" y="${pad - 22}" font-size="14" font-weight="bold" fill="var(--text-color, #1e293b)">y</text>
    `;

    // Line y = m * x + b
    const x1 = this.bounds.xMin - 0.5;
    const y1 = this.m * x1 + this.b;
    const x2 = this.bounds.xMax + 0.5;
    const y2 = this.m * x2 + this.b;

    const p1 = this.toSvg(x1, y1, width, height, pad);
    const p2 = this.toSvg(x2, y2, width, height, pad);

    html += `
      <line x1="${p1.x}" y1="${p1.y}" x2="${p2.x}" y2="${p2.y}" stroke="#0284c7" stroke-width="3" stroke-linecap="round" />
    `;

    // Slope triangle (Steigungsdreieck) at x = 0 to x = 2
    const triX1 = 0;
    const triY1 = this.m * triX1 + this.b;
    const triX2 = 2;
    const triY2 = this.m * triX2 + this.b;

    const triP1 = this.toSvg(triX1, triY1, width, height, pad);
    const triP_corner = this.toSvg(triX2, triY1, width, height, pad);
    const triP2 = this.toSvg(triX2, triY2, width, height, pad);

    html += `
      <!-- Slope Triangle -->
      <path d="M ${triP1.x} ${triP1.y} L ${triP_corner.x} ${triP_corner.y} L ${triP2.x} ${triP2.y}" fill="none" stroke="#e11d48" stroke-width="2" stroke-dasharray="4,3" />
      <text x="${(triP1.x + triP_corner.x) / 2}" y="${triP_corner.y + 14}" text-anchor="middle" font-size="11" font-weight="bold" fill="#e11d48">Δx = 2</text>
      <text x="${triP_corner.x + 8}" y="${(triP_corner.y + triP2.y) / 2}" font-size="11" font-weight="bold" fill="#e11d48">Δy = ${(this.m * 2).toFixed(1)}</text>
      <text x="${triP_corner.x + 12}" y="${(triP_corner.y + triP2.y) / 2 + 14}" font-size="11" font-weight="bold" fill="#0284c7">m = ${this.m}</text>
    `;

    // Highlight Y-Intercept (b = 1)
    const interceptPt = this.toSvg(0, this.b, width, height, pad);
    html += `
      <circle cx="${interceptPt.x}" cy="${interceptPt.y}" r="5" fill="#e11d48" stroke="#fff" stroke-width="2" />
      <text x="${interceptPt.x + 10}" y="${interceptPt.y - 8}" font-size="12" font-weight="bold" fill="#e11d48">b = ${this.b}</text>
    `;

    // Highlight sample points from book
    this.samplePoints.forEach(xVal => {
      const yVal = this.m * xVal + this.b;
      const pt = this.toSvg(xVal, yVal, width, height, pad);
      html += `
        <circle cx="${pt.x}" cy="${pt.y}" r="4.5" fill="#0284c7" stroke="#ffffff" stroke-width="2" />
      `;
    });

    // Formula label on graph
    const labelPos = this.toSvg(1.5, this.m * 1.5 + this.b, width, height, pad);
    html += `
      <rect x="${labelPos.x - 70}" y="${labelPos.y - 36}" width="140" height="26" rx="4" fill="rgba(241, 245, 249, 0.92)" stroke="#0284c7" stroke-width="1" />
      <text x="${labelPos.x}" y="${labelPos.y - 19}" text-anchor="middle" font-size="13" font-weight="bold" fill="#0284c7">y = ${this.m} x + ${this.b}</text>
    `;

    this.svg.innerHTML = html;
  }
}

// ---------------------------------------------------------------------------
// BREAK-EVEN DIAGRAM RENDERER (SVG) - Replicating Tabellenbuch Metall S. 14
// ---------------------------------------------------------------------------
class BreakEvenDiagramRenderer {
  constructor(svgId) {
    this.svg = document.getElementById(svgId);
    this.Kf = 200000;
    this.Kv = 60;
    this.e = 110;
    this.currentM = 4000;
  }

  update(Kf, Kv, e, currentM) {
    this.Kf = Kf;
    this.Kv = Kv;
    this.e = e;
    this.currentM = currentM !== undefined ? currentM : this.currentM;
    this.render();
  }

  render() {
    if (!this.svg) return;
    const width = 640;
    const height = 440;
    const padL = 80;
    const padR = 40;
    const padT = 40;
    const padB = 60;

    this.svg.setAttribute('viewBox', `0 0 ${width} ${height}`);

    const db = this.e - this.Kv;
    const mGs = db > 0 ? this.Kf / db : Infinity;

    // Determine scale bounds
    let maxM = 7000;
    if (isFinite(mGs) && mGs > 0) {
      maxM = Math.max(7000, mGs * 1.75, this.currentM * 1.25);
    }
    // Round to clean step
    const stepM = Math.pow(10, Math.floor(Math.log10(maxM))) * (maxM / Math.pow(10, Math.floor(Math.log10(maxM))) > 5 ? 2 : 1);
    maxM = Math.ceil(maxM / 1000) * 1000;

    const maxKg = this.Kv * maxM + this.Kf;
    const maxE = this.e * maxM;
    let maxY = Math.max(maxKg, maxE, 800000);
    maxY = Math.ceil(maxY / 100000) * 100000;

    const plotW = width - padL - padR;
    const plotH = height - padT - padB;

    const toSvg = (m, yVal) => {
      const sx = padL + (m / maxM) * plotW;
      const sy = height - padB - (yVal / maxY) * plotH;
      return { x: sx, y: sy };
    };

    let html = `
      <defs>
        <marker id="be-arrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M 0 1 L 10 5 L 0 9 z" fill="#1e293b" />
        </marker>
        <!-- Loss Hatched Pattern (Verlust) -->
        <pattern id="loss-hatch" width="8" height="8" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
          <line x1="0" y1="0" x2="0" y2="8" stroke="rgba(239, 68, 68, 0.45)" stroke-width="2.5" />
        </pattern>
        <!-- Profit Hatched Pattern (Gewinn) -->
        <pattern id="profit-hatch" width="8" height="8" patternTransform="rotate(-45 0 0)" patternUnits="userSpaceOnUse">
          <line x1="0" y1="0" x2="0" y2="8" stroke="rgba(16, 185, 129, 0.45)" stroke-width="2.5" />
        </pattern>
      </defs>

      <!-- Background Framing -->
      <rect x="${padL}" y="${padT}" width="${plotW}" height="${plotH}" fill="#ffffff" stroke="#cbd5e1" stroke-width="1.5" />
    `;

    // Horizontal Ticks (Euros)
    const yTickInterval = maxY / 4;
    for (let y = 0; y <= maxY; y += yTickInterval) {
      const pt = toSvg(0, y);
      const formatted = (y >= 1000 ? `${(y / 1000).toFixed(0)} 000` : y);
      html += `
        <line x1="${padL}" y1="${pt.y}" x2="${width - padR}" y2="${pt.y}" stroke="#e2e8f0" stroke-width="1" />
        <line x1="${padL - 5}" y1="${pt.y}" x2="${padL}" y2="${pt.y}" stroke="#475569" stroke-width="1.5" />
        <text x="${padL - 10}" y="${pt.y + 4}" text-anchor="end" font-size="11" font-weight="600" fill="#475569">${formatted}</text>
      `;
    }

    // Vertical Ticks (Quantity M)
    const mTickStep = maxM / 4;
    for (let m = 0; m <= maxM; m += mTickStep) {
      const pt = toSvg(m, 0);
      html += `
        <line x1="${pt.x}" y1="${padT}" x2="${pt.x}" y2="${height - padB}" stroke="#e2e8f0" stroke-width="1" />
        <line x1="${pt.x}" y1="${height - padB}" x2="${pt.x}" y2="${height - padB + 5}" stroke="#475569" stroke-width="1.5" />
        <text x="${pt.x}" y="${height - padB + 20}" text-anchor="middle" font-size="11" font-weight="600" fill="#475569">${Math.round(m)}</text>
      `;
    }

    // Fixed Costs line (gestrichelte Linie Kf)
    const kfStart = toSvg(0, this.Kf);
    const kfEnd = toSvg(maxM, this.Kf);
    html += `
      <line x1="${kfStart.x}" y1="${kfStart.y}" x2="${kfEnd.x}" y2="${kfEnd.y}" stroke="#0284c7" stroke-width="2" stroke-dasharray="6,4" />
      <text x="${padL + 25}" y="${kfStart.y + 16}" font-size="12" font-weight="bold" fill="#0284c7">fixe Kosten</text>
    `;

    // Loss (Verlust) & Profit (Gewinn) polygons
    if (isFinite(mGs) && mGs > 0 && mGs < maxM) {
      const pOrig = toSvg(0, 0);
      const pKf0 = toSvg(0, this.Kf);
      const pGs = toSvg(mGs, this.e * mGs);
      const pMaxKg = toSvg(maxM, this.Kv * maxM + this.Kf);
      const pMaxE = toSvg(maxM, this.e * maxM);

      // Loss Area Polygon: (0,0) -> (0, Kf) -> (mGs, E_Gs) -> (0,0)
      html += `
        <polygon points="${pOrig.x},${pOrig.y} ${pKf0.x},${pKf0.y} ${pGs.x},${pGs.y}" fill="rgba(239, 68, 68, 0.18)" />
        <polygon points="${pOrig.x},${pOrig.y} ${pKf0.x},${pKf0.y} ${pGs.x},${pGs.y}" fill="url(#loss-hatch)" />
        <text x="${(pOrig.x + pGs.x) * 0.38}" y="${(pKf0.y + pGs.y) * 0.6}" font-size="14" font-weight="bold" fill="#b91c1c">Verlust</text>
      `;

      // Profit Area Polygon: (mGs, E_Gs) -> (maxM, KG_max) -> (maxM, E_max)
      html += `
        <polygon points="${pGs.x},${pGs.y} ${pMaxKg.x},${pMaxKg.y} ${pMaxE.x},${pMaxE.y}" fill="rgba(16, 185, 129, 0.2)" />
        <polygon points="${pGs.x},${pGs.y} ${pMaxKg.x},${pMaxKg.y} ${pMaxE.x},${pMaxE.y}" fill="url(#profit-hatch)" />
        <text x="${pGs.x + (plotW - (pGs.x - padL)) * 0.45}" y="${pGs.y - 30}" font-size="14" font-weight="bold" fill="#15803d">Gewinn</text>
      `;
    }

    // Gesamtkosten Line KG (Rot)
    const kgStart = toSvg(0, this.Kf);
    const kgEnd = toSvg(maxM, this.Kv * maxM + this.Kf);
    html += `
      <line x1="${kgStart.x}" y1="${kgStart.y}" x2="${kgEnd.x}" y2="${kgEnd.y}" stroke="#dc2626" stroke-width="3" stroke-linecap="round" />
      <text x="${kgEnd.x - 110}" y="${kgEnd.y + 24}" font-size="12" font-weight="bold" fill="#dc2626">Gesamt-</text>
      <text x="${kgEnd.x - 110}" y="${kgEnd.y + 38}" font-size="12" font-weight="bold" fill="#dc2626">kosten</text>
    `;

    // Erlös Line E (Cyan/Blau)
    const eStart = toSvg(0, 0);
    const eEnd = toSvg(maxM, this.e * maxM);
    html += `
      <line x1="${eStart.x}" y1="${eStart.y}" x2="${eEnd.x}" y2="${eEnd.y}" stroke="#0284c7" stroke-width="3" stroke-linecap="round" />
      <text x="${eEnd.x - 65}" y="${eEnd.y - 10}" font-size="13" font-weight="bold" fill="#0284c7">Erlös</text>
    `;

    // Variable Kosten label between Kf and KG
    const varMidM = maxM * 0.65;
    const pVarKf = toSvg(varMidM, this.Kf);
    const pVarKg = toSvg(varMidM, this.Kv * varMidM + this.Kf);
    html += `
      <text x="${pVarKf.x}" y="${(pVarKf.y + pVarKg.y) / 2 + 4}" text-anchor="middle" font-size="12" font-weight="600" fill="#475569">variable Kosten</text>
    `;

    // Gewinnschwelle Marker (Gs)
    if (isFinite(mGs) && mGs > 0 && mGs <= maxM) {
      const gsPt = toSvg(mGs, this.e * mGs);
      html += `
        <!-- Break-Even Drop Lines -->
        <line x1="${gsPt.x}" y1="${gsPt.y}" x2="${gsPt.x}" y2="${height - padB}" stroke="#1e293b" stroke-width="1.5" stroke-dasharray="4,3" />
        <line x1="${gsPt.x}" y1="${gsPt.y}" x2="${padL}" y2="${gsPt.y}" stroke="#1e293b" stroke-width="1.5" stroke-dasharray="4,3" />

        <!-- Gs Circle -->
        <circle cx="${gsPt.x}" cy="${gsPt.y}" r="6" fill="#1e293b" stroke="#ffffff" stroke-width="2.5" />

        <!-- Gs Label Box -->
        <rect x="${gsPt.x - 130}" y="${gsPt.y - 46}" width="120" height="38" rx="4" fill="rgba(241, 245, 249, 0.95)" stroke="#1e293b" stroke-width="1" />
        <text x="${gsPt.x - 70}" y="${gsPt.y - 28}" text-anchor="middle" font-size="11" font-weight="bold" fill="#1e293b">Gewinn-</text>
        <text x="${gsPt.x - 70}" y="${gsPt.y - 14}" text-anchor="middle" font-size="11" font-weight="bold" fill="#1e293b">schwelle (Gs)</text>
      `;
    }

    // Active Probe / Work Point Cursor
    if (this.currentM !== undefined && this.currentM >= 0 && this.currentM <= maxM) {
      const probeKg = this.Kv * this.currentM + this.Kf;
      const probeE = this.e * this.currentM;
      const probePt = toSvg(this.currentM, 0);
      const probePtKg = toSvg(this.currentM, probeKg);
      const probePtE = toSvg(this.currentM, probeE);
      const diff = probeE - probeKg;

      html += `
        <!-- Active Quantity Vertical Line -->
        <line x1="${probePt.x}" y1="${padT}" x2="${probePt.x}" y2="${height - padB}" stroke="#7c3aed" stroke-width="2" stroke-dasharray="2,2" />
        <circle cx="${probePtKg.x}" cy="${probePtKg.y}" r="5" fill="#dc2626" stroke="#ffffff" stroke-width="2" />
        <circle cx="${probePtE.x}" cy="${probePtE.y}" r="5" fill="#0284c7" stroke="#ffffff" stroke-width="2" />
        
        <!-- Live Tooltip on top -->
        <rect x="${Math.min(width - padR - 150, Math.max(padL + 10, probePt.x - 75))}" y="${padT + 10}" width="150" height="52" rx="5" fill="rgba(30, 41, 59, 0.92)" />
        <text x="${Math.min(width - padR - 150, Math.max(padL + 10, probePt.x - 75)) + 75}" y="${padT + 26}" text-anchor="middle" font-size="11" font-weight="bold" fill="#f8fafc">M = ${this.currentM.toLocaleString('de-DE')} Stck</text>
        <text x="${Math.min(width - padR - 150, Math.max(padL + 10, probePt.x - 75)) + 75}" y="${padT + 42}" text-anchor="middle" font-size="11" font-weight="bold" fill="${diff >= 0 ? '#4ade80' : '#f87171'}">${diff >= 0 ? '+' : ''}${diff.toLocaleString('de-DE')} €</text>
      `;
    }

    // Axis Labels matching page 14
    html += `
      <!-- Y-Axis Header Label -->
      <text x="${padL - 10}" y="${padT - 18}" text-anchor="end" font-size="12" font-weight="bold" fill="#1e293b">€</text>
      <!-- Vertical Rotated Label on the side: "Kosten bzw. Erlös --->" -->
      <text x="${-((padT + height - padB) / 2)}" y="${padL - 50}" transform="rotate(-90)" text-anchor="middle" font-size="13" font-weight="bold" fill="#1e293b">Kosten bzw. Erlös ───▶</text>

      <!-- X-Axis Label: "Menge Stück --->" -->
      <text x="${(padL + width - padR) / 2}" y="${height - padB + 44}" text-anchor="middle" font-size="13" font-weight="bold" fill="#1e293b">Menge ───▶</text>
    `;

    this.svg.innerHTML = html;
  }
}

// ---------------------------------------------------------------------------
// MOTOR CHARACTERISTIC CURVE M(n) (SVG)
// ---------------------------------------------------------------------------
class MotorCharacteristicRenderer {
  constructor(svgId) {
    this.svg = document.getElementById(svgId);
    this.pKw = 15;
    this.nRpm = 750;
  }

  update(pKw, nRpm) {
    this.pKw = pKw;
    this.nRpm = nRpm;
    this.render();
  }

  render() {
    if (!this.svg) return;
    const width = 480;
    const height = 300;
    const padL = 65;
    const padR = 30;
    const padT = 30;
    const padB = 45;

    this.svg.setAttribute('viewBox', `0 0 ${width} ${height}`);

    const maxN = Math.max(3000, this.nRpm * 1.6);
    const minN = 100;
    const maxM = Math.max(400, (9550 * this.pKw / 300) * 1.15);

    const toSvg = (n, mVal) => {
      const sx = padL + ((n - minN) / (maxN - minN)) * (width - padL - padR);
      const sy = height - padB - (mVal / maxM) * (height - padT - padB);
      return { x: sx, y: sy };
    };

    let pathD = '';
    const step = (maxN - minN) / 60;
    for (let n = minN; n <= maxN; n += step) {
      const mVal = (9550 * this.pKw) / n;
      const pt = toSvg(n, Math.min(mVal, maxM));
      if (pathD === '') {
        pathD = `M ${pt.x} ${pt.y}`;
      } else {
        pathD += ` L ${pt.x} ${pt.y}`;
      }
    }

    const currentM = (9550 * this.pKw) / this.nRpm;
    const currPt = toSvg(this.nRpm, currentM);

    let html = `
      <defs>
        <marker id="motor-arrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M 0 1 L 10 5 L 0 9 z" fill="#1e293b" />
        </marker>
      </defs>
      <!-- Background -->
      <rect x="${padL}" y="${padT}" width="${width - padL - padR}" height="${height - padT - padB}" fill="#f8fafc" stroke="#cbd5e1" stroke-width="1"/>

      <!-- Axes -->
      <line x1="${padL}" y1="${height - padB}" x2="${width - padR + 15}" y2="${height - padB}" stroke="#1e293b" stroke-width="2" marker-end="url(#motor-arrow)"/>
      <line x1="${padL}" y1="${height - padB}" x2="${padL}" y2="${padT - 15}" stroke="#1e293b" stroke-width="2" marker-end="url(#motor-arrow)"/>

      <text x="${width - padR + 20}" y="${height - padB + 4}" font-size="12" font-weight="bold" fill="#1e293b">n [min⁻¹]</text>
      <text x="${padL - 10}" y="${padT - 18}" text-anchor="end" font-size="12" font-weight="bold" fill="#1e293b">M [N·m]</text>

      <!-- Curve M = (9550 * P) / n -->
      <path d="${pathD}" fill="none" stroke="#2563eb" stroke-width="3" stroke-linecap="round"/>

      <!-- Operating Point Drop Lines -->
      <line x1="${currPt.x}" y1="${currPt.y}" x2="${currPt.x}" y2="${height - padB}" stroke="#d97706" stroke-width="1.5" stroke-dasharray="3,3"/>
      <line x1="${currPt.x}" y1="${currPt.y}" x2="${padL}" y2="${currPt.y}" stroke="#d97706" stroke-width="1.5" stroke-dasharray="3,3"/>

      <!-- Operating Point Point -->
      <circle cx="${currPt.x}" cy="${currPt.y}" r="6" fill="#d97706" stroke="#ffffff" stroke-width="2"/>

      <!-- Tag -->
      <rect x="${Math.min(width - padR - 130, currPt.x + 10)}" y="${Math.max(padT + 10, currPt.y - 35)}" width="120" height="32" rx="4" fill="rgba(30, 41, 59, 0.92)"/>
      <text x="${Math.min(width - padR - 130, currPt.x + 10) + 60}" y="${Math.max(padT + 10, currPt.y - 35) + 16}" text-anchor="middle" font-size="10" font-weight="bold" fill="#93c5fd">P = ${this.pKw} kW (konst.)</text>
      <text x="${Math.min(width - padR - 130, currPt.x + 10) + 60}" y="${Math.max(padT + 10, currPt.y - 35) + 27}" text-anchor="middle" font-size="10" font-weight="bold" fill="#fef08a">M = ${currentM.toFixed(1)} N·m</text>
    `;

    this.svg.innerHTML = html;
  }
}

if (typeof window !== 'undefined') {
  window.CuttingSpeedCanvas = CuttingSpeedCanvas;
  window.LinearFunctionPlotter = LinearFunctionPlotter;
  window.BreakEvenDiagramRenderer = BreakEvenDiagramRenderer;
  window.MotorCharacteristicRenderer = MotorCharacteristicRenderer;
}
