# 工具适配

把“业务字段”“工作簿读写工具”“配置生成器”分开。默认生成器是 Luban；Excel 编辑插件、openpyxl、SheetJS 等可以替换读写环节，但不能丢掉 Schema、公式或合并结构。用户指定完整配表工具时切换生成规则。

## 选择

1. 当前用户指定的工具优先。
2. 未指定时，沿用工程现有 Schema 和生成入口。
3. 全新工程没有约定时，使用 `luban`。

```text
python scripts/table_profile.py --list
python scripts/table_profile.py luban
python scripts/table_profile.py unreal-datatable
python scripts/table_profile.py C:/Project/table-profile.json
```

内置配置：Luban；Unreal DataTable；普通 JSON 数据。后两项提供字段映射和接入规则，不表示已安装引擎插件。选定配置后读取其 rules，再调用项目实际校验/导出入口。配置加载器只读取，不执行第三方命令。

## 适配文件

JSON 必须包含 `id`、`rules`、`mapping`、`capabilities`、`validation`、`generation`。可以复制内置 profile 后替换：

- `rules`：本地规则文件或官方说明地址。
- `mapping`：中文字段、英文字段、类型、主键、空值、分组在目标工具里的存放位置。
- `capabilities`：哪些规则由工具执行，哪些需要项目补充校验。
- `validation`：实际校验入口，包含能定位工作表、字段和行的报错方式。
- `generation`：导出入口、输出格式及消费方；脚本使用工程已有文件。

插件只提供编辑能力时，在 generation 中保留原生成器。完全替换工具时，确认引用、容器、枚举、null 和多端分组如何对应；不能声称“兼容 Luban”却只输出平面 JSON。

## Unreal DataTable

CSV 首列默认 `Name` 作为行名，后续表头对应继承 FTableRowBase 的行结构属性。中文字段保留在 Word 字段字典或编辑工作簿，导出 CSV 不带 Luban 元数据行。资源引用按 Unreal 的路径表达式和引号规则处理。实际导入由对应 Unreal 工程完成，检查 RowStruct 匹配、缺列、重复行名及资源解析。

来源：[Epic Data Driven Gameplay Elements](https://dev.epicgames.com/documentation/en-us/unreal-engine/data-driven-gameplay-elements-in-unreal-engine)。

## 普通 JSON

英文字段作为属性名；数值、布尔、字符串、null、数组及对象保持真实类型。中文字段存于独立字典，不混成业务记录。导出形态由消费方决定：数组、id 索引对象或单例。JSON 自身不执行主键、引用、范围或客户端分组规则，必须由项目校验器补上。

## 迁移验证

保留原表副本，先在临时输出目录转换代表数据。检查前导零字符串、长整数、空串/null、重复键、枚举、集合、跨表引用和分端字段。通过目标工具的真实校验及导入后，再替换正式入口。
