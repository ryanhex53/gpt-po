# PO File Translation Tool for ChatGPT

[![NPM version](https://img.shields.io/npm/v/gpt-po.svg)](https://npmjs.org/package/gpt-po)
[![Downloads](https://img.shields.io/npm/dm/gpt-po.svg)](https://npmjs.org/package/gpt-po)

Translation tool for gettext (po) files that supports custom system prompts and user dictionaries. It also supports translating specified po files to a designated target language and updating po files based on pot files.

Read in other languages: English | [简体中文](./README_zh-CN.md)

## Installation

```
npm install gpt-po
```

Set `OPENAI_API_KEY` before using this tool.

**It is recommended to use the paid OpenAI API to improve translation speed, as the free OpenAI API is slower (only 3 translations per minute) and has usage restrictions.**

## Usage Scenarios

- `gpt-po sync --po <file> --pot <file>` Update the po file based on the pot file, while preserving the original translations.
- `gpt-po --po <file>` Translate specified po files to a designated target language. By default, the target language is Simplified Chinese.
- `gpt-po --dir .` Translate all po files in current directory to a designated target language.
- `gpt-po userdict` Modify or view user dictionaries
- `gpt-po systemprompt` Modify or view system prompts, if you are not sure how to use it, you can leave it alone

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
  --dir <dir>            po file directory
  -src, --source <lang>  source language (default: "english")
  --verbose              show verbose log
  -l, --lang <lang>      target language (default: "simplified chinese")
  -o, --output <file>    output file path, overwirte po file by default
  -h, --help             display help for command
```
