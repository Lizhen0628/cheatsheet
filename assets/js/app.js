/* ============================================================
 * 速查表应用逻辑：i18n 渲染 / 路由导航 / 实时搜索 / 一键复制 / 主题
 * ============================================================ */

(function () {
  'use strict';

  const CONTACT_EMAIL = 'contact@tools-online.site';

  const state = {
    sheet: location.hash.replace('#', '') || null,
  };

  const els = {
    nav: document.getElementById('nav'),
    content: document.getElementById('content'),
    heroWrap: document.getElementById('hero-wrap'),
    search: document.getElementById('search'),
    searchMeta: document.getElementById('search-meta'),
    themeBtn: document.getElementById('theme-btn'),
    menuBtn: document.getElementById('menu-btn'),
    sidebar: document.getElementById('sidebar'),
    langSelect: document.getElementById('lang-select'),
    brandName: document.getElementById('brand-name'),
    brandSub: document.getElementById('brand-sub'),
    navLabel: document.getElementById('nav-label'),
    sidebarFoot: document.getElementById('sidebar-foot'),
    searchKbd: document.getElementById('search-kbd'),
  };

  /* ============ i18n：生成本地化视图（回退链 当前语言 -> en -> zh-CN） ============ */

  let VIEW = []; // 本地化后的 SHEETS 副本

  function buildView() {
    const lang = I18N.lang;
    const packs = window.CONTENT || {};
    const useOriginal = lang === 'zh-CN'; // 中文是原始数据，不做 en 回退
    const cur = useOriginal ? null : packs[lang] || null;
    const en = packs.en || null;

    VIEW = SHEETS.map((sheet, si) => {
      const cp = cur && cur[si];
      const ep = en && en[si];
      const sections = sheet.sections.map((sec, xi) => {
        const cs = cp && cp.sections[xi];
        const es = ep && ep.sections[xi];
        const title = useOriginal ? sec.title : ((cs && cs.title) || (es && es.title) || sec.title);
        const items = sec.items.map((it, ii) => {
          let desc = it.desc;
          if (!useOriginal) {
            if (cs && cs.descs && ii < cs.descs.length && cs.descs[ii]) {
              desc = cs.descs[ii];
            } else if (es && es.descs && ii < es.descs.length && es.descs[ii]) {
              desc = es.descs[ii];
            }
          }
          // zh: 中文原文（描述+分类标题），任何语言下都可作为搜索兜底
          return { cmd: it.cmd, desc, tip: it.tip || null, zh: it.desc + ' ' + sec.title };
        });
        return { title, items };
      });
      return {
        id: sheet.id,
        name: sheet.name,
        icon: sheet.icon,
        accent: sheet.accent,
        title: I18N.t('title_' + sheet.id),
        desc: useOriginal ? sheet.desc : ((cp && cp.desc) || (ep && ep.desc) || sheet.desc),
        sections,
      };
    });
  }

  const t = (k) => I18N.t(k);
  const tpl = (k, v) => I18N.tpl(k, v);
  const trTip = (s) => I18N.trTip(s);
  const totalOf = (sheet) => sheet.sections.reduce((n, s) => n + s.items.length, 0);
  const TOTAL_CMDS = SHEETS.reduce((n, s) => n + totalOf(s), 0);

  /* ============ 主题 ============ */

  const ICONS = {
    moon:
      '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>',
    sun:
      '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M2 12h2m16 0h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>',
  };

  const savedTheme = localStorage.getItem('theme');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  applyTheme(savedTheme || (prefersDark ? 'dark' : 'light'));

  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
    els.themeBtn.innerHTML = theme === 'dark' ? ICONS.sun : ICONS.moon;
    els.themeBtn.title = t(theme === 'dark' ? 'theme_light' : 'theme_dark');
  }

  els.themeBtn.addEventListener('click', () => {
    applyTheme(document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark');
  });

  /* ============ 复制 ============ */

  let toastTimer = null;
  function showToast(msg) {
    let toast = document.getElementById('toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'toast';
      document.body.appendChild(toast);
    }
    toast.textContent = msg;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 1600);
  }

  async function copyText(text) {
    try {
      await navigator.clipboard.writeText(text);
    } catch (e) {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.cssText = 'position:fixed;opacity:0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      ta.remove();
    }
    showToast(t('toast_copied'));
  }

  /* ============ 渲染 ============ */

  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function itemCard(item) {
    const tipBadge = item.tip
      ? `<span class="tip" title="${esc(trTip(item.tip))}">${esc(trTip(item.tip))}</span>`
      : '';
    return `
      <div class="cmd-card">
        <div class="cmd-line">
          <code class="cmd"><pre>${esc(item.cmd)}</pre></code>
          <button class="copy-btn" type="button">${esc(t('copy'))}</button>
        </div>
        <div class="cmd-meta">
          <span class="desc">${esc(item.desc)}</span>
          ${tipBadge}
        </div>
      </div>`;
  }

  function sectionBlock(sec) {
    return `
      <section class="sec">
        <h2>${esc(sec.title)}<span class="count">${tpl('count_tpl', { n: sec.items.length })}</span></h2>
        <div class="grid">${sec.items.map(itemCard).join('')}</div>
      </section>`;
  }

  function renderNav() {
    els.nav.innerHTML = VIEW.map(
      (s) => `
      <a class="nav-item${state.sheet === s.id ? ' active' : ''}" href="#${s.id}" data-sheet="${s.id}">
        <span class="nav-icon">${s.icon}</span>
        <span class="nav-text">
          <span class="nav-name">${esc(s.name)}</span>
          <span class="nav-sub">${esc(s.desc)}</span>
        </span>
      </a>`
    ).join('');
  }

  function renderChrome() {
    els.brandName.textContent = t('brand_name');
    els.brandSub.textContent = t('brand_sub');
    els.navLabel.textContent = t('nav_label');
    els.search.placeholder = t('search_placeholder');
    els.searchKbd.textContent = t('search_kbd');
    els.menuBtn.title = t('menu_open');
    els.themeBtn.title = t(
      document.documentElement.getAttribute('data-theme') === 'dark' ? 'theme_light' : 'theme_dark'
    );
    els.sidebarFoot.innerHTML = `
      <a href="mailto:${CONTACT_EMAIL}">${CONTACT_EMAIL}</a>`;
    I18N.setDocumentTitle();
  }

  function renderLangSelect() {
    els.langSelect.innerHTML = I18N.SUPPORTED.map(
      (code) => `<option value="${code}"${code === I18N.lang ? ' selected' : ''}>${I18N.LOCALE_META[code]}</option>`
    ).join('');
    els.langSelect.title = t('lang_label');
  }

  function renderHero() {
    els.heroWrap.innerHTML = `
      <div class="hero">
        <span class="hero-badge">${esc(t('hero_badge'))}</span>
        <h1>${esc(t('hero_title'))}</h1>
        <p>${esc(t('hero_desc'))}</p>
        <div class="hero-stats">
          <div class="stat"><b>${VIEW.length}</b><span>${esc(t('stat_sheets'))}</span></div>
          <div class="stat"><b>${TOTAL_CMDS}</b><span>${esc(t('stat_cmds'))}</span></div>
          <div class="stat"><b>${VIEW.reduce((n, s) => n + s.sections.length, 0)}</b><span>${esc(t('stat_secs'))}</span></div>
          <div class="stat"><b>${esc(t('stat_dep'))}</b><span>${esc(t('stat_dep_sub'))}</span></div>
        </div>
      </div>`;
  }

  function renderSheet(sheet) {
    els.heroWrap.style.display = 'none';
    els.content.innerHTML = `
      <header class="sheet-head" style="--accent:${sheet.accent}">
        <h1><span class="sheet-icon">${sheet.icon}</span>${esc(sheet.title)}</h1>
        <p>${esc(sheet.desc)}</p>
        <div class="quick-jumps">
          ${sheet.sections.map((s, i) => `<a href="#sec-${sheet.id}-${i}">${esc(s.title)}</a>`).join('')}
        </div>
      </header>
      <div id="sheet-sections">${sheet.sections.map(sectionBlock).join('')}</div>`;

    document.querySelectorAll('#sheet-sections .sec').forEach((el, i) => {
      el.id = `sec-${sheet.id}-${i}`;
    });
  }

  function renderHome() {
    els.heroWrap.style.display = '';
    renderHero();
    els.content.innerHTML = VIEW.map(
      (s) => `
      <section class="sec home-sec">
        <h2><span class="mark">${s.icon}</span> ${esc(s.title)}<span class="count">${tpl('count_tpl', { n: totalOf(s) })}</span></h2>
        <div class="grid">${s.sections[0].items.slice(0, 4).map(itemCard).join('')}
          <a class="more-card" href="#${s.id}" style="--accent:${s.accent}">${esc(tpl('view_all_tpl', { n: totalOf(s) }))}</a>
        </div>
      </section>`
    ).join('');
  }

  function normalize(str) {
    return String(str).toLowerCase().replace(/\s+/g, ' ').trim();
  }

  function renderSearch(q) {
    const query = normalize(q);
    if (!query) {
      els.searchMeta.textContent = '';
      if (state.sheet) {
        const s = VIEW.find((x) => x.id === state.sheet);
        if (s) return renderSheet(s);
      }
      return renderHome();
    }

    els.heroWrap.style.display = 'none';
    const words = query.split(' ');
    let total = 0;
    const html = VIEW.map((sheet) => {
      const matchedSections = sheet.sections
        .map((sec) => {
          const items = sec.items.filter((it) => {
            const hay = normalize(
              it.cmd + ' ' + it.desc + ' ' + (it.tip ? trTip(it.tip) : '') + ' ' +
              it.zh + ' ' + sec.title + ' ' + sheet.name
            );
            return words.every((w) => hay.includes(w));
          });
          return items.length ? { title: `${sheet.name} · ${sec.title}`, items } : null;
        })
        .filter(Boolean);
      if (!matchedSections.length) return '';
      total += matchedSections.reduce((n, s) => n + s.items.length, 0);
      return matchedSections.map(sectionBlock).join('');
    }).join('');

    els.content.innerHTML =
      `<header class="sheet-head search-head"><h1>${esc(tpl('search_head_tpl', { q }))}</h1></header>` +
      (html || `<p class="no-result">${esc(t('search_none'))}</p>`);
    els.searchMeta.textContent = tpl('search_meta_tpl', { n: total });
  }

  function route() {
    const id = location.hash.replace('#', '');
    if (id && VIEW.some((s) => s.id === id)) {
      state.sheet = id;
    } else if (!id) {
      state.sheet = null;
    }
    if (id.startsWith('sec-')) return; // section 锚点：保持当前视图
    renderNav();
    renderSearch(els.search.value);
    window.scrollTo({ top: 0 });
    closeSidebar();
  }

  function closeSidebar() {
    els.sidebar.classList.remove('open');
    document.body.classList.remove('sidebar-open');
  }

  window.addEventListener('hashchange', route);

  /* ============ 搜索框 ============ */

  let searchTimer = null;
  els.search.addEventListener('input', () => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => renderSearch(els.search.value), 80);
  });
  els.search.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      els.search.value = '';
      renderSearch('');
      els.search.blur();
    }
  });

  // "/" 快捷键聚焦搜索
  document.addEventListener('keydown', (e) => {
    if (e.key === '/' && document.activeElement !== els.search) {
      e.preventDefault();
      els.search.focus();
      els.search.select();
    }
  });

  /* ============ 复制按钮（事件委托） ============ */

  els.content.addEventListener('click', (e) => {
    const btn = e.target.closest('.copy-btn');
    if (!btn) return;
    const card = btn.closest('.cmd-card');
    const code = card.querySelector('pre').textContent;
    copyText(code);
    btn.textContent = t('copied');
    btn.classList.add('copied');
    setTimeout(() => {
      btn.textContent = t('copy');
      btn.classList.remove('copied');
    }, 1400);
  });

  /* ============ 语言切换 ============ */

  els.langSelect.addEventListener('change', () => I18N.setLang(els.langSelect.value));

  window.APP_ON_LANG_CHANGE = function () {
    buildView();
    renderLangSelect();
    renderChrome();
    renderNav();
    renderSearch(els.search.value);
  };

  /* ============ 移动端侧栏 ============ */

  els.menuBtn.addEventListener('click', () => {
    els.sidebar.classList.toggle('open');
    document.body.classList.toggle('sidebar-open');
  });
  els.content.addEventListener('click', (e) => {
    if (e.target.closest('a')) closeSidebar();
  });

  /* ============ 启动 ============ */

  buildView();
  renderLangSelect();
  renderChrome();
  renderNav();
  route();
})();
