import { spawn } from "node:child_process";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_WORKBENCH_ROOT = path.dirname(SCRIPT_DIR);
const DEFAULT_WORKSPACE_ROOT = path.dirname(DEFAULT_WORKBENCH_ROOT);
const DEFAULT_QUEUE_PATH = path.join(DEFAULT_WORKBENCH_ROOT, "queue", "tasks.json");
const SENSITIVE_TASK_PATTERN = /微信|飞书|郵件|邮件|邮箱|私信|回复|发送|外发|验证码|登录|登入|支付|交易|下单|发布|上传/u;

function parseJson(raw, fallback) {
  const normalized = raw.replace(/^\uFEFF/u, "").trim();
  return normalized ? JSON.parse(normalized) : fallback;
}

function parseArgs(argv) {
  const options = {
    mode: "once",
    queuePath: DEFAULT_QUEUE_PATH,
    workspaceRoot: DEFAULT_WORKSPACE_ROOT,
    intervalMs: 10_000,
    allowSensitive: false,
    execute: false
  };

  for (let index = 0; index < argv.length; index += 1) {
    const current = argv[index];
    if (current === "--watch") {
      options.mode = "watch";
    } else if (current === "--once") {
      options.mode = "once";
    } else if (current === "--queue") {
      options.queuePath = argv[index + 1];
      index += 1;
    } else if (current === "--workspace") {
      options.workspaceRoot = argv[index + 1];
      index += 1;
    } else if (current === "--interval-ms") {
      options.intervalMs = Number(argv[index + 1]);
      index += 1;
    } else if (current === "--allow-sensitive") {
      options.allowSensitive = true;
    } else if (current === "--execute") {
      options.execute = true;
    } else if (current === "--codex-bin") {
      options.codexBin = argv[index + 1];
      index += 1;
    }
  }

  return options;
}

function shouldRunTask(task, options = {}) {
  if (options.allowSensitive) return true;
  const text = [
    task?.userText,
    task?.primary?.title,
    ...(task?.deliveries || []),
    ...(task?.sources || []).map((source) => source?.name || source?.id || "")
  ].filter(Boolean).join(" ");
  return !SENSITIVE_TASK_PATTERN.test(text);
}

function taskCreatedAt(task) {
  const parsed = Date.parse(task?.createdAt || "");
  return Number.isFinite(parsed) ? parsed : 0;
}

function nextPendingTask(tasks, options = {}) {
  return [...tasks]
    .filter((task) => !task?.codexRun?.status || ["pending", "failed", "skipped"].includes(task.codexRun.status))
    .filter((task) => shouldRunTask(task, options))
    .sort((left, right) => taskCreatedAt(right) - taskCreatedAt(left))[0] || null;
}

function buildCodexQueuePrompt({ workspaceRoot, taskId }) {
  return `WUYIN_RUN_TASK ${taskId}

工作区：${workspaceRoot}

请读取 automation-workbench/queue/tasks.json，找到 id 为 ${taskId} 的任务并执行。
执行时遵守工作台既有规则：优先读取配置、workflow、inputs/ 和 templates/；需要平台时优先使用后端或已授权可见页面；输出保存到 outputs/，并尽量更新 automation-workbench/data/。
不要执行真实交易、支付、发布或社交外发；需要登录、验证码、权限变更、安装第三方代码或外发确认时停下等待用户。
完成后用中文说明文件位置、来源、成本口径和待确认事项。`;
}

async function readQueue(queuePath) {
  try {
    return parseJson(await readFile(queuePath, "utf8"), []);
  } catch (error) {
    if (error.code === "ENOENT") return [];
    throw error;
  }
}

async function writeQueue(queuePath, tasks) {
  await mkdir(path.dirname(queuePath), { recursive: true });
  const tmpPath = `${queuePath}.tmp`;
  await writeFile(tmpPath, `${JSON.stringify(tasks, null, 2)}\n`, "utf8");
  await rename(tmpPath, queuePath);
}

async function claimNextQueueTask({ queuePath = DEFAULT_QUEUE_PATH, workspaceRoot = DEFAULT_WORKSPACE_ROOT, allowSensitive = false } = {}) {
  const tasks = await readQueue(queuePath);
  const task = nextPendingTask(tasks, { allowSensitive });
  if (!task) {
    return { task: null, prompt: "", tasks };
  }

  const claimedAt = new Date().toISOString();
  const nextTasks = tasks.map((item) => item.id === task.id
    ? {
        ...item,
        codexRun: {
          status: "running",
          claimedAt,
          mode: "local-codex-runner"
        }
      }
    : item);
  await writeQueue(queuePath, nextTasks);

  return {
    task: nextTasks.find((item) => item.id === task.id),
    prompt: buildCodexQueuePrompt({ workspaceRoot, taskId: task.id }),
    tasks: nextTasks
  };
}

function runCodex({ codexBin = "codex", workspaceRoot = DEFAULT_WORKSPACE_ROOT, prompt }) {
  return new Promise((resolve, reject) => {
    const child = spawn(codexBin, ["exec", "--sandbox", "workspace-write", prompt], {
      cwd: workspaceRoot,
      stdio: ["ignore", "pipe", "pipe"],
      windowsHide: true
    });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk) => { stdout += chunk; });
    child.stderr.on("data", (chunk) => { stderr += chunk; });
    child.once("error", reject);
    child.once("close", (code) => resolve({ code, stdout, stderr }));
  });
}

async function runOnce(options = {}) {
  const result = await claimNextQueueTask(options);
  if (!result.task) {
    return { status: "idle", message: "No safe pending task found." };
  }

  if (!options.execute) {
    return {
      status: "claimed",
      taskId: result.task.id,
      prompt: result.prompt,
      message: "Task claimed. Re-run with --execute to invoke codex exec."
    };
  }

  const codexResult = await runCodex({ ...options, prompt: result.prompt });
  return {
    status: codexResult.code === 0 ? "completed" : "failed",
    taskId: result.task.id,
    ...codexResult
  };
}

async function runWatch(options = {}) {
  for (;;) {
    const result = await runOnce(options);
    if (result.status !== "idle") {
      console.log(JSON.stringify(result, null, 2));
    }
    await new Promise((resolve) => setTimeout(resolve, options.intervalMs || 10_000));
  }
}

export {
  buildCodexQueuePrompt,
  claimNextQueueTask,
  nextPendingTask,
  runOnce,
  shouldRunTask
};

if (process.argv[1] && import.meta.url === new URL(`file://${process.argv[1].replaceAll("\\", "/")}`).href) {
  const options = parseArgs(process.argv.slice(2));
  const result = options.mode === "watch" ? await runWatch(options) : await runOnce(options);
  if (result) console.log(JSON.stringify(result, null, 2));
}
