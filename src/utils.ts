import * as fs from "fs";

import { spawn } from "child_process";
import { GetTextTranslations, po } from "gettext-parser";

export function copyFileIfNotExists(file: string, copyFile: string): void {
  // check if file exists else create it
  try {
    fs.accessSync(file, fs.constants.F_OK);
    // check if the file is empty else copy the file
    fs.statSync(file).size === 0 && fs.copyFileSync(copyFile, file);
  } catch (err) {
    fs.copyFileSync(copyFile, file);
  }
}

export function openFileByDefault(filePath: string): void {
  // Use the 'open' command on macOS or 'start' command on Windows to open the file with the default system editor
  const command =
    process.platform === "darwin" ? "open" : process.platform === "win32" ? "start" : "xdg-open";
  // Spawn a new process for the default editor and pass the file name as an argument
  spawn(command, [filePath], { shell: true });
}

export function parsePo(poFile: string, defaultCharset?: string): Promise<GetTextTranslations> {
  // read poFile as buffer, then parse it
  return new Promise((resolve, reject) => {
    fs.readFile(poFile, (err, buffer) => {
      if (err) reject(err);
      var result = po.parse(buffer, defaultCharset ?? "utf-8");
      resolve(result);
    });
  });
}

export function compilePo(data: GetTextTranslations, poFile: string): Promise<void> {
  const buffer = po.compile(data);
  return new Promise((resolve, reject) => {
    fs.writeFile(poFile, buffer, (err) => {
      if (err) reject(err);
      resolve();
    });
  });
}

export function printProgress(progress: number, total: number, extra?: string): void {
  const percent = Math.floor((progress / total) * 100);
  const bar = Array(Math.floor(percent / 5))
    .fill("█")
    .join("");
  const dots = Array(20 - Math.floor(percent / 5))
    .fill("░")
    .join("");
  process.stdout.write(`\r${bar}${dots} ${percent}% ${progress}/${total} ${extra || ""}`);
}
