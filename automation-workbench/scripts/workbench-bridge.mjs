import { createServer } from "node:http";
import { spawn } from "node:child_process";
import { createReadStream } from "node:fs";
import { access, mkdir, readFile, readdir, rename, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import vm from "node:vm";
import { runOnce } from "./workbench-codex-runner.mjs";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_WORKBENCH_ROOT = path.dirname(SCRIPT_DIR);
const DEFAULT_WORKSPACE_ROOT = path.dirname(DEFAULT_WORKBENCH_ROOT);
const DEFAULT_HOST = "127.0.0.1";
const DEFAULT_PORT = 8787;
const DEFAULT_PORT_FALLBACK_ATTEMPTS = 20;
const DEFAULT_CODEX_BIN = process.platform === "win32"
  ? path.join(process.env.USERPROFILE || "", ".codex", ".sandbox-bin", "codex.exe")
  : "codex";

const MIME_TYPES = new Map([
  [".css", "text/css; charset=utf-8"],
  [".html", "text/html; charset=utf-8"],
  [".js", "text/javascript; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".md", "text/markdown; charset=utf-8"],
  [".png", "image/png"],
  [".jpg", "image/jpeg"],
  [".jpeg", "image/jpeg"],
  [".svg", "image/svg+xml; charset=utf-8"],
  [".txt", "text/plain; charset=utf-8"]
]);

const DATA_FILES = new Map([
  ["knowledge-items", "knowledge-items.json"],
  ["task-history", "task-history.json"],
  ["daily-briefs", "daily-briefs.json"],
  ["business-feedback", "business-feedback.json"],
  ["personal-profile", "personal-profile.json"],
  ["health-log", "health-log.json"],
  ["growth-library", "growth-library.json"]
]);

const CLOUD_READINESS_FILES = [
  {
    id: "cloud-readme",
    label: "云端执行说明",
    path: "automation-workbench/cloud/README.md"
  },
  {
    id: "codex-cloud-checklist",
    label: "Codex Cloud 接入清单",
    path: "automation-workbench/cloud/codex-cloud-setup-checklist.md"
  },
  {
    id: "daily-brief-prompt",
    label: "每日简报云端提示词",
    path: "automation-workbench/cloud/cloud-daily-brief-prompt.md"
  },
  {
    id: "weekly-evolution-prompt",
    label: "每周自我迭代提示词",
    path: "automation-workbench/cloud/cloud-weekly-evolution-prompt.md"
  },
  {
    id: "cloud-sync-policy",
    label: "云端到本地同步规则",
    path: "automation-workbench/cloud/cloud-sync-policy.md"
  },
  {
    id: "cloud-runner",
    label: "第二大脑云端 runner",
    path: "automation-workbench/scripts/second-brain-cloud-runner.mjs"
  },
  {
    id: "github-daily-workflow",
    label: "GitHub 每日工作流",
    path: ".github/workflows/second-brain-daily.yml"
  },
  {
    id: "github-weekly-workflow",
    label: "GitHub 每周进化工作流",
    path: ".github/workflows/second-brain-weekly.yml"
  }
];

function jsonResponse(res, status, payload) {
  res.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
    "access-control-allow-origin": "*",
    "access-control-allow-methods": "GET,POST,DELETE,OPTIONS",
    "access-control-allow-headers": "content-type"
  });
  res.end(JSON.stringify(payload, null, 2));
}

function textResponse(res, status, text) {
  res.writeHead(status, { "content-type": "text/plain; charset=utf-8" });
  res.end(text);
}

function isInside(parent, child) {
  const relative = path.relative(parent, child);
  return relative === "" || (!relative.startsWith("..") && !path.isAbsolute(relative));
}

function parseCliArgs(argv) {
  const options = {};
  for (let index = 0; index < argv.length; index += 1) {
    const current = argv[index];
    if (current === "--host") {
      options.host = argv[index + 1];
      index += 1;
    } else if (current === "--port") {
      options.port = Number(argv[index + 1]);
      index += 1;
    } else if (current === "--no-port-fallback") {
      options.allowPortFallback = false;
    }
  }
  return options;
}

async function readRequestBody(req) {
  let body = "";
  for await (const chunk of req) {
    body += chunk;
    if (body.length > 2_000_000) {
      throw new Error("Request body is too large.");
    }
  }
  return body;
}

async function fileExists(filePath) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

function parseJsonFile(raw, fallback) {
  const normalized = raw.replace(/^\uFEFF/, "").trim();
  return normalized ? JSON.parse(normalized) : fallback;
}

function slugifyPlatformId(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "platform";
}

function normalizePlatform(platform, source = "settings") {
  if (!platform || !platform.name || (!platform.url && !platform.appPath)) return null;
  let normalizedUrl = "";
  if (platform.url) {
    let parsedUrl;
    try {
      parsedUrl = new URL(platform.url);
    } catch {
      return null;
    }
    if (!["http:", "https:"].includes(parsedUrl.protocol)) return null;
    normalizedUrl = parsedUrl.href;
  }

  return {
    id: platform.id || slugifyPlatformId(platform.name),
    name: platform.name,
    group: platform.group || source,
    url: normalizedUrl,
    appPath: platform.appPath || "",
    enabled: platform.enabled !== false,
    purpose: platform.purpose || platform.note || "",
    source
  };
}

async function defaultOpenExternal(target) {
  let command;
  let args;

  if (process.platform === "win32") {
    if (/^https?:\/\//i.test(target)) {
      const quarkCandidates = [
        process.env.LOCALAPPDATA && path.join(process.env.LOCALAPPDATA, "Programs", "Quark", "quark.exe"),
        process.env.LOCALAPPDATA && path.join(process.env.LOCALAPPDATA, "Quark", "quark.exe"),
        process.env.ProgramFiles && path.join(process.env.ProgramFiles, "Quark", "quark.exe"),
        process.env["ProgramFiles(x86)"] && path.join(process.env["ProgramFiles(x86)"], "Quark", "quark.exe")
      ].filter(Boolean);
      const quark = (await Promise.all(quarkCandidates.map(async (candidate) => (
        (await fileExists(candidate)) ? candidate : ""
      )))).find(Boolean);

      if (quark) {
        command = quark;
        args = ["--new-window", target];
      } else {
        command = "rundll32.exe";
        args = ["url.dll,FileProtocolHandler", target];
      }
    } else {
      command = target;
      args = [];
    }
  } else if (process.platform === "darwin") {
    command = "open";
    args = [target];
  } else {
    command = "xdg-open";
    args = [target];
  }

  const child = spawn(command, args, {
    detached: true,
    stdio: "ignore",
    windowsHide: true
  });
  child.unref();
}

async function listen(server, host, port) {
  return await new Promise((resolve, reject) => {
    const cleanup = () => {
      server.off("error", onError);
      server.off("listening", onListening);
    };
    const onError = (error) => {
      cleanup();
      reject(error);
    };
    const onListening = () => {
      cleanup();
      resolve(server.address());
    };
    server.once("error", onError);
    server.once("listening", onListening);
    server.listen(port, host);
  });
}

function createWorkbenchBridge(options = {}) {
  const workspaceRoot = path.resolve(options.workspaceRoot || DEFAULT_WORKSPACE_ROOT);
  const workbenchRoot = path.resolve(options.workbenchRoot || DEFAULT_WORKBENCH_ROOT);
  const queueDir = path.join(workbenchRoot, "queue");
  const queuePath = path.join(queueDir, "tasks.json");
  const statusPath = path.join(queueDir, "bridge-status.json");
  const dataDir = path.join(workbenchRoot, "data");
  const host = options.host || DEFAULT_HOST;
  const requestedPort = Number(options.port ?? DEFAULT_PORT);
  const allowPortFallback = options.allowPortFallback !== false;
  const openExternal = options.openExternal || defaultOpenExternal;
  let server;

  async function ensureQueueFile() {
    await mkdir(queueDir, { recursive: true });
    if (!(await fileExists(queuePath))) {
      await writeFile(queuePath, "[]\n", "utf8");
    }
  }

  async function readQueue() {
    await ensureQueueFile();
    const raw = await readFile(queuePath, "utf8");
    const parsed = parseJsonFile(raw, []);
    if (!Array.isArray(parsed)) {
      throw new Error("Queue file must contain a JSON array.");
    }
    return parsed;
  }

  async function writeQueue(tasks) {
    if (!Array.isArray(tasks)) {
      throw new Error("Queue payload must be a JSON array.");
    }
    await mkdir(queueDir, { recursive: true });
    const tmpPath = `${queuePath}.tmp`;
    await writeFile(tmpPath, `${JSON.stringify(tasks, null, 2)}\n`, "utf8");
    await rename(tmpPath, queuePath);
  }

  async function writeStatus(status) {
    await mkdir(queueDir, { recursive: true });
    await writeFile(statusPath, `${JSON.stringify(status, null, 2)}\n`, "utf8");
  }

  async function ensureDataFile(name) {
    const fileName = DATA_FILES.get(name);
    if (!fileName) {
      throw new Error("Unknown data store.");
    }
    await mkdir(dataDir, { recursive: true });
    const filePath = path.join(dataDir, fileName);
    if (!(await fileExists(filePath))) {
      const initial = name === "personal-profile" ? "{}\n" : "[]\n";
      await writeFile(filePath, initial, "utf8");
    }
    return filePath;
  }

  async function readDataStore(name) {
    const filePath = await ensureDataFile(name);
    const raw = await readFile(filePath, "utf8");
    return parseJsonFile(raw, name === "personal-profile" ? {} : []);
  }

  async function readExistingDataStore(name) {
    const fileName = DATA_FILES.get(name);
    if (!fileName) {
      throw new Error("Unknown data store.");
    }
    const filePath = path.join(dataDir, fileName);
    if (!(await fileExists(filePath))) {
      return name === "personal-profile" ? {} : [];
    }
    const raw = await readFile(filePath, "utf8");
    return parseJsonFile(raw, name === "personal-profile" ? {} : []);
  }

  async function readConfiguredPlatforms() {
    const platforms = new Map();
    const settingsPath = path.join(workbenchRoot, "config", "settings.json");
    if (await fileExists(settingsPath)) {
      const settings = parseJsonFile(await readFile(settingsPath, "utf8"), {});
      for (const platform of settings?.workAssistant?.platforms || []) {
        const normalized = normalizePlatform(platform, "settings");
        if (normalized && !platforms.has(normalized.id)) {
          platforms.set(normalized.id, normalized);
        }
      }
    }

    const modulesPath = path.join(workbenchRoot, "app", "modules.js");
    if (await fileExists(modulesPath)) {
      const sandbox = { window: {} };
      vm.runInNewContext(await readFile(modulesPath, "utf8"), sandbox, { filename: "modules.js" });
      for (const platform of sandbox.window.WORKBENCH_SOURCES || []) {
        const normalized = normalizePlatform(platform, "workbench");
        if (normalized && !platforms.has(normalized.id)) {
          platforms.set(normalized.id, normalized);
        }
      }
    }

    return Array.from(platforms.values());
  }

  async function openConfiguredPlatform(id) {
    const platforms = await readConfiguredPlatforms();
    const platform = platforms.find((item) => item.id === id);
    if (!platform) {
      const error = new Error("Unknown platform.");
      error.statusCode = 404;
      throw error;
    }
    if (!platform.enabled) {
      const error = new Error("Platform is disabled.");
      error.statusCode = 409;
      throw error;
    }
    await openExternal(platform.appPath || platform.url);
    return platform;
  }

  async function writeDataStore(name, value) {
    const filePath = await ensureDataFile(name);
    const tmpPath = `${filePath}.tmp`;
    await writeFile(tmpPath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
    await rename(tmpPath, filePath);
  }

  function latestByDate(items, dateFields) {
    if (!Array.isArray(items) || !items.length) return null;
    return [...items].sort((left, right) => {
      const leftDate = dateFields.map((field) => Date.parse(left?.[field] || "") || 0).find(Boolean) || 0;
      const rightDate = dateFields.map((field) => Date.parse(right?.[field] || "") || 0).find(Boolean) || 0;
      return rightDate - leftDate;
    })[0];
  }

  function normalizeOutputPath(outputPath) {
    if (!outputPath || typeof outputPath !== "string") return "";
    return outputPath.replaceAll("\\", "/").replace(/^\/+/, "");
  }

  async function listLatestOutputs(limit = 8) {
    const outputsRoot = path.join(workspaceRoot, "outputs");
    if (!(await fileExists(outputsRoot))) return [];
    const found = [];

    async function walk(currentDir) {
      const entries = await readdir(currentDir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(currentDir, entry.name);
        if (entry.isDirectory()) {
          await walk(fullPath);
          continue;
        }
        if (!entry.isFile()) continue;
        const fileStat = await stat(fullPath);
        found.push({
          path: normalizeOutputPath(path.relative(workspaceRoot, fullPath)),
          modifiedAt: fileStat.mtime.toISOString(),
          size: fileStat.size
        });
      }
    }

    await walk(outputsRoot);
    return found
      .sort((left, right) => Date.parse(right.modifiedAt) - Date.parse(left.modifiedAt))
      .slice(0, limit);
  }

  async function summarizeCloudReadiness() {
    const checks = [];
    for (const check of CLOUD_READINESS_FILES) {
      checks.push({
        ...check,
        ok: await fileExists(path.join(workspaceRoot, check.path))
      });
    }
    const passed = checks.filter((check) => check.ok).length;
    return {
      passed,
      total: checks.length,
      status: passed === checks.length ? "ready" : "needs_setup",
      checks
    };
  }

  function buildReminders() {
    return [
      {
        id: "daily-brief",
        title: "每日 8 点信息简报",
        schedule: "每天 08:00 Asia/Shanghai",
        delivery: "生成 outputs 文件和 163 邮箱草稿",
        status: "configured_as_prompt"
      },
      {
        id: "business-feedback",
        title: "每日业务反馈",
        schedule: "每天 08:00 Asia/Shanghai",
        delivery: "单独生成业务反馈邮件草稿",
        status: "configured_as_prompt"
      },
      {
        id: "weekly-evolution",
        title: "每周工作台自我迭代审计",
        schedule: "每周一次",
        delivery: "检查可改进模块、技能候选和稳定性问题",
        status: "configured_as_prompt"
      }
    ];
  }

  function buildConfirmations() {
    return [
      {
        id: "external-send",
        title: "外发消息和邮件",
        detail: "微信、飞书、邮箱、社媒私信等发送前仍需要你确认。"
      },
      {
        id: "account-login",
        title: "账号登录和验证码",
        detail: "密码、验证码、支付、交易和授权页面由你亲自处理。"
      },
      {
        id: "skill-install",
        title: "第三方 skills 安装",
        detail: "会先评估来源、权限和风险，再等你确认具体候选。"
      },
      {
        id: "cloud-secrets",
        title: "云端密钥配置",
        detail: "如果要关机后自动发邮件和联网更新，需要你在云端配置安全密钥。"
      }
    ];
  }

  async function buildOperationsStatus() {
    const [
      tasks,
      taskHistory,
      knowledgeItems,
      dailyBriefs,
      businessFeedback,
      healthLog,
      growthLibrary,
      bridgeStatus,
      latestOutputs,
      cloudReadiness
    ] = await Promise.all([
      readQueue(),
      readExistingDataStore("task-history"),
      readExistingDataStore("knowledge-items"),
      readExistingDataStore("daily-briefs"),
      readExistingDataStore("business-feedback"),
      readExistingDataStore("health-log"),
      readExistingDataStore("growth-library"),
      fileExists(statusPath).then((exists) => exists ? readFile(statusPath, "utf8").then((raw) => parseJsonFile(raw, {})) : {}),
      listLatestOutputs(),
      summarizeCloudReadiness()
    ]);
    const latestCompletedTask = latestByDate(taskHistory, ["completedAt", "createdAt"]);

    return {
      generatedAt: new Date().toISOString(),
      queue: {
        pendingCount: tasks.length,
        latestTask: latestByDate(tasks, ["createdAt"]),
        queuePath
      },
      dataHub: {
        knowledgeItems: Array.isArray(knowledgeItems) ? knowledgeItems.length : 0,
        taskHistory: Array.isArray(taskHistory) ? taskHistory.length : 0,
        dailyBriefs: Array.isArray(dailyBriefs) ? dailyBriefs.length : 0,
        businessFeedback: Array.isArray(businessFeedback) ? businessFeedback.length : 0,
        healthLog: Array.isArray(healthLog) ? healthLog.length : 0,
        growthLibrary: Array.isArray(growthLibrary) ? growthLibrary.length : 0
      },
      latestCompletedTask,
      latestOutputs,
      cloudReadiness,
      reminders: buildReminders(),
      confirmations: buildConfirmations(),
      bridge: {
        connected: Boolean(bridgeStatus?.baseUrl),
        ...bridgeStatus
      }
    };
  }

  async function handleApi(req, res, url) {
    if (req.method === "OPTIONS") {
      jsonResponse(res, 204, {});
      return;
    }

    if (url.pathname === "/api/health" && req.method === "GET") {
      jsonResponse(res, 200, {
        ok: true,
        capabilities: {
          dataHub: true,
          operationsCenter: true,
          sharedQueue: true,
          platformOpener: true
        },
        queuePath,
        workbenchRoot
      });
      return;
    }

    if (url.pathname === "/api/status" && req.method === "GET") {
      jsonResponse(res, 200, await buildOperationsStatus());
      return;
    }

    if (url.pathname === "/api/platforms" && req.method === "GET") {
      jsonResponse(res, 200, { platforms: await readConfiguredPlatforms() });
      return;
    }

    if (url.pathname === "/api/platforms/open" && req.method === "POST") {
      const body = await readRequestBody(req);
      const payload = body.trim() ? JSON.parse(body) : {};
      const platform = await openConfiguredPlatform(payload.id);
      jsonResponse(res, 200, {
        ok: true,
        id: platform.id,
        name: platform.name,
        url: platform.url,
        appPath: platform.appPath
      });
      return;
    }

    if (url.pathname === "/api/codex/run-queue" && req.method === "POST") {
      const body = await readRequestBody(req);
      const payload = body.trim() ? JSON.parse(body) : {};
      const result = await runOnce({
        queuePath,
        workspaceRoot,
        execute: payload.execute === true,
        allowSensitive: payload.allowSensitive === true,
        codexBin: payload.codexBin || DEFAULT_CODEX_BIN
      });
      jsonResponse(res, 200, { ok: true, ...result });
      return;
    }

    if (url.pathname === "/api/queue" && req.method === "GET") {
      jsonResponse(res, 200, await readQueue());
      return;
    }

    if (url.pathname === "/api/queue" && req.method === "POST") {
      const body = await readRequestBody(req);
      const parsed = body.trim() ? JSON.parse(body) : [];
      const tasks = Array.isArray(parsed) ? parsed : parsed.tasks;
      await writeQueue(tasks);
      jsonResponse(res, 200, { ok: true, count: tasks.length });
      return;
    }

    if (url.pathname === "/api/queue" && req.method === "DELETE") {
      await writeQueue([]);
      jsonResponse(res, 200, { ok: true, count: 0 });
      return;
    }

    const dataMatch = url.pathname.match(/^\/api\/data\/([a-z-]+)$/);
    if (dataMatch && req.method === "GET") {
      jsonResponse(res, 200, await readDataStore(dataMatch[1]));
      return;
    }

    if (dataMatch && req.method === "POST") {
      const name = dataMatch[1];
      const body = await readRequestBody(req);
      const payload = body.trim() ? JSON.parse(body) : {};
      if (name === "personal-profile") {
        await writeDataStore(name, payload);
        jsonResponse(res, 200, { ok: true, count: 1 });
        return;
      }

      const current = await readDataStore(name);
      if (!Array.isArray(current)) {
        throw new Error("Data store is not appendable.");
      }
      const next = Array.isArray(payload) ? [...payload, ...current] : [payload, ...current];
      await writeDataStore(name, next);
      jsonResponse(res, 200, { ok: true, count: next.length });
      return;
    }

    jsonResponse(res, 404, { ok: false, error: "Unknown API route." });
  }

  async function serveStatic(req, res, url) {
    if (url.pathname === "/") {
      res.writeHead(302, { location: "/automation-workbench/app/" });
      res.end();
      return;
    }

    if (!url.pathname.startsWith("/automation-workbench/")) {
      textResponse(res, 404, "Not found");
      return;
    }

    let relativePath;
    try {
      relativePath = decodeURIComponent(url.pathname.slice(1));
    } catch {
      textResponse(res, 400, "Bad path");
      return;
    }

    let filePath = path.resolve(workspaceRoot, relativePath);
    if (!isInside(workspaceRoot, filePath)) {
      textResponse(res, 403, "Forbidden");
      return;
    }

    let fileStat;
    try {
      fileStat = await stat(filePath);
      if (fileStat.isDirectory()) {
        filePath = path.join(filePath, "index.html");
        fileStat = await stat(filePath);
      }
    } catch {
      textResponse(res, 404, "Not found");
      return;
    }

    if (!fileStat.isFile()) {
      textResponse(res, 404, "Not found");
      return;
    }

    const mimeType = MIME_TYPES.get(path.extname(filePath).toLowerCase()) || "application/octet-stream";
    res.writeHead(200, {
      "content-type": mimeType,
      "content-length": fileStat.size,
      "cache-control": "no-store"
    });
    createReadStream(filePath).pipe(res);
  }

  async function handleRequest(req, res) {
    try {
      const url = new URL(req.url || "/", `http://${host}`);
      if (url.pathname.startsWith("/api/")) {
        await handleApi(req, res, url);
      } else {
        await serveStatic(req, res, url);
      }
    } catch (error) {
      jsonResponse(res, 500, { ok: false, error: error.message });
    }
  }

  async function start() {
    if (server?.listening) {
      const address = server.address();
      return { host, port: address.port, baseUrl: `http://${host}:${address.port}` };
    }

    await ensureQueueFile();
    let lastError;
    const maxAttempts = allowPortFallback && requestedPort !== 0 ? DEFAULT_PORT_FALLBACK_ATTEMPTS : 1;

    for (let offset = 0; offset < maxAttempts; offset += 1) {
      const port = requestedPort === 0 ? 0 : requestedPort + offset;
      server = createServer(handleRequest);
      try {
        const address = await listen(server, host, port);
        const started = { host, port: address.port, baseUrl: `http://${host}:${address.port}` };
        await writeStatus({
          ...started,
          appUrl: `${started.baseUrl}/automation-workbench/app/`,
          queuePath,
          startedAt: new Date().toISOString()
        });
        return started;
      } catch (error) {
        lastError = error;
        if (error.code !== "EADDRINUSE") {
          throw error;
        }
      }
    }

    throw lastError;
  }

  async function stop() {
    if (!server?.listening) return;
    await new Promise((resolve, reject) => {
      server.close((error) => error ? reject(error) : resolve());
    });
  }

  return {
    queuePath,
    readQueue,
    writeQueue,
    start,
    stop
  };
}

export { createWorkbenchBridge };

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const bridge = createWorkbenchBridge(parseCliArgs(process.argv.slice(2)));
  const { baseUrl } = await bridge.start();
  console.log(`Automation workbench bridge is running: ${baseUrl}/automation-workbench/app/`);
  console.log(`Shared queue file: ${bridge.queuePath}`);
}
