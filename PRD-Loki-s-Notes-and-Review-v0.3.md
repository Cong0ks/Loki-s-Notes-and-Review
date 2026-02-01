# 产品需求文档（PRD）：Loki''s Notes and Review - V0.3

> 本文档记录 V0.2 完成后新增/调整的需求与实现要点（特效开关 + 动态 Banner + 动态资源更新）。

## 1. 版本信息
- 上一版本：`PRD-Loki-s-Notes-and-Review-v0.2.md`
- 当前版本：V0.3
- 默认行为：特效默认开启（ON）

## 2. 需求变更（相对 V0.2）

### 2.1 顶部新增「特效 ON/OFF」开关
- 位置：导航栏右侧（靠近 GitHub 按钮区域）
- 文案：`特效：开` / `特效：关`
- 交互：点击切换 ON/OFF
- 状态记忆：使用 `localStorage` 持久化（刷新后保持上次选择）
- 兼容性：
  - 若用户系统开启 `prefers-reduced-motion`，默认关闭特效（除非用户曾手动打开并被记录）

验收标准：
- GIVEN 用户打开页面
- THEN 默认显示 `特效：开`
- WHEN 点击开关
- THEN 文案切换为 `特效：关`，并即时关闭动态效果
- AND 刷新页面后保持上次设置

### 2.2 ON/OFF 控制范围
当特效为 ON：
- 开启网站背景动态效果：粒子特效（Canvas）+ 扫描线
- Hero 主视觉使用动态视频 Banner（WebM）

当特效为 OFF：
- 关闭网站背景动态效果：粒子特效（停止渲染并隐藏 Canvas）+ 扫描线隐藏
- Hero 主视觉退化为静态图片 Banner（PNG）
- 动态视频暂停并重置播放进度（确保关闭后不继续耗资源）

验收标准：
- GIVEN 特效为 OFF
- THEN 页面不再出现扫描线动态
- AND 背景粒子停止（不再渲染/不耗 CPU）
- AND Hero 区显示静态 banner.png

### 2.3 动态 Banner 资源（WebM）接入与更新
- 资源路径：`assets/video/banner.webm`
- 展示方式：Hero 区同时存在 `img`（静态）与 `video`（动态）两层
  - ON：显示 video（并 autoplay muted loop playsinline）
  - OFF：隐藏 video，仅显示 img
- 本版本已更新 `banner.webm` 为新文件版本（覆盖旧版本）

验收标准：
- GIVEN 特效为 ON
- THEN Hero 区播放 `assets/video/banner.webm`
- GIVEN 特效为 OFF
- THEN Hero 区不播放视频，仅显示 `assets/images/banner.png`

## 3. 实现记录（与代码对应）

### 3.1 文件变更
- 新增：`assets/video/banner.webm`
- 更新：`assets/video/banner.webm`（替换为最新版本）

### 3.2 页面结构变更
- `index.html`
  - 导航栏新增按钮：`.nav__fxToggle`
  - Hero 主视觉新增：`<video id="heroVideo">`，并保留 `<img id="heroImage">` 作为静态 fallback
  - 页面顶层保持：`<canvas id="fx">` 与 `.scanlines`（用于动态背景，OFF 时通过 class 隐藏）

### 3.3 样式与状态控制
- `styles.css`
  - 增加 `body.fx-off` 状态：
    - 隐藏 `.fxCanvas`、`.scanlines`
    - 隐藏 `.hero__video`
  - 补充 FX Toggle 按钮样式（保持红黑霓虹体系）

### 3.4 逻辑与持久化
- `script.js`
  - `localStorage` key：`lokiFxEnabled`
  - 切换逻辑：
    - ON：启动粒子渲染、尝试播放视频
    - OFF：停止粒子渲染、暂停视频并重置 currentTime

## 4. 风险与注意事项
- 自动播放限制：部分浏览器可能阻止视频自动播放；由于设置了 `muted`，通常可自动播放，但仍需以实际设备为准。
- 性能：粒子数量已做上限控制；关闭特效应显著降低 CPU/GPU 占用。

## 5. V0.3 不包含（保持不做）
- 进阶作业：AI 数字分身对话机器人
- MVP 在线体验
- PDF 下载/公开
