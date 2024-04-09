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

- `gpt-po sync --po <file> --pot <file>` 根据pot文件更新po文件，保留原有翻译
- `gpt-po --po <file>` 翻译指定的po文件到指定的目标语言，默认目标语言是简体中文
- `gpt-po --po <file> --lang <lang>` Translate specified po files to a designated target language.
- `gpt-po --dir .` 翻译当前目录下的所有po文件到指定的目标语言，默认目标语言是简体中文
- `gpt-po userdict` 修改或查看用户字典
- `gpt-po userdict --explore` 用于浏览字典目录, 如果你想要增加或修改现有的字典。字典可以按`dictionary-<lang>.json`格式命令, 例如, `dictionary-simplified-chinese.json` 是针对简体中文的字典.
- `gpt-po systemprompt` 修改或查看系统提示词，如果你不确定如何使用，可以不用修改
- `gpt-po systemprompt --reset` 重置系统提示词

```
Usage: gpt-po [options] [command]

command tool for translate po files by gpt

Options:
  -V, --version           output the version number
  -h, --help              display help for command

Commands:
  translate [options]     translate po file (default command)
  sync [options]          update po from pot file
  systemprompt [options]  open/edit system prompt
  userdict [options]      open/edit user dictionary
  remove [options]        remove po entries by options
  help [command]          display help for command
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
  --dir <dir>            po file directory
  -src, --source <lang>  source language (default: "english")
  --verbose              show verbose log
  -l, --lang <lang>      target language (default: "simplified chinese")
  -o, --output <file>    output file path, overwirte po file by default
  -h, --help             display help for command
```

```
Usage: gpt-po remove [options]

remove po entries by options

Options:
  --po <file>                       po file path
  --fuzzy                           remove fuzzy entries
  -obs, --obsolete                  remove obsolete entries
  -ut, --untranslated               remove untranslated entries
  -t, --translated                  remove translated entries
  -tnf, --translated-not-fuzzy      remove translated not fuzzy entries
  -ft, --fuzzy-translated           remove fuzzy translated entries
  -rc, --reference-contains <text>  remove entries whose reference contains text, text can be a regular expression like /text/ig
  -h, --help                        display help for command
```
