# PO文件CHATGPT翻译工具

[![NPM version](https://img.shields.io/npm/v/gpt-po.svg)](https://npmjs.org/package/gpt-po)
[![Downloads](https://img.shields.io/npm/dm/gpt-po.svg)](https://npmjs.org/package/gpt-po)

gettext(po)文件翻译工具，支持自定义系统提示词和用户字典，支持翻译指定的po文件到指定的目标语言，支持根据pot文件更新po文件。

使用其他语言阅读：[English](./README.md) | 简体中文

## 安装

```
npm install gpt-po
```

使用此工具前先设置 `OPENAI_API_KEY`，Windows中使用 `set OPENAI_API_KEY=<key>`, Linux中 `export OPENAI_API_KEY=<key>`

**建议使用付费的OpenAI API以提高翻译速度，免费的OpenAI API速度较慢（一分钟3条一天200条），且有使用限制。**

*国内用户要设置`HTTPS_PROXY`环境变量上梯子才能用*

## 常见用法

- `gpt-po sync --po <file> --pot <file>` 根据 pot 文件更新 po 文件，同时保留原有翻译。
- `gpt-po --po <file>` 将指定的 po 文件翻译成目标语言。
- `gpt-po --po <file> --lang <lang>` 将指定的 po 文件翻译成目标语言（覆盖 po 文件中指定的语言）。
- `gpt-po --dir .` 将当前目录下的所有 po 文件翻译成目标语言。
- `gpt-po userdict` 修改或查看用户词典。
- `gpt-po userdict --explore` 浏览用户词典，如果您想添加新词典或修改现有词典，词典可以命名为 `dictionary-<lang>.json`，例如 `dictionary-zh.json` 是简体中文词典。
- `gpt-po systemprompt` 修改或查看系统提示，如果您不确定如何使用它，可以忽略。
- `gpt-po systemprompt --reset` 重置系统提示。

```
用法: gpt-po [options] [command]

通过 gpt 翻译 po 文件的命令工具

选项:
  -V, --version           输出版本号
  -h, --help              显示命令帮助

命令:
  translate [options]     翻译 po 文件（默认命令）
  sync [options]          根据 pot 文件更新 po 文件
  systemprompt [options]  打开/编辑系统提示
  userdict [options]      打开/编辑用户词典
  remove [options]        通过选项删除 po 条目
  help [command]          显示命令帮助
```

```
用法: gpt-po [options]

翻译 po 文件（默认命令）

选项:
  -k, --key <key>        openai api key (环境变量: OPENAI_API_KEY)
  --host <host>          openai api host (环境变量: OPENAI_API_HOST)
  --model <model>        openai 模型 (选项: "gpt-4o", "gpt-4-turbo", "gpt-4", "gpt-4-0314", "gpt-4-32k", "gpt-4-32k-0314", "gpt-3.5-turbo", "gpt-3.5-turbo-0301", 默认: "gpt-4o")
  --po <file>            po 文件路径
  --dir <dir>            po 文件目录
  -src, --source <lang>  源语言 (默认: "english")
  --verbose              显示详细日志
  -l, --lang <lang>      目标语言 (ISO 639-1 代码)
  -o, --output <file>    输出文件路径，默认覆盖 po 文件
  --context              上下文文件路径（为机器人提供额外的上下文）
  -h, --help             显示命令帮助
```

```
用法: gpt-po remove [options]

通过选项删除 po 条目

选项:
  --po <file>                       po 文件路径
  --fuzzy                           删除模糊条目
  -obs, --obsolete                  删除过时条目
  -ut, --untranslated               删除未翻译条目
  -t, --translated                  删除已翻译条目
  -tnf, --translated-not-fuzzy      删除已翻译但不是模糊的条目
  -ft, --fuzzy-translated           删除模糊翻译条目
  -rc, --reference-contains <text>  删除引用包含文本的条目，文本可以是正则表达式，例如 /text/ig
  -h, --help                        显示命令帮助
```
