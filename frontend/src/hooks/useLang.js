import { useState, useEffect, useCallback } from "react";
import { getLang, setLang as _setLang, t as _t, LANGS as _LANGS } from "../i18n/index.js";

export { _LANGS as LANGS };

/**
 * Reactive i18n hook.
 * Returns { lang, setLang, t, LANGS }
 * Components re-render automatically when the language changes.
 *
 * Usage:
 *   const { t, lang, setLang } = useLang();
 *   <div>{t("sp.title")}</div>
 */
export function useLang() {
  const [lang, setLangState] = useState(getLang);

  useEffect(() => {
    const handler = (e) => setLangState(e.detail || getLang());
    window.addEventListener("fv-lang-changed", handler);
    return () => window.removeEventListener("fv-lang-changed", handler);
  }, []);

  const setLang = useCallback((code) => _setLang(code), []);
  const t = useCallback((key) => _t(key, lang), [lang]);

  return { lang, setLang, t, LANGS: _LANGS };
}
