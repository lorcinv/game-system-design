# 第三方来源

本仓库的指令、脚本、模板和示例采用 [MIT License](LICENSE)。下列依赖由安装程序下载，源码及二进制未随仓库分发；各自保留原许可证。

| 依赖 | 固定版本 | 许可证 | 用途 |
| --- | --- | --- | --- |
| [Satori](https://github.com/vercel/satori) | 0.47.1 | MPL-2.0 | 界面和文字布局 |
| [ELK.js](https://github.com/kieler/elkjs) | 0.12.0 | EPL-2.0 OR GPL-3.0-or-later | 流程图布局 |
| [resvg-js](https://github.com/thx/resvg-js) | 2.6.2 | MPL-2.0 | SVG 转 PNG |
| [fontTools](https://github.com/fonttools/fonttools) | 4.60.1 | MIT | 读取本机字体 |
| [PyYAML](https://github.com/yaml/pyyaml) | 6.0.3 | MIT | YAML 支持 |
| [python-docx](https://github.com/python-openxml/python-docx) | 1.2.0 | MIT | Word 文档 |
| [lxml](https://github.com/lxml/lxml) | 6.1.3 | BSD-3-Clause | XML 处理 |
| [typing_extensions](https://github.com/python/typing_extensions) | 4.16.0 | PSF-2.0 | Python 类型支持 |
| [openpyxl](https://foss.heptapod.net/openpyxl/openpyxl) | 3.1.5 | MIT | Excel 读取和回归样例 |
| [et_xmlfile](https://foss.heptapod.net/openpyxl/et_xmlfile) | 2.0.0 | MIT | Excel XML 写入 |

Node 传递依赖记录在 [pnpm-lock.yaml](scripts/pnpm-lock.yaml)；Python 版本记录在 [requirements.txt](scripts/requirements.txt)。安装包包含的许可证适用于对应组件。

[Luban](https://github.com/focus-creative-games/luban) 为外部工具，需另行安装。本仓库的 Luban 手册为自行整理的规则摘要，逐节链接官方说明，未打包上游手册或程序。核对版本及来源见 [luban-sources.json](assets/luban-sources.json)。

仓库不包含字体文件。Windows 默认读取本机微软雅黑；其他字体由使用者通过 `--font`、`--bold-font` 指定，按字体自身许可使用。
