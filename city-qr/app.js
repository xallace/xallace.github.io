/**
 * ============================================================================
 * City QR - Main Application Controller
 * Handles user interactions, preset switching, audio feedback, screenshot
 * capture, and real-time state synchronization.
 * ============================================================================
 */

import { CityEngine, CITY_STYLES, COLOR_PALETTES } from './city-engine.js';

// Application State
const state = {
  url: 'https://xallace.github.io/',
  style: 'metropolis',
  paletteId: 'midnight',
  highContrast: false,
  soundEnabled: true,
  isQrMode: false
};

let engine = null;
let audioCtx = null;

// Sound Synthesizer (Procedural Web Audio API)
function playSound(type) {
  if (!state.soundEnabled) return;
  try {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }

    const t = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);

    if (type === 'click') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, t);
      osc.frequency.exponentialRampToValueAtTime(440, t + 0.06);
      gain.gain.setValueAtTime(0.08, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.06);
      osc.start(t);
      osc.stop(t + 0.06);
    } else if (type === 'glide') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(220, t);
      osc.frequency.exponentialRampToValueAtTime(660, t + 0.35);
      gain.gain.setValueAtTime(0.001, t);
      gain.gain.linearRampToValueAtTime(0.06, t + 0.15);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
      osc.start(t);
      osc.stop(t + 0.4);
    } else if (type === 'capture') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1200, t);
      osc.frequency.setValueAtTime(1800, t + 0.05);
      gain.gain.setValueAtTime(0.12, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
      osc.start(t);
      osc.stop(t + 0.12);
    }
  } catch (err) {
    // Audio context not allowed without prior user gesture
  }
}

// Initialize on DOM load
window.addEventListener('DOMContentLoaded', () => {
  restoreStateFromURL();
  initEngine();
  bindUIEvents();
  updateUI();
});

function initEngine() {
  const container = document.getElementById('canvas-container');
  const pal = COLOR_PALETTES.find(p => p.id === state.paletteId) || COLOR_PALETTES[0];

  engine = new CityEngine(container, {
    text: state.url,
    style: state.style,
    palette: pal,
    getViewInsets,
    onModeChange: (isQr) => {
      state.isQrMode = isQr;
      updateHintBar();
      updateToggleBtn();
      playSound('glide');

      const hud = document.getElementById('scanner-hud');
      if (hud) hud.classList.toggle('active', isQr);
      positionScannerHud();
    }
  });

  window.addEventListener('resize', positionScannerHud);

  // Tap on canvas (without dragging) toggles 3D City <-> QR Scan Mode (like Bubbbly Bloom)
  let pointerDownPos = null;
  let pointerDownTime = 0;

  container.addEventListener('pointerdown', (e) => {
    pointerDownPos = { x: e.clientX, y: e.clientY };
    pointerDownTime = performance.now();
  });

  container.addEventListener('pointerup', (e) => {
    if (!pointerDownPos) return;
    const dist = Math.hypot(e.clientX - pointerDownPos.x, e.clientY - pointerDownPos.y);
    const time = performance.now() - pointerDownTime;

    // If tap was short and not a drag, toggle mode!
    if (dist < 8 && time < 400) {
      engine.toggleViewMode();
    }
    pointerDownPos = null;
  });
}

function bindUIEvents() {
  const inpUrl = document.getElementById('inp-url');
  const btnClear = document.getElementById('btn-clear');
  const btnToggle = document.getElementById('btn-toggle-view');
  const btnCopy = document.getElementById('btn-copy-link');
  const btnDownload = document.getElementById('btn-download');
  const hintBar = document.getElementById('floating-hint');
  const mobileToggle = document.getElementById('mobile-toggle');
  const panel = document.getElementById('control-panel');

  // URL Input with Debounce
  let debounceTimer = null;
  inpUrl.value = state.url;

  inpUrl.addEventListener('input', (e) => {
    state.url = e.target.value.trim() || 'https://xallace.github.io/';
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      engine.updateQR(state.url);
      updateURLParams();
    }, 400);
  });

  inpUrl.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      clearTimeout(debounceTimer);
      state.url = e.target.value.trim() || 'https://xallace.github.io/';
      engine.updateQR(state.url);
      updateURLParams();
      // On enter, smoothly align into QR mode!
      engine.setMode(true);
    }
  });

  btnClear.addEventListener('click', () => {
    inpUrl.value = '';
    inpUrl.focus();
  });

  // Preset Pills
  document.querySelectorAll('.preset-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const url = btn.getAttribute('data-url');
      if (url) {
        inpUrl.value = url;
        state.url = url;
        engine.updateQR(url);
        updateURLParams();
        playSound('click');

        document.querySelectorAll('.preset-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
      }
    });
  });

  // Architectural Styles
  document.querySelectorAll('.style-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const styleId = btn.getAttribute('data-style');
      if (styleId) {
        state.style = styleId;
        engine.setCityStyle(styleId);
        updateURLParams();
        playSound('click');

        document.querySelectorAll('.style-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
      }
    });
  });

  // Color Palettes
  document.querySelectorAll('.palette-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const pid = btn.getAttribute('data-palette');
      if (pid) {
        state.paletteId = pid;
        engine.setColorPalette(pid);
        updateURLParams();
        playSound('click');

        document.querySelectorAll('.palette-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
      }
    });
  });

  // Toggle View Button (3D City <-> QR Scan Mode)
  btnToggle.addEventListener('click', () => {
    engine.toggleViewMode();
    playSound('click');
  });

  // Bottom Floating Hint Bar (Tap to toggle)
  hintBar.addEventListener('click', () => {
    engine.toggleViewMode();
  });

  // Copy Link Button
  btnCopy.addEventListener('click', () => {
    const shareUrl = window.location.href;
    navigator.clipboard.writeText(shareUrl).then(() => {
      showToast('✅ Link copied to clipboard!');
      playSound('click');
    }).catch(() => {
      prompt('Copy share link:', shareUrl);
    });
  });

  // Download High-Res Image
  btnDownload.addEventListener('click', () => {
    playSound('capture');
    const dataUrl = engine.capture(2); // 2x crisp resolution
    const filename = state.isQrMode ? 'city-qr-code.png' : 'city-skyline-3d.png';

    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    showToast('📸 Screenshot saved!');
  });

  // Mobile drawer toggle
  if (mobileToggle) {
    mobileToggle.addEventListener('click', () => {
      panel.classList.toggle('mobile-open');
    });
  }
}

// Screen margins (px) the QR code must keep clear of: header on top, hint bar
// at the bottom and, on desktop, the floating control panel on the right
function getViewInsets() {
  const container = document.getElementById('canvas-container');
  const w = container.clientWidth;
  const h = container.clientHeight;
  const gap = 16;
  const insets = { top: 0, right: 0, bottom: 0, left: 0 };

  const header = document.querySelector('.brand-header');
  const hint = document.getElementById('floating-hint');
  const panel = document.getElementById('control-panel');

  if (header) insets.top = header.getBoundingClientRect().bottom + gap;
  if (hint) insets.bottom = h - hint.getBoundingClientRect().top + gap;
  if (panel && !window.matchMedia('(max-width: 768px)').matches) {
    insets.right = w - panel.getBoundingClientRect().left + gap;
  }
  return insets;
}

// Scanner HUD corners frame the same square the engine fits the QR code into
function positionScannerHud() {
  const hud = document.getElementById('scanner-hud');
  const container = document.getElementById('canvas-container');
  if (!hud || !container) return;

  const ins = getViewInsets();
  const freeW = Math.max(1, container.clientWidth - ins.left - ins.right);
  const freeH = Math.max(1, container.clientHeight - ins.top - ins.bottom);

  hud.style.setProperty('--hud-cx', `${ins.left + freeW / 2}px`);
  hud.style.setProperty('--hud-cy', `${ins.top + freeH / 2}px`);
  hud.style.setProperty('--hud-half', `${Math.min(freeW, freeH) / 2}px`);
}

function updateHintBar() {
  const icon = document.getElementById('hint-icon-svg');
  const text = document.getElementById('hint-text-main');
  const sub = document.getElementById('hint-text-sub');

  if (state.isQrMode) {
    icon.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>`;
    text.textContent = '📱 Ready to scan with your camera!';
    sub.textContent = 'Tap to explore 3D skyline';
  } else {
    icon.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>`;
    text.textContent = '🏙️ Tap city to align into scannable QR';
    sub.textContent = 'Or drag to orbit 3D view';
  }
}

function updateToggleBtn() {
  const btn = document.getElementById('btn-toggle-view');
  if (!btn) return;
  if (state.isQrMode) {
    btn.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
      <span>Explore 3D Skyline</span>
    `;
    btn.classList.remove('primary');
  } else {
    btn.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
      <span>Align to Scannable QR</span>
    `;
    btn.classList.add('primary');
  }
}

function updateUI() {
  // Activate selected style button
  document.querySelectorAll('.style-btn').forEach(b => {
    b.classList.toggle('active', b.getAttribute('data-style') === state.style);
  });

  // Activate selected palette button
  document.querySelectorAll('.palette-btn').forEach(b => {
    b.classList.toggle('active', b.getAttribute('data-palette') === state.paletteId);
  });

  updateHintBar();
  updateToggleBtn();
}

function showToast(message) {
  const toast = document.getElementById('toast-notice');
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add('show');
  setTimeout(() => {
    toast.classList.remove('show');
  }, 2200);
}

function updateURLParams() {
  const params = new URLSearchParams();
  if (state.url) params.set('u', state.url);
  if (state.style) params.set('style', state.style);
  if (state.paletteId) params.set('palette', state.paletteId);
  window.history.replaceState(null, '', '?' + params.toString());
}

function restoreStateFromURL() {
  const params = new URLSearchParams(window.location.search);
  if (params.has('u')) state.url = params.get('u');
  if (params.has('style')) state.style = params.get('style');
  if (params.has('palette')) state.paletteId = params.get('palette');
}
