import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtemp, readFile, mkdir, writeFile, rm } from "node:fs/promises";
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
