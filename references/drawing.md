# 配图

## 原图优先

先提取原文件的图片并查看实际画面，记录它对应的章节和功能。存在多份版本时，优先用户当前编辑的文件，逐张比对图片，不能只比较文字。已有图直接复用，按图中的位置、名称、编号展开说明；不为统一风格重画，不用自制示意图替换原图。原图没有编号时用区域名称，不虚构编号。原图中的示例数值不能直接当成配置规则。

原图没有覆盖、且正文确实需要图示的部分才补图。图中的规则与已确认正文冲突时，在对话中指出具体冲突；确认后只更新相关文字和必要连线，保留原布局，不另做一套界面。工作记录保留来源及修改范围，策划正文不增加制作过程说明。

原图保持比例和清晰度；重要信息在正文用正常字号说明。原图不要求 SVG 或布局报告，也不为通过字号检查重绘原图。以下脚本和尺寸要求适用于新增图及可编辑的图形重制。

## 通用 SVG 绘图

模型填写图形数据，脚本负责布局、文字换行、连线和导出。界面图使用 Satori；流程与关系图使用 ELK 自动布局；resvg 将同一 SVG 转成 PNG。与模型名称无关，不需要网页项目或 Figma。

```text
node scripts/draw.mjs ui.json output/界面
node scripts/draw.mjs flow.json output/流程
```

首次运行先按 [Word 指引](word.md)安装依赖。`GAME_SYSTEM_DESIGN_RUNTIME` 可指定独立缓存；默认 `~/.codex/skill-runtimes/game-system-design`。字体读取本机微软雅黑并在本机缓存提取后的字体，不随技能分发字体文件。其他环境可用 `setup.py --font 字体文件 --bold-font 加粗字体文件` 提供项目字体。

## 界面数据

顶层 `kind: "ui"`、`width`、`title`、`root`；默认宽 960，高度随内容增长。`height` 只在需要固定画布时设置，越界直接报错。

`root` 为组件树。支持 `column`、`row`、`grid`、`panel`、`text`、`button`、`tabs`、`table`、`spacer`。容器使用 `children`；grid 使用 `columns`；文字使用 `text`；tabs 使用 `items` / `selected`；table 使用 `headers` / `rows`。组件可设 `width`、`height`、`gap`、`padding`、`fontSize`、`callout`。使用 [ui.json](../evals/ui.json) 修改内容，不从零堆坐标。

同一张图的 callout 不重复。红圈编号放在区域标题旁，与正文“编号名称｜说明”对应。默认灰阶界面，选中项加深边框，禁止装饰性小字和无关图标。图内不放长规则。

## 流程数据

`kind: "flow"`，`direction: "DOWN"` 或 `"RIGHT"`；`nodes: [{id,text,width?}]`；`edges: [{from,to,label?}]`。节点和边由 ELK 布局，编号必须唯一，边端点必须存在。分支条件直接写在边的 label。示例见 [flow.json](../evals/flow.json)。

## 输出与尺寸

新增图输出 `.svg`、`.png`、`.layout.json`。SVG 保留文字，PNG 使用同一字体；布局报告保存大小、最小字号、区域边界和编号。默认图内 26 px，按 17 cm 插入 Word 时不低于 12 磅。画布过宽会要求拆图或增大字体，不自动缩小文字。

检查图的实际预览，再检查 Word 中的最终插入尺寸；不能只检查原始 SVG 字号。旧坐标脚本已由组件树替代，旧 JSON 要转为本格式。

## 开源来源

- [Satori 0.47.1](https://github.com/vercel/satori/tree/0.47.1)：组件与文本布局，MPL-2.0。
- [ELK.js 0.12.0](https://github.com/kieler/elkjs/releases/tag/0.12.0)：图布局，EPL-2.0 / GPL-3.0-or-later。
- [resvg-js 2.6.2](https://github.com/thx/resvg-js/tree/v2.6.2)：SVG 转 PNG，MPL-2.0。

版本和依赖锁在 scripts/package.json、pnpm-lock.yaml；调用原包，不复制上游实现。依赖中的许可证随包保留。
