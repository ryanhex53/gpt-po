#!/usr/bin/env -S node --no-warnings=ExperimentalWarning

import { Command, Option } from "commander";
import path from "path";
import { fileURLToPath } from "url";
import pkg from "../package.json" with { type: "json" };
import { removeByOptions } from "./manipulate.js";
import { sync } from "./sync.js";
import { init, translatePo, translatePoDir } from "./translate.js";
import {
  CompileOptions,
  compilePo,
  copyFileIfNotExists,
  findConfig,
  openFileByDefault,
  openFileExplorer,
  parsePo
} from "./utils.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const program = new Command();

program.name(pkg.name).version(pkg.version).description(pkg.description);

const getCompileOptions = (args: any): CompileOptions => {
  const foldLength = args.poFoldLen === "false" ? 0 : parseInt(args.poFoldLen);
  const sort = args.poSort;
  const escapeCharacters = args.poEscChars;
  if (isNaN(foldLength)) {
    console.error("--po-fold-len must be a number or false");
    process.exit(1);
  }
  return { foldLength, sort, escapeCharacters };
};

class SharedOptionsCommand extends Command {
  addCompileOptions() {
    return this.option(
      "--po-fold-len <length>",
      "a gettext compile option, the length at which to fold message strings into newlines, set to 0 or false to disable folding",
      "120"
    )
      .option("--po-sort", "a gettext compile option, sort entries by msgid", false)
      .option(
        "--po-esc-chars",
        "a gettext compile option, escape characters in output, if false, will skip escape newlines and quotes characters functionality",
        true
      );
  }
}

const translateCommand = new SharedOptionsCommand("translate")
  .description("translate po file (default command)")
  .addOption(new Option("-k, --key <key>", "openai api key").env("OPENAI_API_KEY"))
  .addOption(new Option("--host <host>", "openai api host").env("OPENAI_API_HOST"))
  .addOption(new Option("--model <model>", "openai model").env("OPENAI_MODEL").default("gpt-4o-mini"))
  .addOption(new Option("--po <file>", "po file path").conflicts("dir"))
  .addOption(new Option("--dir <dir>", "po file directory").conflicts("po"))
  .option("-src, --source <lang>", "source language (ISO 639-1)", "en")
  .option("-l, --lang <lang>", "target language (ISO 639-1)")
  .option("--verbose", "print verbose log")
  .option("--context <file>", "text file that provides the bot additional context")
  .option("--timeout <ms>", "timeout in milliseconds for API requests", "20000")
  .addOption(
    new Option("-o, --output <file>", "output file path, overwirte po file by default").conflicts("dir")
  )
  .addCompileOptions()
  .action(async (args) => {
    const { key, host, model, po, dir, source, lang, verbose, output, context, timeout } = args;
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
    const compileOptions = getCompileOptions(args);
    if (po) {
      await translatePo(model, po, source, lang, verbose, output, context, parseInt(timeout), compileOptions);
    } else if (dir) {
      await translatePoDir(model, dir, source, lang, verbose, context, parseInt(timeout), compileOptions);
    } else {
      console.error("po file or directory is required");
      process.exit(1);
    }
  });

program.addCommand(translateCommand, { isDefault: true });

const syncCommand = new SharedOptionsCommand("sync")
  .description("update po from pot file")
  .requiredOption("--po <file>", "po file path")
  .requiredOption("--pot <file>", "pot file path")
  .option("-o, --output <file>", "output file path, overwirte po file by default")
  .addCompileOptions()
  .action(async (args) => {
    const { po, pot } = args;
    await sync(po, pot, getCompileOptions(args));
  });

program.addCommand(syncCommand);

// program command `userdict` with help text `open/edit user dictionary`
program
  .command("userdict")
  .description("open/edit user dictionary")
  .option("--explore", "open user dictionary directory")
  .option("-l, --lang <lang>", "target language (ISO 639-1)")
  .action((args) => {
    const { explore, lang } = args;
    // open `dictionary.json` file by system text default editor
    const copyFile = __dirname + "/dictionary.json";
    // find from user home path
    const dictFile = findConfig(`dictionary${lang ? "-" + lang : ""}.json`);
    if (explore) {
      // open user dictionary directory
      return openFileExplorer(dictFile);
    }
    if (!lang) copyFileIfNotExists(dictFile, copyFile);
    openFileByDefault(dictFile);
  });

// program command `remove` with help text `remove po entries by options`
const removeCommand = new SharedOptionsCommand("remove")
  .description("remove po entries by options")
  .requiredOption("--po <file>", "po file path")
  .option("--fuzzy", "remove fuzzy entries")
  .option("-obs, --obsolete", "remove obsolete entries")
  .option("-ut, --untranslated", "remove untranslated entries")
  .option("-t, --translated", "remove translated entries")
  .option("-tnf, --translated-not-fuzzy", "remove translated not fuzzy entries")
  .option("-ft, --fuzzy-translated", "remove fuzzy translated entries")
  .option(
    "-rc, --reference-contains <text>",
    "remove entries whose reference contains text, text can be a regular expression like /text/ig"
  )
  .option("-o, --output <file>", "output file path, overwirte po file by default")
  .addCompileOptions()
  .action(async (args) => {
    this;
    const {
      po,
      fuzzy,
      obsolete,
      untranslated,
      translated,
      translatedNotFuzzy,
      fuzzyTranslated,
      referenceContains
    } = args;
    const options = {
      fuzzy,
      obsolete,
      untranslated,
      translated,
      translatedNotFuzzy,
      fuzzyTranslated,
      referenceContains
    };
    const output = args.output || po;
    const translations = await parsePo(po);
    await compilePo(removeByOptions(translations, options), output, getCompileOptions(args));
    console.log("done");
  });

program.addCommand(removeCommand);

program.parse(process.argv);
