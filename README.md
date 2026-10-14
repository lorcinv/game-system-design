# 系统策划 Skill

面向游戏系统设计的中文技能：读取现有文档、配置表和界面，编写或修订可直接使用的系统策划案。

A Chinese-first game system design skill with Word templates, SVG rendering, and Luban configuration rules.

## 能做什么

- **规则编写**：明确触发条件、操作和结果，标题按单一主题组织，删除空话和制作过程说明。
- **Word 文档**：保留用户样式和原图；原生标题、目录、章节引用；标题无项目符号，正文和表格默认 12 磅。
- **字段字典**：Word 只列“中文字段、英文字段”，完整字段表默认集中在文末，正文链接到相应章节。
- **配置表**：内置 Luban 5.x 常用及高级规则；通过 profile 接入其他工具，附 Unreal DataTable、普通 JSON 适配示例。
- **补充配图**：使用 Satori、ELK.js、resvg-js 生成 SVG、PNG 和布局报告，不依赖特定模型。已有图片优先复用。

## 安装

把仓库克隆到技能目录。Codex 默认目录为 `~/.codex/skills`；自定义 `CODEX_HOME` 时使用其下的 `skills`。

Windows PowerShell：

```powershell
git clone https://github.com/lorcinv/game-system-design.git "$env:USERPROFILE\.codex\skills\game-system-design"
```

macOS / Linux：

```bash
git clone https://github.com/lorcinv/game-system-design.git ~/.codex/skills/game-system-design
```

已有同名技能时先保存自己的修改。其他支持 `SKILL.md` 的代理可将整个文件夹放入其技能目录。

## 使用

在对话中指定技能、资料和交付要求，例如：

```text
使用 $game-system-design，读取项目里的装备系统文档和配置表，
修订功能规则，沿用原图和标题样式，输出 Word。
```

```text
使用 $game-system-design，检查奖励配置表的字段、引用和空值规则，
按现有 Luban 生成入口验证，保留原业务数据。
```

技能入口为 [SKILL.md](SKILL.md)。只使用写作规则时不需要安装脚本依赖。

## 脚本环境

需要 Python 3.10+、Node.js 22.13+ 和 pnpm 11.25.0。Word 的域刷新及 PDF 导出另需 Windows 桌面版 Microsoft Word；Luban 验证另需 Luban 5.x 和与其版本匹配的 .NET 运行时。

在技能目录执行：

```text
python scripts/setup.py
```

安装程序锁定依赖版本，默认缓存到 `~/.codex/skill-runtimes/game-system-design`。用 `GAME_SYSTEM_DESIGN_RUNTIME` 可指定其他缓存目录。Node 或 pnpm 不在 PATH 时，使用 `--node`、`--pnpm` 传入路径；pnpm 支持执行文件以及 `.cjs` / `.mjs` 入口。

Windows 默认读取本机微软雅黑。其他环境需提供含中文字形的字体；支持 TrueType 字体文件和字体集合的首个字体：

```text
python scripts/setup.py --font /path/to/regular.ttf --bold-font /path/to/bold.ttf
```

仓库不分发字体。文档字体沿用输入文件或模板；更换绘图字体不会自动改写 Word 样式。

## 运行示例

```text
node scripts/draw.mjs evals/ui.json output/ui
node scripts/draw.mjs evals/flow.json output/flow
python scripts/table_profile.py --list
python scripts/table_profile.py luban
python -B scripts/self_test.py --out output/smoke
```

回归脚本生成示例文档 `output/smoke/document.docx`，检查绘图、字号、两列字段表和章节引用，并验证错误输入会被拒绝。

Word 刷新示例文档的目录和引用，并导出 PDF：

```powershell
powershell -NoProfile -File scripts/refresh_word.ps1 -Docx output/smoke/document.docx -Pdf output/smoke/document.pdf
```

Luban 使用独立样例实际生成客户端、服务端数据，并检查引用、重复键、范围和枚举错误。输出目录需为空或不存在：

```text
python -B scripts/test_luban.py --luban /path/to/Luban.dll --out output/luban
```

Word 生成数据格式见 [document.json](evals/document.json)，新增图格式见 [绘图规范](references/drawing.md)。`build_doc.py` 用于新建文档；修改现有文档时按 [文档格式](references/word.md) 保留原件结构和图片。现有原图无需布局报告。

## 目录

| 路径 | 内容 |
| --- | --- |
| `SKILL.md` | 技能入口 |
| `references/` | 写作、Word、绘图、Luban 和工具适配规则 |
| `assets/` | Word 模板、样式参数、表格 profile |
| `scripts/` | 安装、绘图、文档生成和检查脚本 |
| `evals/` | 通用样例和回归用例 |

## 许可证

[MIT License](LICENSE)。第三方工具和字体的来源说明见 [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md)。
