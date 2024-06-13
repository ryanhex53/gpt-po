#!/usr/bin/env node

import { Command, Option } from "commander";
import * as pkg from "../package.json";
import { sync } from "./sync";
import { init, translatePo, translatePoDir } from "./translate";
import { copyFileIfNotExists, compilePo, findConfig, openFileByDefault, openFileExplorer, parsePo } from "./utils";
import { removeByOptions } from "./manipulate";

const program = new Command();

program.name(pkg.name).version(pkg.version).description(pkg.description);

program
  .command("translate", { isDefault: true })
  .description("translate po file (default command)")
  .addOption(new Option("-k, --key <key>", "openai api key").env("OPENAI_API_KEY"))
  .addOption(new Option("--host <host>", "openai api host").env("OPENAI_API_HOST"))
  .addOption(
    new Option("--model <model>", "openai model")
      .default("gpt-4o")
      .choices([
        "gpt-4o",
        "gpt-4-turbo",
        "gpt-4",
        "gpt-4-0314",
        "gpt-4-32k",
        "gpt-4-32k-0314",
        "gpt-3.5-turbo",
        "gpt-3.5-turbo-0301",
      ]),
  )
  .addOption(new Option("--po <file>", "po file path").conflicts("dir"))
  .addOption(new Option("--dir <dir>", "po file directory").conflicts("po"))
  .option("-src, --source <lang>", "source language", "English")
  .option("-l, --lang <lang>", "target language")
  .option("--verbose", "print verbose log")
  .addOption(
    new Option("-o, --output <file>", "output file path, overwirte po file by default").conflicts(
      "dir",
    ),
  )
  .action(async (args) => {
    const { key, host, model, po, dir, source, lang, verbose, output, checkRegx } = args;
    if (host) {
      process.env.OPENAI_API_HOST = host;
    }
    if (key) {
      process.env.OPENAI_API_KEY = key;
    }
    // process.env.OPENAI_API_KEY is not set, exit
    if (!process.env.OPENAI_API_KEY) {
      console.error("OPENAI_API_KEY is required");
      process.exit(1);
    }
    init();
    if (po) {
      await translatePo(model, po, source, lang, verbose, output);
    } else if (dir) {
      await translatePoDir(model, dir, source, lang, verbose);
    } else {
      console.error("po file or directory is required");
      process.exit(1);
    }
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
  .option("--reset", "reset system prompt to default")
  .action((args) => {
    const { reset } = args;
    // open `systemprompt.txt` file by system text default editor
    const copyFile = __dirname + "/systemprompt.txt";
    // user home path
    const promptFile = findConfig("systemprompt.txt");
    copyFileIfNotExists(promptFile, copyFile, reset);
    if (reset) {
      console.log("systemprompt.txt reset to default");
    }
    openFileByDefault(promptFile);
  });

// program command `userdict` with help text `open/edit user dictionary`
program
  .command("userdict")
  .description("open/edit user dictionary")
  .option("--explore", "open user dictionary directory")
  .action((args) => {
    const { explore } = args;
    // open `dictionary.json` file by system text default editor
    const copyFile = __dirname + "/dictionary.json";
    // user home path
    const dictFile = findConfig("dictionary.json");
    if (explore) {
      // open user dictionary directory
      return openFileExplorer(dictFile);
    }
    copyFileIfNotExists(dictFile, copyFile);
    openFileByDefault(dictFile);
  });

  // program command `remove` with help text `remove po entries by options`
  program
    .command("remove")
    .description("remove po entries by options")
    .requiredOption("--po <file>", "po file path")
    .option("--fuzzy", "remove fuzzy entries")
    .option("-obs, --obsolete", "remove obsolete entries")
    .option("-ut, --untranslated", "remove untranslated entries")
    .option("-t, --translated", "remove translated entries")
    .option("-tnf, --translated-not-fuzzy", "remove translated not fuzzy entries")
    .option("-ft, --fuzzy-translated", "remove fuzzy translated entries")
    .option("-rc, --reference-contains <text>", "remove entries whose reference contains text, text can be a regular expression like /text/ig")
    .action(async (args) => {
      const { po, fuzzy, obsolete, untranslated, translated, translatedNotFuzzy, fuzzyTranslated, referenceContains } = args;
      const options = {
        fuzzy,
        obsolete,
        untranslated,
        translated,
        translatedNotFuzzy,
        fuzzyTranslated,
        referenceContains,
      };
      const output = args.output || po;
      const translations = await parsePo(po);
      await compilePo(removeByOptions(translations, options), output);
      console.log("done")
    });

program.parse(process.argv);
