/**
 * snapshot.ts
 * 用途：掃描任意 JS/TS/Vue 專案，輸出專案結構、函式清單與依賴清單至 snapshot.md
 * 使用方式：在專案根目錄執行 `ts-node snapshot.ts` 或 `npx ts-node snapshot.ts`
 * 僅依賴 Node.js 內建模組：fs, path
 */

///////////////////////////////////////
// 1. 可編輯設定區
///////////////////////////////////////

/**
 * 要排除掃描的檔案或資料夾（相對於專案根目錄）
 * 使用者可自行新增或移除
 */
const EXCLUDES: string[] = [
  "node_modules",
  ".git",
  "dist",
  "build",
  "snapshot.ts",
];

/** 支援的檔案副檔名，可按需擴充 */
const FILE_EXTENSIONS: string[] = [".js", ".ts", ".vue"];

/** 目錄樹最大深度，0 或 null 表示不限 */
const MAX_DEPTH: number = 0;

interface Parser {
  test: RegExp;
  regex: RegExp;
  comment: RegExp;
}

/** 解析規則：Controller 物件模式與 Export 函式模式 */
const PARSERS: Record<string, Parser> = {
  controller: {
    test: /(?:module\.exports\s*=\s*|\bexport\s+default\s*)\{/,
    // 方法名稱與參數
    regex: /(\w+)\s*:\s*(?:async\s*)?function\s*(?:\w*)\s*\(([^)]*)\)/g,
    comment: /\/\/\s*(.*)/,
  },
  export: {
    test: /export\s+(?:async\s+)?(?:function|const)/,
    // 匹配 export function foo(...) 或 export const useXxx = (...) =>
    regex:
      /export\s+(?:async\s+)?function\s+(\w+)\s*\(([^)]*)\)|export\s+const\s+(\w+)\s*=\s*(?:async\s*)?\(?([^)]*)\)?\s*=>/g,
    comment: /\/\/\s*(.*)/,
  },
};

///////////////////////////////////////
// 2. 引入 Node 內建模組
///////////////////////////////////////
import { readFileSync, writeFileSync, readdirSync, statSync } from "node:fs";
import { join, extname, relative, basename, dirname } from "node:path";

///////////////////////////////////////
// 3. 判斷是否排除路徑
///////////////////////////////////////
function isExcluded(filePath: string): boolean {
  return EXCLUDES.some((ex) => filePath.includes(ex));
}

///////////////////////////////////////
// 4. 遞迴掃描檔案
///////////////////////////////////////
function scanFiles(dir: string, fileList: string[] = []): string[] {
  const entries = readdirSync(dir);
  for (const name of entries) {
    const fullPath = join(dir, name);
    if (isExcluded(fullPath)) continue;
    const stat = statSync(fullPath);
    if (stat.isDirectory()) {
      scanFiles(fullPath, fileList);
    } else if (FILE_EXTENSIONS.includes(extname(name))) {
      fileList.push(fullPath);
    }
  }
  return fileList;
}

interface FunctionInfo {
  name: string;
  params: string;
  comment: string;
}

///////////////////////////////////////
// 5. 解析檔案中函式／方法
///////////////////////////////////////
function parseFile(filePath: string): FunctionInfo[] {
  const content = readFileSync(filePath, "utf-8");
  let parser: Parser | null = null;
  if (PARSERS.controller.test.test(content)) {
    parser = PARSERS.controller;
  } else if (PARSERS.export.test.test(content)) {
    parser = PARSERS.export;
  } else {
    return []; // 無匹配解析模式
  }

  const lines = content.split(/\r?\n/);
  const results: FunctionInfo[] = [];

  lines.forEach((line, idx) => {
    parser!.regex.lastIndex = 0;
    let match;
    while ((match = parser!.regex.exec(line)) !== null) {
      // 取出函式名稱與參數
      const name = match[1] || match[3];
      const params = match[2] || match[4] || "";
      // 嘗試讀取上一行的單行註解
      let comment = "";
      if (idx > 0) {
        const prev = lines[idx - 1].match(parser!.comment);
        if (prev) comment = prev[1].trim();
      }
      results.push({ name, params, comment });
    }
  });

  return results;
}

///////////////////////////////////////
// 6. 生成 ASCII 目錄樹
///////////////////////////////////////
function buildTree(
  dir: string,
  prefix: string = "",
  depth: number = 1
): string {
  if (MAX_DEPTH && depth > MAX_DEPTH) return "";
  let tree = "";
  const entries = readdirSync(dir)
    .filter((name) => !isExcluded(join(dir, name)))
    .sort();

  entries.forEach((name, idx) => {
    const fullPath = join(dir, name);
    const isDir = statSync(fullPath).isDirectory();
    const connector = idx === entries.length - 1 ? "└── " : "├── ";
    tree += `${prefix}${connector}${name}\n`;
    if (isDir) {
      const newPrefix = prefix + (idx === entries.length - 1 ? "    " : "│   ");
      tree += buildTree(fullPath, newPrefix, depth + 1);
    }
  });

  return tree;
}

///////////////////////////////////////
// 7. 搜尋各子專案的 package.json
///////////////////////////////////////
function findPackages(dir: string, list: string[] = []): string[] {
  const entries = readdirSync(dir);
  for (const name of entries) {
    const fullPath = join(dir, name);
    if (isExcluded(fullPath)) continue;
    const stat = statSync(fullPath);
    if (stat.isDirectory()) {
      findPackages(fullPath, list);
    } else if (name === "package.json") {
      list.push(fullPath);
    }
  }
  return list;
}

interface PackageInfo {
  dependencies: Record<string, string>;
  devDependencies: Record<string, string>;
}

///////////////////////////////////////
// 8. 主流程：掃描、解析、組合 Markdown
///////////////////////////////////////
function main(): void {
  const root = process.cwd();

  // 目錄樹
  const tree = buildTree(root);

  // 掃描所有檔案並解析函式
  const files = scanFiles(root);
  const funcMap: Record<string, FunctionInfo[]> = {}; // filePath -> [ {name, params, comment}, ... ]
  files.forEach((fp) => {
    const rel = relative(root, fp);
    const funcs = parseFile(fp);
    if (funcs.length) funcMap[rel] = funcs;
  });

  // 收集依賴
  const pkgFiles = findPackages(root);
  const depsMap: Record<string, PackageInfo> = {}; // projectName -> { dependencies, devDependencies }
  pkgFiles.forEach((pf) => {
    try {
      const data = JSON.parse(readFileSync(pf, "utf-8"));
      const proj = data.name || basename(dirname(pf));
      depsMap[proj] = {
        dependencies: data.dependencies || {},
        devDependencies: data.devDependencies || {},
      };
    } catch (err) {
      console.warn(`解析 ${pf} 時發生錯誤：${(err as Error).message}`);
    }
  });

  // 組合 Markdown
  let md = "";

  // 1. 專案目錄結構
  md += "## 專案目錄結構\n\n";
  md += "```text\n" + tree + "```\n\n";

  // 2. 函式清單
  md += "## 函式清單\n\n";
  for (const [file, funcs] of Object.entries(funcMap)) {
    md += `### ${file}\n`;
    funcs.forEach((f) => {
      md += `- **${f.name}(${f.params})**${
        f.comment ? " - " + f.comment : ""
      }\n`;
    });
    md += "\n";
  }

  // 3. 依賴清單
  md += "## 依賴清單\n\n";
  for (const [proj, info] of Object.entries(depsMap)) {
    md += `## ${proj}\n\n`;
    md += "### devDependencies\n";
    if (Object.keys(info.devDependencies).length) {
      md +=
        "```json\n" + JSON.stringify(info.devDependencies, null, 2) + "\n```\n";
    } else {
      md += "無\n";
    }
    md += "\n### dependencies\n";
    if (Object.keys(info.dependencies).length) {
      md +=
        "```json\n" + JSON.stringify(info.dependencies, null, 2) + "\n```\n";
    } else {
      md += "無\n";
    }
    md += "\n";
  }

  // 輸出至 snapshot.md
  writeFileSync(join(root, "snapshot.md"), md, "utf-8");
  console.log("已生成 snapshot.md");
}

// 執行主流程
main();
