# 文档格式

新建文档使用 [word-template.docx](../assets/word-template.docx)，内置页面设置、标题样式和表格形式。修改已有文档时直接沿用该文档，不能用生成器覆盖原有内容。本次指定模板优先。

| 内容 | 样式与大小 |
| --- | --- |
| 文档标题 | A正文标题，26 磅、加粗 |
| 一级标题 | A正文-1标题，20 磅、加粗，大纲 1 级 |
| 二级标题 | A正文-2标题，14 磅、加粗，大纲 2 级 |
| 三级标题 | A正文-3标题，14 磅、加粗，大纲 3 级 |
| 正文 | A正文，12 磅；中文微软雅黑，西文沿用 Times New Roman |
| 表格、图注、页码 | 12 磅，不缩小以塞入一页 |

A4，边距与行距保留模板值，见 [style-profile.json](../assets/style-profile.json)。表格浅灰表头、黑字、细灰边线，长表重复表头，不拆分普通数据行。Excel 仍按白底规则处理。

## 标题

标题编号直接写为 `一、概述`、`1.1 入口`、`1.1.1 选择规则`。标题段及继承样式不得含有效项目符号 numPr，也不得以 `•`、`●` 等字符开头。保留 outlineLvl，使自动目录和导航可用。沿用源案标题的分页设置，不额外添加 keepNext、keepLines、pageBreakBefore，避免显示段落控制黑方块；检查分页后用独立分页符处理孤立标题。不要修改 Word 全局显示设置。

长案使用原生 `TOC \o "1-3" \h \z \u` 域；内部引用以稳定书签和 REF 域连接标题，目录页码在最终 Word 中刷新。目录和正文中的错误引用、空目录、未刷新占位文字必须处理。

## 生成

定位运行环境的 Python、Node 和 pnpm，第一次运行 `python scripts/setup.py`；不在 PATH 时用 `--node <node路径>`、`--pnpm <pnpm执行文件或JS入口路径>` 指定。依赖装入用户级独立缓存，不写进项目或托管运行时。已安装可直接使用。

```text
python scripts/build_doc.py spec.json output.docx
python scripts/check_docx.py output.docx
powershell -NoProfile -File scripts/refresh_word.ps1 -Docx output.docx -Pdf output.pdf
```

新建文档数据结构参考 [document.json](../evals/document.json)：标题、可选 revision、toc 和 blocks。块支持 heading、paragraph、table、field_table、figure、pagebreak；段落可含 `{"ref":"章节id"}`。字段表用 `{"type":"field_table","rows":[["物品编号","id"]]}`，生成器固定输出两列表头。新增图引用同目录 PNG，并读取旁边同名 `.layout.json` 验证插入后文字大小。

修改已有文档时保留图片关系和原图内容；需要跨文档复用时从原件提取图片，按原比例插入。原图不伪造 `.layout.json`，也不因缺少该报告而改画。原图修订及补图范围按 [配图](drawing.md) 处理。

`check_docx.py` 检查继承样式、标题编号、字体大小、内部引用和禁用措辞，不代替分页检查。刷新域后再次检查，再用环境中的文档工具渲染并逐页查看目录、标题、图片和跨页表格。Word 不可用时保留可更新域，并在交付说明中如实说明尚未刷新；不得宣称页面已验证。
