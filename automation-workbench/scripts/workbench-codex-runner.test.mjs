import assert from "node:assert/strict";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";

import {
  buildCodexQueuePrompt,
  claimNextQueueTask,
  shouldRunTask
} from "./workbench-codex-runner.mjs";

async function makeFixture() {
  const workspaceRoot = await mkdtemp(path.join(process.cwd(), "automation-workbench", ".tmp", "codex-runner-"));
  const workbenchRoot = path.join(workspaceRoot, "automation-workbench");
  await mkdir(path.join(workbenchRoot, "queue"), { recursive: true });
  return {
    workspaceRoot,
    workbenchRoot,
    queuePath: path.join(workbenchRoot, "queue", "tasks.json")
  };
}

test("compact queue prompt points Codex at the shared queue and task id", () => {
  const prompt = buildCodexQueuePrompt({
    workspaceRoot: "C:\\Users\\Jacky\\w",
    taskId: "task-1"
  });

  assert.match(prompt, /^WUYIN_RUN_TASK task-1/m);
  assert.match(prompt, /C:\\Users\\Jacky\\w/);
  assert.match(prompt, /automation-workbench\/queue\/tasks\.json/);
  assert.match(prompt, /outputs\//);
  assert.match(prompt, /不要执行真实交易、支付、发布或社交外发/);
});

test("runner only claims pending tasks and marks the selected task", async () => {
  const fixture = await makeFixture();
  await writeFile(
    fixture.queuePath,
    JSON.stringify([
      { id: "task-old", createdAt: "2026-06-27T00:00:00.000Z", userText: "old", codexRun: { status: "running" } },
      { id: "task-new", createdAt: "2026-06-28T00:00:00.000Z", userText: "new" }
    ], null, 2),
    "utf8"
  );

  try {
    const result = await claimNextQueueTask({ queuePath: fixture.queuePath, workspaceRoot: fixture.workspaceRoot });
    assert.equal(result.task.id, "task-new");
    assert.equal(result.prompt.includes("WUYIN_RUN_TASK task-new"), true);

    const stored = JSON.parse(await readFile(fixture.queuePath, "utf8"));
    assert.equal(stored[0].id, "task-old");
    assert.equal(stored[1].id, "task-new");
    assert.equal(stored[1].codexRun.status, "running");
    assert.ok(stored[1].codexRun.claimedAt);
  } finally {
    await rm(fixture.workspaceRoot, { recursive: true, force: true });
  }
});

test("runner skips tasks that require foreground confirmation unless allowed", () => {
  assert.equal(shouldRunTask({ userText: "帮我回复微信消息" }, { allowSensitive: false }), false);
  assert.equal(shouldRunTask({ userText: "帮我整理 Excel 报表" }, { allowSensitive: false }), true);
  assert.equal(shouldRunTask({ userText: "帮我回复微信消息" }, { allowSensitive: true }), true);
});
