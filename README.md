# 运维命令速查表 · Cheatsheets

📦 在线地址：<https://checklist.tools-online.site>
📮 联系邮箱：<contact@tools-online.site>（Cloudflare Email Routing 转发）

纯静态、零依赖的运维命令速查网站，**11 种语言** × 五张高频速查表：

| 速查表 | 内容 |
| --- | --- |
| 🖥️ tmux | 会话 / 窗口 / 面板、复制模式、常用配置 |
| 🌿 git | 提交、分支、远程、撤销回退、变基挑拣、标签 |
| 🛡️ fail2ban | 服务管理、jail 状态、封禁解封、配置与日志排查 |
| 🐧 linux | 文件、文本处理、进程、网络、权限、磁盘、包管理 |
| 🐳 docker | 镜像、容器、网络卷、调试日志、**Docker Compose** 全套 |

支持语言：简体中文 · 繁體中文 · English · 日本語 · 한국어 · Français · Deutsch · Italiano · Русский · Español · العربية（RTL）

功能：**11 语言实时切换**（URL `?lang=` 持久化 + 自动检测浏览器语言）、实时搜索（`/` 快捷键聚焦、任意语言下中文/命令均可搜索）、一键复制、深浅色主题、移动端适配。

## 目录结构

```
├── index.html                     # 单页入口
├── assets/
│   ├── css/style.css              # 样式（双主题 + RTL）
│   └── js/
│       ├── data.js                # ⭐ 速查数据（中文基准，437 条）
│       ├── app.js                 # 渲染 / 搜索 / 复制 / 主题 / 语言切换
│       └── i18n/
│           ├── i18n.js            # i18n 框架（检测/持久化/RTL）
│           ├── ui.js              # 11 语言 UI 字符串
│           └── content-<lang>.js  # 10 个语言包（与 data.js 位置对齐）
├── scripts/check-i18n.js          # 语言包对齐校验脚本
└── .github/workflows/deploy.yml   # GitHub Actions 自动部署
```

## 如何添加 / 修改命令

编辑 `assets/js/data.js`，在对应速查表的 `sections[].items[]` 里追加：

```js
{ cmd: 'docker run ...', desc: '说明文字', tip: '可选提示' }
```

> 注意：加新条目后，各语言包 `content-<lang>.js` 与 data.js 按位置对齐，
> 请同步在对应 section 的 `descs` 数组中补一条译文；缺项会自动回退英文/中文。
> 校验：`node scripts/check-i18n.js`

提交推送到 `main` 分支即可自动发布。

## 部署架构

```
git push → GitHub 仓库(main) → GitHub Actions → wrangler pages deploy → Cloudflare Pages → checklist.tools-online.site
```

### 配置（已完成的记录）

1. Cloudflare Pages 项目 `checklist`（Direct Upload，production branch = `main`）
2. 自定义域名 `checklist.tools-online.site`（CNAME 代理 → `checklist-b22.pages.dev`）
3. GitHub Secrets：`CLOUDFLARE_API_TOKEN`（Pages + DNS 最小权限）、`CLOUDFLARE_ACCOUNT_ID`
4. `contact@tools-online.site` 经 Cloudflare Email Routing 转发到主邮箱

## 本地预览

```bash
cd checklist && python3 -m http.server 8080
# 打开 http://localhost:8080/?lang=en （或 ja / ar / ru …）
```
