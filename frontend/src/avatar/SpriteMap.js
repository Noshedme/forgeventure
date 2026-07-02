// src/avatar/SpriteMap.js
// Para añadir skin nueva: añade entrada en SKINS con su carpeta y sufijo

export const SKINS = {
  default:   { base: '/avatar',    suffix: '' },
  guerrero:  { base: '/guerrero',  suffix: '_guerrero' },
  caballero: { base: '/caballero', suffix: '_caballero' },
};

const FRAMES = {
  idle:      { count: 8,  fps: 6  },
  talking:   { count: 6,  fps: 10 },
  happy:     { count: 4,  fps: 8  },
  wave:      { count: 4,  fps: 7  },
  thinking:  { count: 4,  fps: 5  },
  walk:      { count: 6,  fps: 8  },
  dance:     { count: 8,  fps: 10 },
  surprised: { count: 3,  fps: 8  },
  bored:     { count: 6,  fps: 4  },
};

/** Ruta al frame de animación según skin activa */
export function getFramePath(state, frameIndex, skin = 'default') {
  const cfg = FRAMES[state] ?? FRAMES.idle;
  const num = String((frameIndex % cfg.count) + 1).padStart(2, '0');
  const sk  = SKINS[skin] ?? SKINS.default;
  return `${sk.base}/${state}/${state}_${num}${sk.suffix}.png`;
}

/** Ruta al idle_01 de una skin — preview en tienda y guardarropa */
export function getSkinPreview(skin = 'default') {
  const sk = SKINS[skin] ?? SKINS.default;
  return `${sk.base}/idle/idle_01${sk.suffix}.png`;
}

export function getFps(state)        { return (FRAMES[state] ?? FRAMES.idle).fps; }
export function getFrameCount(state) { return (FRAMES[state] ?? FRAMES.idle).count; }
