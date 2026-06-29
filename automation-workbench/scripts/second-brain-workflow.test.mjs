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
