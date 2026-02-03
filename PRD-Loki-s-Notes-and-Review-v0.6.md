# PRD - Loki's Notes and Review v0.6（PostHog 接入 + 关键事件）

日期：2026-02-03  
负责人：Loki  
目标：在现有 GA4 埋点基础上接入 PostHog，用于更直观的产品分析；并将“打开对话机器人”作为关键事件同时上报到 PostHog（与 GA4 事件名保持一致，便于对照）。

---

## 1. 变更摘要（相对 v0.5）

### 1.1 已完成
- 接入 PostHog Web SDK（适配本项目：纯静态站，无打包器）
- 初始化 PostHog（US region host）
- 自定义事件 `AI_assistant` 在“点击打开对话机器人”时同时上报到：
  - GA4（原有）
  - PostHog（新增）

---

## 2. 事件定义（保持与 GA4 一致）

事件名称：
- `AI_assistant`

触发条件：
- 用户点击右下角悬浮按钮（chat FAB）
- 且聊天面板从“关闭 -> 打开”（只统计打开动作，关闭不触发）

事件参数：
- `source`: `fab`
- `action`: `open`

---

## 3. 实现方案（纯静态站安装方式）

### 3.1 加载 PostHog SDK

- 文件：`index.html`
- 位置：`<head>` 中
- 方式：脚本引入（无需 npm 安装）
- 脚本：
  - `https://us.i.posthog.com/static/array.js`

说明：
- 使用 `defer`，不阻塞 HTML 渲染
- 脚本加载后提供 `window.posthog`

### 3.2 初始化 PostHog

- 文件：`script.js`
- 初始化逻辑：
  - `posthog.init(POSTHOG_KEY, { api_host: POSTHOG_HOST, autocapture: true })`
- 当前配置：
  - `POSTHOG_HOST = https://us.i.posthog.com`
  - `POSTHOG_KEY = phc_...`（项目 Public API Key）

### 3.3 上报关键事件

- 文件：`script.js`
- 触发点：`.chatFab` 点击事件（且本次是打开聊天面板）
- 上报：
  - `gtag('event', 'AI_assistant', {...})`
  - `posthog.capture('AI_assistant', {...})`

---

## 4. 安全说明

- PostHog 的 Project API Key 为前端公开 key（用于标识项目），放在浏览器端是正常设计
- 必须保密的仍是服务端密钥（例如百炼 `DASHSCOPE_API_KEY`），只能放在 Vercel 环境变量中

---

## 5. 验收标准（AC）

- [ ] 线上环境加载后 PostHog 能收到基础事件（取决于 PostHog 项目设置）
- [ ] 点击右下角按钮打开聊天面板时，PostHog 中可看到 `AI_assistant` 事件
- [ ] 关闭聊天面板不触发该事件
- [ ] PostHog 或网络被拦截时不影响页面功能（埋点失败不阻塞 UI）

---

## 6. 文件变更清单

- `index.html`：新增 PostHog SDK script 引入
- `script.js`：新增 PostHog 初始化 + 在关键事件处 `posthog.capture`

