#!/usr/bin/env node

import { Command, Option } from "commander";
import { homedir } from "os";
import { join } from "path";
import * as pkg from "../package.json";
import { sync } from "./sync";
import { translatePo } from "./translate";
import { copyFileIfNotExists, openFileByDefault } from "./utils";

const program = new Command();

program.name(pkg.name).version(pkg.version).description(pkg.description);

program
  .command("translate", { isDefault: true })
  .description("translate po file (default command)")
  .addOption(new Option("-k, --key <key>", "openai api key").env("OPENAI_API_KEY"))
  .addOption(new Option("--host <host>", "openai api host").env("OPENAI_API_HOST"))
  .addOption(
    new Option("--model <model>", "openai model")
      .default("gpt-3.5-turbo")
      .choices([
        "gpt-4",
        "gpt-4-0314",
        "gpt-4-32k",
        "gpt-4-32k-0314",
        "gpt-3.5-turbo",
        "gpt-3.5-turbo-0301",
      ]),
  )
  .requiredOption("--po <file>", "po file path")
  .option("-src, --source <lang>", "source language", "english")
  .requiredOption("-l, --lang <lang>", "target language", "simplified chinese")
  .option("-o, --output <file>", "output file path, overwirte po file by default")
  .action(async ({ key, host, model, po, source, lang, output }) => {
    if (host) {
      process.env.OPENAI_API_HOST = host;
    }
    if (key) {
      process.env.OPENAI_API_KEY = key;
    }
    await translatePo(model, po, source, lang, output);
  });

program
  .command("sync")
  .description("update po from pot file")
  .requiredOption("--po <file>", "po file path")
  .requiredOption("--pot <file>", "pot file path")
  .action(async ({ po, pot }) => {
    await sync(po, pot);
  });

// program command `systemprompt` with help text `open/edit system prompt`
program
  .command("systemprompt")
  .description("open/edit system prompt")
  .action(() => {
    // open `systemprompt.txt` file by system text default editor
    const copyFile = __dirname + "/systemprompt.txt";
    // user home path
    const promptHome = join(homedir(), "systemprompt.txt");
    copyFileIfNotExists(promptHome, copyFile);
    openFileByDefault(promptHome);
  });

// program command `userdict` with help text `open/edit user dictionary`
program
  .command("userdict")
  .description("open/edit user dictionary")
  .action(() => {
    // open `dictionary.json` file by system text default editor
    const copyFile = __dirname + "/dictionary.json";
    // user home path
    const dictHome = join(homedir(), "dictionary.json");
    copyFileIfNotExists(dictHome, copyFile);
    openFileByDefault(dictHome);
  });

program.parse(process.argv);
