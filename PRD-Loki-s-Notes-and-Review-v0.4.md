# PRD - Loki's Notes and Review v0.4（进阶作业：AI 数字分身）

日期：2026-02-02  
负责人：Loki  
目标：在现有展示站（基础作业已完成）的基础上，完成进阶作业：植入一个“懂项目、有风格”的对话机器人，同时确保 **百炼 API Key 不暴露在浏览器**。

---

## 1. 背景与目标

### 1.1 作业要求（进阶版）
- 页面中添加对话框，接入大模型 API
- 编写 System Prompt（项目背景 + 个人简介 + 拟人化语气），支持多轮对话
- AI 能代替你回答关于项目/学习内容/工具链的问题
- 交付：包含 AI 对话功能的 Vercel 链接 + 独特对话截图

### 1.2 本版本目标（v0.4）
- 加一个右下角悬浮入口，打开嵌入式聊天窗（不跳页）
- 前端可配置：
  - 代理 API 地址（默认 `/api/chat`）
  - System Prompt（人设）
  - 管理员口令（仅自己可用）
- 后端（Vercel Serverless）代理调用百炼，API Key 永远在服务端环境变量里

---

## 2. 范围（Scope）

### 2.1 In Scope
- 聊天 UI：悬浮按钮 + 聊天面板（消息区/输入区/发送/关闭）
- 设置面板：API 地址 / 管理员口令 / System Prompt（本地保存）
- 多轮对话：前端保存最近对话，随请求一起发给后端拼 prompt
- 服务端代理：`/api/chat` 校验口令 -> 转发到百炼 Apps Completion -> 返回文本

### 2.2 Out of Scope（本版不做）
- 知识库/检索增强（RAG）
- Supabase Auth 正规登录鉴权
- 多用户、权限管理、用量统计、付费
- 流式输出（Streaming）

---

## 3. 用户与使用场景

### 用户
- 仅自己（Loki）用于交作业与展示

### 典型场景
- 同学/老师问：你这几天学了什么？你用过哪些工具？你的 MVP 是什么？你怎么从点子到产品？
- Loki 打开网页，点击右下角按钮，让 AI 用“Loki 的口吻”回答并演示多轮对话

---

## 4. 功能需求（FR）

### FR-1 悬浮入口
- 页面右下角常驻悬浮按钮
- 点击后打开聊天面板；再次点击或点关闭按钮可关闭

### FR-2 聊天面板
- 消息列表：区分“你 / Loki AI”
- 输入框：Enter 发送，Shift+Enter 换行
- 发送中状态：显示“正在思考…”
- 错误提示：失败时显示可读错误（不泄露密钥）

### FR-3 设置面板（前端）
- 可展开/收起
- 字段：
  - 代理 API 地址（默认 `/api/chat`）
  - 管理员口令（用于调用后端时鉴权）
  - System Prompt（人设）
- 存储策略：
  - API 地址、System Prompt：`localStorage`
  - 管理员口令：`sessionStorage`（不长期落盘）

### FR-4 后端代理 `/api/chat`
- 仅支持 `POST`
- 鉴权：
  - 从 Header `x-chat-admin-password` 获取口令，与环境变量 `CHAT_ADMIN_PASSWORD` 对比
  - 不通过返回 401
- 转发：
  - 目标接口：`POST https://dashscope.aliyuncs.com/api/v1/apps/{BAILIAN_APP_ID}/completion`
  - Header：`Authorization: Bearer ${DASHSCOPE_API_KEY}`
  - Body：`{ input: { prompt }, parameters: {}, debug: {} }`
  - 解析返回 `output.text` 给前端

---

## 5. 安全与合规（关键）

- **不在浏览器保存/填写百炼 API Key**
- API Key 与 AppId 只通过 Vercel 环境变量注入到 Serverless Function
- 管理员口令用于“仅自己可用”的最小访问控制（适合交作业，后续可升级 Supabase Auth）

---

## 6. 验收标准（AC）

- [ ] 页面右下角出现悬浮按钮，点击打开聊天窗，关闭正常
- [ ] 设置面板可保存 API 地址、System Prompt，刷新后仍生效
- [ ] 未填写口令时无法调用（提示去设置）
- [ ] 填写正确口令后可正常与百炼对话，至少支持 3 轮
- [ ] 浏览器端代码中不存在 `DASHSCOPE_API_KEY`（仅在 Vercel 环境变量中）

---

## 7. 部署说明（Vercel 手把手）

1) 确保 GitHub 仓库包含：
   - `index.html / styles.css / script.js`
   - `api/chat.js`
2) Vercel 控制台 -> 进入该项目 -> `Settings` -> `Environment Variables` 添加：
   - `CHAT_ADMIN_PASSWORD`
   - `DASHSCOPE_API_KEY`
   - `BAILIAN_APP_ID`
   环境选择 `Production`（也可同时勾选 Preview）
3) 触发重新部署：
   - 最简单：推送一次 commit 到 GitHub（Vercel 会自动构建）
4) 打开线上链接验证：
   - 右下角打开聊天窗 -> 设置口令 + System Prompt -> 发送消息验证

---

## 8. 文件变更（实现落点）

- 前端：`index.html`（聊天组件 DOM）、`styles.css`（聊天样式）、`script.js`（聊天逻辑）
- 后端：`api/chat.js`（Vercel Serverless 代理）
- 素材：`assets/images/chat-fab.svg`（悬浮按钮占位图，可替换）

