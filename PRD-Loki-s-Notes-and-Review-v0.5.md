# PRD - Loki's Notes and Review v0.5（GA 自定义事件埋点）

日期：2026-02-02  
负责人：Loki  
目标：在现有展示站基础上补全 Google Analytics（GA4）埋点，并对“打开对话机器人”这一关键行为上报自定义事件，便于后续分析使用情况。

---

## 1. 变更摘要（相对 v0.4）

### 1.1 已完成
- 在 `index.html` 的 `<head>` 中加入 GA4 `gtag.js` 代码（测量 ID：`G-M9YLLS8ZHN`）
- 增加 GA4 自定义事件：当用户点击右下角悬浮按钮并“打开对话机器人”时上报事件

---

## 2. 自定义事件定义

事件名称：
- `AI_assistant`

触发条件：
- 用户点击右下角悬浮按钮（chat FAB）
- 且聊天面板从“关闭 -> 打开”（仅在打开动作触发，关闭不触发）

事件参数：
- `source`: `fab`
- `action`: `open`

---

## 3. 实现落点（代码位置）

### 3.1 GA4 基础代码
- 文件：`index.html`
- 位置：`<head>` 中（OG meta 后、字体与 CSS 引入前）
- 内容：从 `GA-26-02-03.txt` 拷贝的 Google tag 代码

### 3.2 自定义事件上报
- 文件：`script.js`
- 实现方式：
  - 增加 `trackAiAssistantOpen(source)` 方法
  - 在 `.chatFab` 的 click 事件里判断：若当前未打开，先 `trackAiAssistantOpen('fab')`，再打开面板

---

## 4. 验收标准（AC）

- [ ] 站点上线后 GA4 实时报告可看到页面访问（page_view）
- [ ] 点击右下角悬浮按钮打开聊天面板时，上报 `AI_assistant` 事件
- [ ] 再次点击关闭聊天面板不触发该事件
- [ ] 再次点击打开聊天面板会再次触发该事件

---

## 5. 风险与注意事项

- GA 事件上报不应影响主流程：异常需吞掉（不可阻塞 UI）
- 本地用 `python -m http.server` 仅能验证前端埋点触发，不支持 `/api/chat` 的 POST（会 501），聊天功能需在 Vercel 环境下验证

