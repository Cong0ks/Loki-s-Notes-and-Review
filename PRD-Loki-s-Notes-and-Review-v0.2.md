# 产品需求文档（PRD）：Loki''s Notes and Review - V0.2

> 本文档记录 V0.1 完成后新增/调整的需求与实现要点。

## 1. 版本信息
- 上一版本：`PRD-Loki-s-Notes-and-Review-v0.1.md`
- 当前版本：V0.2
- 目标：在不改变站点主结构（时间线 -> 工具清单 -> MVP）前提下，完善 Hero 主视觉与工具清单卡片的信息密度/可用性。

## 2. 需求变更（相对 V0.1）

### 2.1 Hero 主视觉替换为自定义 Banner
- 变更点：使用用户提供的 `banner.png` 替换 Hero 右侧占位主视觉。
- 资源目录规范：将图片移动到 `assets/images/banner.png` 作为静态资源。
- UI/样式：Hero 图片应铺满容器并保持观感（允许裁切），避免变形。

验收标准：
- GIVEN 用户打开首页
- THEN Hero 右侧展示 `banner.png`（不再使用 `assets/hero-placeholder.svg`）
- AND 在桌面端/移动端均无明显拉伸变形（可裁切但不压扁）

### 2.2 工具清单卡片升级：名称 + 简介 + 涉及笔记 +（可选）外链
- 输入数据源：`ToolsList.txt`（工具官网对应表：名称/简介/URL）
- 卡片展示字段（工具区 TOOL）：
  1) 名称
  2) 简介
  3) 涉及笔记：`Day 01, Day 07` 这种格式
- 外链规则：
  - URL != `N/A`：卡片可点击，跳转到 URL
  - URL == `N/A`：不提供超链接（不可点击）
- 跳转行为：所有可跳转链接均应 **新开窗口**（`target="_blank"`），并设置 `rel="noopener noreferrer"`。

验收标准：
- GIVEN 用户滚动到「工具清单」->「工具」
- THEN 每张工具卡都显示名称/简介/涉及笔记
- AND URL 可用的工具卡点击后在新标签页打开
- AND URL 为 `N/A` 的工具卡不可点击

## 3. 实现记录（与代码对应）

### 3.1 文件与目录变更
- 新增目录：`assets/images/`
- 移动文件：`banner.png` -> `assets/images/banner.png`

### 3.2 页面结构变更
- `index.html`
  - Hero 图片引用替换为 `./assets/images/banner.png`
  - 工具清单（TOOL）卡片结构更新：
    - 可链接卡片使用 `<a class="tagCard tagCard--link" ... target="_blank" rel="noopener noreferrer">`
    - 不可链接卡片使用 `<article class="tagCard tagCard--disabled" aria-disabled="true">`
    - 增加简介字段：`<p class="tagCard__desc">...` 
    - “涉及笔记”展示格式：`涉及笔记：Day 01, Day 07`

### 3.3 样式变更
- `styles.css`
  - Hero 图片适配：`.hero__visual img { width:100%; height:100%; object-fit:cover; }`
  - 工具卡片增强：
    - `.tagCard__desc` 用于展示简介（并做 3 行截断）
    - `.tagCard--link` / `.tagCard--disabled` 区分可点击与不可点击状态

## 4. 风险与注意事项
- `ToolsList.txt` 为 GBK 编码：读取与生成 HTML 时需注意编码，最终页面仍保持 UTF-8。
- 工具与 Day 映射：当前基于已确认的 Day01-07 工具使用情况映射；若后续新增/调整 Day 归属，需要同步更新。

## 5. V0.2 不包含（保持不做）
- 不做进阶作业：AI 数字分身对话机器人
- 不公开 PDF 笔记下载入口
- 不做 MVP 在线体验
