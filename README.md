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
- `gpt-po --po <file>` Translate specified po files to a designated target language.
- `gpt-po --po <file> --lang <lang>` Translate specified po files to a designated target language (overriding language specified in po file).
- `gpt-po --dir .` Translate all po files in current directory to a designated target language.
- `gpt-po userdict` Modify or view user dictionaries
- `gpt-po userdict --explore` Explore user dictionaries, if you want add new dictionaries or modify existing dictionaries. dictionaries can be named as `dictionary-<lang>.json`, for example, `dictionary-zh.json` is the dictionary for Simplified Chinese.
- `gpt-po systemprompt` Modify or view system prompts, if you are not sure how to use it, you can leave it alone
- `gpt-po systemprompt --reset` Reset system prompts

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
  --model <model>        openai model (choices: "gpt-4o", "gpt-4-turbo", "gpt-4", "gpt-4-0314", "gpt-4-32k", "gpt-4-32k-0314", "gpt-3.5-turbo", "gpt-3.5-turbo-0301",
                         default: "gpt-4o")
  --po <file>            po file path
  --dir <dir>            po file directory
  -src, --source <lang>  source language (default: "english")
  --verbose              show verbose log
  -l, --lang <lang>      target language (ISO 639-1 code)
  -o, --output <file>    output file path, overwirte po file by default
  --context              context file path (provides additional context to the bot)
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
