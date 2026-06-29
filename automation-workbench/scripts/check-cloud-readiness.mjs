import { access, readFile, writeFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const WORKBENCH_ROOT = path.dirname(SCRIPT_DIR);
const WORKSPACE_ROOT = path.dirname(WORKBENCH_ROOT);

const REQUIRED_FILES = [
  "automation-workbench/cloud/README.md",
  "automation-workbench/cloud/codex-cloud-setup-checklist.md",
  "automation-workbench/cloud/cloud-daily-brief-prompt.md",
  "automation-workbench/cloud/cloud-weekly-evolution-prompt.md",
  "automation-workbench/cloud/cloud-sync-policy.md",
  "automation-workbench/cloud/cloud-secrets-setup.md",
  "automation-workbench/scripts/second-brain-cloud-runner.mjs",
  "automation-workbench/scripts/api-budget-monitor.mjs",
  "automation-workbench/scripts/email-delivery.mjs",
  "automation-workbench/scripts/feishu-delivery.mjs",
  "automation-workbench/scripts/feishu-doc-delivery.mjs",
  "automation-workbench/scripts/daily-brief-library.mjs",
  ".github/workflows/second-brain-daily.yml",
  ".github/workflows/second-brain-weekly.yml",
  ".gitignore"
];

async function exists(relativePath) {
  try {
    await access(path.join(WORKSPACE_ROOT, relativePath));
    return true;
  } catch {
    return false;
  }
}

function run(command, args) {
  return spawnSync(command, args, {
    cwd: WORKSPACE_ROOT,
    encoding: "utf8",
    shell: false
  });
}

async function findGit() {
  const candidates = [
    "git",
    path.join(WORKSPACE_ROOT, "tools", "MinGit", "cmd", "git.exe"),
    path.join(path.dirname(WORKSPACE_ROOT), "tools", "MinGit", "cmd", "git.exe"),
    path.join(path.dirname(path.dirname(WORKSPACE_ROOT)), "tools", "MinGit", "cmd", "git.exe")
  ];

  for (const candidate of candidates) {
    const result = run(candidate, ["--version"]);
    if (result.status === 0) {
      return {
        command: candidate,
        version: result.stdout.trim()
      };
    }
  }

  return null;
}

async function readGitRemote() {
  const configPath = path.join(WORKSPACE_ROOT, ".git", "config");
  try {
    const config = await readFile(configPath, "utf8");
    const match = config.match(/\[remote "origin"\][\s\S]*?url = (.+)/);
    return match?.[1]?.trim() || "";
  } catch {
    return "";
  }
}

const checks = [];

for (const file of REQUIRED_FILES) {
  checks.push({
    name: `required file: ${file}`,
    ok: await exists(file),
    detail: file
  });
}

const git = await findGit();
checks.push({
  name: "Git CLI available",
  ok: Boolean(git),
  detail: git ? `${git.version} (${path.relative(WORKSPACE_ROOT, git.command).split(path.sep).join("/") || "PATH"})` : "Git is not available in PATH or tools/MinGit"
});

const gitRepo = git ? run(git.command, ["rev-parse", "--is-inside-work-tree"]) : { status: 1, stdout: "" };
checks.push({
  name: "Git repository initialized",
  ok: gitRepo.status === 0 && gitRepo.stdout.trim() === "true",
  detail: gitRepo.status === 0 ? "git rev-parse confirms repository" : "Not a valid git repository yet"
});

const originUrl = await readGitRemote();
checks.push({
  name: "GitHub remote origin configured",
  ok: Boolean(originUrl),
  detail: originUrl || "No remote origin configured"
});

const passed = checks.filter((check) => check.ok).length;
const failed = checks.length - passed;

const report = [
  "# 第二大脑 v4 云端就绪检查",
  "",
  `生成时间：${new Date().toISOString()}`,
  "",
  `结果：${passed}/${checks.length} 通过，${failed} 项待处理。`,
  "",
  "## 检查项",
  "",
  ...checks.map((check) => `- ${check.ok ? "[x]" : "[ ]"} ${check.name}：${check.detail}`),
  "",
  "## 下一步",
  "",
  originUrl
    ? "远程仓库已配置。下一步是在 Codex Cloud 里选择该仓库并配置每日/每周自动化。"
    : "远程仓库尚未配置。请先在 GitHub 创建私有仓库，并把本地项目推送上去。",
  ""
].join("\n");

await writeFile(path.join(WORKSPACE_ROOT, "outputs", "cloud-readiness-check-latest.md"), report, "utf8");
console.log(report);

if (failed > 0) {
  process.exitCode = 1;
}
