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
  { id: 'scifi', label: 'Sci-Fi Megacity', desc: 'Podium arcologies, glass domes & energy conduits' }
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

// Roof plane height of the flattened buildings in QR mode
const QR_ROOF_HEIGHT = 0.35;
// QR spec quiet zone: 4 light modules around the symbol
const QR_QUIET_ZONE = 4;

// Building footprint per style in 3D mode (1.0 = full QR module)
const STYLE_FOOTPRINT = { metropolis: 0.82, cyberpunk: 0.66, artdeco: 0.88, voxel: 0.94, scifi: 0.9 };

const NEON_PINK = '#ff2bd6';
const GOLD = '#e0b44c';
const VOXEL_COLORS = ['#e76f51', '#f4a261', '#e9c46a', '#2a9d8f', '#8ab17d', '#7b8fd6'];

// Outward directions of the four facades (plane default faces +z)
const FACE_DIRS = [
  { x: 1, z: 0, rotY: Math.PI / 2 },
  { x: -1, z: 0, rotY: -Math.PI / 2 },
  { x: 0, z: 1, rotY: 0 },
  { x: 0, z: -1, rotY: Math.PI }
];

// Pseudo-random value in [0, 1) seeded by grid position
function hash(r, c, salt = 0) {
  const seed = Math.sin(r * 12.9898 + c * 78.233 + salt * 37.719) * 43758.5453;
  return seed - Math.floor(seed);
}

function mixColor(a, b, t) {
  return new THREE.Color(a).lerp(new THREE.Color(b), t);
}

// Unit box with two material slots: walls (0) and roof (1), two draw calls.
// BoxGeometry face order is +x, -x, +y, -y, +z, -z with 6 indices each;
// the +y face moves to the end so the walls form one contiguous group.
function createBuildingGeometry() {
  const geo = new THREE.BoxGeometry(1, 1, 1);
  const idx = Array.from(geo.index.array);
  geo.setIndex([...idx.slice(0, 12), ...idx.slice(18), ...idx.slice(12, 18)]);
  geo.clearGroups();
  geo.addGroup(0, 30, 0);
  geo.addGroup(30, 6, 1);
  return geo;
}

// Single-material box for setback tiers, one draw call. Its top face (+y,
// vertices 8-11) samples a single facade texel at the texture edge, so the
// setbacks read as plain stone instead of windows.
function createTierGeometry() {
  const geo = new THREE.BoxGeometry(1, 1, 1);
  geo.clearGroups();
  for (let i = 8; i < 12; i++) geo.attributes.uv.setXY(i, 0.01, 0.01);
  return geo;
}

// Decor pieces: update(t, h, fp, top, b) places them for morph state t, with
// h/fp the current body height/footprint and top the height of the tier stack

// Sits on top of the stack and shrinks away in QR mode
function topDecor(mesh, lift) {
  return {
    mesh,
    update(t, h, fp, top) {
      const k = 1 - t;
      mesh.position.y = top + lift * k;
      mesh.scale.setScalar(Math.max(k, 0.001));
      mesh.visible = t < 0.95;
    }
  };
}

// Wraps around the body at a fraction of its height
function bodyBand(mesh, frac, inflate) {
  return {
    mesh,
    update(t, h, fp) {
      mesh.position.y = h * frac;
      mesh.scale.set(fp + inflate, 1, fp + inflate);
      mesh.visible = t < 0.4;
    }
  };
}

// Hangs on one facade of the body
function sideDecor(mesh, frac, dir) {
  return {
    mesh,
    update(t, h, fp) {
      mesh.position.set(dir.x * (fp / 2 + 0.02), h * frac, dir.z * (fp / 2 + 0.02));
      mesh.visible = t < 0.4;
    }
  };
}

// Encircles the first tier at a fraction of its height
function tierRing(mesh, frac) {
  return {
    mesh,
    update(t, h, fp, top, b) {
      const k = 1 - t;
      mesh.position.y = h + b.tiers[0].height * k * frac;
      mesh.scale.setScalar(Math.max(k, 0.001));
      mesh.visible = t < 0.9;
    }
  };
}

export class CityEngine {
  constructor(canvasContainer, options = {}) {
    this.container = canvasContainer;
    this.onModeChange = options.onModeChange || (() => {});
    // Screen margins (px) covered by UI overlays; the QR view is framed into the rest
    this.getViewInsets = options.getViewInsets || (() => ({ top: 0, right: 0, bottom: 0, left: 0 }));
    this.userInteracting = false;

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
    this.decorGroup = new THREE.Group(); // Street-level style decor, hidden in QR mode
    this.groundMesh = null;
    this.lights = {};

    // Per-build style resources
    this.styleAssets = []; // Geometries, materials, textures to dispose on rebuild
    this.qrDarkMats = []; // Building surfaces that fade to the dark module colour
    this.glowMats = []; // Emissive materials whose glow fades out in QR mode
    this.footprint3D = STYLE_FOOTPRINT.metropolis;

    // QR Data
    this.text = options.text || 'https://xallace.github.io/';
    this.moduleCount = 25;
    this.matrix = [];
    this.buildings = []; // Array of { group, bodyMesh, bodyHeight, tiers, decor, r, c, isFinder }
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
      this.controls.addEventListener('start', () => { this.userInteracting = true; });
      this.controls.addEventListener('end', () => { this.userInteracting = false; });
    }

    // 5. Lighting
    this.setupLighting();

    // 6. Groups
    this.scene.add(this.cityGroup);
    this.scene.add(this.trafficGroup);
    this.scene.add(this.decorGroup);

    // 7. Generate QR and build city
    this.updateQR(this.text);

    // 8. Events
    window.addEventListener('resize', this.onResize.bind(this));

    // 9. Start loop
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

  // Facade texture of the active style; null for plain-coloured voxel blocks
  generateFacadeTexture() {
    if (this.style === 'voxel') return null;

    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    const pal = this.palette;

    if (this.style === 'cyberpunk') {
      // Dense grid of small windows lit in neon colours (also the glow map)
      ctx.fillStyle = '#05060a';
      ctx.fillRect(0, 0, 128, 256);
      const neon = [pal.windowLit, pal.accent, NEON_PINK];
      for (let r = 0; r < 36; r++) {
        for (let c = 0; c < 12; c++) {
          if (Math.random() > 0.38) continue;
          ctx.fillStyle = neon[Math.floor(Math.random() * neon.length)];
          ctx.fillRect(4 + c * 10, 4 + r * 7, 7, 4);
        }
      }
    } else if (this.style === 'artdeco') {
      // Light stone with fluted pilasters and tall narrow windows
      ctx.fillStyle = '#d8cfbd';
      ctx.fillRect(0, 0, 128, 256);
      ctx.fillStyle = '#f1ebdf';
      for (let x = 0; x < 128; x += 16) ctx.fillRect(x, 0, 4, 256);
      for (let r = 0; r < 12; r++) {
        for (let c = 0; c < 8; c++) {
          ctx.fillStyle = Math.random() > 0.55 ? pal.windowLit : '#3b3a40';
          ctx.fillRect(7 + c * 16, 6 + r * 21, 6, 15);
        }
      }
    } else if (this.style === 'scifi') {
      // Dark hull panels with bright energy strips (also the glow map)
      ctx.fillStyle = '#1a2130';
      ctx.fillRect(0, 0, 128, 256);
      ctx.strokeStyle = '#2c3648';
      ctx.lineWidth = 2;
      for (let y = 0; y < 256; y += 32) ctx.strokeRect(1, y + 1, 126, 30);
      ctx.fillStyle = '#ffffff';
      for (let y = 14; y < 256; y += 64) ctx.fillRect(0, y, 128, 3);
      for (let x = 30; x < 128; x += 64) ctx.fillRect(x, 0, 2, 256);
    } else {
      // Metropolis: dark glass curtain wall with a regular window grid
      ctx.fillStyle = '#080c14';
      ctx.fillRect(0, 0, 128, 256);

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
            ctx.fillStyle = pal.windowLit;
            ctx.shadowColor = pal.windowLit;
            ctx.shadowBlur = 4;
          } else {
            ctx.fillStyle = pal.windowUnlit;
            ctx.shadowBlur = 0;
          }
          ctx.fillRect(8 + c * (w + gapX), 8 + r * (h + gapY), w, h);
        }
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
    this.refreshQrCamera();
  }

  buildCity() {
    // Clear previous city, street decor and the style's GPU resources
    this.cityGroup.clear();
    this.decorGroup.clear();
    this.styleAssets.forEach(asset => asset.dispose());
    this.styleAssets = [];
    this.qrDarkMats = [];
    this.glowMats = [];
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

    // 3. Shared geometries and materials of the active style
    const kit = this.createStyleKit();
    this.footprint3D = STYLE_FOOTPRINT[this.style] || STYLE_FOOTPRINT.metropolis;

    const centerDistMax = Math.hypot(N / 2, N / 2);

    for (let r = 0; r < N; r++) {
      for (let c = 0; c < N; c++) {
        const posX = (c - N / 2 + 0.5) * cellSpacing;
        const posZ = (r - N / 2 + 0.5) * cellSpacing;

        // Empty module = street / plaza
        if (!this.matrix[r][c]) {
          if (kit.street && !isFinder(r, c)) kit.street(posX, posZ, hash(r, c, 3.7));
          continue;
        }

        const distFromCenter = Math.hypot(c - N / 2, r - N / 2);
        const site = {
          r,
          c,
          cf: 1.0 - (distFromCenter / centerDistMax), // 1 at the centre, 0 at the corners
          rand: hash(r, c),
          rand2: hash(r, c, 1.3),
          isF: isFinder(r, c),
          isFC: isFinderCenter(r, c)
        };

        const group = new THREE.Group();
        group.position.set(posX, 0, posZ);
        this.cityGroup.add(group);

        const building = {
          group,
          bodyMesh: null,
          bodyHeight: 1,
          tiers: [],
          decor: [],
          r,
          c,
          isFinder: site.isF,
          isFinderCenter: site.isFC
        };
        kit.build(building, site);
        this.buildings.push(building);
      }
    }

    if (kit.landmarks) kit.landmarks(N);

    // 4. Initialize Traffic Particles along street corridors
    this.setupTraffic(N, cellSpacing);

    // Apply current morph state
    this.applyMorph(this.morphT);
  }

  // Builders, geometries and materials for the active style and palette.
  // Every building gets a body box that morphs into its QR module; tiers
  // collapse onto it and decor shrinks away, so all styles scan the same.
  createStyleKit() {
    const pal = this.palette;
    const district = this.decorGroup;
    const track = asset => { this.styleAssets.push(asset); return asset; };

    const roofColor = this.highContrast ? '#000000' : pal.roofColor;
    this.qrRoofColor = new THREE.Color(roofColor).multiplyScalar(0.3);

    // Building surfaces fade to the dark module colour and turn matte in QR
    // mode, so the top-down fill light cannot glare off them; glow fades out
    const surface = params => {
      const mat = track(new THREE.MeshStandardMaterial(params));
      this.qrDarkMats.push({ mat, base: mat.color.clone(), roughness: mat.roughness, metalness: mat.metalness });
      if (params.emissiveMap) this.glowMats.push({ mat, intensity: mat.emissiveIntensity });
      return mat;
    };
    const basic = (color, extra = {}) => track(new THREE.MeshBasicMaterial({ color: new THREE.Color(color), ...extra }));

    const facade = this.generateFacadeTexture();
    if (facade) track(facade);
    const box = track(createBuildingGeometry());
    const tierBox = track(createTierGeometry());

    const mesh = (geo, mat, castShadow = false) => {
      const m = new THREE.Mesh(geo, mat);
      m.castShadow = castShadow;
      return m;
    };
    const addBody = (b, materials, height) => {
      b.bodyMesh = mesh(box, materials, true);
      b.bodyMesh.receiveShadow = true;
      b.bodyHeight = height;
      b.group.add(b.bodyMesh);
    };
    // [wall, roof] gets a separate roof colour; a single material saves a draw call
    const addTier = (b, materials, footprint, height) => {
      const tier = mesh(Array.isArray(materials) ? box : tierBox, materials, true);
      tier.receiveShadow = true;
      b.tiers.push({ mesh: tier, footprint, height });
      b.group.add(tier);
    };
    const addDecor = (b, decor) => {
      b.decor.push(decor);
      b.group.add(decor.mesh);
    };

    switch (this.style) {
      case 'cyberpunk': {
        const wall = surface({
          color: new THREE.Color(pal.buildingBase), roughness: 0.5, metalness: 0.5, map: facade,
          emissive: new THREE.Color('#ffffff'), emissiveMap: facade, emissiveIntensity: 0.85
        });
        const roof = surface({ color: new THREE.Color(roofColor), roughness: 0.3, metalness: 0.7 });
        const neon = [basic(pal.accent), basic(NEON_PINK)];
        const signs = [pal.accent, NEON_PINK].map(col => basic(col, { side: THREE.DoubleSide, transparent: true, opacity: 0.85 }));
        const mastMat = track(new THREE.MeshStandardMaterial({ color: 0x8a94a6, roughness: 0.4, metalness: 0.8 }));
        const beaconMat = basic('#ff3355');
        const bandGeo = track(new THREE.BoxGeometry(1, 0.06, 1));
        const signGeo = track(new THREE.PlaneGeometry(0.42, 1.1));
        const mastGeo = track(new THREE.CylinderGeometry(0.02, 0.035, 1.6, 6));
        const beaconGeo = track(new THREE.SphereGeometry(0.06, 8, 6));

        return {
          build(b, s) {
            // Thin monoliths with a spiky, uneven skyline
            let height = 3.0 + s.cf * 7.0 + s.rand * s.rand * 9.0;
            if (s.isFC) height = 16.0 + (s.r % 2);
            else if (s.isF) height = 7.0 + s.rand * 2.0;
            addBody(b, [wall, roof], height);

            // Neon bands wrapped around the facade
            if (height > 4.0) {
              addDecor(b, bodyBand(mesh(bandGeo, neon[(s.r + s.c) % 2]), 0.3 + s.rand * 0.15, 0.05));
              if (s.rand2 > 0.45) {
                addDecor(b, bodyBand(mesh(bandGeo, neon[(s.r + s.c + 1) % 2]), 0.7 + s.rand2 * 0.2, 0.05));
              }
            }

            // Holographic billboard on one facade
            if (!s.isF && height > 6.0 && s.rand2 > 0.55) {
              const dir = FACE_DIRS[Math.floor(s.rand * 4)];
              const sign = mesh(signGeo, signs[s.c % 2]);
              sign.rotation.y = dir.rotY;
              addDecor(b, sideDecor(sign, 0.55, dir));
            }

            // Antenna mast with a red beacon
            if (s.isFC || s.rand2 > 0.75) {
              const antenna = new THREE.Group();
              antenna.add(mesh(mastGeo, mastMat));
              const beacon = mesh(beaconGeo, beaconMat);
              beacon.position.y = 0.8;
              antenna.add(beacon);
              addDecor(b, topDecor(antenna, 0.8));
            }
          }
        };
      }

      case 'artdeco': {
        const wall = surface({ color: mixColor(pal.buildingBase, '#c9b58a', 0.55), roughness: 0.8, metalness: 0.05, map: facade });
        const roof = surface({ color: mixColor(roofColor, '#7a5c2e', 0.35), roughness: 0.5, metalness: 0.4 });
        const gold = track(new THREE.MeshStandardMaterial({
          color: new THREE.Color(GOLD), roughness: 0.35, metalness: 0.4,
          emissive: new THREE.Color('#5a3d0a'), emissiveIntensity: 0.6
        }));
        const trimGeo = track(new THREE.BoxGeometry(1, 0.08, 1));
        const spireGeo = track(new THREE.CylinderGeometry(0.0, 0.1, 2.6, 8));

        return {
          build(b, s) {
            // Stepped ziggurats: wide base, two setback tiers, gold crown
            let total = 2.5 + s.cf * 6.0 + s.rand * 2.5;
            if (s.isFC) total = 13.0 + (s.r % 2);
            else if (s.isF) total = 5.0 + s.rand;
            const stepped = (!s.isF || s.isFC) && total > 4.0;

            addBody(b, [wall, roof], stepped ? total * 0.55 : total);
            addDecor(b, bodyBand(mesh(trimGeo, gold), 1.0, 0.04)); // Gold cornice

            if (stepped) {
              addTier(b, wall, 0.64, total * 0.25);
              addTier(b, wall, 0.4, total * 0.2);
              if (s.isFC || (total > 7.0 && s.rand2 > 0.6)) {
                addDecor(b, topDecor(mesh(spireGeo, gold), 1.3));
              }
            }
          }
        };
      }

      case 'voxel': {
        const walls = VOXEL_COLORS.map(col => surface({ color: mixColor(col, pal.buildingBase, 0.35), roughness: 0.9, metalness: 0.0 }));
        const roofs = VOXEL_COLORS.map(col => surface({
          color: mixColor(col, '#ffffff', 0.2).lerp(new THREE.Color(pal.buildingBase), 0.3), roughness: 0.9, metalness: 0.0
        }));
        const unitMat = track(new THREE.MeshStandardMaterial({ color: 0xd9dee7, roughness: 0.8 }));
        const grassMat = track(new THREE.MeshStandardMaterial({ color: mixColor('#7cb342', pal.buildingBase, 0.25), roughness: 1.0 }));
        const leafMat = track(new THREE.MeshStandardMaterial({ color: mixColor('#3f9b4a', pal.buildingBase, 0.2), roughness: 0.9 }));
        const trunkMat = track(new THREE.MeshStandardMaterial({ color: 0x6b4a2b, roughness: 1.0 }));
        const unitGeo = track(new THREE.BoxGeometry(0.3, 0.3, 0.3));
        const grassGeo = track(new THREE.PlaneGeometry(0.92, 0.92));
        const trunkGeo = track(new THREE.BoxGeometry(0.08, 0.3, 0.08));
        const leafGeo = track(new THREE.BoxGeometry(0.42, 0.42, 0.42));

        return {
          build(b, s) {
            // Whole-unit block heights, chunky footprints, one colour per block
            let height = 1 + Math.floor(s.cf * 3.0 + s.rand * 2.5);
            if (s.isFC) height = 6;
            else if (s.isF) height = 3;
            const i = Math.floor(s.rand2 * walls.length);

            addBody(b, [walls[i], roofs[i]], height);
            if (!s.isF && height >= 2 && s.rand2 > 0.55) addTier(b, [walls[i], roofs[i]], 0.56, 1);
            if (s.rand > 0.75) addDecor(b, topDecor(mesh(unitGeo, unitMat), 0.15)); // Rooftop unit
          },

          // Parks with blocky trees on some empty modules
          street(x, z, rnd) {
            if (rnd > 0.3) return;
            const grass = mesh(grassGeo, grassMat);
            grass.rotation.x = -Math.PI / 2;
            grass.position.set(x, 0.006, z);
            grass.receiveShadow = true;
            district.add(grass);

            if (rnd < 0.2) {
              const trunk = mesh(trunkGeo, trunkMat);
              trunk.position.set(x, 0.15, z);
              const leaves = mesh(leafGeo, leafMat, true);
              leaves.position.set(x, 0.5, z);
              district.add(trunk, leaves);
            }
          }
        };
      }

      case 'scifi': {
        const wall = surface({
          color: mixColor('#cfd8e6', pal.buildingBase, 0.3), roughness: 0.3, metalness: 0.6, map: facade,
          emissive: new THREE.Color(pal.accent), emissiveMap: facade, emissiveIntensity: 1.1
        });
        const roof = surface({ color: new THREE.Color(roofColor), roughness: 0.25, metalness: 0.7 });
        const energy = basic(pal.accent);
        const domeMat = track(new THREE.MeshStandardMaterial({
          color: mixColor(pal.accent, '#ffffff', 0.5), roughness: 0.15, metalness: 0.2,
          emissive: new THREE.Color(pal.accent), emissiveIntensity: 0.35, transparent: true, opacity: 0.9
        }));
        const domeGeo = track(new THREE.SphereGeometry(0.24, 12, 4, 0, Math.PI * 2, 0, Math.PI / 2));
        const ringGeo = track(new THREE.TorusGeometry(0.34, 0.03, 4, 16));
        const conduitGeo = track(new THREE.CylinderGeometry(0.07, 0.07, 1, 8));
        const nodeGeo = track(new THREE.SphereGeometry(0.42, 16, 12));

        return {
          build(b, s) {
            // Podium arcologies: wide base, slender tower, glass dome, halo rings
            let podium = 0.6 + s.rand * 0.5;
            if (s.isFC) podium = 1.4;
            else if (s.isF) podium = 1.0 + s.rand * 0.3;
            addBody(b, [wall, roof], podium);

            let tower = 0;
            if (s.isFC) tower = 12.0 + (s.r % 2);
            else if (!s.isF && s.rand > 0.4) tower = 1.5 + s.cf * 7.0 + s.rand2 * 4.0;

            if (tower > 0) {
              addTier(b, [wall, roof], s.isFC ? 0.5 : 0.36 + s.rand2 * 0.14, tower);
              addDecor(b, topDecor(mesh(domeGeo, domeMat), 0));
              const rings = s.isFC ? [0.45, 0.8] : (s.rand2 > 0.65 ? [0.7] : []);
              rings.forEach(frac => {
                const ring = mesh(ringGeo, energy);
                ring.rotation.x = Math.PI / 2;
                addDecor(b, tierRing(ring, frac));
              });
            } else if (s.rand2 > 0.6) {
              addDecor(b, topDecor(mesh(domeGeo, domeMat), 0));
            }
          },

          // Energy conduits linking the three landmark towers
          landmarks(N) {
            const at = (r, c) => new THREE.Vector3(c - N / 2 + 0.5, 9.0, r - N / 2 + 0.5);
            const tl = at(3, 3);
            const tr = at(3, N - 4);
            const bl = at(N - 4, 3);

            [[tl, tr], [tl, bl]].forEach(([from, to]) => {
              const beam = mesh(conduitGeo, energy);
              beam.position.copy(from).add(to).multiplyScalar(0.5);
              beam.scale.y = from.distanceTo(to);
              beam.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), to.clone().sub(from).normalize());
              district.add(beam);
            });
            [tl, tr, bl].forEach(p => {
              const node = mesh(nodeGeo, energy);
              node.position.copy(p);
              district.add(node);
            });
          }
        };
      }

      default: {
        // Metropolis: glass & steel towers with lit office windows, accent spires and helipads
        const wall = surface({
          color: mixColor(pal.buildingBase, '#9fb3c8', 0.6), roughness: 0.35, metalness: 0.65, map: facade,
          emissive: new THREE.Color('#ffffff'), emissiveMap: facade, emissiveIntensity: 0.35
        });
        const roof = surface({ color: new THREE.Color(roofColor), roughness: 0.2, metalness: 0.8 });
        const accent = basic(pal.accent, { side: THREE.DoubleSide });
        const spireGeo = track(new THREE.CylinderGeometry(0.04, 0.08, 2.2, 8));
        const helipadGeo = track(new THREE.RingGeometry(0.18, 0.28, 16));

        return {
          build(b, s) {
            let height = 2.0 + s.cf * 5.5 + s.rand * 3.0;
            if (s.isFC) height = 11.5 + (s.r % 2 === 0 ? 1.0 : 0);
            else if (s.isF) height = 6.0 + s.rand * 1.5;
            addBody(b, [wall, roof], height);

            if (s.isFC || (height > 8.0 && s.rand > 0.65)) {
              addDecor(b, topDecor(mesh(spireGeo, accent), 1.1));
            }
            if (!s.isF && height > 5.0 && height <= 8.0 && s.rand > 0.5) {
              const pad = mesh(helipadGeo, accent);
              pad.rotation.x = -Math.PI / 2;
              addDecor(b, topDecor(pad, 0.01));
            }
          }
        };
      }
    }
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

    const totalSize = N * cellSpacing;
    const halfSize = totalSize / 2;

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

    // Rebuild with facade textures and materials in the new colours
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
    this.startOrbit = new THREE.Spherical().setFromVector3(
      new THREE.Vector3().subVectors(this.startCamPos, this.startCamTarget)
    );
    this.startMorphT = this.morphT;
    this.targetMorphT = this.isQrMode ? 1.0 : 0.0;

    // Start the unwind of the idle drift from the equivalent angle in [-PI, PI]
    const rot = this.scene.rotation.y;
    this.startSceneRotY = Math.atan2(Math.sin(rot), Math.cos(rot));
    this.scene.rotation.y = this.startSceneRotY;

    this.fitQrView();

    if (this.onModeChange) {
      this.onModeChange(this.isQrMode);
    }
  }

  // Frame the QR symbol plus its quiet zone top-down inside the part of the
  // screen that is not covered by UI overlays
  fitQrView() {
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    const ins = this.getViewInsets();
    const freeW = Math.max(1, w - ins.left - ins.right);
    const freeH = Math.max(1, h - ins.top - ins.bottom);

    const span = this.moduleCount + 2 * QR_QUIET_ZONE;
    const tanHalf = Math.tan(THREE.MathUtils.degToRad(this.camera.fov / 2));
    const dist = (span * h) / (2 * tanHalf * Math.min(freeW, freeH));
    const unitsPerPx = (2 * dist * tanHalf) / h;

    // Shift the camera so the symbol centre lands in the centre of the free area
    const offX = -((ins.left - ins.right) / 2) * unitsPerPx;
    const offZ = -((ins.top - ins.bottom) / 2) * unitsPerPx;
    this.camQrTarget.set(offX, 0, offZ);
    this.camQrPos.set(offX, dist + QR_ROOF_HEIGHT, offZ);
  }

  // Re-frame the camera when the symbol size or viewport changes in QR mode
  refreshQrCamera() {
    if (!this.isQrMode) return;
    this.fitQrView();
    if (!this.animatingTransition) {
      this.camera.position.copy(this.camQrPos);
      if (this.controls) this.controls.target.copy(this.camQrTarget);
    }
  }

  applyMorph(t) {
    // t: 0.0 = 3D City Skyline, 1.0 = Scannable 2D QR Code
    // In 3D: Footprint width per style (leaves street canyons for traffic)
    // In QR: Footprint width = 1.00 (expands seamlessly to create unbroken QR finder rings & barcode blocks!)
    const footprint = THREE.MathUtils.lerp(this.footprint3D, 1.0, t);
    const k = 1 - t;

    // Height morph: in QR mode, all buildings flatten into crisp, uniform top plane
    this.buildings.forEach(b => {
      const h = THREE.MathUtils.lerp(b.bodyHeight, QR_ROOF_HEIGHT, t);

      // Scale box geometry: x = footprint, y = h, z = footprint
      b.bodyMesh.scale.set(footprint, h, footprint);
      b.bodyMesh.position.y = h / 2;

      // Setback tiers collapse onto the body
      let top = h;
      b.tiers.forEach(tier => {
        const th = Math.max(tier.height * k, 0.001);
        tier.mesh.scale.set(tier.footprint, th, tier.footprint);
        tier.mesh.position.y = top + th / 2;
        tier.mesh.visible = t < 0.98;
        top += th;
      });

      // Spires, neon, domes etc. shrink away to prevent visual clutter
      b.decor.forEach(d => d.update(t, h, footprint, top, b));
    });

    // Traffic and street decor: fade out in QR mode to keep barcode 100% clean
    this.trafficGroup.visible = this.trafficEnabled && t < 0.3;
    this.decorGroup.visible = t < 0.3;

    // Shadows & Top fill light: In QR mode, activate shadowless top-down illumination
    this.lights.sun.intensity = THREE.MathUtils.lerp(2.4, 0.4, t);
    this.lights.qrFill.intensity = THREE.MathUtils.lerp(0.0, 2.8, t);

    // Dark matte buildings without glow and no fog in QR mode: maximum module
    // contrast for scanners in every style
    this.qrDarkMats.forEach(({ mat, base, roughness, metalness }) => {
      mat.color.copy(base).lerp(this.qrRoofColor, t);
      mat.roughness = THREE.MathUtils.lerp(roughness, 1.0, t);
      mat.metalness = THREE.MathUtils.lerp(metalness, 0.0, t);
    });
    this.glowMats.forEach(({ mat, intensity }) => {
      mat.emissiveIntensity = intensity * k;
    });
    this.scene.fog.density = THREE.MathUtils.lerp(0.012, 0.0, t);
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

      // Glide the camera on a sphere around the moving look-at point, so the
      // azimuth turns smoothly into the upright top-down view. A straight
      // Cartesian lerp leaves a near-zero horizontal offset whose rounding
      // noise decides the final azimuth (snapped or upside-down QR).
      const targetPos = this.isQrMode ? this.camQrPos : this.camCityPos;
      const targetLook = this.isQrMode ? this.camQrTarget : this.camCityTarget;

      const look = new THREE.Vector3().lerpVectors(this.startCamTarget, targetLook, ease);
      const from = this.startOrbit;
      const to = new THREE.Spherical().setFromVector3(new THREE.Vector3().subVectors(targetPos, targetLook));
      const dTheta = Math.atan2(Math.sin(to.theta - from.theta), Math.cos(to.theta - from.theta));
      const orbit = new THREE.Spherical(
        THREE.MathUtils.lerp(from.radius, to.radius, ease),
        THREE.MathUtils.lerp(from.phi, to.phi, ease),
        from.theta + dTheta * ease
      );

      this.camera.position.setFromSpherical(orbit).add(look);
      if (this.controls) {
        this.controls.target.copy(look);
      }

      // Unwind the idle drift so the symbol ends up straight without a snap
      if (this.isQrMode) {
        this.scene.rotation.y = this.startSceneRotY * (1 - ease);
      }

      if (progress >= 1.0) {
        this.animatingTransition = false;
        this.morphT = this.targetMorphT;
        this.applyMorph(this.morphT);
      }
    } else if (!this.isQrMode && this.controls) {
      // Gentle cinematic camera drift in 3D City Mode
      // Only drift if user isn't actively dragging
      if (!this.userInteracting) {
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
    this.refreshQrCamera();
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
