import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_WORKBENCH_ROOT = path.dirname(SCRIPT_DIR);
const DEFAULT_VAULT_DIR = path.join(DEFAULT_WORKBENCH_ROOT, "obsidian-vault");

function parseArgs(argv) {
  const options = {
    workbenchRoot: DEFAULT_WORKBENCH_ROOT,
    out: DEFAULT_VAULT_DIR
  };

  for (let index = 0; index < argv.length; index += 1) {
    const current = argv[index];
    if (current === "--workbench-root") {
      options.workbenchRoot = path.resolve(argv[index + 1]);
      index += 1;
    } else if (current === "--out") {
      options.out = path.resolve(argv[index + 1]);
      index += 1;
    }
  }

  return options;
}

async function readJson(filePath, fallback = []) {
  try {
    const raw = await readFile(filePath, "utf8");
    const normalized = raw.replace(/^\uFEFF/, "").trim();
    return normalized ? JSON.parse(normalized) : fallback;
  } catch (error) {
    if (error.code === "ENOENT") return fallback;
    throw error;
  }
}

function frontMatter(fields) {
  const lines = ["---"];
  for (const [key, value] of Object.entries(fields)) {
    if (value === undefined || value === null || value === "") continue;
    if (Array.isArray(value)) {
      lines.push(`${key}:`);
      for (const item of value) lines.push(`  - ${JSON.stringify(String(item))}`);
    } else {
      lines.push(`${key}: ${JSON.stringify(String(value))}`);
    }
  }
  lines.push("---", "");
  return lines.join("\n");
}

function safeFileName(value, fallback = "untitled") {
  return String(value || fallback)
    .replace(/[<>:"/\\|?*\u0000-\u001F]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 120) || fallback;
}

function listLines(items = []) {
  if (!Array.isArray(items) || !items.length) return "- 暂无";
  return items.map((item) => `- ${item}`).join("\n");
}

async function writeNote(root, folder, fileName, body) {
  const dir = path.join(root, folder);
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, `${safeFileName(fileName)}.md`), body, "utf8");
}

function knowledgeNote(item) {
  return `${frontMatter({
    id: item.id,
    publishedAt: item.publishedAt,
    createdAt: item.createdAt,
    source: item.sourceUrl,
    tags: item.tags
  })}# ${item.title || item.id}

${item.summaryZh || item.summary || "暂无摘要"}

## 来源

- 来源名称：${item.sourceName || "待补充"}
- 原文链接：${item.sourceUrl || "待补充"}
- 可信度：${item.credibility || "待核实"}

## 影响与行动

- 影响：${item.impact || "待补充"}
- 下一步：${item.nextAction || "待补充"}
`;
}

function indexNote(item, heading) {
  return `${frontMatter({
    id: item.id,
    date: item.date,
    createdAt: item.createdAt,
    status: item.status
  })}# ${item.title || item.id}

${item.summary || "暂无摘要"}

## 输出文件

${listLines(item.outputs)}
`;
}

function historyNote(item) {
  return `${frontMatter({
    id: item.id,
    category: item.category,
    createdAt: item.createdAt,
    completedAt: item.completedAt,
    status: item.status,
    skills: item.skills
  })}# ${item.userText || item.id}

## 摘要

${item.summary || "暂无摘要"}

## 助手

- 主助手：${item.primaryAssistant || "待补充"}
- 协同助手：${Array.isArray(item.secondaryAssistants) ? item.secondaryAssistants.join("、") : "无"}

## 来源

${listLines(item.sources)}

## 输出文件

${listLines(item.outputs)}

## 下一步

${item.nextAction || "待补充"}
`;
}

async function exportVault({ workbenchRoot, out }) {
  const dataDir = path.join(workbenchRoot, "data");
  const [knowledgeItems, dailyBriefs, businessFeedback, taskHistory] = await Promise.all([
    readJson(path.join(dataDir, "knowledge-items.json")),
    readJson(path.join(dataDir, "daily-briefs.json")),
    readJson(path.join(dataDir, "business-feedback.json")),
    readJson(path.join(dataDir, "task-history.json"))
  ]);

  await rm(out, { recursive: true, force: true });
  await mkdir(out, { recursive: true });

  await writeFile(path.join(out, "README.md"), `# 无垠 Obsidian 知识库

这是从无垠第二大脑工作台导出的 Markdown 笔记库，可直接用 Obsidian 打开。

## 目录

- Knowledge：知识库条目
- Daily Briefs：每日信息简报索引
- Business Feedback：业务反馈索引
- Task History：工作台任务历史

## 使用方式

1. 打开 Obsidian。
2. 选择“打开本地库”。
3. 选择这个目录：${out}

说明：这里是可读笔记导出，不存放密码、验证码、API 密钥或交易凭证。
`, "utf8");

  for (const item of Array.isArray(knowledgeItems) ? knowledgeItems : []) {
    await writeNote(out, "Knowledge", item.title || item.id, knowledgeNote(item));
  }
  for (const item of Array.isArray(dailyBriefs) ? dailyBriefs : []) {
    await writeNote(out, "Daily Briefs", item.title || item.id, indexNote(item));
  }
  for (const item of Array.isArray(businessFeedback) ? businessFeedback : []) {
    await writeNote(out, "Business Feedback", item.title || item.id, indexNote(item));
  }
  for (const item of Array.isArray(taskHistory) ? taskHistory : []) {
    await writeNote(out, "Task History", item.id || item.userText, historyNote(item));
  }

  return {
    out,
    counts: {
      knowledgeItems: Array.isArray(knowledgeItems) ? knowledgeItems.length : 0,
      dailyBriefs: Array.isArray(dailyBriefs) ? dailyBriefs.length : 0,
      businessFeedback: Array.isArray(businessFeedback) ? businessFeedback.length : 0,
      taskHistory: Array.isArray(taskHistory) ? taskHistory.length : 0
    }
  };
}

const result = await exportVault(parseArgs(process.argv.slice(2)));
console.log(`Obsidian vault exported to ${result.out}`);
console.log(JSON.stringify(result.counts));
