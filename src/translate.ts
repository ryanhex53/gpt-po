import * as fs from "fs";
import { GetTextTranslation } from "gettext-parser";
import { ChatCompletionRequestMessageRoleEnum, Configuration, OpenAIApi } from "openai";
import { homedir } from "os";
import { join } from "path";
import * as pkg from "../package.json";
import { compilePo, copyFileIfNotExists, parsePo, printProgress } from "./utils";

let _openai: OpenAIApi;
let _systemprompt: string;
let _userdict: { [key: string]: string };

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
    const systemprompt = join(homedir(), "systemprompt.txt");
    copyFileIfNotExists(systemprompt, join(__dirname, "systemprompt.txt"));
    _systemprompt = fs.readFileSync(systemprompt, "utf-8");
  }
  // load dictionary.json from homedir
  if (!_userdict || force) {
    const userdict = join(homedir(), "dictionary.json");
    copyFileIfNotExists(userdict, join(__dirname, "dictionary.json"));
    _userdict = JSON.parse(fs.readFileSync(userdict, "utf-8"));
  }
  return _openai;
}

export function translate(
  text: string,
  src: string,
  lang: string,
  model: string = "gpt-3.5-turbo",
) {
  const openai = init();
  const dicts = Object.entries(_userdict)
    .map(([k, v]) => [
      { role: <ChatCompletionRequestMessageRoleEnum>"user", content: k },
      { role: <ChatCompletionRequestMessageRoleEnum>"assistant", content: v },
    ])
    .flat();
  return openai.createChatCompletion(
    {
      model,
      temperature: 0.5,
      n: 1,
      messages: [
        { role: "system", content: _systemprompt },
        {
          role: "user",
          content: `Translate incoming ${src} content into ${lang}, only the translated content can be returned, don't ask question.`,
        },
        {
          role: "assistant",
          content: "Sure, Please send me the content that needs to be translated.",
        },
        // add userdict here
        ...dicts,
        { role: "user", content: text },
      ],
    },
    {
      timeout: 20000,
    },
  );
}

export async function translatePo(
  model: string = "gpt-3.5-turbo",
  po: string,
  source: string,
  lang: string,
  output: string,
) {
  const potrans = await parsePo(po);
  const list: Array<GetTextTranslation> = [];
  for (const [ctx, entries] of Object.entries(potrans.translations)) {
    for (const [msgid, trans] of Object.entries(entries)) {
      if (!trans.msgstr[0]) {
        list.push(trans);
      }
    }
  }
  if (list.length == 0) {
    console.log("nothing needs translate");
    return;
  }
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
      const res = await translate(trans.msgid, source, lang, model);
      trans.msgstr[0] = res.data.choices[0].message?.content || trans.msgstr[0];
      modified = true;
      printProgress(i + 1, list.length);
    } catch (error: any) {
      if (error.response) {
        if (error.response.status == 429) {
          // caused by rate limit exceeded, should sleep for 20 seconds.
          err429 = true;
          --i;
        } else {
          console.error(error.response.status);
          // console.log(error.response.data);
        }
      } else {
        console.error(error.message);
      }
    }
  }
  if (modified) {
    potrans.headers["Last-Translator"] = `gpt-po v${pkg.version}`;
    await compilePo(potrans, output || po);
  }
}
