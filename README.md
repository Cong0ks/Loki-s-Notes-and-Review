# Loki's Notes and Review

暗色赛博 + 霓虹红风格的课程毕业展示站（基础作业 + 进阶作业）。

在线内容包含：
- 学习时间线（Day 01 - Day 07）：方法论、工具、下一步行动 + “查看笔记”外链
- 工具清单：工具卡片（名称 / 简介 / 涉及笔记）+ 可点击外链（新开窗口）
- MVP 成果展示：两个示例 MVP 的痛点 / 范围 / 下一步迭代
- 特效开关：粒子背景 + 扫描线 + Hero 动态 Banner（默认开，可关闭）
- 进阶作业：右下角 AI 数字分身（百炼），通过 Vercel Serverless 代理调用（不暴露 API Key）

---

## 本地预览

### 仅预览静态页面（不含聊天后端）

方式 1：直接用浏览器打开 `index.html`

方式 2：启动静态服务：

```powershell
python -m http.server 8000
```

然后访问 `http://localhost:8000`。

注意：Python 的静态服务不支持 `POST /api/chat`，因此本地用它测试聊天会报 `501 Unsupported method`（这是正常的）。

---

## 部署到 Vercel（含聊天 /api/chat）

### 1) 环境变量

在 Vercel 项目里设置（Production，建议 Preview 也一起勾选）：
- `CHAT_ADMIN_PASSWORD`：仅自己使用的管理员口令（前端会通过 Header 发送给后端校验）
- `DASHSCOPE_API_KEY`：阿里云百炼 DashScope Key（只放服务端，浏览器拿不到）
- `BAILIAN_APP_ID`：百炼应用 AppId

### 2) 发布

推送到 GitHub 后，Vercel 会自动部署。

---

## 进阶作业（AI 数字分身）说明

实现路线：Vercel Serverless 代理 + 本地口令（最快交付，满足“Key 不暴露”）。

- 前端设置面板里可配置：
  - 代理 API 地址（默认 `/api/chat`）
  - 管理员口令（保存在 `sessionStorage`）
  - System Prompt（人设，保存在 `localStorage`）
- 后端代理：`api/chat.js`
  - 校验 `x-chat-admin-password`
  - 转发到百炼 Apps Completion：`/api/v1/apps/{BAILIAN_APP_ID}/completion`
  - 返回 `output.text`

---

## 目录结构（关键文件）

- `index.html`：单页站点结构（Hero / Timeline / Tools / MVP / Chat）
- `styles.css`：整体视觉与响应式 + 聊天组件样式
- `script.js`：特效开关、粒子背景、滚动 reveal、聊天逻辑
- `api/chat.js`：Vercel Serverless Function（百炼代理）
- `assets/images/banner.png`：Hero 静态 Banner
- `assets/video/banner.webm`：Hero 动态 Banner
- `assets/images/chat-fab.svg`：聊天悬浮按钮占位图（可替换）
- `PRD-Loki-s-Notes-and-Review-v0.1.md`：基础版 PRD
- `PRD-Loki-s-Notes-and-Review-v0.4.md`：进阶版 PRD（AI 数字分身）

---

## 版权与署名

`© 2026 Loki`

