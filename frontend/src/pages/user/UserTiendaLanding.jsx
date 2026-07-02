﻿﻿import { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useRef } from "react";
import {
  ChevronRight,
  Heart,
  Search,
} from "lucide-react";
import { auth } from "../../firebase.js";
import {
  getObjetosPublic,
  buyObjeto,
  buyLevel,
  useObjeto,
  getSkins,
  purchaseSkin,
  getInventario,
  getPurchases,
  getActiveBoosts,
  getAvatarCatalog,
  getTitlesCatalog,
  buyTitle,
  equipTitle,
  setActiveAvatar,
  setActiveFrame,
  setActiveSkin,
  getMisionesUsuario,
  getUserStats,
  purchaseAvatarItem,
  saveWishlist,
} from "../../services/api.js";
import { useIsMobile } from "../../hooks/useIsMobile.js";
import { AVATARS_CATALOG, FRAMES_CATALOG, RAREZA_AVATAR_COLOR, getAvatarImage } from "../../avatar/AvatarCatalog.js";
import { getSkinPreview } from "../../avatar/SpriteMap.js";
import { USER_CLASS_THEME } from "./userClassTheme.js";

const UI = {
  text: "#f7f1ff",
  muted: "#b7accb",
  mutedDeep: "#85799c",
  bg: "#080611",
  line: "rgba(255,255,255,.08)",
  gold: "#f4cc78",
  orange: "#ff9f43",
  green: "#8ac926",
  red: "#ff6b7d",
  blue: "#4cc9f0",
  purple: "#c08aff",
};

const LEVEL_PRICE = 1000;
const LEVEL_MAX_BUY = 10;
const SHOP_HISTORY_PAGE_SIZE = 24;
const SHOP_RECO_TTL = 3 * 60 * 1000;

const CATEGORY_META = {
  Todos: { label: "Todo el mercado", icon: "/ui/header/section-tienda.png", color: "#c08aff" },
  "Poci\u00f3n": { label: "Pociones", icon: "/ui/shop/inventory/inventory-tab-potion.png", color: "#ff7ca8" },
  Consumible: { label: "Consumibles", icon: "/ui/shop/icons/shop-crate.png", color: "#5ad8c8" },
  Equipo: { label: "Equipo", icon: "/ui/shop/inventory/inventory-tab-gear.png", color: "#ff9f43" },
  "Cosm\u00e9tico": { label: "Cosm\u00e9ticos", icon: "/ui/shop/icons/shop-cosmetic.png", color: "#c08aff" },
  Especial: { label: "Bot\u00edn especial", icon: "/ui/shop/inventory/inventory-tab-special.png", color: "#f4cc78" },
};

const RARITY_META = {
  "Com\u00fan": { key: "common", label: "Com\u00fan", color: UI.muted, glow: "rgba(168,168,184,.22)", asset: "/ui/rarity/rarity-common.png", tier: 1 },
  "Poco com\u00fan": { key: "uncommon", label: "Poco com\u00fan", color: UI.green, glow: "rgba(138,201,38,.24)", asset: "/ui/rarity/rarity-common.png", tier: 2 },
  Raro: { key: "rare", label: "Raro", color: UI.blue, glow: "rgba(76,201,240,.28)", asset: "/ui/rarity/rarity-rare.png", tier: 3 },
  "\u00c9pico": { key: "epic", label: "\u00c9pico", color: UI.purple, glow: "rgba(192,138,255,.32)", asset: "/ui/rarity/rarity-epic.png", tier: 4 },
  Legendario: { key: "legendary", label: "Legendario", color: UI.gold, glow: "rgba(244,204,120,.34)", asset: "/ui/rarity/rarity-legendary.png", tier: 5 },
  "M\u00edtico": { key: "mythic", label: "M\u00edtico", color: "#ff7a4f", glow: "rgba(255,122,79,.34)", asset: "/ui/rarity/rarity-legendary.png", tier: 6 },
};

const BOOST_COLORS = {
  xp_bonus: UI.orange,
  xp_mult: UI.gold,
  cooldown_red: UI.blue,
  streak_shield: UI.green,
};

const STORE_SCENE = {
  GUERRERO: "/ui/shop/hero/shop-stage-warrior.png",
  ARQUERO: "/ui/shop/hero/shop-stage-archer.png",
  MAGO: "/ui/shop/hero/shop-stage-mage.png",
  DEFAULT: "/ui/shop/hero/shop-stage-default.png",
};

const STORE_COPY = {
  GUERRERO: {
    title: "Entra al mercado con fuerza y botín claro.",
    lead: "La tienda ahora se lee como una sala del gremio: equipo, pociones y piezas visuales con mejor jerarquía y menos ruido.",
    note: "Fuerza, progreso y botín con lectura más limpia.",
  },
  ARQUERO: {
    title: "Compra rápido, equípate mejor y sigue el ritmo.",
    lead: "Todo el mercado entra con más aire visual, mejores fichas y un foco más claro en lo útil para avanzar sin frenar la ruta.",
    note: "Velocidad, precisión y consumo táctico.",
  },
  MAGO: {
    title: "Ordena recursos, foco y cosméticos sin perder claridad.",
    lead: "La tienda mezcla botín funcional con piezas visuales en un tablero más elegante, más legible y mucho más del mundo RPG.",
    note: "Control mental, utilidad y recompensas bien curadas.",
  },
  DEFAULT: {
    title: "Abre el mercado del gremio con una vista más viva.",
    lead: "Menos panel viejo, más sala de comercio: ofertas claras, inventario compacto y piezas destacadas que sí lucen.",
    note: "Botín, utilidad y presencia visual en una sola sala.",
  },
};

const SHOP_ASSETS = {
  heroOverlay: "/ui/shop/hero/shop-table-overlay.png",
  empty: "/ui/shop/states/shop-empty.png",
  syncing: "/ui/shop/states/shop-syncing.png",
  noResults: "/ui/shop/states/shop-no-results.png",
  icons: {
    coin: "/ui/shop/icons/shop-coin-stack.png",
    contract: "/ui/shop/icons/shop-contract.png",
    crate: "/ui/shop/icons/shop-crate.png",
    service: "/ui/shop/icons/shop-service.png",
    cosmetic: "/ui/shop/icons/shop-cosmetic.png",
  },
  inventory: {
    "Poci\u00f3n": "/ui/shop/inventory/inventory-tab-potion.png",
    Equipo: "/ui/shop/inventory/inventory-tab-gear.png",
    Especial: "/ui/shop/inventory/inventory-tab-special.png",
  },
  history: {
    consumable: "/ui/shop/history/history-consumable.png",
    cosmetic: "/ui/shop/history/history-cosmetic.png",
    service: "/ui/shop/history/history-service.png",
    loot: "/ui/shop/history/history-loot.png",
  },
};

const SHOP_STATUS_ASSETS = {
  buy: "/ui/header/notifications/notif-shop.png",
  coins: "/ui/shop/icons/shop-coin-stack.png",
  boost: "/ui/icon-energy.png",
  note: "/ui/shop/icons/shop-crate.png",
  new: "/ui/header/notifications/notif-medal.png",
  offer: "/ui/shop/icons/shop-contract.png",
  owned: "/ui/header/notifications/notif-shield.png",
  recommended: "/ui/medals/rank-crown.png",
  expiring: "/ui/header/notifications/notif-message.png",
  streak: "/ui/header/notifications/notif-shield.png",
  sync: "/ui/header/notifications/notif-message.png",
  skin: "/ui/shop/icons/shop-cosmetic.png",
  avatar: "/ui/header/section-personaje.png",
  frame: "/ui/header/section-perfil.png",
};

const COSMETIC_TAB_META = {
  skin: { label: "Skins", icon: SHOP_ASSETS.icons.cosmetic },
  avatar: { label: "Avatares", icon: "/ui/header/section-personaje.png" },
  frame: { label: "Marcos", icon: "/ui/header/section-perfil.png" },
  title: { label: "Títulos", icon: "/ui/medals/rank-crown.png" },
};

const HISTORY_FILTER_META = {
  today: { label: "Hoy", type: "range" },
  week: { label: "Semana", type: "range" },
  consumable: { label: "Consumibles", type: "kind" },
  cosmetic: { label: "Cosméticos", type: "kind" },
  service: { label: "Servicios", type: "kind" },
  all: { label: "Todo", type: "all" },
};

const INVENTORY_FILTER_META = {
  all: "Todo el baúl",
  usable: "Usable ya",
  expiring: "Expira pronto",
  recommended: "Recomendado hoy",
};

const INVENTORY_SORT_META = {
  utility: "Utilidad",
  rarity: "Rareza",
  qty: "Cantidad",
};

const CSS = `
  .uts-page {
    position: relative;
    min-height: 100vh;
    padding: 24px 20px 40px;
    overflow-x: hidden;
    overflow-y: visible;
    color: ${UI.text};
    background:
      radial-gradient(ellipse at top left, rgba(100,60,180,.12), transparent 38%),
      radial-gradient(ellipse at bottom right, rgba(80,40,140,.1), transparent 34%),
      linear-gradient(180deg, rgba(8,5,20,.98), rgba(5,4,14,.99));
  }
  .uts-page::before {
    content: "";
    position: fixed;
    inset: 0;
    pointer-events: none;
    opacity: .08;
    background:
      linear-gradient(rgba(255,255,255,.025) 1px, transparent 1px),
      linear-gradient(90deg, rgba(255,255,255,.025) 1px, transparent 1px);
    background-size: 48px 48px;
  }
  .uts-page::after { display: none; }
  .uts-shell {
    position: relative;
    z-index: 1;
    width: min(1680px, 100%);
    margin: 0 auto;
    display: grid;
    gap: 18px;
  }
  .uts-panel {
    position: relative;
    overflow: hidden;
    border-radius: 20px;
    border: 1px solid rgba(255,255,255,.07);
    background: linear-gradient(180deg, rgba(20,14,38,.94), rgba(10,7,22,.96));
    box-shadow:
      inset 0 1px 0 rgba(255,255,255,.05),
      0 16px 40px rgba(0,0,0,.28);
  }
  .uts-panel::before { display: none; }
  .uts-panel > * { position: relative; z-index: 1; }
  .uts-kicker,
  .uts-chip,
  .uts-tab,
  .uts-select,
  .uts-filter-btn,
  .uts-mini-tag {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    min-height: 34px;
    padding: 7px 12px;
    border-radius: 999px;
    border: 1px solid rgba(255,255,255,.08);
    background: rgba(255,255,255,.04);
    color: ${UI.text};
    font-family: "Manrope", sans-serif;
    font-size: 12px;
    font-weight: 800;
  }
  .uts-kicker {
    width: fit-content;
    color: var(--shop-accent);
    border-color: color-mix(in srgb, var(--shop-accent) 45%, transparent);
    background: color-mix(in srgb, var(--shop-accent) 12%, transparent);
    text-transform: uppercase;
    letter-spacing: .1em;
  }
  .uts-kicker img,
  .uts-chip img,
  .uts-tab img,
  .uts-mini-tag img,
  .uts-rarity img {
    width: 18px;
    height: 18px;
    object-fit: contain;
  }
  .uts-hero {
    display: grid;
    grid-template-columns: minmax(0, 1.04fr) minmax(360px, .96fr);
    gap: 18px;
    padding: 24px;
  }
  .uts-hero-copy,
  .uts-merchant-copy,
  .uts-feature-copy,
  .uts-detail-copy,
  .uts-empty {
    display: grid;
    gap: 16px;
    align-content: start;
  }
  .uts-hero h1 {
    margin: 0;
    max-width: 13ch;
    font-family: "Manrope", sans-serif;
    font-size: clamp(28px, 3.4vw, 54px);
    font-weight: 800;
    line-height: 1.05;
    letter-spacing: -.02em;
  }
  .uts-hero p,
  .uts-band-copy p,
  .uts-stat-card p,
  .uts-merchant-copy p,
  .uts-feature-copy p,
  .uts-card-copy p,
  .uts-history p,
  .uts-detail-copy p,
  .uts-empty p {
    margin: 0;
    color: ${UI.muted};
    font-family: "Manrope", sans-serif;
    font-size: 16px;
    line-height: 1.45;
  }
  .uts-chip-row,
  .uts-tab-row,
  .uts-category-row,
  .uts-band-grid,
  .uts-tag-row {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    align-items: center;
  }
  .uts-chip.is-focus {
    color: var(--shop-accent);
    border-color: color-mix(in srgb, var(--shop-accent) 38%, transparent);
    background: color-mix(in srgb, var(--shop-accent) 12%, transparent);
  }
  .uts-hero-stats {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 12px;
  }
  .uts-stat-card,
  .uts-band-card,
  .uts-card,
  .uts-history-row,
  .uts-detail-box,
  .uts-purchase-box {
    border-radius: 18px;
    border: 1px solid rgba(255,255,255,.08);
    background: rgba(255,255,255,.035);
  }
  .uts-stat-card {
    padding: 14px;
    display: grid;
    gap: 6px;
  }
  .uts-stat-card small,
  .uts-band-card small,
  .uts-history-row small,
  .uts-detail-box small {
    color: ${UI.mutedDeep};
    font-family: "Manrope", sans-serif;
    font-size: 11px;
    letter-spacing: .1em;
    text-transform: uppercase;
  }
  .uts-stat-card strong,
  .uts-band-card strong,
  .uts-detail-copy h2,
  .uts-panel-head h2 {
    font-family: "Manrope", sans-serif;
    font-size: 20px;
    font-weight: 800;
    margin: 0;
  }
  .uts-mini-stat strong,
  .uts-empty strong,
  .uts-inventory-copy strong {
    font-family: "Manrope", sans-serif;
    font-weight: 800;
  }
  .uts-stage {
    position: relative;
    min-height: 360px;
    overflow: hidden;
    border-radius: 24px;
    border: 1px solid rgba(255,255,255,.08);
    background:
      linear-gradient(180deg, rgba(8,5,20,.55), rgba(8,5,20,.92)),
      var(--shop-scene) center/cover no-repeat;
  }
  .uts-stage::after {
    content: "";
    position: absolute;
    inset: 0;
    background: linear-gradient(180deg, transparent 30%, rgba(8,5,20,.82));
    pointer-events: none;
  }
  .uts-stage-overlay {
    display: none;
  }
  .uts-stage-inner {
    position: relative;
    z-index: 1;
    min-height: 360px;
    padding: 18px;
    display: grid;
    grid-template-rows: auto 1fr auto;
    gap: 14px;
  }
  .uts-stage-crest {
    justify-self: end;
    width: 78px;
    height: 78px;
    border-radius: 22px;
    border: 1px solid rgba(255,255,255,.08);
    background: rgba(10,8,18,.52);
    display: grid;
    place-items: center;
    box-shadow: 0 18px 28px rgba(0,0,0,.28);
  }
  .uts-stage-crest img {
    width: 62px;
    height: 62px;
    object-fit: contain;
  }
  .uts-stage-card {
    align-self: end;
    width: min(100%, 420px);
    padding: 16px;
    border-radius: 22px;
    border: 1px solid rgba(255,255,255,.08);
    background:
      linear-gradient(180deg, rgba(16,14,28,.88), rgba(11,10,20,.92));
    backdrop-filter: blur(12px);
    box-shadow: 0 24px 36px rgba(0,0,0,.3);
    justify-self: end;
    display: grid;
    gap: 12px;
  }
  .uts-feature-head {
    display: grid;
    grid-template-columns: 84px minmax(0, 1fr);
    gap: 12px;
    align-items: center;
  }
  .uts-item-art,
  .uts-feature-art {
    position: relative;
    overflow: hidden;
    border-radius: 18px;
    border: 1px solid rgba(255,255,255,.08);
    background: linear-gradient(180deg, rgba(14,12,24,.96), rgba(9,8,18,.98));
    display: grid;
    place-items: center;
    box-shadow: inset 0 1px 0 rgba(255,255,255,.03);
  }
  .uts-feature-art {
    width: 84px;
    height: 84px;
  }
  .uts-item-art img,
  .uts-feature-art img {
    width: 74%;
    height: 74%;
    object-fit: contain;
    filter: drop-shadow(0 0 10px rgba(255,255,255,.1));
  }
  .uts-art-fallback {
    width: 78%;
    display: grid;
    justify-items: center;
    gap: 8px;
    font-family: "Manrope", sans-serif;
    font-size: 12px;
    color: ${UI.mutedDeep};
    text-transform: uppercase;
    letter-spacing: .08em;
    text-align: center;
  }
  .uts-art-fallback img {
    width: min(58px, 100%);
    height: 58px;
    object-fit: contain;
    opacity: .92;
    filter: drop-shadow(0 0 12px rgba(255,255,255,.12));
  }
  .uts-band {
    display: grid;
    grid-template-columns: 1.12fr .92fr .92fr;
    gap: 12px;
  }
  .uts-band-card {
    padding: 18px;
    display: grid;
    gap: 12px;
  }
  .uts-mini-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
    gap: 10px;
  }
  .uts-mini-stat {
    padding: 12px;
    border-radius: 16px;
    border: 1px solid rgba(255,255,255,.08);
    background: rgba(255,255,255,.03);
    display: grid;
    gap: 6px;
  }
  .uts-mini-stat strong {
    font-family: "Manrope", sans-serif;
    font-size: 18px;
  }
  .uts-progress {
    height: 10px;
    border-radius: 999px;
    overflow: hidden;
    background: rgba(255,255,255,.08);
    box-shadow: inset 0 0 0 1px rgba(0,0,0,.18);
  }
  .uts-progress > span {
    display: block;
    height: 100%;
    border-radius: inherit;
    background: linear-gradient(90deg, var(--shop-accent), color-mix(in srgb, var(--shop-secondary) 70%, white 8%));
    box-shadow: 0 0 16px color-mix(in srgb, var(--shop-accent) 22%, transparent);
  }
  .uts-content {
    display: grid;
    grid-template-columns: minmax(0, 1.72fr) minmax(280px, .58fr);
    gap: 18px;
    align-items: start;
  }
  .uts-market {
    padding: 18px;
    display: grid;
    gap: 14px;
  }
  .uts-panel-head {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 16px;
  }
  .uts-panel-head h2 {
    margin: 8px 0 4px;
    font-size: clamp(22px, 2.1vw, 30px);
    font-weight: 800;
    letter-spacing: -.02em;
  }
  .uts-panel-head p {
    max-width: 64ch;
  }
  .uts-toolbar {
    display: grid;
    grid-template-columns: minmax(0, 1.14fr) repeat(3, minmax(130px, .32fr));
    gap: 10px;
  }
  .uts-search,
  .uts-select {
    min-height: 48px;
    border-radius: 16px;
    border: 1px solid rgba(255,255,255,.08);
    background: rgba(255,255,255,.04);
  }
  .uts-search {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 0 14px;
  }
  .uts-search input,
  .uts-select select {
    width: 100%;
    border: none;
    outline: none;
    background: transparent;
    color: ${UI.text};
    font-family: "Manrope", sans-serif;
    font-size: 15px;
  }
  .uts-select {
    display: flex;
    align-items: center;
    gap: 8px;
    justify-content: space-between;
    padding: 0 14px;
  }
  .uts-category-row { overflow-x: auto; padding-bottom: 4px; gap: 6px; flex-wrap: nowrap; }
  .uts-inline-toolbar {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    align-items: center;
  }
  .uts-filter-btn {
    cursor: pointer;
    transition: transform .2s ease, border-color .2s ease, background .2s ease;
  }
  .uts-filter-btn.is-active {
    color: var(--cat-color, var(--shop-accent));
    border-color: color-mix(in srgb, var(--cat-color, var(--shop-accent)) 48%, transparent);
    background: color-mix(in srgb, var(--cat-color, var(--shop-accent)) 12%, transparent);
    box-shadow: 0 0 18px color-mix(in srgb, var(--cat-color, var(--shop-accent)) 14%, transparent);
  }
  .uts-filter-btn:hover { transform: translateY(-2px); }
  .uts-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    gap: 14px;
  }
  .uts-card {
    position: relative;
    overflow: hidden;
    min-height: 278px;
    display: grid;
    grid-template-rows: 120px auto 1fr auto;
    gap: 10px;
    padding: 12px;
    transition: transform .2s ease, border-color .2s ease, box-shadow .2s ease;
    cursor: pointer;
  }
  .uts-card::before {
    content: "";
    position: absolute;
    inset: 0;
    background:
      radial-gradient(circle at top right, var(--card-glow, rgba(255,255,255,.08)), transparent 34%),
      linear-gradient(180deg, rgba(255,255,255,.04), transparent 28%);
    opacity: .9;
    pointer-events: none;
  }
  .uts-card > * { position: relative; z-index: 1; }
  .uts-card:hover,
  .uts-card.is-selected {
    transform: translateY(-4px);
    border-color: color-mix(in srgb, var(--card-accent, var(--shop-accent)) 46%, rgba(255,255,255,.08));
    box-shadow: 0 18px 30px rgba(0,0,0,.28), 0 0 24px var(--card-glow, rgba(255,255,255,.12));
  }
  .uts-card-top {
    display: grid;
    grid-template-columns: 1fr auto;
    gap: 10px;
    align-items: start;
  }
  .uts-card-copy strong,
  .uts-detail-copy h2 {
    font-family: "Manrope", sans-serif;
    font-size: 15px;
    font-weight: 800;
  }
  .uts-card-copy strong {
    display: block;
    margin-bottom: 6px;
  }
  .uts-card-copy p {
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  .uts-rarity {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    min-height: 30px;
    padding: 6px 10px;
    border-radius: 999px;
    border: 1px solid rgba(255,255,255,.08);
    background: rgba(255,255,255,.04);
    font-family: "Manrope", sans-serif;
    font-size: 11px;
    font-weight: 800;
  }
  .uts-tag-row {
    align-items: flex-start;
  }
  .uts-mini-tag {
    min-height: 30px;
    padding: 5px 10px;
    font-size: 11px;
  }
  .uts-card-bottom {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    margin-top: auto;
  }
  .uts-price {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    font-family: "Manrope", sans-serif;
    font-size: 17px;
    font-weight: 800;
    color: ${UI.gold};
  }
  .uts-price-dot {
    width: 12px;
    height: 12px;
    border-radius: 999px;
    background: radial-gradient(circle at 35% 30%, #ffe28a, #c89b3c 60%, #6e4a13);
    box-shadow: 0 0 10px rgba(244,204,120,.42);
  }
  .uts-card-cta,
  .uts-primary-btn,
  .uts-secondary-btn {
    min-height: 42px;
    padding: 10px 14px;
    border-radius: 14px;
    border: none;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    font-family: "Manrope", sans-serif;
    font-size: 13px;
    font-weight: 900;
    transition: transform .2s ease, box-shadow .2s ease, border-color .2s ease, background .2s ease;
  }
  .uts-card-cta,
  .uts-primary-btn {
    color: #0a0712;
    background: linear-gradient(135deg, var(--shop-accent), color-mix(in srgb, var(--shop-secondary) 70%, white 8%));
    box-shadow: 0 12px 24px color-mix(in srgb, var(--shop-accent) 24%, transparent);
  }
  .uts-secondary-btn {
    color: ${UI.text};
    background: rgba(255,255,255,.04);
    border: 1px solid rgba(255,255,255,.08);
  }
  .uts-card-cta:disabled,
  .uts-primary-btn:disabled,
  .uts-secondary-btn:disabled {
    opacity: .58;
    cursor: not-allowed;
    box-shadow: none;
  }
  .uts-card-cta:hover:not(:disabled),
  .uts-primary-btn:hover:not(:disabled),
  .uts-secondary-btn:hover:not(:disabled) { transform: translateY(-2px); }
  .uts-right {
    padding: 18px;
    display: grid;
    gap: 14px;
    position: sticky;
    top: 14px;
  }
  .uts-detail-art {
    min-height: 124px;
    padding: 12px 18px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 18px;
    border: 1px solid rgba(255,255,255,.08);
    background:
      linear-gradient(90deg, rgba(255,255,255,.04), rgba(255,255,255,.015)),
      linear-gradient(180deg, rgba(14,12,24,.98), rgba(9,8,18,.95));
    box-shadow: inset 0 1px 0 rgba(255,255,255,.03);
  }
  .uts-detail-art img {
    width: min(42%, 128px);
    height: min(42%, 128px);
    object-fit: contain;
    filter: drop-shadow(0 0 12px rgba(255,255,255,.1));
  }
  .uts-detail-copy h2 {
    margin: 0;
    font-size: clamp(20px, 1.8vw, 26px);
    font-weight: 800;
    line-height: 1.1;
    letter-spacing: -.01em;
  }
  .uts-detail-box,
  .uts-purchase-box {
    padding: 14px;
    display: grid;
    gap: 10px;
  }
  .uts-effect-list,
  .uts-history-list,
  .uts-boost-list,
  .uts-inventory-group {
    display: grid;
    gap: 10px;
  }
  .uts-history-list {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .uts-history-summary {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
    gap: 10px;
  }
  .uts-history-summary .uts-band-card {
    padding: 14px;
  }
  .uts-inventory-group {
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  }
  .uts-collection-hero {
    padding: 16px;
    border-radius: 20px;
    border: 1px solid rgba(255,255,255,.08);
    background:
      radial-gradient(circle at top right, color-mix(in srgb, var(--shop-secondary) 16%, transparent), transparent 34%),
      linear-gradient(180deg, rgba(255,255,255,.04), rgba(255,255,255,.02));
    display: grid;
    gap: 14px;
  }
  .uts-collection-preview {
    display: grid;
    grid-template-columns: minmax(84px, 112px) minmax(0, 1fr);
    gap: 14px;
    align-items: center;
  }
  .uts-collection-preview img {
    width: 100%;
    max-width: 108px;
    aspect-ratio: 1 / 1;
    object-fit: contain;
  }
  .uts-inventory-shell {
    display: grid;
    gap: 14px;
  }
  .uts-subtabs {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
  }
  .uts-subtab {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    min-height: 42px;
    padding: 9px 14px;
    border-radius: 16px;
    border: 1px solid rgba(255,255,255,.08);
    background: rgba(255,255,255,.03);
    color: ${UI.muted};
    font: 800 13px/1 "Manrope", sans-serif;
    cursor: pointer;
    transition: transform .18s ease, border-color .18s ease, background .18s ease, color .18s ease, box-shadow .18s ease;
  }
  .uts-subtab:hover {
    transform: translateY(-1px);
    border-color: rgba(255,255,255,.14);
    color: ${UI.text};
  }
  .uts-subtab.is-active {
    color: ${UI.text};
    border-color: color-mix(in srgb, var(--subtab-color, var(--shop-accent)) 54%, transparent);
    background:
      linear-gradient(180deg, color-mix(in srgb, var(--subtab-color, var(--shop-accent)) 16%, transparent), rgba(255,255,255,.03)),
      rgba(255,255,255,.03);
    box-shadow: 0 0 0 1px color-mix(in srgb, var(--subtab-color, var(--shop-accent)) 14%, transparent);
  }
  .uts-subtab-count {
    min-width: 26px;
    height: 26px;
    padding: 0 8px;
    border-radius: 999px;
    display: inline-grid;
    place-items: center;
    border: 1px solid rgba(255,255,255,.08);
    background: rgba(255,255,255,.05);
    color: ${UI.text};
    font: 800 12px/1 "Manrope", sans-serif;
  }
  .uts-inventory-stage {
    display: grid;
    gap: 14px;
    padding: 16px;
    border-radius: 20px;
    border: 1px solid rgba(255,255,255,.08);
    background:
      radial-gradient(circle at top right, color-mix(in srgb, var(--inventory-color, var(--shop-accent)) 14%, transparent), transparent 34%),
      linear-gradient(180deg, rgba(255,255,255,.04), rgba(255,255,255,.02));
  }
  .uts-inventory-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    flex-wrap: wrap;
  }
  .uts-inventory-copy {
    display: grid;
    gap: 4px;
  }
  .uts-inventory-copy strong {
    font-family: "Manrope", sans-serif;
    font-size: 17px;
  }
  .uts-inventory-copy p {
    margin: 0;
    color: ${UI.muted};
    font: 500 13px/1.45 "Manrope", sans-serif;
  }
  .uts-pager {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    flex-wrap: wrap;
  }
  .uts-pager-meta {
    color: ${UI.muted};
    font: 700 13px/1 "Manrope", sans-serif;
  }
  .uts-pager-actions {
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .uts-pager-btn {
    min-height: 34px;
    padding: 6px 12px;
    border-radius: 999px;
    border: 1px solid rgba(255,255,255,.08);
    background: rgba(255,255,255,.04);
    color: ${UI.text};
    font: 800 12px/1 "Manrope", sans-serif;
    cursor: pointer;
    transition: transform .18s ease, border-color .18s ease, background .18s ease;
  }
  .uts-pager-btn:hover:not(:disabled) {
    transform: translateY(-1px);
    border-color: color-mix(in srgb, var(--shop-accent) 38%, transparent);
    background: color-mix(in srgb, var(--shop-accent) 10%, transparent);
  }
  .uts-pager-btn:disabled {
    opacity: .44;
    cursor: default;
  }
  .uts-group-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
  }
  .uts-group-actions {
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .uts-group-toggle {
    min-height: 32px;
    padding: 6px 12px;
    border-radius: 999px;
    border: 1px solid rgba(255,255,255,.08);
    background: rgba(255,255,255,.04);
    color: ${UI.text};
    font-family: "Manrope", sans-serif;
    font-size: 12px;
    font-weight: 800;
    cursor: pointer;
    transition: transform .2s ease, border-color .2s ease, background .2s ease;
  }
  .uts-group-toggle:hover {
    transform: translateY(-1px);
    border-color: color-mix(in srgb, var(--shop-accent) 40%, transparent);
    background: color-mix(in srgb, var(--shop-accent) 10%, transparent);
  }
  .uts-effect-row,
  .uts-boost-pill,
  .uts-history-row,
  .uts-inline-card {
    padding: 12px;
    border-radius: 16px;
    border: 1px solid rgba(255,255,255,.08);
    background: rgba(255,255,255,.03);
  }
  .uts-inline-card {
    min-height: 92px;
  }
  .uts-effect-row,
  .uts-history-row,
  .uts-inline-card {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
  }
  .uts-boost-pill {
    display: grid;
    gap: 6px;
  }
  .uts-history-row,
  .uts-inline-card {
    cursor: pointer;
    transition: transform .18s ease, border-color .18s ease;
  }
  .uts-history-row:hover,
  .uts-inline-card:hover {
    transform: translateY(-1px);
    border-color: rgba(255,255,255,.14);
  }
  .uts-empty {
    min-height: 260px;
    place-items: center;
    text-align: center;
  }
  .uts-empty strong {
    font-family: "Manrope", sans-serif;
    font-size: 20px;
  }
  .uts-modal-overlay {
    position: fixed;
    inset: 0;
    z-index: 920;
    padding: 18px;
    display: grid;
    place-items: center;
    background: rgba(4,3,10,.76);
    backdrop-filter: blur(14px);
  }
  .uts-modal {
    width: min(520px, 100%);
    border-radius: 24px;
    border: 1px solid rgba(255,255,255,.08);
    background:
      linear-gradient(180deg, rgba(18,16,30,.99), rgba(9,8,18,.99)),
      url("/ui/panel-texture.png");
    box-shadow: 0 24px 48px rgba(0,0,0,.36);
    overflow: hidden;
  }
  .uts-modal-body {
    padding: 18px;
    display: grid;
    gap: 14px;
  }
  .uts-qty {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    padding: 6px;
    border-radius: 999px;
    border: 1px solid rgba(255,255,255,.08);
    background: rgba(255,255,255,.04);
  }
  .uts-qty button {
    width: 32px;
    height: 32px;
    border-radius: 999px;
    border: 1px solid rgba(255,255,255,.08);
    background: rgba(255,255,255,.05);
    color: ${UI.text};
    cursor: pointer;
  }
  .uts-qty strong {
    min-width: 24px;
    text-align: center;
    font-family: "Manrope", sans-serif;
  }
  .uts-toast {
    position: fixed;
    right: 24px;
    bottom: 24px;
    z-index: 930;
    width: min(320px, calc(100vw - 32px));
    padding: 14px 16px;
    border-radius: 18px;
    border: 1px solid rgba(255,255,255,.08);
    background: rgba(16,14,28,.96);
    box-shadow: 0 20px 36px rgba(0,0,0,.34);
  }
  .uts-toast strong {
    display: block;
    margin-bottom: 4px;
    font-family: "Manrope", sans-serif;
    font-size: 14px;
  }
  @media (max-width: 1440px) {
    .uts-hero-stats { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .uts-stage, .uts-stage-inner { min-height: 320px; }
  }
  @media (max-width: 1280px) {
    .uts-stage, .uts-stage-inner { min-height: 300px; }
    .uts-toolbar { grid-template-columns: minmax(0, 1fr) minmax(120px, .3fr) minmax(120px, .3fr) minmax(120px, .3fr); }
  }
  @media (max-width: 1220px) {
    .uts-hero,
    .uts-content { grid-template-columns: 1fr; }
    .uts-band { grid-template-columns: 1fr 1fr; }
    .uts-right { position: relative; top: 0; }
    .uts-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); }
    .uts-inventory-group { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .uts-stage, .uts-stage-inner { min-height: 260px; }
  }
  @media (max-width: 1080px) {
    .uts-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .uts-toolbar { grid-template-columns: 1fr 1fr; }
  }
  @media (max-width: 860px) {
    .uts-page { padding: 16px 12px 32px; }
    .uts-hero { padding: 18px; }
    .uts-hero-stats { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .uts-band { grid-template-columns: 1fr; }
    .uts-toolbar { grid-template-columns: 1fr 1fr; }
    .uts-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .uts-history-list,
    .uts-inventory-group { grid-template-columns: 1fr; }
    .uts-inventory-stage { padding: 14px; }
    .uts-stage, .uts-stage-inner { min-height: 220px; }
    .uts-stage-card {
      width: calc(100% - 8px);
      justify-self: center;
    }
  }
  @media (max-width: 640px) {
    .uts-toolbar { grid-template-columns: 1fr; }
    .uts-grid { grid-template-columns: 1fr; }
    .uts-hero-stats { grid-template-columns: 1fr 1fr; }
  }
  @media (max-width: 560px) {
    .uts-hero h1 { max-width: 14ch; }
    .uts-hero-stats { grid-template-columns: 1fr; }
    .uts-feature-head { grid-template-columns: 72px minmax(0, 1fr); }
    .uts-feature-art { width: 72px; height: 72px; }
  }
`;

function normalizeLoose(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function rarityMeta(value) {
  const key = normalizeLoose(value);
  if (key === "mitico" || key === "mythic") return RARITY_META["Mítico"];
  if (key === "legendario" || key === "legendary") return RARITY_META.Legendario;
  if (key === "epico" || key === "epic") return RARITY_META["Épico"];
  if (key === "raro" || key === "rare") return RARITY_META.Raro;
  if (key === "poco comun" || key === "uncommon") return RARITY_META["Poco común"];
  return RARITY_META["Común"];
}

function normalizeCategoryName(value) {
  const key = normalizeLoose(value);
  if (key.includes("pocion")) return "Poción";
  if (key.includes("consumible")) return "Consumible";
  if (key.includes("equipo")) return "Equipo";
  if (key.includes("cosmetic")) return "Cosmético";
  if (key.includes("especial") || key.includes("loot")) return "Especial";
  return value || "Especial";
}

function historyKindMeta(kind = "loot") {
  switch (kind) {
    case "consumable":
      return { label: "Consumible", icon: SHOP_ASSETS.history.consumable, color: UI.green };
    case "cosmetic":
      return { label: "Cosmético", icon: SHOP_ASSETS.history.cosmetic, color: UI.purple };
    case "service":
      return { label: "Servicio", icon: SHOP_ASSETS.history.service, color: UI.gold };
    default:
      return { label: "Botín", icon: SHOP_ASSETS.history.loot, color: UI.blue };
  }
}

function inventoryTabIcon(category) {
  return SHOP_ASSETS.inventory[category] || SHOP_ASSETS.icons.crate;
}

function safeDate(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function dateLabel(value) {
  const date = safeDate(value);
  if (!date) return "Sin fecha";
  return date.toLocaleDateString("es-CO", { day: "2-digit", month: "short" });
}

function itemRemainingSecs(item) {
  if (Number.isFinite(item?.remainingSecs)) return item.remainingSecs;
  if (item?.expiresAt) {
    const date = safeDate(item.expiresAt);
    if (!date) return null;
    return Math.max(0, Math.floor((date.getTime() - Date.now()) / 1000));
  }
  return null;
}

function itemSourceLabel(item) {
  const source = normalizeLoose(item?.origen || item?.source || item?.fuente);
  if (source.includes("mision")) return "Misión";
  if (source.includes("evento")) return "Evento";
  if (source.includes("recompensa")) return "Recompensa";
  if (source.includes("tienda")) return "Mercado";
  return "Mercado";
}

function normalizeItem(item) {
  const cat = normalizeCategoryName(item?.categoria || item?.cat || "Especial");
  return {
    stackeable: false,
    gratis: false,
    limitado: false,
    esNuevo: false,
    ...item,
    nombre: item?.nombre || item?.name || "Objeto",
    descripcion: item?.desc || item?.descripcion || "",
    imagen: item?.imagen || "",
    cat,
    rareza: item?.rareza || "Común",
    precio: Number(item?.precio || 0),
    consumible: item?.consumible !== undefined ? item.consumible : ["Poción", "Consumible"].includes(cat),
    efectos: Array.isArray(item?.efectos) ? item.efectos : [],
  };
}

function categoryMeta(name) {
  return CATEGORY_META[name] || CATEGORY_META.Especial;
}

function cosmeticFallbackIcon(type) {
  if (type === "skin") return SHOP_STATUS_ASSETS.skin;
  if (type === "avatar") return SHOP_STATUS_ASSETS.avatar;
  if (type === "frame") return SHOP_STATUS_ASSETS.frame;
  if (type === "title") return "/ui/medals/rank-crown.png";
  return SHOP_ASSETS.icons.cosmetic;
}

function itemHint(item) {
  const types = (item?.efectos || []).map((effect) => effect.tipo);
  if (types.includes("xp_mult")) return "Sinergia con sesiones largas y remates de misión.";
  if (types.includes("xp_bonus")) return "Perfecto para quests físicas y cierre de rutas cortas.";
  if (types.includes("streak_shield")) return "Protege la racha si un día no puedes entrar al mapa.";
  if (types.includes("xp_instant")) return "Útil si necesitas empujar nivel o cerrar un tramo corto.";
  if (types.includes("hp_recover")) return "Buena pieza para recuperación y regreso a la arena.";
  if (types.includes("level_boost")) return "Empuja progreso bruto cuando quieres abrir más contenido.";
  return "El mercader la recomienda como pieza de apoyo general.";
}

function effectLabel(effect) {
  if (effect?.txt) return effect.txt;
  const value = effect?.valor;
  switch (effect?.tipo) {
    case "xp_bonus": return `+${value}% XP`;
    case "xp_instant": return `+${value} XP`;
    case "hp_recover": return `Recupera ${value}%`;
    case "streak_shield": return `Protector de racha ${value}d`;
    case "xp_mult": return `x${value} XP`;
    case "level_boost": return `Salto de nivel ${value}`;
    case "unlock_class": return `Desbloquea ${value}`;
    case "title_grant": return `Otorga título ${value}`;
    default: return effect?.label || `${value ?? ""}`;
  }
}

function classAffinityText(classKey, item) {
  const cat = normalizeLoose(item?.cat);
  const effects = (item?.efectos || []).map((effect) => normalizeLoose(effect.tipo));
  if (classKey === "GUERRERO") {
    if (cat.includes("equipo") || effects.includes("hp_recover")) return "Muy afín a tu lectura de fuerza y aguante.";
    if (effects.includes("xp_bonus") || effects.includes("xp_mult")) return "Buen apoyo para cerrar rutas físicas.";
  }
  if (classKey === "ARQUERO") {
    if (effects.includes("xp_mult") || effects.includes("cooldown_red")) return "Encaja con sesiones rápidas y ritmo alto.";
    if (effects.includes("streak_shield")) return "Sostiene constancia cuando vienes encadenando rutas.";
  }
  if (classKey === "MAGO") {
    if (cat.includes("consumible") || effects.includes("xp_bonus")) return "Favorece control, foco y progreso limpio.";
    if (effects.includes("hp_recover")) return "Útil para recuperación y lectura más serena del mapa.";
  }
  return "Encaja bien como apoyo general del héroe.";
}

function inventorySimilarityCount(inventory, item) {
  return inventory.filter((entry) => normalizeLoose(entry.cat) === normalizeLoose(item?.cat)).length;
}

function itemKindFromCategory(item) {
  const cat = normalizeLoose(item?.cat);
  if (cat.includes("pocion") || cat.includes("consumible")) return "consumable";
  return "loot";
}

function normalizeLedgerKind(rawKind, matchedItem) {
  const kind = normalizeLoose(rawKind);
  if (kind.includes("cosmetic") || kind.includes("skin_purchase") || kind.includes("avatar_purchase") || kind.includes("frame_purchase")) {
    return "cosmetic";
  }
  if (kind.includes("service") || kind.includes("level_purchase")) {
    return "service";
  }
  if (kind.includes("consumable")) {
    return "consumable";
  }
  if (kind.includes("loot") || kind.includes("item_purchase")) {
    return matchedItem ? itemKindFromCategory(matchedItem) : "loot";
  }
  if (matchedItem) return itemKindFromCategory(matchedItem);
  return "loot";
}

function historyFilterMatcher(entry, filter) {
  if (filter === "all") return true;
  const date = safeDate(entry.occurredAt || entry.fecha);
  const now = new Date();
  if (filter === "today") {
    return Boolean(date)
      && date.getFullYear() === now.getFullYear()
      && date.getMonth() === now.getMonth()
      && date.getDate() === now.getDate();
  }
  if (filter === "week") {
    return Boolean(date) && (now.getTime() - date.getTime()) <= 7 * 24 * 60 * 60 * 1000;
  }
  return entry.kind === filter;
}

function itemImageCandidates(name) {
  if (!name) return [];
  return [
    `/items/${name}.png`,
    `/items/consumables/${name}.png`,
    `/items/equipment/${name}.png`,
    `/items/rewards/${name}.png`,
  ];
}

function fmtTime(totalSeconds) {
  const secs = Math.max(0, totalSeconds || 0);
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  if (h > 0) return `${h}h ${String(m).padStart(2, "0")}m`;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function isSameDay(dateLike) {
  const date = safeDate(dateLike);
  if (!date) return false;
  const now = new Date();
  return date.getFullYear() === now.getFullYear()
    && date.getMonth() === now.getMonth()
    && date.getDate() === now.getDate();
}

function normalizeMissionFocus(mission) {
  return [
    mission?.tipo,
    mission?.type,
    mission?.categoria,
    mission?.category,
    mission?.zona,
    mission?.zone,
    mission?.section,
  ]
    .map((value) => normalizeLoose(value))
    .filter(Boolean);
}

function itemMatchesMissionFocus(item, missionFocus) {
  if (!missionFocus?.length) return false;
  const cat = normalizeLoose(item?.cat);
  const effects = (item?.efectos || []).map((effect) => normalizeLoose(effect.tipo));
  return missionFocus.some((focus) => {
    if (!focus) return false;
    if (cat.includes(focus) || focus.includes(cat)) return true;
    if (focus.includes("fuerza")) return cat.includes("equipo") || effects.includes("hp_recover");
    if (focus.includes("cardio") || focus.includes("hiit") || focus.includes("agilidad")) {
      return effects.includes("cooldown_red") || effects.includes("xp_mult");
    }
    if (focus.includes("mente") || focus.includes("respir") || focus.includes("foco")) {
      return cat.includes("consumible") || effects.includes("xp_bonus");
    }
    if (focus.includes("hidrat")) {
      return cat.includes("pocion") || cat.includes("consumible");
    }
    return effects.some((effect) => effect.includes(focus));
  });
}

function buildMerchantContext({ profile, statsPayload, missions, recentSection = "" }) {
  const stats = statsPayload?.stats || statsPayload?.userStats || statsPayload?.data || {};
  const user = statsPayload?.user || profile || {};
  const activeMissions = Array.isArray(missions)
    ? missions.filter((mission) => {
        const state = normalizeLoose(mission?.estado || mission?.status);
        return !mission?.reclamada && !state.includes("complet") && !state.includes("reclam");
      })
    : [];
  const claimableMissions = Array.isArray(missions)
    ? missions.filter((mission) => {
        const state = normalizeLoose(mission?.estado || mission?.status);
        return mission?.reclamable || state.includes("list") || state.includes("complet");
      })
    : [];
  const missionFocus = [...new Set(activeMissions.flatMap(normalizeMissionFocus))];
  return {
    streak: Number(stats.streak ?? user.streak ?? profile?.streak ?? 0),
    level: Number(stats.nivel ?? user.level ?? profile?.level ?? 1),
    trainedToday: isSameDay(
      user.lastWorkoutAt
      || user.lastExerciseAt
      || user.lastActivityAt
      || profile?.lastWorkoutAt
      || profile?.lastExerciseAt
      || profile?.lastActivityAt,
    ),
    missionFocus,
    activeMissionCount: activeMissions.length,
    claimableMissionCount: claimableMissions.length,
    recentSection: normalizeLoose(recentSection),
    hour: new Date().getHours(),
  };
}

function scoreShopItem({ item, classKey, coins, activeBoosts, inventory, streakShield, merchantContext }) {
  let score = rarityMeta(item?.rareza).tier * 4;
  const cat = normalizeLoose(item?.cat);
  const effects = (item?.efectos || []).map((effect) => normalizeLoose(effect.tipo));
  const ownsSame = inventory.some((entry) => entry.id === item.id || entry.objectId === item.id);
  const hasXpBoost = activeBoosts.some((boost) => ["xp_bonus", "xp_mult"].includes(boost.type));

  if (item.gratis) score += 22;
  if (!item.gratis && item.precio <= coins) score += 14;
  if (!ownsSame) score += 10;
  if (effects.includes("streak_shield") && !streakShield) score += 22;
  if ((effects.includes("xp_bonus") || effects.includes("xp_mult")) && !hasXpBoost) score += 14;
  if (itemMatchesMissionFocus(item, merchantContext?.missionFocus)) score += 18;
  if (merchantContext?.claimableMissionCount > 0 && (effects.includes("xp_bonus") || effects.includes("xp_mult"))) score += 6;
  if (merchantContext?.trainedToday) {
    if (effects.includes("hp_recover")) score += 12;
    if (effects.includes("cooldown_red")) score += 10;
    if (cat.includes("equipo")) score -= 6;
  } else {
    if (effects.includes("streak_shield") && merchantContext?.streak >= 2) score += 10;
    if (effects.includes("xp_mult") || effects.includes("xp_bonus")) score += 8;
  }
  if (merchantContext?.recentSection === "rutinas") {
    if (effects.includes("cooldown_red") || effects.includes("xp_mult")) score += 8;
  }
  if (merchantContext?.recentSection === "misiones") {
    if (effects.includes("xp_bonus") || effects.includes("streak_shield")) score += 8;
  }
  if (merchantContext?.recentSection === "personaje" || merchantContext?.recentSection === "perfil") {
    if (cat.includes("equipo")) score += 6;
  }
  if (merchantContext?.hour >= 20) {
    if (effects.includes("hp_recover")) score += 8;
    if (cat.includes("consumible") || cat.includes("pocion")) score += 4;
  }

  if (classKey === "GUERRERO") {
    if (cat.includes("equipo")) score += 14;
    if (effects.includes("hp_recover")) score += 8;
  }
  if (classKey === "ARQUERO") {
    if (effects.includes("xp_mult")) score += 12;
    if (effects.includes("cooldown_red")) score += 14;
  }
  if (classKey === "MAGO") {
    if (cat.includes("consumible")) score += 10;
    if (effects.includes("xp_bonus")) score += 10;
  }

  return score;
}

function normalizeLedgerEntry(entry, items) {
  const matchedItem = items.find((item) => normalizeLoose(item.nombre) === normalizeLoose(entry.item || entry.nombre));
  const kind = normalizeLedgerKind(entry.kind || entry.type, matchedItem);
  const rarity = entry.rareza || matchedItem?.rareza || "Común";
  const occurredAt = entry.occurredAt || entry.purchasedAt || entry.fecha || entry.createdAt || new Date().toISOString();
  return {
    id: entry.id || `ledger-${occurredAt}-${entry.item || entry.nombre || "mov"}`,
    title: entry.item || entry.nombre || "Compra",
    itemName: entry.item || entry.nombre || "Compra",
    qty: Number(entry.cantidad || 1),
    amount: Number(entry.precio || entry.total || 0),
    currency: entry.currency || "coins",
    rarity,
    kind,
    source: entry.source || entry.origin || itemSourceLabel(matchedItem || entry),
    occurredAt,
    itemId: entry.itemId || matchedItem?.id || null,
  };
}

function SmartItemArt({ item, size = "76%", fit = "contain" }) {
  const [attempt, setAttempt] = useState(0);
  const candidates = useMemo(() => itemImageCandidates(item?.imagen), [item?.imagen]);
  const current = candidates[attempt];
  const rarity = rarityMeta(item?.rareza);
  const fallbackIcon = categoryMeta(item?.cat).icon || SHOP_ASSETS.icons.crate;

  if (!current) {
    return (
      <div className="uts-art-fallback" style={{ color: rarity.color }}>
        <img src={fallbackIcon} alt="" />
        <span>{item?.cat || "Botín"}</span>
      </div>
    );
  }

  return (
    <img
      src={current}
      alt={item?.nombre || ""}
      style={{ width: size, height: size, objectFit: fit }}
      onError={() => {
        if (attempt < candidates.length - 1) setAttempt((value) => value + 1);
      }}
    />
  );
}

function PurchaseModal({ item, coins, onClose, onConfirm, loading }) {
  const rarity = rarityMeta(item?.rareza);
  const [qty, setQty] = useState(1);
  const maxQty = item?.stackeable ? 9 : 1;
  const total = (item?.precio || 0) * qty;
  return (
    <motion.div
      className="uts-modal-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={(event) => { if (event.target === event.currentTarget) onClose(); }}
    >
      <motion.div
        className="uts-modal"
        initial={{ opacity: 0, y: 16, scale: .98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 16, scale: .98 }}
      >
        <div className="uts-modal-body">
          <div className="uts-kicker">
            <img src="/ui/header/section-tienda.png" alt="" />
            <span>Confirmar compra</span>
          </div>
          <div className="uts-feature-head">
            <div className="uts-feature-art" style={{ "--art-glow": rarity.glow }}>
              <SmartItemArt item={item} />
            </div>
            <div className="uts-feature-copy">
              <strong style={{ fontFamily: "'Manrope',sans-serif", fontWeight: 800, color: rarity.color }}>{item?.nombre}</strong>
              <p>{item?.descripcion}</p>
            </div>
          </div>
          {item?.stackeable && (
            <div className="uts-purchase-box">
              <small>Cantidad</small>
              <div className="uts-qty">
                <button type="button" onClick={() => setQty((value) => Math.max(1, value - 1))}>-</button>
                <strong>{qty}</strong>
                <button type="button" onClick={() => setQty((value) => Math.min(maxQty, value + 1))}>+</button>
              </div>
            </div>
          )}
          <div className="uts-purchase-box">
            <small>Total del contrato</small>
            <div className="uts-price">
              <span className="uts-price-dot" />
              {item?.gratis ? "Gratis" : total.toLocaleString()}
            </div>
            <p style={{ color: coins >= total ? UI.muted : UI.red, margin: 0, font: '600 13px/1.4 "Manrope", sans-serif' }}>
              {coins >= total ? "El gremio sí tiene saldo para cerrar este trato." : "No alcanzan las monedas para este botín."}
            </p>
          </div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button type="button" className="uts-secondary-btn" onClick={onClose}>Cancelar</button>
            <button
              type="button"
              className="uts-primary-btn"
              disabled={loading || (!item?.gratis && coins < total)}
              onClick={() => onConfirm(qty, total)}
            >
              <img src={SHOP_STATUS_ASSETS.buy} alt="" />
              {loading ? "Comprando..." : "Cerrar compra"}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

function StoreCard({ item, selected, owned, wishlisted = false, onSelect, onOpenBuy, onToggleWishlist }) {
  const rarity = rarityMeta(item.rareza);
  const cat = categoryMeta(item.cat);
  return (
    <div
      className={`uts-card${selected ? " is-selected" : ""}`}
      style={{ "--card-accent": rarity.color, "--card-glow": rarity.glow, "--art-glow": rarity.glow }}
      onClick={onSelect}
    >
      <div className="uts-item-art">
        <SmartItemArt item={item} />
      </div>
      <div className="uts-card-top">
        <div className="uts-card-copy">
          <strong>{item.nombre}</strong>
          <p>{item.descripcion}</p>
        </div>
        <span className="uts-rarity" style={{ color: rarity.color, borderColor: `${rarity.color}55` }}>
          <img src={rarity.asset} alt="" />
          {rarity.label}
        </span>
      </div>
      <div className="uts-tag-row">
        <span className="uts-mini-tag" style={{ color: cat.color, borderColor: `${cat.color}44` }}>
          <img src={cat.icon} alt="" />
          {cat.label}
        </span>
        {item.esNuevo && <span className="uts-mini-tag" style={{ color: UI.green, borderColor: `${UI.green}44` }}><img src={SHOP_STATUS_ASSETS.new} alt="" />Nuevo</span>}
        {item.descuento ? <span className="uts-mini-tag" style={{ color: UI.red, borderColor: `${UI.red}44` }}><img src={SHOP_STATUS_ASSETS.offer} alt="" />Oferta</span> : null}
        {owned ? <span className="uts-mini-tag" style={{ color: UI.green, borderColor: `${UI.green}44` }}><img src={SHOP_STATUS_ASSETS.owned} alt="" />En inventario</span> : null}
      </div>
      <div className="uts-card-bottom">
        <span className="uts-price">
          <span className="uts-price-dot" />
          {item.gratis ? "Gratis" : item.precio.toLocaleString()}
        </span>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button
            type="button"
            className="uts-card-cta"
            style={{
              minWidth: 42,
              paddingInline: 12,
              color: wishlisted ? UI.red : UI.muted,
              borderColor: wishlisted ? `${UI.red}55` : undefined,
              background: wishlisted ? `${UI.red}14` : undefined,
            }}
            onClick={(event) => {
              event.stopPropagation();
              onToggleWishlist?.(item.id);
            }}
            aria-label={wishlisted ? "Quitar de favoritos" : "Agregar a favoritos"}
            title={wishlisted ? "Quitar de favoritos" : "Agregar a favoritos"}
          >
            <Heart size={14} fill={wishlisted ? "currentColor" : "none"} />
          </button>
          <button type="button" className="uts-card-cta" onClick={(event) => { event.stopPropagation(); onOpenBuy(item); }}>
            <img src={SHOP_STATUS_ASSETS.buy} alt="" />
            Comprar <ChevronRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}

function InventoryRow({ item, onSelect, onUse, using, recommended = false }) {
  const rarity = rarityMeta(item.rareza);
  const cat = categoryMeta(item.cat);
  const remaining = itemRemainingSecs(item);
  return (
    <div className="uts-inline-card" onClick={onSelect}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
        <div className="uts-feature-art" style={{ width: 54, height: 54, "--art-glow": rarity.glow }}>
          <SmartItemArt item={item} size="72%" />
        </div>
        <div style={{ minWidth: 0 }}>
          <strong style={{ fontFamily: "'Manrope',sans-serif", fontSize: 13, fontWeight: 800 }}>{item.nombre}</strong>
          <p style={{ margin: "4px 0 0", font: '500 13px/1.45 "Manrope", sans-serif', color: UI.muted }}>
            {cat.label} · x{item.cantidad || 1}
          </p>
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        {recommended && (
          <span className="uts-mini-tag" style={{ color: UI.gold, borderColor: `${UI.gold}44` }}>
            <img src={SHOP_STATUS_ASSETS.recommended} alt="" />
            Recomendado
          </span>
        )}
        {remaining !== null && remaining <= 6 * 60 * 60 && (
          <span className="uts-mini-tag" style={{ color: UI.red, borderColor: `${UI.red}44` }}>
            <img src={SHOP_STATUS_ASSETS.expiring} alt="" />
            {fmtTime(remaining)}
          </span>
        )}
        <span className="uts-rarity" style={{ color: rarity.color, borderColor: `${rarity.color}55` }}>{rarity.label}</span>
        {item.consumible && (
          <button
            type="button"
            className="uts-secondary-btn"
            disabled={using}
            onClick={(event) => { event.stopPropagation(); onUse(item); }}
          >
            {using ? "..." : "Usar"}
          </button>
        )}
      </div>
    </div>
  );
}

function HistoryRow({ entry, onSelect }) {
  const tone = historyKindMeta(entry.kind);
  const rarity = rarityMeta(entry.rarity);
  return (
    <div className="uts-history-row" onClick={onSelect}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
        <img src={tone.icon} alt="" style={{ width: 44, height: 44, objectFit: "contain", opacity: .95 }} />
        <div>
          <small style={{ color: tone.color, display: "block", marginBottom: 3 }}>{tone.label}</small>
          <strong style={{ fontFamily: "'Manrope',sans-serif", fontSize: 13, fontWeight: 800 }}>{entry.title || entry.itemName || "Compra"}</strong>
          <p style={{ margin: "4px 0 0", font: '500 13px/1.45 "Manrope", sans-serif', color: UI.muted }}>
            {dateLabel(entry.occurredAt)} · x{entry.qty || 1} · {entry.source || "Mercado"}
          </p>
        </div>
      </div>
      <div style={{ display: "grid", justifyItems: "end", gap: 6 }}>
        <span className="uts-rarity" style={{ color: rarity.color, borderColor: `${rarity.color}55` }}>{rarity.label}</span>
        <div className="uts-price">
          <span className="uts-price-dot" />
          {(entry.amount || 0).toLocaleString()}
        </div>
      </div>
    </div>
  );
}

function CosmeticCard({ item, type, owned, buying, equipped = false, onSelect, onBuy, onEquip }) {
  const rarity = rarityMeta(item.rareza);
  const isSkin = type === "skin";
  const isAvatar = type === "avatar";
  const isTitle = type === "title";
  const preview = isSkin
    ? (item.preview || getSkinPreview(item.id || item.nombre || "default"))
    : isAvatar
      ? getAvatarImage(item.id)
      : null;

  return (
    <div
      className="uts-card"
      style={{ "--card-accent": rarity.color, "--card-glow": rarity.glow, "--art-glow": rarity.glow, minHeight: 278 }}
      onClick={onSelect}
    >
      <div className="uts-item-art">
        {type === "frame" ? (
          <div
            style={{
              width: "74%",
              aspectRatio: "1/1",
              borderRadius: "50%",
              background: item.gradient || `linear-gradient(135deg, ${rarity.color}, #111)`,
              padding: 8,
              display: "grid",
              placeItems: "center",
              animation: item.animated ? "spin 8s linear infinite" : "none",
            }}
          >
            <div style={{ width: "100%", height: "100%", borderRadius: "50%", background: "rgba(8,6,16,.82)" }} />
          </div>
        ) : isTitle ? (
          <div className="uts-art-fallback" style={{ color: rarity.color }}>
            <img src={cosmeticFallbackIcon(type)} alt="" />
            <span>Título</span>
          </div>
        ) : preview ? (
          <img src={preview} alt={item.nombre} style={{ width: "76%", height: "76%", objectFit: "contain" }} />
        ) : (
          <div className="uts-art-fallback">
            <img src={cosmeticFallbackIcon(type)} alt="" />
            <span>{type === "skin" ? "Skin" : type === "avatar" ? "Avatar" : type === "frame" ? "Marco" : "Título"}</span>
          </div>
        )}
      </div>
      <div className="uts-card-copy">
        <strong>{item.nombre || item.name}</strong>
        <p>{item.desc || item.descripcion || "Pieza visual para personalizar el perfil del héroe."}</p>
      </div>
      <div className="uts-tag-row">
        <span className="uts-rarity" style={{ color: rarity.color, borderColor: `${rarity.color}55` }}>
          <img src={rarity.asset} alt="" />
          {rarity.label}
        </span>
        <span className="uts-mini-tag"><img src={cosmeticFallbackIcon(type)} alt="" />{type === "skin" ? "Skin" : type === "avatar" ? "Avatar" : type === "frame" ? "Marco" : "Título"}</span>
        {item.esNuevo && <span className="uts-mini-tag" style={{ color: UI.green, borderColor: `${UI.green}44` }}>Nuevo</span>}
        {equipped && <span className="uts-mini-tag" style={{ color: UI.gold, borderColor: `${UI.gold}44` }}>Activo</span>}
      </div>
      <div className="uts-card-bottom">
        <span className="uts-price">
          <span className="uts-price-dot" />
          {item.precio?.toLocaleString?.() || "Gratis"}
        </span>
        {owned ? (
          <button
            type="button"
            className="uts-card-cta"
            disabled={equipped || buying}
            onClick={(event) => {
              event.stopPropagation();
              onEquip?.(item);
            }}
          >
            {equipped ? "Activo" : buying ? "..." : "Equipar"}
          </button>
        ) : (
          <button type="button" className="uts-card-cta" disabled={buying} onClick={(event) => { event.stopPropagation(); onBuy(item); }}>
            {buying ? "..." : "Comprar"}
          </button>
        )}
      </div>
    </div>
  );
}

function CosmeticPreviewModal({ entry, owned, buying, equipped = false, onClose, onBuy, onEquip, classKey }) {
  if (!entry) return null;
  const rarity = rarityMeta(entry.rareza);
  const preview = entry.type === "skin"
    ? (entry.data.preview || getSkinPreview(entry.data.id || entry.data.nombre || "default"))
    : entry.type === "avatar"
      ? getAvatarImage(entry.data.id)
      : null;

  return (
    <motion.div
      className="uts-modal-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={(event) => { if (event.target === event.currentTarget) onClose(); }}
    >
      <motion.div
        className="uts-modal"
        initial={{ opacity: 0, y: 18, scale: .98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 18, scale: .98 }}
      >
        <div className="uts-modal-body">
          <div className="uts-kicker">
            <img src={SHOP_ASSETS.icons.cosmetic} alt="" />
            <span>Colección visual</span>
          </div>
          <div className="uts-feature-head">
            <div className="uts-feature-art" style={{ "--art-glow": rarity.glow }}>
              {entry.type === "frame" ? (
                <div
                  style={{
                    width: "74%",
                    aspectRatio: "1/1",
                    borderRadius: "50%",
                    background: entry.data.gradient || `linear-gradient(135deg, ${rarity.color}, #111)`,
                    padding: 8,
                    display: "grid",
                    placeItems: "center",
                    animation: entry.data.animated ? "spin 8s linear infinite" : "none",
                  }}
                >
                  <div style={{ width: "100%", height: "100%", borderRadius: "50%", background: "rgba(8,6,16,.82)" }} />
                </div>
              ) : entry.type === "title" ? (
                <div className="uts-art-fallback" style={{ color: rarity.color }}>
                  <img src={cosmeticFallbackIcon(entry.type)} alt="" />
                  <span>Título</span>
                </div>
              ) : preview ? (
                <img src={preview} alt={entry.data.nombre} style={{ width: "76%", height: "76%", objectFit: "contain" }} />
              ) : (
                <div className="uts-art-fallback">
                  <img src={cosmeticFallbackIcon(entry.type)} alt="" />
                  <span>{entry.type === "skin" ? "Skin" : entry.type === "avatar" ? "Avatar" : entry.type === "frame" ? "Marco" : "Título"}</span>
                </div>
              )}
            </div>
            <div className="uts-feature-copy">
              <strong style={{ color: rarity.color }}>{entry.data.nombre || entry.data.name}</strong>
              <p>{entry.data.desc || entry.data.descripcion || "Pieza visual para la presencia del héroe."}</p>
            </div>
          </div>
          <div className="uts-detail-box">
            <small>Lectura de colección</small>
            <div className="uts-tag-row">
              <span className="uts-rarity" style={{ color: rarity.color, borderColor: `${rarity.color}55` }}>{rarity.label}</span>
              <span className="uts-mini-tag"><img src={cosmeticFallbackIcon(entry.type)} alt="" />{entry.type === "skin" ? "Skin" : entry.type === "avatar" ? "Avatar" : entry.type === "frame" ? "Marco" : "Título"}</span>
              <span className="uts-mini-tag" style={{ color: UI.blue, borderColor: `${UI.blue}44` }}>{classAffinityText(classKey, entry.data)}</span>
              {equipped ? <span className="uts-mini-tag" style={{ color: UI.gold, borderColor: `${UI.gold}44` }}>Activo</span> : null}
            </div>
          </div>
          <div className="uts-purchase-box">
            <small>Comparación rápida</small>
            <p style={{ margin: 0, color: UI.muted }}>Revisa cómo se vería en tu perfil antes de cerrar la compra. Esta ficha ya deja listo el espacio para tus PNGs finales.</p>
          </div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button type="button" className="uts-secondary-btn" onClick={onClose}>Cerrar</button>
            {owned ? (
              <button type="button" className="uts-primary-btn" disabled={equipped || buying} onClick={() => onEquip?.(entry.data, entry.type)}>
                <img src={SHOP_STATUS_ASSETS.owned} alt="" />
                {equipped ? "Ya activo" : buying ? "Procesando..." : "Equipar"}
              </button>
            ) : (
              <button type="button" className="uts-primary-btn" disabled={buying} onClick={() => onBuy(entry.data, entry.type)}>
                <img src={SHOP_STATUS_ASSETS.buy} alt="" />
                {buying ? "Procesando..." : "Comprar pieza visual"}
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

function BoostPanel({ boosts, streakShield, onExpire }) {
  const [ticks, setTicks] = useState({});

  useEffect(() => {
    const next = {};
    for (const boost of boosts) next[boost.type] = boost.remainingSecs;
    if (streakShield) next.streak_shield = streakShield.remainingSecs;
    setTicks(next);
  }, [boosts, streakShield]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setTicks((current) => {
        const next = { ...current };
        Object.keys(next).forEach((key) => {
          next[key] = Math.max(0, (next[key] || 0) - 1);
        });
        return next;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const expired = Object.values(ticks).some((value) => value === 0);
    if (expired && onExpire) onExpire();
  }, [ticks, onExpire]);

  const all = [
    ...boosts.map((boost) => ({ ...boost, key: boost.type })),
    ...(streakShield ? [{ key: "streak_shield", type: "streak_shield", label: `Protector de racha ${streakShield.days}d`, icon: "shield", remainingSecs: streakShield.remainingSecs }] : []),
  ];

  if (all.length === 0) {
    return (
      <div className="uts-empty">
        <img src={SHOP_ASSETS.empty} alt="" style={{ width: 52, height: 52, objectFit: "contain", opacity: .86 }} />
        <strong>No hay efectos activos</strong>
        <p>Cuando consumas piezas del mercado, la lectura del boost aparece aquí con tiempo real.</p>
      </div>
    );
  }

  return (
    <div className="uts-boost-list">
      {all.map((boost) => {
        const tone = BOOST_COLORS[boost.type] || UI.blue;
        const rem = ticks[boost.key] ?? boost.remainingSecs ?? 0;
        const total = boost.remainingSecs || 1;
        const pct = Math.max(0, Math.min(100, (rem / total) * 100));
        return (
          <div key={boost.key} className="uts-boost-pill" style={{ borderColor: `${tone}44`, background: `${tone}12` }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
              <strong style={{ color: tone, fontFamily: "'Manrope',sans-serif", fontSize: 13, fontWeight: 700 }}>{boost.label || boost.type}</strong>
              <span style={{ color: rem < 60 ? UI.red : UI.text, fontFamily: "'Manrope',sans-serif", fontSize: 13 }}>{fmtTime(rem)}</span>
            </div>
            <div className="uts-progress"><span style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${tone}, ${tone})` }} /></div>
          </div>
        );
      })}
    </div>
  );
}

function QuickLevelCard({ coins, profile, onSuccess, highlighted = false }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const bought = profile?.levelsBoughtTotal || 0;
  const remaining = Math.max(0, LEVEL_MAX_BUY - bought);
  const canBuy = coins >= LEVEL_PRICE && remaining > 0;
  const pct = Math.round((bought / LEVEL_MAX_BUY) * 100);

  const handleBuy = async () => {
    if (!canBuy || loading) return;
    setLoading(true);
    setError("");
    try {
      const user = auth.currentUser;
      if (!user) throw new Error("Debes tener sesión activa.");
      const token = await user.getIdToken();
      const res = await buyLevel(token);
      if (!res?.ok) throw new Error(res?.message || "No pudimos procesar el servicio del gremio.");
      onSuccess?.(res);
    } catch (err) {
      setError(err.message || "No pudimos procesar el servicio del gremio.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="uts-band-card"
      style={highlighted ? {
        borderColor: `${UI.gold}55`,
        boxShadow: `0 0 0 1px ${UI.gold}22, 0 0 26px rgba(244,204,120,.16)`,
        background: "linear-gradient(180deg, rgba(244,204,120,.08), rgba(18,12,30,.92))",
      } : undefined}
    >
      <small>Servicios del gremio</small>
      <strong style={{ color: UI.gold }}>Lv {profile?.level || 1} → {Number(profile?.level || 1) + 1}</strong>
      <p>El escriba puede forjar un ascenso directo si quieres abrir contenido más rápido sin tratarlo como compra común.</p>
      <div className="uts-progress"><span style={{ width: `${pct}%` }} /></div>
      <div className="uts-tag-row">
        <span className="uts-mini-tag"><img src={SHOP_ASSETS.icons.service} alt="" />{remaining} servicios restantes</span>
        <span className="uts-mini-tag" style={{ color: UI.gold }}><img src={SHOP_STATUS_ASSETS.coins} alt="" />{LEVEL_PRICE.toLocaleString()}</span>
      </div>
      {error && <p style={{ color: UI.red, margin: 0, font: '600 13px/1.4 "Manrope", sans-serif' }}>{error}</p>}
      <button type="button" className="uts-primary-btn" disabled={!canBuy || loading} onClick={handleBuy}>
        <img src={SHOP_ASSETS.icons.service} alt="" />
        {loading ? "Procesando..." : canBuy ? "Forjar ascenso" : remaining <= 0 ? "Límite alcanzado" : "Monedas insuficientes"}
      </button>
    </div>
  );
}

export default function UserTiendaLanding({ profile, onCoinsChange, onProfilePatch }) {
  const CHAT_DEEPLINK_KEY = "fv-chat-deeplink-v1";
  const isMobile = useIsMobile();
  const classKey = String(profile?.heroClass || "DEFAULT").toUpperCase();
  const classTheme = USER_CLASS_THEME[classKey] || USER_CLASS_THEME.DEFAULT;
  const copy = STORE_COPY[classKey] || STORE_COPY.DEFAULT;
  const scene = STORE_SCENE[classKey] || STORE_SCENE.DEFAULT;

  const [tab, setTab] = useState(() => localStorage.getItem("uts-tab") || "mercado");
  const [category, setCategory] = useState(() => localStorage.getItem("uts-cat") || "Todos");
  const [search, setSearch] = useState("");
  const [rarityFilter, setRarityFilter] = useState(() => localStorage.getItem("uts-rarity") || "all");
  const [sortBy, setSortBy] = useState(() => localStorage.getItem("uts-sort") || "nuevo");
  const [inventoryFilter, setInventoryFilter] = useState(() => localStorage.getItem("uts-inv-filter") || "all");
  const [inventorySort, setInventorySort] = useState(() => localStorage.getItem("uts-inv-sort") || "utility");
  const [historyFilter, setHistoryFilter] = useState(() => localStorage.getItem("uts-history-filter") || "today");
  const [cosmeticTab, setCosmeticTab] = useState(() => localStorage.getItem("uts-cosmetic-tab") || "skin");
  const [coins, setCoins] = useState(profile?.coins ?? 0);
  const [items, setItems] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [history, setHistory] = useState([]);
  const [skins, setSkins] = useState([]);
  const [avatarCatalog, setAvatarCatalog] = useState([]);
  const [frameCatalog, setFrameCatalog] = useState([]);
  const [titlesCatalog, setTitlesCatalog] = useState([]);
  const [ownedSkins, setOwnedSkins] = useState(profile?.ownedSkins ?? ["default"]);
  const [ownedAvatars, setOwnedAvatars] = useState(profile?.ownedAvatars ?? ["avatar_01"]);
  const [ownedFrames, setOwnedFrames] = useState(profile?.ownedFrames ?? []);
  const [ownedTitles, setOwnedTitles] = useState(profile?.ownedTitles ?? (profile?.titulo ? [profile.titulo] : []));
  const [activeTitle, setActiveTitle] = useState(profile?.titulo ?? "");
  const [activeSkinId, setActiveSkinId] = useState(profile?.activeSkin ?? "default");
  const [activeAvatarId, setActiveAvatarId] = useState(profile?.activeAvatar ?? "avatar_01");
  const [activeFrameId, setActiveFrameId] = useState(profile?.activeFrame ?? null);
  const [activeBoosts, setActiveBoosts] = useState([]);
  const [streakShield, setStreakShield] = useState(null);
  const [wishlist, setWishlist] = useState(() => new Set());
  const [selected, setSelected] = useState(null);
  const [loadingByTab, setLoadingByTab] = useState({ mercado: false, inventario: false, cosmeticos: false, historial: false });
  const [loadedTabs, setLoadedTabs] = useState({ mercado: false, inventario: false, cosmeticos: false, historial: false });
  const [errorsByTab, setErrorsByTab] = useState({});
  const [buyingId, setBuyingId] = useState(null);
  const [usingId, setUsingId] = useState(null);
  const [purchaseTarget, setPurchaseTarget] = useState(null);
  const [toast, setToast] = useState(null);
  const [liveProfile, setLiveProfile] = useState(profile);
  const [inventoryCategory, setInventoryCategory] = useState(() => localStorage.getItem("uts-inv-cat") || "");
  const [inventoryPage, setInventoryPage] = useState(0);
  const [historyExpanded, setHistoryExpanded] = useState(false);
  const [historyCursor, setHistoryCursor] = useState(null);
  const [historyHasMore, setHistoryHasMore] = useState(false);
  const [historyLoadingMore, setHistoryLoadingMore] = useState(false);
  const [ledgerEvents, setLedgerEvents] = useState([]);
  const [cosmeticPreview, setCosmeticPreview] = useState(null);
  const [pendingShopAction, setPendingShopAction] = useState(null);
  const [merchantContext, setMerchantContext] = useState(() => buildMerchantContext({ profile, statsPayload: null, missions: [], recentSection: "" }));
  const [serviceSpotlight, setServiceSpotlight] = useState(false);
  const [inventoryDetailOpen, setInventoryDetailOpen] = useState(true);
  const wishlistHydratedRef = useRef(false);
  const wishlistSkipSyncRef = useRef(false);
  const wishlistTimerRef = useRef(null);
  const serviceSpotlightTimerRef = useRef(null);

  useEffect(() => { localStorage.setItem("uts-tab", tab); }, [tab]);
  useEffect(() => { localStorage.setItem("uts-cat", category); }, [category]);
  useEffect(() => { if (inventoryCategory) localStorage.setItem("uts-inv-cat", inventoryCategory); }, [inventoryCategory]);
  useEffect(() => { localStorage.setItem("uts-rarity", rarityFilter); }, [rarityFilter]);
  useEffect(() => { localStorage.setItem("uts-sort", sortBy); }, [sortBy]);
  useEffect(() => { localStorage.setItem("uts-inv-filter", inventoryFilter); }, [inventoryFilter]);
  useEffect(() => { localStorage.setItem("uts-inv-sort", inventorySort); }, [inventorySort]);
  useEffect(() => { localStorage.setItem("uts-history-filter", historyFilter); }, [historyFilter]);
  useEffect(() => { localStorage.setItem("uts-cosmetic-tab", cosmeticTab); }, [cosmeticTab]);
  useEffect(() => { if (profile?.coins !== undefined) setCoins(profile.coins); }, [profile?.coins]);
  useEffect(() => { setLiveProfile(profile); }, [profile]);
  useEffect(() => {
    setOwnedSkins(profile?.ownedSkins ?? ["default"]);
    setOwnedAvatars(profile?.ownedAvatars ?? ["avatar_01"]);
    setOwnedFrames(profile?.ownedFrames ?? []);
    setOwnedTitles(profile?.ownedTitles ?? (profile?.titulo ? [profile.titulo] : []));
    setActiveTitle(profile?.titulo ?? "");
    setActiveSkinId(profile?.activeSkin ?? "default");
    setActiveAvatarId(profile?.activeAvatar ?? "avatar_01");
    setActiveFrameId(profile?.activeFrame ?? null);
  }, [
    profile?.activeAvatar,
    profile?.activeFrame,
    profile?.activeSkin,
    profile?.ownedAvatars,
    profile?.ownedFrames,
    profile?.ownedSkins,
    profile?.ownedTitles,
    profile?.titulo,
  ]);
  useEffect(() => {
    setMerchantContext((current) => ({
      ...current,
      streak: Number(profile?.streak ?? current.streak ?? 0),
      level: Number(profile?.level ?? current.level ?? 1),
      trainedToday: current.trainedToday || isSameDay(profile?.lastWorkoutAt || profile?.lastExerciseAt || profile?.lastActivityAt),
    }));
  }, [profile]);

  useEffect(() => {
    if (!wishlistHydratedRef.current) return undefined;
    if (wishlistSkipSyncRef.current) {
      wishlistSkipSyncRef.current = false;
      return undefined;
    }
    if (wishlistTimerRef.current) window.clearTimeout(wishlistTimerRef.current);
    wishlistTimerRef.current = window.setTimeout(async () => {
      try {
        const user = auth.currentUser;
        if (!user) return;
        const token = await user.getIdToken();
        await saveWishlist(token, [...wishlist]);
      } catch {}
    }, 1500);

    return () => {
      if (wishlistTimerRef.current) window.clearTimeout(wishlistTimerRef.current);
    };
  }, [wishlist]);

  useEffect(() => {
    const consumeChatDeepLink = (payload) => {
      if (!payload) return false;
      const section = String(payload.section || "").toLowerCase();
      if (section && section !== "tienda") return false;
      const ctaType = normalizeLoose(payload.ctaType || payload.type || "");
      if (ctaType.includes("service") || ctaType.includes("level")) {
        setTab("mercado");
        setSelected(null);
        setServiceSpotlight(true);
        return true;
      }
      if (["skin", "avatar", "frame", "title", "cosmetic"].some((kind) => ctaType.includes(kind))) {
        setTab("cosmeticos");
        setPendingShopAction({
          kind: ["skin", "avatar", "frame", "title"].find((value) => ctaType.includes(value)) || "cosmetic",
          itemId: payload.itemId || payload.entityId || null,
        });
        return true;
      }
      const itemId = payload.itemId || payload.entityId || null;
      if (!itemId) return false;
      const item = items.find((entry) => entry.id === itemId);
      if (!item) return false;
      setTab("mercado");
      setSelected({ kind: "item", data: item });
      return true;
    };

    const consumeStored = () => {
      try {
        const raw = window.sessionStorage.getItem(CHAT_DEEPLINK_KEY);
        if (!raw) return;
        const payload = JSON.parse(raw);
        if (consumeChatDeepLink(payload)) {
          window.sessionStorage.removeItem(CHAT_DEEPLINK_KEY);
        }
      } catch {}
    };

    const onChatDeepLink = (event) => {
      if (consumeChatDeepLink(event.detail || null)) {
        try { window.sessionStorage.removeItem(CHAT_DEEPLINK_KEY); } catch {}
      }
    };

    consumeStored();
    window.addEventListener("chatGameplayLink", onChatDeepLink);
    return () => window.removeEventListener("chatGameplayLink", onChatDeepLink);
  }, [items]);

  useEffect(() => {
    if (!serviceSpotlight) return undefined;
    if (serviceSpotlightTimerRef.current) window.clearTimeout(serviceSpotlightTimerRef.current);
    serviceSpotlightTimerRef.current = window.setTimeout(() => {
      setServiceSpotlight(false);
    }, 3200);
    return () => {
      if (serviceSpotlightTimerRef.current) window.clearTimeout(serviceSpotlightTimerRef.current);
    };
  }, [serviceSpotlight]);

  useEffect(() => {
    if (!pendingShopAction || tab !== "cosmeticos") return;
    const targetKind = pendingShopAction.kind === "cosmetic" ? "skin" : pendingShopAction.kind;
    const collections = {
      skin: skins,
      avatar: avatarCatalog.length ? avatarCatalog : AVATARS_CATALOG,
      frame: frameCatalog.length ? frameCatalog : FRAMES_CATALOG,
      title: titlesCatalog,
    };
    const targetItems = collections[targetKind] || [];
    const target = targetItems.find((entry) => entry.id === pendingShopAction.itemId);
    if (!target) return;
    setCosmeticTab(targetKind);
    setSelected({ kind: targetKind, data: target });
    setCosmeticPreview({ type: targetKind, data: target });
    setPendingShopAction(null);
  }, [avatarCatalog, frameCatalog, pendingShopAction, skins, tab]);

  const markTabLoading = useCallback((tabKey, value) => {
    setLoadingByTab((current) => ({ ...current, [tabKey]: value }));
  }, []);

  const markTabLoaded = useCallback((tabKey) => {
    setLoadedTabs((current) => ({ ...current, [tabKey]: true }));
  }, []);

  const setTabError = useCallback((tabKey, message = "") => {
    setErrorsByTab((current) => ({ ...current, [tabKey]: message }));
  }, []);

  const hydrateWishlist = useCallback((nextWishlist) => {
    const list = Array.isArray(nextWishlist) ? nextWishlist.filter((id) => typeof id === "string") : [];
    wishlistSkipSyncRef.current = true;
    setWishlist(new Set(list));
    wishlistHydratedRef.current = true;
  }, []);

  const toggleWishlist = useCallback((itemId) => {
    if (!itemId) return;
    wishlistHydratedRef.current = true;
    setWishlist((current) => {
      const next = new Set(current);
      if (next.has(itemId)) next.delete(itemId);
      else next.add(itemId);
      return next;
    });
  }, []);

  const getUserToken = useCallback(async (tabKey) => {
    const user = auth.currentUser;
    if (!user) {
      setTabError(tabKey, "Debes iniciar sesión para abrir el mercado.");
      return null;
    }
    return user.getIdToken();
  }, [setTabError]);

  const getRecommendationCacheKey = useCallback((uid) => `fv-shop-reco-${uid}`, []);

  const loadMerchantContext = useCallback(async (token, { force = false } = {}) => {
    const user = auth.currentUser;
    if (!user) return null;
    const cacheKey = getRecommendationCacheKey(user.uid);
    if (!force) {
      try {
        const raw = window.sessionStorage.getItem(cacheKey);
        if (raw) {
          const cached = JSON.parse(raw);
          if (cached?.ts && Date.now() - cached.ts < SHOP_RECO_TTL && cached?.data) {
            setMerchantContext(cached.data);
            return cached.data;
          }
        }
      } catch {}
    }

    try {
      const [statsRes, missionsRes] = await Promise.allSettled([
        getUserStats(token),
        getMisionesUsuario(token),
      ]);
      const statsPayload = statsRes.status === "fulfilled" ? statsRes.value : null;
      const missions = missionsRes.status === "fulfilled"
        ? (missionsRes.value?.misiones || missionsRes.value?.missions || missionsRes.value?.data || [])
        : [];
      const recentSection = (() => {
        try {
          const raw = window.sessionStorage.getItem(CHAT_DEEPLINK_KEY);
          if (!raw) return "";
          return JSON.parse(raw)?.section || "";
        } catch {
          return "";
        }
      })();
      const next = buildMerchantContext({ profile, statsPayload, missions, recentSection });
      setMerchantContext(next);
      try {
        window.sessionStorage.setItem(cacheKey, JSON.stringify({ ts: Date.now(), data: next }));
      } catch {}
      return next;
    } catch {
      const fallback = buildMerchantContext({ profile, statsPayload: null, missions: [], recentSection: "" });
      setMerchantContext(fallback);
      return fallback;
    }
  }, [CHAT_DEEPLINK_KEY, getRecommendationCacheKey, profile]);

  const loadMarketTab = useCallback(async (force = false) => {
    if (loadedTabs.mercado && !force) return;
    markTabLoading("mercado", true);
    setTabError("mercado", "");
    try {
      const token = await getUserToken("mercado");
      if (!token) return;
      const [res, boostsRes] = await Promise.all([getObjetosPublic(token), getActiveBoosts(token)]);
      if (!res?.ok) throw new Error(res?.message || "No pudimos cargar el mercado del gremio.");
      setItems((res.objetos || []).map(normalizeItem));
      if (boostsRes?.ok) {
        setActiveBoosts(boostsRes.boosts || []);
        setStreakShield(boostsRes.streakShield || null);
        hydrateWishlist(boostsRes.wishlist || []);
      }
      void loadMerchantContext(token);
      markTabLoaded("mercado");
    } catch (err) {
      setTabError("mercado", err.message || "No pudimos cargar el mercado del gremio.");
    } finally {
      markTabLoading("mercado", false);
    }
  }, [getUserToken, hydrateWishlist, loadMerchantContext, loadedTabs.mercado, markTabLoaded, markTabLoading, setTabError]);

  const loadInventoryTab = useCallback(async (force = false) => {
    if (loadedTabs.inventario && !force) return;
    markTabLoading("inventario", true);
    setTabError("inventario", "");
    try {
      const token = await getUserToken("inventario");
      if (!token) return;
      const [invRes, boostsRes] = await Promise.all([getInventario(token), getActiveBoosts(token)]);
      if (!invRes?.ok) throw new Error(invRes?.message || "No pudimos leer la reserva del héroe.");
      setInventory((invRes.items || []).map(normalizeItem));
      if (boostsRes?.ok) {
        setActiveBoosts(boostsRes.boosts || []);
        setStreakShield(boostsRes.streakShield || null);
        hydrateWishlist(boostsRes.wishlist || []);
      }
      markTabLoaded("inventario");
    } catch (err) {
      setTabError("inventario", err.message || "No pudimos leer la reserva del héroe.");
    } finally {
      markTabLoading("inventario", false);
    }
  }, [getUserToken, hydrateWishlist, loadedTabs.inventario, markTabLoaded, markTabLoading, setTabError]);

  const loadCosmeticsTab = useCallback(async (force = false) => {
    if (loadedTabs.cosmeticos && !force) return;
    markTabLoading("cosmeticos", true);
    setTabError("cosmeticos", "");
    try {
      const [res, avatarRes, titlesRes] = await Promise.all([getSkins(), getAvatarCatalog(), getTitlesCatalog()]);
      if (!res?.ok) throw new Error(res?.message || "No pudimos cargar la colección visual.");
      setSkins(res.skins || []);
      if (avatarRes?.ok) {
        setAvatarCatalog(Array.isArray(avatarRes.avatars) ? avatarRes.avatars : []);
        setFrameCatalog(Array.isArray(avatarRes.frames) ? avatarRes.frames : []);
      } else {
        setAvatarCatalog([]);
        setFrameCatalog([]);
      }
      setTitlesCatalog(titlesRes?.ok && Array.isArray(titlesRes.titles) ? titlesRes.titles : []);
      markTabLoaded("cosmeticos");
    } catch (err) {
      setTabError("cosmeticos", err.message || "No pudimos cargar la colección visual.");
    } finally {
      markTabLoading("cosmeticos", false);
    }
  }, [loadedTabs.cosmeticos, markTabLoaded, markTabLoading, setTabError]);

  const loadHistoryTab = useCallback(async (force = false, { append = false } = {}) => {
    if (append && !historyHasMore) return;
    if (!append && loadedTabs.historial && !force) return;
    if (append) setHistoryLoadingMore(true);
    else markTabLoading("historial", true);
    setTabError("historial", "");
    try {
      const token = await getUserToken("historial");
      if (!token) return;
      const res = await getPurchases(token, {
        limit: SHOP_HISTORY_PAGE_SIZE,
        cursor: append ? historyCursor : "",
      });
      if (!res?.ok) throw new Error(res?.message || "No pudimos cargar la bitácora del mercado.");
      const nextPurchases = res.purchases || [];
      setHistory((current) => append ? [...current, ...nextPurchases] : nextPurchases);
      setHistoryCursor(res.nextCursor || null);
      setHistoryHasMore(Boolean(res.hasMore));
      markTabLoaded("historial");
    } catch (err) {
      setTabError("historial", err.message || "No pudimos cargar la bitácora del mercado.");
    } finally {
      if (append) setHistoryLoadingMore(false);
      else markTabLoading("historial", false);
    }
  }, [getUserToken, historyCursor, historyHasMore, loadedTabs.historial, markTabLoaded, markTabLoading, setTabError]);

  useEffect(() => {
    loadMarketTab();
  }, [loadMarketTab]);

  useEffect(() => {
    if (tab === "inventario") loadInventoryTab();
    if (tab === "cosmeticos") loadCosmeticsTab();
    if (tab === "historial") loadHistoryTab();
  }, [tab, loadCosmeticsTab, loadHistoryTab, loadInventoryTab]);

  useEffect(() => {
    const onXP = async (event) => {
      const detail = event.detail || {};
      if (detail.coins !== undefined) setCoins(detail.coins);
      if (detail.xp > 0 || detail.leveledUp || detail.source === "tienda") {
        loadInventoryTab(true);
      }
    };
    window.addEventListener("exerciseCompleted", onXP);
    return () => window.removeEventListener("exerciseCompleted", onXP);
  }, [loadInventoryTab]);

  const pushLedgerEvent = useCallback((payload) => {
    setLedgerEvents((current) => [
      normalizeLedgerEntry(
        {
          id: payload.id || `ledger-${Date.now()}`,
          nombre: payload.title,
          item: payload.title,
          cantidad: payload.qty || 1,
          precio: payload.amount || 0,
          rareza: payload.rarity || "Común",
          kind: payload.kind || "loot",
          source: payload.source || "Mercado",
          occurredAt: payload.occurredAt || new Date().toISOString(),
          itemId: payload.itemId || null,
        },
        items,
      ),
      ...current,
    ]);
  }, [items]);

  const handleLevelSuccess = useCallback(async (res) => {
    const nextCoins = res?.coins ?? res?.coinsLeft;
    const nextSkillPoints = res?.skillPoints;
    if (nextCoins !== undefined) {
      setCoins(nextCoins);
      onCoinsChange?.(nextCoins);
    }
    setLiveProfile((current) => ({
      ...current,
      coins: nextCoins ?? current?.coins,
      level: res?.newLevel ?? current?.level,
      xpNext: res?.xpNext ?? current?.xpNext,
      levelsBoughtTotal: res?.levelsBought ?? current?.levelsBoughtTotal,
      skillPoints: nextSkillPoints ?? current?.skillPoints,
    }));
    onProfilePatch?.({
      coins: nextCoins,
      level: res?.newLevel,
      xpNext: res?.xpNext,
      levelsBoughtTotal: res?.levelsBought,
      skillPoints: nextSkillPoints,
    });
    window.dispatchEvent(new CustomEvent("levelUp", {
      detail: {
        source: "tienda",
        leveledUp: true,
        newLevel: res?.newLevel,
        xpNext: res?.xpNext,
        coins: nextCoins,
        skillPoints: nextSkillPoints,
      },
    }));
    try {
      const user = auth.currentUser;
      if (user) {
        const token = await user.getIdToken();
        await Promise.allSettled([
          loadedTabs.historial ? loadHistoryTab(true) : Promise.resolve(),
          loadMerchantContext(token, { force: true }),
        ]);
      }
    } catch {}
    pushLedgerEvent({
      id: `service-level-${Date.now()}`,
      title: "Ascenso del gremio",
      qty: 1,
      amount: LEVEL_PRICE,
      rarity: "Legendario",
      kind: "service",
      source: "Servicio del gremio",
    });
    setToast({ title: "Ascenso completado", text: `Tu héroe subió a nivel ${res?.newLevel}.`, tone: UI.gold });
    window.setTimeout(() => setToast(null), 3200);
  }, [loadHistoryTab, loadMerchantContext, loadedTabs.historial, onCoinsChange, onProfilePatch, pushLedgerEvent]);

  const filteredItems = useMemo(() => {
    return items
      .filter((item) => {
        if (category !== "Todos" && item.cat !== category) return false;
        if (search.trim()) {
          const haystack = `${item.nombre} ${item.descripcion} ${item.cat}`.toLowerCase();
          if (!haystack.includes(search.trim().toLowerCase())) return false;
        }
        if (rarityFilter !== "all" && rarityMeta(item.rareza).key !== rarityFilter) return false;
        return true;
      })
      .sort((a, b) => {
        if (sortBy === "precio_asc") return a.precio - b.precio;
        if (sortBy === "precio_desc") return b.precio - a.precio;
        if (sortBy === "rareza") return rarityMeta(b.rareza).tier - rarityMeta(a.rareza).tier;
        return Number(Boolean(b.esNuevo || b.descuento)) - Number(Boolean(a.esNuevo || a.descuento));
      });
  }, [items, category, search, rarityFilter, sortBy]);

  const featuredItems = useMemo(() => {
    const source = items.filter((item) => item.esNuevo || item.descuento);
    return (source.length ? source : items).slice(0, 4);
  }, [items]);

  const merchantRecommendation = useMemo(() => {
    if (!items.length) return null;
    return [...items]
      .sort((a, b) => scoreShopItem({ item: b, classKey, coins, activeBoosts, inventory, streakShield, merchantContext }) - scoreShopItem({ item: a, classKey, coins, activeBoosts, inventory, streakShield, merchantContext }))
      [0] || null;
  }, [activeBoosts, classKey, coins, inventory, items, merchantContext, streakShield]);

  const marketHighlight = merchantRecommendation || featuredItems[0] || null;
  const selectedEntry = selected || (marketHighlight ? { kind: "item", data: marketHighlight } : null);

  const groupedInventory = useMemo(() => {
    const order = ["Poción", "Consumible", "Equipo", "Cosmético", "Especial"];
    const cats = [...new Set([...order.filter((catName) => inventory.some((item) => item.cat === catName)), ...inventory.map((item) => item.cat).filter((catName) => !order.includes(catName))])];
    return cats.map((catName) => ({
      cat: catName,
      meta: categoryMeta(catName),
      items: inventory.filter((item) => item.cat === catName).sort((a, b) => rarityMeta(b.rareza).tier - rarityMeta(a.rareza).tier),
    }));
  }, [inventory]);

  const totalInventory = inventory.reduce((sum, item) => sum + (item.cantidad || 1), 0);
  const usableInventory = inventory.filter((item) => item.consumible).reduce((sum, item) => sum + (item.cantidad || 1), 0);
  const pendingBoosts = activeBoosts.length + (streakShield ? 1 : 0);
  const marketLedger = useMemo(() => {
    const base = history.map((entry) => normalizeLedgerEntry(entry, items));
    return [...ledgerEvents, ...base].sort((a, b) => {
      const left = safeDate(a.occurredAt)?.getTime() || 0;
      const right = safeDate(b.occurredAt)?.getTime() || 0;
      return right - left;
    });
  }, [history, items, ledgerEvents]);
  const totalSpent = marketLedger.reduce((sum, entry) => sum + Number(entry.amount || 0), 0);
  const historyFilteredEntries = useMemo(() => marketLedger.filter((entry) => historyFilterMatcher(entry, historyFilter)), [historyFilter, marketLedger]);
  const visibleHistory = historyExpanded ? historyFilteredEntries : historyFilteredEntries.slice(0, 8);
  const inventoryCategories = useMemo(() => (
    groupedInventory.map((group) => ({
      key: group.cat,
      label: group.meta.label,
      color: group.meta.color,
      count: group.items.reduce((sum, item) => sum + (item.cantidad || 1), 0),
    }))
  ), [groupedInventory]);
  const inventoryPageSize = isMobile ? 4 : 6;
  const inventoryRecommendedIds = useMemo(() => {
    return new Set(
      inventory
        .filter((item) => scoreShopItem({ item, classKey, coins, activeBoosts, inventory, streakShield, merchantContext }) >= 18)
        .map((item) => item.id),
    );
  }, [activeBoosts, classKey, coins, inventory, merchantContext, streakShield]);
  const activeInventoryGroup = useMemo(() => {
    if (!groupedInventory.length) return null;
    return groupedInventory.find((group) => group.cat === inventoryCategory) || groupedInventory[0];
  }, [groupedInventory, inventoryCategory]);
  const filteredInventoryItems = useMemo(() => {
    if (!activeInventoryGroup) return [];
    return [...activeInventoryGroup.items]
      .filter((item) => {
        if (inventoryFilter === "usable") return Boolean(item.consumible);
        if (inventoryFilter === "expiring") {
          const remaining = itemRemainingSecs(item);
          return remaining !== null && remaining <= 6 * 60 * 60;
        }
        if (inventoryFilter === "recommended") return inventoryRecommendedIds.has(item.id);
        return true;
      })
      .sort((a, b) => {
        if (inventorySort === "qty") return Number(b.cantidad || 1) - Number(a.cantidad || 1);
        if (inventorySort === "rarity") return rarityMeta(b.rareza).tier - rarityMeta(a.rareza).tier;
        return scoreShopItem({ item: b, classKey, coins, activeBoosts, inventory, streakShield, merchantContext })
          - scoreShopItem({ item: a, classKey, coins, activeBoosts, inventory, streakShield, merchantContext });
      });
  }, [activeBoosts, activeInventoryGroup, classKey, coins, inventory, inventoryFilter, inventoryRecommendedIds, inventorySort, merchantContext, streakShield]);
  const inventoryPageCount = activeInventoryGroup
    ? Math.max(1, Math.ceil(filteredInventoryItems.length / inventoryPageSize))
    : 1;
  const visibleInventoryItems = useMemo(() => {
    if (!activeInventoryGroup) return [];
    const start = inventoryPage * inventoryPageSize;
    return filteredInventoryItems.slice(start, start + inventoryPageSize);
  }, [activeInventoryGroup, filteredInventoryItems, inventoryPage, inventoryPageSize]);

  const liveAvatarCatalog = avatarCatalog.length ? avatarCatalog : AVATARS_CATALOG;
  const liveFrameCatalog = frameCatalog.length ? frameCatalog : FRAMES_CATALOG;

  const cosmeticCollections = useMemo(() => ({
    skin: {
      items: skins,
      owned: ownedSkins.length,
      total: skins.length,
    },
    avatar: {
      items: liveAvatarCatalog,
      owned: ownedAvatars.length,
      total: liveAvatarCatalog.length,
    },
    frame: {
      items: liveFrameCatalog,
      owned: ownedFrames.length,
      total: liveFrameCatalog.length,
    },
    title: {
      items: titlesCatalog,
      owned: ownedTitles.length,
      total: titlesCatalog.length,
    },
  }), [liveAvatarCatalog, liveFrameCatalog, ownedAvatars.length, ownedFrames.length, ownedSkins.length, ownedTitles.length, skins, titlesCatalog]);

  const activeCosmeticCollection = cosmeticCollections[cosmeticTab] || cosmeticCollections.skin;
  const tabError = errorsByTab[tab] || "";
  const currentTabLoading = loadingByTab[tab];

  useEffect(() => {
    if (!groupedInventory.length) {
      if (inventoryCategory) setInventoryCategory("");
      if (inventoryPage !== 0) setInventoryPage(0);
      return;
    }
    const exists = groupedInventory.some((group) => group.cat === inventoryCategory);
    if (!exists) setInventoryCategory(groupedInventory[0].cat);
  }, [groupedInventory, inventoryCategory, inventoryPage]);

  useEffect(() => {
    setInventoryPage(0);
  }, [inventoryCategory]);

  useEffect(() => {
    if (inventoryPage > inventoryPageCount - 1) {
      setInventoryPage(Math.max(0, inventoryPageCount - 1));
    }
  }, [inventoryPage, inventoryPageCount]);

  useEffect(() => {
    if (!selected && marketHighlight) setSelected({ kind: "item", data: marketHighlight });
  }, [marketHighlight, selected]);

  useEffect(() => {
    if (tab === "mercado" && marketHighlight && selected?.kind !== "item") {
      setSelected({ kind: "item", data: marketHighlight });
    }
  }, [marketHighlight, selected?.kind, tab]);

  const handleBuyItem = useCallback(async (item, qty = 1, total = item.precio * qty) => {
    if (coins < total && !item.gratis) return false;
    setBuyingId(item.id);
    try {
      const user = auth.currentUser;
      if (!user) return false;
      const token = await user.getIdToken();
      const res = await buyObjeto(token, item.id, qty);
      if (!res?.ok) throw new Error(res?.message || "No pudimos cerrar la compra.");
      const newCoins = res.coins !== undefined ? res.coins : coins - total;
      setCoins(newCoins);
      onCoinsChange?.(newCoins);
      setInventory((current) => {
        const existing = current.find((entry) => entry.id === item.id);
        if (existing && item.stackeable) {
          return current.map((entry) => entry.id === item.id ? { ...entry, cantidad: (entry.cantidad || 0) + qty } : entry);
        }
        return [...current, { ...item, cantidad: qty }];
      });
      pushLedgerEvent({
        id: `item-${item.id}-${Date.now()}`,
        title: item.nombre,
        qty,
        amount: total,
        rarity: item.rareza,
        kind: itemKindFromCategory(item),
        source: "Mercado",
        itemId: item.id,
      });
      await Promise.allSettled([
        loadedTabs.inventario ? loadInventoryTab(true) : Promise.resolve(),
        loadedTabs.historial ? loadHistoryTab(true) : Promise.resolve(),
        loadMerchantContext(token, { force: true }),
      ]);
      window.dispatchEvent(new CustomEvent("shopStateChanged", {
        detail: {
          source: "tienda",
          type: "item_purchase",
          itemId: item.id,
          qty,
          coins: newCoins,
        },
      }));
      setToast({ title: "Compra realizada", text: `${item.nombre} ya quedó en tu inventario.`, tone: rarityMeta(item.rareza).color });
      window.setTimeout(() => setToast(null), 3200);
      return true;
    } catch (err) {
      setTabError("mercado", err.message || "No pudimos cerrar la compra.");
      return false;
    } finally {
      setBuyingId(null);
    }
  }, [coins, loadHistoryTab, loadInventoryTab, loadMerchantContext, loadedTabs.historial, loadedTabs.inventario, onCoinsChange, pushLedgerEvent, setTabError]);

  const handleUseItem = useCallback(async (item) => {
    if (usingId === item.id) return;
    setUsingId(item.id);
    try {
      const user = auth.currentUser;
      if (!user) return;
      const token = await user.getIdToken();
      const res = await useObjeto(token, item.id);
      if (!res?.ok) throw new Error(res?.message || "No pudimos usar esta pieza.");
      if (res.cantidad !== undefined) {
        setInventory((current) => {
          if (res.cantidad <= 0) return current.filter((entry) => entry.id !== item.id);
          return current.map((entry) => entry.id === item.id ? { ...entry, cantidad: res.cantidad } : entry);
        });
      }
      if (res.coins !== undefined) {
        setCoins(res.coins);
        onCoinsChange?.(res.coins);
      }
      if (res.profilePatch) {
        if (res.profilePatch.coins !== undefined) {
          setCoins(res.profilePatch.coins);
          onCoinsChange?.(res.profilePatch.coins);
        }
        setLiveProfile((current) => current ? { ...current, ...res.profilePatch } : current);
        onProfilePatch?.(res.profilePatch);
      }
      if (Array.isArray(res.activeBoosts)) {
        setActiveBoosts(res.activeBoosts);
      }
      if (res.streakShield !== undefined) {
        setStreakShield(res.streakShield);
      }
      await Promise.allSettled([
        loadedTabs.historial ? loadHistoryTab(true) : Promise.resolve(),
        loadMerchantContext(token, { force: true }),
      ]);
      setToast({ title: "Objeto usado", text: `${item.nombre} activó sus efectos correctamente.`, tone: UI.green });
      window.setTimeout(() => setToast(null), 3200);
      window.dispatchEvent(new CustomEvent("itemUsed", {
        detail: {
          source: "tienda",
          itemId: item.id,
          profilePatch: res.profilePatch || null,
          activeBoosts: res.activeBoosts || [],
          streakShield: res.streakShield || null,
          xpGanado: res.xpGanado || 0,
          leveledUp: Boolean(res.leveledUp),
          level: res.level || null,
          xpNext: res.xpNext || null,
        },
      }));
      if (res.xpGanado > 0 || res.leveledUp) {
        window.dispatchEvent(new CustomEvent("exerciseCompleted", {
          detail: {
            xp: res.xpGanado || 0,
            leveledUp: res.leveledUp || false,
            newLevel: res.level || null,
            xpNext: res.xpNext || null,
            coins: res.profilePatch?.coins,
            profilePatch: res.profilePatch || null,
            source: "tienda",
          },
        }));
      }
      if (res.leveledUp) {
        window.dispatchEvent(new CustomEvent("levelUp", {
          detail: {
            source: "tienda",
            leveledUp: true,
            newLevel: res.level || null,
            xpNext: res.xpNext || null,
            profilePatch: res.profilePatch || null,
          },
        }));
      }
    } catch (err) {
      setTabError("inventario", err.message || "No pudimos usar esta pieza.");
    } finally {
      setUsingId(null);
    }
  }, [loadHistoryTab, loadMerchantContext, loadedTabs.historial, onCoinsChange, onProfilePatch, setTabError, usingId]);

  const handleBuySkin = useCallback(async (skin) => {
    setBuyingId(skin.id || skin.nombre);
    try {
      const user = auth.currentUser;
      if (!user) return;
      const token = await user.getIdToken();
      const res = await purchaseSkin(token, skin.id);
      if (!res?.ok) throw new Error(res?.message || "No pudimos comprar esta skin.");
      setCoins(res.coins);
      onCoinsChange?.(res.coins);
      setOwnedSkins(res.ownedSkins || []);
      setLiveProfile((current) => current ? { ...current, coins: res.coins, ownedSkins: res.ownedSkins || current.ownedSkins } : current);
      onProfilePatch?.({
        coins: res.coins,
        ownedSkins: res.ownedSkins || [],
      });
      pushLedgerEvent({
        id: `skin-${skin.id || skin.nombre}-${Date.now()}`,
        title: skin.nombre || skin.name,
        qty: 1,
        amount: Number(skin.precio || 0),
        rarity: skin.rareza || "Épico",
        kind: "cosmetic",
        source: "Mercado visual",
        itemId: skin.id || skin.nombre,
      });
      await Promise.allSettled([
        loadedTabs.historial ? loadHistoryTab(true) : Promise.resolve(),
        loadMerchantContext(token, { force: true }),
      ]);
      window.dispatchEvent(new CustomEvent("shopStateChanged", {
        detail: { source: "tienda", type: "skin_purchase", itemId: skin.id, coins: res.coins },
      }));
      setToast({ title: "Skin adquirida", text: `${skin.nombre || skin.name} ya forma parte de tu colección.`, tone: UI.purple });
      window.setTimeout(() => setToast(null), 3200);
    } catch (err) {
      setTabError("cosmeticos", err.message || "No pudimos comprar esta skin.");
    } finally {
      setBuyingId(null);
    }
  }, [loadHistoryTab, loadMerchantContext, loadedTabs.historial, onCoinsChange, onProfilePatch, pushLedgerEvent, setTabError]);

  const handleBuyAvatarItem = useCallback(async (item) => {
    setBuyingId(item.id);
    try {
      const user = auth.currentUser;
      if (!user) return;
      const token = await user.getIdToken();
      const res = await purchaseAvatarItem(token, item.id);
      if (!res?.ok) throw new Error(res?.message || "No pudimos comprar esta pieza visual.");
      const newOwnedAvatars = res.ownedAvatars ?? ownedAvatars;
      const newOwnedFrames = res.ownedFrames ?? ownedFrames;
      setCoins(res.coins);
      onCoinsChange?.(res.coins);
      setOwnedAvatars(newOwnedAvatars);
      setOwnedFrames(newOwnedFrames);
      setLiveProfile((current) => current ? { ...current, coins: res.coins, ownedAvatars: newOwnedAvatars, ownedFrames: newOwnedFrames } : current);
      onProfilePatch?.({
        coins: res.coins,
        ownedAvatars: newOwnedAvatars,
        ownedFrames: newOwnedFrames,
      });
      window.dispatchEvent(new CustomEvent("avatarPurchased", {
        detail: { ownedAvatars: newOwnedAvatars, ownedFrames: newOwnedFrames, coins: res.coins },
      }));
      pushLedgerEvent({
        id: `visual-${item.id}-${Date.now()}`,
        title: item.nombre,
        qty: 1,
        amount: Number(item.precio || 0),
        rarity: item.rareza || "Raro",
        kind: "cosmetic",
        source: "Mercado visual",
        itemId: item.id,
      });
      await Promise.allSettled([
        loadedTabs.historial ? loadHistoryTab(true) : Promise.resolve(),
        loadMerchantContext(token, { force: true }),
      ]);
      setToast({ title: "Compra completada", text: `${item.nombre} quedó añadida al perfil del héroe.`, tone: rarityMeta(item.rareza).color });
      window.setTimeout(() => setToast(null), 3200);
    } catch (err) {
      setTabError("cosmeticos", err.message || "No pudimos comprar esta pieza visual.");
    } finally {
      setBuyingId(null);
    }
  }, [loadHistoryTab, loadMerchantContext, loadedTabs.historial, onCoinsChange, onProfilePatch, ownedAvatars, ownedFrames, pushLedgerEvent, setTabError]);

  const handleBuyTitleItem = useCallback(async (item) => {
    setBuyingId(item.id || item.nombre);
    try {
      const user = auth.currentUser;
      if (!user) return;
      const token = await user.getIdToken();
      const res = await buyTitle(token, item.nombre);
      if (!res?.ok) throw new Error(res?.message || "No pudimos comprar este título.");
      const nextOwnedTitles = Array.isArray(res.ownedTitles) ? res.ownedTitles : ownedTitles;
      setCoins(res.coins);
      onCoinsChange?.(res.coins);
      setOwnedTitles(nextOwnedTitles);
      setLiveProfile((current) => current ? { ...current, coins: res.coins, ownedTitles: nextOwnedTitles } : current);
      onProfilePatch?.({
        coins: res.coins,
        ownedTitles: nextOwnedTitles,
      });
      pushLedgerEvent({
        id: `title-${item.id || item.nombre}-${Date.now()}`,
        title: item.nombre,
        qty: 1,
        amount: Number(item.precio || 0),
        rarity: item.rareza || "Raro",
        kind: "cosmetic",
        source: "Colección de títulos",
        itemId: item.id || item.nombre,
      });
      await Promise.allSettled([
        loadedTabs.historial ? loadHistoryTab(true) : Promise.resolve(),
        loadMerchantContext(token, { force: true }),
      ]);
      setToast({ title: "Título añadido", text: `${item.nombre} ya forma parte de tu colección del héroe.`, tone: rarityMeta(item.rareza).color });
      window.setTimeout(() => setToast(null), 3200);
    } catch (err) {
      setTabError("cosmeticos", err.message || "No pudimos comprar este título.");
    } finally {
      setBuyingId(null);
    }
  }, [loadHistoryTab, loadMerchantContext, loadedTabs.historial, onCoinsChange, onProfilePatch, ownedTitles, pushLedgerEvent, setTabError]);

  const handleEquipTitleItem = useCallback(async (item) => {
    setBuyingId(item.id || item.nombre);
    try {
      const user = auth.currentUser;
      if (!user) return;
      const token = await user.getIdToken();
      const res = await equipTitle(token, item?.nombre || "");
      if (!res?.ok) throw new Error(res?.message || "No pudimos equipar este título.");
      const nextTitle = res.titulo || "";
      setActiveTitle(nextTitle);
      setLiveProfile((current) => current ? { ...current, titulo: nextTitle } : current);
      onProfilePatch?.({ titulo: nextTitle });
      setToast({ title: nextTitle ? "Título activo" : "Título retirado", text: nextTitle ? `${nextTitle} ya encabeza tu perfil.` : "Tu ficha quedó sin título equipado.", tone: UI.gold });
      window.setTimeout(() => setToast(null), 3200);
    } catch (err) {
      setTabError("cosmeticos", err.message || "No pudimos equipar este título.");
    } finally {
      setBuyingId(null);
    }
  }, [onProfilePatch, setTabError]);

  const handleEquipCosmetic = useCallback(async (item, type) => {
    const user = auth.currentUser;
    if (!user) return;
    const targetId = item?.id || item?.nombre;
    setBuyingId(targetId);
    try {
      const token = await user.getIdToken();
      if (type === "skin") {
        const res = await setActiveSkin(token, item.id);
        if (!res?.ok) throw new Error(res?.message || "No pudimos equipar esta skin.");
        setActiveSkinId(res.activeSkin || item.id);
        setLiveProfile((current) => current ? { ...current, activeSkin: res.activeSkin || item.id } : current);
        onProfilePatch?.({ activeSkin: res.activeSkin || item.id });
        window.dispatchEvent(new CustomEvent("skinChanged", {
          detail: { activeSkin: res.activeSkin || item.id },
        }));
      } else if (type === "avatar") {
        const res = await setActiveAvatar(token, item.id);
        if (!res?.ok) throw new Error(res?.message || "No pudimos equipar este avatar.");
        setActiveAvatarId(res.activeAvatar || item.id);
        setLiveProfile((current) => current ? { ...current, activeAvatar: res.activeAvatar || item.id } : current);
        onProfilePatch?.({ activeAvatar: res.activeAvatar || item.id });
        window.dispatchEvent(new CustomEvent("avatarEquipped", {
          detail: { activeAvatar: res.activeAvatar || item.id },
        }));
      } else if (type === "frame") {
        const nextFrameId = activeFrameId === item.id ? null : item.id;
        const res = await setActiveFrame(token, nextFrameId);
        if (!res?.ok) throw new Error(res?.message || "No pudimos ajustar este marco.");
        setActiveFrameId(res.activeFrame ?? nextFrameId);
        setLiveProfile((current) => current ? { ...current, activeFrame: res.activeFrame ?? nextFrameId } : current);
        onProfilePatch?.({ activeFrame: res.activeFrame ?? nextFrameId });
        window.dispatchEvent(new CustomEvent("avatarEquipped", {
          detail: { activeFrame: res.activeFrame ?? nextFrameId },
        }));
      }
      setToast({
        title: type === "frame" && activeFrameId === item.id ? "Marco retirado" : "Cosmético activo",
        text: type === "skin"
          ? `${item.nombre} ya marca la presencia visual del héroe.`
          : type === "avatar"
            ? `${item.nombre} quedó como retrato principal del perfil.`
            : type === "frame"
              ? activeFrameId === item.id
                ? "El retrato volvió a quedar sin marco equipado."
                : `${item.nombre} ahora rodea tu retrato principal.`
              : "La pieza visual quedó aplicada.",
        tone: rarityMeta(item.rareza).color,
      });
      window.setTimeout(() => setToast(null), 3200);
    } catch (err) {
      setTabError("cosmeticos", err.message || "No pudimos aplicar este cosmético.");
    } finally {
      setBuyingId(null);
    }
  }, [activeFrameId, onProfilePatch, setTabError]);

  const detailItem = selectedEntry?.kind === "item" ? selectedEntry.data : null;
  const detailRarity = rarityMeta(selectedEntry?.data?.rareza || "Común");
  const detailOwned = selectedEntry?.kind === "item"
    ? inventory.some((entry) => entry.id === selectedEntry.data.id || entry.objectId === selectedEntry.data.id)
    : selectedEntry?.kind === "skin"
      ? ownedSkins.includes(selectedEntry.data.id || selectedEntry.data.nombre)
      : selectedEntry?.kind === "avatar"
        ? ownedAvatars.includes(selectedEntry.data.id)
        : selectedEntry?.kind === "frame"
          ? ownedFrames.includes(selectedEntry.data.id)
          : selectedEntry?.kind === "title"
            ? ownedTitles.includes(selectedEntry.data.nombre)
          : false;
  const detailProjectedCoins = selectedEntry?.kind === "item"
    ? Math.max(0, coins - Number(selectedEntry.data.precio || 0))
    : selectedEntry?.data?.precio
      ? Math.max(0, coins - Number(selectedEntry.data.precio || 0))
      : coins;
  const detailSimilarity = detailItem ? inventorySimilarityCount(inventory, detailItem) : 0;

  return (
    <>
      <style>{CSS}</style>

      <AnimatePresence>
        {purchaseTarget && (
          <PurchaseModal
            item={purchaseTarget}
            coins={coins}
            loading={buyingId === purchaseTarget.id}
            onClose={() => setPurchaseTarget(null)}
            onConfirm={async (qty, total) => {
              const ok = await handleBuyItem(purchaseTarget, qty, total);
              if (ok) setPurchaseTarget(null);
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {toast && (
          <motion.div
            className="uts-toast"
            initial={{ opacity: 0, x: 80 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 80 }}
            transition={{ type: "spring", stiffness: 320, damping: 28 }}
          >
            <strong style={{ color: toast.tone }}>{toast.title}</strong>
            <p style={{ margin: 0, font: '500 14px/1.45 "Manrope", sans-serif', color: UI.muted }}>{toast.text}</p>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {cosmeticPreview && (
          <CosmeticPreviewModal
            entry={cosmeticPreview}
            classKey={classKey}
            owned={
              cosmeticPreview.type === "skin"
                ? ownedSkins.includes(cosmeticPreview.data.id || cosmeticPreview.data.nombre)
                : cosmeticPreview.type === "avatar"
                  ? ownedAvatars.includes(cosmeticPreview.data.id)
                  : cosmeticPreview.type === "frame"
                    ? ownedFrames.includes(cosmeticPreview.data.id)
                    : ownedTitles.includes(cosmeticPreview.data.nombre)
            }
            equipped={
              cosmeticPreview.type === "title"
                ? activeTitle === cosmeticPreview.data.nombre
                : cosmeticPreview.type === "skin"
                  ? activeSkinId === cosmeticPreview.data.id
                  : cosmeticPreview.type === "avatar"
                    ? activeAvatarId === cosmeticPreview.data.id
                    : cosmeticPreview.type === "frame"
                      ? activeFrameId === cosmeticPreview.data.id
                      : false
            }
            buying={buyingId === (cosmeticPreview.data.id || cosmeticPreview.data.nombre)}
            onClose={() => setCosmeticPreview(null)}
            onBuy={(item, type) => {
              if (type === "skin") handleBuySkin(item);
              else if (type === "title") handleBuyTitleItem(item);
              else handleBuyAvatarItem(item);
            }}
            onEquip={(item, type) => {
              if (type === "title") handleEquipTitleItem(item);
              else handleEquipCosmetic(item, type);
            }}
          />
        )}
      </AnimatePresence>

      <div
        className="uts-page"
        style={{
          "--shop-accent": classTheme.accent,
          "--shop-secondary": classTheme.secondary || classTheme.accent,
          "--shop-scene": `url(${scene})`,
        }}
      >
        <div className="uts-shell">
          <section className="uts-panel uts-hero">
            <div className="uts-hero-copy">
              <div className="uts-kicker">
                <img src="/ui/header/section-tienda.png" alt="" />
                <span>Mercado del gremio</span>
              </div>

              <div>
                <h1>{copy.title}</h1>
                <p>{copy.lead}</p>
              </div>

              <div className="uts-chip-row">
                <span className="uts-chip is-focus">
                  <img src={SHOP_STATUS_ASSETS.buy} alt="" />
                  Clase {classTheme.label}
                </span>
                <span className="uts-chip">
                  <img src={SHOP_STATUS_ASSETS.coins} alt="" />
                  {coins.toLocaleString()} monedas disponibles
                </span>
                <span className="uts-chip">
                  <img src={SHOP_STATUS_ASSETS.boost} alt="" />
                  {pendingBoosts > 0 ? `${pendingBoosts} efectos activos` : "Sin boosts activos"}
                </span>
                <span className="uts-chip">
                  <img src={SHOP_STATUS_ASSETS.note} alt="" />
                  {copy.note}
                </span>
              </div>

              <div className="uts-hero-stats">
                <div className="uts-stat-card">
                  <small>Botín en tienda</small>
                  <strong style={{ color: classTheme.accent }}>{loadedTabs.mercado ? items.length : "..."}</strong>
                  <p>Contratos visibles en la rotación del mercado.</p>
                </div>
                <div className="uts-stat-card">
                  <small>Inventario activo</small>
                  <strong style={{ color: UI.blue }}>{loadedTabs.inventario ? totalInventory : "..."}</strong>
                  <p>Reserva total entre consumibles, equipo y botín especial.</p>
                </div>
                <div className="uts-stat-card">
                  <small>Consumibles listos</small>
                  <strong style={{ color: UI.green }}>{loadedTabs.inventario ? usableInventory : "..."}</strong>
                  <p>Piezas que puedes activar sin salir de esta sala.</p>
                </div>
                <div className="uts-stat-card">
                  <small>Monedas invertidas</small>
                  <strong style={{ color: UI.gold }}>{loadedTabs.historial || ledgerEvents.length ? totalSpent.toLocaleString() : "..."}</strong>
                  <p>Lectura total del gasto real del héroe en el mercado.</p>
                </div>
              </div>
            </div>

            <div className="uts-stage">
              <div className="uts-stage-inner">
                <div className="uts-stage-crest">
                  <img src="/ui/header/section-tienda.png" alt="" />
                </div>

                <div />

                {marketHighlight ? (
                  <div className="uts-stage-card">
                    <div className="uts-feature-head">
                      <div className="uts-feature-art" style={{ "--art-glow": rarityMeta(marketHighlight.rareza).glow }}>
                        <SmartItemArt item={marketHighlight} />
                      </div>
                      <div className="uts-feature-copy">
                        <small style={{ color: UI.mutedDeep, font: '700 11px/1 "Manrope", sans-serif', letterSpacing: '.1em', textTransform: 'uppercase' }}>
                          Recomendación del mercader
                        </small>
                        <strong style={{ color: rarityMeta(marketHighlight.rareza).color }}>{marketHighlight.nombre}</strong>
                        <p>{marketHighlight.descripcion}</p>
                      </div>
                    </div>
                    <div className="uts-tag-row">
                      <span className="uts-mini-tag" style={{ color: UI.gold, borderColor: `${UI.gold}44` }}>
                        <span className="uts-price-dot" />
                        {marketHighlight.gratis ? "Gratis" : `${marketHighlight.precio.toLocaleString()} monedas`}
                      </span>
                      <span className="uts-mini-tag">{classAffinityText(classKey, marketHighlight)}</span>
                    </div>
                    <button
                      type="button"
                      className="uts-primary-btn"
                      onClick={() => {
                        setSelected({ kind: "item", data: marketHighlight });
                        setPurchaseTarget(marketHighlight);
                      }}
                    >
                      <img src={SHOP_STATUS_ASSETS.buy} alt="" />
                      Abrir contrato
                    </button>
                  </div>
                ) : null}
              </div>
            </div>
          </section>

          <section className="uts-band">
            <div className="uts-panel uts-band-card">
              <small>Mercado hoy</small>
              <strong style={{ color: classTheme.accent }}>
                {featuredItems.length > 0 ? `${featuredItems.length} piezas marcan la rotación principal` : "La sala sigue ordenando el stock"}
              </strong>
              <p>
                Recompensas, equipo y consumibles ahora se leen como una sala real de comercio, con menos ruido
                y mejor foco en lo que sí importa comprar.
              </p>
              <div className="uts-progress">
                <span style={{ width: `${Math.min(100, Math.round((Math.min(items.length, 12) / 12) * 100))}%` }} />
              </div>
            </div>

            <div className="uts-panel">
              <QuickLevelCard coins={coins} profile={liveProfile} onSuccess={handleLevelSuccess} highlighted={serviceSpotlight} />
            </div>

            <div className="uts-panel uts-band-card">
              <small>Efectos del héroe</small>
              <strong style={{ color: pendingBoosts > 0 ? UI.gold : UI.muted }}>{pendingBoosts}</strong>
              <p>
                Los boosts activos, la protección de racha y la lectura del mercado quedan a mano sin volver la tienda una pared eterna.
              </p>
              <div className="uts-tag-row">
                <span className="uts-mini-tag"><img src={SHOP_STATUS_ASSETS.streak} alt="" />{streakShield ? "Racha protegida" : "Sin protector"}</span>
                <span className="uts-mini-tag"><img src={SHOP_STATUS_ASSETS.sync} alt="" />Actualización automática</span>
              </div>
            </div>
          </section>

          <div className="uts-content">
            <section className="uts-panel uts-market">
              <div className="uts-panel-head">
                <div>
                  <div className="uts-kicker">
                    <img src="/ui/header/notifications/notif-shop.png" alt="" />
                    <span>{tab === "mercado" ? "Mercado abierto" : tab === "inventario" ? "Inventario del héroe" : tab === "cosmeticos" ? "Colección visual" : "Historial del gremio"}</span>
                  </div>
                  <h2>
                    {tab === "mercado"
                      ? "Mercado del día"
                      : tab === "inventario"
                        ? "Reserva del héroe"
                        : tab === "cosmeticos"
                          ? "Cosméticos y perfil"
                          : "Bitácora de compras"}
                  </h2>
                  <p>
                    {tab === "mercado"
                      ? "Filtra, compara y entra a cada contrato sin que la sala se vuelva un scroll infinito."
                        : tab === "inventario"
                          ? "Las piezas que ya compraste quedan agrupadas y listas para usar."
                        : tab === "cosmeticos"
                          ? "Skins, avatares, marcos y títulos ahora viven dentro del mismo mercado, pero mejor seccionados."
                          : "Tus compras quedan guardadas con lectura compacta y sin ruido visual."}
                  </p>
                </div>

                <div className="uts-tab-row">
                  {[
                    { id: "mercado", label: "Mercado" },
                    { id: "inventario", label: "Inventario" },
                    { id: "cosmeticos", label: "Cosméticos" },
                    { id: "historial", label: "Historial" },
                  ].map((entry) => (
                    <button
                      key={entry.id}
                      type="button"
                      className="uts-tab"
                      onClick={() => setTab(entry.id)}
                      style={tab === entry.id ? {
                        color: classTheme.accent,
                        borderColor: `${classTheme.accent}55`,
                        background: `${classTheme.accent}18`,
                      } : undefined}
                    >
                      {entry.label}
                    </button>
                  ))}
                </div>
              </div>

              {tabError ? (
                <div className="uts-detail-box">
                  <small>Estado del tablero</small>
                  <p style={{ margin: 0, color: UI.red }}>{tabError}</p>
                </div>
              ) : null}

              {tab === "mercado" && (
                <>
                  <div className="uts-toolbar">
                    <div className="uts-search">
                      <Search size={16} color={UI.muted} />
                      <input
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        placeholder="Buscar botín, poción, equipo o cofre..."
                      />
                    </div>
                    <label className="uts-select">
                      <span style={{ color: UI.muted }}>Rareza</span>
                      <select value={rarityFilter} onChange={(event) => setRarityFilter(event.target.value)}>
                        <option value="all">Todas</option>
                        <option value="common">Común</option>
                        <option value="uncommon">Poco común</option>
                        <option value="rare">Raro</option>
                        <option value="epic">Épico</option>
                        <option value="legendary">Legendario</option>
                        <option value="mythic">Mítico</option>
                      </select>
                    </label>
                    <label className="uts-select">
                      <span style={{ color: UI.muted }}>Orden</span>
                      <select value={sortBy} onChange={(event) => setSortBy(event.target.value)}>
                        <option value="nuevo">Destacados</option>
                        <option value="rareza">Rareza</option>
                        <option value="precio_asc">Precio ↑</option>
                        <option value="precio_desc">Precio ↓</option>
                      </select>
                    </label>
                    <div className="uts-select">
                      <span style={{ color: UI.gold }}><span className="uts-price-dot" /></span>
                      <span>{coins.toLocaleString()} monedas</span>
                    </div>
                  </div>

                  <div className="uts-category-row">
                    {Object.keys(CATEGORY_META).map((name) => {
                      const meta = categoryMeta(name);
                      const count = name === "Todos" ? items.length : items.filter((item) => item.cat === name).length;
                      const isActive = category === name;
                      return (
                        <button
                          key={name}
                          type="button"
                          className={`uts-filter-btn${isActive ? " is-active" : ""}`}
                          style={{ "--cat-color": meta.color, minHeight: 32, padding: "5px 12px", fontSize: 12 }}
                          onClick={() => setCategory(name)}
                        >
                          <span style={{ width: 7, height: 7, borderRadius: "50%", background: isActive ? meta.color : "rgba(255,255,255,.22)", display: "inline-block", flexShrink: 0 }} />
                          {meta.label}
                          {count > 0 && <span style={{ color: isActive ? meta.color : UI.mutedDeep, fontSize: 10, fontWeight: 700 }}>{count}</span>}
                        </button>
                      );
                    })}
                  </div>

                  {currentTabLoading ? (
                    <div className="uts-grid">
                      {[...Array(6)].map((_, index) => (
                        <div key={index} className="uts-card" style={{ opacity: .36 }} />
                      ))}
                    </div>
                  ) : filteredItems.length === 0 ? (
                    <div className="uts-empty">
                      <img src={SHOP_ASSETS.noResults} alt="" style={{ width: 72, height: 72, objectFit: "contain", opacity: .9 }} />
                      <strong>No encontramos piezas para este filtro</strong>
                      <p>Prueba otra rareza, cambia la categoría o limpia la búsqueda para leer mejor el mercado.</p>
                    </div>
                  ) : (
                    <div className="uts-grid">
                      {filteredItems.map((item) => (
                        <StoreCard
                          key={item.id}
                          item={item}
                          owned={inventory.some((entry) => entry.id === item.id || entry.objectId === item.id)}
                          wishlisted={wishlist.has(item.id)}
                          selected={selectedEntry?.kind === "item" && selectedEntry?.data?.id === item.id}
                          onSelect={() => setSelected({ kind: "item", data: item })}
                          onToggleWishlist={toggleWishlist}
                          onOpenBuy={setPurchaseTarget}
                        />
                      ))}
                    </div>
                  )}
                </>
              )}

              {tab === "inventario" && (
                currentTabLoading ? (
                  <div className="uts-grid">
                    {[...Array(4)].map((_, index) => (
                      <div key={index} className="uts-inline-card" style={{ minHeight: 96, opacity: .34 }} />
                    ))}
                  </div>
                ) : groupedInventory.length === 0 ? (
                  <div className="uts-empty">
                    <img src={SHOP_ASSETS.empty} alt="" style={{ width: 72, height: 72, objectFit: "contain", opacity: .92 }} />
                    <strong>La reserva del héroe sigue vacía</strong>
                    <p>Compra unas cuantas piezas en el mercado y esta sala empezará a verse viva de verdad.</p>
                  </div>
                ) : (
                  <div className="uts-inventory-shell">
                    <div className="uts-subtabs">
                      {inventoryCategories.map((group) => (
                        <button
                          key={group.key}
                          type="button"
                          className={`uts-subtab${activeInventoryGroup?.cat === group.key ? " is-active" : ""}`}
                          style={{ "--subtab-color": group.color }}
                          onClick={() => setInventoryCategory(group.key)}
                        >
                          <img src={inventoryTabIcon(group.key)} alt="" />
                          <span>{group.label}</span>
                          <span className="uts-subtab-count">{group.count}</span>
                        </button>
                      ))}
                    </div>

                    {activeInventoryGroup && (
                      <div className="uts-inventory-stage" style={{ "--inventory-color": activeInventoryGroup.meta.color }}>
                        <div className="uts-inventory-head">
                          <div className="uts-inventory-copy">
                            <strong style={{ color: activeInventoryGroup.meta.color }}>{activeInventoryGroup.meta.label}</strong>
                            <p>
                              Baúl activo con {filteredInventoryItems.length} registros útiles y {activeInventoryGroup.items.reduce((sum, item) => sum + (item.cantidad || 1), 0)} piezas listas.
                            </p>
                          </div>
                          <div className="uts-group-actions">
                            <span className="uts-mini-tag">{inventoryPage + 1} / {inventoryPageCount} páginas</span>
                            <span className="uts-mini-tag" style={{ color: activeInventoryGroup.meta.color, borderColor: `${activeInventoryGroup.meta.color}44` }}>
                              {activeInventoryGroup.items.reduce((sum, item) => sum + (item.cantidad || 1), 0)} piezas
                            </span>
                          </div>
                        </div>

                        <div className="uts-inline-toolbar">
                          <label className="uts-select" style={{ minWidth: 180 }}>
                            <span style={{ color: UI.muted }}>Filtro</span>
                            <select value={inventoryFilter} onChange={(event) => setInventoryFilter(event.target.value)}>
                              {Object.entries(INVENTORY_FILTER_META).map(([key, label]) => (
                                <option key={key} value={key}>{label}</option>
                              ))}
                            </select>
                          </label>
                          <label className="uts-select" style={{ minWidth: 180 }}>
                            <span style={{ color: UI.muted }}>Orden</span>
                            <select value={inventorySort} onChange={(event) => setInventorySort(event.target.value)}>
                              {Object.entries(INVENTORY_SORT_META).map(([key, label]) => (
                                <option key={key} value={key}>{label}</option>
                              ))}
                            </select>
                          </label>
                          <button type="button" className="uts-group-toggle" onClick={() => setInventoryDetailOpen((current) => !current)}>
                            {inventoryDetailOpen ? "Ocultar ficha" : "Mostrar ficha"}
                          </button>
                        </div>

                        {inventoryDetailOpen && detailItem && (
                          <div className="uts-detail-box">
                            <small>Ficha rápida del baúl</small>
                            <div className="uts-tag-row">
                              <span className="uts-rarity" style={{ color: detailRarity.color, borderColor: `${detailRarity.color}55` }}>{detailRarity.label}</span>
                              <span className="uts-mini-tag">{classAffinityText(classKey, detailItem)}</span>
                              <span className="uts-mini-tag" style={{ color: UI.blue, borderColor: `${UI.blue}44` }}>{itemSourceLabel(detailItem)}</span>
                            </div>
                            <p style={{ margin: 0, color: UI.muted }}>{detailItem.descripcion || itemHint(detailItem)}</p>
                          </div>
                        )}

                        <div className="uts-inventory-group">
                          {visibleInventoryItems.map((item) => (
                            <InventoryRow
                              key={item.id}
                              item={item}
                              using={usingId === item.id}
                              recommended={inventoryRecommendedIds.has(item.id)}
                              onSelect={() => setSelected({ kind: "item", data: item })}
                              onUse={handleUseItem}
                            />
                          ))}
                        </div>

                        {inventoryPageCount > 1 && (
                          <div className="uts-pager">
                            <span className="uts-pager-meta">
                              Mostrando {visibleInventoryItems.length} de {filteredInventoryItems.length} registros.
                            </span>
                            <div className="uts-pager-actions">
                              <button
                                type="button"
                                className="uts-pager-btn"
                                disabled={inventoryPage === 0}
                                onClick={() => setInventoryPage((current) => Math.max(0, current - 1))}
                              >
                                Anterior
                              </button>
                              <button
                                type="button"
                                className="uts-pager-btn"
                                disabled={inventoryPage >= inventoryPageCount - 1}
                                onClick={() => setInventoryPage((current) => Math.min(inventoryPageCount - 1, current + 1))}
                              >
                                Siguiente
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              )}

              {tab === "cosmeticos" && (
                currentTabLoading ? (
                  <div className="uts-grid">
                    {[...Array(4)].map((_, index) => (
                      <div key={index} className="uts-card" style={{ opacity: .34 }} />
                    ))}
                  </div>
                ) : (
                  <div className="uts-effect-list">
                    <div className="uts-collection-hero">
                      <div className="uts-subtabs">
                        {Object.entries(COSMETIC_TAB_META).map(([key, meta]) => (
                          <button
                            key={key}
                            type="button"
                            className={`uts-subtab${cosmeticTab === key ? " is-active" : ""}`}
                            style={{ "--subtab-color": classTheme.accent }}
                            onClick={() => setCosmeticTab(key)}
                          >
                            <img src={meta.icon} alt="" />
                            <span>{meta.label}</span>
                            <span className="uts-subtab-count">{cosmeticCollections[key].owned}/{cosmeticCollections[key].total}</span>
                          </button>
                        ))}
                      </div>

                      <div className="uts-collection-preview">
                        <img src={COSMETIC_TAB_META[cosmeticTab].icon} alt="" />
                        <div className="uts-inventory-copy">
                          <strong style={{ color: classTheme.accent }}>{COSMETIC_TAB_META[cosmeticTab].label}</strong>
                          <p>
                            Colección activa con {activeCosmeticCollection.owned} piezas obtenidas de {activeCosmeticCollection.total}. Aquí ya quedó el espacio limpio para tus artes finales y sets por clase.
                          </p>
                          <div className="uts-tag-row">
                            <span className="uts-mini-tag" style={{ color: UI.gold, borderColor: `${UI.gold}44` }}>
                            <img src={SHOP_ASSETS.icons.cosmetic} alt="" />
                              Rareza dominante: {cosmeticTab === "frame" ? "Épica" : cosmeticTab === "avatar" ? "Rara" : cosmeticTab === "title" ? "Coleccionable" : "Variable"}
                            </span>
                            <span className="uts-mini-tag">{classTheme.label}: {classAffinityText(classKey, { cat: cosmeticTab === "skin" ? "Cosmético" : "Especial", efectos: [] })}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="uts-grid">
                      {activeCosmeticCollection.items.map((entry) => {
                        const owned = cosmeticTab === "skin"
                          ? ownedSkins.includes(entry.id || entry.nombre)
                          : cosmeticTab === "avatar"
                            ? ownedAvatars.includes(entry.id)
                            : cosmeticTab === "frame"
                              ? ownedFrames.includes(entry.id)
                              : ownedTitles.includes(entry.nombre);
                        const equipped = cosmeticTab === "title"
                          ? activeTitle === entry.nombre
                          : cosmeticTab === "skin"
                            ? activeSkinId === entry.id
                            : cosmeticTab === "avatar"
                              ? activeAvatarId === entry.id
                              : cosmeticTab === "frame"
                                ? activeFrameId === entry.id
                                : false;
                        const buying = buyingId === (entry.id || entry.nombre);
                        return (
                          <CosmeticCard
                            key={entry.id || entry.nombre}
                            item={entry}
                            type={cosmeticTab}
                            owned={owned}
                            buying={buying}
                            equipped={equipped}
                            onSelect={() => {
                              setSelected({ kind: cosmeticTab, data: entry });
                              setCosmeticPreview({ type: cosmeticTab, data: entry });
                            }}
                            onBuy={cosmeticTab === "skin" ? handleBuySkin : cosmeticTab === "title" ? handleBuyTitleItem : handleBuyAvatarItem}
                            onEquip={cosmeticTab === "title" ? handleEquipTitleItem : handleEquipCosmetic}
                          />
                        );
                      })}
                    </div>
                  </div>
                )
              )}

              {tab === "historial" && (
                currentTabLoading ? (
                  <div className="uts-grid">
                    {[...Array(4)].map((_, index) => (
                      <div key={index} className="uts-history-row" style={{ minHeight: 92, opacity: .34 }} />
                    ))}
                  </div>
                ) : marketLedger.length === 0 ? (
                  <div className="uts-empty">
                    <img src={SHOP_ASSETS.empty} alt="" style={{ width: 72, height: 72, objectFit: "contain", opacity: .92 }} />
                    <strong>La bitácora todavía no guarda compras</strong>
                    <p>En cuanto cierres los primeros contratos del mercado, el libro mayor del gremio se ordena aquí.</p>
                  </div>
                ) : (
                  <>
                    <div className="uts-history-summary">
                      <div className="uts-band-card">
                        <small>Hoy</small>
                        <strong style={{ color: classTheme.accent }}>{marketLedger.filter((entry) => historyFilterMatcher(entry, "today")).length}</strong>
                        <p>Movimientos cerrados en esta jornada.</p>
                      </div>
                      <div className="uts-band-card">
                        <small>Semana</small>
                        <strong style={{ color: UI.blue }}>{marketLedger.filter((entry) => historyFilterMatcher(entry, "week")).length}</strong>
                        <p>Contratos y servicios recientes del mercado.</p>
                      </div>
                      <div className="uts-band-card">
                        <small>Cosméticos</small>
                        <strong style={{ color: UI.purple }}>{marketLedger.filter((entry) => entry.kind === "cosmetic").length}</strong>
                        <p>Piezas visuales añadidas al perfil.</p>
                      </div>
                      <div className="uts-band-card">
                        <small>Servicios</small>
                        <strong style={{ color: UI.gold }}>{marketLedger.filter((entry) => entry.kind === "service").length}</strong>
                        <p>Ascensos y operaciones de la mesa del gremio.</p>
                      </div>
                    </div>

                    <div className="uts-subtabs">
                      {Object.entries(HISTORY_FILTER_META).map(([key, meta]) => (
                        <button
                          key={key}
                          type="button"
                          className={`uts-subtab${historyFilter === key ? " is-active" : ""}`}
                          style={{ "--subtab-color": classTheme.accent }}
                          onClick={() => setHistoryFilter(key)}
                        >
                          <span>{meta.label}</span>
                          <span className="uts-subtab-count">{marketLedger.filter((entry) => historyFilterMatcher(entry, key)).length}</span>
                        </button>
                      ))}
                    </div>

                    <div className="uts-history-list">
                      {visibleHistory.map((entry, index) => (
                        <HistoryRow
                          key={entry.id || index}
                          entry={entry}
                          onSelect={() => {
                            const item = items.find((current) => normalizeLoose(current.nombre) === normalizeLoose(entry.itemName || entry.title));
                            if (item) setSelected({ kind: "item", data: item });
                          }}
                        />
                      ))}
                    </div>
                    {historyFilteredEntries.length > 8 && (
                      <button
                        type="button"
                        className="uts-group-toggle"
                        onClick={() => setHistoryExpanded((current) => !current)}
                        style={{ justifySelf: "start" }}
                      >
                        {historyExpanded ? "Ver menos" : `Ver ${historyFilteredEntries.length - 8} movimientos más`}
                      </button>
                    )}
                    {historyHasMore && (
                      <button
                        type="button"
                        className="uts-group-toggle"
                        disabled={historyLoadingMore}
                        onClick={() => loadHistoryTab(false, { append: true })}
                        style={{ justifySelf: "start" }}
                      >
                        {historyLoadingMore ? "Cargando anteriores..." : "Cargar compras anteriores"}
                      </button>
                    )}
                  </>
                )
              )}
            </section>

            {(tab === "mercado" || tab === "historial") && (
              <aside className="uts-panel uts-right">
                {tab === "mercado" ? (
                  selectedEntry ? (
                    <>
                      <div className="uts-detail-art">
                        <SmartItemArt item={selectedEntry.data} size="44%" />
                      </div>

                      <div className="uts-detail-copy">
                        <div className="uts-tag-row">
                          <span className="uts-kicker">
                            <img src={SHOP_ASSETS.icons.contract} alt="" />
                            <span>Ficha del contrato</span>
                          </span>
                        </div>
                        <h2 style={{ color: detailRarity.color }}>{selectedEntry.data.nombre || selectedEntry.data.name}</h2>
                        <p>{selectedEntry.data.descripcion || selectedEntry.data.desc || itemHint(selectedEntry.data)}</p>
                      </div>

                      <div className="uts-detail-box">
                        <small>Rareza, tipo y estado</small>
                        <div className="uts-tag-row">
                          <span className="uts-rarity" style={{ color: detailRarity.color, borderColor: `${detailRarity.color}55` }}>
                            <img src={detailRarity.asset} alt="" />
                            {detailRarity.label}
                          </span>
                          <span className="uts-mini-tag"><img src={categoryMeta(selectedEntry.data.cat).icon} alt="" />{categoryMeta(selectedEntry.data.cat).label}</span>
                          {detailOwned ? <span className="uts-mini-tag" style={{ color: UI.green, borderColor: `${UI.green}44` }}><img src={SHOP_STATUS_ASSETS.owned} alt="" />Obtenido</span> : null}
                        </div>
                      </div>

                      <div className="uts-mini-grid">
                        <div className="uts-mini-stat">
                          <small>Saldo proyectado</small>
                          <strong style={{ color: UI.gold }}>{detailProjectedCoins.toLocaleString()}</strong>
                        </div>
                        <div className="uts-mini-stat">
                          <small>Afinidad</small>
                          <strong style={{ color: classTheme.accent }}>{classTheme.label}</strong>
                        </div>
                        <div className="uts-mini-stat">
                          <small>Similares</small>
                          <strong style={{ color: UI.blue }}>{detailSimilarity}</strong>
                        </div>
                        <div className="uts-mini-stat">
                          <small>Origen</small>
                          <strong style={{ color: UI.green }}>{itemSourceLabel(selectedEntry.data)}</strong>
                        </div>
                      </div>

                      {selectedEntry.data.efectos?.length > 0 && (
                        <div className="uts-detail-box">
                          <small>Efectos del botín</small>
                          <div className="uts-effect-list">
                            {selectedEntry.data.efectos.map((effect, index) => (
                              <div key={`${effect.tipo}-${index}`} className="uts-effect-row">
                                <span style={{ color: detailRarity.color, fontFamily: "'Manrope',sans-serif", fontWeight: 800 }}>
                                  {effectLabel(effect)}
                                </span>
                                <span style={{ color: UI.gold, fontFamily: "'Manrope',sans-serif", fontSize: 13 }}>
                                  {effect.valor ? `+${effect.valor}` : "Activo"}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="uts-detail-box">
                        <small>Lectura del mercader</small>
                        <p style={{ margin: 0, color: UI.muted }}>{itemHint(selectedEntry.data)}</p>
                        <p style={{ margin: 0, color: classTheme.accent }}>{classAffinityText(classKey, selectedEntry.data)}</p>
                      </div>

                      <div className="uts-purchase-box">
                        <small>Acción principal</small>
                        <div className="uts-price">
                          <span className="uts-price-dot" />
                          {selectedEntry.data.gratis ? "Gratis" : selectedEntry.data.precio.toLocaleString()}
                        </div>
                        <div className="uts-tag-row">
                          <button
                            type="button"
                            className="uts-mini-tag"
                            style={{
                              cursor: "pointer",
                              color: selectedEntry.data?.id && wishlist.has(selectedEntry.data.id) ? UI.red : UI.muted,
                              borderColor: selectedEntry.data?.id && wishlist.has(selectedEntry.data.id) ? `${UI.red}55` : undefined,
                              background: selectedEntry.data?.id && wishlist.has(selectedEntry.data.id) ? `${UI.red}14` : undefined,
                            }}
                            onClick={() => toggleWishlist(selectedEntry.data?.id)}
                          >
                            <Heart size={14} fill={selectedEntry.data?.id && wishlist.has(selectedEntry.data.id) ? "currentColor" : "none"} />
                            {selectedEntry.data?.id && wishlist.has(selectedEntry.data.id) ? "En favoritos" : "Guardar en favoritos"}
                          </button>
                        </div>
                        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                          <button
                            type="button"
                            className="uts-primary-btn"
                            disabled={buyingId === selectedEntry.data.id || (!selectedEntry.data.gratis && coins < selectedEntry.data.precio)}
                            onClick={() => setPurchaseTarget(selectedEntry.data)}
                          >
                            <img src={SHOP_STATUS_ASSETS.buy} alt="" />
                            {detailOwned && !selectedEntry.data.stackeable ? "Ya obtenido" : "Comprar"}
                          </button>
                          {detailOwned && selectedEntry.data.consumible && (
                            <button
                              type="button"
                              className="uts-secondary-btn"
                              disabled={usingId === selectedEntry.data.id}
                              onClick={() => handleUseItem(selectedEntry.data)}
                            >
                              {usingId === selectedEntry.data.id ? "..." : "Usar ahora"}
                            </button>
                          )}
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="uts-empty">
                      <img src={SHOP_ASSETS.syncing} alt="" style={{ width: 64, height: 64, objectFit: "contain", opacity: .86 }} />
                      <strong>Selecciona una pieza del mercado</strong>
                      <p>La ficha lateral te deja precio, rareza, afinidad y compra sin abrir otra sala.</p>
                    </div>
                  )
                ) : (
                  <div className="uts-effect-list">
                    <div className="uts-detail-box">
                      <small>Libro mayor del gremio</small>
                      <p style={{ margin: 0, color: UI.muted }}>La bitácora ya reúne compras comunes, cosméticos y servicios del gremio bajo una sola lectura.</p>
                    </div>
                    <div className="uts-mini-grid">
                      <div className="uts-mini-stat">
                        <small>Total invertido</small>
                        <strong style={{ color: UI.gold }}>{totalSpent.toLocaleString()}</strong>
                      </div>
                      <div className="uts-mini-stat">
                        <small>Último foco</small>
                        <strong style={{ color: classTheme.accent }}>{historyFilter === "all" ? "General" : HISTORY_FILTER_META[historyFilter].label}</strong>
                      </div>
                    </div>
                  </div>
                )}

                {!isMobile && (
                  <div className="uts-detail-box">
                    <small>Boosts y protección</small>
                    <BoostPanel boosts={activeBoosts} streakShield={streakShield} onExpire={() => loadInventoryTab(true)} />
                  </div>
                )}
              </aside>
            )}
          </div>
        </div>
      </div>
    </>
  );
}




