import assert from "node:assert/strict";
import { mkdtemp, readFile, readdir, rm } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const WORKBENCH_ROOT = path.dirname(SCRIPT_DIR);
const WORKSPACE_ROOT = path.dirname(WORKBENCH_ROOT);

async function readAllTextFiles(root) {
  const entries = await readdir(root, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const entryPath = path.join(root, entry.name);
    if (entry.isDirectory()) {
      files.push(...await readAllTextFiles(entryPath));
      continue;
    }

    files.push(await readFile(entryPath, "utf8"));
  }

  return files;
}

test("GitHub Pages workflow publishes a sanitized cloud share artifact", async () => {
  const workflow = await readFile(path.join(WORKSPACE_ROOT, ".github", "workflows", "pages.yml"), "utf8");

  assert.match(workflow, /deploy-pages/);
  assert.match(workflow, /build-cloud-share\.mjs/);
  assert.match(workflow, /path: \.pages-site/);
});

test("cloud share build copies only public workbench assets", async () => {
  const outputRoot = await mkdtemp(path.join(WORKBENCH_ROOT, ".tmp", "pages-site-"));
  const result = spawnSync(process.execPath, [
    path.join(WORKBENCH_ROOT, "scripts", "build-cloud-share.mjs"),
    "--out",
    outputRoot
  ], {
    cwd: WORKSPACE_ROOT,
    encoding: "utf8"
  });

  try {
    assert.equal(result.status, 0, result.stderr);
    const rootIndex = await readFile(path.join(outputRoot, "index.html"), "utf8");
    assert.match(rootIndex, /automation-workbench\/app\//);

    const appIndex = await readFile(path.join(outputRoot, "automation-workbench", "app", "index.html"), "utf8");
    assert.match(appIndex, /app\.js/);

    const publicFiles = (await readAllTextFiles(outputRoot)).join("\n");

    for (const privateMarker of [
      "Jacky",
      "jacky060911",
      "jacky060911@163.com",
      "嘉十一",
      "C:\\\\Users",
      "C:/Users",
      "JianyingPro.exe",
      "Standard Chartered",
      "渣打",
      "history-task-",
      "task-1782473691525",
      "outputs/task-",
      "automation-workbench/data/",
      "automation-workbench\\\\data\\\\"
    ]) {
      assert.ok(!publicFiles.includes(privateMarker), `cloud share must not expose ${privateMarker}`);
    }

    await assert.rejects(
      readFile(path.join(outputRoot, "automation-workbench", "data", "task-history.json"), "utf8"),
      /ENOENT/
    );
    await assert.rejects(
      readFile(path.join(outputRoot, "outputs", "daily-brief-2026-06-26.md"), "utf8"),
      /ENOENT/
    );
  } finally {
    await rm(outputRoot, { recursive: true, force: true });
  }
});

test("app distinguishes cloud share mode from local bridge mode", async () => {
  const appSource = await readFile(path.join(WORKBENCH_ROOT, "app", "app.js"), "utf8");
  const appHtml = await readFile(path.join(WORKBENCH_ROOT, "app", "index.html"), "utf8");

  assert.match(appSource, /isCloudShareMode/);
  assert.match(appSource, /云端分享模式/);
  assert.match(appSource, /PERSONALIZATION_KEY/);
  assert.match(appSource, /buildPersonalWorkbenchPrompt/);
  assert.match(appHtml, /cloudPersonalizationPanel/);
  assert.match(appHtml, /个性化工作台配置/);
});
