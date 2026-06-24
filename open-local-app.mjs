import { spawn, spawnSync } from "node:child_process";
import { openSync } from "node:fs";
import { appendFile, mkdir, rm } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = dirname(fileURLToPath(import.meta.url));
const mode = process.argv[2] || "home";
const preferredPort = Number(process.env.PORT || 4173);
const maxPortAttempts = process.env.PORT ? 1 : 20;
const healthPath = "/api/health";
const targetPath = mode === "board" ? `/${encodeURIComponent("项目进度看板.html")}` : "/";
const logPath = join(projectRoot, "黑卫士桌面启动.log");
const startLockPath = join(projectRoot, ".hws-start.lock");

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function hasHealthyServer(port) {
  try {
    const response = await fetch(`http://127.0.0.1:${port}${healthPath}`, { signal: AbortSignal.timeout(900) });
    if (!response.ok) return false;
    const body = await response.json();
    return Boolean(body.ok);
  } catch {
    return false;
  }
}

async function findRunningServer() {
  for (let offset = 0; offset < maxPortAttempts; offset += 1) {
    const port = preferredPort + offset;
    if (await hasHealthyServer(port)) {
      return port;
    }
  }
  return null;
}

function startServer() {
  const out = openSync(logPath, "a");
  const child = spawn(process.execPath, ["server.mjs"], {
    cwd: projectRoot,
    detached: true,
    stdio: ["ignore", out, out],
  });
  child.unref();
}

async function acquireStartLock() {
  try {
    await mkdir(startLockPath);
    return true;
  } catch {
    return false;
  }
}

async function releaseStartLock() {
  await rm(startLockPath, { recursive: true, force: true });
}

async function waitForServer() {
  for (let i = 0; i < 30; i += 1) {
    const port = await findRunningServer();
    if (port) return port;
    await sleep(500);
  }
  return null;
}

async function main() {
  console.log("黑卫士 AI 数字档案管理系统桌面入口");

  let port = await findRunningServer();
  if (!port) {
    const hasStartLock = await acquireStartLock();

    if (hasStartLock) {
      try {
        port = await findRunningServer();
        if (!port) {
          console.log("本地服务未启动，正在自动启动。");
          await appendFile(logPath, `\n\n[${new Date().toISOString()}] 桌面入口请求启动服务\n`, "utf8");
          startServer();
        }
        port = await waitForServer();
      } finally {
        await releaseStartLock();
      }
    } else {
      console.log("本地服务正在启动，等待就绪。");
      port = await waitForServer();
    }
  }

  if (!port) {
    console.error("服务启动未完成，请稍后再双击一次桌面入口，或打开项目目录执行 npm run dev。");
    process.exit(1);
  }

  const url = `http://127.0.0.1:${port}${targetPath}`;
  console.log(`服务正常，正在打开：${url}`);
  spawnSync("open", [url], { stdio: "ignore" });
}

await main();
