/**
 * ============================================================================
 * DiagramRenderer: High-Precision Vector SVG Structural Diagrams
 * Renders FBD, SFD, BMD, and Deflection Curve with Interactive Hover & Probe
 * ============================================================================
 */

export class DiagramRenderer {
  constructor({ containerFBD, containerSFD, containerBMD, containerDeflection, onProbeChange }) {
    this.containerFBD = containerFBD;
    this.containerSFD = containerSFD;
    this.containerBMD = containerBMD;
    this.containerDeflection = containerDeflection;
    this.onProbeChange = onProbeChange;

    this.momentTensionBottom = true; // European civil engineering convention (tension side down)
    this.deflectionExaggeration = 1.0;

    this.currentSolution = null;
    this.currentPoints = null;

    this.initEvents();
  }

  initEvents() {
    // Add unified pointer interaction to probe along the beam
    const containers = [this.containerFBD, this.containerSFD, this.containerBMD, this.containerDeflection];
    containers.forEach(container => {
      if (!container) return;
      container.addEventListener("pointermove", (e) => this.handlePointer(e, container));
      container.addEventListener("pointerdown", (e) => {
        container.setPointerCapture(e.pointerId);
        this.handlePointer(e, container);
      });
    });
  }

  handlePointer(e, container) {
    if (!this.currentSolution) return;
    const rect = container.getBoundingClientRect();
    const xPixel = e.clientX - rect.left;
    const width = rect.width;

    // Margin mapping (12% margin on left and right)
    const marginRatio = 0.10;
    const plotWidth = width * (1 - 2 * marginRatio);
    const startX = width * marginRatio;

    let relX = (xPixel - startX) / plotWidth;
    relX = Math.max(0, Math.min(1, relX));

    const newX = relX * this.currentSolution.L;
    if (this.onProbeChange) {
      this.onProbeChange(newX);
    }
  }

  render(solution, points) {
    this.currentSolution = solution;
    this.currentPoints = points;

    this.renderFBD(solution);
    this.renderSFD(solution, points);
    this.renderBMD(solution, points);
    this.renderDeflection(solution, points);
  }

  /**
   * 1. Free Body Diagram (FBD)
   */
  renderFBD(solution) {
    if (!this.containerFBD) return;
    const { L, w, x, R_A, R_B, unit } = solution;

    const wUnitStr = unit === "metric" ? "kN/m" : "lbf/ft";
    const forceUnitStr = unit === "metric" ? "kN" : "lbf";
    const lenUnitStr = unit === "metric" ? "m" : "ft";

    const svgWidth = 720;
    const svgHeight = 220;
    const padX = 80;
    const plotW = svgWidth - 2 * padX;
    const beamY = 135;
    const beamH = 14;

    const probeXCoord = padX + (x / L) * plotW;

    // Load arrows
    const numArrows = 14;
    const arrowSpacing = plotW / numArrows;
    const arrowTopY = 55;
    const arrowLen = beamY - arrowTopY - 4;

    let loadArrowsSvg = `
      <!-- Load block background -->
      <rect x="${padX}" y="${arrowTopY}" width="${plotW}" height="${arrowLen}" fill="rgba(56, 189, 248, 0.08)" rx="2" />
      <line x1="${padX}" y1="${arrowTopY}" x2="${padX + plotW}" y2="${arrowTopY}" stroke="var(--accent-cyan)" stroke-width="2.5" />
    `;

    for (let i = 0; i <= numArrows; i++) {
      const ax = padX + i * arrowSpacing;
      loadArrowsSvg += `
        <line x1="${ax}" y1="${arrowTopY}" x2="${ax}" y2="${beamY - 4}" stroke="var(--accent-cyan)" stroke-width="1.5" />
        <polygon points="${ax-3.5},${beamY - 8} ${ax+3.5},${beamY - 8} ${ax},${beamY - 2}" fill="var(--accent-cyan)" />
      `;
    }

    const svg = `
      <svg viewBox="0 0 ${svgWidth} ${svgHeight}" class="diagram-svg" preserveAspectRatio="xMidYMid meet">
        <defs>
          <pattern id="hatch-ground" width="6" height="6" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
            <line x1="0" y1="0" x2="0" y2="6" stroke="rgba(148, 163, 184, 0.4)" stroke-width="1.2" />
          </pattern>
          <marker id="arrow-up" viewBox="0 0 10 10" refX="5" refY="2" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M 0 8 L 5 0 L 10 8 z" fill="#10b981" />
          </marker>
        </defs>

        <!-- Distributed Load Block -->
        ${loadArrowsSvg}
        <text x="${padX + plotW / 2}" y="${arrowTopY - 12}" fill="var(--accent-cyan)" font-size="13" font-weight="700" text-anchor="middle" font-family="var(--font-mono)">
          w = ${w.toFixed(2)} ${wUnitStr} (Gleichstreckenlast / UDL)
        </text>

        <!-- Beam Body -->
        <rect x="${padX}" y="${beamY - beamH/2}" width="${plotW}" height="${beamH}" rx="2" fill="url(#beam-grad)" stroke="#94a3b8" stroke-width="2" />
        <line x1="${padX}" y1="${beamY}" x2="${padX + plotW}" y2="${beamY}" stroke="rgba(255,255,255,0.3)" stroke-dasharray="4,4" />

        <!-- Left Support: Pinned (Festlager / Triangle) -->
        <g transform="translate(${padX}, ${beamY + beamH/2})">
          <polygon points="0,0 -16,26 16,26" fill="#1e293b" stroke="#38bdf8" stroke-width="2" />
          <circle cx="0" cy="0" r="3.5" fill="#f8fafc" stroke="#38bdf8" stroke-width="1.5" />
          <line x1="-22" y1="26" x2="22" y2="26" stroke="#94a3b8" stroke-width="2" />
          <rect x="-22" y="27" width="44" height="7" fill="url(#hatch-ground)" />
          <text x="-24" y="16" fill="var(--text-secondary)" font-size="12" font-weight="700" text-anchor="end">A</text>
        </g>

        <!-- Right Support: Roller (Loslager / Triangle with rollers) -->
        <g transform="translate(${padX + plotW}, ${beamY + beamH/2})">
          <polygon points="0,0 -16,20 16,20" fill="#1e293b" stroke="#38bdf8" stroke-width="2" />
          <circle cx="0" cy="0" r="3.5" fill="#f8fafc" stroke="#38bdf8" stroke-width="1.5" />
          <circle cx="-9" cy="24" r="3.5" fill="#1e293b" stroke="#94a3b8" stroke-width="1.5" />
          <circle cx="0" cy="24" r="3.5" fill="#1e293b" stroke="#94a3b8" stroke-width="1.5" />
          <circle cx="9" cy="24" r="3.5" fill="#1e293b" stroke="#94a3b8" stroke-width="1.5" />
          <line x1="-22" y1="28" x2="22" y2="28" stroke="#94a3b8" stroke-width="2" />
          <rect x="-22" y="29" width="44" height="7" fill="url(#hatch-ground)" />
          <text x="24" y="16" fill="var(--text-secondary)" font-size="12" font-weight="700" text-anchor="start">B</text>
        </g>

        <!-- Reactions R_A, R_B -->
        <line x1="${padX}" y1="${beamY + 68}" x2="${padX}" y2="${beamY + 38}" stroke="#10b981" stroke-width="2.5" marker-end="url(#arrow-up)" />
        <text x="${padX}" y="${beamY + 82}" fill="#10b981" font-size="12" font-weight="700" text-anchor="middle" font-family="var(--font-mono)">
          R_A = ${R_A.toFixed(2)} ${forceUnitStr}
        </text>

        <line x1="${padX + plotW}" y1="${beamY + 68}" x2="${padX + plotW}" y2="${beamY + 38}" stroke="#10b981" stroke-width="2.5" marker-end="url(#arrow-up)" />
        <text x="${padX + plotW}" y="${beamY + 82}" fill="#10b981" font-size="12" font-weight="700" text-anchor="middle" font-family="var(--font-mono)">
          R_B = ${R_B.toFixed(2)} ${forceUnitStr}
        </text>

        <!-- Span Dimension Line L -->
        <g transform="translate(0, ${beamY - 45})">
          <line x1="${padX}" y1="0" x2="${padX + plotW}" y2="0" stroke="rgba(255,255,255,0.4)" stroke-width="1.2" />
          <line x1="${padX}" y1="-5" x2="${padX}" y2="5" stroke="rgba(255,255,255,0.5)" stroke-width="1.5" />
          <line x1="${padX + plotW}" y1="-5" x2="${padX + plotW}" y2="5" stroke="rgba(255,255,255,0.5)" stroke-width="1.5" />
          <rect x="${padX + plotW/2 - 40}" y="-10" width="80" height="18" fill="#0f172a" rx="4" />
          <text x="${padX + plotW/2}" y="3" fill="#cbd5e1" font-size="12" font-weight="600" text-anchor="middle" font-family="var(--font-mono)">
            L = ${L.toFixed(2)} ${lenUnitStr}
          </text>
        </g>

        <!-- Interactive Probe Cursor (x) -->
        <line x1="${probeXCoord}" y1="20" x2="${probeXCoord}" y2="${svgHeight - 15}" stroke="#f59e0b" stroke-width="1.8" stroke-dasharray="4,4" />
        <circle cx="${probeXCoord}" cy="${beamY}" r="5.5" fill="#f59e0b" stroke="#ffffff" stroke-width="2" />
        <rect x="${probeXCoord - 45}" y="${svgHeight - 22}" width="90" height="18" fill="#1e293b" stroke="#f59e0b" stroke-width="1" rx="4" />
        <text x="${probeXCoord}" y="${svgHeight - 9}" fill="#f59e0b" font-size="11" font-weight="700" text-anchor="middle" font-family="var(--font-mono)">
          x = ${x.toFixed(2)} ${lenUnitStr}
        </text>
      </svg>
    `;

    this.containerFBD.innerHTML = svg;
  }

  /**
   * 2. Shear Force Diagram (SFD / V(x))
   */
  renderSFD(solution, points) {
    if (!this.containerSFD) return;
    const { L, V_max, V_x, x, unit } = solution;
    const forceUnit = unit === "metric" ? "kN" : "lbf";
    const lenUnit = unit === "metric" ? "m" : "ft";

    const svgWidth = 720;
    const svgHeight = 170;
    const padX = 80;
    const plotW = svgWidth - 2 * padX;
    const midY = 85;
    const maxPlotAmp = 55;

    const scaleY = V_max > 0.0001 ? maxPlotAmp / V_max : 1;

    // Build path
    const yLeft = midY - V_max * scaleY;
    const yRight = midY + V_max * scaleY;
    const xZero = padX + plotW / 2;

    const polyPos = `${padX},${midY} ${padX},${yLeft} ${xZero},${midY}`;
    const polyNeg = `${xZero},${midY} ${padX + plotW},${yRight} ${padX + plotW},${midY}`;

    const probeXCoord = padX + (x / L) * plotW;
    const probeYCoord = midY - V_x * scaleY;

    const svg = `
      <svg viewBox="0 0 ${svgWidth} ${svgHeight}" class="diagram-svg" preserveAspectRatio="xMidYMid meet">
        <!-- Zero Axis Baseline -->
        <line x1="${padX}" y1="${midY}" x2="${padX + plotW}" y2="${midY}" stroke="rgba(255,255,255,0.3)" stroke-width="1.5" />

        <!-- Shaded Areas -->
        <polygon points="${polyPos}" fill="rgba(16, 185, 129, 0.2)" stroke="#10b981" stroke-width="2" />
        <polygon points="${polyNeg}" fill="rgba(239, 68, 68, 0.2)" stroke="#ef4444" stroke-width="2" />

        <!-- Diagonal Linear Shear Line -->
        <line x1="${padX}" y1="${yLeft}" x2="${padX + plotW}" y2="${yRight}" stroke="#38bdf8" stroke-width="2.5" />

        <!-- Labels at boundaries -->
        <text x="${padX - 8}" y="${yLeft + 4}" fill="#10b981" font-size="11" font-weight="700" text-anchor="end" font-family="var(--font-mono)">
          +${V_max.toFixed(2)}
        </text>
        <text x="${padX + plotW + 8}" y="${yRight + 4}" fill="#ef4444" font-size="11" font-weight="700" text-anchor="start" font-family="var(--font-mono)">
          -${V_max.toFixed(2)}
        </text>
        <text x="${xZero}" y="${midY - 8}" fill="var(--text-muted)" font-size="10" text-anchor="middle" font-family="var(--font-mono)">
          V=0 (L/2)
        </text>

        <!-- Interactive Probe Indicator -->
        <line x1="${probeXCoord}" y1="10" x2="${probeXCoord}" y2="${svgHeight - 10}" stroke="#f59e0b" stroke-width="1.5" stroke-dasharray="3,3" />
        <circle cx="${probeXCoord}" cy="${probeYCoord}" r="5" fill="#f59e0b" stroke="#ffffff" stroke-width="1.5" />

        <g transform="translate(${probeXCoord > svgWidth - 140 ? probeXCoord - 120 : probeXCoord + 10}, ${Math.max(25, Math.min(svgHeight - 25, probeYCoord))})">
          <rect x="0" y="-12" width="115" height="24" fill="#0f172a" stroke="#f59e0b" stroke-width="1" rx="4" />
          <text x="6" y="4" fill="#f59e0b" font-size="11" font-weight="700" font-family="var(--font-mono)">
            V(x) = ${V_x.toFixed(2)} ${forceUnit}
          </text>
        </g>
      </svg>
    `;

    this.containerSFD.innerHTML = svg;
  }

  /**
   * 3. Bending Moment Diagram (BMD / M(x))
   */
  renderBMD(solution, points) {
    if (!this.containerBMD) return;
    const { L, M_max, M_x, x, unit } = solution;
    const momentUnit = unit === "metric" ? "kNm" : "lbf·ft";

    const svgWidth = 720;
    const svgHeight = 170;
    const padX = 80;
    const plotW = svgWidth - 2 * padX;

    // Baseline: if tension bottom, baseline is at top (y=30) and parabola sags down
    // if tension top, baseline is at bottom (y=140) and curve goes up
    const baselineY = this.momentTensionBottom ? 30 : 140;
    const maxPlotAmp = 100;
    const scaleY = M_max > 0.0001 ? maxPlotAmp / M_max : 1;
    const dir = this.momentTensionBottom ? 1 : -1;

    let pathD = `M ${padX} ${baselineY}`;
    let polyPoints = `${padX},${baselineY}`;

    points.forEach(pt => {
      const cx = padX + pt.x_rel * plotW;
      const cy = baselineY + dir * pt.M * scaleY;
      pathD += ` L ${cx.toFixed(1)} ${cy.toFixed(1)}`;
      polyPoints += ` ${cx.toFixed(1)},${cy.toFixed(1)}`;
    });

    polyPoints += ` ${padX + plotW},${baselineY}`;

    const midX = padX + plotW / 2;
    const peakY = baselineY + dir * M_max * scaleY;

    const probeXCoord = padX + (x / L) * plotW;
    const probeYCoord = baselineY + dir * M_x * scaleY;

    const svg = `
      <svg viewBox="0 0 ${svgWidth} ${svgHeight}" class="diagram-svg" preserveAspectRatio="xMidYMid meet">
        <!-- Zero Axis Baseline -->
        <line x1="${padX}" y1="${baselineY}" x2="${padX + plotW}" y2="${baselineY}" stroke="rgba(255,255,255,0.3)" stroke-width="1.5" />

        <!-- Parabolic Shaded Area -->
        <polygon points="${polyPoints}" fill="rgba(56, 189, 248, 0.18)" />

        <!-- Parabolic Curve Line -->
        <path d="${pathD}" fill="none" stroke="#38bdf8" stroke-width="2.5" />

        <!-- Peak Indicator M_max -->
        <circle cx="${midX}" cy="${peakY}" r="4.5" fill="#38bdf8" />
        <text x="${midX}" y="${this.momentTensionBottom ? peakY + 16 : peakY - 8}" fill="#38bdf8" font-size="12" font-weight="700" text-anchor="middle" font-family="var(--font-mono)">
          M_max = ${M_max.toFixed(2)} ${momentUnit} (wL²/8)
        </text>

        <!-- Interactive Probe Indicator -->
        <line x1="${probeXCoord}" y1="10" x2="${probeXCoord}" y2="${svgHeight - 10}" stroke="#f59e0b" stroke-width="1.5" stroke-dasharray="3,3" />
        <circle cx="${probeXCoord}" cy="${probeYCoord}" r="5" fill="#f59e0b" stroke="#ffffff" stroke-width="1.5" />

        <g transform="translate(${probeXCoord > svgWidth - 140 ? probeXCoord - 120 : probeXCoord + 10}, ${Math.max(25, Math.min(svgHeight - 25, probeYCoord))})">
          <rect x="0" y="-12" width="120" height="24" fill="#0f172a" stroke="#f59e0b" stroke-width="1" rx="4" />
          <text x="6" y="4" fill="#f59e0b" font-size="11" font-weight="700" font-family="var(--font-mono)">
            M(x) = ${M_x.toFixed(2)} ${momentUnit}
          </text>
        </g>
      </svg>
    `;

    this.containerBMD.innerHTML = svg;
  }

  /**
   * 4. Deflection Curve (Biegelinie / delta(x))
   */
  renderDeflection(solution, points) {
    if (!this.containerDeflection) return;
    const { L, delta_max, delta_x, x, ratio_max, unit } = solution;
    const defUnit = unit === "metric" ? "mm" : "in";

    const svgWidth = 720;
    const svgHeight = 170;
    const padX = 80;
    const plotW = svgWidth - 2 * padX;
    const baselineY = 40;
    const maxPlotAmp = 85;

    const scaleY = delta_max > 0.00001 ? maxPlotAmp / delta_max : 1;

    let pathD = `M ${padX} ${baselineY}`;
    let polyPoints = `${padX},${baselineY}`;

    points.forEach(pt => {
      const cx = padX + pt.x_rel * plotW;
      const cy = baselineY + pt.delta * scaleY;
      pathD += ` L ${cx.toFixed(1)} ${cy.toFixed(1)}`;
      polyPoints += ` ${cx.toFixed(1)},${cy.toFixed(1)}`;
    });

    polyPoints += ` ${padX + plotW},${baselineY}`;

    const midX = padX + plotW / 2;
    const peakY = baselineY + delta_max * scaleY;

    const probeXCoord = padX + (x / L) * plotW;
    const probeYCoord = baselineY + delta_x * scaleY;

    const svg = `
      <svg viewBox="0 0 ${svgWidth} ${svgHeight}" class="diagram-svg" preserveAspectRatio="xMidYMid meet">
        <!-- Unloaded Baseline Reference -->
        <line x1="${padX}" y1="${baselineY}" x2="${padX + plotW}" y2="${baselineY}" stroke="rgba(255,255,255,0.3)" stroke-width="1.5" stroke-dasharray="4,4" />

        <!-- Deflection Shaded Elastic Field -->
        <polygon points="${polyPoints}" fill="rgba(168, 85, 247, 0.16)" />

        <!-- Elastic Curve Polyline -->
        <path d="${pathD}" fill="none" stroke="#a855f7" stroke-width="2.5" />

        <!-- Max Deflection Point -->
        <circle cx="${midX}" cy="${peakY}" r="4.5" fill="#a855f7" />
        <line x1="${midX}" y1="${baselineY}" x2="${midX}" y2="${peakY}" stroke="#a855f7" stroke-width="1.2" stroke-dasharray="2,2" />
        <text x="${midX}" y="${peakY + 16}" fill="#c084fc" font-size="12" font-weight="700" text-anchor="middle" font-family="var(--font-mono)">
          δ_max = ${delta_max.toFixed(3)} ${defUnit} (L / ${ratio_max})
        </text>

        <!-- Interactive Probe Indicator -->
        <line x1="${probeXCoord}" y1="10" x2="${probeXCoord}" y2="${svgHeight - 10}" stroke="#f59e0b" stroke-width="1.5" stroke-dasharray="3,3" />
        <circle cx="${probeXCoord}" cy="${probeYCoord}" r="5" fill="#f59e0b" stroke="#ffffff" stroke-width="1.5" />

        <g transform="translate(${probeXCoord > svgWidth - 140 ? probeXCoord - 120 : probeXCoord + 10}, ${Math.max(25, Math.min(svgHeight - 25, probeYCoord))})">
          <rect x="0" y="-12" width="120" height="24" fill="#0f172a" stroke="#f59e0b" stroke-width="1" rx="4" />
          <text x="6" y="4" fill="#f59e0b" font-size="11" font-weight="700" font-family="var(--font-mono)">
            δ(x) = ${delta_x.toFixed(3)} ${defUnit}
          </text>
        </g>
      </svg>
    `;

    this.containerDeflection.innerHTML = svg;
  }
}
