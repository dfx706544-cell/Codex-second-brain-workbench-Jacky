import assert from "node:assert/strict";
import { copyFile, mkdir, mkdtemp, readFile, rm } from "node:fs/promises";
import path from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const WORKSPACE_ROOT = path.dirname(path.dirname(SCRIPT_DIR));

function safeTestEnv(overrides = {}) {
  return {
    ...process.env,
    MICU_API_BALANCE_CNY: "",
    MICU_API_BALANCE_URL: "",
    MICU_API_BILLING_URL: "",
    MICU_API_KEY: "",
    MICU_API_TOKEN: "",
    SMTP_HOST: "",
    SMTP_PORT: "",
    SMTP_USER: "",
    SMTP_PASS: "",
    MAIL_TO: "",
    MAIL_FROM: "",
    SEND_EMAIL: "false",
    ...overrides
  };
}

async function copyRunnerFixture() {
  const tmpRoot = await mkdtemp(path.join(path.dirname(SCRIPT_DIR), ".tmp", "cloud-runner-"));
  const scriptsDir = path.join(tmpRoot, "automation-workbench", "scripts");
  const dataDir = path.join(tmpRoot, "automation-workbench", "data");
  await mkdir(scriptsDir, { recursive: true });
  await mkdir(dataDir, { recursive: true });

  for (const scriptName of [
    "second-brain-cloud-runner.mjs",
    "api-budget-monitor.mjs",
    "email-delivery.mjs"
  ]) {
    await copyFile(
      path.join(WORKSPACE_ROOT, "automation-workbench", "scripts", scriptName),
      path.join(scriptsDir, scriptName)
    );
  }

  return { tmpRoot, dataDir };
}

async function readLatestMaintenanceReport(fixture) {
  const taskHistory = JSON.parse(await readFile(path.join(fixture.dataDir, "task-history.json"), "utf8"));
  const maintenancePath = taskHistory[0].outputs.find((item) => item.startsWith("outputs/maintenance-report-"));
  return readFile(path.join(fixture.tmpRoot, maintenancePath), "utf8");
}

test("daily cloud runner writes workbench-readable outputs and data", async () => {
  const fixture = await copyRunnerFixture();

  try {
    const result = spawnSync(process.execPath, [
      "automation-workbench/scripts/second-brain-cloud-runner.mjs",
      "daily"
    ], {
      cwd: fixture.tmpRoot,
      encoding: "utf8",
      env: safeTestEnv()
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
    assert.ok(taskHistory[0].outputs.some((item) => item.startsWith("outputs/maintenance-report-")));

    const maintenanceReport = await readLatestMaintenanceReport(fixture);
    assert.match(maintenanceReport, /API\/token/);
    assert.match(maintenanceReport, /余额监控未配置\/待授权/);
    assert.match(maintenanceReport, /50 元人民币/);
    assert.match(maintenanceReport, /平台接入/);
  } finally {
    await rm(fixture.tmpRoot, { recursive: true, force: true });
  }
});

test("daily cloud runner warns when verified Micu API balance is below 50 RMB", async () => {
  const fixture = await copyRunnerFixture();

  try {
    const result = spawnSync(process.execPath, [
      "automation-workbench/scripts/second-brain-cloud-runner.mjs",
      "daily"
    ], {
      cwd: fixture.tmpRoot,
      encoding: "utf8",
      env: safeTestEnv({ MICU_API_BALANCE_CNY: "32.5" })
    });

    assert.equal(result.status, 0, result.stderr);

    const maintenanceReport = await readLatestMaintenanceReport(fixture);
    assert.match(maintenanceReport, /米促 API/);
    assert.match(maintenanceReport, /32\.50 元/);
    assert.match(maintenanceReport, /低于 50 元人民币/);
    assert.match(maintenanceReport, /请尽快充值/);
  } finally {
    await rm(fixture.tmpRoot, { recursive: true, force: true });
  }
});

test("daily cloud runner records email delivery as draft-only when SMTP is not configured", async () => {
  const fixture = await copyRunnerFixture();

  try {
    const result = spawnSync(process.execPath, [
      "automation-workbench/scripts/second-brain-cloud-runner.mjs",
      "daily"
    ], {
      cwd: fixture.tmpRoot,
      encoding: "utf8",
      env: safeTestEnv()
    });

    assert.equal(result.status, 0, result.stderr);

    const maintenanceReport = await readLatestMaintenanceReport(fixture);
    assert.match(maintenanceReport, /邮件发送/);
    assert.match(maintenanceReport, /草稿模式/);
    assert.match(maintenanceReport, /SMTP 未配置/);
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
      encoding: "utf8",
      env: safeTestEnv()
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
