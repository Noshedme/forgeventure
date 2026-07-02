// Singleton — manages click SFX + background music across the entire app.
// Uses Web Audio API for clicks (anti-saturation pool) + HTMLAudioElement for BG loop.
// Settings persist in localStorage.

const KEYS = {
  click: "fv_sound_click",
  bg:    "fv_sound_bg",
  vol:   "fv_sound_vol",
  track: "fv_sound_track",
};

const CLICK_SRC   = "/sounds/click.wav";
const LEVELUP_SRC = "/sounds/levelup.wav";
const BG_SRC      = "/sounds/bg-ambient.wav";

export const TRACKS = [
  { id: "ambient", label: "Lofi Ambient", src: "/sounds/bg-ambient.wav" },
  { id: "battle",  label: "Battle Theme", src: "/sounds/bg-battle.wav"  },
  { id: "tavern",  label: "Taberna",      src: "/sounds/bg-tavern.wav"  },
];
const CLICK_VOL   = 0.55;   // gain for each click burst
const CLICK_POOL  = 4;       // simultaneous click voices max
const CLICK_COOLDOWN_MS = 40; // minimum ms between click triggers (debounce saturation)
const BG_FADE_MS  = 800;     // fade in/out duration when toggling bg music

function readBool(key, def = true) {
  const v = localStorage.getItem(key);
  return v === null ? def : v === "1";
}

class SoundManager {
  constructor() {
    this.clickEnabled  = readBool(KEYS.click, true);
    this.bgEnabled     = readBool(KEYS.bg,   false);
    this.bgVolume      = parseFloat(localStorage.getItem(KEYS.vol)   || "0.35");
    this.currentTrack  = localStorage.getItem(KEYS.track) || TRACKS[0].id;

    // Web Audio API — lazily created after first user gesture
    this._ctx          = null;
    this._clickBuffer  = null;  // decoded AudioBuffer for click WAV
    this._levelBuffer  = null;  // decoded AudioBuffer for level-up WAV
    this._clickPool    = [];    // active AudioBufferSourceNode pool
    this._clickGain    = null;  // master gain for click channel
    this._levelGain    = null;  // master gain for level-up channel
    this._lastClick    = 0;     // timestamp of last playClick call

    // Background music — plain HTMLAudioElement (handles loop natively)
    this._bgEl        = null;
    this._bgGainNode  = null;  // Web Audio gain node for smooth fades
    this._bgSource    = null;  // MediaElementSourceNode (created once)
    this._bgFadeTimer = null;

    this._listeners   = new Set();
    this._unlocked    = false;
    this._clickLoaded = false;
  }

  // ── Internal helpers ──────────────────────────────────────────

  _notify() {
    this._listeners.forEach(fn => fn({
      clickEnabled:  this.clickEnabled,
      bgEnabled:     this.bgEnabled,
      bgVolume:      this.bgVolume,
      currentTrack:  this.currentTrack,
    }));
  }

  _ensureCtx() {
    if (this._ctx) return this._ctx;
    this._ctx = new (window.AudioContext || window.webkitAudioContext)();
    return this._ctx;
  }

  async _loadClickBuffer() {
    if (this._clickLoaded) return;
    this._clickLoaded = true;
    try {
      const ctx  = this._ensureCtx();
      const resp = await fetch(CLICK_SRC);
      if (!resp.ok) return;
      const raw  = await resp.arrayBuffer();
      this._clickBuffer = await ctx.decodeAudioData(raw);
      this._clickGain = ctx.createGain();
      this._clickGain.gain.value = CLICK_VOL;
      this._clickGain.connect(ctx.destination);
    } catch (_) {}
    // Pre-load level-up buffer at the same time
    this._loadLevelBuffer();
  }

  async _loadLevelBuffer() {
    if (this._levelBuffer) return;
    try {
      const ctx  = this._ensureCtx();
      const resp = await fetch(LEVELUP_SRC);
      if (!resp.ok) return;
      const raw  = await resp.arrayBuffer();
      this._levelBuffer = await ctx.decodeAudioData(raw);
      this._levelGain = ctx.createGain();
      this._levelGain.gain.value = 0.85;
      this._levelGain.connect(ctx.destination);
    } catch (_) {}
  }

  _ensureBgEl() {
    if (this._bgEl) return;
    const track = TRACKS.find(t => t.id === this.currentTrack) || TRACKS[0];
    this._bgEl          = new Audio(track.src);
    this._bgEl.loop     = true;
    this._bgEl.preload  = "auto";
    // Wire through Web Audio for smooth gain fades
    const ctx          = this._ensureCtx();
    this._bgSource     = ctx.createMediaElementSource(this._bgEl);
    this._bgGainNode   = ctx.createGain();
    this._bgGainNode.gain.value = 0; // start silent; fade in on play
    this._bgSource.connect(this._bgGainNode);
    this._bgGainNode.connect(ctx.destination);
  }

  _bgFadeTo(targetGain, durationMs, onDone) {
    const ctx  = this._ensureCtx();
    const node = this._bgGainNode;
    if (!node) return;
    clearTimeout(this._bgFadeTimer);
    const dur = durationMs / 1000;
    node.gain.cancelScheduledValues(ctx.currentTime);
    node.gain.setValueAtTime(node.gain.value, ctx.currentTime);
    node.gain.linearRampToValueAtTime(targetGain, ctx.currentTime + dur);
    if (onDone) {
      this._bgFadeTimer = setTimeout(onDone, durationMs);
    }
  }

  // ── Public API ────────────────────────────────────────────────

  subscribe(fn) {
    this._listeners.add(fn);
    return () => this._listeners.delete(fn);
  }

  // Call once on first user gesture (pointerdown) to unblock autoplay
  unlockAudio() {
    if (this._unlocked) return;
    this._unlocked = true;
    const ctx = this._ensureCtx();
    // Resume AudioContext if suspended (Chrome autoplay policy)
    if (ctx.state === "suspended") ctx.resume().catch(() => {});
    // Pre-load click buffer
    this._loadClickBuffer();
    // Start bg music if it was saved as enabled
    if (this.bgEnabled) {
      this._startBg();
    }
  }

  // ── Click SFX ─────────────────────────────────────────────────

  playClick() {
    if (!this.clickEnabled || !this._unlocked) return;
    const now = performance.now();
    if (now - this._lastClick < CLICK_COOLDOWN_MS) return; // debounce rapid fire
    this._lastClick = now;

    if (!this._clickBuffer || !this._clickGain) {
      // Buffer not loaded yet — trigger load and silently skip this click
      this._loadClickBuffer();
      return;
    }
    // Limit simultaneous voices to CLICK_POOL to avoid saturation
    if (this._clickPool.length >= CLICK_POOL) {
      try { this._clickPool.shift()?.stop(); } catch (_) {}
    }
    try {
      const ctx = this._ensureCtx();
      if (ctx.state === "suspended") ctx.resume().catch(() => {});
      const src = ctx.createBufferSource();
      src.buffer = this._clickBuffer;
      src.connect(this._clickGain);
      src.onended = () => {
        this._clickPool = this._clickPool.filter(n => n !== src);
      };
      src.start();
      this._clickPool.push(src);
    } catch (_) {}
  }

  // Higher-pitched click for visual/game section toggles (I4)
  playAltClick() {
    if (!this.clickEnabled || !this._unlocked || !this._clickBuffer || !this._clickGain) return;
    try {
      const ctx = this._ensureCtx();
      if (ctx.state === "suspended") ctx.resume().catch(() => {});
      const src = ctx.createBufferSource();
      src.buffer = this._clickBuffer;
      src.playbackRate.value = 1.6;
      src.connect(this._clickGain);
      src.start();
    } catch (_) {}
  }

  setClickEnabled(val) {
    this.clickEnabled = val;
    localStorage.setItem(KEYS.click, val ? "1" : "0");
    this._notify();
  }

  toggleClick() { this.setClickEnabled(!this.clickEnabled); }

  // ── Level-up fanfare ──────────────────────────────────────────
  playLevelUp() {
    if (!this._unlocked) return;
    if (!this._levelBuffer || !this._levelGain) {
      this._loadLevelBuffer().then(() => this.playLevelUp());
      return;
    }
    try {
      const ctx = this._ensureCtx();
      if (ctx.state === "suspended") ctx.resume().catch(() => {});
      // Briefly duck the bg music so the fanfare is clear
      if (this._bgGainNode && !this._bgEl?.paused) {
        const g = this._bgGainNode.gain;
        g.cancelScheduledValues(ctx.currentTime);
        g.setValueAtTime(g.value, ctx.currentTime);
        g.linearRampToValueAtTime(this.bgVolume * 0.2, ctx.currentTime + 0.15);
        g.linearRampToValueAtTime(this.bgVolume,       ctx.currentTime + 3.5);
      }
      const src = ctx.createBufferSource();
      src.buffer = this._levelBuffer;
      src.connect(this._levelGain);
      src.start();
    } catch (_) {}
  }

  // ── Background music ──────────────────────────────────────────

  _startBg() {
    this._ensureBgEl();
    const ctx = this._ensureCtx();
    if (ctx.state === "suspended") ctx.resume().catch(() => {});
    this._bgEl.play().then(() => {
      // Fade in from current gain to target volume
      this._bgFadeTo(this.bgVolume, BG_FADE_MS);
    }).catch(() => {
      // Autoplay blocked — revert setting silently
      this.bgEnabled = false;
      localStorage.setItem(KEYS.bg, "0");
      this._notify();
    });
  }

  _stopBg() {
    if (!this._bgEl) return;
    this._bgFadeTo(0, BG_FADE_MS, () => {
      this._bgEl?.pause();
    });
  }

  setBgEnabled(val) {
    this.bgEnabled = val;
    localStorage.setItem(KEYS.bg, val ? "1" : "0");
    if (val && this._unlocked) {
      this._startBg();
    } else if (!val) {
      this._stopBg();
    }
    this._notify();
  }

  toggleBg() { this.setBgEnabled(!this.bgEnabled); }

  setTrack(id) {
    const track = TRACKS.find(t => t.id === id);
    if (!track || track.id === this.currentTrack) return;
    this.currentTrack = id;
    localStorage.setItem(KEYS.track, id);
    if (this._bgEl) {
      const wasPlaying = !this._bgEl.paused;
      this._bgEl.src  = track.src;
      this._bgEl.load();
      if (wasPlaying) this._bgEl.play().catch(() => {});
    }
    this._notify();
  }

  setBgVolume(vol) {
    this.bgVolume = vol;
    localStorage.setItem(KEYS.vol, String(vol));
    // Apply immediately via gain node (smooth, no pop)
    if (this._bgGainNode && this._bgEl && !this._bgEl.paused) {
      const ctx = this._ensureCtx();
      this._bgGainNode.gain.cancelScheduledValues(ctx.currentTime);
      this._bgGainNode.gain.setValueAtTime(vol, ctx.currentTime);
    }
    this._notify();
  }
}

const sm = new SoundManager();
export default sm;
