import { readFile, writeFile } from "node:fs/promises";
import { basename, resolve } from "node:path";

const inputPaths = process.argv.slice(2);
const defaultIndex = "界面原型-v1/archive-index.json";
const privateOutput = resolve("界面原型-v1/archive-merged-index.json");
const browserOutput = resolve("界面原型-v1/archive-merged-index-data.js");
const indexesToMerge = inputPaths.length ? inputPaths : [defaultIndex];

function formatSize(bytes) {
  const units = ["B", "KB", "MB", "GB", "TB"];
  let value = bytes;
  let index = 0;
  while (value >= 1024 && index < units.length - 1) {
    value /= 1024;
    index += 1;
  }
  return `${value.toFixed(value >= 10 || index === 0 ? 0 : 1)}${units[index]}`;
}

function sanitizeArchiveForBrowser(item) {
  const { path, ...publicItem } = item;
  return {
    ...publicItem,
    hasLocalPath: Boolean(path),
    sourcePathLabel: item.relativePath,
  };
}

const sourceIndexes = [];
for (const inputPath of indexesToMerge) {
  const resolvedPath = resolve(inputPath);
  const index = JSON.parse(await readFile(resolvedPath, "utf8"));
  sourceIndexes.push({
    sourceIndexPath: resolvedPath,
    root: index.root,
    rootLabel: index.rootLabel || basename(index.root || resolvedPath),
    generatedAt: index.generatedAt,
    totalFiles: index.totalFiles || 0,
    totalSize: index.totalSize || 0,
    truncated: Boolean(index.truncated),
    skippedCount: index.skippedCount || 0,
    archives: index.archives || [],
  });
}

const mergedMap = new Map();
for (const source of sourceIndexes) {
  for (const item of source.archives) {
    const key = [item.path || item.relativePath || item.title, item.size || 0, item.modifiedAt || ""].join("|");
    if (!mergedMap.has(key)) {
      mergedMap.set(key, {
        ...item,
        sourceRootLabel: source.rootLabel,
        sourceIndexGeneratedAt: source.generatedAt,
      });
    }
  }
}

const archives = Array.from(mergedMap.values()).map((item, index) => ({
  ...item,
  id: `MERGED-${String(index + 1).padStart(6, "0")}`,
  localId: item.id,
}));
const totalSize = archives.reduce((sum, item) => sum + (item.size || 0), 0);
const mergedIndex = {
  generatedAt: new Date().toISOString(),
  rootLabel: "多目录合并索引",
  sourceCount: sourceIndexes.length,
  sourceIndexes: sourceIndexes.map(({ archives: _archives, ...source }) => source),
  totalFiles: archives.length,
  duplicateCount: sourceIndexes.reduce((sum, item) => sum + item.archives.length, 0) - archives.length,
  totalSize,
  totalSizeLabel: formatSize(totalSize),
  truncated: sourceIndexes.some((source) => source.truncated),
  skippedCount: sourceIndexes.reduce((sum, item) => sum + item.skippedCount, 0),
  archives,
};

const browserIndex = {
  ...mergedIndex,
  sourceIndexes: mergedIndex.sourceIndexes.map(({ sourceIndexPath, root, ...source }) => ({
    ...source,
    hasPrivatePath: Boolean(sourceIndexPath || root),
  })),
  archives: archives.map(sanitizeArchiveForBrowser),
};

await writeFile(privateOutput, `${JSON.stringify(mergedIndex, null, 2)}\n`, "utf8");
await writeFile(
  browserOutput,
  `window.HWS_MERGED_ARCHIVE_INDEX = ${JSON.stringify(browserIndex, null, 2).replace(/</g, "\\u003c")};\n`,
  "utf8",
);

console.log("多目录合并索引完成");
console.log(`来源索引：${sourceIndexes.length}`);
console.log(`合并文件：${archives.length}`);
console.log(`重复跳过：${mergedIndex.duplicateCount}`);
console.log(`私有合并索引：${privateOutput}`);
console.log(`浏览器脱敏合并索引：${browserOutput}`);
