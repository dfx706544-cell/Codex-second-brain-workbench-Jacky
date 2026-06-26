import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import vm from "node:vm";
import test from "node:test";

async function loadWorkbenchConfig() {
  const source = await readFile(new URL("../app/modules.js", import.meta.url), "utf8");
  const sandbox = { window: {} };
  vm.runInNewContext(source, sandbox, { filename: "modules.js" });
  return sandbox.window;
}

async function loadSettings() {
  return JSON.parse(await readFile(new URL("../config/settings.json", import.meta.url), "utf8"));
}

test("workbench exposes an operations center tab and view", async () => {
  const html = await readFile(new URL("../app/index.html", import.meta.url), "utf8");

  assert.match(html, /data-view="opsView"/);
  assert.match(html, /id="opsView"/);
  assert.match(html, /queue-state\.js/);
});

test("workbench bridge discovery can find fallback operation-center ports", async () => {
  const appSource = await readFile(new URL("../app/app.js", import.meta.url), "utf8");

  assert.match(appSource, /operationsCenter/);
  assert.match(appSource, /8796/);
});

test("workbench includes second-brain v4 assistant modules", async () => {
  const config = await loadWorkbenchConfig();
  const modules = new Map(config.WORKBENCH_MODULES.map((module) => [module.id, module]));

  for (const id of ["growth", "health", "profile"]) {
    assert.ok(modules.has(id), `${id} assistant should exist`);
    assert.match(modules.get(id).workflow, /automation-workbench\/workflows\//);
    assert.ok(modules.get(id).prompt.length > 20, `${id} assistant should include an execution prompt`);
  }
});

test("workbench routes growth, health, and profile requests", async () => {
  const config = await loadWorkbenchConfig();

  assert.ok(config.ASSISTANT_ROUTING.growth.includes("心理学"));
  assert.ok(config.ASSISTANT_ROUTING.health.includes("训练"));
  assert.ok(config.ASSISTANT_ROUTING.profile.includes("个人画像"));
});

test("knowledge search skill is enabled for v4 research assistants", async () => {
  const config = await loadWorkbenchConfig();
  const anysearch = config.WORKBENCH_SKILLS.find((skill) => skill.id === "anysearch");

  assert.ok(anysearch.defaultModules.includes("growth"));
  assert.ok(anysearch.defaultModules.includes("health"));
});

test("workbench exposes currently available Codex extension skills", async () => {
  const config = await loadWorkbenchConfig();
  const skillIds = new Set(config.WORKBENCH_SKILLS.map((skill) => skill.id));

  for (const id of [
    "chrome",
    "computer-use",
    "openai-docs",
    "imagegen",
    "plugin-creator",
    "skill-creator",
    "template-creator"
  ]) {
    assert.ok(skillIds.has(id), `${id} should be visible in the workbench skill picker`);
  }
});

test("workbench exposes Dami TikClubs for ecommerce BD workflows", async () => {
  const config = await loadWorkbenchConfig();
  const settings = await loadSettings();
  const crossBorderWorkflow = await readFile(new URL("../workflows/cross-border-inquiry-workflow.md", import.meta.url), "utf8");
  const accountAnalyticsWorkflow = await readFile(new URL("../workflows/account-analytics-workflow.md", import.meta.url), "utf8");
  const sources = new Map(config.WORKBENCH_SOURCES.map((source) => [source.id, source]));
  const platformNames = new Set(settings.workAssistant.platforms.map((platform) => platform.name));
  const workModule = config.WORKBENCH_MODULES.find((module) => module.id === "work");

  assert.ok(sources.has("dami_tikclubs"), "Dami / TikClubs should be selectable as a platform");
  assert.equal(sources.get("dami_tikclubs").url, "https://www.tikclubs.com/workbench/function_introduction");
  assert.ok(sources.get("dami_tikclubs").defaultModules.includes("work"));
  assert.ok(sources.get("dami_tikclubs").defaultModules.includes("analytics"));
  assert.ok(platformNames.has("达秘 / TikClubs"), "Dami / TikClubs should be configured for open-platform.ps1");
  assert.ok(config.ASSISTANT_ROUTING.work.includes("达秘"));
  assert.ok(config.ASSISTANT_ROUTING.work.includes("tikclubs"));
  assert.match(workModule.prompt, /达秘 \/ TikClubs/);
  assert.match(crossBorderWorkflow, /达秘 \/ TikClubs/);
  assert.match(accountAnalyticsWorkflow, /达秘 \/ TikClubs/);
});
