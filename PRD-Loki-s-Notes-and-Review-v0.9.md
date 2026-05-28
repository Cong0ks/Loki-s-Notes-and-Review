# PRD - Loki's Notes and Review v0.9（简历页 + 访问控制 + 导航扩展）

日期：2026-05-28  
负责人：Loki  
目标：新增暗色赛博风个人简历页面，实现加密存储与 Token 访问控制，扩展顶部导航。

---

## 1. 变更摘要（相对 v0.8）

### 1.1 新增个人简历页面
- 新增 `resume.html`：暗色赛博风格（参考 12ll.top 主站设计语言）的个人简历页面
- 采用左侧栏 + 主内容布局，配色沿用霓虹红 #ff2a2a + 极黑背景
- 简历内容包含：个人优势、工作经历、项目经历、社区荣誉、证书等
- 支持 A4 打印适配与响应式布局

### 1.2 访问控制与内容安全
- **Token 门禁**：访问简历页需输入访问密钥，SHA-256 哈希比对验证
- **AES-256-CBC 加密存储**：简历正文以密文形式存放于 `api/resume-enc.json`
- **Vercel Serverless API**：新增 `api/verify.js` 端点，负责 Token 验证与内容解密
- 解密密钥存储于 Vercel 环境变量，GitHub 公开仓库中不可见
- 页面标签不暴露个人信息（显示为通用标题）

### 1.3 顶部导航调整
- 「关于我」链接更新为站内 `./resume.html`，移除旧 B 站视频外链
- 新增「AIGC展厅」导航按钮，指向 B 站个人空间

---

## 2. 链接与入口（当前生效）

### 个人简历
- 入口：顶部导航「关于我」
- URL：`https://www.12ll.top/resume.html`
- 访问方式：输入访问密钥后验证通过方可查看
- 内容解密：前端调用 `/api/verify`，服务端 AES-256-CBC 解密后返回

### AIGC展厅
- 入口：顶部导航「AIGC展厅」
- URL：`https://space.bilibili.com/1190001383`

### MVP01
- 文案：访问DEMO
- URL：`https://enter.12ll.top`

### MVP03
- 文案：访问DEMO
- URL：`https://pr2026-new2.vercel.app/`

### MVP04
- 文案：访问DEMO
- URL：`https://www.12ll.top/assets/mini-Tools/image_conv_app.html`

---

## 3. 实现落点（文件变更）

### 新增文件
- `resume.html` — 简历页面（门禁 UI + 验证逻辑 + 动态内容注入）
- `api/verify.js` — Vercel Serverless 函数（Token 哈希验证 + AES-256-CBC 解密）
- `api/resume-enc.json` — 简历正文密文数据（iv + data）
- `assets/mini-Tools/image_conv_app.html` — MVP04 静态小工具（v0.8 遗留）

### 修改文件
- `index.html`
  - 顶部导航「关于我」链接改为 `./resume.html`
  - 新增「AIGC展厅」导航按钮

### 新增本地文件（不推送）
- `20260528-session-log.md` — 部署日志与配置记录（本地仅存）

---

## 4. 验收标准（AC）

- [ ] 顶部导航「AIGC展厅」点击新开 B 站个人空间
- [ ] 顶部导航「关于我」点击打开 `resume.html`，显示访问密钥输入门禁
- [ ] 输入错误密钥 → 提示"密钥不正确"
- [ ] 输入正确密钥 → API 解密返回简历内容，页面正常展示完整简历
- [ ] 同一浏览器 Session 内刷新页面无需重输密钥
- [ ] 直接访问 `resume.html`（无 Token）→ 显示门禁页面
- [ ] GitHub 公开仓库无法查看简历正文内容
- [ ] Vercel 部署后 `RESUME_ENCRYPT_KEY` 环境变量已配置

---

## 5. 风险与注意事项

- 简历加密密钥需在 Vercel 环境变量中正确配置，否则 API 返回 500
- Token 为固定值，如需轮换需同步更新前端 `TOKEN_HASH` 和后端 `api/verify.js` 中的 hash
- 加密密文更新流程：本地重新加密 → 替换 `api/resume-enc.json` → 提交推送
- 网站依赖 Google Fonts（Orbitron / Noto Sans SC），离线环境下字体降级为系统字体
- 单文件部署由 Vercel 自动触发 GitHub main 分支变更
