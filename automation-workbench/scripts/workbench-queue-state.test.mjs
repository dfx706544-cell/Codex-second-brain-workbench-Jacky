import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import vm from "node:vm";
import test from "node:test";

async function loadQueueState() {
  const source = await readFile(new URL("../app/queue-state.js", import.meta.url), "utf8");
  const sandbox = { window: {} };
  vm.runInNewContext(source, sandbox, { filename: "queue-state.js" });
  return sandbox.window.WorkbenchQueueState;
}

test("queue merge ignores stale local cache when shared queue is connected", async () => {
  const queueState = await loadQueueState();
  const shared = [];
  const staleLocal = [{ id: "old-task", createdAt: "2026-06-25T08:00:00.000Z", userText: "already handled" }];

  const result = queueState.mergeSharedAndLocalQueues(shared, staleLocal);

  assert.equal(result.queue.length, 0);
  assert.equal(result.shouldUpload, false);
});

test("queue merge syncs only explicitly pending offline tasks", async () => {
  const queueState = await loadQueueState();
  const shared = [{ id: "shared-task", createdAt: "2026-06-26T08:00:00.000Z", userText: "shared" }];
  const offlineTask = queueState.toLocalPendingTask({
    id: "offline-task",
    createdAt: "2026-06-26T09:00:00.000Z",
    userText: "created while bridge was offline"
  });

  const result = queueState.mergeSharedAndLocalQueues(shared, [offlineTask]);

  assert.equal(result.shouldUpload, true);
  assert.deepEqual(Array.from(result.queue, (task) => task.id), ["offline-task", "shared-task"]);
  assert.ok(result.queue.every((task) => !("syncState" in task)));
});
