import assert from "node:assert/strict";
import { copyFile, mkdir, mkdtemp, readFile, rm } from "node:fs/promises";
import path from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const WORKSPACE_ROOT = path.dirname(path.dirname(SCRIPT_DIR));

async function makeFixture() {
  const container = await mkdtemp(path.join(path.dirname(SCRIPT_DIR), ".tmp", "cloud-readiness-"));
  const root = path.join(container, "2026-06-24", "w");
  await mkdir(path.join(root, "automation-workbench", "scripts"), { recursive: true });
  await mkdir(path.join(root, "automation-workbench", "cloud"), { recursive: true });
  await mkdir(path.join(root, ".github", "workflows"), { recursive: true });
  await mkdir(path.join(root, "outputs"), { recursive: true });
  await mkdir(path.join(container, "tools", "MinGit", "cmd"), { recursive: true });

  await copyFile(
    path.join(WORKSPACE_ROOT, "automation-workbench", "scripts", "check-cloud-readiness.mjs"),
    path.join(root, "automation-workbench", "scripts", "check-cloud-readiness.mjs")
  );

  for (const file of [
    "automation-workbench/cloud/README.md",
    "automation-workbench/cloud/codex-cloud-setup-checklist.md",
    "automation-workbench/cloud/cloud-daily-brief-prompt.md",
    "automation-workbench/cloud/cloud-weekly-evolution-prompt.md",
    "automation-workbench/cloud/cloud-sync-policy.md",
    "automation-workbench/cloud/cloud-secrets-setup.md",
    "automation-workbench/scripts/second-brain-cloud-runner.mjs",
    "automation-workbench/scripts/api-budget-monitor.mjs",
    "automation-workbench/scripts/email-delivery.mjs",
    "automation-workbench/scripts/daily-brief-library.mjs",
    ".github/workflows/second-brain-daily.yml",
    ".github/workflows/second-brain-weekly.yml",
    ".gitignore"
  ]) {
    await mkdir(path.dirname(path.join(root, file)), { recursive: true });
    await copyFile(path.join(WORKSPACE_ROOT, file), path.join(root, file));
  }

  const shim = path.join(container, "tools", "MinGit", "cmd", "git.exe");
  await copyFile(process.execPath, shim);
  return { root, container };
}

test("cloud readiness check accepts bundled MinGit when system git is unavailable", async () => {
  const fixture = await makeFixture();

  try {
    const result = spawnSync(process.execPath, [
      "automation-workbench/scripts/check-cloud-readiness.mjs"
    ], {
      cwd: fixture.root,
      encoding: "utf8",
      env: { ...process.env, PATH: "" }
    });

    assert.match(result.stdout, /Git CLI available/);
    assert.doesNotMatch(result.stdout, /Git is not available in PATH/);
    assert.match(await readFile(path.join(fixture.root, "outputs", "cloud-readiness-check-latest.md"), "utf8"), /tools\/MinGit\/cmd\/git.exe/);
  } finally {
    await rm(fixture.container, { recursive: true, force: true });
  }
});
