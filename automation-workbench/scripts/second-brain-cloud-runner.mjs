import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const WORKBENCH_ROOT = path.dirname(SCRIPT_DIR);
const WORKSPACE_ROOT = path.dirname(WORKBENCH_ROOT);
const OUTPUTS_DIR = path.join(WORKSPACE_ROOT, "outputs");
const DATA_DIR = path.join(WORKBENCH_ROOT, "data");

const STORE_FILES = {
  dailyBriefs: "daily-briefs.json",
  businessFeedback: "business-feedback.json",
  knowledgeItems: "knowledge-items.json",
  taskHistory: "task-history.json"
};

function todayInShanghai() {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  });
  return formatter.format(new Date());
}

function nowIso() {
  return new Date().toISOString();
}

function workspacePath(filePath) {
  return path.relative(WORKSPACE_ROOT, filePath).split(path.sep).join("/");
}

async function readJson(filePath, fallback) {
  try {
    const raw = await readFile(filePath, "utf8");
    const normalized = raw.replace(/^\uFEFF/, "").trim();
    return normalized ? JSON.parse(normalized) : fallback;
  } catch (error) {
    if (error.code === "ENOENT") return fallback;
    throw error;
  }
}

async function writeJsonAtomic(filePath, value) {
  await mkdir(path.dirname(filePath), { recursive: true });
  const tmpPath = `${filePath}.tmp`;
  await writeFile(tmpPath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
  await rename(tmpPath, filePath);
}

async function prependStore(storeName, records) {
  const filePath = path.join(DATA_DIR, STORE_FILES[storeName]);
  const current = await readJson(filePath, []);
  const list = Array.isArray(records) ? records : [records];
  await writeJsonAtomic(filePath, [...list, ...(Array.isArray(current) ? current : [])]);
}

function makeDailyBrief(date) {
  return `# 第二大脑 v4 每日信息简报

日期：${date}

## 当前状态

云端任务骨架已运行。本脚本不会编造实时新闻；在未接入 AnySearch、网页搜索或可信数据源前，只生成待联网补全的简报结构。

## 今日最重要消息

- 待联网检索：美股、港股、宏观政策、时政新闻、社会热点、AI、跨境电商、创作者经济和平台玩法。

## 对美股/港股可能影响

- 待联网检索后补充：财报、评级、政策、利率、汇率、监管、行业供需和重大公司公告。

## 对跨境电商业务可能影响

- 待联网检索后补充：TikTok Shop、Kalodata/FastMoss 观察方向、达人表现、商品热度、直播/短视频转化趋势。

## 对自媒体/IP 的建议

- 今日先执行基础动作：复盘上一条内容的完播、互动、转化；记录 3 个对标账号选题；准备 1 个 A/B 标题测试。

## 来源链接

- 待联网补充。无法核实时必须标注“待核实”。
`;
}

function makeBusinessFeedback(date) {
  return `# 第二大脑 v4 业务反馈

日期：${date}

## 当前状态

云端任务骨架已运行。本脚本先生成业务反馈结构；账号后台、Kalodata、FastMoss、TikTok、抖音、小红书等平台数据需要用户授权页面、导出文件或后续 API/浏览器自动化接入。

## 今日复盘

- 达人沟通：待读取沟通记录后计算回复率、有效回复率、成交概率。
- 内容作品：待读取作品数据后计算播放、完播、互动、点击、转化和变现。
- 选品机会：待联网检索后补充商品热度、竞品表现和内容素材方向。

## 明日动作

1. 输出 10 个待联系达人候选字段：账号、平台、粉丝量、内容风格、联系方式、匹配理由、风险。
2. 输出 3 条假睫毛产品内容角度：妆前妆后、男生美妆反差、快速出门场景。
3. 输出 1 份跟进话术 A/B 测试：直接合作邀约 vs 内容共创邀约。

## 邮件草稿

收件人：jacky060911@163.com

主题：${date} 业务反馈与明日行动建议

正文：今日业务反馈已生成基础结构。联网数据和账号后台数据接入后，将自动补充指标、来源和明确行动清单。
`;
}

function makeEmailDraft(date, kind) {
  const title = kind === "brief" ? "信息简报" : "业务反馈";
  return `收件人：jacky060911@163.com
主题：${date} 第二大脑 v4 ${title}

你好，Jacky：

这是 ${date} 的第二大脑 v4 ${title}草稿。

当前云端任务骨架已运行。若云端环境已开启联网和可信搜索能力，请在正式交付中补充真实来源链接；若未开启联网，请保留“待联网补全”标记，不编造信息。

发送前请人工确认。
`;
}

async function runDaily() {
  const date = todayInShanghai();
  const timestamp = nowIso();
  await mkdir(OUTPUTS_DIR, { recursive: true });

  const dailyBriefPath = path.join(OUTPUTS_DIR, `daily-brief-${date}.md`);
  const businessFeedbackPath = path.join(OUTPUTS_DIR, `business-feedback-${date}.md`);
  const briefEmailPath = path.join(OUTPUTS_DIR, `email-draft-daily-brief-${date}.md`);
  const feedbackEmailPath = path.join(OUTPUTS_DIR, `email-draft-business-feedback-${date}.md`);

  await writeFile(dailyBriefPath, makeDailyBrief(date), "utf8");
  await writeFile(businessFeedbackPath, makeBusinessFeedback(date), "utf8");
  await writeFile(briefEmailPath, makeEmailDraft(date, "brief"), "utf8");
  await writeFile(feedbackEmailPath, makeEmailDraft(date, "feedback"), "utf8");

  await prependStore("dailyBriefs", {
    id: `daily-brief-${date}`,
    createdAt: timestamp,
    date,
    title: `${date} 第二大脑 v4 信息简报`,
    summary: "云端任务骨架已生成信息简报结构，待联网数据源补全真实新闻和来源链接。",
    outputs: [workspacePath(dailyBriefPath), workspacePath(briefEmailPath)],
    status: "draft"
  });

  await prependStore("businessFeedback", {
    id: `business-feedback-${date}`,
    createdAt: timestamp,
    date,
    title: `${date} 第二大脑 v4 业务反馈`,
    summary: "云端任务骨架已生成业务反馈结构，待账号数据和平台数据接入后补全指标。",
    outputs: [workspacePath(businessFeedbackPath), workspacePath(feedbackEmailPath)],
    status: "draft"
  });

  await prependStore("knowledgeItems", {
    id: `knowledge-${date}-cloud-runner`,
    createdAt: timestamp,
    publishedAt: date,
    title: "第二大脑 v4 云端任务骨架运行记录",
    summaryZh: "云端 runner 已能写入 outputs/ 和 automation-workbench/data/，为后续联网简报、业务反馈和知识库同步打基础。",
    sourceUrl: "automation-workbench/scripts/second-brain-cloud-runner.mjs",
    sourceName: "本地云端 runner",
    domain: "system",
    tags: ["Codex Cloud", "自动化", "第二大脑"],
    credibility: "本地运行记录",
    impact: "证明云端或 CI 环境可以生成工作台可读取的数据文件。",
    nextAction: "接入可信搜索源和 GitHub/Codex Cloud 定时执行。"
  });

  await prependStore("taskHistory", {
    id: `history-${date}-cloud-daily-runner`,
    createdAt: timestamp,
    completedAt: timestamp,
    category: "system",
    userText: "运行第二大脑 v4 云端每日任务骨架",
    primaryAssistant: "资讯助手",
    secondaryAssistants: ["交付助手", "个人画像助手"],
    skills: ["documents"],
    sources: ["local runner"],
    status: "completed",
    outputs: [
      workspacePath(dailyBriefPath),
      workspacePath(businessFeedbackPath),
      workspacePath(briefEmailPath),
      workspacePath(feedbackEmailPath)
    ],
    summary: "已生成每日简报、业务反馈和两封邮件草稿的基础结构。",
    nextAction: "在 Codex Cloud 或 GitHub Actions 中接入联网搜索和真实来源记录。"
  });

  console.log(`Second Brain daily runner completed for ${date}`);
}

async function runWeekly() {
  const date = todayInShanghai();
  const timestamp = nowIso();
  await mkdir(OUTPUTS_DIR, { recursive: true });
  const reportPath = path.join(OUTPUTS_DIR, `weekly-evolution-audit-${date}.md`);
  const taskHistory = await readJson(path.join(DATA_DIR, STORE_FILES.taskHistory), []);
  const recent = Array.isArray(taskHistory) ? taskHistory.slice(0, 10) : [];

  const body = `# 第二大脑 v4 每周自我迭代审计

日期：${date}

## 当前状态

云端每周审计骨架已运行。以下为最近任务记录摘要。

${recent.map((item, index) => `${index + 1}. ${item.userText || item.id}：${item.summary || "暂无摘要"}`).join("\n") || "- 暂无历史记录。"}

## 改进建议

1. 完成 GitHub 私有仓库接入，让云端结果能同步回本地。
2. 接入可信实时搜索能力，避免简报停留在结构草稿。
3. 建立安全邮件发送器前，继续只生成邮件草稿。
4. Skill/plugin 安装继续保持候选评估和人工确认。
`;

  await writeFile(reportPath, body, "utf8");
  await prependStore("taskHistory", {
    id: `history-${date}-weekly-evolution-runner`,
    createdAt: timestamp,
    completedAt: timestamp,
    category: "system",
    userText: "运行第二大脑 v4 每周自我迭代审计骨架",
    primaryAssistant: "Skill Scout",
    secondaryAssistants: [],
    skills: ["documents"],
    sources: ["local runner"],
    status: "completed",
    outputs: [workspacePath(reportPath)],
    summary: "已生成每周自我迭代审计基础报告。",
    nextAction: "接入 GitHub/Codex Cloud 后让审计任务每周自动运行。"
  });
  console.log(`Second Brain weekly runner completed for ${date}`);
}

const command = process.argv[2] || "daily";

if (command === "daily") {
  await runDaily();
} else if (command === "weekly") {
  await runWeekly();
} else {
  console.error("Usage: node automation-workbench/scripts/second-brain-cloud-runner.mjs [daily|weekly]");
  process.exitCode = 1;
}
