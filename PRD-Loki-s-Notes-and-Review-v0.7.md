# PRD - Loki's Notes and Review v0.7（基础 SEO 完整配置）

日期：2026-02-03  
负责人：Loki  
目标：为毕业展示站补齐基础 SEO 配置（非默认/占位），提升搜索引擎收录与分享展示效果，并为后续接入 GSC/百度站长工具提供标准入口。

---

## 1. 变更摘要（相对 v0.6）

### 1.1 已完成
- 站点级 SEO Meta 完整化（title/description/robots/canonical 等）
- 社交分享卡片（Open Graph / Twitter Card）
- 结构化数据（JSON-LD WebSite）
- 站点图标（favicon）与 `site.webmanifest`
- `robots.txt` 与 `sitemap.xml`（动态生成，不写死域名，适配 Vercel）

---

## 2. SEO 信息架构与文案

### 2.1 Title
- `Loki's Notes and Review｜AI 学习复盘与毕业展示站`

### 2.2 Description
- `Loki 的 AI 编程学习复盘与毕业展示站：Day 01-07 学习时间线、工具清单、MVP 路演展示，以及 AI 数字分身（百炼）。`

---

## 3. 页面 Meta（基础 SEO）

文件：`index.html`

新增/调整：
- `<title>`：从默认标题升级为包含“AI 学习复盘/毕业展示站”的可搜索标题
- `<meta name="description">`：补全更完整的产品描述
- `<meta name="robots">`：允许收录与大图预览
- `<meta name="author">`：`Loki`
- `<meta name="theme-color">`：`#ff2a2a`（与站点红黑主题一致）
- `<meta name="format-detection" content="telephone=no">`：避免移动端把数字识别成电话
- `<link rel="canonical" href="/">`：单页站点 canonical 指向首页（避免写死域名）

---

## 4. 分享卡片（OG / Twitter）

文件：`index.html`

### 4.1 Open Graph
- `og:title / og:description / og:type / og:locale / og:site_name`
- `og:image`：使用站点主视觉 `/assets/images/banner.png`
- `og:image:width/height`：`1200 x 896`
- `og:image:alt`

### 4.2 Twitter Card
- `twitter:card = summary_large_image`
- `twitter:title / twitter:description / twitter:image`

---

## 5. 结构化数据（JSON-LD）

文件：`index.html`

类型：
- `@type: WebSite`

包含字段：
- name、description、inLanguage
- author/publisher（Person：Loki）
- sameAs（GitHub 仓库、关于我外链）

---

## 6. 站点图标与 Manifest

新增文件：
- `assets/images/favicon.svg`
- `site.webmanifest`

并在 `index.html` `<head>` 引入：
- `<link rel="icon" href="/assets/images/favicon.svg" type="image/svg+xml">`
- `<link rel="manifest" href="/site.webmanifest">`

---

## 7. robots.txt 与 sitemap.xml

目标：
- 为 GSC/百度站长提供标准入口
- 不写死域名，自动适配 Vercel 生产域名/预览域名

实现方式：
- 新增 `vercel.json` rewrites：
  - `/sitemap.xml` -> `/api/sitemap`
  - `/robots.txt` -> `/api/robots`
- 新增 Serverless Functions：
  - `api/sitemap.js`：动态生成 sitemap（当前单页站点只包含 `/`）
  - `api/robots.js`：输出 robots.txt，并指向动态 sitemap 地址

---

## 8. 验收标准（AC）

- [ ] 打开 `https://<域名>/robots.txt` 可访问，并包含 `Sitemap: https://<域名>/sitemap.xml`
- [ ] 打开 `https://<域名>/sitemap.xml` 可访问，XML 格式正确
- [ ] 页面源代码 `<head>` 中存在：
  - title/description/robots/canonical
  - OG/Twitter meta
  - JSON-LD 脚本
- [ ] 在分享工具/社交平台预览时能正确抓到大图（banner）与标题描述

---

## 9. 文件变更清单

- `index.html`：SEO meta、OG/Twitter、JSON-LD、favicon/manifest 引用
- `assets/images/favicon.svg`：新增
- `site.webmanifest`：新增
- `vercel.json`：新增（rewrite robots/sitemap）
- `api/sitemap.js`：新增
- `api/robots.js`：新增

