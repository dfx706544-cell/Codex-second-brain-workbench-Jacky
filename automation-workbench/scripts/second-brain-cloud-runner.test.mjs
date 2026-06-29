import assert from "node:assert/strict";
import { copyFile, mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const WORKSPACE_ROOT = path.dirname(path.dirname(SCRIPT_DIR));
const MOJIBAKE_PATTERN = /鏈|閭|绋|俙|€|�/;

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
    WORKBENCH_DISABLE_USER_ENV_FALLBACK: "true",
    ...overrides
  };
}

async function copyRunnerFixture() {
  const tmpParent = path.join(path.dirname(SCRIPT_DIR), ".tmp");
  await mkdir(tmpParent, { recursive: true });
  const tmpRoot = await mkdtemp(path.join(tmpParent, "cloud-runner-"));
  const scriptsDir = path.join(tmpRoot, "automation-workbench", "scripts");
  const dataDir = path.join(tmpRoot, "automation-workbench", "data");
  await mkdir(scriptsDir, { recursive: true });
  await mkdir(dataDir, { recursive: true });

  for (const scriptName of [
    "second-brain-cloud-runner.mjs",
    "api-budget-monitor.mjs",
    "email-delivery.mjs",
    "feishu-delivery.mjs",
    "feishu-doc-delivery.mjs",
    "daily-brief-library.mjs",
    "runtime-env.mjs"
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

async function readLatestDailyBrief(fixture) {
  const dailyBriefs = JSON.parse(await readFile(path.join(fixture.dataDir, "daily-briefs.json"), "utf8"));
  const dailyPath = dailyBriefs[0].outputs.find((item) => item.startsWith("outputs/daily-brief-"));
  return readFile(path.join(fixture.tmpRoot, dailyPath), "utf8");
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
    assert.equal(knowledgeItems.length, 2);
    assert.equal(taskHistory.length, 1);
    assert.ok(dailyBriefs[0].outputs.some((item) => item.startsWith("outputs/daily-brief-")));
    assert.ok(taskHistory[0].outputs.some((item) => item.startsWith("outputs/maintenance-report-")));

    const dailyBrief = await readLatestDailyBrief(fixture);
    assert.match(dailyBrief, /第二大脑 v4 每日信息简报/);
    assert.match(dailyBrief, /美股/);
    assert.match(dailyBrief, /AI 技术最新发展/);
    assert.match(dailyBrief, /模型与 Agent/);
    assert.match(dailyBrief, /预计任务执行成本/);
    assert.match(dailyBrief, /人民币/);
    assert.doesNotMatch(dailyBrief, MOJIBAKE_PATTERN);

    const maintenanceReport = await readLatestMaintenanceReport(fixture);
    assert.match(maintenanceReport, /API\/token/);
    assert.match(maintenanceReport, /运行与维护成本/);
    assert.match(maintenanceReport, /GitHub Actions/);
    assert.match(maintenanceReport, /第三方平台订阅/);
    assert.match(maintenanceReport, /余额监控未配置\/待授权/);
    assert.match(maintenanceReport, /50 元人民币/);
    assert.match(maintenanceReport, /平台真实接入/);
    assert.doesNotMatch(maintenanceReport, MOJIBAKE_PATTERN);
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
    assert.match(maintenanceReport, /飞书备用交付/);
    assert.match(maintenanceReport, /FEISHU_WEBHOOK_URL/);
  } finally {
    await rm(fixture.tmpRoot, { recursive: true, force: true });
  }
});

test("daily cloud runner sends Feishu fallback when email cannot be sent", async () => {
  const fixture = await copyRunnerFixture();

  try {
    const result = spawnSync(process.execPath, [
      "automation-workbench/scripts/second-brain-cloud-runner.mjs",
      "daily"
    ], {
      cwd: fixture.tmpRoot,
      encoding: "utf8",
      env: safeTestEnv({
        SMTP_HOST: "smtp.invalid.local",
        SMTP_PORT: "465",
        SMTP_USER: "jacky060911@163.com",
        SMTP_PASS: "secret",
        MAIL_FROM: "jacky060911@163.com",
        SEND_EMAIL: "true",
        FEISHU_WEBHOOK_URL: "mock://feishu-success"
      })
    });

    assert.equal(result.status, 0, result.stderr);

    const maintenanceReport = await readLatestMaintenanceReport(fixture);
    assert.match(maintenanceReport, /邮件发送/);
    assert.match(maintenanceReport, /发送失败/);
    assert.match(maintenanceReport, /飞书备用交付/);
    assert.match(maintenanceReport, /已发送/);

    const dailyBriefs = JSON.parse(await readFile(path.join(fixture.dataDir, "daily-briefs.json"), "utf8"));
    assert.equal(dailyBriefs[0].status, "delivered_fallback");
  } finally {
    await rm(fixture.tmpRoot, { recursive: true, force: true });
  }
});

test("daily cloud runner targets both fallback email recipients", async () => {
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

    const taskHistory = JSON.parse(await readFile(path.join(fixture.dataDir, "task-history.json"), "utf8"));
    const emailDraftPath = taskHistory[0].outputs.find((item) => item.startsWith("outputs/email-draft-daily-brief-"));
    const emailDraft = await readFile(path.join(fixture.tmpRoot, emailDraftPath), "utf8");
    assert.match(emailDraft, /jacky060911@163\.com/);
    assert.match(emailDraft, /liu13922830178@outlook\.com/);
  } finally {
    await rm(fixture.tmpRoot, { recursive: true, force: true });
  }
});

test("daily cloud runner always updates the daily brief library when email is draft-only", async () => {
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

    const latestBrief = await readFile(path.join(fixture.tmpRoot, "outputs", "daily-brief-latest.md"), "utf8");
    const latestFeedback = await readFile(path.join(fixture.tmpRoot, "outputs", "business-feedback-latest.md"), "utf8");
    const index = await readFile(path.join(fixture.tmpRoot, "outputs", "daily-brief-index.md"), "utf8");
    const obsidianBrief = await readFile(
      path.join(fixture.tmpRoot, "automation-workbench", "obsidian-vault", "Daily Briefs", "最新信息简报.md"),
      "utf8"
    );
    const syncPack = await readFile(
      path.join(fixture.tmpRoot, "outputs", `daily-brief-sync-pack-${new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Shanghai" })}.md`),
      "utf8"
    );

    assert.match(latestBrief, /第二大脑 v4 每日信息简报/);
    assert.match(latestFeedback, /第二大脑 v4 业务反馈/);
    assert.match(index, /每日简报库索引/);
    assert.match(index, /daily-brief-latest\.md/);
    assert.match(obsidianBrief, /第二大脑 v4 每日信息简报/);
    assert.match(syncPack, /可复制到飞书、Notion、语雀或共享文档/);

    const taskHistory = JSON.parse(await readFile(path.join(fixture.dataDir, "task-history.json"), "utf8"));
    assert.ok(taskHistory[0].outputs.includes("outputs/daily-brief-latest.md"));
    assert.ok(taskHistory[0].outputs.includes("outputs/daily-brief-index.md"));
    assert.ok(taskHistory[0].outputs.some((item) => item.startsWith("outputs/daily-brief-sync-pack-")));
  } finally {
    await rm(fixture.tmpRoot, { recursive: true, force: true });
  }
});

test("daily cloud runner skips duplicate delivery after today's successful cloud run", async () => {
  const fixture = await copyRunnerFixture();
  const today = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Shanghai" });

  try {
    await writeFile(
      path.join(fixture.dataDir, "task-history.json"),
      JSON.stringify([
        {
          id: `history-${today}-daily-automation`,
          createdAt: new Date().toISOString(),
          date: today,
          status: "completed",
          deliveryStatus: "sent",
          outputs: [`outputs/daily-brief-${today}.md`]
        }
      ], null, 2),
      "utf8"
    );

    const result = spawnSync(process.execPath, [
      "automation-workbench/scripts/second-brain-cloud-runner.mjs",
      "daily"
    ], {
      cwd: fixture.tmpRoot,
      encoding: "utf8",
      env: safeTestEnv({
        SMTP_HOST: "smtp.example.test",
        SMTP_PORT: "465",
        SMTP_USER: "jacky060911@163.com",
        SMTP_PASS: "secret",
        MAIL_FROM: "jacky060911@163.com",
        SEND_EMAIL: "true"
      })
    });

    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /already delivered/);

    const taskHistory = JSON.parse(await readFile(path.join(fixture.dataDir, "task-history.json"), "utf8"));
    assert.equal(taskHistory.length, 1);
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

    const report = await readFile(path.join(fixture.tmpRoot, taskHistory[0].outputs[0]), "utf8");
    assert.match(report, /每周自我迭代审计/);
    assert.match(report, /运行与维护成本/);
    assert.match(report, /预计人民币成本/);
    assert.doesNotMatch(report, MOJIBAKE_PATTERN);
  } finally {
    await rm(fixture.tmpRoot, { recursive: true, force: true });
  }
});
