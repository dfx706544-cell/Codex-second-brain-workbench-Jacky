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

test("workbench uses Wuyin branding and exposes a clean cloud copy entry", async () => {
  const html = await readFile(new URL("../app/index.html", import.meta.url), "utf8");
  const appSource = await readFile(new URL("../app/app.js", import.meta.url), "utf8");

  assert.match(html, /Wuyin Second Brain Workbench/);
  assert.match(html, /id="copyCloudWorkbenchButton"/);
  assert.match(appSource, /copyCloudWorkbenchButton/);
  assert.match(appSource, /CLOUD_TEMPLATE_URL/);
  assert.match(appSource, /buildCloudWorkbenchShareText/);
  assert.match(appSource, /cloudTemplateUrl/);
});

test("workbench app shell uses a premium graphite dark theme without green accents", async () => {
  const css = await readFile(new URL("../app/styles.css", import.meta.url), "utf8");

  assert.match(css, /color-scheme:\s*dark/);
  assert.match(css, /--bg:\s*#07080b/);
  assert.match(css, /--panel:\s*#10131a/);
  assert.match(css, /--ink:\s*#f4f7fb/);
  assert.match(css, /--accent:\s*#a8c3ff/);
  assert.doesNotMatch(css, /color-scheme:\s*light/);
  for (const oldGreen of ["#29b99a", "#17816d", "#18342f", "#225e51", "#102722"]) {
    assert.doesNotMatch(css, new RegExp(oldGreen, "i"));
  }
  assert.match(css, /body\s*{[\s\S]*background:\s*[\s\S]*linear-gradient\(180deg,\s*#07080b/);
  assert.match(css, /\.topbar\s*{[\s\S]*background:\s*linear-gradient\(180deg,\s*#0d1017,\s*#090b10\)/);
  assert.match(css, /\.hero-band\s*{[\s\S]*background:\s*linear-gradient\(135deg,/);
});

test("workbench bridge discovery can find fallback operation-center ports", async () => {
  const appSource = await readFile(new URL("../app/app.js", import.meta.url), "utf8");

  assert.match(appSource, /operationsCenter/);
  assert.match(appSource, /platformOpener/);
  assert.match(appSource, /8806/);
});

test("workbench can request backend platform opening from source cards", async () => {
  const appSource = await readFile(new URL("../app/app.js", import.meta.url), "utf8");

  assert.match(appSource, /function openWorkbenchSource/);
  assert.match(appSource, /\/api\/platforms\/open/);
  assert.match(appSource, /data-open-source/);
});

test("desktop launcher has a shortcut-friendly cmd wrapper", async () => {
  const ps1Source = await readFile(new URL("./start-workbench-desktop.ps1", import.meta.url), "utf8");
  const cmdSource = await readFile(new URL("./start-workbench-desktop.cmd", import.meta.url), "utf8");
  const shortcutSource = await readFile(new URL("./install-desktop-shortcut.ps1", import.meta.url), "utf8");

  assert.match(ps1Source, /\[switch\]\$NoBrowser/);
  assert.match(ps1Source, /desktop-launch\.log/);
  assert.match(ps1Source, /--new-window/);
  assert.match(ps1Source, /Start-Process -FilePath \$QuarkCandidates\[0\] -ArgumentList @\("--new-window", \$AppUrl\)/);
  assert.match(cmdSource, /start-workbench-desktop\.ps1/);
  assert.match(cmdSource, /powershell\.exe/);
  assert.match(shortcutSource, /0x65E0/);
  assert.match(shortcutSource, /0x57A0/);
  assert.match(shortcutSource, /OldShortcutNames/);
  assert.match(shortcutSource, /Codex/);
  assert.match(shortcutSource, /start-workbench-desktop\.ps1/);
  assert.match(shortcutSource, /powershell\.exe/);
  assert.match(shortcutSource, /WorkingDirectory/);
});

test("workbench includes second-brain v4 assistant modules", async () => {
  const config = await loadWorkbenchConfig();
  const modules = new Map(config.WORKBENCH_MODULES.map((module) => [module.id, module]));

  for (const id of ["growth", "health", "profile", "maintenance", "skills"]) {
    assert.ok(modules.has(id), `${id} assistant should exist`);
    assert.match(modules.get(id).workflow, /automation-workbench\/workflows\/|automation-workbench\/skills\//);
    assert.ok(modules.get(id).prompt.length > 20, `${id} assistant should include an execution prompt`);
  }
});

test("workbench routes growth, health, profile, maintenance, and skill requests", async () => {
  const config = await loadWorkbenchConfig();

  for (const key of ["growth", "health", "profile", "maintenance", "skills"]) {
    assert.ok(Array.isArray(config.ASSISTANT_ROUTING[key]), `${key} route should be configured`);
    assert.ok(config.ASSISTANT_ROUTING[key].length > 0, `${key} route should not be empty`);
  }
});

test("knowledge search skill is enabled for research and maintenance assistants", async () => {
  const config = await loadWorkbenchConfig();
  const anysearch = config.WORKBENCH_SKILLS.find((skill) => skill.id === "anysearch");

  assert.ok(anysearch.defaultModules.includes("growth"));
  assert.ok(anysearch.defaultModules.includes("health"));
  assert.ok(anysearch.defaultModules.includes("maintenance"));
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
  const workModule = config.WORKBENCH_MODULES.find((module) => module.id === "work");

  assert.ok(sources.has("dami_tikclubs"), "Dami / TikClubs should be selectable as a platform");
  assert.equal(sources.get("dami_tikclubs").url, "https://www.tikclubs.com/workbench/function_introduction");
  assert.ok(sources.get("dami_tikclubs").defaultModules.includes("work"));
  assert.ok(sources.get("dami_tikclubs").defaultModules.includes("analytics"));
  assert.ok(settings.workAssistant.platforms.some((platform) => /TikClubs/i.test(platform.name)));
  assert.ok(config.ASSISTANT_ROUTING.work.some((term) => /tikclubs/i.test(term)));
  assert.match(workModule.prompt, /TikClubs/);
  assert.match(crossBorderWorkflow, /TikClubs/);
  assert.match(accountAnalyticsWorkflow, /TikClubs/);
});

test("queue execution command is self-contained and backend-first", async () => {
  const config = await loadWorkbenchConfig();
  const command = config.WORKBENCH_PROMPTS.queueCommand;

  for (const expected of [
    "automation-workbench/queue/tasks.json",
    "automation-workbench/config/settings.json",
    "browser",
    "chrome",
    "playwright",
    "outputs/",
    "automation-workbench/data/task-history.json",
    "50"
  ]) {
    assert.ok(command.includes(expected), `queue command should include: ${expected}`);
  }
});

test("workbench exposes a compact Codex queue command", async () => {
  const config = await loadWorkbenchConfig();
  const html = await readFile(new URL("../app/index.html", import.meta.url), "utf8");
  const appSource = await readFile(new URL("../app/app.js", import.meta.url), "utf8");

  assert.equal(config.WORKBENCH_PROMPTS.compactQueueCommand, "WUYIN_RUN_QUEUE latest");
  assert.match(appSource, /compactQueueCommand/);
  assert.match(appSource, /copyCompactQueueCommandButton/);
  assert.match(appSource, /\/api\/codex\/run-queue/);
  assert.match(html, /id="copyCompactQueueCommandButton"/);
  assert.match(html, /id="handoffCodexButton"/);
});

test("workbench includes a maintenance assistant for platform and automation health", async () => {
  const config = await loadWorkbenchConfig();
  const modules = new Map(config.WORKBENCH_MODULES.map((module) => [module.id, module]));
  const maintenance = modules.get("maintenance");

  assert.ok(maintenance, "maintenance assistant should exist");
  assert.match(maintenance.workflow, /automation-workbench\/workflows\/maintenance-supervisor-workflow\.md/);
  assert.ok(maintenance.skills.includes("browser"));
  assert.ok(maintenance.skills.includes("openai-docs"));
  assert.ok(Array.isArray(config.ASSISTANT_ROUTING.maintenance));
});

test("settings define platform health and token budget monitoring", async () => {
  const settings = await loadSettings();

  assert.equal(settings.maintenance.platformHealth.enabled, true);
  assert.ok(settings.maintenance.platformHealth.checks.includes("open_url"));
  assert.equal(settings.maintenance.apiBudget.enabled, true);
  assert.equal(settings.maintenance.apiBudget.lowBalanceThresholdCny, 50);
  assert.equal(settings.maintenance.apiBudget.action, "notify_recharge_needed");
});
