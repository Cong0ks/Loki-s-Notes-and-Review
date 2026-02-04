# PRD - Loki's Notes and Review v0.8（MVP/导航体验优化）

日期：2026-02-03  
负责人：Loki  
目标：补齐 MVP 展示的可访问 Demo 链接与静态工具落地，优化首屏快捷入口与导航外链，提升路演演示效率。

---

## 1. 变更摘要（相对 v0.7）

### 1.1 MVP 展示优化
- MVP01：增加右上角「访问DEMO」按钮（新开窗口）
- MVP03：新增卡片 + 右上角「访问DEMO」按钮（新开窗口）
- MVP04：
  - 新增卡片 + 右上角「访问DEMO」按钮（新开窗口）
  - Demo 链接从外部下载地址切换为站内静态文件地址（避免飞书下载不稳定/不便演示）
  - 将小工具 HTML 文件纳入仓库并随站点部署，避免 404

### 1.2 首屏快捷入口
- 在 Hero 区「进入时间线」按钮旁，新增同风格锚点按钮：
  - 「工具清单」 -> `#tools`
  - 「MVP 成果展示」 -> `#mvp`
- 点击行为与现有锚点一致：页面平滑滚动定位到对应区块

### 1.3 顶部导航外链调整
- 顶部导航栏「关于我」外链更新为 B 站视频链接（新开窗口）

---

## 2. 链接与入口（当前生效）

### MVP01
- 文案：访问DEMO
- URL：`https://enter.12ll.top`

### MVP03
- 文案：访问DEMO
- URL：`https://pr2026-new2.vercel.app/`

### MVP04
- 文案：访问DEMO
- URL：`https://www.12ll.top/assets/mini-Tools/image_conv_app.html`
- 站内文件：`assets/mini-Tools/image_conv_app.html`

### 顶部「关于我」
- URL：`https://www.bilibili.com/video/BV1de25BEEYA/?share_source=copy_web&vd_source=9a94bed1efa799a189e9ee89fd4427d3`

---

## 3. 实现落点（文件变更）

- `index.html`
  - MVP01 增加 Demo 按钮
  - 新增 MVP03 / MVP04 卡片与 Demo 按钮
  - MVP04 Demo URL 更新为 `www.12ll.top` 站内静态路径
  - Hero 区新增 2 个锚点按钮（工具清单 / MVP 成果展示）
  - 顶部「关于我」外链替换为 B 站链接

- `styles.css`
  - MVP Demo 按钮尺寸/样式调整为参考「查看笔记」的小胶囊按钮
  - 按钮定位到卡片右上角，小屏自动降级为静态流布局避免遮挡

- `assets/mini-Tools/image_conv_app.html`
  - 新增/纳入仓库：MVP04 静态小工具页面文件

---

## 4. 验收标准（AC）

- [ ] MVP01 卡片右上角存在「访问DEMO」按钮，点击新开 `https://enter.12ll.top`
- [ ] MVP03 / MVP04 卡片展示正常，且 Demo 按钮可新开对应链接
- [ ] `https://www.12ll.top/assets/mini-Tools/image_conv_app.html` 可访问（无 404）
- [ ] Hero 区新增按钮点击可平滑滚动至 `#tools` 与 `#mvp`
- [ ] 顶部「关于我」点击新开 B 站视频页面

---

## 5. 风险与注意事项

- MVP04 使用自定义域名静态路径访问：需要确保域名已正确指向当前 Vercel 部署且静态资源可被访问
- 外链（Enter / Vercel / Bilibili）可用性受第三方影响；站内内容需保持可读可讲

