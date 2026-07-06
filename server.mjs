import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { spawn } from "node:child_process";
import { extname, join, normalize, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL(".", import.meta.url));
const preferredPort = Number(process.env.PORT || 4173);
const maxPortAttempts = process.env.PORT ? 1 : 20;
let activePort = preferredPort;
let resolveServerReady;

export const serverReady = new Promise((resolve) => {
  resolveServerReady = resolve;
});

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".md": "text/markdown; charset=utf-8",
};

function redirect(response, location) {
  response.writeHead(302, {
    Location: encodeURI(location),
    "Cache-Control": "no-store",
  });
  response.end();
}

async function indexedPathById() {
  try {
    const indexPath = join(root, "界面原型-v1/archive-index.json");
    const index = JSON.parse(await readFile(indexPath, "utf8"));
    return new Map((index.archives || []).map((item) => [item.id, resolve(item.path)]));
  } catch {
    return new Map();
  }
}

async function readBrowserIndex() {
  const indexDataPath = join(root, "界面原型-v1/archive-index-data.js");
  const content = await readFile(indexDataPath, "utf8");
  const match = content.match(/window\.HWS_LOCAL_ARCHIVE_INDEX\s*=\s*(\{[\s\S]*\});?\s*$/);
  return match ? JSON.parse(match[1]) : {};
}

async function localIndexSummary() {
  let index;
  try {
    const indexPath = join(root, "界面原型-v1/archive-index.json");
    index = JSON.parse(await readFile(indexPath, "utf8"));
  } catch {
    index = await readBrowserIndex();
  }

  return {
    ok: true,
    generatedAt: index.generatedAt,
    rootLabel: index.rootLabel,
    totalFiles: index.totalFiles || 0,
    totalSizeLabel: index.totalSizeLabel || "0B",
    truncated: Boolean(index.truncated),
    skippedCount: index.skippedCount || 0,
  };
}

async function revealIndexedFile(url) {
  const requestUrl = new URL(url, `http://127.0.0.1:${preferredPort}`);
  const id = requestUrl.searchParams.get("id") || "";
  const indexedPaths = await indexedPathById();
  const filePath = indexedPaths.get(id);

  if (!filePath) {
    return { status: 403, body: { ok: false, message: "该档案编号不在本机索引内，已拒绝打开。" } };
  }

  await stat(filePath);
  const child = spawn("open", ["-R", filePath], { stdio: "ignore", detached: true });
  child.unref();
  return { status: 200, body: { ok: true, message: "已请求系统打开文件所在位置。" } };
}

function safePath(urlPath) {
  const decoded = decodeURIComponent(urlPath.split("?")[0]);
  const target = decoded === "/" ? "/界面原型-v1/index.html" : decoded;
  const normalized = normalize(target).replace(/^(\.\.[/\\])+/, "");
  return join(root, normalized);
}

const server = createServer(async (request, response) => {
  try {
    if ((request.url || "/").split("?")[0] === "/") {
      redirect(response, "/界面原型-v1/index.html");
      return;
    }

    if (["/vue", "/vue/"].includes((request.url || "/").split("?")[0])) {
      redirect(response, "/界面原型-vue/dist/index.html");
      return;
    }

    if ((request.url || "").startsWith("/api/health")) {
      const result = await localIndexSummary();
      response.writeHead(200, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" });
      response.end(JSON.stringify(result));
      return;
    }

    if ((request.url || "").startsWith("/api/reveal")) {
      const result = await revealIndexedFile(request.url || "");
      response.writeHead(result.status, { "Content-Type": "application/json; charset=utf-8" });
      response.end(JSON.stringify(result.body));
      return;
    }

    const filePath = safePath(request.url || "/");
    const content = await readFile(filePath);
    response.writeHead(200, {
      "Content-Type": mimeTypes[extname(filePath)] || "application/octet-stream",
      "Cache-Control": "no-store",
    });
    response.end(content);
  } catch {
    response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Not found");
  }
});

function listen(port, attempt = 1) {
  server.once("error", (error) => {
    if (error.code === "EADDRINUSE" && attempt < maxPortAttempts) {
      const nextPort = port + 1;
      console.log(`端口 ${port} 已占用，正在尝试： http://127.0.0.1:${nextPort}/`);
      listen(nextPort, attempt + 1);
      return;
    }

    throw error;
  });

  server.listen(port, "127.0.0.1", () => {
    activePort = port;
    console.log(`黑卫士 AI 数字档案管理系统演示版已启动： http://127.0.0.1:${port}/`);
    resolveServerReady?.(getServerUrl());
  });
}

export function getServerUrl() {
  return `http://127.0.0.1:${activePort}`;
}

listen(preferredPort);
