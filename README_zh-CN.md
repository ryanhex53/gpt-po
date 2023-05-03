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

**建议使用付费的OpenAI API以提高翻译速度，免费的OpenAI API速度较慢（一分钟3条），且有使用限制。**

## 常见用法

- `gpt-po sync --po <file> --pot <file>` 根据pot文件更新po文件，保留原有翻译
- `gpt-po --po <file>` 翻译指定的po文件到指定的目标语言，默认目标语言是简体中文
- `gpt-po userdict` 修改或查看用户字典
- `gpt-po systemprompt` 修改或查看系统提示词，如果你不确定如何使用，可以不用修改

```
Usage: gpt-po [command] [options]

command tool for translate po files by gpt

Options:
  -V, --version        output the version number
  -h, --help           display help for command

Commands:
  translate [options]  translate po file (default command)
  sync [options]       update po from pot file
  systemprompt         open/edit system prompt
  userdict             open/edit user dictionary
  help [command]       display help for command
```

```
Usage: gpt-po [options]

translate po file (default command)

Options:
  -k, --key <key>        openai api key (env: OPENAI_API_KEY)
  --host <host>          openai api host (env: OPENAI_API_HOST)
  --model <model>        openai model (choices: "gpt-4", "gpt-4-0314", "gpt-4-32k", "gpt-4-32k-0314", "gpt-3.5-turbo", "gpt-3.5-turbo-0301",
                         default: "gpt-3.5-turbo")
  --po <file>            po file path
  -l, --lang <lang>      target language (default: "simplified chinese")
  -o, --output <file>    output file path, overwirte po file by default
  -h, --help             display help for command
```
