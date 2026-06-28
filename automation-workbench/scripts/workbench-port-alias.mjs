import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_WORKBENCH_ROOT = path.dirname(SCRIPT_DIR);
const DEFAULT_HOST = "127.0.0.1";
const DEFAULT_PORTS = [8788, 8800];

async function readBridgeBaseUrl(workbenchRoot) {
  const statusPath = path.join(workbenchRoot, "queue", "bridge-status.json");
  const raw = await readFile(statusPath, "utf8");
  const status = JSON.parse(raw);
  if (!status?.baseUrl || !/^https?:\/\/127\.0\.0\.1:\d+$/u.test(status.baseUrl)) {
    throw new Error("bridge-status.json does not contain a usable local baseUrl.");
  }
  return status.baseUrl;
}

function parseArgs(argv) {
  const options = {};
  for (let index = 0; index < argv.length; index += 1) {
    const current = argv[index];
    if (current === "--host") {
      options.host = argv[index + 1];
      index += 1;
    } else if (current === "--ports") {
      options.ports = String(argv[index + 1] || "")
        .split(",")
        .map((value) => Number(value.trim()))
        .filter(Number.isInteger);
      index += 1;
    } else if (current === "--workbench-root") {
      options.workbenchRoot = argv[index + 1];
      index += 1;
    }
  }
  return options;
}

function listen(server, host, port) {
  return new Promise((resolve, reject) => {
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

function createWorkbenchPortAlias(options = {}) {
  const workbenchRoot = path.resolve(options.workbenchRoot || DEFAULT_WORKBENCH_ROOT);
  const host = options.host || DEFAULT_HOST;
  const ports = options.ports || DEFAULT_PORTS;
  const servers = [];

  function createAliasServer() {
    return createServer(async (req, res) => {
      try {
        const baseUrl = await readBridgeBaseUrl(workbenchRoot);
        const target = new URL(req.url || "/", baseUrl);
        res.writeHead(302, {
          location: target.href,
          "cache-control": "no-store"
        });
        res.end();
      } catch (error) {
        res.writeHead(503, { "content-type": "text/plain; charset=utf-8" });
        res.end(`Wuyin workbench bridge is not ready: ${error.message}`);
      }
    });
  }

  async function start() {
    const started = [];
    for (const port of ports) {
      const server = createAliasServer();
      try {
        const address = await listen(server, host, port);
        servers.push(server);
        started.push({ host, port: address.port });
      } catch (error) {
        if (error.code !== "EADDRINUSE") {
          throw error;
        }
      }
    }
    return started;
  }

  async function stop() {
    await Promise.all(servers.map((server) => new Promise((resolve, reject) => {
      server.close((error) => error ? reject(error) : resolve());
    })));
    servers.length = 0;
  }

  return { start, stop };
}

export { createWorkbenchPortAlias };

if (process.argv[1] && import.meta.url === new URL(`file://${process.argv[1].replaceAll("\\", "/")}`).href) {
  const alias = createWorkbenchPortAlias(parseArgs(process.argv.slice(2)));
  const started = await alias.start();
  console.log(`Wuyin workbench port aliases running: ${started.map((item) => `${item.host}:${item.port}`).join(", ")}`);
}
