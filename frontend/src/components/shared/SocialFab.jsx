import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Instagram, Mail, MessageCircle, Plus, Send, X } from "lucide-react";

const SOCIAL_LINKS = [
  {
    id: "whatsapp",
    label: "WhatsApp",
    role: "Mensajero del gremio",
    hint: "Para dudas rapidas o soporte directo.",
    href: "https://wa.me/573000000000",
    icon: MessageCircle,
  },
  {
    id: "instagram",
    label: "Instagram",
    role: "Cronica del mapa",
    hint: "Novedades, avances y comunidad del gremio.",
    href: "https://instagram.com/forgeventure",
    icon: Instagram,
  },
  {
    id: "telegram",
    label: "Telegram",
    role: "Canal del mapa",
    hint: "Canal agil para avisos y contacto.",
    href: "https://t.me/forgeventure",
    icon: Send,
  },
  {
    id: "mail",
    label: "Correo",
    role: "Escriba del gremio",
    hint: "Consultas largas, alianzas o ayuda tecnica.",
    href: "mailto:hola@forgeventure.app",
    icon: Mail,
  },
];

const FAB_CSS = `
  .fvl-social-fab {
    position: fixed;
    left: max(18px, calc(env(safe-area-inset-left) + 12px));
    bottom: max(18px, calc(env(safe-area-inset-bottom) + 12px));
    z-index: 9200;
    display: grid;
    justify-items: start;
    gap: 12px;
    --fv-warrior: #ff4d5e;
    --fv-archer:  #7bdc3b;
    --fv-mage:    #4cc9f0;
    --fv-muted:   #c6bdd6;
    --fv-text:    #f7f2ff;
  }

  .fvl-social-panel {
    width: min(332px, calc(100vw - 24px));
    padding: 16px;
    border-radius: 24px;
    border: 1px solid rgba(255,255,255,0.08);
    background:
      linear-gradient(135deg,
        color-mix(in srgb, var(--fv-warrior) 5%, transparent),
        rgba(255,255,255,0.04) 38%,
        color-mix(in srgb, var(--fv-mage) 5%, transparent)),
      rgba(8,8,18,0.86);
    backdrop-filter: blur(18px);
    box-shadow:
      inset 1px 0 0 color-mix(in srgb, var(--fv-warrior) 12%, transparent),
      inset 0 -1px 0 color-mix(in srgb, var(--fv-archer) 10%, transparent),
      inset -1px 0 0 color-mix(in srgb, var(--fv-mage) 12%, transparent),
      0 18px 44px rgba(0,0,0,0.34),
      0 0 12px color-mix(in srgb, var(--fv-warrior) 7%, transparent),
      0 0 20px color-mix(in srgb, var(--fv-mage) 9%, transparent);
  }

  .fvl-social-panel-head {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 14px;
  }

  .fvl-social-panel-head strong,
  .fvl-social-link-copy strong {
    display: block;
    font-family: "Sora", sans-serif;
  }

  .fvl-social-panel-head strong {
    font-size: 15px;
    margin-bottom: 4px;
  }

  .fvl-social-panel-head p,
  .fvl-social-link-copy span {
    margin: 0;
    color: var(--fv-muted);
    font-size: 12px;
    line-height: 1.45;
  }

  .fvl-social-panel-close,
  .fvl-social-toggle {
    appearance: none;
    border: none;
    cursor: pointer;
    color: inherit;
  }

  .fvl-social-panel-close {
    width: 36px;
    height: 36px;
    border-radius: 12px;
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.08);
    display: grid;
    place-items: center;
    flex-shrink: 0;
  }

  .fvl-social-links {
    display: grid;
    gap: 10px;
  }

  .fvl-social-link {
    position: relative;
    display: grid;
    grid-template-columns: 44px minmax(0,1fr) 16px;
    align-items: center;
    gap: 12px;
    text-decoration: none;
    color: var(--fv-text);
    padding: 12px;
    border-radius: 18px;
    border: 1px solid rgba(255,255,255,0.08);
    background:
      linear-gradient(135deg,
        color-mix(in srgb, var(--fv-warrior) 4%, transparent),
        rgba(255,255,255,0.03) 38%,
        color-mix(in srgb, var(--fv-mage) 4%, transparent)),
      rgba(12,10,24,0.72);
    transition: transform .2s ease, border-color .2s ease, box-shadow .2s ease;
  }

  .fvl-social-link::after {
    content: attr(data-role);
    position: absolute;
    left: 14px;
    right: 14px;
    bottom: calc(100% + 8px);
    padding: 8px 10px;
    border-radius: 12px;
    background:
      linear-gradient(135deg,
        color-mix(in srgb, var(--fv-warrior) 8%, transparent),
        rgba(255,255,255,0.05) 38%,
        color-mix(in srgb, var(--fv-mage) 8%, transparent)),
      rgba(8,8,18,0.92);
    border: 1px solid rgba(255,255,255,0.08);
    color: var(--fv-text);
    font-family: "Sora", sans-serif;
    font-size: 11px;
    letter-spacing: .04em;
    opacity: 0;
    transform: translateY(4px);
    pointer-events: none;
    transition: opacity .18s ease, transform .18s ease;
    box-shadow: 0 12px 24px rgba(0,0,0,0.24);
  }

  .fvl-social-link:hover {
    transform: translateY(-2px);
    border-color: rgba(255,255,255,0.12);
    box-shadow:
      inset 1px 0 0 color-mix(in srgb, var(--fv-warrior) 15%, transparent),
      inset 0 -1px 0 color-mix(in srgb, var(--fv-archer) 13%, transparent),
      inset -1px 0 0 color-mix(in srgb, var(--fv-mage) 15%, transparent),
      0 0 12px color-mix(in srgb, var(--fv-warrior) 7%, transparent),
      0 0 18px color-mix(in srgb, var(--fv-mage) 9%, transparent);
  }

  .fvl-social-link:hover::after {
    opacity: 1;
    transform: translateY(0);
  }

  .fvl-social-link-icon {
    width: 44px;
    height: 44px;
    border-radius: 14px;
    display: grid;
    place-items: center;
    background:
      linear-gradient(135deg,
        color-mix(in srgb, var(--fv-warrior) 8%, transparent),
        rgba(255,255,255,0.05) 38%,
        color-mix(in srgb, var(--fv-mage) 8%, transparent)),
      rgba(255,255,255,0.03);
    border: 1px solid rgba(255,255,255,0.08);
  }

  .fvl-social-link-icon svg,
  .fvl-social-link-arrow {
    color: #dbe4ff;
  }

  .fvl-social-link-copy strong {
    font-size: 13px;
    margin-bottom: 3px;
  }

  .fvl-social-toggle {
    position: relative;
    min-width: 64px;
    min-height: 64px;
    padding: 0 18px;
    border-radius: 999px;
    display: inline-flex;
    align-items: center;
    justify-content: flex-start;
    gap: 10px;
    background:
      linear-gradient(135deg,
        color-mix(in srgb, var(--fv-warrior) 14%, transparent),
        rgba(255,255,255,0.08) 38%,
        color-mix(in srgb, var(--fv-mage) 16%, transparent)),
      rgba(9,8,18,0.92);
    border: 1px solid rgba(255,255,255,0.12);
    box-shadow:
      inset 1px 0 0 color-mix(in srgb, var(--fv-warrior) 18%, transparent),
      inset 0 -1px 0 color-mix(in srgb, var(--fv-archer) 16%, transparent),
      inset -1px 0 0 color-mix(in srgb, var(--fv-mage) 18%, transparent),
      0 14px 28px rgba(0,0,0,0.34),
      0 0 12px color-mix(in srgb, var(--fv-warrior) 10%, transparent),
      0 0 20px color-mix(in srgb, var(--fv-mage) 12%, transparent);
  }

  .fvl-social-toggle.is-idle::before {
    content: "";
    position: absolute;
    inset: -6px;
    border-radius: 999px;
    border: 1px solid rgba(255,255,255,0.08);
    background:
      radial-gradient(circle at center,
        color-mix(in srgb, var(--fv-warrior) 10%, transparent),
        transparent 56%);
    opacity: .72;
    animation: fvl-social-pulse 2.4s ease-out infinite;
    pointer-events: none;
  }

  .fvl-social-toggle.is-idle::after {
    content: "";
    position: absolute;
    top: 10px;
    right: 10px;
    width: 10px;
    height: 10px;
    border-radius: 999px;
    background: linear-gradient(135deg, var(--fv-archer), var(--fv-mage));
    box-shadow:
      0 0 0 3px rgba(7,6,17,0.84),
      0 0 10px color-mix(in srgb, var(--fv-archer) 36%, transparent),
      0 0 18px color-mix(in srgb, var(--fv-mage) 28%, transparent);
    pointer-events: none;
  }

  .fvl-social-toggle strong {
    font-family: "Sora", sans-serif;
    font-size: 13px;
  }

  .fvl-social-toggle-copy {
    display: grid;
    text-align: left;
    gap: 2px;
  }

  .fvl-social-toggle-copy span {
    color: var(--fv-muted);
    font-size: 11px;
    line-height: 1.2;
  }

  @keyframes fvl-social-pulse {
    0%   { transform: scale(.96); opacity: .18; }
    45%  { opacity: .52; }
    100% { transform: scale(1.08); opacity: 0; }
  }

  @media (max-width: 480px) {
    .fvl-social-fab {
      left: 12px;
      right: 12px;
      bottom: 12px;
      justify-items: stretch;
    }
    .fvl-social-panel,
    .fvl-social-toggle {
      width: 100%;
    }
    .fvl-social-toggle {
      justify-content: center;
    }
  }
`;

let cssInjected = false;
function injectCss() {
  if (cssInjected) return;
  const style = document.createElement("style");
  style.textContent = FAB_CSS;
  document.head.appendChild(style);
  cssInjected = true;
}

export default function SocialFab({ prompt = "Soporte y contacto" }) {
  injectCss();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onPointer = (e) => { if (!ref.current?.contains(e.target)) setOpen(false); };
    const onKey = (e) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="fvl-social-fab" ref={ref}>
      <AnimatePresence>
        {open && (
          <motion.div
            className="fvl-social-panel"
            initial={{ opacity: 0, y: 18, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.97 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="fvl-social-panel-head">
              <div>
                <strong>Habla con el gremio</strong>
                <p>Elige la via que te quede mas comoda para dudas, soporte o novedades.</p>
              </div>
              <button
                type="button"
                className="fvl-social-panel-close"
                onClick={() => setOpen(false)}
                aria-label="Cerrar redes del gremio"
              >
                <X size={16} />
              </button>
            </div>

            <div className="fvl-social-links">
              {SOCIAL_LINKS.map((item) => {
                const Icon = item.icon;
                return (
                  <a
                    key={item.id}
                    className="fvl-social-link"
                    data-role={item.role}
                    href={item.href}
                    target={item.href.startsWith("mailto:") ? undefined : "_blank"}
                    rel={item.href.startsWith("mailto:") ? undefined : "noreferrer"}
                    title={item.role}
                  >
                    <span className="fvl-social-link-icon">
                      <Icon size={18} />
                    </span>
                    <span className="fvl-social-link-copy">
                      <strong>{item.label}</strong>
                      <span>{item.hint}</span>
                    </span>
                    <ArrowRight size={14} className="fvl-social-link-arrow" />
                  </a>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        type="button"
        className={`fvl-social-toggle${open ? "" : " is-idle"}`}
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label={open ? "Ocultar redes del gremio" : "Mostrar redes del gremio"}
      >
        {open
          ? <Plus size={18} style={{ transform: "rotate(45deg)" }} />
          : <MessageCircle size={18} />}
        <span className="fvl-social-toggle-copy">
          <strong>{open ? "Cerrar" : "Redes"}</strong>
          {!open && <span>{prompt}</span>}
        </span>
      </button>
    </div>
  );
}
