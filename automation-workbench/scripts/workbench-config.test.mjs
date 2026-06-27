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

test("workbench uses Shiyi second-brain branding and exposes a clean cloud copy entry", async () => {
  const html = await readFile(new URL("../app/index.html", import.meta.url), "utf8");
  const appSource = await readFile(new URL("../app/app.js", import.meta.url), "utf8");

  assert.match(html, /<title>十一 第二大脑自动化工作台<\/title>/);
  assert.match(html, /<h1>十一<\/h1>/);
  assert.match(html, /第二大脑自动化工作台/);
  assert.match(html, /id="copyCloudWorkbenchButton"/);
  assert.match(html, /一键复制我的工作台/);

  assert.match(appSource, /copyCloudWorkbenchButton/);
  assert.match(appSource, /CLOUD_TEMPLATE_URL/);
  assert.match(appSource, /干净独立模板/);
  assert.match(appSource, /不包含 Jacky 的历史记录、outputs、队列、账号权限或后台自动化/);
});

test("workbench app shell uses an eye-friendly dark theme", async () => {
  const css = await readFile(new URL("../app/styles.css", import.meta.url), "utf8");

  assert.match(css, /color-scheme:\s*dark/);
  assert.match(css, /--bg:\s*#0b0f14/);
  assert.match(css, /--panel:\s*#121821/);
  assert.match(css, /--ink:\s*#edf2f7/);
  assert.doesNotMatch(css, /color-scheme:\s*light/);
  assert.match(css, /body\s*{[\s\S]*background:\s*var\(--bg\)/);
  assert.match(css, /\.topbar\s*{[\s\S]*background:\s*#0f151d/);
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
  assert.doesNotMatch(ps1Source, /--new-window/);
  assert.match(ps1Source, /Start-Process -FilePath \$QuarkCandidates\[0\] -ArgumentList @\(\$AppUrl\)/);
  assert.match(cmdSource, /start-workbench-desktop\.ps1/);
  assert.match(cmdSource, /powershell\.exe/);
  assert.match(shortcutSource, /Codex自动化工作台\.lnk/);
  assert.match(shortcutSource, /start-workbench-desktop\.ps1/);
  assert.match(shortcutSource, /powershell\.exe/);
  assert.match(shortcutSource, /WorkingDirectory/);
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

test("queue execution command is self-contained and backend-first", async () => {
  const config = await loadWorkbenchConfig();
  const command = config.WORKBENCH_PROMPTS.queueCommand;

  for (const expected of [
    "C:\\Users\\嘉十一\\Documents\\Codex\\2026-06-24\\w",
    "automation-workbench/queue/tasks.json",
    "优先执行最新任务",
    "优先在后端",
    "无法在后台",
    "请求接管我的电脑",
    "登录、验证码、二次验证",
    "outputs/",
    "automation-workbench/data/task-history.json",
    "新建对话"
  ]) {
    assert.ok(command.includes(expected), `queue command should include: ${expected}`);
  }
});

test("workbench includes a maintenance assistant for platform and automation health", async () => {
  const config = await loadWorkbenchConfig();
  const modules = new Map(config.WORKBENCH_MODULES.map((module) => [module.id, module]));
  const maintenance = modules.get("maintenance");

  assert.ok(maintenance, "maintenance assistant should exist");
  assert.match(maintenance.workflow, /automation-workbench\/workflows\/maintenance-supervisor-workflow\.md/);
  assert.ok(maintenance.skills.includes("browser"));
  assert.ok(maintenance.skills.includes("openai-docs"));
  assert.ok(config.ASSISTANT_ROUTING.maintenance.includes("维护"));
  assert.ok(config.ASSISTANT_ROUTING.maintenance.includes("平台接入"));
});

test("settings define platform health and token budget monitoring", async () => {
  const settings = await loadSettings();

  assert.equal(settings.maintenance.platformHealth.enabled, true);
  assert.ok(settings.maintenance.platformHealth.checks.includes("open_url"));
  assert.equal(settings.maintenance.apiBudget.enabled, true);
  assert.equal(settings.maintenance.apiBudget.lowBalanceThresholdCny, 50);
  assert.equal(settings.maintenance.apiBudget.action, "notify_recharge_needed");
});
