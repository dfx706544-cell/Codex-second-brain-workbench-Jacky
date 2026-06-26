import { createServer } from "node:http";
import { createReadStream } from "node:fs";
import { access, mkdir, readFile, rename, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_WORKBENCH_ROOT = path.dirname(SCRIPT_DIR);
const DEFAULT_WORKSPACE_ROOT = path.dirname(DEFAULT_WORKBENCH_ROOT);
const DEFAULT_HOST = "127.0.0.1";
const DEFAULT_PORT = 8787;

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

  async function writeDataStore(name, value) {
    const filePath = await ensureDataFile(name);
    const tmpPath = `${filePath}.tmp`;
    await writeFile(tmpPath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
    await rename(tmpPath, filePath);
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
          sharedQueue: true
        },
        queuePath,
        workbenchRoot
      });
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
    const maxAttempts = allowPortFallback && requestedPort !== 0 ? 10 : 1;

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
