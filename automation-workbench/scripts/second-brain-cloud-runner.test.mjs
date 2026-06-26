import assert from "node:assert/strict";
import { copyFile, mkdir, mkdtemp, readFile, rm } from "node:fs/promises";
import path from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const WORKSPACE_ROOT = path.dirname(path.dirname(SCRIPT_DIR));

async function copyRunnerFixture() {
  const tmpRoot = await mkdtemp(path.join(path.dirname(SCRIPT_DIR), ".tmp", "cloud-runner-"));
  const scriptsDir = path.join(tmpRoot, "automation-workbench", "scripts");
  const dataDir = path.join(tmpRoot, "automation-workbench", "data");
  await mkdir(scriptsDir, { recursive: true });
  await mkdir(dataDir, { recursive: true });
  await copyFile(
    path.join(WORKSPACE_ROOT, "automation-workbench", "scripts", "second-brain-cloud-runner.mjs"),
    path.join(scriptsDir, "second-brain-cloud-runner.mjs")
  );
  return { tmpRoot, dataDir };
}

test("daily cloud runner writes workbench-readable outputs and data", async () => {
  const fixture = await copyRunnerFixture();

  try {
    const result = spawnSync(process.execPath, [
      "automation-workbench/scripts/second-brain-cloud-runner.mjs",
      "daily"
    ], {
      cwd: fixture.tmpRoot,
      encoding: "utf8"
    });

    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /Second Brain daily runner completed/);

    const dailyBriefs = JSON.parse(await readFile(path.join(fixture.dataDir, "daily-briefs.json"), "utf8"));
    const businessFeedback = JSON.parse(await readFile(path.join(fixture.dataDir, "business-feedback.json"), "utf8"));
    const knowledgeItems = JSON.parse(await readFile(path.join(fixture.dataDir, "knowledge-items.json"), "utf8"));
    const taskHistory = JSON.parse(await readFile(path.join(fixture.dataDir, "task-history.json"), "utf8"));

    assert.equal(dailyBriefs.length, 1);
    assert.equal(businessFeedback.length, 1);
    assert.equal(knowledgeItems.length, 1);
    assert.equal(taskHistory.length, 1);
    assert.ok(dailyBriefs[0].outputs.some((item) => item.startsWith("outputs/daily-brief-")));
  } finally {
    await rm(fixture.tmpRoot, { recursive: true, force: true });
  }
});

test("weekly cloud runner writes an evolution audit without existing history", async () => {
  const fixture = await copyRunnerFixture();

  try {
    const result = spawnSync(process.execPath, [
      "automation-workbench/scripts/second-brain-cloud-runner.mjs",
      "weekly"
    ], {
      cwd: fixture.tmpRoot,
      encoding: "utf8"
    });

    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /Second Brain weekly runner completed/);

    const taskHistory = JSON.parse(await readFile(path.join(fixture.dataDir, "task-history.json"), "utf8"));
    assert.equal(taskHistory.length, 1);
    assert.match(taskHistory[0].outputs[0], /^outputs\/weekly-evolution-audit-/);
  } finally {
    await rm(fixture.tmpRoot, { recursive: true, force: true });
  }
});
