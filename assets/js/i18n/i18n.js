/* ============================================================
 * i18n 框架：语言检测 / 持久化 / RTL / 内容翻译回退链
 * 内容回退链: 当前语言 -> en -> zh-CN
 * ============================================================ */

window.I18N = (function () {
  'use strict';

  const SUPPORTED = ['zh-CN', 'zh-TW', 'en', 'ja', 'ko', 'fr', 'de', 'it', 'ru', 'es', 'ar'];
  const RTL_LANGS = ['ar'];

  const LOCALE_META = {
    'zh-CN': '简体中文',
    'zh-TW': '繁體中文',
    en: 'English',
    ja: '日本語',
    ko: '한국어',
    fr: 'Français',
    de: 'Deutsch',
    it: 'Italiano',
    ru: 'Русский',
    es: 'Español',
    ar: 'العربية',
  };

  function fromUrl() {
    const v = new URLSearchParams(location.search).get('lang');
    return SUPPORTED.includes(v) ? v : null;
  }

  function fromSaved() {
    const v = localStorage.getItem('lang');
    return SUPPORTED.includes(v) ? v : null;
  }

  function fromNavigator() {
    const nav = (navigator.languages && navigator.languages[0]) || navigator.language || '';
    if (/^zh(-|_$)/i.test(nav) || nav === 'zh') {
      return /^zh-(TW|HK|MO|hant)/i.test(nav) ? 'zh-TW' : 'zh-CN';
    }
    const exact = SUPPORTED.find((l) => nav === l || nav.startsWith(l + '-'));
    return exact || null;
  }

  let lang = fromUrl() || fromSaved() || fromNavigator() || 'en';

  function apply() {
    document.documentElement.lang = lang;
    document.documentElement.dir = RTL_LANGS.includes(lang) ? 'rtl' : 'ltr';
    localStorage.setItem('lang', lang);
  }

  /* UI 字符串（ui.js 中定义 UI = { locale: { key: text } }） */
  function t(key) {
    return (window.UI && UI[lang] && UI[lang][key]) || (window.UI && UI.en && UI.en[key]) || key;
  }

  function tpl(key, vars) {
    let s = t(key);
    Object.keys(vars || {}).forEach((k) => {
      s = s.split('{' + k + '}').join(vars[k]);
    });
    return s;
  }

  /* 提示语翻译（TIPS[lang] 以中文原文为键，缺失回退 en -> 原文） */
  function trTip(zhText) {
    if (lang === 'zh-CN' || !zhText) return zhText;
    const cur = window.TIPS && TIPS[lang];
    if (cur && cur[zhText] != null) return cur[zhText];
    const en = window.TIPS && TIPS.en;
    return (en && en[zhText]) || zhText;
  }

  /* 站点标题等按语言切换 */
  function setDocumentTitle() {
    document.title = t('page_title');
  }

  function setLang(l) {
    if (!SUPPORTED.includes(l) || l === lang) return;
    lang = l;
    const url = new URL(location.href);
    url.searchParams.set('lang', l);
    history.replaceState(null, '', url);
    apply();
    if (typeof window.APP_ON_LANG_CHANGE === 'function') window.APP_ON_LANG_CHANGE();
  }

  apply();

  return {
    get lang() { return lang; },
    SUPPORTED,
    RTL_LANGS,
    LOCALE_META,
    t,
    tpl,
    trTip,
    setLang,
    setDocumentTitle,
  };
})();
