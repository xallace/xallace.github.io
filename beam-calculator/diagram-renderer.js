/* ==========================================================================
   diagram-renderer.js — 1967 Technical Book-Plate SVG Renderer
   Renders:
     1. Free Body & Deformed Beam Plate (FBD) with Fiber Colors & Call-Outs
     2. Shear Force Diagram (SFD)
     3. Bending Moment Diagram (BMD)
     4. Elastic Deflection Curve with Support Tangents θ & L/300 Check
     5. Method-of-Sections Free-Body Cut at Probe x
     6. Live Cross-Section Geometry & Linear Bending Stress Profile σ(y)
   Palette: Parchment (#0e141e), Ink (#e9edf5), Vermilion (#ff7d61),
            Ochre (#ed864b), Forest Green (#58b691)
   ========================================================================== */
(function (global) {
  'use strict';

  const INK = '#e9edf5';
  const INK_MUTED = '#a8b3c5';
  const INK_DIM = '#7f8b9f';
  const PAPER = '#0e141e';
  const CARD_BG = '#0a101a';
  const VERMILION = '#ff7d61';
  const OCHRE = '#ed864b';
  const GREEN = '#58b691';
  const CRIMSON = '#ff695d';

  function surveyGridPattern(id) {
    return `
      <pattern id="${id}" width="24" height="24" patternUnits="userSpaceOnUse">
        <path d="M 24 0 L 0 0 0 24" fill="none" stroke="rgba(233, 237, 245,0.065)" stroke-width="1"/>
      </pattern>
    `;
  }

  class DiagramRenderer {
    constructor(opts) {
      this.containerFBD = opts.containerFBD;
      this.containerSFD = opts.containerSFD;
      this.containerBMD = opts.containerBMD;
      this.containerDeflection = opts.containerDeflection;
      this.containerCut = opts.containerCut;
      this.containerSection = opts.containerSection;
      this.onProbeChange = opts.onProbeChange;

      this.momentTensionBottom = true;
      this.showCallouts = true;
      this.showFiberColors = true;
      this.showDeformation = true;

      this.currentSolution = null;
      this.currentPoints = null;
      this.currentSecProp = null;

      this._dragging = false;
      this.initEvents();
    }

    initEvents() {
      const containers = [
        this.containerFBD,
        this.containerSFD,
        this.containerBMD,
        this.containerDeflection,
      ];

      containers.forEach((container) => {
        if (!container) return;
        container.addEventListener('pointerdown', (e) => {
          this._dragging = true;
          try { container.setPointerCapture(e.pointerId); } catch (_) {}
          this.handlePointer(e, container);
        });
        container.addEventListener('pointermove', (e) => {
          if (e.buttons === 1 || this._dragging || e.pointerType === 'mouse') {
            this.handlePointer(e, container);
          }
        });
        container.addEventListener('pointerup', () => {
          this._dragging = false;
        });
        container.addEventListener('pointercancel', () => {
          this._dragging = false;
        });
      });
    }

    handlePointer(e, container) {
      if (!this.currentSolution) return;
      const svg = container.querySelector('svg');
      if (!svg) return;

      const padX = 78;
      const svgWidth = 760;
      const plotW = svgWidth - 2 * padX;

      let svgX = null;
      try {
        const ctm = svg.getScreenCTM();
        if (ctm) {
          const pt = svg.createSVGPoint();
          pt.x = e.clientX;
          pt.y = e.clientY;
          const local = pt.matrixTransform(ctm.inverse());
          svgX = local.x;
        }
      } catch (_) {}

      if (svgX === null || !Number.isFinite(svgX)) {
        const rect = container.getBoundingClientRect();
        svgX = ((e.clientX - rect.left) / Math.max(1, rect.width)) * svgWidth;
      }

      const relX = Math.max(0, Math.min(1, (svgX - padX) / plotW));
      const newX = relX * this.currentSolution.L;
      if (this.onProbeChange) {
        this.onProbeChange(newX);
      }
    }

    render(solution, points, secProp) {
      this.currentSolution = solution;
      this.currentPoints = points;
      this.currentSecProp = secProp;

      this.renderFBD(solution, points);
      this.renderSFD(solution);
      this.renderBMD(solution, points);
      this.renderDeflection(solution, points);
      this.renderCutSection(solution);
      this.renderCrossSection(solution, secProp);
    }

    /**
     * 1. Free Body & Deformed Beam Plate (FBD)
     */
    renderFBD(solution, points) {
      if (!this.containerFBD) return;
      const { L, w, x, W_total, R_A, R_B, delta_max, unit } = solution;
      const wUnit = unit === 'metric' ? 'kN/m' : 'lbf/ft';
      const fUnit = unit === 'metric' ? 'kN' : 'lbf';
      const lUnit = unit === 'metric' ? 'm' : 'ft';

      const svgW = 760;
      const svgH = 216;
      const padX = 78;
      const plotW = svgW - 2 * padX;
      const beamY = 104;
      const beamH = 16;
      const probeX = padX + (x / L) * plotW;

      // Load arrows scaled subtly by intensity
      const numArrows = 16;
      const arrowStep = plotW / numArrows;
      const loadTopY = 44;
      const loadBotY = beamY - beamH / 2 - 4;

      let arrowsSvg = `
        <rect x="${padX}" y="${loadTopY}" width="${plotW}" height="${loadBotY - loadTopY}" fill="rgba(255, 125, 97,0.08)" />
        <line x1="${padX}" y1="${loadTopY}" x2="${padX + plotW}" y2="${loadTopY}" stroke="${VERMILION}" stroke-width="2.2" />
      `;
      for (let i = 0; i <= numArrows; i++) {
        const ax = padX + i * arrowStep;
        arrowsSvg += `
          <line x1="${ax.toFixed(1)}" y1="${loadTopY}" x2="${ax.toFixed(1)}" y2="${loadBotY - 3}" stroke="${VERMILION}" stroke-width="1.35" />
          <polygon points="${(ax - 3.2).toFixed(1)},${loadBotY - 6} ${(ax + 3.2).toFixed(1)},${loadBotY - 6} ${ax.toFixed(1)},${loadBotY}" fill="${VERMILION}" />
        `;
      }

      // Beam body: deformed elastic ribbon (exaggerated) or straight ink bar
      const sagAmp = this.showDeformation && w > 0 ? 14 : 0;
      let topPath = '';
      let midPath = '';
      let botPath = '';
      let compPoly = '';
      let tensPoly = '';

      if (sagAmp > 0 && points && points.length > 0 && delta_max > 1e-6) {
        const topPts = [];
        const midPts = [];
        const botPts = [];
        const step = Math.max(1, Math.floor(points.length / 48));
        for (let i = 0; i < points.length; i += step) {
          const pt = points[i];
          const px = padX + pt.x_rel * plotW;
          const dy = (pt.delta / delta_max) * sagAmp;
          topPts.push([px, beamY - beamH / 2 + dy]);
          midPts.push([px, beamY + dy]);
          botPts.push([px, beamY + beamH / 2 + dy]);
        }
        // ensure exact endpoint
        const lastX = padX + plotW;
        topPts.push([lastX, beamY - beamH / 2]);
        midPts.push([lastX, beamY]);
        botPts.push([lastX, beamY + beamH / 2]);

        const toPath = (arr) => arr.map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' ');
        topPath = toPath(topPts);
        midPath = toPath(midPts);
        botPath = toPath(botPts);

        const revMid = [...midPts].reverse();
        const revBot = [...botPts].reverse();
        compPoly = topPts.concat(revMid).map((p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');
        tensPoly = midPts.concat(revBot).map((p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');
      }

      let beamSvg = '';
      if (sagAmp > 0 && compPoly) {
        const compFill = this.showFiberColors ? 'rgba(255, 125, 97,0.28)' : 'rgba(233, 237, 245,0.12)';
        const tensFill = this.showFiberColors ? 'rgba(88, 182, 145,0.24)' : 'rgba(233, 237, 245,0.06)';
        beamSvg = `
          <!-- Ghost unloaded outline -->
          <rect x="${padX}" y="${beamY - beamH / 2}" width="${plotW}" height="${beamH}" fill="none" stroke="rgba(233, 237, 245,0.22)" stroke-width="1" stroke-dasharray="4,3" />
          <!-- Compression (top) & Tension (bottom) fiber bands -->
          <polygon points="${compPoly}" fill="${compFill}" />
          <polygon points="${tensPoly}" fill="${tensFill}" />
          <path d="${topPath}" fill="none" stroke="${INK}" stroke-width="2" />
          <path d="${botPath}" fill="none" stroke="${INK}" stroke-width="2" />
          <path d="${midPath}" fill="none" stroke="${INK_DIM}" stroke-width="1" stroke-dasharray="4,3" />
          <line x1="${padX}" y1="${beamY - beamH / 2}" x2="${padX}" y2="${beamY + beamH / 2}" stroke="${INK}" stroke-width="2" />
          <line x1="${padX + plotW}" y1="${beamY - beamH / 2}" x2="${padX + plotW}" y2="${beamY + beamH / 2}" stroke="${INK}" stroke-width="2" />
        `;
      } else {
        const compFill = this.showFiberColors ? 'rgba(255, 125, 97,0.22)' : 'rgba(233, 237, 245,0.10)';
        const tensFill = this.showFiberColors ? 'rgba(88, 182, 145,0.20)' : 'rgba(233, 237, 245,0.05)';
        beamSvg = `
          <rect x="${padX}" y="${beamY - beamH / 2}" width="${plotW}" height="${beamH / 2}" fill="${compFill}" />
          <rect x="${padX}" y="${beamY}" width="${plotW}" height="${beamH / 2}" fill="${tensFill}" />
          <rect x="${padX}" y="${beamY - beamH / 2}" width="${plotW}" height="${beamH}" fill="none" stroke="${INK}" stroke-width="2" />
          <line x1="${padX}" y1="${beamY}" x2="${padX + plotW}" y2="${beamY}" stroke="${INK_DIM}" stroke-width="1" stroke-dasharray="4,3" />
        `;
      }

      // Fiber stress annotation callouts when fiber colors are active
      const fiberLegendSvg = this.showFiberColors ? `
        <g font-family="Iosevka Charon Mono, monospace" font-size="9" font-weight="700">
          <rect x="${padX + 10}" y="${beamY - beamH / 2 - 14}" width="136" height="12" rx="2" fill="${PAPER}" opacity="0.88" />
          <text x="${padX + 14}" y="${beamY - beamH / 2 - 5}" fill="${VERMILION}">TOP: COMPRESSION (−σ)</text>
          <rect x="${padX + plotW - 142}" y="${beamY + beamH / 2 + 4}" width="122" height="12" rx="2" fill="${PAPER}" opacity="0.88" />
          <text x="${padX + plotW - 24}" y="${beamY + beamH / 2 + 13}" fill="${GREEN}" text-anchor="end">BOTTOM: TENSION (+σ)</text>
        </g>
      ` : '';

      // Optional 1967 book-plate numbered call-out pins
      const calloutsSvg = this.showCallouts ? `
        <g font-family="Iosevka Charon Mono, monospace" font-size="9.5" font-weight="700">
          <!-- Pin A callout -->
          <line x1="${padX - 18}" y1="${beamY + 18}" x2="${padX - 42}" y2="${beamY + 6}" stroke="${INK}" stroke-width="1" />
          <circle cx="${padX - 50}" cy="${beamY + 3}" r="9" fill="${CARD_BG}" stroke="${VERMILION}" stroke-width="1.4" />
          <text x="${padX - 50}" y="${beamY + 6.5}" fill="${VERMILION}" text-anchor="middle">1</text>

          <!-- UDL callout -->
          <circle cx="${padX + 18}" cy="${loadTopY - 12}" r="9" fill="${CARD_BG}" stroke="${VERMILION}" stroke-width="1.4" />
          <text x="${padX + 18}" y="${loadTopY - 8.5}" fill="${VERMILION}" text-anchor="middle">2</text>

          <!-- Midspan callout -->
          <circle cx="${padX + plotW / 2}" cy="${beamY + sagAmp + 22}" r="9" fill="${CARD_BG}" stroke="${VERMILION}" stroke-width="1.4" />
          <text x="${padX + plotW / 2}" y="${beamY + sagAmp + 25.5}" fill="${VERMILION}" text-anchor="middle">3</text>

          <!-- Roller B callout -->
          <line x1="${padX + plotW + 18}" y1="${beamY + 18}" x2="${padX + plotW + 42}" y2="${beamY + 6}" stroke="${INK}" stroke-width="1" />
          <circle cx="${padX + plotW + 50}" cy="${beamY + 3}" r="9" fill="${CARD_BG}" stroke="${VERMILION}" stroke-width="1.4" />
          <text x="${padX + plotW + 50}" y="${beamY + 6.5}" fill="${VERMILION}" text-anchor="middle">4</text>
        </g>
      ` : '';

      const probeYOnBeam = beamY + (sagAmp > 0 && delta_max > 1e-6 ? (solution.delta_x / delta_max) * sagAmp : 0);
      const pillX = Math.max(padX + 46, Math.min(padX + plotW - 46, probeX));

      const svg = `
        <svg viewBox="0 0 ${svgW} ${svgH}" class="diagram-svg" preserveAspectRatio="xMidYMid meet">
          <defs>
            ${surveyGridPattern('grid-fbd')}
            <pattern id="hatch-ink" width="6" height="6" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
              <line x1="0" y1="0" x2="0" y2="6" stroke="rgba(233, 237, 245,0.38)" stroke-width="1.15" />
            </pattern>
            <marker id="arrow-green-up" viewBox="0 0 10 10" refX="5" refY="2" markerWidth="6.5" markerHeight="6.5" orient="auto-start-reverse">
              <path d="M 0 9 L 5 0 L 10 9 z" fill="${GREEN}" />
            </marker>
          </defs>

          <rect width="${svgW}" height="${svgH}" fill="${PAPER}" />
          <rect width="${svgW}" height="${svgH}" fill="url(#grid-fbd)" />

          <!-- Distributed Load Block -->
          ${arrowsSvg}
          <rect x="${padX + plotW / 2 - 142}" y="13" width="284" height="22" rx="4" fill="${CARD_BG}" stroke="rgba(255, 125, 97,0.45)" stroke-width="1" />
          <text x="${padX + plotW / 2}" y="28" fill="${VERMILION}" font-size="11.5" font-weight="700" text-anchor="middle" font-family="Iosevka Charon Mono, monospace">
            w = ${w.toFixed(2)} ${wUnit} · Total W = ${W_total.toFixed(1)} ${fUnit}
          </text>

          <!-- Beam Body -->
          ${beamSvg}
          ${fiberLegendSvg}

          <!-- Left Pin Support A -->
          <g transform="translate(${padX}, ${beamY + beamH / 2})">
            <polygon points="0,1 -14,23 14,23" fill="${CARD_BG}" stroke="${INK}" stroke-width="1.8" />
            <circle cx="0" cy="1" r="3.5" fill="${CARD_BG}" stroke="${INK}" stroke-width="1.7" />
            <line x1="-20" y1="23" x2="20" y2="23" stroke="${INK}" stroke-width="1.8" />
            <rect x="-20" y="24" width="40" height="7" fill="url(#hatch-ink)" />
            <text x="-23" y="18" fill="${INK}" font-size="12" font-weight="800" text-anchor="end" font-family="GFS Didot, Georgia, serif">A</text>
            <text x="-23" y="29" fill="${INK_DIM}" font-size="8.8" font-weight="600" text-anchor="end" font-family="Iosevka Charon Mono, monospace">PIN</text>
          </g>

          <!-- Right Roller Support B -->
          <g transform="translate(${padX + plotW}, ${beamY + beamH / 2})">
            <polygon points="0,1 -14,18 14,18" fill="${CARD_BG}" stroke="${INK}" stroke-width="1.8" />
            <circle cx="0" cy="1" r="3.5" fill="${CARD_BG}" stroke="${INK}" stroke-width="1.7" />
            <circle cx="-8.5" cy="22" r="3.2" fill="${CARD_BG}" stroke="${INK}" stroke-width="1.5" />
            <circle cx="0" cy="22" r="3.2" fill="${CARD_BG}" stroke="${INK}" stroke-width="1.5" />
            <circle cx="8.5" cy="22" r="3.2" fill="${CARD_BG}" stroke="${INK}" stroke-width="1.5" />
            <line x1="-20" y1="26" x2="20" y2="26" stroke="${INK}" stroke-width="1.8" />
            <rect x="-20" y="27" width="40" height="7" fill="url(#hatch-ink)" />
            <text x="23" y="18" fill="${INK}" font-size="12" font-weight="800" text-anchor="start" font-family="GFS Didot, Georgia, serif">B</text>
            <text x="23" y="29" fill="${INK_DIM}" font-size="8.8" font-weight="600" text-anchor="start" font-family="Iosevka Charon Mono, monospace">ROLLER</text>
          </g>

          <!-- Support Reactions RA & RB (explicit symmetric upward arrowheads) -->
          <line x1="${padX}" y1="${beamY + 73}" x2="${padX}" y2="${beamY + 51}" stroke="${GREEN}" stroke-width="2.4" />
          <polygon points="${padX},${beamY + 43} ${padX - 5},${beamY + 53} ${padX + 5},${beamY + 53}" fill="${GREEN}" />
          <rect x="${padX - 58}" y="${beamY + 76}" width="116" height="19" rx="4" fill="${CARD_BG}" stroke="rgba(88, 182, 145,0.45)" stroke-width="1" />
          <text x="${padX}" y="${beamY + 89}" fill="${GREEN}" font-size="10.8" font-weight="700" text-anchor="middle" font-family="Iosevka Charon Mono, monospace">
            RA = ${R_A.toFixed(2)} ${fUnit}
          </text>

          <line x1="${padX + plotW}" y1="${beamY + 73}" x2="${padX + plotW}" y2="${beamY + 51}" stroke="${GREEN}" stroke-width="2.4" />
          <polygon points="${padX + plotW},${beamY + 43} ${padX + plotW - 5},${beamY + 53} ${padX + plotW + 5},${beamY + 53}" fill="${GREEN}" />
          <rect x="${padX + plotW - 58}" y="${beamY + 76}" width="116" height="19" rx="4" fill="${CARD_BG}" stroke="rgba(88, 182, 145,0.45)" stroke-width="1" />
          <text x="${padX + plotW}" y="${beamY + 89}" fill="${GREEN}" font-size="10.8" font-weight="700" text-anchor="middle" font-family="Iosevka Charon Mono, monospace">
            RB = ${R_B.toFixed(2)} ${fUnit}
          </text>

          <!-- Span Dimension Line L -->
          <g transform="translate(0, ${beamY + 62})">
            <line x1="${padX + 16}" y1="0" x2="${padX + plotW - 16}" y2="0" stroke="${INK_MUTED}" stroke-width="1.15" />
            <line x1="${padX + 16}" y1="-4" x2="${padX + 16}" y2="4" stroke="${INK_MUTED}" stroke-width="1.3" />
            <line x1="${padX + plotW - 16}" y1="-4" x2="${padX + plotW - 16}" y2="4" stroke="${INK_MUTED}" stroke-width="1.3" />
            <rect x="${padX + plotW / 2 - 48}" y="-9.5" width="96" height="19" rx="4" fill="${CARD_BG}" stroke="rgba(233, 237, 245,0.22)" stroke-width="1" />
            <text x="${padX + plotW / 2}" y="3.5" fill="${INK}" font-size="11" font-weight="700" text-anchor="middle" font-family="Iosevka Charon Mono, monospace">
              L = ${L.toFixed(2)} ${lUnit}
            </text>
          </g>

          ${calloutsSvg}

          <!-- Interactive Probe Cursor -->
          <line x1="${probeX.toFixed(1)}" y1="36" x2="${probeX.toFixed(1)}" y2="${svgH - 22}" stroke="${OCHRE}" stroke-width="1.6" stroke-dasharray="4,3" />
          <circle cx="${probeX.toFixed(1)}" cy="${probeYOnBeam.toFixed(1)}" r="5.5" fill="${OCHRE}" stroke="${CARD_BG}" stroke-width="2" />
          <rect x="${(pillX - 48).toFixed(1)}" y="${svgH - 22}" width="96" height="18" rx="4" fill="${CARD_BG}" stroke="${OCHRE}" stroke-width="1.3" />
          <text x="${pillX.toFixed(1)}" y="${svgH - 9.5}" fill="${OCHRE}" font-size="10.5" font-weight="700" text-anchor="middle" font-family="Iosevka Charon Mono, monospace">
            x = ${x.toFixed(2)} ${lUnit}
          </text>
        </svg>
      `;

      this.containerFBD.innerHTML = svg;
    }

    /**
     * 2. Shear Force Diagram (SFD)
     */
    renderSFD(solution) {
      if (!this.containerSFD) return;
      const { L, V_max, V_x, x, unit } = solution;
      const fUnit = unit === 'metric' ? 'kN' : 'lbf';

      const svgW = 760;
      const svgH = 148;
      const padX = 78;
      const plotW = svgW - 2 * padX;
      const midY = 76;
      const amp = 48;
      const scaleY = V_max > 1e-4 ? amp / V_max : 1;

      const yLeft = midY - V_max * scaleY;
      const yRight = midY + V_max * scaleY;
      const xZero = padX + plotW / 2;

      const polyPos = `${padX},${midY} ${padX},${yLeft} ${xZero},${midY}`;
      const polyNeg = `${xZero},${midY} ${padX + plotW},${yRight} ${padX + plotW},${midY}`;

      const probeX = padX + (x / L) * plotW;
      const probeY = midY - V_x * scaleY;
      const badgeW = 128;
      const badgeX = probeX > svgW - padX - badgeW - 14 ? probeX - badgeW - 10 : probeX + 10;
      const badgeY = Math.max(24, Math.min(svgH - 22, probeY));
      const signStr = V_x > 0.005 ? '+' : '';

      const svg = `
        <svg viewBox="0 0 ${svgW} ${svgH}" class="diagram-svg" preserveAspectRatio="xMidYMid meet">
          <defs>${surveyGridPattern('grid-sfd')}</defs>
          <rect width="${svgW}" height="${svgH}" fill="${PAPER}" />
          <rect width="${svgW}" height="${svgH}" fill="url(#grid-sfd)" />

          <!-- Zero axis -->
          <line x1="${padX}" y1="${midY}" x2="${padX + plotW}" y2="${midY}" stroke="${INK}" stroke-width="1.35" />
          <line x1="${padX}" y1="${midY - amp - 8}" x2="${padX}" y2="${midY + amp + 8}" stroke="rgba(233, 237, 245,0.22)" stroke-width="1" />
          <line x1="${padX + plotW}" y1="${midY - amp - 8}" x2="${padX + plotW}" y2="${midY + amp + 8}" stroke="rgba(233, 237, 245,0.22)" stroke-width="1" />

          <!-- Positive & Negative Shear Triangles -->
          <polygon points="${polyPos}" fill="rgba(88, 182, 145,0.16)" stroke="${GREEN}" stroke-width="1.6" />
          <polygon points="${polyNeg}" fill="rgba(255, 125, 97,0.16)" stroke="${VERMILION}" stroke-width="1.6" />

          <!-- Shear Gradient Line -->
          <line x1="${padX}" y1="${yLeft}" x2="${padX + plotW}" y2="${yRight}" stroke="${INK}" stroke-width="2.2" />

          <!-- Signs inside triangles -->
          <text x="${padX + plotW * 0.14}" y="${midY - 12}" fill="${GREEN}" font-size="13" font-weight="800" text-anchor="middle" font-family="Iosevka Charon Mono, monospace">+</text>
          <text x="${padX + plotW * 0.86}" y="${midY + 21}" fill="${VERMILION}" font-size="14" font-weight="800" text-anchor="middle" font-family="Iosevka Charon Mono, monospace">−</text>

          <!-- Boundary Values -->
          <text x="${padX - 8}" y="${yLeft + 4}" fill="${GREEN}" font-size="11" font-weight="700" text-anchor="end" font-family="Iosevka Charon Mono, monospace">+${V_max.toFixed(1)}</text>
          <text x="${padX + plotW + 8}" y="${yRight + 4}" fill="${VERMILION}" font-size="11" font-weight="700" text-anchor="start" font-family="Iosevka Charon Mono, monospace">−${V_max.toFixed(1)}</text>

          <!-- Zero Crossing Marker -->
          <circle cx="${xZero}" cy="${midY}" r="3.5" fill="${CARD_BG}" stroke="${INK}" stroke-width="1.6" />
          <line x1="${xZero}" y1="${midY - 5}" x2="${xZero}" y2="${midY - 26}" stroke="rgba(233, 237, 245,0.32)" stroke-width="1" stroke-dasharray="2,2" />
          <text x="${xZero}" y="${midY - 30}" fill="${INK_MUTED}" font-size="9.5" font-weight="700" text-anchor="middle" font-family="Iosevka Charon Mono, monospace">V = 0 at L/2 (M peaks here)</text>

          <!-- Probe -->
          <line x1="${probeX.toFixed(1)}" y1="8" x2="${probeX.toFixed(1)}" y2="${svgH - 8}" stroke="${OCHRE}" stroke-width="1.5" stroke-dasharray="3,3" />
          <circle cx="${probeX.toFixed(1)}" cy="${probeY.toFixed(1)}" r="4.8" fill="${OCHRE}" stroke="${CARD_BG}" stroke-width="1.8" />

          <g transform="translate(${badgeX.toFixed(1)}, ${badgeY.toFixed(1)})">
            <rect x="0" y="-12" width="${badgeW}" height="23" rx="4" fill="${CARD_BG}" stroke="${OCHRE}" stroke-width="1.2" />
            <text x="7" y="3.5" fill="${INK}" font-size="10.5" font-weight="700" font-family="Iosevka Charon Mono, monospace">
              V(x) = ${signStr}${V_x.toFixed(2)} ${fUnit}
            </text>
          </g>
        </svg>
      `;

      this.containerSFD.innerHTML = svg;
    }

    /**
     * 3. Bending Moment Diagram (BMD)
     */
    renderBMD(solution, points) {
      if (!this.containerBMD) return;
      const { L, M_max, M_x, x, unit } = solution;
      const mUnit = unit === 'metric' ? 'kNm' : 'lbf·ft';

      const svgW = 760;
      const svgH = 152;
      const padX = 78;
      const plotW = svgW - 2 * padX;

      const baselineY = this.momentTensionBottom ? 28 : 124;
      const amp = 88;
      const scaleY = M_max > 1e-4 ? amp / M_max : 1;
      const dir = this.momentTensionBottom ? 1 : -1;

      let pathD = `M ${padX} ${baselineY}`;
      let polyPts = `${padX},${baselineY}`;
      points.forEach((pt) => {
        const cx = padX + pt.x_rel * plotW;
        const cy = baselineY + dir * pt.M * scaleY;
        pathD += ` L ${cx.toFixed(1)} ${cy.toFixed(1)}`;
        polyPts += ` ${cx.toFixed(1)},${cy.toFixed(1)}`;
      });
      polyPts += ` ${padX + plotW},${baselineY}`;

      const midX = padX + plotW / 2;
      const peakY = baselineY + dir * M_max * scaleY;
      const probeX = padX + (x / L) * plotW;
      const probeY = baselineY + dir * M_x * scaleY;

      const badgeW = 144;
      const badgeX = probeX > svgW - padX - badgeW - 14 ? probeX - badgeW - 10 : probeX + 10;
      // Offset upward near bottom peak so Mmax text below peak is never covered
      const nearPeak = Math.abs(x / L - 0.5) < 0.14;
      const rawBadgeY = nearPeak ? probeY - dir * 24 : probeY;
      const badgeY = Math.max(24, Math.min(svgH - 22, rawBadgeY));

      const convLabel = this.momentTensionBottom
        ? 'TENSION SIDE DOWN (EUROCODE)'
        : 'MATHEMATICAL SIGN (+ UP)';

      const svg = `
        <svg viewBox="0 0 ${svgW} ${svgH}" class="diagram-svg" preserveAspectRatio="xMidYMid meet">
          <defs>${surveyGridPattern('grid-bmd')}</defs>
          <rect width="${svgW}" height="${svgH}" fill="${PAPER}" />
          <rect width="${svgW}" height="${svgH}" fill="url(#grid-bmd)" />

          <!-- Zero baseline -->
          <line x1="${padX}" y1="${baselineY}" x2="${padX + plotW}" y2="${baselineY}" stroke="${INK}" stroke-width="1.35" />

          <!-- Convention corner note -->
          <text x="${padX + plotW}" y="${this.momentTensionBottom ? 17 : svgH - 8}" fill="${INK_DIM}" font-size="9" font-weight="700" text-anchor="end" font-family="Iosevka Charon Mono, monospace">
            ${convLabel}
          </text>

          <!-- Parabolic area & curve -->
          <polygon points="${polyPts}" fill="rgba(255, 125, 97,0.14)" />
          <path d="${pathD}" fill="none" stroke="${VERMILION}" stroke-width="2.4" />

          <!-- Vertical Peak Reference -->
          <line x1="${midX}" y1="${baselineY}" x2="${midX}" y2="${peakY}" stroke="rgba(255, 125, 97,0.45)" stroke-width="1.1" stroke-dasharray="3,2" />
          <circle cx="${midX}" cy="${peakY}" r="4.2" fill="${VERMILION}" stroke="${CARD_BG}" stroke-width="1.5" />
          <text x="${midX}" y="${this.momentTensionBottom ? peakY + 16 : peakY - 9}" fill="${VERMILION}" font-size="11" font-weight="700" text-anchor="middle" font-family="Iosevka Charon Mono, monospace">
            Mmax = ${M_max.toFixed(2)} ${mUnit} (wL²/8)
          </text>

          <!-- Zero end labels -->
          <text x="${padX - 8}" y="${baselineY + 4}" fill="${INK_DIM}" font-size="10" font-weight="600" text-anchor="end" font-family="Iosevka Charon Mono, monospace">0</text>
          <text x="${padX + plotW + 8}" y="${baselineY + 4}" fill="${INK_DIM}" font-size="10" font-weight="600" text-anchor="start" font-family="Iosevka Charon Mono, monospace">0</text>

          <!-- Probe -->
          <line x1="${probeX.toFixed(1)}" y1="8" x2="${probeX.toFixed(1)}" y2="${svgH - 8}" stroke="${OCHRE}" stroke-width="1.5" stroke-dasharray="3,3" />
          <circle cx="${probeX.toFixed(1)}" cy="${probeY.toFixed(1)}" r="4.8" fill="${OCHRE}" stroke="${CARD_BG}" stroke-width="1.8" />

          <g transform="translate(${badgeX.toFixed(1)}, ${badgeY.toFixed(1)})">
            <rect x="0" y="-12" width="${badgeW}" height="23" rx="4" fill="${CARD_BG}" stroke="${OCHRE}" stroke-width="1.2" />
            <text x="7" y="3.5" fill="${INK}" font-size="10.5" font-weight="700" font-family="Iosevka Charon Mono, monospace">
              M(x) = ${M_x.toFixed(2)} ${mUnit}
            </text>
          </g>
        </svg>
      `;

      this.containerBMD.innerHTML = svg;
    }

    /**
     * 4. Elastic Deflection Curve (δ(x) + Support Slope Tangents θ + L/300 Limit)
     */
    renderDeflection(solution, points) {
      if (!this.containerDeflection) return;
      const { L, delta_max, delta_x, x, ratio_max, deflLimit300, serviceOk, theta_A_deg, unit } = solution;
      const dUnit = unit === 'metric' ? 'mm' : 'in';

      const svgW = 760;
      const svgH = 152;
      const padX = 78;
      const plotW = svgW - 2 * padX;
      const baselineY = 30;
      const amp = 82;

      // Scale so both curve and L/300 limit (when close) are well framed
      const maxRef = Math.max(delta_max, deflLimit300 * 0.65, 1e-5);
      const scaleY = amp / Math.max(delta_max, 1e-5);
      const limitY = baselineY + deflLimit300 * scaleY;
      const showLimitLine = delta_max > 1e-5 && limitY <= svgH - 12 && limitY >= baselineY + 12;

      let pathD = `M ${padX} ${baselineY}`;
      let polyPts = `${padX},${baselineY}`;
      points.forEach((pt) => {
        const cx = padX + pt.x_rel * plotW;
        const cy = baselineY + pt.delta * scaleY;
        pathD += ` L ${cx.toFixed(1)} ${cy.toFixed(1)}`;
        polyPts += ` ${cx.toFixed(1)},${cy.toFixed(1)}`;
      });
      polyPts += ` ${padX + plotW},${baselineY}`;

      const midX = padX + plotW / 2;
      const peakY = baselineY + delta_max * scaleY;
      const probeX = padX + (x / L) * plotW;
      const probeY = baselineY + delta_x * scaleY;

      // Support slope tangent illustration at A (slope at x=0 is 16/5 * delta_max / L in plot coords)
      const tangentLen = 78;
      const visualSlope = delta_max > 1e-5 ? (3.2 * (delta_max * scaleY)) / plotW : 0;
      const tanEndX = padX + tangentLen;
      const tanEndY = Math.min(svgH - 12, baselineY + tangentLen * visualSlope);

      const badgeW = 144;
      const badgeX = probeX > svgW - padX - badgeW - 14 ? probeX - badgeW - 10 : probeX + 10;
      const nearPeak = Math.abs(x / L - 0.5) < 0.14;
      const rawBadgeY = nearPeak ? probeY - 24 : probeY;
      const badgeY = Math.max(24, Math.min(svgH - 22, rawBadgeY));
      const curveColor = serviceOk ? INK : CRIMSON;
      const fillColor = serviceOk ? 'rgba(237, 134, 75,0.12)' : 'rgba(255, 105, 93,0.14)';

      const limitSvg = showLimitLine ? `
        <line x1="${padX}" y1="${limitY.toFixed(1)}" x2="${padX + plotW}" y2="${limitY.toFixed(1)}" stroke="${serviceOk ? GREEN : CRIMSON}" stroke-width="1.2" stroke-dasharray="5,4" />
        <text x="${padX + plotW - 4}" y="${(limitY - 4).toFixed(1)}" fill="${serviceOk ? GREEN : CRIMSON}" font-size="9.2" font-weight="700" text-anchor="end" font-family="Iosevka Charon Mono, monospace">
          L/300 limit (${deflLimit300.toFixed(2)} ${dUnit})
        </text>
      ` : '';

      const svg = `
        <svg viewBox="0 0 ${svgW} ${svgH}" class="diagram-svg" preserveAspectRatio="xMidYMid meet">
          <defs>${surveyGridPattern('grid-def')}</defs>
          <rect width="${svgW}" height="${svgH}" fill="${PAPER}" />
          <rect width="${svgW}" height="${svgH}" fill="url(#grid-def)" />

          <!-- Unloaded Beam Baseline -->
          <line x1="${padX}" y1="${baselineY}" x2="${padX + plotW}" y2="${baselineY}" stroke="${INK_DIM}" stroke-width="1.35" stroke-dasharray="5,4" />

          <!-- L/300 Serviceability Benchmark -->
          ${limitSvg}

          <!-- Elastic Deflection Area & Curve -->
          <polygon points="${polyPts}" fill="${fillColor}" />
          <path d="${pathD}" fill="none" stroke="${curveColor}" stroke-width="2.4" />

          <!-- Support Rotation Tangent θ_A -->
          ${delta_max > 1e-5 ? `
            <line x1="${padX}" y1="${baselineY}" x2="${tanEndX.toFixed(1)}" y2="${tanEndY.toFixed(1)}" stroke="${OCHRE}" stroke-width="1.25" stroke-dasharray="3,2" />
            <text x="${padX + 24}" y="${(baselineY + 13).toFixed(1)}" fill="${OCHRE}" font-size="9.5" font-weight="700" font-family="Iosevka Charon Mono, monospace">θA = ${theta_A_deg.toFixed(2)}°</text>
          ` : ''}

          <!-- Peak Deflection Callout -->
          <line x1="${midX}" y1="${baselineY}" x2="${midX}" y2="${peakY}" stroke="${curveColor}" stroke-width="1.2" stroke-dasharray="2,2" />
          <circle cx="${midX}" cy="${peakY}" r="4.2" fill="${curveColor}" stroke="${CARD_BG}" stroke-width="1.5" />
          <text x="${midX}" y="${peakY + 16}" fill="${curveColor}" font-size="11" font-weight="700" text-anchor="middle" font-family="Iosevka Charon Mono, monospace">
            δmax = ${delta_max.toFixed(2)} ${dUnit} (L / ${ratio_max > 9999 ? '∞' : ratio_max}) ${serviceOk ? '· PASS' : '· > L/300'}
          </text>

          <!-- Probe -->
          <line x1="${probeX.toFixed(1)}" y1="8" x2="${probeX.toFixed(1)}" y2="${svgH - 8}" stroke="${OCHRE}" stroke-width="1.5" stroke-dasharray="3,3" />
          <circle cx="${probeX.toFixed(1)}" cy="${probeY.toFixed(1)}" r="4.8" fill="${OCHRE}" stroke="${CARD_BG}" stroke-width="1.8" />

          <g transform="translate(${badgeX.toFixed(1)}, ${badgeY.toFixed(1)})">
            <rect x="0" y="-12" width="${badgeW}" height="23" rx="4" fill="${CARD_BG}" stroke="${OCHRE}" stroke-width="1.2" />
            <text x="7" y="3.5" fill="${INK}" font-size="10.5" font-weight="700" font-family="Iosevka Charon Mono, monospace">
              δ(x) = ${delta_x.toFixed(2)} ${dUnit}
            </text>
          </g>
        </svg>
      `;

      this.containerDeflection.innerHTML = svg;
    }

    /**
     * 5. Method-of-Sections Free-Body Cut Plate at Probe x
     * Makes internal Shear V(x) and Bending Moment M(x) physically intuitive!
     */
    renderCutSection(solution) {
      if (!this.containerCut) return;
      const { L, w, x, x_rel, R_A, V_x, M_x, unit } = solution;
      const fUnit = unit === 'metric' ? 'kN' : 'lbf';
      const mUnit = unit === 'metric' ? 'kNm' : 'lbf·ft';
      const lUnit = unit === 'metric' ? 'm' : 'ft';

      const svgW = 460;
      const svgH = 196;
      const leftX = 54;
      const maxSegW = 246;
      const segW = Math.max(46, Math.min(maxSegW, Math.max(0.18, x_rel) * maxSegW));
      const cutX = leftX + segW;
      const beamY = 98;
      const beamH = 26;
      const partialW = w * x;

      // Partial UDL arrows over [0..x]
      const nArr = Math.max(3, Math.round(segW / 24));
      let udlSvg = '';
      if (x > 1e-4 && w > 0) {
        udlSvg += `<rect x="${leftX}" y="44" width="${segW}" height="${beamY - beamH / 2 - 48}" fill="rgba(255, 125, 97,0.09)" />`;
        udlSvg += `<line x1="${leftX}" y1="44" x2="${cutX}" y2="44" stroke="${VERMILION}" stroke-width="1.8" />`;
        for (let i = 0; i <= nArr; i++) {
          const ax = leftX + (i / nArr) * segW;
          udlSvg += `
            <line x1="${ax.toFixed(1)}" y1="44" x2="${ax.toFixed(1)}" y2="${beamY - beamH / 2 - 7}" stroke="${VERMILION}" stroke-width="1.2" />
            <polygon points="${(ax - 2.6).toFixed(1)},${beamY - beamH / 2 - 9} ${(ax + 2.6).toFixed(1)},${beamY - beamH / 2 - 9} ${ax.toFixed(1)},${beamY - beamH / 2 - 4}" fill="${VERMILION}" />
          `;
        }
        udlSvg += `
          <text x="${(leftX + segW / 2).toFixed(1)}" y="37" fill="${VERMILION}" font-size="9.5" font-weight="700" text-anchor="middle" font-family="Iosevka Charon Mono, monospace">
            w·x = ${partialW.toFixed(1)} ${fUnit}
          </text>
        `;
      }

      // Jagged break line at cut face
      const bTop = beamY - beamH / 2;
      const bBot = beamY + beamH / 2;
      const zig = `M ${cutX} ${bTop} L ${cutX + 4} ${bTop + 6} L ${cutX - 4} ${bTop + 13} L ${cutX + 4} ${bTop + 20} L ${cutX} ${bBot}`;

      // Shear V(x) arrow direction at right cut face (positive V points DOWN on right cut face)
      const vPos = V_x >= 0;
      const vColor = Math.abs(V_x) < 0.05 ? INK_DIM : (vPos ? GREEN : VERMILION);
      const vArrowX = cutX + 18;
      const vArrowSvg = Math.abs(V_x) < 0.05
        ? `
          <circle cx="${vArrowX}" cy="${beamY}" r="3.4" fill="${INK_DIM}" />
          <text x="${vArrowX}" y="${beamY + 42}" fill="${INK_DIM}" font-size="9.5" font-weight="700" font-family="Iosevka Charon Mono, monospace">V(x) ≈ 0 (midspan)</text>
        `
        : vPos
          ? `
            <line x1="${vArrowX}" y1="${beamY - 24}" x2="${vArrowX}" y2="${beamY + 20}" stroke="${vColor}" stroke-width="2.3" />
            <polygon points="${vArrowX},${beamY + 28} ${vArrowX - 4.5},${beamY + 18} ${vArrowX + 4.5},${beamY + 18}" fill="${vColor}" />
            <text x="${vArrowX + 10}" y="${beamY + 34}" fill="${vColor}" font-size="10" font-weight="700" font-family="Iosevka Charon Mono, monospace">V(x) = +${V_x.toFixed(1)} ${fUnit}</text>
            <text x="${vArrowX + 10}" y="${beamY + 46}" fill="${INK_DIM}" font-size="8.4" font-family="Iosevka Charon Mono, monospace">pulls down to balance RA</text>
          `
          : `
            <line x1="${vArrowX}" y1="${beamY + 24}" x2="${vArrowX}" y2="${beamY - 20}" stroke="${vColor}" stroke-width="2.3" />
            <polygon points="${vArrowX},${beamY - 28} ${vArrowX - 4.5},${beamY - 18} ${vArrowX + 4.5},${beamY - 18}" fill="${vColor}" />
            <text x="${vArrowX + 10}" y="${beamY - 26}" fill="${vColor}" font-size="10" font-weight="700" font-family="Iosevka Charon Mono, monospace">V(x) = ${V_x.toFixed(1)} ${fUnit}</text>
            <text x="${vArrowX + 10}" y="${beamY - 14}" fill="${INK_DIM}" font-size="8.4" font-family="Iosevka Charon Mono, monospace">pushes up (w·x > RA)</text>
          `;

      // Internal Moment M(x) curved CCW arrow + C/T fiber couple
      const mSvg = M_x > 0.01 ? `
        <path d="M ${cutX + 36} ${beamY + 20} A 24 24 0 0 0 ${cutX + 36} ${beamY - 20}" fill="none" stroke="${VERMILION}" stroke-width="2.2" marker-end="url(#cut-arrow-m)" />
        <text x="${cutX + 58}" y="${beamY + 4}" fill="${VERMILION}" font-size="10.2" font-weight="700" font-family="Iosevka Charon Mono, monospace">M(x) = ${M_x.toFixed(1)} ${mUnit}</text>
        <!-- Internal C (top compression left) and T (bottom tension right) -->
        <line x1="${cutX - 4}" y1="${beamY - 7}" x2="${cutX - 24}" y2="${beamY - 7}" stroke="${VERMILION}" stroke-width="1.8" marker-end="url(#cut-arrow-c)" />
        <text x="${cutX - 28}" y="${beamY - 4}" fill="${VERMILION}" font-size="9" font-weight="800" text-anchor="end" font-family="Iosevka Charon Mono, monospace">C</text>
        <line x1="${cutX - 24}" y1="${beamY + 7}" x2="${cutX - 4}" y2="${beamY + 7}" stroke="${GREEN}" stroke-width="1.8" marker-end="url(#cut-arrow-t)" />
        <text x="${cutX - 28}" y="${beamY + 10}" fill="${GREEN}" font-size="9" font-weight="800" text-anchor="end" font-family="Iosevka Charon Mono, monospace">T</text>
      ` : `
        <text x="${cutX + 14}" y="${beamY - 24}" fill="${INK_DIM}" font-size="9.5" font-weight="700" font-family="Iosevka Charon Mono, monospace">M(x) = 0 (at support)</text>
      `;

      const svg = `
        <svg viewBox="0 0 ${svgW} ${svgH}" class="diagram-svg" preserveAspectRatio="xMidYMid meet">
          <defs>
            ${surveyGridPattern('grid-cut')}
            <marker id="cut-arrow-ra" viewBox="0 0 10 10" refX="5" refY="2" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 9 L 5 0 L 10 9 z" fill="${GREEN}" />
            </marker>
            <marker id="cut-arrow-vpos" viewBox="0 0 10 10" refX="5" refY="8" markerWidth="6" markerHeight="6" orient="auto">
              <path d="M 0 1 L 5 9 L 10 1 z" fill="${GREEN}" />
            </marker>
            <marker id="cut-arrow-vneg" viewBox="0 0 10 10" refX="5" refY="2" markerWidth="6" markerHeight="6" orient="auto">
              <path d="M 0 9 L 5 0 L 10 9 z" fill="${VERMILION}" />
            </marker>
            <marker id="cut-arrow-m" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="5.5" markerHeight="5.5" orient="auto">
              <path d="M 0 1 L 9 5 L 0 9 z" fill="${VERMILION}" />
            </marker>
            <marker id="cut-arrow-c" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="4.8" markerHeight="4.8" orient="auto">
              <path d="M 0 1 L 9 5 L 0 9 z" fill="${VERMILION}" />
            </marker>
            <marker id="cut-arrow-t" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="4.8" markerHeight="4.8" orient="auto">
              <path d="M 0 1 L 9 5 L 0 9 z" fill="${GREEN}" />
            </marker>
          </defs>

          <rect width="${svgW}" height="${svgH}" fill="${PAPER}" />
          <rect width="${svgW}" height="${svgH}" fill="url(#grid-cut)" />

          <!-- Plate Title -->
          <text x="12" y="17" fill="${INK}" font-size="10.2" font-weight="700" font-family="Iosevka Charon Mono, monospace">
            METHOD-OF-SECTIONS CUT AT x = ${x.toFixed(2)} ${lUnit} (${(x_rel * 100).toFixed(0)}% L)
          </text>

          ${udlSvg}

          <!-- Left Beam Segment [0..x] -->
          <rect x="${leftX}" y="${bTop}" width="${segW}" height="${beamH / 2}" fill="rgba(255, 125, 97,0.16)" />
          <rect x="${leftX}" y="${beamY}" width="${segW}" height="${beamH / 2}" fill="rgba(88, 182, 145,0.14)" />
          <line x1="${leftX}" y1="${bTop}" x2="${cutX}" y2="${bTop}" stroke="${INK}" stroke-width="2" />
          <line x1="${leftX}" y1="${bBot}" x2="${cutX}" y2="${bBot}" stroke="${INK}" stroke-width="2" />
          <line x1="${leftX}" y1="${bTop}" x2="${leftX}" y2="${bBot}" stroke="${INK}" stroke-width="2" />
          <path d="${zig}" fill="none" stroke="${OCHRE}" stroke-width="2.2" />
          <line x1="${leftX}" y1="${beamY}" x2="${cutX}" y2="${beamY}" stroke="${INK_DIM}" stroke-width="1" stroke-dasharray="4,3" />

          <!-- Reaction RA at left end (explicit upward arrowhead) -->
          <line x1="${leftX}" y1="${bBot + 42}" x2="${leftX}" y2="${bBot + 11}" stroke="${GREEN}" stroke-width="2.2" />
          <polygon points="${leftX},${bBot + 3} ${leftX - 4.5},${bBot + 12} ${leftX + 4.5},${bBot + 12}" fill="${GREEN}" />
          <text x="${leftX}" y="${bBot + 55}" fill="${GREEN}" font-size="10" font-weight="700" text-anchor="middle" font-family="Iosevka Charon Mono, monospace">
            RA = ${R_A.toFixed(1)} ${fUnit}
          </text>

          <!-- Dimension 0..x -->
          <line x1="${leftX}" y1="${bBot + 24}" x2="${cutX}" y2="${bBot + 24}" stroke="${INK_MUTED}" stroke-width="1.1" />
          <line x1="${leftX}" y1="${bBot + 20}" x2="${leftX}" y2="${bBot + 28}" stroke="${INK_MUTED}" stroke-width="1.2" />
          <line x1="${cutX}" y1="${bBot + 20}" x2="${cutX}" y2="${bBot + 28}" stroke="${INK_MUTED}" stroke-width="1.2" />
          <rect x="${(leftX + segW / 2 - 26).toFixed(1)}" y="${bBot + 16}" width="52" height="15" rx="3" fill="${CARD_BG}" stroke="rgba(233, 237, 245,0.2)" />
          <text x="${(leftX + segW / 2).toFixed(1)}" y="${bBot + 26.5}" fill="${INK}" font-size="9.5" font-weight="700" text-anchor="middle" font-family="Iosevka Charon Mono, monospace">
            ${x.toFixed(2)} ${lUnit}
          </text>

          <!-- Internal Forces on Exposed Cut Face -->
          ${vArrowSvg}
          ${mSvg}

          <!-- Bottom equilibrium equation strip -->
          <text x="12" y="${svgH - 8}" fill="${INK_DIM}" font-size="9" font-weight="600" font-family="Iosevka Charon Mono, monospace">
            ΣFy = 0 ⇒ RA − w·x − V(x) = 0   |   ΣMcut = 0 ⇒ M(x) = RA·x − ½w·x²
          </text>
        </svg>
      `;

      this.containerCut.innerHTML = svg;
    }

    /**
     * 6. Live Cross-Section Shape + Linear Bending Stress Profile σ(y) at Probe x
     */
    renderCrossSection(solution, secProp) {
      if (!this.containerSection || !secProp) return;
      const { sigma_x, sigma_max, yieldVal, unit } = solution;
      const sUnit = unit === 'metric' ? 'MPa' : 'ksi';
      const lUnit = unit === 'metric' ? 'mm' : 'in';
      const g = secProp.geom || { type: 'rect', b: 100, h: 200 };

      const svgW = 460;
      const svgH = 196;
      const secCx = 104;
      const secCy = 104;
      const maxDrawH = 112;
      const maxDrawW = 104;

      const rawH = Math.max(1e-3, g.h || g.D || g.d || 200);
      const rawW = Math.max(1e-3, g.b || g.D || g.d || rawH * 0.6);
      const scale = Math.min(maxDrawH / rawH, maxDrawW / rawW);
      const drawH = rawH * scale;
      const drawW = rawW * scale;

      let shapeSvg = '';
      if (g.type === 'i_beam') {
        const tf = Math.max(4, (g.tf || rawH * 0.06) * scale);
        const tw = Math.max(4, (g.tw || rawW * 0.08) * scale);
        const x0 = secCx - drawW / 2;
        const y0 = secCy - drawH / 2;
        const wx0 = secCx - tw / 2;
        const pathI = `
          M ${x0} ${y0}
          h ${drawW} v ${tf}
          h ${-(drawW - tw) / 2} v ${drawH - 2 * tf}
          h ${(drawW - tw) / 2} v ${tf}
          h ${-drawW} v ${-tf}
          h ${(drawW - tw) / 2} v ${-(drawH - 2 * tf)}
          h ${-(drawW - tw) / 2} Z
        `;
        shapeSvg = `<path d="${pathI}" fill="url(#sec-hatch)" stroke="${INK}" stroke-width="1.9" />`;
      } else if (g.type === 'hollow_rect') {
        const t = Math.max(3, (g.t || rawH * 0.06) * scale);
        const x0 = secCx - drawW / 2;
        const y0 = secCy - drawH / 2;
        shapeSvg = `
          <rect x="${x0}" y="${y0}" width="${drawW}" height="${drawH}" fill="url(#sec-hatch)" stroke="${INK}" stroke-width="1.9" />
          <rect x="${x0 + t}" y="${y0 + t}" width="${Math.max(2, drawW - 2 * t)}" height="${Math.max(2, drawH - 2 * t)}" fill="${PAPER}" stroke="${INK}" stroke-width="1.5" />
        `;
      } else if (g.type === 'round_solid') {
        const r = drawH / 2;
        shapeSvg = `<circle cx="${secCx}" cy="${secCy}" r="${r}" fill="url(#sec-hatch)" stroke="${INK}" stroke-width="1.9" />`;
      } else if (g.type === 'round_tube') {
        const rOut = drawH / 2;
        const t = Math.max(3, (g.t || rawH * 0.08) * scale);
        const rIn = Math.max(2, rOut - t);
        shapeSvg = `
          <circle cx="${secCx}" cy="${secCy}" r="${rOut}" fill="url(#sec-hatch)" stroke="${INK}" stroke-width="1.9" />
          <circle cx="${secCx}" cy="${secCy}" r="${rIn}" fill="${PAPER}" stroke="${INK}" stroke-width="1.5" />
        `;
      } else {
        // rect or custom
        const x0 = secCx - drawW / 2;
        const y0 = secCy - drawH / 2;
        shapeSvg = `<rect x="${x0}" y="${y0}" width="${drawW}" height="${drawH}" fill="url(#sec-hatch)" stroke="${INK}" stroke-width="1.9" />`;
      }

      // Linear Bending Stress Distribution σ(y) aligned vertically with the cross-section!
      const stressAxisX = 310;
      const maxStressBarW = 86;
      const refStress = Math.max(yieldVal * 1.15, sigma_max * 1.08, 1);
      const curBarW = (sigma_x / refStress) * maxStressBarW;
      const fyBarW = (yieldVal / refStress) * maxStressBarW;
      const topY = secCy - drawH / 2;
      const botY = secCy + drawH / 2;
      const exceedsAtX = sigma_x > yieldVal;

      const stressSvg = `
        <!-- Stress Baseline (σ = 0 vertical axis) -->
        <line x1="${stressAxisX}" y1="${topY - 8}" x2="${stressAxisX}" y2="${botY + 8}" stroke="${INK}" stroke-width="1.5" />

        <!-- ±fy Yield Limit Fence -->
        <line x1="${(stressAxisX - fyBarW).toFixed(1)}" y1="${topY - 6}" x2="${(stressAxisX - fyBarW).toFixed(1)}" y2="${botY + 6}" stroke="${CRIMSON}" stroke-width="1.1" stroke-dasharray="3,3" opacity="0.7" />
        <line x1="${(stressAxisX + fyBarW).toFixed(1)}" y1="${topY - 6}" x2="${(stressAxisX + fyBarW).toFixed(1)}" y2="${botY + 6}" stroke="${CRIMSON}" stroke-width="1.1" stroke-dasharray="3,3" opacity="0.7" />
        <text x="${(stressAxisX - fyBarW).toFixed(1)}" y="${topY - 10}" fill="${CRIMSON}" font-size="8.5" font-weight="700" text-anchor="middle" font-family="Iosevka Charon Mono, monospace">−fy</text>
        <text x="${(stressAxisX + fyBarW).toFixed(1)}" y="${topY - 10}" fill="${CRIMSON}" font-size="8.5" font-weight="700" text-anchor="middle" font-family="Iosevka Charon Mono, monospace">+fy</text>

        <!-- Compression Triangle (Top, pointing left) -->
        <polygon points="${stressAxisX},${secCy} ${stressAxisX},${topY} ${(stressAxisX - curBarW).toFixed(1)},${topY}" fill="rgba(255, 125, 97,0.26)" stroke="${VERMILION}" stroke-width="1.8" />
        <!-- Tension Triangle (Bottom, pointing right) -->
        <polygon points="${stressAxisX},${secCy} ${stressAxisX},${botY} ${(stressAxisX + curBarW).toFixed(1)},${botY}" fill="rgba(88, 182, 145,0.22)" stroke="${GREEN}" stroke-width="1.8" />

        <!-- Stress Values at Extreme Fibers -->
        <text x="${(stressAxisX + 6).toFixed(1)}" y="${topY + 9}" fill="${VERMILION}" font-size="9.5" font-weight="700" font-family="Iosevka Charon Mono, monospace">
          −${sigma_x.toFixed(1)} ${sUnit} (Comp.)
        </text>
        <text x="${(stressAxisX - 6).toFixed(1)}" y="${botY - 3}" fill="${GREEN}" font-size="9.5" font-weight="700" text-anchor="end" font-family="Iosevka Charon Mono, monospace">
          +${sigma_x.toFixed(1)} ${sUnit} (Tens.)
        </text>
      `;

      const svg = `
        <svg viewBox="0 0 ${svgW} ${svgH}" class="diagram-svg" preserveAspectRatio="xMidYMid meet">
          <defs>
            ${surveyGridPattern('grid-sec')}
            <pattern id="sec-hatch" width="7" height="7" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
              <rect width="7" height="7" fill="#151b25" />
              <line x1="0" y1="0" x2="0" y2="7" stroke="rgba(233, 237, 245,0.18)" stroke-width="1.1" />
            </pattern>
          </defs>

          <rect width="${svgW}" height="${svgH}" fill="${PAPER}" />
          <rect width="${svgW}" height="${svgH}" fill="url(#grid-sec)" />

          <!-- Plate Title -->
          <text x="12" y="17" fill="${INK}" font-size="10.2" font-weight="700" font-family="Iosevka Charon Mono, monospace">
            CROSS-SECTION &amp; FIBER STRESS σ(y) AT PROBE x
          </text>

          <!-- Cross-Section Geometry -->
          ${shapeSvg}

          <!-- Shared Neutral Axis (N.A.) across both drawings -->
          <line x1="${(secCx - drawW / 2 - 8).toFixed(1)}" y1="${secCy}" x2="${svgW - 14}" y2="${secCy}" stroke="${OCHRE}" stroke-width="1.1" stroke-dasharray="5,3" />
          <text x="184" y="${secCy - 4}" fill="${OCHRE}" font-size="8.8" font-weight="700" font-family="Iosevka Charon Mono, monospace">N.A. (σ = 0)</text>

          <!-- Depth h dimension -->
          <line x1="${(secCx - drawW / 2 - 14).toFixed(1)}" y1="${topY}" x2="${(secCx - drawW / 2 - 14).toFixed(1)}" y2="${botY}" stroke="${INK_MUTED}" stroke-width="1.1" />
          <line x1="${(secCx - drawW / 2 - 18).toFixed(1)}" y1="${topY}" x2="${(secCx - drawW / 2 - 10).toFixed(1)}" y2="${topY}" stroke="${INK_MUTED}" stroke-width="1.1" />
          <line x1="${(secCx - drawW / 2 - 18).toFixed(1)}" y1="${botY}" x2="${(secCx - drawW / 2 - 10).toFixed(1)}" y2="${botY}" stroke="${INK_MUTED}" stroke-width="1.1" />
          <text x="${(secCx - drawW / 2 - 18).toFixed(1)}" y="${secCy + 3}" fill="${INK_MUTED}" font-size="9.2" font-weight="700" text-anchor="end" font-family="Iosevka Charon Mono, monospace">
            h=${rawH.toFixed(0)}
          </text>

          <!-- Width b label -->
          <text x="${secCx}" y="${botY + 15}" fill="${INK_MUTED}" font-size="9.2" font-weight="700" text-anchor="middle" font-family="Iosevka Charon Mono, monospace">
            ${g.name ? g.name + ' · ' : ''}${rawW.toFixed(0)}×${rawH.toFixed(0)} ${lUnit}
          </text>

          <!-- Linear Stress Profile -->
          ${stressSvg}

          <!-- Bottom Status Strip -->
          <text x="12" y="${svgH - 8}" fill="${exceedsAtX ? CRIMSON : INK_DIM}" font-size="9" font-weight="700" font-family="Iosevka Charon Mono, monospace">
            σ(x) = M(x)/Wy = ${sigma_x.toFixed(1)} ${sUnit}  |  Yield fy = ${yieldVal} ${sUnit} (${((sigma_x / yieldVal) * 100).toFixed(0)}% at x)
          </text>
        </svg>
      `;

      this.containerSection.innerHTML = svg;
    }
  }

  global.BEAM_DIAGRAMS = {
    DiagramRenderer,
  };
})(window);
