import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { checkApiBudget } from "./api-budget-monitor.mjs";
import { deliverDraftEmails } from "./email-delivery.mjs";

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

云端/后台任务已运行。本脚本不会编造实时新闻；在未接入 AnySearch、网页搜索或可信数据源前，只生成待联网补全的简报结构。

## 今日最重要消息

- 待联网检索：美股、港股、宏观政策、时政新闻、社会热点、AI、跨境电商、创作者经济和平台玩法。

## 对美股/港股可能影响

- 待联网检索后补充：财报、评级、政策、利率、汇率、监管、行业供需和重大公司公告。

## 对跨境电商业务可能影响

- 待联网检索后补充：TikTok Shop、Kalodata/FastMoss 观察方向、达人表现、商品热度、直播/短视频转化趋势。

## 对自媒体/IP 的建议

- 今日先执行基础动作：复盘上一条内容的完播、互动、转化；记录 3 个对标账号选题；准备 1 个 A/B 标题测试。

## 来源链接

- 待联网补充。无法核实时必须标注“待核实”。`;
}

function makeBusinessFeedback(date) {
  return `# 第二大脑 v4 业务反馈

日期：${date}

## 当前状态

云端/后台任务已运行。本脚本先生成业务反馈结构；账号后台、Kalodata、FastMoss、TikTok、抖音、小红书等平台数据，需要用户授权页面、导出文件或后续 API/浏览器自动化接入。

## 今日复盘

- 达人沟通：待读取沟通记录后计算回复率、有效回复率、成交概率。
- 内容作品：待读取作品数据后计算播放、完播、互动、点击、转化和变现。
- 选品机会：待联网检索后补充商品热度、竞品表现和内容素材方向。

## 明日动作

1. 输出 10 个待联系达人候选字段：账号、平台、粉丝量、内容风格、联系方式、匹配理由、风险。
2. 输出 3 条假睫毛产品内容角度：妆前妆后、男生美妆反差、快速出门场景。
3. 输出 1 份跟进话术 A/B 测试：直接合作邀约 vs 内容共创邀约。`;
}

function makeEmailDraft({ date, kind, body, apiBudget }) {
  const title = kind === "brief" ? "信息简报" : "业务反馈";
  const subject = `${date} 第二大脑 v4 ${title}`;
  const apiLine = apiBudget?.status === "low_balance"
    ? `\n\n【费用提醒】${apiBudget.message}`
    : "";

  const emailBody = `你好，Jacky：

这是 ${date} 的第二大脑 v4 ${title}草稿。

${body}
${apiLine}

说明：没有真实来源的数据会标注“待核实/待授权”；真实发信需要你在 GitHub Secrets 或云端环境里配置 163 邮箱 SMTP 授权码。`;

  return {
    subject,
    body: emailBody,
    text: `收件人：jacky060911@163.com
主题：${subject}

${emailBody}`
  };
}

function tableStatus(status) {
  switch (status) {
    case "ok":
      return "正常";
    case "low_balance":
      return "需要充值";
    case "draft_only":
      return "草稿模式";
    case "sent":
      return "已发送";
    case "send_error":
      return "发送失败";
    case "error":
      return "查询失败";
    default:
      return "待授权";
  }
}

function makeMaintenanceReport({ date, apiBudget, emailDelivery }) {
  return `# 第二大脑 v4 维护巡检报告

日期：${date}

## 总体状态

- 云端/后台任务骨架已运行。
- GitHub Actions 或 Codex Cloud 可以在电脑关机后继续执行公开网页检索、文件生成、知识库写入、邮件草稿/发送等任务。
- 本地工作台、夸克浏览器、微信、飞书、剪映、Kalodata、FastMoss、达秘 / TikClubs 等依赖本机或登录态的平台，在电脑关机或云端无浏览器授权时无法直接核实账号内数据。
- 本报告只记录可在当前环境确认的项目；无法核实的项目标注为待授权/待本机开机检查。

## 每日轻巡检清单

| 项目 | 状态 | 说明 |
| --- | --- | --- |
| outputs/ 写入 | 已检查 | 当前 runner 会尝试写入 outputs/。 |
| 数据库 JSON | 已检查 | 当前 runner 会尝试更新 automation-workbench/data/。 |
| 执行队列 | 待本机检查 | 需要本地工作台桥接服务或仓库队列文件。 |
| 平台 URL | 待联网/待登录核实 | 需要 browser/playwright 或用户授权页面。 |
| API/token 费用 | ${tableStatus(apiBudget.status)} | ${apiBudget.message} |
| 邮件发送 | ${tableStatus(emailDelivery.status)} | ${emailDelivery.message} |

## API/token 费用监控

- 当前来源：${apiBudget.provider || "米促 API"}。
- 状态：${apiBudget.message}
- 提醒线：低于 ${apiBudget.thresholdCny ?? 50} 元人民币时提醒充值。
- 已核实余额：${apiBudget.verified ? `${apiBudget.remainingCny.toFixed(2)} 元` : "余额监控未配置/待授权"}。

## 邮件交付状态

- 状态：${emailDelivery.message}
- 规则：没有配置安全 SMTP/邮件连接器时，只生成邮件草稿；配置并开启 SEND_EMAIL=true 后，云端才会尝试发送两封邮件。

## 平台接入口径

- 已接入：工作台有平台配置，URL 可打开，能到达首页、登录页或授权后的页面。
- 已授权可读：用户已登录，页面内容可见，且不需要绕过权限。
- 待登录：平台可打开，但需要用户登录、验证码或二次验证。
- 待配置：平台或 API 需要密钥、账单来源、导出文件或连接器。
- 不可用：URL 无法到达、服务报错、配置缺失、脚本失败或权限不足。

## 下一步

1. 本机开机后运行维护助手，实际打开工作台、平台 URL 和运行中心。
2. 如需真实发送每日邮件，配置 163 邮箱 SMTP 授权码或 Codex/Composio 邮件连接器。
3. 如需米促 API 余额低于 50 元提醒，配置可查询的真实余额来源，或在云端 Secret 中写入 MICU_API_BALANCE_URL、MICU_API_KEY、MICU_API_BALANCE_JSON_PATH。
4. 所有安装第三方 skill/plugin/software、社交外发、邮件发送、真实交易和支付动作继续等待用户当次确认。`;
}

async function runDaily() {
  const date = todayInShanghai();
  const timestamp = nowIso();
  await mkdir(OUTPUTS_DIR, { recursive: true });

  const apiBudget = await checkApiBudget();

  const dailyBriefBody = makeDailyBrief(date);
  const businessFeedbackBody = makeBusinessFeedback(date);
  const briefDraft = makeEmailDraft({ date, kind: "brief", body: dailyBriefBody, apiBudget });
  const feedbackDraft = makeEmailDraft({ date, kind: "feedback", body: businessFeedbackBody, apiBudget });
  const emailDelivery = await deliverDraftEmails({
    drafts: [
      { kind: "daily brief", subject: briefDraft.subject, body: briefDraft.body },
      { kind: "business feedback", subject: feedbackDraft.subject, body: feedbackDraft.body }
    ]
  });

  const dailyBriefPath = path.join(OUTPUTS_DIR, `daily-brief-${date}.md`);
  const businessFeedbackPath = path.join(OUTPUTS_DIR, `business-feedback-${date}.md`);
  const briefEmailPath = path.join(OUTPUTS_DIR, `email-draft-daily-brief-${date}.md`);
  const feedbackEmailPath = path.join(OUTPUTS_DIR, `email-draft-business-feedback-${date}.md`);
  const maintenanceReportPath = path.join(OUTPUTS_DIR, `maintenance-report-${date}.md`);

  await writeFile(dailyBriefPath, dailyBriefBody, "utf8");
  await writeFile(businessFeedbackPath, businessFeedbackBody, "utf8");
  await writeFile(briefEmailPath, briefDraft.text, "utf8");
  await writeFile(feedbackEmailPath, feedbackDraft.text, "utf8");
  await writeFile(maintenanceReportPath, makeMaintenanceReport({ date, apiBudget, emailDelivery }), "utf8");

  await prependStore("dailyBriefs", {
    id: `daily-brief-${date}`,
    createdAt: timestamp,
    date,
    title: `${date} 第二大脑 v4 信息简报`,
    summary: "云端任务已生成信息简报结构，待联网数据源补全真实新闻和来源链接。",
    outputs: [workspacePath(dailyBriefPath), workspacePath(briefEmailPath)],
    status: emailDelivery.status === "sent" ? "sent" : "draft"
  });

  await prependStore("businessFeedback", {
    id: `business-feedback-${date}`,
    createdAt: timestamp,
    date,
    title: `${date} 第二大脑 v4 业务反馈`,
    summary: "云端任务已生成业务反馈结构，待账号数据和平台数据接入后补全指标。",
    outputs: [workspacePath(businessFeedbackPath), workspacePath(feedbackEmailPath)],
    status: emailDelivery.status === "sent" ? "sent" : "draft"
  });

  await prependStore("knowledgeItems", {
    id: `knowledge-${date}-cloud-runner`,
    createdAt: timestamp,
    publishedAt: date,
    title: "第二大脑 v4 云端任务运行记录",
    summaryZh: "云端 runner 已能写入 outputs/ 和 automation-workbench/data/，并记录米促 API 余额监控与邮件交付状态。",
    sourceUrl: "automation-workbench/scripts/second-brain-cloud-runner.mjs",
    sourceName: "本地/云端 runner",
    domain: "system",
    tags: ["Codex Cloud", "自动化", "第二大脑", "米促 API", "邮件交付"],
    credibility: "本地或 CI 运行记录",
    impact: "证明云端或 CI 环境可以生成工作台可读取的数据文件。",
    nextAction: "接入可信搜索源、GitHub/Codex Cloud 定时执行、米促真实余额查询和 163 SMTP 授权。"
  });

  await prependStore("taskHistory", {
    id: `history-${date}-cloud-daily-runner`,
    createdAt: timestamp,
    completedAt: timestamp,
    category: "system",
    userText: "运行第二大脑 v4 云端每日任务骨架",
    primaryAssistant: "资讯助手",
    secondaryAssistants: ["交付助手", "维护助手"],
    skills: ["documents"],
    sources: ["local runner", ...(apiBudget.sources || [])],
    status: "completed",
    outputs: [
      workspacePath(dailyBriefPath),
      workspacePath(businessFeedbackPath),
      workspacePath(briefEmailPath),
      workspacePath(feedbackEmailPath),
      workspacePath(maintenanceReportPath)
    ],
    summary: "已生成每日简报、业务反馈、维护巡检和两封邮件草稿，并记录 API 余额监控与邮件交付状态。",
    nextAction: "在 GitHub Actions Secrets 或 Codex Cloud 中配置联网搜索、米促 API 余额来源和 163 SMTP 授权码。"
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
4. Skill/plugin 安装继续保持候选评估和人工确认。`;

  await writeFile(reportPath, body, "utf8");
  await prependStore("taskHistory", {
    id: `history-${date}-weekly-evolution-runner`,
    createdAt: timestamp,
    completedAt: timestamp,
    category: "system",
    userText: "运行第二大脑 v4 每周自我迭代审计骨架",
    primaryAssistant: "维护助手",
    secondaryAssistants: ["Skill Scout"],
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
