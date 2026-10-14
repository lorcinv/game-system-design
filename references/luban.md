# Luban 配表手册

内置基线：Luban 5.x；表变体要求 5.1.0。资料核对日期：2026-10-13。已有工程以实际工具版本和 Schema 为准，不自动升级生成器。本文涵盖常规配表；纵表、复杂结构、变体、本地化、生成参数及扩展规则见 [高级配表](luban-advanced.md)。

## 1. 工程入口

读取 `luban.conf`、表注册、bean/enum 定义及生成脚本。`dataDir` 指向数据目录；`schemaFiles` 收集定义；`targets` 确定导出分组、命名空间和入口类。`input` 相对数据目录解析。不要从文件名猜主键或类型。

新建项目可以采用 `Defines/`、`Datas/` 和独立的生成目录；已有目录沿用原工程。[配置入口](https://www.datable.cn/docs/concepts/luban-conf)

## 2. Excel 表头

默认新建平面表：

| A 列 | B 列 | C 列 | D 列 |
| --- | --- | --- | --- |
| `##comment` | 编号 | 名称 | 价格 |
| `##var` | `id` | `name` | `price` |
| `##type` | `int!` | `string` | `int#range=[0,]` |
| 空 | 101 | 示例物品 | 8 |

需要分端时在数据前加入 `##group` 行。元数据行可换顺序，不能固定认为第 4 或第 5 行一定是数据；多级表头还会出现多行 `##var`。字段名行、中文说明行使用显式标记，避免裸 `##` 的语境歧义。

有效数据 Sheet 的 A1 必须以 `##` 开头。字段名为空或以 `#` 开头的列不导出。数据行首格以 `##` 开头时整行跳过；其它首列内容可能是记录 tag，不能全部当注释。辅助 Sheet 不设有效表头。表仍须在 Schema 登记。[Excel 基础](https://www.datable.cn/docs/excel/basics)

## 3. Schema

两种定义来源可以共存：XML；Excel 的 table、bean、enum 定义表。Excel 文件的真实表头从当前模板读取，不自行猜列名。

`readSchemaFromFile=true` 时由数据表头构建行类型，仍需注册 table；不要再定义同名 bean。值为 false 时字段来自 XML/bean 表，改数据表头不能代替修改 Schema。

最小 XML 登记示例：

```xml
<module name="">
  <table name="TbItem" value="Item" input="Item@Item.xlsx"
         index="id" mode="map" readSchemaFromFile="true"/>
</module>
```

`module` 定命名空间，`enum` 定枚举，`bean` 定复合类型，`var` 定字段，`table` 定输入和索引。table 的 `name/value/input/index/mode/group/output` 分别决定逻辑表、行类型、来源、索引、模式、分组、输出名。字段可带 `group/comment/tags`。`refgroup` 声明多表引用组，`constalias` 声明常量别名。

来源：[XML Schema](https://www.datable.cn/docs/schema/xml-schema)、[Excel Schema](https://www.datable.cn/docs/schema/excel-schema)。

## 4. 表模式

| 模式 | 索引写法 | 行为 |
| --- | --- | --- |
| `map` | `id` | 按单键查找；省略索引时可能使用行类型首字段，新表显式写出 |
| `list` | 空 | 按顺序保存列表，不补造 id |
| `list` | `a+b` | 联合唯一键；不是两个独立键 |
| `list` | `a,b` | 两个独立唯一索引 |
| `one` / `singleton` | 空 | 全局一条记录，可配合纵表 |

联合索引的数据校验和目标语言是否生成对应查询代码是两件事；更换语言时核对生成结果。mode 描述逻辑表及访问方式，不直接规定输出文件外形；本地 5.1 默认 JSON 的 one 表仍导出为单元素数组。[Schema 模式](https://www.datable.cn/docs/schema/excel-schema)

## 5. 类型

| 类型族 | 写法 |
| --- | --- |
| 原子 | `bool`、`byte`、`short`、`int`、`long`、`float`、`double`、`string`、`datetime` |
| 本地化 | `text`，等价于带 text 标签的 string |
| 自定义 | enum/bean 的名称或全名，如 `Quality`、`item.Cost` |
| 容器 | `array,T`、`list,T`、`set,T`、`map,K,V` |
| 可空 | `int?`、`string?`、`Cost?`、`Shape?` |
| 非默认 | `int!`、`string!`、`int?!` |

`!` 拒绝类型默认值，不等于“这一格不能空白”。`int!` 拒绝 0；`int?!` 拒绝 null。容器及其元素、键、值不套用原子可空语法。逗号分隔的嵌套类型用括号明确标签作用范围，例如 `(list#sep=|),(int#ref=TbItem)`。

bool 默认填 true/false，也可填 0/1。本地 5.1 实测不接受中文“是/否”，不将文档中的中文别名直接套入数据。整数保留范围，前导零标识用 string，长整数避免 Excel 精度损失。datetime 写日期时间并明确导出时区；结果为 UTC 秒。[类型](https://www.datable.cn/docs/schema/types)

## 6. 空值

分列限定到原子字段时，空格可以取类型默认值；枚举只有定义了 0 项才可按 0 默认。流式/sep 读取可能跳过空格，不能依赖空白占位：数字写 0，bool 写 false，空字符串写 `""`，可空值写 null。

可空字符串的 null 不等于空串。非多态可空 bean 在流式中使用 `{}` 等存在标记再写字段；多态先给实际子类。不同紧凑格式不可互抄空值写法。[填写语义](https://www.datable.cn/docs/excel/vertical-and-sep)

本地 5.1 默认 JSON 输出会省略值为 null 的字段，数值 0 则保留。核对导出结果时区分“可空字段被省略”和“非空字段丢失”，不能把两者都判作漏列。

## 7. 枚举

Schema 中声明项名、数值、可选 alias。单元格可用合法项名、alias 或数值；保留现有数值，不因显示排序重编号。flags 枚举使用按位组合；别名和分隔符读取定义。enum 的 `unique` 约束数值唯一。[枚举填写](https://www.datable.cn/docs/designer/headers)

## 8. 复合字段

bean 按 Schema 的字段次序和列限定填写。多列字段的合并范围有解析意义，不当成纯排版取消。容器支持横向列、单格紧凑写法和 `*字段名` 多行写法；多级 `##var` 指定子字段。具体示例和 `$type/$value/$key` 见 [高级配表](luban-advanced.md#结构填写)。

## 9. 校验

| 目的 | 写法示例 |
| --- | --- |
| 引用 map 表 | `int#ref=TbItem` |
| 允许默认空引用 | `int#ref=TbItem?`，值 0 跳过 |
| 允许 null 引用 | `int?#ref=TbItem` |
| list 索引引用 | `int#ref=keyName@TbList` |
| 多表引用 | `int#ref=TbA,TbB` 或 refgroup |
| 范围 | `int#range=[1,100]`、`float#range=(0,1]`、`int#range=[1,]` |
| 枚举值集合 | `int#set=1;2;3` |
| 容器长度 | `(list#size=[1,4]),int` |
| 元素索引 | `(list#index=id),Cost` |
| 正则 | `string#regex=^[a-z]+$` |
| 资源路径 | `string#path=unity`，另设 `pathValidator.rootDir` |

`?` 放在类型后和引用表名后意义不同。size 加在容器，不加到元素。path 支持 normal、unity、ue、godot；没有资源根目录不能声称资源校验完成。不得通过删校验或加 `unchecked` 消除错误。[校验器](https://www.datable.cn/docs/quality/validators)

## 10. 分组

`groups` 是项目定义的集合，c/s/e 只是惯用名。字段 `group` 为空时属于所有组；table 为空时采用配置中的默认组。target 选择实际导出的组，不能把 `-t client` 当成字段组名。检查不同端的生成字段，防止只在某一端丢列。[分组](https://www.datable.cn/docs/concepts/groups-targets)

## 11. 生成

优先使用工程现有入口。直接调用的基础形式：

```text
dotnet Luban.dll --conf luban.conf -t all -f --strict -x outputSaver=null
dotnet Luban.dll --conf luban.conf -t client -c cs-simple-json -d json --strict -x outputCodeDir=Generated/Code -x outputDataDir=Generated/Data
```

第一条加载数据并校验，不写生成物；第二条同时生成代码和数据。目录必须专用于生成物，不能指向手写代码或源表目录。多 code/data target 分配独立输出目录。`--help/--version` 的返回值不代替真实校验或生成结果。

5.x 可加 `--errorFormat json` 取得可解析错误；`-c schema-json` 可读取真实类型结构。输出 JSON 不意味着忽略 Schema，仍经过 Luban 校验。完整开关、目标语言及插件扩展见 [高级配表](luban-advanced.md#生成选项)。[命令](https://www.datable.cn/docs/runtime/cli-common)

## 12. 交付

依次核对：源表结构、数据、Schema 注册、目标分组、实际生成物。保留公式及缓存区别；公式结果需要由 Excel 或兼容计算引擎更新。输出数量为零或缺表时不能只看退出码。需要验证游戏加载时，另运行项目的加载入口。

本手册根据官方 5.x 文档整理；版本追踪见 [来源记录](../assets/luban-sources.json)。
