import { spawnSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = dirname(fileURLToPath(import.meta.url));
const explicitTarget = process.argv.find((arg, index) => index > 1 && arg !== "--choose");

function runStep(label, args) {
  console.log(`\n【${label}】`);
  const result = spawnSync(process.execPath, args, { cwd: projectRoot, stdio: "inherit" });
  if (result.status !== 0) {
    console.error(`${label}未通过，请先处理上面的提示。`);
    process.exit(result.status || 1);
  }
}

function chooseFolder() {
  const script = 'POSIX path of (choose folder with prompt "请选择要只读扫描的文件夹。系统只读取文件信息，不移动、不删除、不改名。")';
  const result = spawnSync("osascript", ["-e", script], { encoding: "utf8" });

  if (result.status !== 0) {
    console.log("已取消选择，本次没有扫描任何文件。");
    process.exit(0);
  }

  return result.stdout.trim();
}

const scanTarget = resolve(explicitTarget || chooseFolder());

console.log("黑卫士 AI 数字档案管理系统：只读扫描入口");
console.log(`扫描目录：${scanTarget}`);
console.log("安全说明：只读取文件信息，不移动、不删除、不改名真实文件。");

runStep("1. 只读扫描并更新索引", ["scan-local-index.mjs", scanTarget]);
runStep("2. 生成单机验收报告", ["verify-local-demo.mjs"]);
runStep("3. 生成索引和看板快照", ["backup-index.mjs"]);
runStep("4. 打开系统首页", ["open-local-app.mjs", "home"]);
