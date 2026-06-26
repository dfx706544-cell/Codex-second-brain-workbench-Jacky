import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const WORKBENCH_ROOT = path.dirname(SCRIPT_DIR);
const WORKSPACE_ROOT = path.dirname(WORKBENCH_ROOT);

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
