import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const WORKSPACE_ROOT = path.dirname(path.dirname(SCRIPT_DIR));

test("daily workflow uses multiple fallback schedules around 8 AM China time", async () => {
  const workflow = await readFile(path.join(WORKSPACE_ROOT, ".github", "workflows", "second-brain-daily.yml"), "utf8");
  const cronLines = [...workflow.matchAll(/cron:\s*"([^"]+)"/g)].map((match) => match[1]);

  assert.ok(cronLines.includes("0 0 * * *"), "must keep the 08:00 China time target");
  assert.ok(cronLines.includes("10 0 * * *"), "must retry near 08:10 China time");
  assert.ok(cronLines.includes("30 0 * * *"), "must retry near 08:30 China time");
  assert.ok(cronLines.includes("0 1 * * *"), "must retry near 09:00 China time");
});

test("cloud daily prompt records cloud-only sources and local boot backfill boundary", async () => {
  const prompt = await readFile(path.join(WORKSPACE_ROOT, "automation-workbench", "cloud", "cloud-daily-brief-prompt.md"), "utf8");

  assert.match(prompt, /关机后云端信息源边界/);
  assert.match(prompt, /公开网页与新闻页/);
  assert.match(prompt, /RSS feeds/);
  assert.match(prompt, /金融市场数据 API/);
  assert.match(prompt, /不要声称云端能读取本机夸克浏览器登录态/);
  assert.match(prompt, /开机后本地平台补采/);
  assert.match(prompt, /outputs\/boot-backfill-YYYY-MM-DD\.md/);
});
