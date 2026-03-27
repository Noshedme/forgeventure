// src/pages/user/UserTienda.jsx
// ─────────────────────────────────────────────────────────────
//  Tienda de objetos del jugador.
//  Categorías: Poción | Equipo | Cosmético | Consumible | Especial
//  Props: profile (objeto del usuario)
//  Conectar: getObjetos(), comprarObjeto(), getInventario()
// ─────────────────────────────────────────────────────────────
import { useState, useEffect } from "react";
import {
  ShoppingBag, ShoppingCart, X, Check, Star, Zap,
  Plus, Minus, ChevronRight, Search, Package,
  Gift, Sparkles, Lock, Info, Coins, Wallet,
  RotateCcw, Clock, Hash, AlertTriangle,
} from "lucide-react";

const C = {
  bg:"#050C18", side:"#080F1C", card:"#0C1826", panel:"#091220",
  navy:"#1A3354", navyL:"#1E3A5F",
  orange:"#E85D04", orangeL:"#FF9F1C", gold:"#FFD700",
  blue:"#4CC9F0", teal:"#0A9396", green:"#2ecc71",
  red:"#E74C3C", purple:"#9B59B6", pink:"#FF69B4",
  white:"#F0F4FF", muted:"#5A7A9A", mutedL:"#7A9AB8",
};

const CSS = `
  @keyframes ut-fadeIn  { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
  @keyframes ut-cardIn  { from{opacity:0;transform:scale(.97)} to{opacity:1;transform:scale(1)} }
  @keyframes ut-spin    { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
  @keyframes ut-pulse   { 0%,100%{opacity:1} 50%{opacity:.3} }
  @keyframes ut-modalIn { from{opacity:0;transform:scale(.93) translateY(14px)} to{opacity:1;transform:scale(1) translateY(0)} }
  @keyframes ut-float   { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-7px)} }
  @keyframes ut-shine   { 0%{left:-100%} 100%{left:200%} }
  @keyframes ut-glow    { 0%,100%{box-shadow:0 0 10px var(--gc)} 50%{box-shadow:0 0 28px var(--gc),0 0 50px var(--gc)} }
  @keyframes ut-coin    { 0%{opacity:0;transform:translateY(0) scale(.5)} 50%{opacity:1;transform:translateY(-50px) scale(1.2)} 100%{opacity:0;transform:translateY(-100px) scale(.8)} }
  @keyframes ut-buy     { 0%{transform:scale(0) rotate(-20deg);opacity:0} 60%{transform:scale(1.15) rotate(4deg)} 100%{transform:scale(1) rotate(0);opacity:1} }
  @keyframes ut-shake   { 0%,100%{transform:translateX(0)} 20%,60%{transform:translateX(-6px)} 40%,80%{transform:translateX(6px)} }
  @keyframes ut-barFill { from{width:0} to{width:var(--bw)} }
  @keyframes ut-newTag  { 0%{transform:scale(0) rotate(-15deg);opacity:0} 80%{transform:scale(1.15) rotate(3deg)} 100%{transform:scale(1) rotate(0);opacity:1} }
  @keyframes ut-ring    { 0%{transform:scale(1);opacity:.7} 100%{transform:scale(2.4);opacity:0} }

  .ut-card  { transition:all .22s; cursor:pointer; }
  .ut-card:hover { transform:translateY(-4px) !important; box-shadow:0 16px 44px rgba(0,0,0,.5) !important; }
  .ut-card:hover .ut-card-shine { animation:ut-shine .6s ease; }
  .ut-card-shine { position:absolute;top:0;left:-100%;width:50%;height:100%;background:linear-gradient(90deg,transparent,rgba(255,255,255,.07),transparent);pointer-events:none; }
  .ut-btn   { transition:all .2s; cursor:pointer; }
  .ut-btn:hover:not(:disabled) { transform:translateY(-2px); }
  .ut-tab   { transition:all .2s; cursor:pointer; }
  .ut-filter-btn { transition:all .18s; cursor:pointer; }
  .ut-inv-item  { transition:all .18s; cursor:pointer; }
  .ut-inv-item:hover { background:${C.navyL}22 !important; }
  .ut-input { transition:border-color .2s; outline:none; }
  .ut-input:focus { border-color:${C.orange} !important; box-shadow:0 0 0 2px ${C.orange}22; }
  .ut-input::placeholder { color:${C.navy}; }
`;

const px  = (s) => ({ fontFamily:"'Press Start 2P'", fontSize:s });
const raj = (s,w=600) => ({ fontFamily:"'Rajdhani',sans-serif", fontSize:s, fontWeight:w });
const orb = (s,w=700) => ({ fontFamily:"'Orbitron',sans-serif", fontSize:s, fontWeight:w });

// ── Categorías ─────────────────────────────────────────────────
const CATS = {
  Todos:      { color:C.orange, icon:"🌟" },
  Poción:     { color:"#FF69B4", icon:"🧪" },
  Equipo:     { color:C.orange,  icon:"⚔️" },
  Cosmético:  { color:C.purple,  icon:"👑" },
  Consumible: { color:C.teal,    icon:"⚡" },
  Especial:   { color:C.red,     icon:"💎" },
};

// ── Rareza ─────────────────────────────────────────────────────
const RAREZA = {
  "Común":      { color:C.muted,  tier:1 },
  "Poco común": { color:C.green,  tier:2 },
  "Raro":       { color:C.blue,   tier:3 },
  "Épico":      { color:C.purple, tier:4 },
  "Legendario": { color:C.gold,   tier:5 },
  "Mítico":     { color:"#FF2D55",tier:6 },
};

// ── Catálogo mock ──────────────────────────────────────────────
const CATALOGO = [
  { id:"it1",  nombre:"Poción XP Mayor",      cat:"Poción",    rareza:"Raro",       imagen:"🧪", precio:500,  gratis:false, stock:null, desc:"Aumenta el XP ganado un 50% durante 1 hora.",   efectos:[{icon:"⚡",txt:"+50% XP · 60min"}], stackeable:true,  duracion:60,  limitado:false, esNuevo:true  },
  { id:"it2",  nombre:"Escudo Anti-Racha",    cat:"Consumible",rareza:"Poco común", imagen:"🛡️", precio:300,  gratis:false, stock:null, desc:"Protege tu racha durante 3 días sin actividad.", efectos:[{icon:"🔥",txt:"Racha segura 3d"}],  stackeable:true,  duracion:null,limitado:false, esNuevo:false },
  { id:"it3",  nombre:"Espada del Guerrero",  cat:"Equipo",    rareza:"Épico",      imagen:"⚔️", precio:2000, gratis:false, stock:null, desc:"Multiplica el XP de fuerza por 1.5x.",          efectos:[{icon:"✨",txt:"×1.5 XP Fuerza"}],  stackeable:false, duracion:null,limitado:false, esNuevo:false },
  { id:"it4",  nombre:"Corona del Campeón",   cat:"Cosmético", rareza:"Legendario", imagen:"👑", precio:5000, gratis:false, stock:50,   desc:"Accesorio cosmético para héroes legendarios.",  efectos:[{icon:"👗",txt:"Skin exclusivo"}],   stackeable:false, duracion:null,limitado:true,  esNuevo:false },
  { id:"it5",  nombre:"XP Instantáneo 1000",  cat:"Consumible",rareza:"Raro",       imagen:"💫", precio:1500, gratis:false, stock:null, desc:"Otorga 1000 XP al instante.",                   efectos:[{icon:"⚡",txt:"+1000 XP"}],         stackeable:true,  duracion:null,limitado:false, esNuevo:true  },
  { id:"it6",  nombre:"Elixir de Velocidad",  cat:"Consumible",rareza:"Raro",       imagen:"⚡", precio:800,  gratis:false, stock:null, desc:"Reduce cooldown entre sesiones un 50% (24h).",  efectos:[{icon:"⏱",txt:"-50% cooldown 24h"}], stackeable:false, duracion:1440,limitado:false, esNuevo:false },
  { id:"it7",  nombre:"Poción HP Total",      cat:"Poción",    rareza:"Poco común", imagen:"❤️", precio:200,  gratis:false, stock:null, desc:"Restaura el HP del héroe al 100%.",             efectos:[{icon:"❤️",txt:"HP 100%"}],          stackeable:true,  duracion:null,limitado:false, esNuevo:false },
  { id:"it8",  nombre:"Título: Llama Eterna", cat:"Especial",  rareza:"Legendario", imagen:"🔥", precio:0,    gratis:true,  stock:null, desc:"Título obtenido con racha de 30+ días.",        efectos:[{icon:"👑",txt:"Título especial"}],  stackeable:false, duracion:null,limitado:false, esNuevo:false, requiereLogro:true },
  { id:"it9",  nombre:"Armadura Primavera",   cat:"Equipo",    rareza:"Épico",      imagen:"🌸", precio:0,    gratis:true,  stock:200,  desc:"Evento de primavera — edición limitada.",       efectos:[{icon:"⚡",txt:"+25% XP"}],          stackeable:false, duracion:null,limitado:true,  esNuevo:true  },
  { id:"it10", nombre:"Clase: Modo Oscuro",   cat:"Especial",  rareza:"Mítico",     imagen:"🌙", precio:0,    gratis:true,  stock:5,    desc:"Desbloquea la clase secreta Modo Oscuro.",      efectos:[{icon:"🎭",txt:"Clase especial"}],  stackeable:false, duracion:null,limitado:true,  esNuevo:false, requiereLogro:true },
  { id:"it11", nombre:"Orbe del Nivel",       cat:"Especial",  rareza:"Épico",      imagen:"🔮", precio:3000, gratis:false, stock:10,   desc:"Sube instantáneamente 1 nivel al héroe.",       efectos:[{icon:"⬆️",txt:"+1 Nivel"}],         stackeable:true,  duracion:null,limitado:true,  esNuevo:false },
  { id:"it12", nombre:"Multiplicador ×2",     cat:"Consumible",rareza:"Épico",      imagen:"✨", precio:2500, gratis:false, stock:null, desc:"Duplica todo el XP ganado durante 2 horas.",    efectos:[{icon:"✨",txt:"×2 XP · 2h"}],       stackeable:false, duracion:120, limitado:false, esNuevo:true  },
];

// ── Inventario mock ────────────────────────────────────────────
const INV_INIT = [
  { id:"it7",  nombre:"Poción HP Total",    imagen:"❤️", cantidad:3, cat:"Poción",    rareza:"Poco común", precio:200  },
  { id:"it2",  nombre:"Escudo Anti-Racha",  imagen:"🛡️", cantidad:1, cat:"Consumible",rareza:"Poco común", precio:300  },
  { id:"it1",  nombre:"Poción XP Mayor",    imagen:"🧪", cantidad:2, cat:"Poción",    rareza:"Raro",       precio:500  },
];

// ── Historial mock ─────────────────────────────────────────────
const HIST_INIT = [
  { id:"h1", item:"Poción HP Total",   imagen:"❤️", cantidad:1, precio:200, fecha:"2025-03-16" },
  { id:"h2", item:"Escudo Anti-Racha", imagen:"🛡️", cantidad:1, precio:300, fecha:"2025-03-14" },
];

// ── Helpers ────────────────────────────────────────────────────
function RarezaBadge({rareza, small=false}) {
  const r = RAREZA[rareza]||{color:C.muted,tier:1};
  const stars = "★".repeat(r.tier);
  return (
    <span style={{...raj(small?9:10,700),color:r.color,background:`${r.color}14`,
      border:`1px solid ${r.color}33`,padding:small?"1px 5px":"2px 8px",
      whiteSpace:"nowrap",textShadow:r.tier>=4?`0 0 6px ${r.color}`:"none"}}>
      {stars} {rareza}
    </span>
  );
}
function ItemIcon({item, size=52}) {
  const r = RAREZA[item.rareza]||{color:C.muted,tier:1};
  return (
    <div style={{width:size,height:size,background:`${r.color}18`,
      border:`2px solid ${r.color}${item.rareza==="Legendario"||item.rareza==="Mítico"?"66":"33"}`,
      display:"flex",alignItems:"center",justifyContent:"center",
      fontSize:size*.48,flexShrink:0,
      boxShadow:r.tier>=4?`0 0 16px ${r.color}33,inset 0 0 12px ${r.color}14`:"none",
      animation:r.tier>=4?"ut-float 3s ease-in-out infinite":"none"}}>
      {item.imagen}
    </div>
  );
}

// ── Coin anim ─────────────────────────────────────────────────
function CoinNotif({amount, onDone}) {
  useEffect(()=>{const t=setTimeout(onDone,2000);return()=>clearTimeout(t);},[]);
  return (
    <div style={{position:"fixed",top:"50%",left:"50%",transform:"translate(-50%,-50%)",
      zIndex:500,pointerEvents:"none",...orb(28,900),color:C.gold,
      textShadow:`0 0 24px ${C.gold}`,animation:"ut-coin 2s ease forwards"}}>
      −{amount} 💰
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// MODAL — Detalle / Compra de item
// ══════════════════════════════════════════════════════════════
function ItemModal({item, coins, onClose, onBuy}) {
  const r   = RAREZA[item.rareza]||{color:C.muted,tier:1};
  const c   = r.color;
  const cat = CATS[item.cat]||{};
  const [qty, setQty]     = useState(1);
  const [fase, setFase]   = useState("detail"); // detail | confirm | success | noCoins
  const [loading, setLoading] = useState(false);

  const total    = item.precio * qty;
  const canAfford = coins >= total;
  const canBuy    = !item.gratis && !item.requiereLogro && item.cat !== "Especial";

  const handleBuy = async () => {
    if(!canAfford){ setFase("noCoins"); return; }
    setFase("confirm");
  };
  const handleConfirm = async () => {
    setLoading(true);
    await new Promise(r=>setTimeout(r,800));
    setLoading(false);
    onBuy(item, qty, total);
    setFase("success");
  };

  return (
    <div style={{position:"fixed",inset:0,zIndex:300,background:"rgba(0,0,0,.82)",
      display:"flex",alignItems:"center",justifyContent:"center",padding:16}}
      onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div style={{width:"100%",maxWidth:520,background:C.card,
        border:`2px solid ${c}44`,
        boxShadow:`0 0 60px ${c}18,0 24px 60px rgba(0,0,0,.6)`,
        animation:"ut-modalIn .25s ease both",overflow:"hidden"}}>
        <div style={{height:4,background:`linear-gradient(90deg,transparent,${c},transparent)`}}/>

        {/* ── DETALLE ── */}
        {fase==="detail"&&(
          <>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",
              padding:"18px 22px",borderBottom:`1px solid ${C.navy}`}}>
              <div style={{display:"flex",alignItems:"center",gap:14}}>
                <ItemIcon item={item} size={56}/>
                <div>
                  <div style={{...orb(14,900),color:C.white,marginBottom:6}}>{item.nombre}</div>
                  <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                    <span style={{...raj(10,700),color:cat.color||C.orange,background:`${cat.color||C.orange}14`,border:`1px solid ${cat.color||C.orange}33`,padding:"2px 8px"}}>{cat.icon} {item.cat}</span>
                    <RarezaBadge rareza={item.rareza}/>
                    {item.esNuevo&&<span style={{...raj(9,700),color:C.green,background:`${C.green}14`,border:`1px solid ${C.green}33`,padding:"2px 8px",animation:"ut-newTag .5s ease both"}}>✦ NUEVO</span>}
                    {item.limitado&&<span style={{...raj(9,700),color:C.red,background:`${C.red}14`,border:`1px solid ${C.red}33`,padding:"2px 8px"}}>🔒 LIMITADO</span>}
                  </div>
                </div>
              </div>
              <button onClick={onClose} className="ut-btn" style={{background:"transparent",border:`1px solid ${C.navy}`,padding:7,color:C.muted,display:"flex"}}><X size={15}/></button>
            </div>
            <div style={{padding:22,display:"flex",flexDirection:"column",gap:16}}>
              {/* stats */}
              <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10}}>
                {[
                  {l:"PRECIO",   v:item.gratis?"GRATIS":`${item.precio.toLocaleString()} 💰`, c:item.gratis?C.green:C.gold},
                  {l:"STACK",    v:item.stackeable?"Sí":"No",  c:item.stackeable?C.teal:C.muted},
                  {l:"STOCK",    v:item.stock?item.stock.toLocaleString():"∞", c:item.limitado?C.red:C.muted},
                ].map((s,i)=>(
                  <div key={i} style={{background:C.panel,border:`1px solid ${s.c}22`,padding:"12px 10px",textAlign:"center"}}>
                    <div style={{...orb(13,900),color:s.c,marginBottom:3}}>{s.v}</div>
                    <div style={{...px(5),color:C.muted}}>{s.l}</div>
                  </div>
                ))}
              </div>
              {/* desc */}
              <div style={{background:C.panel,border:`1px solid ${C.navy}`,padding:"14px 16px"}}>
                <p style={{...raj(13,400),color:C.white,lineHeight:1.7,marginBottom:10}}>{item.desc}</p>
                {item.duracion&&<div style={{...raj(11,600),color:C.muted}}>⏱ Duración: <span style={{color:C.blue}}>{item.duracion>=60?`${item.duracion/60}h`:`${item.duracion}min`}</span></div>}
              </div>
              {/* efectos */}
              <div>
                <div style={{...px(6),color:C.muted,marginBottom:10,letterSpacing:".05em"}}>✨ EFECTOS</div>
                <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                  {item.efectos.map((ef,i)=>(
                    <div key={i} style={{background:`${c}0A`,border:`1px solid ${c}33`,padding:"8px 14px",display:"flex",alignItems:"center",gap:8}}>
                      <span style={{fontSize:18}}>{ef.icon}</span>
                      <span style={{...raj(12,700),color:c}}>{ef.txt}</span>
                    </div>
                  ))}
                </div>
              </div>
              {/* compra */}
              {item.gratis||item.requiereLogro?(
                <div style={{display:"flex",alignItems:"center",gap:12,background:`${C.muted}0A`,border:`1px solid ${C.muted}33`,padding:"14px 16px"}}>
                  <Info size={16} color={C.muted}/>
                  <span style={{...raj(12,400),color:C.mutedL,lineHeight:1.5}}>
                    {item.requiereLogro?"Este ítem se obtiene completando un logro específico.":"Este ítem es gratuito y se obtiene mediante misiones o logros."}
                  </span>
                </div>
              ):(
                <>
                  {item.stackeable&&(
                    <div style={{display:"flex",alignItems:"center",gap:14}}>
                      <span style={{...raj(13,600),color:C.muted}}>Cantidad:</span>
                      <div style={{display:"flex",alignItems:"center",gap:8,background:C.panel,border:`1px solid ${C.navy}`,padding:"4px"}}>
                        <button onClick={()=>setQty(q=>Math.max(1,q-1))} className="ut-btn"
                          style={{width:32,height:32,background:"transparent",border:"none",color:C.muted,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontSize:20}}>−</button>
                        <span style={{...orb(16,900),color:C.white,minWidth:32,textAlign:"center"}}>{qty}</span>
                        <button onClick={()=>setQty(q=>q+1)} className="ut-btn"
                          style={{width:32,height:32,background:"transparent",border:"none",color:C.muted,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontSize:20}}>+</button>
                      </div>
                      <div style={{...raj(12,700),color:C.gold,marginLeft:"auto"}}>
                        Total: {total.toLocaleString()} 💰
                      </div>
                    </div>
                  )}
                  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"8px 0"}}>
                    <div style={{...raj(12,600),color:C.muted}}>Tu saldo: <span style={{color:canAfford?C.gold:C.red}}>{coins.toLocaleString()} 💰</span></div>
                    {!canAfford&&<span style={{...raj(11,700),color:C.red}}>⚠ Monedas insuficientes</span>}
                  </div>
                  <button onClick={handleBuy} disabled={!canAfford} className="ut-btn"
                    style={{width:"100%",...px(9),color:!canAfford?C.muted:C.bg,
                      background:!canAfford?`${C.orange}33`:C.orange,
                      border:"none",padding:"15px",cursor:canAfford?"pointer":"not-allowed",
                      display:"flex",alignItems:"center",justifyContent:"center",gap:10,
                      boxShadow:canAfford?`0 6px 28px ${C.orange}55`:"none"}}>
                    <ShoppingCart size={14}/> COMPRAR {item.stackeable&&qty>1?`(${qty})`:""}
                  </button>
                </>
              )}
            </div>
          </>
        )}

        {/* ── CONFIRM ── */}
        {fase==="confirm"&&(
          <div style={{padding:"32px 28px",textAlign:"center"}}>
            <div style={{fontSize:52,marginBottom:16,animation:"ut-float 2s ease-in-out infinite"}}>{item.imagen}</div>
            <div style={{...orb(14,900),color:C.white,marginBottom:8}}>¿Confirmar compra?</div>
            <div style={{...raj(13,500),color:C.muted,marginBottom:20,lineHeight:1.5}}>
              {qty>1?`${qty}× `:""}"{item.nombre}" por <span style={{color:C.gold}}>{total.toLocaleString()} 💰</span>
            </div>
            <div style={{background:`${C.gold}0A`,border:`1px solid ${C.gold}33`,padding:"12px 16px",marginBottom:24}}>
              <div style={{display:"flex",justifyContent:"space-between",...raj(13,600),color:C.muted}}>
                <span>Saldo actual</span><span style={{color:C.gold}}>{coins.toLocaleString()} 💰</span>
              </div>
              <div style={{display:"flex",justifyContent:"space-between",...raj(13,600),color:C.muted,marginTop:6}}>
                <span>Costo</span><span style={{color:C.red}}>−{total.toLocaleString()} 💰</span>
              </div>
              <div style={{height:1,background:C.navy,margin:"10px 0"}}/>
              <div style={{display:"flex",justifyContent:"space-between",...raj(14,700),color:C.gold}}>
                <span>Saldo restante</span><span>{(coins-total).toLocaleString()} 💰</span>
              </div>
            </div>
            <div style={{display:"flex",gap:10}}>
              <button onClick={()=>setFase("detail")} className="ut-btn"
                style={{flex:"0 0 auto",...raj(13,600),color:C.muted,background:C.panel,border:`1px solid ${C.navy}`,padding:"12px 20px",cursor:"pointer"}}>
                CANCELAR
              </button>
              <button onClick={handleConfirm} disabled={loading} className="ut-btn"
                style={{flex:1,...px(8),color:loading?C.muted:C.bg,background:loading?`${C.gold}44`:C.gold,
                  border:"none",padding:"12px",cursor:loading?"not-allowed":"pointer",
                  boxShadow:`0 4px 20px ${C.gold}44`,display:"flex",alignItems:"center",justifyContent:"center",gap:10}}>
                {loading?<><div style={{width:13,height:13,border:`2px solid ${C.muted}`,borderTop:`2px solid ${C.gold}`,borderRadius:"50%",animation:"ut-spin .8s linear infinite"}}/> COMPRANDO...</>:<><Check size={14}/> CONFIRMAR</>}
              </button>
            </div>
          </div>
        )}

        {/* ── SUCCESS ── */}
        {fase==="success"&&(
          <div style={{padding:"36px 28px",textAlign:"center"}}>
            <div style={{fontSize:64,marginBottom:16,animation:"ut-buy .7s ease both",filter:`drop-shadow(0 0 20px ${c})`}}>{item.imagen}</div>
            <div style={{...orb(16,900),color:C.white,marginBottom:6}}>¡COMPRA EXITOSA!</div>
            <div style={{...raj(13,500),color:C.muted,marginBottom:20}}>{item.nombre} añadido a tu inventario.</div>
            <div style={{background:`${c}0A`,border:`1px solid ${c}33`,padding:"16px",marginBottom:24}}>
              {item.efectos.map((ef,i)=>(
                <div key={i} style={{display:"flex",alignItems:"center",gap:10,...raj(13,700),color:c,marginBottom:i<item.efectos.length-1?8:0}}>
                  <span style={{fontSize:20}}>{ef.icon}</span>{ef.txt}
                </div>
              ))}
            </div>
            <button onClick={onClose} className="ut-btn"
              style={{width:"100%",...px(8),color:C.bg,background:c,border:"none",
                padding:"14px",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:10,
                boxShadow:`0 4px 20px ${c}55`}}>
              <Check size={14}/> ¡GENIAL!
            </button>
          </div>
        )}

        {/* ── NO COINS ── */}
        {fase==="noCoins"&&(
          <div style={{padding:"32px 28px",textAlign:"center"}}>
            <div style={{fontSize:52,marginBottom:16}}>💸</div>
            <div style={{...orb(14,900),color:C.red,marginBottom:8}}>MONEDAS INSUFICIENTES</div>
            <div style={{...raj(13,500),color:C.muted,marginBottom:20,lineHeight:1.5}}>
              Necesitas <span style={{color:C.gold}}>{total.toLocaleString()} 💰</span> pero solo tienes <span style={{color:C.red}}>{coins.toLocaleString()} 💰</span>.
            </div>
            <div style={{background:`${C.gold}0A`,border:`1px solid ${C.gold}33`,padding:"14px",marginBottom:24,...raj(12,400),color:C.mutedL,lineHeight:1.6}}>
              💡 Gana monedas completando misiones, manteniendo tu racha y obteniendo logros.
            </div>
            <button onClick={()=>setFase("detail")} className="ut-btn"
              style={{width:"100%",...raj(13,600),color:C.muted,background:C.panel,border:`1px solid ${C.navy}`,padding:"12px",cursor:"pointer"}}>
              VOLVER
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// MAIN
// ══════════════════════════════════════════════════════════════
export default function UserTienda({profile}) {
  const [cat,       setCat]      = useState("Todos");
  const [search,    setSearch]   = useState("");
  const [filterRar, setFilterRar]= useState("all");
  const [sortBy,    setSortBy]   = useState("nuevo");
  const [tab,       setTab]      = useState("tienda"); // tienda|inventario|historial
  const [itemModal, setItemModal]= useState(null);
  const [coinAnim,  setCoinAnim] = useState(null);

  const [coins,     setCoins]    = useState(profile?.coins ?? 420);
  const [inventario,setInventario]= useState(INV_INIT);
  const [historial, setHistorial] = useState(HIST_INIT);

  const clsColor = {GUERRERO:C.orange,ARQUERO:C.blue,MAGO:C.purple};
  const myColor  = clsColor[profile?.heroClass]||C.orange;

  const handleBuy = (item, qty, total) => {
    setCoins(c=>c-total);
    setCoinAnim(total);
    setInventario(prev=>{
      const ex=prev.find(i=>i.id===item.id);
      if(ex&&item.stackeable) return prev.map(i=>i.id===item.id?{...i,cantidad:i.cantidad+qty}:i);
      return [...prev,{id:item.id,nombre:item.nombre,imagen:item.imagen,cantidad:qty,cat:item.cat,rareza:item.rareza,precio:item.precio}];
    });
    setHistorial(prev=>[
      {id:`h${Date.now()}`,item:item.nombre,imagen:item.imagen,cantidad:qty,precio:total,fecha:new Date().toISOString().slice(0,10)},
      ...prev,
    ]);
  };

  const filtrado = CATALOGO.filter(it=>{
    if(cat!=="Todos"&&it.cat!==cat) return false;
    if(search&&!it.nombre.toLowerCase().includes(search.toLowerCase())) return false;
    if(filterRar!=="all"&&it.rareza!==filterRar) return false;
    return true;
  }).sort((a,b)=>{
    if(sortBy==="precio_asc") return a.precio-b.precio;
    if(sortBy==="precio_desc") return b.precio-a.precio;
    if(sortBy==="rareza") return (RAREZA[b.rareza]?.tier||0)-(RAREZA[a.rareza]?.tier||0);
    // nuevo
    return (b.esNuevo?1:0)-(a.esNuevo?1:0);
  });

  const fBtn=(on,c=C.orange)=>({...raj(11,on?700:600),color:on?c:C.muted,
    background:on?`${c}18`:"transparent",border:`1px solid ${on?c:C.navy}`,
    padding:"5px 11px",cursor:"pointer",transition:"all .18s"});

  return (
    <>
      <style>{CSS}</style>

      {itemModal&&<ItemModal item={itemModal} coins={coins} onClose={()=>setItemModal(null)} onBuy={handleBuy}/>}
      {coinAnim&&<CoinNotif amount={coinAnim} onDone={()=>setCoinAnim(null)}/>}

      <div style={{display:"flex",flexDirection:"column",gap:18}}>

        {/* ── Wallet Banner ── */}
        <div style={{background:C.card,border:`1px solid ${myColor}33`,
          padding:"20px 24px",position:"relative",overflow:"hidden",
          animation:"ut-cardIn .4s ease both"}}>
          <div style={{position:"absolute",top:0,left:0,right:0,height:2,
            background:`linear-gradient(90deg,transparent,${myColor},transparent)`}}/>
          <div style={{position:"absolute",top:-50,right:-50,width:200,height:200,
            borderRadius:"50%",background:C.gold,filter:"blur(80px)",opacity:.04,pointerEvents:"none"}}/>
          <div style={{display:"flex",alignItems:"center",gap:20,flexWrap:"wrap"}}>
            <div style={{fontSize:36,filter:`drop-shadow(0 0 12px ${C.gold})`}}>💰</div>
            <div>
              <div style={{...orb(13,700),color:C.white,marginBottom:3}}>TIENDA DE OBJETOS</div>
              <div style={{...raj(12,500),color:C.muted}}>Gasta tus monedas en potenciadores y cosméticos</div>
            </div>
            <div style={{marginLeft:"auto",textAlign:"right"}}>
              <div style={{...orb(28,900),color:C.gold,textShadow:`0 0 14px ${C.gold}`}}>
                {coins.toLocaleString()}
              </div>
              <div style={{...raj(12,600),color:C.muted}}>monedas disponibles</div>
            </div>
          </div>
        </div>

        {/* ── Pestañas Tienda / Inventario / Historial ── */}
        <div style={{display:"flex",background:C.card,border:`1px solid ${C.navy}`,overflow:"hidden"}}>
          {[
            {id:"tienda",     icon:<ShoppingBag size={14}/>,  label:"Tienda",     count:CATALOGO.length},
            {id:"inventario", icon:<Package size={14}/>,      label:"Inventario", count:inventario.reduce((s,i)=>s+i.cantidad,0)},
            {id:"historial",  icon:<RotateCcw size={14}/>,    label:"Historial",  count:historial.length},
          ].map(t=>{
            const on=tab===t.id;
            return (
              <button key={t.id} onClick={()=>setTab(t.id)} className="ut-tab"
                style={{flex:1,padding:"13px",background:on?`${myColor}12`:"transparent",
                  border:"none",borderBottom:`3px solid ${on?myColor:"transparent"}`,
                  color:on?myColor:C.muted,cursor:"pointer",display:"flex",alignItems:"center",
                  justifyContent:"center",gap:8,...raj(13,on?700:500)}}>
                {t.icon} {t.label}
                <span style={{...raj(9,700),color:on?myColor:C.navy,
                  background:on?`${myColor}22`:`${C.navy}44`,padding:"1px 7px",borderRadius:99}}>
                  {t.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* ══ TAB: TIENDA ══ */}
        {tab==="tienda"&&(<>
          {/* Categorías */}
          <div style={{background:C.card,border:`1px solid ${C.navy}`,overflow:"hidden"}}>
            <div style={{display:"flex",borderBottom:`1px solid ${C.navy}`,overflowX:"auto"}}>
              {Object.entries(CATS).map(([c,m])=>{
                const on=cat===c;
                const count=c==="Todos"?CATALOGO.length:CATALOGO.filter(i=>i.cat===c).length;
                return (
                  <button key={c} onClick={()=>setCat(c)} className="ut-tab"
                    style={{flex:"0 0 auto",padding:"12px 16px",
                      background:on?`${m.color}12`:"transparent",border:"none",
                      borderBottom:`3px solid ${on?m.color:"transparent"}`,
                      color:on?m.color:C.muted,cursor:"pointer",
                      display:"flex",flexDirection:"column",alignItems:"center",gap:4,minWidth:80}}>
                    <div style={{fontSize:17,filter:on?`drop-shadow(0 0 5px ${m.color})`:"none"}}>{m.icon}</div>
                    <span style={{...raj(11,on?700:500),whiteSpace:"nowrap"}}>{c}</span>
                    <span style={{...raj(9,700),color:on?m.color:C.navy,
                      background:on?`${m.color}22`:`${C.navy}44`,padding:"1px 6px"}}>{count}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Toolbar */}
          <div style={{background:C.card,border:`1px solid ${C.navy}`,padding:"12px 16px",
            display:"flex",alignItems:"center",gap:10,flexWrap:"wrap"}}>
            <div style={{position:"relative",flex:"1 1 180px"}}>
              <Search size={13} color={C.muted} style={{position:"absolute",left:10,top:"50%",transform:"translateY(-50%)"}}/>
              <input className="ut-input" value={search} onChange={e=>setSearch(e.target.value)}
                placeholder="Buscar objeto..."
                style={{width:"100%",padding:"8px 12px 8px 28px",background:C.panel,
                  border:`1px solid ${C.navy}`,color:C.white,...raj(13,500)}}/>
              {search&&<button onClick={()=>setSearch("")} style={{position:"absolute",right:8,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",cursor:"pointer",color:C.muted,display:"flex"}}><X size={12}/></button>}
            </div>
            <span style={{...raj(11,600),color:C.muted}}>Rareza:</span>
            {["all","Poco común","Raro","Épico","Legendario","Mítico"].map(v=>{
              const r=RAREZA[v];
              return <button key={v} onClick={()=>setFilterRar(v)} className="ut-filter-btn" style={fBtn(filterRar===v,r?.color||myColor)}>{v==="all"?"Todas":v}</button>;
            })}
            <div style={{marginLeft:"auto"}}>
              <select value={sortBy} onChange={e=>setSortBy(e.target.value)}
                style={{padding:"7px 12px",background:C.panel,border:`1px solid ${C.navy}`,
                  color:C.muted,...raj(12,500),cursor:"pointer",outline:"none"}}>
                <option value="nuevo">Más nuevos</option>
                <option value="precio_asc">Precio ↑</option>
                <option value="precio_desc">Precio ↓</option>
                <option value="rareza">Rareza</option>
              </select>
            </div>
          </div>

          <div style={{...raj(12,500),color:C.muted}}>{filtrado.length} objeto{filtrado.length!==1?"s":""} encontrado{filtrado.length!==1?"s":""}</div>

          {/* Grid items */}
          {filtrado.length===0?(
            <div style={{padding:60,textAlign:"center",background:C.card,border:`1px solid ${C.navy}`}}>
              <div style={{fontSize:48,marginBottom:12,opacity:.4}}>🔍</div>
              <div style={{...raj(14,600),color:C.muted}}>No se encontraron objetos.</div>
            </div>
          ):(
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(220px,1fr))",gap:14}}>
              {filtrado.map((item,i)=>{
                const r=RAREZA[item.rareza]||{color:C.muted,tier:1};
                const c=r.color;
                const catM=CATS[item.cat]||{};
                const owned=inventario.find(inv=>inv.id===item.id);
                return (
                  <div key={item.id} className="ut-card"
                    onClick={()=>setItemModal(item)}
                    style={{background:C.card,border:`2px solid ${c}22`,
                      boxShadow:`0 4px 16px rgba(0,0,0,.35)`,
                      overflow:"hidden",animation:`ut-cardIn .4s ease ${i*.04}s both`,
                      position:"relative"}}>
                    <div className="ut-card-shine"/>
                    <div style={{height:3,background:`linear-gradient(90deg,transparent,${c},transparent)`}}/>

                    {/* Tags */}
                    <div style={{position:"absolute",top:10,right:10,display:"flex",flexDirection:"column",gap:4,alignItems:"flex-end",zIndex:2}}>
                      {item.esNuevo&&<span style={{...raj(8,700),color:C.green,background:`${C.green}22`,border:`1px solid ${C.green}44`,padding:"1px 7px",animation:"ut-newTag .5s ease both"}}>✦ NUEVO</span>}
                      {item.limitado&&<span style={{...raj(8,700),color:C.red,background:`${C.red}18`,border:`1px solid ${C.red}33`,padding:"1px 7px"}}>🔒</span>}
                      {owned&&<span style={{...raj(8,700),color:C.teal,background:`${C.teal}18`,border:`1px solid ${C.teal}33`,padding:"1px 7px"}}>×{owned.cantidad}</span>}
                    </div>

                    <div style={{padding:"18px 14px 12px",display:"flex",flexDirection:"column",alignItems:"center",textAlign:"center"}}>
                      <ItemIcon item={item} size={60}/>
                      <div style={{...raj(13,700),color:C.white,marginTop:12,marginBottom:6,lineHeight:1.3}}>{item.nombre}</div>
                      <div style={{display:"flex",gap:4,justifyContent:"center",marginBottom:8,flexWrap:"wrap"}}>
                        <span style={{...raj(9,700),color:catM.color||C.orange,background:`${catM.color||C.orange}14`,border:`1px solid ${catM.color||C.orange}33`,padding:"1px 6px"}}>{catM.icon} {item.cat}</span>
                        <RarezaBadge rareza={item.rareza} small/>
                      </div>
                      <p style={{...raj(10,400),color:C.muted,lineHeight:1.5,marginBottom:12,
                        display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical",overflow:"hidden"}}>
                        {item.desc}
                      </p>
                      {/* efecto */}
                      <div style={{display:"flex",gap:5,justifyContent:"center",flexWrap:"wrap",marginBottom:12}}>
                        {item.efectos.map((ef,idx)=>(
                          <span key={idx} style={{...raj(10,700),color:c,background:`${c}12`,border:`1px solid ${c}22`,padding:"2px 7px",display:"inline-flex",alignItems:"center",gap:4}}>
                            {ef.icon} {ef.txt}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* footer precio */}
                    <div style={{borderTop:`1px solid ${C.navy}22`,padding:"10px 14px",
                      display:"flex",alignItems:"center",justifyContent:"space-between",
                      background:item.gratis?`${C.green}06`:`${c}06`}}>
                      <div style={{...orb(15,900),color:item.gratis?C.green:coins>=item.precio?C.gold:C.red,
                        textShadow:r.tier>=4?`0 0 8px ${item.gratis?C.green:C.gold}`:"none"}}>
                        {item.gratis?"GRATIS":`${item.precio.toLocaleString()} 💰`}
                      </div>
                      {!item.gratis&&!item.requiereLogro&&(
                        <div style={{...raj(11,700),color:c,display:"flex",alignItems:"center",gap:4}}>
                          COMPRAR <ChevronRight size={12}/>
                        </div>
                      )}
                      {(item.gratis||item.requiereLogro)&&(
                        <div style={{...raj(11,600),color:C.muted,display:"flex",alignItems:"center",gap:4}}>
                          <Info size={11}/> {item.requiereLogro?"Logro":"Misión"}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>)}

        {/* ══ TAB: INVENTARIO ══ */}
        {tab==="inventario"&&(
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            {inventario.length===0?(
              <div style={{padding:60,textAlign:"center",background:C.card,border:`1px solid ${C.navy}`}}>
                <div style={{fontSize:48,marginBottom:12,opacity:.4}}>📦</div>
                <div style={{...raj(14,600),color:C.muted}}>Tu inventario está vacío.</div>
                <button onClick={()=>setTab("tienda")} className="ut-btn"
                  style={{marginTop:16,...raj(13,700),color:myColor,background:`${myColor}14`,border:`1px solid ${myColor}44`,padding:"10px 20px",cursor:"pointer"}}>
                  Ir a la tienda →
                </button>
              </div>
            ):inventario.map((item,i)=>{
              const r=RAREZA[item.rareza]||{color:C.muted,tier:1};
              const c=r.color;
              return (
                <div key={item.id} className="ut-inv-item"
                  onClick={()=>setItemModal(CATALOGO.find(it=>it.id===item.id)||item)}
                  style={{background:C.card,border:`1px solid ${c}22`,padding:"14px 20px",
                    animation:`ut-fadeIn .3s ease ${i*.06}s both`,
                    borderLeft:`4px solid ${c}`}}>
                  <div style={{display:"flex",alignItems:"center",gap:14}}>
                    <ItemIcon item={item} size={44}/>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{...raj(14,700),color:C.white,marginBottom:4}}>{item.nombre}</div>
                      <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                        <span style={{...raj(10,700),color:CATS[item.cat]?.color||C.orange,background:`${CATS[item.cat]?.color||C.orange}14`,border:`1px solid ${CATS[item.cat]?.color||C.orange}33`,padding:"2px 7px"}}>{CATS[item.cat]?.icon} {item.cat}</span>
                        <RarezaBadge rareza={item.rareza} small/>
                      </div>
                    </div>
                    <div style={{textAlign:"right"}}>
                      <div style={{...orb(22,900),color:c,marginBottom:4}}>×{item.cantidad}</div>
                      <div style={{...raj(11,600),color:C.muted}}>en inventario</div>
                    </div>
                    <ChevronRight size={16} color={C.muted}/>
                  </div>
                </div>
              );
            })}
            <div style={{...raj(12,500),color:C.muted,marginTop:4}}>
              {inventario.reduce((s,i)=>s+i.cantidad,0)} objeto{inventario.reduce((s,i)=>s+i.cantidad,0)!==1?"s":""} en total
            </div>
          </div>
        )}

        {/* ══ TAB: HISTORIAL ══ */}
        {tab==="historial"&&(
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            {historial.length===0?(
              <div style={{padding:60,textAlign:"center",background:C.card,border:`1px solid ${C.navy}`}}>
                <div style={{fontSize:48,marginBottom:12,opacity:.4}}>📜</div>
                <div style={{...raj(14,600),color:C.muted}}>Aún no has realizado compras.</div>
              </div>
            ):historial.map((h,i)=>(
              <div key={h.id} style={{background:C.card,border:`1px solid ${C.navy}`,
                padding:"13px 20px",display:"flex",alignItems:"center",gap:14,
                animation:`ut-fadeIn .3s ease ${i*.05}s both`}}>
                <div style={{width:40,height:40,background:`${C.gold}14`,border:`1px solid ${C.gold}33`,
                  display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,flexShrink:0}}>
                  {h.imagen}
                </div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{...raj(13,700),color:C.white,marginBottom:2}}>{h.item}</div>
                  <div style={{...raj(11,500),color:C.muted}}>Cantidad: ×{h.cantidad} · {h.fecha}</div>
                </div>
                <div style={{textAlign:"right"}}>
                  <div style={{...raj(13,700),color:C.red}}>−{h.precio.toLocaleString()} 💰</div>
                </div>
              </div>
            ))}
            {historial.length>0&&(
              <div style={{...raj(12,700),color:C.muted,textAlign:"right",marginTop:4}}>
                Total gastado: <span style={{color:C.gold}}>{historial.reduce((s,h)=>s+h.precio,0).toLocaleString()} 💰</span>
              </div>
            )}
          </div>
        )}

      </div>
    </>
  );
}