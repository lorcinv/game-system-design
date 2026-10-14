# 高级配表

与 [Luban 配表手册](luban.md) 配合使用。这里只在任务涉及相应功能时读取。

## 结构填写

bean 用合并表头圈定列范围，下一级 `##var` 标子字段。list/array/set 按范围读取元素；map 按键值对读取，或用子列名固定键。不可通过复制合并区标题到每格替代合并关系。

`*rewards` 表示多行容器；主记录下一行的主键留空可继续上一条子项，新主键开始新记录。不要把这些空主键补齐或删成空行。保留嵌套层级。`$key` 指 map 键，`$type` 指实际类型，`$value` 圈定内部按流式填写的范围。原子列可留空取默认，未分到子字段的复合列仍按流式读取。[嵌套结构](https://www.datable.cn/docs/excel/nested-and-collections)

## 纵表

全局单例可使用 A1=`##column` 或 `##vertical`：一行一个字段，一列一种元信息/数据。先确认 mode=one 及现有布局，不把普通 key-value 表误转换为纵表。[纵表](https://www.datable.cn/docs/excel/vertical-and-sep)

## 分隔符

字段名 `pos#sep=,` 把该范围按分隔符读为数据流；类型或 bean 上的 sep 影响对应复合值。`(list#sep=|),(Cost#sep=,)` 表示外层列表、内层结构分别分隔。多字符 sep 通常是可用分隔字符集合，不是一个整体字符串；map 的紧凑键值分隔需单独验证。`#`、`&` 作分隔符需按语法转义。流式空字符串用 `""`、空值用 null、空容器用结束标记，不能用缺格代替。[sep](https://www.datable.cn/docs/excel/vertical-and-sep)

## 紧凑格式

`#format=stream/lite/json/lua` 写在 Excel 字段名，不写在 `##type`。stream 使用流式次序；lite 用花括号顺序值，如 `{3,5}`，必须给足字段；json 用属性名；lua 用表表达式。嵌套、空值和转义必须匹配所选格式。json 多态用 `$type`，lua 多态用 `_type_`；lite 多态先给子类名。不要在同一列混用语法。[紧凑格式](https://www.datable.cn/docs/excel/compact)

## 多态

Schema 用 parent 或内嵌 bean 定义继承。配置写可实例化子类名或 alias，再填该子类字段；不填抽象父类名。分列布局使用 `$type`，不属于当前子类的字段留空。类型本身带 `?` 才允许 null。已有类型编号、别名和字段顺序保持稳定。[多态](https://www.datable.cn/docs/schema/polymorphism)、[多态填写](https://www.datable.cn/docs/excel/polymorphism)

## 记录筛选

Excel 数据行首列为记录 tag；JSON/YAML/Lua/XML 数据使用 `__tag__`。`##` 永久忽略记录；`unchecked` 会跳过校验，不作为修错方案。`-e` 排除指定 tag，`-i` 按包含规则筛选，二者互斥；检查无 tag 行的实际结果。group 控制表/字段，tag 控制记录，不能互换。[tag](https://www.datable.cn/docs/quality/tags)

## 变体

字段声明 `variants` 后用 `字段@变体` 列覆盖，位于原字段右侧，继承类型和分组。`--variant Bean全名.字段=en` 指定，`default=en` 作默认；没有目标列时回退原字段。

5.1.0 起 table 可用单数 `variant` 声明同名表的替代定义。按表全名、短名、default 依次选取；未匹配时用无 variant 的 fallback，没有 fallback 则失败。同一变体不能重复定义。表变体是整表定义选择，不合并两份记录；生成类型也可能改变。[变体](https://www.datable.cn/docs/quality/variants)

## 本地化

`text` 存 key。启用 `l10n.provider`，指定 `l10n.textFile.path` 和 key 字段，才会检查文本引用。列表 JSON 文本源使用 `*@file.json`。静态替换另指定语言列和 `l10n.convertTextKeyToValue=1`；保留 key 的项目不打开替换。`text-list` 收集待翻译 key。datetime 用 `--timeZone` 固定解释时区，`-t` 仍表示导出目标。[L10N](https://www.datable.cn/docs/quality/l10n)

## 数据源

支持 Excel 族、JSON、XML、YAML、Lua。Excel 用 `Sheet@file.xlsx` 选 Sheet，多 input 可合为逻辑表。JSON/YAML 单记录对象和整文件记录列表的 input 写法不同，列表按 loader 规则使用 `*@`；不要见数组就套到单记录入口。外部编辑器的数据要遵循相同类型、tag、多态约定。Luban 导出的 JSON 不保证可直接当作其 JSON 源重新导入。[其它数据源](https://www.datable.cn/docs/excel/other-sources)

## 模块

类型用全名消除歧义。XML/Excel 定义汇入同一 Schema，不能重复声明同名类型；自动读表头和显式 bean 定义只选一种。多输入表仍按注册的模式验证索引。公共枚举、bean、refgroup 和 constalias 在共同定义层维护。[模块](https://www.datable.cn/docs/schema/import-modules)

## 类型映射

enum/bean 内的 mapper 同时匹配 target 和 codeTarget；type 指向外部类型，bean 还需对应转换函数。外部枚举数值必须一致。目标语言是否支持映射由 CodeTarget 决定，不能因 C# 通过就宣布其它语言可用。[TypeMapper](https://www.datable.cn/docs/schema/type-mapper)

## 生成选项

| 参数 | 用途 |
| --- | --- |
| `--conf`、`-t` | 工程配置、target |
| `-c`、`-d` | 代码生成器、数据生成器，可重复指定 |
| `-s`、`-p` | SchemaCollector、Pipeline |
| `-f` | 未选数据生成器时仍加载数据 |
| `--strict` | 校验失败按错误处理 |
| `-i`、`-e`、`-o` | tag 筛选、指定输出表 |
| `--variant`、`--timeZone` | 变体、时区 |
| `--customTemplateDir` | 自定义模板目录 |
| `--locale`、`--errorFormat` | 错误语言、text/json 诊断 |
| `-x` | 模块扩展参数 |
| `-l`、`-v`、`-w` | 日志配置、详细日志、监视目录 |

`-c/-d` 支持情况以工具版本为准：常见 cs-bin/bin、cs-simple-json/json、Lua、TypeScript、Java、Go、C++、Python；其它目标包括 Rust、Dart、PHP、Godot、Protobuf、FlatBuffers、MsgPack 等。数据格式还包括 JSON、binary、BSON、XML、YAML。代码目标必须和数据格式匹配。[CLI](https://www.datable.cn/docs/reference/cli)、[内置目标](https://www.datable.cn/docs/reference/builtins)

## 扩展参数

`-x key=value` 可按 codeTarget/dataTarget 加前缀覆盖全局值。常用项：outputCodeDir、outputDataDir、outputSaver、pathValidator.rootDir、本地化参数、codeStyle、namingConvention、fileExt、fileEncoding、lineEnding、json.compact。多目标单独设置输出路径，防止覆盖。使用专用生成目录；默认清理旧生成文件的行为不能作用到源文件目录。

`outputSaver=null` 用于无写入校验；schema-json 用于导出机器可读结构。复杂字段修改后以机器 Schema 和实际数据导出核对。`codePostprocess/dataPostprocess` 依赖已注册实现，不是任意脚本名称。[级联选项](https://www.datable.cn/docs/reference/cascading-options)、[Schema JSON](https://www.datable.cn/docs/ai/schema-json)

## 插件

只更换输出语言或数据格式时选 CodeTarget/DataTarget；更换编辑插件时保留同一 Schema 契约。自定义 loader、validator、target、pipeline 需按当前 Luban.Core 接口注册程序集；引用官方源码对应模块，不复制旧版本 DLL 到新版本目录。模板改动使用 customTemplateDir，业务字段不为迁就模板改名。

完全替换配表工具时走 [工具适配](table-adapters.md)，明确替代工具支持的类型和校验能力，不能只改输出扩展名。[Luban 扩展](https://www.datable.cn/docs/extend/plugins)、[模板](https://www.datable.cn/docs/extend/templates)
