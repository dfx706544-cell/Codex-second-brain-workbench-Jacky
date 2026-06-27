import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtemp, readFile, mkdir, writeFile, rm } from "node:fs/promises";
import { createServer } from "node:http";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { createWorkbenchBridge } from "./workbench-bridge.mjs";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const TEST_TMP_ROOT = path.join(path.dirname(SCRIPT_DIR), ".tmp");

async function makeFixture() {
  await mkdir(TEST_TMP_ROOT, { recursive: true });
  const workspaceRoot = await mkdtemp(path.join(TEST_TMP_ROOT, "workbench-bridge-"));
  const workbenchRoot = path.join(workspaceRoot, "automation-workbench");
  await mkdir(path.join(workbenchRoot, "app"), { recursive: true });
  await writeFile(path.join(workbenchRoot, "app", "index.html"), "<!doctype html><title>Workbench</title>");
  return { workspaceRoot, workbenchRoot };
}

async function occupyPort(port) {
  const server = createServer((_req, res) => {
    res.writeHead(200, { "content-type": "text/plain" });
    res.end("occupied");
  });
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(port, "127.0.0.1", resolve);
  });
  return server;
}

async function closeServer(server) {
  await new Promise((resolve, reject) => {
    server.close((error) => error ? reject(error) : resolve());
  });
}

test("bridge persists queue tasks to a shared JSON file", async () => {
  const fixture = await makeFixture();
  const bridge = createWorkbenchBridge({
    workspaceRoot: fixture.workspaceRoot,
    workbenchRoot: fixture.workbenchRoot,
    host: "127.0.0.1",
    port: 0
  });

  try {
    const { baseUrl } = await bridge.start();
    const emptyResponse = await fetch(`${baseUrl}/api/queue`);
    assert.equal(emptyResponse.status, 200);
    assert.deepEqual(await emptyResponse.json(), []);

    const tasks = [{ id: "task-1", createdAt: "2026-06-25T00:00:00.000Z", userText: "测试任务" }];
    const saveResponse = await fetch(`${baseUrl}/api/queue`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(tasks)
    });
    assert.equal(saveResponse.status, 200);
    assert.deepEqual(await saveResponse.json(), { ok: true, count: 1 });

    const stored = JSON.parse(await readFile(path.join(fixture.workbenchRoot, "queue", "tasks.json"), "utf8"));
    assert.deepEqual(stored, tasks);

    const roundtripResponse = await fetch(`${baseUrl}/api/queue`);
    assert.deepEqual(await roundtripResponse.json(), tasks);
  } finally {
    await bridge.stop();
    await rm(fixture.workspaceRoot, { recursive: true, force: true });
  }
});

test("bridge reads queue files saved with UTF-8 BOM", async () => {
  const fixture = await makeFixture();
  await mkdir(path.join(fixture.workbenchRoot, "queue"), { recursive: true });
  await writeFile(
    path.join(fixture.workbenchRoot, "queue", "tasks.json"),
    `\uFEFF${JSON.stringify([{ id: "task-bom", userText: "BOM queue" }])}`,
    "utf8"
  );
  const bridge = createWorkbenchBridge({
    workspaceRoot: fixture.workspaceRoot,
    workbenchRoot: fixture.workbenchRoot,
    host: "127.0.0.1",
    port: 0
  });

  try {
    const { baseUrl } = await bridge.start();
    const response = await fetch(`${baseUrl}/api/queue`);
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), [{ id: "task-bom", userText: "BOM queue" }]);
  } finally {
    await bridge.stop();
    await rm(fixture.workspaceRoot, { recursive: true, force: true });
  }
});

test("bridge module can be imported from node eval", () => {
  const result = spawnSync(process.execPath, [
    "-e",
    "import('./automation-workbench/scripts/workbench-bridge.mjs').then(() => console.log('ok'))"
  ], {
    cwd: path.dirname(path.dirname(SCRIPT_DIR)),
    encoding: "utf8"
  });

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /ok/);
});

test("bridge serves the workbench app from localhost", async () => {
  const fixture = await makeFixture();
  const bridge = createWorkbenchBridge({
    workspaceRoot: fixture.workspaceRoot,
    workbenchRoot: fixture.workbenchRoot,
    host: "127.0.0.1",
    port: 0
  });

  try {
    const { baseUrl } = await bridge.start();
    const response = await fetch(`${baseUrl}/automation-workbench/app/`);
    assert.equal(response.status, 200);
    assert.match(await response.text(), /Workbench/);
  } finally {
    await bridge.stop();
    await rm(fixture.workspaceRoot, { recursive: true, force: true });
  }
});

test("bridge can fall back beyond ten occupied desktop ports", async () => {
  const fixture = await makeFixture();
  const blockers = [];
  for (let offset = 0; offset < 10; offset += 1) {
    blockers.push(await occupyPort(9100 + offset));
  }

  const bridge = createWorkbenchBridge({
    workspaceRoot: fixture.workspaceRoot,
    workbenchRoot: fixture.workbenchRoot,
    host: "127.0.0.1",
    port: 9100
  });

  try {
    const { port } = await bridge.start();
    assert.equal(port, 9110);
  } finally {
    await bridge.stop();
    await Promise.all(blockers.map(closeServer));
    await rm(fixture.workspaceRoot, { recursive: true, force: true });
  }
});

test("bridge health exposes data hub capability", async () => {
  const fixture = await makeFixture();
  const bridge = createWorkbenchBridge({
    workspaceRoot: fixture.workspaceRoot,
    workbenchRoot: fixture.workbenchRoot,
    host: "127.0.0.1",
    port: 0
  });

  try {
    const { baseUrl } = await bridge.start();
    const response = await fetch(`${baseUrl}/api/health`);
    assert.equal(response.status, 200);
    const payload = await response.json();
    assert.equal(payload.capabilities.dataHub, true);
    assert.equal(payload.capabilities.operationsCenter, true);
  } finally {
    await bridge.stop();
    await rm(fixture.workspaceRoot, { recursive: true, force: true });
  }
});

test("bridge status summarizes operations center health", async () => {
  const fixture = await makeFixture();
  await mkdir(path.join(fixture.workbenchRoot, "queue"), { recursive: true });
  await mkdir(path.join(fixture.workbenchRoot, "data"), { recursive: true });
  await mkdir(path.join(fixture.workspaceRoot, "outputs", "task-ops"), { recursive: true });
  await writeFile(
    path.join(fixture.workbenchRoot, "queue", "tasks.json"),
    JSON.stringify([{ id: "task-pending", createdAt: "2026-06-26T08:00:00.000Z", userText: "pending task" }], null, 2),
    "utf8"
  );
  await writeFile(
    path.join(fixture.workbenchRoot, "data", "task-history.json"),
    JSON.stringify([{
      id: "task-done",
      completedAt: "2026-06-26T09:00:00.000Z",
      userText: "done task",
      outputs: ["outputs/task-ops/report.md"]
    }], null, 2),
    "utf8"
  );
  await writeFile(
    path.join(fixture.workbenchRoot, "data", "knowledge-items.json"),
    JSON.stringify([{ id: "k1" }, { id: "k2" }], null, 2),
    "utf8"
  );
  await writeFile(
    path.join(fixture.workbenchRoot, "data", "daily-briefs.json"),
    JSON.stringify([{ id: "brief-1" }], null, 2),
    "utf8"
  );
  await writeFile(
    path.join(fixture.workbenchRoot, "data", "business-feedback.json"),
    JSON.stringify([{ id: "feedback-1" }], null, 2),
    "utf8"
  );
  await writeFile(path.join(fixture.workspaceRoot, "outputs", "task-ops", "report.md"), "# Report\n", "utf8");

  const bridge = createWorkbenchBridge({
    workspaceRoot: fixture.workspaceRoot,
    workbenchRoot: fixture.workbenchRoot,
    host: "127.0.0.1",
    port: 0
  });

  try {
    const { baseUrl } = await bridge.start();
    const response = await fetch(`${baseUrl}/api/status`);
    assert.equal(response.status, 200);
    const payload = await response.json();
    assert.equal(payload.queue.pendingCount, 1);
    assert.equal(payload.dataHub.knowledgeItems, 2);
    assert.equal(payload.dataHub.taskHistory, 1);
    assert.equal(payload.dataHub.dailyBriefs, 1);
    assert.equal(payload.dataHub.businessFeedback, 1);
    assert.equal(payload.latestCompletedTask.id, "task-done");
    assert.equal(payload.latestOutputs[0].path, "outputs/task-ops/report.md");
    assert.ok(payload.cloudReadiness.checks.some((check) => check.id === "codex-cloud-checklist"));
    assert.ok(payload.reminders.some((reminder) => reminder.id === "daily-brief"));
    assert.ok(payload.confirmations.some((confirmation) => confirmation.id === "external-send"));
  } finally {
    await bridge.stop();
    await rm(fixture.workspaceRoot, { recursive: true, force: true });
  }
});

test("bridge reads data hub JSON stores", async () => {
  const fixture = await makeFixture();
  await mkdir(path.join(fixture.workbenchRoot, "data"), { recursive: true });
  await writeFile(
    path.join(fixture.workbenchRoot, "data", "knowledge-items.json"),
    JSON.stringify([{ id: "k1", title: "测试知识" }], null, 2),
    "utf8"
  );
  const bridge = createWorkbenchBridge({
    workspaceRoot: fixture.workspaceRoot,
    workbenchRoot: fixture.workbenchRoot,
    host: "127.0.0.1",
    port: 0
  });

  try {
    const { baseUrl } = await bridge.start();
    const response = await fetch(`${baseUrl}/api/data/knowledge-items`);
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), [{ id: "k1", title: "测试知识" }]);
  } finally {
    await bridge.stop();
    await rm(fixture.workspaceRoot, { recursive: true, force: true });
  }
});

test("bridge appends task history records", async () => {
  const fixture = await makeFixture();
  const bridge = createWorkbenchBridge({
    workspaceRoot: fixture.workspaceRoot,
    workbenchRoot: fixture.workbenchRoot,
    host: "127.0.0.1",
    port: 0
  });

  try {
    const { baseUrl } = await bridge.start();
    const response = await fetch(`${baseUrl}/api/data/task-history`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id: "task-1", category: "system", userText: "记录测试" })
    });
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { ok: true, count: 1 });

    const stored = JSON.parse(await readFile(path.join(fixture.workbenchRoot, "data", "task-history.json"), "utf8"));
    assert.equal(stored[0].id, "task-1");
    assert.equal(stored[0].category, "system");
  } finally {
    await bridge.stop();
    await rm(fixture.workspaceRoot, { recursive: true, force: true });
  }
});

test("bridge exposes configured platform links", async () => {
  const fixture = await makeFixture();
  await mkdir(path.join(fixture.workbenchRoot, "config"), { recursive: true });
  await writeFile(
    path.join(fixture.workbenchRoot, "config", "settings.json"),
    JSON.stringify({
      workAssistant: {
        platforms: [
          { name: "Kalodata", url: "https://www.kalodata.com/", enabled: true, purpose: "Product research" },
          { name: "Disabled Platform", url: "https://example.com/disabled", enabled: false, purpose: "Disabled" }
        ]
      }
    }, null, 2),
    "utf8"
  );

  const bridge = createWorkbenchBridge({
    workspaceRoot: fixture.workspaceRoot,
    workbenchRoot: fixture.workbenchRoot,
    host: "127.0.0.1",
    port: 0
  });

  try {
    const { baseUrl } = await bridge.start();
    const response = await fetch(`${baseUrl}/api/platforms`);
    assert.equal(response.status, 200);
    const payload = await response.json();
    assert.equal(payload.platforms.length, 2);
    assert.equal(payload.platforms[0].id, "kalodata");
    assert.equal(payload.platforms[0].enabled, true);
    assert.equal(payload.platforms[1].enabled, false);
  } finally {
    await bridge.stop();
    await rm(fixture.workspaceRoot, { recursive: true, force: true });
  }
});

test("bridge opens configured platform links through an injected opener", async () => {
  const fixture = await makeFixture();
  await mkdir(path.join(fixture.workbenchRoot, "config"), { recursive: true });
  await writeFile(
    path.join(fixture.workbenchRoot, "config", "settings.json"),
    JSON.stringify({
      workAssistant: {
        platforms: [
          { name: "Kalodata", url: "https://www.kalodata.com/", enabled: true, purpose: "Product research" }
        ]
      }
    }, null, 2),
    "utf8"
  );
  const opened = [];
  const bridge = createWorkbenchBridge({
    workspaceRoot: fixture.workspaceRoot,
    workbenchRoot: fixture.workbenchRoot,
    host: "127.0.0.1",
    port: 0,
    openExternal: async (url) => opened.push(url)
  });

  try {
    const { baseUrl } = await bridge.start();
    const response = await fetch(`${baseUrl}/api/platforms/open`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id: "kalodata" })
    });
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), {
      ok: true,
      id: "kalodata",
      name: "Kalodata",
      url: "https://www.kalodata.com/",
      appPath: ""
    });
    assert.deepEqual(opened, ["https://www.kalodata.com/"]);
  } finally {
    await bridge.stop();
    await rm(fixture.workspaceRoot, { recursive: true, force: true });
  }
});

test("bridge opens configured local app paths through an injected opener", async () => {
  const fixture = await makeFixture();
  await mkdir(path.join(fixture.workbenchRoot, "config"), { recursive: true });
  await writeFile(
    path.join(fixture.workbenchRoot, "config", "settings.json"),
    JSON.stringify({
      workAssistant: {
        platforms: [
          {
            id: "obsidian",
            name: "Obsidian",
            appPath: "C:\\Users\\Jacky\\AppData\\Local\\Programs\\Obsidian\\Obsidian.exe",
            enabled: true,
            purpose: "Knowledge base"
          }
        ]
      }
    }, null, 2),
    "utf8"
  );
  const opened = [];
  const bridge = createWorkbenchBridge({
    workspaceRoot: fixture.workspaceRoot,
    workbenchRoot: fixture.workbenchRoot,
    host: "127.0.0.1",
    port: 0,
    openExternal: async (target) => opened.push(target)
  });

  try {
    const { baseUrl } = await bridge.start();
    const response = await fetch(`${baseUrl}/api/platforms/open`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id: "obsidian" })
    });
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), {
      ok: true,
      id: "obsidian",
      name: "Obsidian",
      url: "",
      appPath: "C:\\Users\\Jacky\\AppData\\Local\\Programs\\Obsidian\\Obsidian.exe"
    });
    assert.deepEqual(opened, ["C:\\Users\\Jacky\\AppData\\Local\\Programs\\Obsidian\\Obsidian.exe"]);
  } finally {
    await bridge.stop();
    await rm(fixture.workspaceRoot, { recursive: true, force: true });
  }
});
