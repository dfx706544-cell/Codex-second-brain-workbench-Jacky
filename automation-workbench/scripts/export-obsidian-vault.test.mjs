import assert from "node:assert/strict";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const WORKBENCH_ROOT = path.dirname(SCRIPT_DIR);

test("Obsidian export writes workbench data as markdown notes", async () => {
  const tmpRoot = await mkdtemp(path.join(WORKBENCH_ROOT, ".tmp", "obsidian-export-"));
  const dataDir = path.join(tmpRoot, "automation-workbench", "data");
  const vaultDir = path.join(tmpRoot, "obsidian-vault");
  await mkdir(dataDir, { recursive: true });

  await writeFile(path.join(dataDir, "knowledge-items.json"), JSON.stringify([
    {
      id: "knowledge-ai-agent",
      title: "AI Agent 观察",
      summaryZh: "跟踪模型与 Agent 对工作台自动化的影响。",
      sourceUrl: "https://example.com/ai-agent",
      publishedAt: "2026-06-27",
      createdAt: "2026-06-27T08:00:00.000Z",
      tags: ["AI", "自动化"]
    }
  ], null, 2), "utf8");
  await writeFile(path.join(dataDir, "daily-briefs.json"), JSON.stringify([
    {
      id: "daily-brief-2026-06-27",
      title: "2026-06-27 信息简报",
      summary: "日报摘要",
      date: "2026-06-27",
      outputs: ["outputs/daily-brief-2026-06-27.md"]
    }
  ], null, 2), "utf8");
  await writeFile(path.join(dataDir, "business-feedback.json"), "[]\n", "utf8");
  await writeFile(path.join(dataDir, "task-history.json"), JSON.stringify([
    {
      id: "history-1",
      userText: "执行每日任务",
      summary: "已生成日报。",
      status: "completed",
      completedAt: "2026-06-27T09:00:00.000Z",
      outputs: ["outputs/daily-brief-2026-06-27.md"]
    }
  ], null, 2), "utf8");

  try {
    const result = spawnSync(process.execPath, [
      path.join(WORKBENCH_ROOT, "scripts", "export-obsidian-vault.mjs"),
      "--workbench-root",
      path.join(tmpRoot, "automation-workbench"),
      "--out",
      vaultDir
    ], {
      cwd: tmpRoot,
      encoding: "utf8"
    });

    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /Obsidian vault exported/);

    const readme = await readFile(path.join(vaultDir, "README.md"), "utf8");
    assert.match(readme, /无垠 Obsidian 知识库/);
    assert.match(readme, /Knowledge/);

    const knowledge = await readFile(path.join(vaultDir, "Knowledge", "AI Agent 观察.md"), "utf8");
    assert.match(knowledge, /跟踪模型与 Agent/);
    assert.match(knowledge, /https:\/\/example\.com\/ai-agent/);

    const daily = await readFile(path.join(vaultDir, "Daily Briefs", "2026-06-27 信息简报.md"), "utf8");
    assert.match(daily, /日报摘要/);

    const history = await readFile(path.join(vaultDir, "Task History", "history-1.md"), "utf8");
    assert.match(history, /执行每日任务/);
    assert.match(history, /outputs\/daily-brief-2026-06-27\.md/);
  } finally {
    await rm(tmpRoot, { recursive: true, force: true });
  }
});
