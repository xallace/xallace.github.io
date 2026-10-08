/**
 * ============================================================================
 * CityEngine - 3D Metropolis to Scannable QR Code Engine
 * Built with Three.js. Generates a procedural 3D city skyline that seamlessly
 * aligns and morphs into a scannable QR code.
 * ============================================================================
 */

export const CITY_STYLES = [
  { id: 'metropolis', label: 'Metropolis', desc: 'Modern glass & steel corporate skyline' },
  { id: 'cyberpunk', label: 'Cyberpunk', desc: 'Neo-Tokyo monoliths with glowing neon' },
  { id: 'artdeco', label: 'Art Deco', desc: 'Stepped ziggurats & golden spires' },
  { id: 'voxel', label: 'Voxel City', desc: 'Modular low-poly urban blocks & parks' },
  { id: 'scifi', label: 'Sci-Fi Megacity', desc: 'Futuristic arcologies & energy conduits' }
];

export const COLOR_PALETTES = [
  {
    id: 'midnight',
    label: 'Midnight',
    accent: '#00f0ff',
    bg: '#070a12',
    buildingBase: '#0d1322',
    buildingTop: '#0a0f1d',
    roofColor: '#050811',
    streetColor: '#ffffff', // High contrast for QR scanners
    windowLit: '#00f0ff',
    windowUnlit: '#162238',
    fogColor: '#070a12',
    sunColor: '#38bdf8',
    ambientColor: '#1e293b'
  },
  {
    id: 'sunset',
    label: 'Sunset',
    accent: '#f59e0b',
    bg: '#180e1a',
    buildingBase: '#251728',
    buildingTop: '#1b111e',
    roofColor: '#120b14',
    streetColor: '#fffbeb',
    windowLit: '#fbbf24',
    windowUnlit: '#3b253f',
    fogColor: '#180e1a',
    sunColor: '#f97316',
    ambientColor: '#451a37'
  },
  {
    id: 'daylight',
    label: 'Daylight',
    accent: '#0284c7',
    bg: '#e2e8f0',
    buildingBase: '#334155',
    buildingTop: '#1e293b',
    roofColor: '#0f172a',
    streetColor: '#ffffff',
    windowLit: '#93c5fd',
    windowUnlit: '#475569',
    fogColor: '#cbd5e1',
    sunColor: '#ffffff',
    ambientColor: '#94a3b8'
  },
  {
    id: 'matrix',
    label: 'Matrix',
    accent: '#22c55e',
    bg: '#040d06',
    buildingBase: '#081a0b',
    buildingTop: '#051207',
    roofColor: '#020803',
    streetColor: '#dcfce7',
    windowLit: '#4ade80',
    windowUnlit: '#0f2913',
    fogColor: '#040d06',
    sunColor: '#22c55e',
    ambientColor: '#052e16'
  },
  {
    id: 'synthwave',
    label: 'Synthwave',
    accent: '#d946ef',
    bg: '#120b1e',
    buildingBase: '#241438',
    buildingTop: '#1a0e2a',
    roofColor: '#0f0819',
    streetColor: '#fae8ff',
    windowLit: '#f43f5e',
    windowUnlit: '#381c57',
    fogColor: '#120b1e',
    sunColor: '#e879f9',
    ambientColor: '#3b0764'
  },
  {
    id: 'blueprint',
    label: 'Blueprint',
    accent: '#38bdf8',
    bg: '#0a192f',
    buildingBase: '#0f2b48',
    buildingTop: '#0b2038',
    roofColor: '#061322',
    streetColor: '#f0f9ff',
    windowLit: '#7dd3fc',
    windowUnlit: '#1e3a5f',
    fogColor: '#0a192f',
    sunColor: '#38bdf8',
    ambientColor: '#0c4a6e'
  }
];

export class CityEngine {
  constructor(canvasContainer, options = {}) {
    this.container = canvasContainer;
    this.onModeChange = options.onModeChange || (() => {});

    // State
    this.style = options.style || 'metropolis';
    this.palette = options.palette || COLOR_PALETTES[0];
    this.highContrast = false;
    this.trafficEnabled = true;
    this.isQrMode = false;
    this.animatingTransition = false;
    this.morphT = 0; // 0 = 3D City Skyline, 1 = Scannable QR Code

    // Three.js Core
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.controls = null;
    this.cityGroup = new THREE.Group();
    this.trafficGroup = new THREE.Group();
    this.groundMesh = null;
    this.lights = {};

    // QR Data
    this.text = options.text || 'https://xallace.github.io/';
    this.moduleCount = 25;
    this.matrix = [];
    this.buildings = []; // Array of { mesh, baseHeight, targetHeight, r, c, isFinder }
    this.trafficParticles = [];

    // Camera viewpoints
    this.camCityPos = new THREE.Vector3(26, 32, 26);
    this.camCityTarget = new THREE.Vector3(0, 1.5, 0);
    this.camQrPos = new THREE.Vector3(0, 48, 0);
    this.camQrTarget = new THREE.Vector3(0, 0, 0);
    this.currentCamPos = new THREE.Vector3().copy(this.camCityPos);
    this.currentCamTarget = new THREE.Vector3().copy(this.camCityTarget);

    // Timing
    this.clock = new THREE.Clock();

    this.init();
  }

  init() {
    // 1. Scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(this.palette.bg);
    this.scene.fog = new THREE.FogExp2(this.palette.fogColor, 0.012);

    // 2. Camera
    const aspect = this.container.clientWidth / this.container.clientHeight;
    this.camera = new THREE.PerspectiveCamera(40, aspect, 0.1, 1000);
    this.camera.position.copy(this.camCityPos);

    // 3. Renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, preserveDrawingBuffer: true });
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    this.container.appendChild(this.renderer.domElement);

    // 4. Controls
    if (window.THREE && window.THREE.OrbitControls) {
      this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
      this.controls.enableDamping = true;
      this.controls.dampingFactor = 0.05;
      this.controls.maxPolarAngle = Math.PI / 2 - 0.05; // Don't go below ground
      this.controls.minDistance = 10;
      this.controls.maxDistance = 140;
      this.controls.target.copy(this.camCityTarget);
    }

    // 5. Lighting
    this.setupLighting();

    // 6. Groups
    this.scene.add(this.cityGroup);
    this.scene.add(this.trafficGroup);

    // 7. Textures
    this.windowTexture = this.generateWindowTexture();

    // 8. Generate QR and build city
    this.updateQR(this.text);

    // 9. Events
    window.addEventListener('resize', this.onResize.bind(this));

    // 10. Start loop
    this.animate = this.animate.bind(this);
    requestAnimationFrame(this.animate);
  }

  setupLighting() {
    // Ambient
    this.lights.ambient = new THREE.AmbientLight(this.palette.ambientColor, 1.2);
    this.scene.add(this.lights.ambient);

    // Directional Sun / Key Light
    this.lights.sun = new THREE.DirectionalLight(this.palette.sunColor, 2.4);
    this.lights.sun.position.set(30, 45, 20);
    this.lights.sun.castShadow = true;
    this.lights.sun.shadow.mapSize.width = 2048;
    this.lights.sun.shadow.mapSize.height = 2048;
    this.lights.sun.shadow.camera.near = 0.5;
    this.lights.sun.shadow.camera.far = 150;
    const d = 26;
    this.lights.sun.shadow.camera.left = -d;
    this.lights.sun.shadow.camera.right = d;
    this.lights.sun.shadow.camera.top = d;
    this.lights.sun.shadow.camera.bottom = -d;
    this.lights.sun.shadow.bias = -0.0005;
    this.scene.add(this.lights.sun);

    // Subtle Cyan/Purple Rim Light for depth
    this.lights.rim = new THREE.DirectionalLight(this.palette.accent, 0.9);
    this.lights.rim.position.set(-25, 20, -25);
    this.scene.add(this.lights.rim);

    // Top-down fill light active during QR alignment for perfect shadowless scanning
    this.lights.qrFill = new THREE.DirectionalLight(0xffffff, 0.0);
    this.lights.qrFill.position.set(0, 50, 0);
    this.scene.add(this.lights.qrFill);
  }

  generateWindowTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    // Dark building glass background
    ctx.fillStyle = '#080c14';
    ctx.fillRect(0, 0, 128, 256);

    // Draw grid of windows
    const cols = 8;
    const rows = 24;
    const w = 9;
    const h = 6;
    const gapX = 6;
    const gapY = 4;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        // Randomly lit or unlit
        const isLit = Math.random() > 0.45;
        if (isLit) {
          ctx.fillStyle = this.palette.windowLit;
          ctx.shadowColor = this.palette.windowLit;
          ctx.shadowBlur = 4;
        } else {
          ctx.fillStyle = this.palette.windowUnlit;
          ctx.shadowBlur = 0;
        }
        ctx.fillRect(8 + c * (w + gapX), 8 + r * (h + gapY), w, h);
      }
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(1, 2);
    return tex;
  }

  updateQR(text) {
    this.text = text || 'https://xallace.github.io/';

    // Generate QR matrix using Kazuhiko Arase's qrcode-generator
    // Error correction 'H' = 30% recovery (ideal for 3D barcodes!)
    const qr = window.qrcode(0, 'H');
    qr.addData(this.text);
    qr.make();

    this.moduleCount = qr.getModuleCount();
    this.matrix = [];
    for (let r = 0; r < this.moduleCount; r++) {
      const row = [];
      for (let c = 0; c < this.moduleCount; c++) {
        row.push(qr.isDark(r, c));
      }
      this.matrix.push(row);
    }

    this.buildCity();
  }

  buildCity() {
    // Clear previous
    while (this.cityGroup.children.length > 0) {
      const obj = this.cityGroup.children[0];
      this.cityGroup.remove(obj);
      if (obj.geometry) obj.geometry.dispose();
    }
    this.buildings = [];

    const N = this.moduleCount;
    const cellSpacing = 1.0;
    const totalSize = N * cellSpacing;

    // 1. Build Ground / Street Grid (Light modules & perimeter)
    this.buildGround(totalSize);

    // 2. Identify Finder Patterns (Top-Left, Top-Right, Bottom-Left 7x7 areas)
    const isFinder = (r, c) => {
      const inTL = r < 7 && c < 7;
      const inTR = r < 7 && c >= N - 7;
      const inBL = r >= N - 7 && c < 7;
      return inTL || inTR || inBL;
    };

    const isFinderCenter = (r, c) => {
      const inTLC = r >= 2 && r <= 4 && c >= 2 && c <= 4;
      const inTRC = r >= 2 && r <= 4 && c >= N - 5 && c <= N - 3;
      const inBLC = r >= N - 5 && r <= N - 3 && c >= 2 && c <= 4;
      return inTLC || inTRC || inBLC;
    };

    // Shared geometries and materials
    const boxGeo = new THREE.BoxGeometry(1, 1, 1);

    // Material definitions based on palette and style
    const wallMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(this.palette.buildingBase),
      roughness: 0.35,
      metalness: 0.65,
      map: this.windowTexture
    });

    const roofColor = this.highContrast ? '#000000' : this.palette.roofColor;
    const roofMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(roofColor),
      roughness: 0.2,
      metalness: 0.8
    });

    const spireMat = new THREE.MeshBasicMaterial({
      color: new THREE.Color(this.palette.accent)
    });

    const centerDistMax = Math.hypot(N / 2, N / 2);

    for (let r = 0; r < N; r++) {
      for (let c = 0; c < N; c++) {
        if (!this.matrix[r][c]) continue; // Empty module = street / plaza

        const posX = (c - N / 2 + 0.5) * cellSpacing;
        const posZ = (r - N / 2 + 0.5) * cellSpacing;

        // Calculate procedural 3D height
        const distFromCenter = Math.hypot(c - N / 2, r - N / 2);
        const centerFactor = 1.0 - (distFromCenter / centerDistMax);

        // Pseudo-random noise seeded by position
        const seed = Math.sin(r * 12.9898 + c * 78.233) * 43758.5453;
        const rand = seed - Math.floor(seed);

        let height = 2.0 + centerFactor * 5.5 + rand * 3.0;

        const isF = isFinder(r, c);
        const isFC = isFinderCenter(r, c);

        // Landmark finder core towers rise high with futuristic spires
        if (isFC) {
          height = 11.5 + (r % 2 === 0 ? 1.0 : 0);
        } else if (isF) {
          height = 6.0 + rand * 1.5;
        }

        // Create building group
        const building = new THREE.Group();
        building.position.set(posX, 0, posZ);

        // Building body mesh
        // Use multi-material: sides use window texture, top uses roofMat
        const materials = [
          wallMat, wallMat,
          roofMat, // Top face (+Y)
          wallMat, // Bottom face (-Y)
          wallMat, wallMat
        ];

        const bodyMesh = new THREE.Mesh(boxGeo, materials);
        bodyMesh.castShadow = true;
        bodyMesh.receiveShadow = true;
        building.add(bodyMesh);

        // Optional architectural antenna/spire on tallest towers in 3D mode
        let spire = null;
        if ((isFC || (height > 8.0 && rand > 0.65)) && this.style !== 'voxel') {
          const spireGeo = new THREE.CylinderGeometry(0.04, 0.08, 2.2, 8);
          spire = new THREE.Mesh(spireGeo, spireMat);
          spire.position.y = 0.5 + 1.1; // Sits on top of the box
          building.add(spire);
        }

        // Helipad circle on selected mid-tier roofs
        let helipad = null;
        if (!isF && height > 5.0 && height <= 8.0 && rand > 0.5 && this.style === 'metropolis') {
          const heliGeo = new THREE.RingGeometry(0.18, 0.28, 16);
          const heliMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(this.palette.accent), side: THREE.DoubleSide });
          helipad = new THREE.Mesh(heliGeo, heliMat);
          helipad.rotation.x = -Math.PI / 2;
          helipad.position.y = 0.505;
          building.add(helipad);
        }

        this.cityGroup.add(building);

        this.buildings.push({
          group: building,
          bodyMesh,
          spire,
          helipad,
          baseHeight: height,
          currentHeight: height,
          r,
          c,
          isFinder: isF,
          isFinderCenter: isFC
        });
      }
    }

    // 3. Initialize Traffic Particles along street corridors
    this.setupTraffic(N, cellSpacing);

    // Apply current morph state
    this.applyMorph(this.morphT);
  }

  buildGround(totalSize) {
    if (this.groundMesh) {
      this.scene.remove(this.groundMesh);
      if (this.groundMesh.geometry) this.groundMesh.geometry.dispose();
    }

    const groundSize = totalSize + 14; // Perimeter highway & quiet zone
    const geo = new THREE.PlaneGeometry(groundSize, groundSize);

    // Procedural street pavement texture
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    // Base street color (high-contrast white/light for reliable phone scanner binarization)
    const streetCol = this.highContrast ? '#ffffff' : this.palette.streetColor;
    ctx.fillStyle = streetCol;
    ctx.fillRect(0, 0, 512, 512);

    // Subtle urban grid lines
    ctx.strokeStyle = this.palette.bg;
    ctx.lineWidth = 4;
    ctx.strokeRect(0, 0, 512, 512);

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(this.moduleCount + 14, this.moduleCount + 14);

    const mat = new THREE.MeshStandardMaterial({
      map: tex,
      roughness: 0.6,
      metalness: 0.1
    });

    this.groundMesh = new THREE.Mesh(geo, mat);
    this.groundMesh.rotation.x = -Math.PI / 2;
    this.groundMesh.position.y = -0.01;
    this.groundMesh.receiveShadow = true;
    this.scene.add(this.groundMesh);
  }

  setupTraffic(N, cellSpacing) {
    while (this.trafficGroup.children.length > 0) {
      this.trafficGroup.remove(this.trafficGroup.children[0]);
    }
    this.trafficParticles = [];

    const numCars = 40;
    const carGeo = new THREE.BoxGeometry(0.35, 0.1, 0.15);
    const headMat = new THREE.MeshBasicMaterial({ color: 0xfff4cc }); // Warm headlight
    const tailMat = new THREE.MeshBasicMaterial({ color: 0xff2244 }); // Red taillight

    const halfSize = (N * cellSpacing) / 2;

    for (let i = 0; i < numCars; i++) {
      const isEastWest = i % 2 === 0;
      const speed = (0.04 + Math.random() * 0.05) * (Math.random() > 0.5 ? 1 : -1);

      // Pick an open street coordinate
      const streetIdx = Math.floor(Math.random() * N);
      const streetCoord = (streetIdx - N / 2 + 0.5) * cellSpacing;

      const car = new THREE.Group();
      const body = new THREE.Mesh(carGeo, Math.random() > 0.5 ? headMat : tailMat);
      car.add(body);

      if (isEastWest) {
        car.position.set((Math.random() - 0.5) * totalSize, 0.08, streetCoord);
        car.rotation.y = speed > 0 ? 0 : Math.PI;
      } else {
        car.position.set(streetCoord, 0.08, (Math.random() - 0.5) * totalSize);
        car.rotation.y = speed > 0 ? Math.PI / 2 : -Math.PI / 2;
      }

      this.trafficGroup.add(car);
      this.trafficParticles.push({
        group: car,
        isEastWest,
        speed,
        bound: halfSize + 5
      });
    }
    const totalSize = N * cellSpacing;
  }

  setCityStyle(styleId) {
    this.style = styleId;
    this.buildCity();
  }

  setColorPalette(paletteId) {
    const pal = COLOR_PALETTES.find(p => p.id === paletteId) || COLOR_PALETTES[0];
    this.palette = pal;

    // Update scene colors
    this.scene.background.set(this.palette.bg);
    this.scene.fog.color.set(this.palette.fogColor);
    this.lights.ambient.color.set(this.palette.ambientColor);
    this.lights.sun.color.set(this.palette.sunColor);
    this.lights.rim.color.set(this.palette.accent);

    // Refresh window texture
    this.windowTexture = this.generateWindowTexture();
    this.buildCity();
  }

  setHighContrast(enabled) {
    this.highContrast = enabled;
    this.buildCity();
  }

  toggleViewMode() {
    this.setMode(!this.isQrMode);
  }

  setMode(toQrMode) {
    if (this.isQrMode === toQrMode && !this.animatingTransition) return;
    this.isQrMode = toQrMode;
    this.animatingTransition = true;
    this.transitionStart = performance.now();
    this.transitionDuration = 1200; // ms
    this.startCamPos = this.camera.position.clone();
    this.startCamTarget = this.controls ? this.controls.target.clone() : new THREE.Vector3();
    this.startMorphT = this.morphT;
    this.targetMorphT = this.isQrMode ? 1.0 : 0.0;

    // Calculate camera distance for top-down QR mode
    const distNeeded = (this.moduleCount * 1.0) / (2 * Math.tan((this.camera.fov * Math.PI) / 360)) + 6;
    this.camQrPos.set(0, distNeeded, 0);

    if (this.onModeChange) {
      this.onModeChange(this.isQrMode);
    }
  }

  applyMorph(t) {
    // t: 0.0 = 3D City Skyline, 1.0 = Scannable 2D QR Code
    // In 3D: Footprint width = 0.82 (leaves realistic street canyons for traffic)
    // In QR: Footprint width = 1.00 (expands seamlessly to create unbroken QR finder rings & barcode blocks!)
    const footprint = THREE.MathUtils.lerp(0.82, 1.0, t);

    // Height morph: in QR mode, all buildings flatten into crisp, uniform top plane
    const uniformQrHeight = 0.35;

    this.buildings.forEach(b => {
      const h = THREE.MathUtils.lerp(b.baseHeight, uniformQrHeight, t);
      b.currentHeight = h;

      // Scale box geometry: x = footprint, y = h, z = footprint
      b.bodyMesh.scale.set(footprint, h, footprint);
      b.bodyMesh.position.y = h / 2;

      // Spire & helipad scale down in QR mode to prevent visual clutter
      if (b.spire) {
        b.spire.scale.set(1 - t, 1 - t, 1 - t);
        b.spire.position.y = h + (1.1 * (1 - t));
        b.spire.visible = t < 0.95;
      }
      if (b.helipad) {
        b.helipad.position.y = h + 0.01;
        b.helipad.visible = t < 0.8;
      }
    });

    // Traffic visibility: fade out in QR mode to keep barcode 100% clean
    this.trafficGroup.visible = this.trafficEnabled && t < 0.3;

    // Shadows & Top fill light: In QR mode, activate shadowless top-down illumination
    this.lights.sun.intensity = THREE.MathUtils.lerp(2.4, 0.4, t);
    this.lights.qrFill.intensity = THREE.MathUtils.lerp(0.0, 2.8, t);
  }

  animate() {
    requestAnimationFrame(this.animate);

    const delta = this.clock.getDelta();

    // 1. Handle Smooth Morph & Camera Glide
    if (this.animatingTransition) {
      const elapsed = performance.now() - this.transitionStart;
      const progress = Math.min(1.0, elapsed / this.transitionDuration);

      // Smooth cubic ease-in-out
      const ease = progress < 0.5
        ? 4 * progress * progress * progress
        : 1 - Math.pow(-2 * progress + 2, 3) / 2;

      this.morphT = THREE.MathUtils.lerp(this.startMorphT, this.targetMorphT, ease);
      this.applyMorph(this.morphT);

      // Interpolate Camera Position
      const targetPos = this.isQrMode ? this.camQrPos : this.camCityPos;
      const targetLook = this.isQrMode ? this.camQrTarget : this.camCityTarget;

      this.camera.position.lerpVectors(this.startCamPos, targetPos, ease);
      if (this.controls) {
        this.controls.target.lerpVectors(this.startCamTarget, targetLook, ease);
      }

      if (progress >= 1.0) {
        this.animatingTransition = false;
        this.morphT = this.targetMorphT;
        this.applyMorph(this.morphT);
      }
    } else if (!this.isQrMode && this.controls) {
      // Gentle cinematic camera drift in 3D City Mode
      // Only drift if user isn't actively dragging
      if (!this.controls.state || this.controls.state === -1) {
        this.scene.rotation.y += 0.0006;
      }
    } else if (this.isQrMode) {
      this.scene.rotation.y = 0; // Lock perfectly straight for camera scanner
    }

    // 2. Animate Traffic Streaks
    if (this.trafficEnabled && this.trafficGroup.visible) {
      this.trafficParticles.forEach(p => {
        if (p.isEastWest) {
          p.group.position.x += p.speed;
          if (p.group.position.x > p.bound) p.group.position.x = -p.bound;
          if (p.group.position.x < -p.bound) p.group.position.x = p.bound;
        } else {
          p.group.position.z += p.speed;
          if (p.group.position.z > p.bound) p.group.position.z = -p.bound;
          if (p.group.position.z < -p.bound) p.group.position.z = p.bound;
        }
      });
    }

    if (this.controls) {
      this.controls.update();
    }

    this.renderer.render(this.scene, this.camera);
  }

  onResize() {
    if (!this.container || !this.renderer || !this.camera) return;
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  }

  capture(resolutionMultiplier = 2) {
    // Render high-res screenshot
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    this.renderer.setSize(w * resolutionMultiplier, h * resolutionMultiplier);
    this.renderer.render(this.scene, this.camera);
    const dataUrl = this.renderer.domElement.toDataURL('image/png');
    this.renderer.setSize(w, h); // Reset
    return dataUrl;
  }
}
