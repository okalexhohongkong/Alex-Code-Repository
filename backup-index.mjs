import { copyFile, mkdir, writeFile } from "node:fs/promises";
import { basename, join, resolve } from "node:path";

const timestamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\..+/, "").replace("T", "-");
const backupDir = resolve("备份快照", timestamp);
const files = [
  "界面原型-v1/archive-index.json",
  "界面原型-v1/archive-index-data.js",
  "项目进度看板.md",
  "项目进度看板.html",
  "多源存储接入与同步方案.md",
  "单机版验收报告.md",
];

await mkdir(backupDir, { recursive: true });

const copied = [];
for (const file of files) {
  try {
    await copyFile(resolve(file), join(backupDir, basename(file)));
    copied.push(file);
  } catch {
    // Missing optional files are listed as not copied in the manifest.
  }
}

const manifest = {
  createdAt: new Date().toISOString(),
  backupDir,
  copied,
  note: "索引和看板快照，仅复制小文件，不移动、不删除真实档案。",
};

await writeFile(join(backupDir, "snapshot-manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`, "utf8");

console.log(`备份快照完成：${backupDir}`);
console.log(`复制文件数：${copied.length}`);
