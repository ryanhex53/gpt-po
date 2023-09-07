import { exec, spawn } from "child_process";
import * as fs from "fs";
import { GetTextTranslations, po } from "gettext-parser";
import { homedir, platform } from "os";
import * as path from "path";

/**
 * copy source file to destination file if destination file does not exist
 * @param file destination file path
 * @param copyFile source file path
 * @param force force copy file
 */
export function copyFileIfNotExists(file: string, copyFile: string, force: boolean = false): void {
  // make sure the directory exists
  fs.mkdirSync(path.dirname(file), { recursive: true });
  // check if file exists else create it
  try {
    fs.accessSync(file, fs.constants.F_OK);
    // check if the file is empty or force, copy the file
    if (force || fs.statSync(file).size === 0) {
      fs.copyFileSync(copyFile, file);
    }
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
  const buffer = po.compile(data, { foldLength: 120 });
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

export function gitRootDir(dir?: string): string|null {
  // if dir is not provided, use current working directory
  dir = dir || process.cwd();
  // check if dir is a git repository
  if (fs.existsSync(path.join(dir, ".git"))) {
    return dir;
  } else {
    // if dir is root directory, return null
    if (path.dirname(dir) === dir) {
      return null;
    } else {
      // else, check parent directory
      return gitRootDir(path.dirname(dir));
    }
  }
}

/**
 * find config file in the following order:
 * 1. current directory
 * 2. git root directory
 * 3. home directory
 * @param fileName 
 * @returns full path of the config file
 */
export function findConfig(fileName: string): string {
  const currentDir = process.cwd();
  const gitDir = gitRootDir() || currentDir;
  const homeDir = homedir();

  const filePaths = [
    path.join(currentDir, ".gpt-po", fileName),
    path.join(gitDir, ".gpt-po", fileName),
    path.join(homeDir, ".config", ".gpt-po", fileName)
  ];
  // check if file exists and return the first one
  for (const filePath of filePaths) {
    if (fs.existsSync(filePath)) {
      return filePath;
    }
  }
  // if no file exists, return the default one
  return path.join(homeDir, ".gpt-po", fileName);
}
/**
 * open file explorer by platform
 * @param location folder or file path
 */
export function openFileExplorer(location: string): void {
  if (platform() === 'win32') {
    exec(`explorer.exe "${path.dirname(location)}"`);
  } else if (platform() === 'darwin') {
    exec(`open "${path.dirname(location)}"`);
  } else {
    // Assuming a Linux-based system
    exec(`xdg-open "${path.dirname(location)}"`);
  }
}