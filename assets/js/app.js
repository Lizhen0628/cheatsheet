/* ============================================================
 * 速查表应用逻辑：路由导航 / 实时搜索 / 一键复制 / 主题切换
 * ============================================================ */

(function () {
  'use strict';

  const state = {
    sheet: location.hash.replace('#', '') || null,
    query: '',
  };

  const els = {
    nav: document.getElementById('nav'),
    content: document.getElementById('content'),
    search: document.getElementById('search'),
    searchMeta: document.getElementById('search-meta'),
    themeBtn: document.getElementById('theme-btn'),
    menuBtn: document.getElementById('menu-btn'),
    sidebar: document.getElementById('sidebar'),
    hero: document.getElementById('hero'),
  };

  /* ---------- 主题 ---------- */
  const savedTheme = localStorage.getItem('theme');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  applyTheme(savedTheme || (prefersDark ? 'dark' : 'light'));

  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
    els.themeBtn.textContent = theme === 'dark' ? '☀️' : '🌙';
    els.themeBtn.title = theme === 'dark' ? '切换到浅色模式' : '切换到深色模式';
  }

  els.themeBtn.addEventListener('click', () => {
    applyTheme(document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark');
  });

  /* ---------- 复制 ---------- */
  let toastTimer = null;
  function showToast(msg) {
    let t = document.getElementById('toast');
    if (!t) {
      t = document.createElement('div');
      t.id = 'toast';
      document.body.appendChild(t);
    }
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove('show'), 1600);
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
    showToast('已复制到剪贴板');
  }

  /* ---------- 渲染 ---------- */
  function esc(s) {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function itemCard(item) {
    const tipBadge = item.tip ? `<span class="tip" title="${esc(item.tip)}">💡 ${esc(item.tip)}</span>` : '';
    return `
      <div class="cmd-card">
        <div class="cmd-line">
          <code class="cmd"><pre>${esc(item.cmd)}</pre></code>
          <button class="copy-btn" type="button" title="复制命令">复制</button>
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
        <h2>${esc(sec.title)}<span class="count">${sec.items.length}</span></h2>
        <div class="grid">${sec.items.map(itemCard).join('')}</div>
      </section>`;
  }

  function renderNav() {
    els.nav.innerHTML = SHEETS.map(
      (s) => `
      <a class="nav-item${state.sheet === s.id ? ' active' : ''}" href="#${s.id}" data-sheet="${s.id}">
        <span class="nav-icon">${s.icon}</span>
        <span class="nav-text">
          <span class="nav-name">${s.name}</span>
          <span class="nav-sub">${s.desc}</span>
        </span>
      </a>`
    ).join('');
  }

  function renderSheet(sheet) {
    els.hero.style.display = 'none';
    els.content.innerHTML = `
      <header class="sheet-head" style="--accent:${sheet.accent}">
        <h1><span class="sheet-icon">${sheet.icon}</span>${esc(sheet.title)}</h1>
        <p>${esc(sheet.desc)}</p>
        <div class="quick-jumps">
          ${sheet.sections.map((s, i) => `<a href="#sec-${sheet.id}-${i}">${esc(s.title)}</a>`).join('')}
        </div>
      </header>
      <div id="sheet-sections">${sheet.sections.map(sectionBlock).join('')}</div>`;

    // 给每个 section 加锚点
    document.querySelectorAll('#sheet-sections .sec').forEach((el, i) => {
      el.id = `sec-${sheet.id}-${i}`;
    });
  }

  function renderHome() {
    els.hero.style.display = '';
    els.content.innerHTML = SHEETS.map(
      (s) => `
      <section class="sec home-sec">
        <h2>${s.icon} ${esc(s.title)}<span class="count">${s.sections.reduce((n, x) => n + x.items.length, 0)} 条</span></h2>
        <div class="grid">${s.sections[0].items.slice(0, 4).map(itemCard).join('')}
          <a class="more-card" href="#${s.id}" style="--accent:${s.accent}">查看全部 ${s.sections.reduce((n, x) => n + x.items.length, 0)} 条命令 →</a>
        </div>
      </section>`
    ).join('');
  }

  function normalize(str) {
    return str.toLowerCase().replace(/\s+/g, ' ').trim();
  }

  function renderSearch(q) {
    const query = normalize(q);
    if (!query) {
      els.searchMeta.textContent = '';
      if (state.sheet) {
        const s = SHEETS.find((x) => x.id === state.sheet);
        if (s) return renderSheet(s);
      }
      return renderHome();
    }

    els.hero.style.display = 'none';
    const words = query.split(' ');
    let total = 0;
    const html = SHEETS.map((sheet) => {
      const matchedSections = sheet.sections
        .map((sec) => {
          const items = sec.items.filter((it) => {
            const hay = normalize(it.cmd + ' ' + it.desc + ' ' + sec.title + ' ' + sheet.name);
            return words.every((w) => hay.includes(w));
          });
          return items.length ? { title: `${sheet.icon} ${sheet.name} · ${sec.title}`, items } : null;
        })
        .filter(Boolean);
      if (!matchedSections.length) return '';
      total += matchedSections.reduce((n, s) => n + s.items.length, 0);
      return matchedSections.map(sectionBlock).join('');
    }).join('');

    els.content.innerHTML =
      `<header class="sheet-head search-head"><h1>🔍 搜索 “${esc(q)}”</h1></header>` +
      (html || '<p class="no-result">没有匹配的命令，换个关键词试试（如 “端口”“分支”“解封”“日志”）</p>');
    els.searchMeta.textContent = `共匹配 ${total} 条`;
  }

  function route() {
    const id = location.hash.replace('#', '');
    if (id && SHEETS.some((s) => s.id === id)) {
      state.sheet = id;
    } else if (!id) {
      state.sheet = null;
    }
    // id 是 section 锚点时保持当前 sheet
    if (id.startsWith('sec-')) return;
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

  /* ---------- 搜索框 ---------- */
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

  /* ---------- 复制按钮（事件委托） ---------- */
  els.content.addEventListener('click', (e) => {
    const btn = e.target.closest('.copy-btn');
    if (!btn) return;
    const card = btn.closest('.cmd-card');
    const code = card.querySelector('pre').textContent;
    copyText(code);
    btn.textContent = '✓ 已复制';
    btn.classList.add('copied');
    setTimeout(() => {
      btn.textContent = '复制';
      btn.classList.remove('copied');
    }, 1400);
  });

  /* ---------- 移动端侧栏 ---------- */
  els.menuBtn.addEventListener('click', () => {
    els.sidebar.classList.toggle('open');
    document.body.classList.toggle('sidebar-open');
  });
  els.content.addEventListener('click', (e) => {
    if (e.target.closest('a')) closeSidebar();
  });

  /* ---------- 启动 ---------- */
  renderNav();
  route();
})();
