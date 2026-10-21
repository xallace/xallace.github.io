/* 3D-Ansicht Rad und Fahrbahn nach Abb. 2.1 (S. 10).
   Fahrbahnfestes System i*, j*, k* im Latschmittelpunkt, radfestes System i_R, j_R, k_R,
   Sturzwinkel γ, Kurswinkel ψ + δ gegen i0, Schräglaufwinkel α zwischen i* und v,
   Kräfte Fx, Fy, Fz und Rückstellmoment Mz auf das Rad (Abb. 2.1b) oder auf die Fahrbahn (Abb. 2.1c).
   Die Fahrbahn läuft in Zeitlupe unter dem Rad durch; Schlupf und Schräglauf sieht man daran,
   dass Radumfang und Fahrbahn verschieden schnell bzw. schräg zueinander laufen.
   Achsen: Buch (i, j, k) → three.js (x, z = −j, y = k). */
(function (root) {
  'use strict';

  const SLOWMO = 0.06;          // Zeitlupe für die Bewegung
  const F_SCALE = 0.11 / 1000;  // m Pfeillänge je N
  const COL = { i: 0xf87171, j: 0x34d399, k: 0x38bdf8, iR: 0xfca5a5, jR: 0x6ee7b7, kR: 0x7dd3fc,
    v: 0xf59e0b, F: 0xe2e8f0, M: 0xa78bfa, zero: 0x94a3b8 };

  const B = (i, j, k) => new root.THREE.Vector3(i, k, -j);

  function hasWebGL() {
    try {
      const c = document.createElement('canvas');
      return !!(c.getContext('webgl') || c.getContext('experimental-webgl'));
    } catch (e) { return false; }
  }

  function create(container) {
    const T = root.THREE;
    if (!T || !hasWebGL()) {
      container.innerHTML = '<p class="note" style="padding:16px">Die 3D-Ansicht braucht WebGL, das in diesem Browser nicht verfügbar ist.</p>';
      return { update() {}, setMode() {}, start() {}, stop() {} };
    }

    const renderer = new T.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(root.devicePixelRatio || 1, 2));
    container.appendChild(renderer.domElement);
    const labelLayer = document.createElement('div');
    labelLayer.className = 'vp-labels';
    container.appendChild(labelLayer);
    const hint = document.createElement('div');
    hint.className = 'vp-hint';
    hint.textContent = 'Ziehen: drehen · Rad: zoomen · Rechts ziehen: schieben';
    container.appendChild(hint);

    const scene = new T.Scene();
    const camera = new T.PerspectiveCamera(38, 1, 0.01, 60);
    camera.position.set(0.95, 0.62, 1.0);
    const controls = new T.OrbitControls(camera, renderer.domElement);
    controls.target.set(0.02, 0.2, 0);
    controls.enableDamping = true;
    controls.dampingFactor = 0.12;
    controls.minDistance = 0.5;
    controls.maxDistance = 6;
    controls.maxPolarAngle = Math.PI * 0.495;

    scene.add(new T.HemisphereLight(0xcfe6ff, 0x0b1220, 0.85));
    const sun = new T.DirectionalLight(0xffffff, 0.75);
    sun.position.set(2, 3, 1.5);
    scene.add(sun);

    // Fahrbahn mit mitlaufendem Raster
    const CELL = 0.2;
    const road = new T.Mesh(new T.PlaneGeometry(8, 8), new T.MeshBasicMaterial({ color: 0x0c1322, transparent: true, opacity: 0.85 }));
    road.rotation.x = -Math.PI / 2;
    road.position.y = -0.001;
    scene.add(road);
    const grid = new T.GridHelper(8, 40, 0x334155, 0x1e293b);
    scene.add(grid);

    // inertiales System i0, j0, k0 (fest)
    const origin0 = B(-0.45, -0.5, 0);
    const inertial = new T.Group();
    inertial.position.copy(origin0);
    scene.add(inertial);
    const arrow = (dir, len, color, head = 0.045, width = 0.025) => new T.ArrowHelper(dir.clone().normalize(), new T.Vector3(), len, color, head, width);
    inertial.add(arrow(B(1, 0, 0), 0.25, COL.zero), arrow(B(0, 1, 0), 0.25, COL.zero), arrow(B(0, 0, 1), 0.25, COL.zero));

    // Kursrichtung ψ + δ: dreht Rad und fahrbahnfestes System um k*
    const heading = new T.Group();
    scene.add(heading);
    const axI = arrow(B(1, 0, 0), 0.62, COL.i), axJ = arrow(B(0, 1, 0), 0.42, COL.j), axK = arrow(B(0, 0, 1), 0.78, COL.k);
    heading.add(axI, axJ, axK);

    // Latsch
    const patchMat = new T.MeshBasicMaterial({ color: 0xf59e0b, transparent: true, opacity: 0.35, side: T.DoubleSide });
    const patch = new T.Mesh(new T.PlaneGeometry(1, 1), patchMat);
    patch.rotation.x = -Math.PI / 2;
    patch.position.y = 0.002;
    heading.add(patch);

    // Sturz: kippt das Rad um i* im Latschmittelpunkt
    const camberG = new T.Group();
    heading.add(camberG);
    const axKR = arrow(B(0, 0, 1), 0.5, COL.kR, 0.035, 0.02);
    camberG.add(axKR);
    const hub = new T.Group();
    camberG.add(hub);
    const axJR = arrow(B(0, 1, 0), 0.32, COL.jR, 0.035, 0.02);
    const axIR = arrow(B(1, 0, 0), 0.36, COL.iR, 0.035, 0.02);
    hub.add(axJR, axIR);
    const spin = new T.Group();
    hub.add(spin);

    let wheelMeshes = [];
    function buildWheel(R0) {
      wheelMeshes.forEach((m) => { spin.remove(m); m.geometry.dispose(); });
      wheelMeshes = [];
      const tubeR = 0.065, width = 0.205;
      const tire = new T.Mesh(new T.TorusGeometry(R0 - tubeR, tubeR, 20, 72),
        new T.MeshStandardMaterial({ color: 0x1f2937, roughness: 0.9, metalness: 0.05, transparent: true, opacity: 0.82 }));
      tire.scale.z = width / 2 / tubeR;
      const rimR = R0 - 2 * tubeR + 0.01;
      const rim = new T.Mesh(new T.CylinderGeometry(rimR, rimR, width * 0.72, 48, 1, true),
        new T.MeshStandardMaterial({ color: 0x64748b, roughness: 0.4, metalness: 0.6, side: T.DoubleSide, transparent: true, opacity: 0.55 }));
      rim.rotation.x = Math.PI / 2;
      const spokeMat = new T.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.4, metalness: 0.6 });
      const markMat = new T.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.5, metalness: 0.2, emissive: 0x3a2500 });
      const parts = [tire, rim];
      for (let k = 0; k < 5; k++) {
        const s = new T.Mesh(new T.BoxGeometry(rimR, 0.022, 0.03), k === 0 ? markMat : spokeMat);
        const a = k * 2 * Math.PI / 5;
        s.position.set(Math.cos(a) * rimR / 2, Math.sin(a) * rimR / 2, 0);
        s.rotation.z = a;
        parts.push(s);
      }
      // Markierung auf der Lauffläche, damit die Drehung sichtbar ist
      const tread = new T.Mesh(new T.BoxGeometry(0.03, 0.012, width * 1.02), markMat);
      tread.position.set(0, R0 - 0.004, 0);
      parts.push(tread);
      parts.forEach((m) => { spin.add(m); wheelMeshes.push(m); });
    }

    // Geschwindigkeit v im Latsch, Winkelbögen α und γ, Kraftpfeile, Momentbogen
    const vArrow = arrow(B(1, 0, 0), 0.5, COL.v, 0.05, 0.03);
    heading.add(vArrow);
    const lineMat = (c) => new T.LineBasicMaterial({ color: c });
    const arcA = new T.Line(new T.BufferGeometry(), lineMat(COL.v));
    const arcG = new T.Line(new T.BufferGeometry(), lineMat(COL.kR));
    const arcH = new T.Line(new T.BufferGeometry(), lineMat(COL.zero));
    heading.add(arcA, arcG);
    inertial.add(arcH);
    const fx = arrow(B(1, 0, 0), 0.1, COL.F), fy = arrow(B(0, 1, 0), 0.1, COL.F), fz = arrow(B(0, 0, 1), 0.1, COL.F);
    const fres = arrow(B(1, 0, 0), 0.1, 0xfbbf24, 0.04, 0.025);
    [fx, fy, fz, fres].forEach((a) => heading.add(a));
    const mzLine = new T.Line(new T.BufferGeometry(), lineMat(COL.M));
    const mzHead = new T.Mesh(new T.ConeGeometry(0.018, 0.05, 12), new T.MeshBasicMaterial({ color: COL.M }));
    heading.add(mzLine, mzHead);

    // HTML-Beschriftungen an 3D-Punkten
    const labels = [];
    function label(html, color, getPos) {
      const d = document.createElement('div');
      d.className = 'vp-label';
      d.style.color = color;
      d.innerHTML = html;
      labelLayer.appendChild(d);
      const L = { el: d, getPos, visible: true };
      labels.push(L);
      return L;
    }
    const hex = (n) => '#' + n.toString(16).padStart(6, '0');
    const wpos = (obj, local) => obj.localToWorld(local.clone());
    const lab = {
      i0: label('i<sub>0</sub>', '#94a3b8', () => wpos(inertial, B(0.29, 0, 0))),
      j0: label('j<sub>0</sub>', '#94a3b8', () => wpos(inertial, B(0, 0.29, 0))),
      i: label('i*', hex(COL.i), () => wpos(heading, B(0.67, 0, 0))),
      j: label('j*', hex(COL.j), () => wpos(heading, B(0, 0.47, 0))),
      k: label('k*', hex(COL.k), () => wpos(heading, B(0, 0, 0.83))),
      kR: label('k<sub>R</sub>', hex(COL.kR), () => wpos(camberG, B(0, 0, 0.54))),
      jR: label('j<sub>R</sub>', hex(COL.jR), () => wpos(hub, B(0, 0.36, 0))),
      v: label('v', hex(COL.v), () => wpos(heading, state.vTip)),
      a: label('α', hex(COL.v), () => wpos(heading, state.aMid)),
      g: label('γ', hex(COL.kR), () => wpos(heading, state.gMid)),
      h: label('ψ+δ', '#94a3b8', () => wpos(inertial, state.hMid)),
      Fx: label('', '#e2e8f0', () => wpos(heading, state.fxTip)),
      Fy: label('', '#e2e8f0', () => wpos(heading, state.fyTip)),
      Fz: label('', '#e2e8f0', () => wpos(heading, state.fzTip)),
      Mz: label('', hex(COL.M), () => wpos(heading, state.mzTip)),
    };

    const state = { mode: 'rad', s: null, phi: 0, roadX: 0, roadZ: 0, running: false, raf: 0, last: 0,
      vTip: B(0.55, 0, 0), aMid: B(0.3, 0, 0), gMid: B(0, 0, 0.3), hMid: B(0.2, 0, 0),
      fxTip: B(0, 0, 0), fyTip: B(0, 0, 0), fzTip: B(0, 0, 0), mzTip: B(0, 0, 0) };
    let builtR0 = 0;

    function setArrow(a, dirB, len, originB) {
      if (Math.abs(len) < 1e-4) { a.visible = false; return; }
      a.visible = true;
      const d = dirB.clone().normalize();
      if (len < 0) d.negate();
      const L = Math.abs(len);
      a.position.copy(originB || new T.Vector3());
      a.setDirection(d);
      a.setLength(L, Math.min(0.06, L * 0.35), Math.min(0.035, L * 0.22));
    }

    function arcPoints(fn, t0, t1, n = 32) {
      const pts = [];
      for (let k = 0; k <= n; k++) pts.push(fn(t0 + (t1 - t0) * k / n));
      return pts;
    }

    const fmtKN = (v) => (v / 1000).toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    function update(s) {
      state.s = s;
      if (Math.abs(s.R0 - builtR0) > 1e-6) { buildWheel(s.R0); builtR0 = s.R0; }
      heading.rotation.y = s.delta;
      camberG.rotation.x = s.gamma;
      hub.position.set(0, s.R0, 0);
      patch.scale.set(Math.max(2 * s.lL, 0.01), 0.17, 1);

      // Geschwindigkeit: um α gegen i* gedreht, Querkomponente zur −j*-Seite
      const vDir = B(Math.cos(s.alpha), -Math.sin(s.alpha), 0);
      setArrow(vArrow, vDir, 0.55);
      state.vTip = vDir.clone().multiplyScalar(0.6);
      const rA = 0.34;
      arcA.geometry.setFromPoints(arcPoints((t) => B(rA * Math.cos(t), -rA * Math.sin(t), 0.002), 0, s.alpha));
      state.aMid = B(0.41 * Math.cos(s.alpha / 2), -0.41 * Math.sin(s.alpha / 2), 0);
      const rG = 0.26;
      arcG.geometry.setFromPoints(arcPoints((t) => new T.Vector3(0, rG * Math.cos(t), rG * Math.sin(t)), 0, s.gamma));
      state.gMid = new T.Vector3(0, 0.31 * Math.cos(s.gamma / 2), 0.31 * Math.sin(s.gamma / 2));
      arcH.geometry.setFromPoints(arcPoints((t) => B(0.18 * Math.cos(t), 0.18 * Math.sin(t), 0), 0, s.delta));
      state.hMid = B(0.11 * Math.cos(s.delta / 2), 0.11 * Math.sin(s.delta / 2), 0);
      lab.h.el.style.display = Math.abs(s.delta) > 0.01 ? '' : 'none';
      lab.a.el.style.display = Math.abs(s.alpha) > 0.005 ? '' : 'none';
      lab.g.el.style.display = Math.abs(s.gamma) > 0.005 ? '' : 'none';

      // Kräfte: aufs Rad (Abb. 2.1b) oder Reaktion auf die Fahrbahn (Abb. 2.1c)
      const sg = state.mode === 'rad' ? 1 : -1;
      const pre = state.mode === 'rad' ? '' : '−';
      const lx = sg * s.Fx * F_SCALE, ly = sg * s.Fy * F_SCALE, lz = s.Fz * F_SCALE;
      setArrow(fx, B(1, 0, 0), lx);
      setArrow(fy, B(0, 1, 0), ly);
      if (state.mode === 'rad') setArrow(fz, B(0, 0, 1), lz);
      else setArrow(fz, B(0, 0, -1), lz, B(0, 0, lz));
      const res = Math.hypot(lx, ly);
      setArrow(fres, B(lx, ly, 0), res);
      state.fxTip = B(lx + Math.sign(lx || 1) * 0.08, 0, 0.03);
      state.fyTip = B(0, ly + Math.sign(ly || 1) * 0.07, 0.03);
      state.fzTip = state.mode === 'rad' ? B(0.09, 0, lz * 0.75) : B(0.09, 0, lz * 0.4);
      lab.Fx.el.innerHTML = `${pre}F<sub>x</sub> ${fmtKN(s.Fx)} kN`;
      lab.Fy.el.innerHTML = `${pre}F<sub>y</sub> ${fmtKN(s.Fy)} kN`;
      lab.Fz.el.innerHTML = `${pre}F<sub>z</sub> ${fmtKN(s.Fz)} kN`;
      lab.Fx.el.style.display = Math.abs(lx) > 0.01 ? '' : 'none';
      lab.Fy.el.style.display = Math.abs(ly) > 0.01 ? '' : 'none';

      // Rückstellmoment um k*: Bogen, Winkel ∝ |Mz|
      const Mz = sg * s.Mz;
      const span = Math.min(Math.abs(Mz) / 120, 1) * 1.6 * Math.PI * Math.sign(Mz);
      const rM = 0.13, hM = 0.012;
      const P = (t) => B(rM * Math.cos(t + Math.PI), rM * Math.sin(t + Math.PI), hM);
      if (Math.abs(span) > 0.05) {
        mzLine.visible = mzHead.visible = true;
        mzLine.geometry.setFromPoints(arcPoints(P, 0, span, 48));
        const end = P(span), tang = P(span + Math.sign(span) * 0.01).sub(end).normalize();
        mzHead.position.copy(end);
        mzHead.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), tang);
        state.mzTip = P(span / 2).multiplyScalar(1.45);
        lab.Mz.el.style.display = '';
      } else {
        mzLine.visible = mzHead.visible = false;
        lab.Mz.el.style.display = 'none';
      }
      lab.Mz.el.innerHTML = `${pre}M<sub>z</sub> ${Math.round(s.Mz)} Nm`;
      if (!state.running) render();
    }

    function setMode(m) { state.mode = m; if (state.s) update(state.s); }

    function placeLabels() {
      const w = container.clientWidth, h = container.clientHeight;
      for (const L of labels) {
        if (L.el.style.display === 'none') continue;
        const p = L.getPos().project(camera);
        if (p.z > 1) { L.el.style.visibility = 'hidden'; continue; }
        L.el.style.visibility = '';
        L.el.style.left = ((p.x + 1) / 2 * w) + 'px';
        L.el.style.top = ((1 - p.y) / 2 * h) + 'px';
      }
    }

    function resize() {
      const w = container.clientWidth, h = container.clientHeight;
      if (!w || !h) return;
      renderer.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      render();
    }
    new ResizeObserver(resize).observe(container);

    function render() {
      controls.update();
      renderer.render(scene, camera);
      placeLabels();
    }

    function tick(now) {
      if (!state.running) return;
      const dt = Math.min(0.05, (now - (state.last || now)) / 1000);
      state.last = now;
      const s = state.s;
      if (s) {
        // Umfangsgeschwindigkeit aus dem Schlupf (Tab. 2.3): Antrieb v/(1 − Sx), Bremsen v·(1 − |Sx|)
        const sx = Math.max(-0.999, Math.min(0.95, s.Sx));
        const vr = sx >= 0 ? s.v / (1 - sx) : s.v * (1 + sx);
        state.phi += vr * SLOWMO / s.R0 * dt;
        spin.rotation.z = -state.phi;
        // Fahrbahn läuft relativ zum Rad mit −v unter der Kursrichtung ψ + δ − α durch
        const course = s.delta - s.alpha;
        const d = s.v * SLOWMO * dt;
        state.roadX = (state.roadX - d * Math.cos(course)) % CELL;
        state.roadZ = (state.roadZ + d * Math.sin(course)) % CELL;
        grid.position.set(state.roadX, 0, state.roadZ);
      }
      render();
      state.raf = requestAnimationFrame(tick);
    }

    return {
      update, setMode,
      start() { if (state.running) return; state.running = true; state.last = 0; resize(); state.raf = requestAnimationFrame(tick); },
      stop() { state.running = false; cancelAnimationFrame(state.raf); },
    };
  }

  root.KReifen3D = { create };
})(window);
