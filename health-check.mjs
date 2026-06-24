const baseUrl = process.env.HWS_BASE_URL || "http://127.0.0.1:4173";

async function fetchText(path) {
  const response = await fetch(`${baseUrl}${path}`);
  const text = await response.text();
  return { response, text };
}

function assertOk(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

const checks = [];

const home = await fetchText("/");
assertOk(home.response.ok, "首页无法访问，请先启动本地演示服务。");
assertOk(home.text.includes("本机索引快搜"), "首页缺少本机索引快搜入口。");
assertOk(home.text.includes("全介质采集入口"), "首页缺少全介质采集入口。");
checks.push(["首页", "通过"]);

const board = await fetchText(`/${encodeURIComponent("项目进度看板.html")}`);
assertOk(board.response.ok, "项目进度看板无法访问。");
assertOk(board.text.includes("100.0%"), "项目进度看板缺少完成度。");
assertOk(board.text.includes("真实硬盘全量接入"), "项目进度看板缺少真实硬盘接入状态。");
checks.push(["项目进度看板", "通过"]);

const health = await fetchText("/api/health");
assertOk(health.response.ok, "健康检查接口无法访问。");
const healthJson = JSON.parse(health.text);
assertOk(healthJson.ok, "健康检查接口返回异常。");
assertOk(healthJson.totalFiles > 0, "健康检查接口没有读取到索引文件。");
checks.push(["健康检查接口", `${healthJson.totalFiles} 个索引文件`]);

const indexData = await fetchText("/界面原型-v1/archive-index-data.js");
assertOk(indexData.response.ok, "浏览器索引数据无法访问。");
assertOk(!/"path"\s*:/.test(indexData.text), "浏览器索引仍包含完整路径字段。");
assertOk(!/\/Users\/|\/Volumes\/|[A-Za-z]:\\/.test(indexData.text), "浏览器索引仍包含本机绝对路径。");
checks.push(["浏览器脱敏索引", "通过"]);

console.log("黑卫士 AI 数字档案管理系统健康检查通过");
for (const [name, result] of checks) {
  console.log(`- ${name}：${result}`);
}
