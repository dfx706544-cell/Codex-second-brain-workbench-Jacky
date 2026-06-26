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
