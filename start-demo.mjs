import { spawnSync } from "node:child_process";
import { resolve } from "node:path";

const scanTarget = resolve(process.argv[2] || ".");

function runStep(label, command, args) {
  console.log(`\n【${label}】`);
  const result = spawnSync(command, args, { stdio: "inherit" });
  if (result.status !== 0) {
    console.error(`\n${label}未通过，请先处理上面的提示。`);
    process.exit(result.status || 1);
  }
}

console.log("黑卫士 AI 数字档案管理系统一键演示启动");
console.log(`扫描目录：${scanTarget}`);
console.log("说明：扫描只读取文件信息，不移动、不删除、不改名真实文件。");

runStep("1. 只读扫描并生成本机索引", "node", ["scan-local-index.mjs", scanTarget]);
runStep("2. 生成单机验收报告", "node", ["verify-local-demo.mjs"]);
runStep("3. 检查演示版完整性", "node", ["check-demo.mjs"]);
runStep("4. 生成索引和看板快照", "node", ["backup-index.mjs"]);

console.log("\n准备打开本地演示服务。");
console.log("浏览器访问终端提示的地址即可，一般是：http://127.0.0.1:4173/");

const serverModule = await import("./server.mjs");
const serverUrl = await serverModule.serverReady;

try {
  process.env.HWS_BASE_URL = serverUrl;
  await import("./health-check.mjs");
} catch (error) {
  console.error("\n服务已启动，但健康检查未通过。");
  console.error(error.message);
}
