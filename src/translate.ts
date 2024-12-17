import * as fs from "fs";
import { GetTextTranslation } from "gettext-parser";
import { OpenAI } from "openai";
import { ChatCompletionMessageParam } from "openai/resources/index.mjs";
import path from "path";
import { fileURLToPath } from "url";
import pkg from "../package.json" with { type: "json" };
import {
  CompileOptions,
  compilePo,
  copyFileIfNotExists,
  findConfig,
  parsePo,
  printProgress
} from "./utils.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let _openai: OpenAI;
let _systemprompt: string;
let _userprompt: string;
let _userdict: { [lang: string]: { [key: string]: string } };

export function init(force?: boolean): OpenAI {
  if (!_openai || force) {
    let configuration = {
      apiKey: process.env.OPENAI_API_KEY
    };

    _openai = new OpenAI(configuration);

    if (process.env.OPENAI_API_HOST) {
      _openai.baseURL = process.env.OPENAI_API_HOST.replace(/\/+$/, "") + "/v1";
    }
  }
  // load systemprompt.txt from project
  if (!_systemprompt || force) {
    _systemprompt = fs.readFileSync(path.join(__dirname, "systemprompt.txt"), "utf-8");
  }
  // load userprompt.txt from project
  if (!_userprompt || force) {
    _userprompt = fs.readFileSync(path.join(__dirname, "userprompt.txt"), "utf-8");
  }
  // load dictionary.json from homedir
  if (!_userdict || force) {
    const userdict = findConfig("dictionary.json");
    copyFileIfNotExists(userdict, path.join(__dirname, "dictionary.json"));
    _userdict = { default: JSON.parse(fs.readFileSync(userdict, "utf-8")) };
  }
  return _openai;
}

export async function translate(
  src: string,
  lang: string,
  model: string,
  translations: GetTextTranslation[],
  contextFile: string
) {
  const lang_code = lang
    .toLowerCase()
    .trim()
    .replace(/[\W_]+/g, "-");

  const dicts = Object.entries(_userdict[lang_code] || _userdict["default"]).reduce(
    (acc, [k, v], idx) => {
      if (translations.some((tr) => tr.msgid.toLowerCase().includes(k.toLowerCase()))) {
        acc.user.push(`<translate index="${idx + 1}">${k}</translate>`);
        acc.assistant.push(`<translated index="${idx + 1}">${v}</translated>`);
      }
      return acc;
    },
    { user: <string[]>[], assistant: <string[]>[] }
  );

  const notes = translations
    .reduce((acc: string[], tr) => {
      if (tr.comments?.extracted) {
        acc.push(tr.comments?.extracted);
      }
      return acc;
    }, [])
    .join("\n");

  const context = contextFile ? "\n\nContext: " + fs.readFileSync(contextFile, "utf-8") : "";

  const translationsContent = translations
    .map((tr, idx) => `<translate index="${idx + dicts.user.length + 1}">${tr.msgid}</translate>`)
    .join("\n");

  const res = await _openai.chat.completions.create(
    {
      model: model,
      temperature: 0.1,
      messages: [
        {
          role: "system",
          content: _systemprompt + context
        },
        {
          role: "user",
          content:
            `${_userprompt}\n\nWait for my incoming message in "${src}" and translate it into "${lang}"(a language code and an optional region code). ` +
            notes
        },
        {
          role: "assistant",
          content: `Understood, I will translate your incoming "${src}" message into "${lang}", carefully following guidelines. Please go ahead and send your message for translation.`
        },
        // add userdict
        ...(dicts.user.length > 0
          ? <ChatCompletionMessageParam[]>[
              { role: "user", content: dicts.user.join("\n") },
              { role: "assistant", content: dicts.assistant.join("\n") }
            ]
          : []),
        // add user translations
        {
          role: "user",
          content: translationsContent
        }
      ]
    },
    {
      timeout: 20000,
      stream: false
    }
  );

  const content = res.choices[0].message.content ?? "";
  translations.forEach((trans, idx) => {
    const tag = `<translated index="${idx + dicts.user.length + 1}">`;
    const s = content.indexOf(tag);
    if (s > -1) {
      const e = content.indexOf("</translated>", s);
      trans.msgstr[0] = content.slice(s + tag.length, e);
    } else {
      console.error("Error: Unable to find translation for string [" + trans.msgid + "]");
    }
  });
}

export async function translatePo(
  model: string,
  po: string,
  source: string,
  lang: string,
  verbose: boolean,
  output: string,
  contextFile: string,
  compileOptions?: CompileOptions
) {
  const potrans = await parsePo(po);

  if (!lang) lang = potrans.headers["Language"];

  if (!lang) {
    console.error("No language specified via po file or args");
    return;
  }

  // try to load dictionary by lang-code if it not loaded
  const lang_code = lang
    .toLowerCase()
    .trim()
    .replace(/[\W_]+/g, "-");
  if (!_userdict[lang_code]) {
    const lang_dic_file = findConfig(`dictionary-${lang_code}.json`);
    if (fs.existsSync(lang_dic_file)) {
      _userdict[lang_code] = JSON.parse(fs.readFileSync(lang_dic_file, "utf-8"));
      console.log(`dictionary-${lang_code}.json is loaded.`);
    }
  }
  const list: Array<GetTextTranslation> = [];
  const trimRegx = /(?:^ )|(?: $)/;
  let trimed = false;
  for (const [ctx, entries] of Object.entries(potrans.translations)) {
    for (const [msgid, trans] of Object.entries(entries)) {
      if (msgid == "") continue;
      if (!trans.msgstr[0]) {
        list.push(trans);
        continue;
      } else if (trimRegx.test(trans.msgstr[0])) {
        trimed = true;
        trans.msgstr[0] = trans.msgstr[0].trim();
      }
    }
  }
  if (trimed) {
    await compilePo(potrans, po, compileOptions);
  }
  if (list.length == 0) {
    console.log("done.");
    return;
  }
  potrans.headers["Last-Translator"] = `gpt-po v${pkg.version}`;
  const translations = <GetTextTranslation[]>[];
  let err429 = false;
  for (let i = 0, c = 0; i < list.length; i++) {
    if (i == 0) printProgress(i, list.length);
    if (err429) {
      // sleep for 20 seconds.
      await new Promise((resolve) => setTimeout(resolve, 20000));
    }
    const trans = list[i];
    if (c < 2000) {
      translations.push(trans);
      c += trans.msgid.length;
    }
    if (c >= 2000 || i == list.length - 1) {
      try {
        await translate(source, lang, model, translations, contextFile);
        if (verbose) {
          translations.forEach((trans) => {
            console.log(trans.msgid);
            console.log(trans.msgstr[0]);
          });
        }
        translations.length = 0;
        c = 0;
        // update progress
        printProgress(i + 1, list.length);
        // save po file after each 2000 characters
        await compilePo(potrans, output || po, compileOptions);
      } catch (error: any) {
        if (error.response) {
          if (error.response.status == 429) {
            // caused by rate limit exceeded, should sleep for 20 seconds.
            err429 = true;
            --i;
          } else {
            console.error(error.response.status);
            console.log(error.response.data);
          }
        } else {
          console.error(error.message);
          if (error.code == "ECONNABORTED") {
            console.log('you may need to set "HTTPS_PROXY" to reach openai api.');
          }
        }
      }
    }
  }
  console.log("done.");
}

export async function translatePoDir(
  model: string = "gpt-3.5-turbo",
  dir: string,
  source: string,
  lang: string,
  verbose: boolean,
  contextFile: string,
  compileOptions?: CompileOptions
) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    if (file.endsWith(".po")) {
      const po = path.join(dir, file);
      console.log(`translating ${po}`);
      await translatePo(model, po, source, lang, verbose, po, contextFile, compileOptions);
    }
  }
}
