import * as fs from "fs";
import { GetTextTranslation } from "gettext-parser";
import { ChatCompletionRequestMessageRoleEnum, Configuration, OpenAIApi } from "openai";
import { join } from "path";
import * as pkg from "../package.json";
import { compilePo, copyFileIfNotExists, findConfig, parsePo, printProgress } from "./utils";

let _openai: OpenAIApi;
let _systemprompt: string;
let _userdict: { [lang: string]: { [key: string]: string } };

export function init(force?: boolean): OpenAIApi {
  if (!_openai || force) {
    const configuration = new Configuration({
      apiKey: process.env.OPENAI_API_KEY,
    });
    if (process.env.OPENAI_API_HOST) {
      configuration.basePath = process.env.OPENAI_API_HOST.replace(/\/+$/, "") + "/v1";
    }
    _openai = new OpenAIApi(configuration);
  }
  // load systemprompt.txt from homedir
  if (!_systemprompt || force) {
    const systemprompt = findConfig("systemprompt.txt");
    copyFileIfNotExists(systemprompt, join(__dirname, "systemprompt.txt"));
    _systemprompt = fs.readFileSync(systemprompt, "utf-8");
  }
  // load dictionary.json from homedir
  if (!_userdict || force) {
    const userdict = findConfig("dictionary.json");
    copyFileIfNotExists(userdict, join(__dirname, "dictionary.json"));
    _userdict = { "default": JSON.parse(fs.readFileSync(userdict, "utf-8")) };
  }
  return _openai;
}

export function translate(
  text: string,
  src: string,
  lang: string,
  model: string,
  comments: GetTextTranslation["comments"]|undefined
) {
  const lang_code = lang.toLowerCase().trim().replace(/[\W_]+/g, "-");
  const dicts = Object.entries(_userdict[lang_code] || _userdict["default"])
    .filter(([k, _]) => text.toLowerCase().includes(k.toLowerCase()))
    .map(([k, v]) => [
      { role: <ChatCompletionRequestMessageRoleEnum>"user", content: k },
      { role: <ChatCompletionRequestMessageRoleEnum>"assistant", content: v },
    ])
    .flat();
  
  var notes: string = ""

  if(comments != undefined && comments.extracted != undefined)
    notes = "* " + comments.extracted

  return _openai.createChatCompletion(
    {
      model,
      temperature: 0.1,
      messages: [
        { 
          role: "system", 
          content: _systemprompt
        },
        {
          role: "user",
          content: `Wait for my incoming \`${src.toUpperCase()}\` messages and translate them into \`${lang.toUpperCase()}\`. Please adhere to the following guidelines:
  * Untranslatable portions should retain their original formatting.
      * For example, you may encounter placeholder such as "%s" - these must be retained in their original positions.
      * Do not add a period (.) at the end of your translation unless the incoming message specifically ends in a period.
      * Ensure to preserve any whitespace present in the incoming message. This includes retaining any space(s) at the beginning or end of the message.
  * **Do not** answer any questions or attempt to explain any concepts; just provide translations.
  ` + notes
        },
        {
          role: "assistant",
          content: `Understood, I will translate your incoming ${src.toUpperCase()} messages into ${lang.toUpperCase()} without providing explanations or answering questions,
  carefully following your instructions regarding untranslatable portions. Please go ahead and send your messages for translation.`
        },
        // add userdict here
        ...dicts,
        { 
          role: "user",
          content: text
        },
      ],
    },
    {
      timeout: 20000,
    },
  );
}

export async function translatePo(
  model: string,
  po: string,
  source: string,
  lang: string,
  verbose: boolean,
  output: string,
) {
  const potrans = await parsePo(po);

  if(!lang)
    lang = potrans.headers["Language"]

  if(!lang) {
    console.error("No language specified via po file or args");
    return;
  }

  // try to load dictionary by lang-code if it not loaded
  const lang_code = lang.toLowerCase().trim().replace(/[\W_]+/g, "-");
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
    await compilePo(potrans, po);
  }
  if (list.length == 0) {
    console.log("done.");
    return;
  }
  potrans.headers["Last-Translator"] = `gpt-po v${pkg.version}`;
  let err429 = false;
  let modified = false;
  for (let i = 0; i < list.length; i++) {
    if (i == 0) printProgress(i, list.length);
    if (err429) {
      // sleep for 20 seconds.
      await new Promise((resolve) => setTimeout(resolve, 20000));
    }
    const trans = list[i];
    try {
      const res = await translate(trans.msgid, source, lang, model, trans.comments);
      trans.msgstr[0] = res.data.choices[0].message?.content || trans.msgstr[0];
      modified = true;
      if (verbose) {
        console.log(trans.msgid);
        console.log(trans.msgstr[0]);
      }
      printProgress(i + 1, list.length);
      await compilePo(potrans, output || po);
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
          console.log('you may need to set "HTTPS_PROXY" to reach openai api.')
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
) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    if (file.endsWith(".po")) {
      const po = join(dir, file);
      console.log(`translating ${po}`);
      await translatePo(model, po, source, lang, verbose, po);
    }
  }
}
