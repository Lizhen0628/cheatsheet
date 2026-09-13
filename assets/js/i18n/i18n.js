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
    // 依次检查浏览器首选语言列表，找到第一个受支持的语言
    const list = (navigator.languages && navigator.languages.length)
      ? navigator.languages
      : [navigator.language || ''];
    for (const tag of list) {
      if (!tag) continue;
      if (/^zh/i.test(tag)) {
        return /(TW|HK|MO|Hant)/i.test(tag) ? 'zh-TW' : 'zh-CN';
      }
      const exact = SUPPORTED.find((l) => tag === l || tag.startsWith(l + '-'));
      if (exact) return exact;
    }
    return null;
  }

  let lang = fromUrl() || fromSaved() || fromNavigator() || 'en';

  function apply(persist) {
    document.documentElement.lang = lang;
    document.documentElement.dir = RTL_LANGS.includes(lang) ? 'rtl' : 'ltr';
    // 只有用户手动切换语言才写入 localStorage，浏览器语言始终优先于自动检测结果
    if (persist) localStorage.setItem('lang', lang);
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
    apply(true); // 手动切换：持久化
    if (typeof window.APP_ON_LANG_CHANGE === 'function') window.APP_ON_LANG_CHANGE();
  }

  apply(false);

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
