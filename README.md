# 运维命令速查表 · Cheatsheets

📦 在线地址：<https://checklist.tools-online.site>

纯静态、零依赖的运维命令速查网站，覆盖五张高频速查表：

| 速查表 | 内容 |
| --- | --- |
| 🖥️ tmux | 会话 / 窗口 / 面板、复制模式、常用配置 |
| 🌿 git | 提交、分支、远程、撤销回退、变基挑拣、标签 |
| 🛡️ fail2ban | 服务管理、jail 状态、封禁解封、配置与日志排查 |
| 🐧 linux | 文件、文本处理、进程、网络、权限、磁盘、包管理 |
| 🐳 docker | 镜像、容器、网络卷、调试日志、**Docker Compose** 全套 |

功能：实时搜索（`/` 快捷键聚焦）、一键复制、深浅色主题、移动端适配。

## 目录结构

```
├── index.html            # 单页入口
├── assets/
│   ├── css/style.css     # 样式（双主题）
│   └── js/
│       ├── data.js       # ⭐ 全部速查数据（加命令改这里）
│       └── app.js        # 渲染 / 搜索 / 复制 / 主题逻辑
└── .github/workflows/
    └── deploy.yml        # GitHub Actions 自动部署
```

## 如何添加 / 修改命令

编辑 `assets/js/data.js`，在对应速查表的 `sections[].items[]` 里追加：

```js
{ cmd: 'docker run ...', desc: '说明文字', tip: '可选提示' }
```

提交推送到 `main` 分支即可自动发布。

## 部署架构

```
git push → GitHub 仓库(main) → GitHub Actions → wrangler pages deploy → Cloudflare Pages → checklist.tools-online.site
```

### 首次配置（已完成的记录）

1. Cloudflare Pages 创建项目 `checklist`（Direct Upload 模式，production branch = `main`）
2. 绑定自定义域名 `checklist.tools-online.site`（CNAME 代理模式指向 `*.pages.dev`）
3. GitHub 仓库配置 Secrets：
   - `CLOUDFLARE_API_TOKEN` — Pages 读写 + zone DNS 权限的 API Token
   - `CLOUDFLARE_ACCOUNT_ID` — Cloudflare 账号 ID

## 本地预览

```bash
cd checklist && python3 -m http.server 8080
# 打开 http://localhost:8080
```
