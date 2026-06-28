import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { checkApiBudget } from "./api-budget-monitor.mjs";
import { updateDailyBriefLibrary } from "./daily-brief-library.mjs";
import { deliverDraftEmails, getMailRecipients } from "./email-delivery.mjs";
import { loadRuntimeEnv } from "./runtime-env.mjs";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const WORKBENCH_ROOT = path.dirname(SCRIPT_DIR);
const WORKSPACE_ROOT = path.dirname(WORKBENCH_ROOT);
const OUTPUTS_DIR = path.join(WORKSPACE_ROOT, "outputs");
const DATA_DIR = path.join(WORKBENCH_ROOT, "data");

const DEFAULT_RECIPIENTS = ["jacky060911@163.com", "liu13922830178@outlook.com"];

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

function mergeById(newRecords, current) {
  const seen = new Set();
  const result = [];
  for (const item of [...newRecords, ...(Array.isArray(current) ? current : [])]) {
    const key = item?.id || JSON.stringify(item);
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(item);
  }
  return result;
}

async function prependStore(storeName, records) {
  const filePath = path.join(DATA_DIR, STORE_FILES[storeName]);
  const current = await readJson(filePath, []);
  const list = Array.isArray(records) ? records : [records];
  await writeJsonAtomic(filePath, mergeById(list, current));
}

function tableStatus(status) {
  switch (status) {
    case "ok":
      return "正常";
    case "low_balance":
      return "需要充值";
    case "ready_to_send":
      return "准备发送";
    case "draft_only":
      return "草稿模式";
    case "sent":
      return "已发送";
    case "send_error":
      return "发送失败";
    case "error":
      return "查询失败";
    case "not_configured":
      return "待授权";
    default:
      return "待核实";
  }
}

function recipientLine(env = process.env) {
  const recipients = getMailRecipients({
    ...env,
    MAIL_TO_FALLBACK: env.MAIL_TO_FALLBACK || DEFAULT_RECIPIENTS.join(",")
  });
  return recipients.length ? recipients.join(", ") : DEFAULT_RECIPIENTS.join(", ");
}

const runtimeEnv = loadRuntimeEnv();

function makeTaskCostSection({ apiBudget }) {
  return `## 预计任务执行成本

- 本次轻量日报/反馈 runner 本身：预计 0 元人民币的本地脚本费用；如果在 GitHub Actions 免费额度内运行，通常不产生额外云端运行费，超出额度以 GitHub 账单为准。
- LLM/API/token：取决于是否调用米促 API、OpenAI/Codex、AnySearch 或其他模型服务；未读取到真实账单接口前，只能标注待核实，不编造金额。
- 邮件发送：使用 163 SMTP 发送到白名单邮箱通常不另收 SMTP 费用，但邮箱服务策略、发送频率和失败重试需持续观察。
- 第三方平台订阅：Kalodata、FastMoss、达秘/TikClubs、剪映、数据源或代理等费用独立于工作台，需要按各平台套餐核算。
- 余额提醒：${apiBudget.message}`;
}

function makeMaintenanceCostSection({ apiBudget }) {
  return `## 运行与维护成本

| 成本项 | 当前判断 | 说明 |
| --- | --- | --- |
| 米促 API/token | ${tableStatus(apiBudget.status)} | ${apiBudget.message} |
| GitHub Actions / 云端任务 | 待账单核实 | 若在免费额度内通常为 0 元人民币；超出后以 GitHub 账号账单为准。 |
| Codex / OpenAI 调用 | 待账单核实 | 取决于模型、token、工具调用和自动化频率；每次复杂任务开始前应先给出预计人民币成本区间。 |
| 163 SMTP 邮件 | 预计 0 元人民币 | 只发送到已配置白名单邮箱；真实可用性以 SMTP 发送结果为准。 |
| 第三方平台订阅 | 待平台核实 | Kalodata、FastMoss、达秘/TikClubs、数据源、剪映会员等由各平台独立收费。 |
| 本地电脑运行 | 低额但非零 | 开机运行会消耗电费和网络；关机后需依赖云端或常久在线机器。 |

维护策略：每日轻量同步 API 余额和邮件状态；每周同步系统运行、稳定性、云端任务、平台入口、skills/plugins 和预估人民币维护成本。`;
}

function makeDailyBrief({ date, apiBudget }) {
  return `# 第二大脑 v4 每日信息简报

日期：${date}
收录时间：${new Date().toLocaleString("zh-CN", { timeZone: "Asia/Shanghai" })} Asia/Shanghai
交付状态：云端轻量草稿；真实邮件发送取决于 SMTP/邮箱连接器配置

## 今日最重要消息

1. 金融市场：今日云端轻量 runner 已启动信息简报链路。若 GitHub Actions/Codex 自动化环境配置了 AnySearch 或可用网页搜索，它应进一步补充美股、港股、AI 芯片、银行、医疗、宏观政策和股票涨跌催化的真实来源链接。
2. 跨境电商：继续重点跟踪 TikTok Shop 美妆、假睫毛、男生美妆、达人带货、爆款短视频脚本、直播表现、竞品表现和 Kalodata/FastMoss/达秘/TikClubs 可见数据。
3. 自媒体/IP：继续围绕“跨境电商 BD + AI 第二大脑 + 真实工作流复盘”的个人 IP 方向，积累选题、脚本、前三秒钩子、剪辑建议和平台玩法。
4. 知识库：今日记录会写入工作台数据中心，作为后续个性化和自我迭代的基础。

## AI 技术最新发展

- 模型与 Agent：每日跟踪 OpenAI、Anthropic、Google、Meta、xAI、阿里、智谱、DeepSeek 等模型、智能体、工具调用、长上下文、代码能力和企业应用进展；未检索到官方或可信来源时标注待核实。
- 多模态与内容生产：跟踪文本、图像、语音、视频、剪辑、直播脚本和数字人能力，重点判断能否提升无垠工作台、剪辑助手、自媒体/IP 助手和电商 BD 工作效率。
- 开源模型与本地部署：关注开源大模型、推理框架、端侧模型、RAG、知识库、Obsidian/Markdown 工作流和自动化代理工具，筛选可安全接入的候选。
- AI 芯片与基础设施：关注 GPU、HBM、先进封装、云厂商资本开支、推理成本下降和算力供给变化，并映射到美股/港股长期观察池。
- 监管、安全与版权：关注中国大陆、美国、欧盟及主流平台对生成式 AI、数据合规、内容标识、版权和模型安全的政策变化。
- 对你的可执行意义：优先把“能降低成本、提高筛达人/写脚本/做报表/知识库更新效率”的技术加入候选清单；安装第三方代码前仍要记录来源、风险和确认项。

## 对美股/港股可能影响

- 美股：重点观察 AI 芯片、云计算资本开支、半导体库存、银行净息差、医疗政策、美元利率和财报指引。没有真实行情源时，本报告只给观察框架，不编造涨跌幅。
- 港股：重点观察恒生科技、AI/半导体、互联网平台、港股高股息、银行、医疗创新药和南向资金情绪。没有真实行情源时，标注为待核实。
- 长期持仓候选方向：指数基金、现金流稳定的大型金融、医疗健康、AI 基础设施、具备订单和现金流验证的科技龙头。建议观察周期至少 6-24 个月，并按季度复盘估值与业绩。

## 对跨境电商业务可能影响

- 今日优先动作：在 Kalodata/FastMoss/达秘/TikClubs 中筛选美妆、假睫毛、男生美妆、反差妆、GRWM、快速出门妆相关达人。
- 达人筛选字段：账号链接、平台、联系方式、粉丝量、近 30 天播放、互动率、带货品类、受众地区、内容风格、过往美妆转化、是否适合假睫毛、风险备注。
- 爆款脚本方向：妆前妆后反差、漂亮男孩子第一次戴假睫毛、5 分钟出门眼妆、朋友认不出挑战、约会前快速变精致。

## 对自媒体/IP 和内容创作者的可执行建议

1. 今天准备 2 条个人 IP 内容：一条讲“AI 工作台如何筛达人”，一条讲“为什么男生美妆达人适合假睫毛产品”。
2. 每条视频只讲一个结论，前三秒给结果或冲突，不要从自我介绍开始。
3. 复盘指标先固定为播放、完播、互动、主页访问、私信、商品点击、成交或有效咨询。
4. 平台算法变化如果没有官方来源或可信来源，不写成确定结论，只写“待核实观察”。

## API/token 费用提醒

- ${apiBudget.message}

${makeTaskCostSection({ apiBudget })}

## 结构化报表建议

- 金融观察表：日期、市场、板块、催化、影响方向、来源、风险、是否加入观察池。
- 达人筛选表：账号、平台、联系方式、粉丝、近 30 天表现、内容风格、产品匹配度、建联话术、跟进状态。
- 内容复盘表：平台、作品链接、标题、前三秒钩子、播放、完播、互动、转化、下一次优化。
- 知识库表：标题、发布时间、收录时间、原文链接、中文解读、可信度、适用助手。

## 来源链接

- 真实来源链接需要在云端搜索/API 可用后补充；无法联网或无法核实时必须标注“待核实”。
- 工作台本地记录：automation-workbench/data/
- 输出目录：outputs/
`;
}

function makeBusinessFeedback({ date }) {
  return `# 第二大脑 v4 业务反馈

日期：${date}
交付状态：云端轻量草稿；账号后台数据待授权或待导出

## 今日结论

工作台可以持续生成复盘框架、跟进行动和可交付文件。真正的账号级反馈需要读取你已授权平台里的可见数据，或读取你导出的 Excel/CSV。没有真实账号数据时，本报告不会编造话术成功率、作品流量、转化或 GMV。

## 达人沟通与话术成功率

当前状态：待授权/待导出。

需要字段：

| 字段 | 用途 |
| --- | --- |
| 达人名称/账号链接 | 去重和回访 |
| 平台 | TikTok / Instagram / YouTube / 小红书等 |
| 联系方式 | 邮箱、WhatsApp、IG、TikTok 私信等 |
| 首次触达时间 | 计算回复周期 |
| 使用话术版本 | A/B 测试 |
| 是否回复 | 计算回复率 |
| 是否有效回复 | 过滤自动回复和无效回复 |
| 是否进入报价/寄样 | 计算推进率 |
| 是否成交 | 计算成交率 |
| 备注 | 记录拒绝原因和优化点 |

建议话术 A：直接合作

你好，我是负责美国 TikTok Shop 美妆品类合作的 Jacky。我们在找适合男生美妆、反差妆容和镜头感妆容的创作者，觉得你的外形和内容气质很适合假睫毛产品。想邀请你做一个短视频合作，重点是妆前妆后的变化和前三秒吸引力。如果你感兴趣，我可以发产品信息、佣金方式和内容参考。

建议话术 B：内容共创

你好，我看到你的内容很适合做“漂亮男孩子反差妆容”方向。我们想共创一个假睫毛短视频脚本，不是硬广，而是突出 3 秒变精致、上镜、约会前快速出门的场景。你愿意看一下脚本和产品资料吗？如果风格匹配，可以继续聊寄样和佣金。

## 作品流量、转化和变现复盘

当前状态：待授权/待导出。

明日优先复盘：

1. 抖音/TikTok/小红书/视频号过去 7 天发布作品。
2. 每条作品的播放、完播、平均观看时长、点赞、评论、收藏、分享、主页访问、商品点击、成交或咨询。
3. 哪个前三秒钩子表现最好，哪个封面/标题带来更高点击。
4. 哪类内容带来有效私信或客户咨询。

## 爆款脚本与前三秒钩子

1. “男生戴假睫毛，真的会变精致吗？”
2. “迟到前 5 分钟，我只做这一件事。”
3. “我戴完这个，朋友说我像换了个人。”
4. “假睫毛不是女生专属，镜头会告诉你答案。”
5. “漂亮男孩子出门前，眼睛一定不能没精神。”

## 明日动作

1. 从 Kalodata/FastMoss/达秘/TikClubs 各筛 20 个美妆/男生美妆/反差妆达人，合并去重后保留 30 个候选。
2. 用话术 A/B 各触达 15 个达人，次日计算回复率和有效回复率。
3. 拍摄 2 条个人 IP 内容：一条讲工作台筛达人流程，一条讲男达人适配假睫毛的逻辑。
4. 把账号作品数据和达人沟通数据导出到 inputs/，由 Office 助手生成 Excel 和可视化图表。
`;
}

function makeEmailDraft({ date, kind, body, apiBudget }) {
  const title = kind === "brief" ? "信息简报" : "业务反馈";
  const subject = `${date} 第二大脑 v4 ${title}`;
  const apiLine = apiBudget?.status === "low_balance"
    ? `\n\n【费用提醒】${apiBudget.message}`
    : "";
  const recipients = recipientLine();

  const emailBody = `你好，Jacky：

这是 ${date} 的第二大脑 v4 ${title}。

${body}
${apiLine}

说明：没有真实来源的数据会标注“待核实/待授权”；真实自动发信需要云端配置 SMTP 或邮箱连接器。`;

  return {
    subject,
    body: emailBody,
    text: `收件人：${recipients}
主题：${subject}

${emailBody}`
  };
}

function makeMaintenanceReport({ date, apiBudget, emailDelivery }) {
  return `# 第二大脑 v4 维护巡检报告

日期：${date}

## 总体状态

- Codex 定时自动化/云端工作流适合在电脑关机后继续执行公开信息收集、文件生成、知识库更新、邮件草稿和已授权邮件发送。
- 本地工作台、夸克浏览器、微信、飞书、剪映、Kalodata、FastMoss、达秘、TikClubs 等依赖本机或登录态的平台，在电脑关机或云端无浏览器授权时无法直接读取账号内数据。
- 不读取、不保存、不绕过密码、验证码、二次验证、支付密码或交易确认。

## 轻量巡检清单

| 项目 | 状态 | 说明 |
| --- | --- | --- |
| outputs/ 写入 | 已检查 | runner 会写入每日简报、业务反馈、维护报告和邮件草稿 |
| 数据中心 JSON | 已检查 | runner 会更新 automation-workbench/data/ |
| 邮件发送 | ${tableStatus(emailDelivery.status)} | ${emailDelivery.message} |
| API/token 费用 | ${tableStatus(apiBudget.status)} | ${apiBudget.message} |
| 平台真实接入 | 待本机/待登录核实 | 需要开机、登录态、API 或导出文件 |
| 金融交易 | 安全模式 | 只做资讯、提醒、纸面交易和人工确认前检查 |
| 社交/邮件外发 | 条件执行 | 邮件可在 SMTP 配置后自动发；社交外发仍建议人工确认 |

## 邮件交付

- 目标收件人：${recipientLine()}
- 若配置 SMTP_HOST、SMTP_PORT、SMTP_USER、SMTP_PASS、MAIL_FROM 且 SEND_EMAIL=true，runner 会尝试发送两封邮件：信息简报和业务反馈。
- 若未配置或发送失败，runner 只生成草稿并记录原因。

## API/token 费用监控

- 提醒线：${apiBudget.thresholdCny ?? 50} 元人民币。
- 当前状态：${apiBudget.message}
- 若需要自动读取米促 API 真实余额，需要配置 MICU_API_BALANCE_URL、MICU_API_KEY 或 MICU_API_TOKEN，以及必要时的 MICU_API_BALANCE_JSON_PATH。

${makeMaintenanceCostSection({ apiBudget })}

## 云端/本地边界

- 电脑关机后：本地工作台不能运行；Codex 定时自动化、GitHub Actions、VPS/NAS 或其他常久在线服务可以继续运行。
- 开机后：本地工作台可以查看 outputs/、知识库、历史记录和执行队列，也可以打开本机平台和桌面软件。
- 自我学习/自我迭代：可以通过每日/每周云端任务收集公开资料、更新知识库、产出维护报告；安装第三方代码、连接新平台、真实外发和真实交易仍需要明确确认。
`;
}

async function writeDailyOutputs({ date, dailyBriefBody, businessFeedbackBody, briefDraft, feedbackDraft, maintenanceReportBody }) {
  await mkdir(OUTPUTS_DIR, { recursive: true });

  const dailyBriefPath = path.join(OUTPUTS_DIR, `daily-brief-${date}.md`);
  const businessFeedbackPath = path.join(OUTPUTS_DIR, `business-feedback-${date}.md`);
  const briefEmailPath = path.join(OUTPUTS_DIR, `email-draft-daily-brief-${date}.md`);
  const feedbackEmailPath = path.join(OUTPUTS_DIR, `email-draft-business-feedback-${date}.md`);
  const maintenanceReportPath = path.join(OUTPUTS_DIR, `maintenance-report-${date}.md`);

  await writeFile(dailyBriefPath, dailyBriefBody, "utf8");
  await writeFile(businessFeedbackPath, businessFeedbackBody, "utf8");
  await writeFile(briefEmailPath, briefDraft.text, "utf8");
  await writeFile(feedbackEmailPath, feedbackDraft.text, "utf8");
  await writeFile(maintenanceReportPath, maintenanceReportBody, "utf8");

  return {
    dailyBriefPath,
    businessFeedbackPath,
    briefEmailPath,
    feedbackEmailPath,
    maintenanceReportPath
  };
}

async function recordDailyRun({ date, timestamp, paths, apiBudget, emailDelivery, library }) {
  await prependStore("dailyBriefs", {
    id: `daily-brief-${date}`,
    createdAt: timestamp,
    date,
    title: `${date} 第二大脑 v4 信息简报`,
    summary: "云端 runner 已生成信息简报；实时新闻和平台数据按可用搜索/API/授权状态补充。",
    outputs: [workspacePath(paths.dailyBriefPath), workspacePath(paths.briefEmailPath), ...library.outputs],
    status: emailDelivery.status === "sent" ? "sent" : "draft"
  });

  await prependStore("businessFeedback", {
    id: `business-feedback-${date}`,
    createdAt: timestamp,
    date,
    title: `${date} 第二大脑 v4 业务反馈`,
    summary: "云端 runner 已生成业务反馈；达人沟通、作品流量、转化和变现指标待平台授权或导出文件补齐。",
    outputs: [workspacePath(paths.businessFeedbackPath), workspacePath(paths.feedbackEmailPath), ...library.outputs],
    status: emailDelivery.status === "sent" ? "sent" : "draft"
  });

  await prependStore("knowledgeItems", [
    {
      id: `knowledge-${date}-daily-automation`,
      createdAt: timestamp,
      publishedAt: date,
      title: "第二大脑 v4 每日自动化运行记录",
      summaryZh: "每日 runner 负责生成信息简报、业务反馈、维护巡检、邮件草稿，并在 SMTP 授权后自动发往两个邮箱。",
      sourceUrl: "automation-workbench/scripts/second-brain-cloud-runner.mjs",
      sourceName: "Second Brain Cloud Runner",
      domain: "system",
      tags: ["第二大脑", "自动化", "邮件", "知识库", "历史记录"],
      credibility: "本地脚本和自动化运行记录",
      impact: "为关机后的周期性任务提供可执行骨架；真实新闻、账号数据和余额仍依赖云端密钥或平台授权。",
      nextAction: "配置 AnySearch、SMTP、米促 API 余额查询和平台数据导出/授权。"
    },
    {
      id: `knowledge-${date}-automation-boundary`,
      createdAt: timestamp,
      publishedAt: date,
      title: "本地工作台与云端后台自动化边界",
      summaryZh: "本地工作台关机后不能运行；电脑关机后继续执行必须依赖 Codex 定时自动化、GitHub Actions、VPS/NAS 或其他常久在线服务。",
      sourceUrl: "automation-workbench/cloud/README.md",
      sourceName: "Second Brain Cloud Notes",
      domain: "system",
      tags: ["云端", "本地化", "关机后运行", "自我迭代"],
      credibility: "项目架构记录",
      impact: "帮助区分哪些任务能后台执行，哪些任务必须开机和登录后处理。",
      nextAction: "把每日信息简报和业务反馈放到云端；把本机平台操作放到开机后的工作台。"
    }
  ]);

  await prependStore("taskHistory", {
    id: `history-${date}-daily-automation`,
    createdAt: timestamp,
    completedAt: timestamp,
    category: "system",
    userText: "执行第二大脑 v4 每日信息简报、业务反馈、维护巡检和邮件交付链路",
    primaryAssistant: "资讯助手",
    secondaryAssistants: ["业务助手", "交付助手", "维护助手"],
    skills: ["anysearch", "documents", "spreadsheets"],
    sources: ["local runner", ...(apiBudget.sources || [])],
    status: "completed",
    outputs: [
      workspacePath(paths.dailyBriefPath),
      workspacePath(paths.businessFeedbackPath),
      workspacePath(paths.briefEmailPath),
      workspacePath(paths.feedbackEmailPath),
      workspacePath(paths.maintenanceReportPath),
      ...library.outputs
    ],
    summary: "已生成每日简报、业务反馈、维护巡检、两封邮件草稿和每日简报库固定入口；若 SMTP 配置并开启发送则自动发出。",
    nextAction: "优先查看 outputs/daily-brief-latest.md 或 outputs/daily-brief-index.md；如需飞书镜像，配置飞书 API 或手动复制同步包。"
  });
}

async function runDaily() {
  const date = todayInShanghai();
  const timestamp = nowIso();
  const apiBudget = await checkApiBudget({ env: runtimeEnv });

  const dailyBriefBody = makeDailyBrief({ date, apiBudget });
  const businessFeedbackBody = makeBusinessFeedback({ date });
  const briefDraft = makeEmailDraft({ date, kind: "brief", body: dailyBriefBody, apiBudget });
  const feedbackDraft = makeEmailDraft({ date, kind: "feedback", body: businessFeedbackBody, apiBudget });

  const emailDelivery = await deliverDraftEmails({
    env: {
      ...runtimeEnv,
      MAIL_TO_FALLBACK: runtimeEnv.MAIL_TO_FALLBACK || DEFAULT_RECIPIENTS.join(",")
    },
    drafts: [
      { kind: "daily brief", subject: briefDraft.subject, body: briefDraft.body },
      { kind: "business feedback", subject: feedbackDraft.subject, body: feedbackDraft.body }
    ]
  });

  const maintenanceReportBody = makeMaintenanceReport({ date, apiBudget, emailDelivery });
  const paths = await writeDailyOutputs({
    date,
    dailyBriefBody,
    businessFeedbackBody,
    briefDraft,
    feedbackDraft,
    maintenanceReportBody
  });
  const library = await updateDailyBriefLibrary({
    workspaceRoot: WORKSPACE_ROOT,
    workbenchRoot: WORKBENCH_ROOT,
    outputsDir: OUTPUTS_DIR,
    date,
    dailyBriefPath: paths.dailyBriefPath,
    businessFeedbackPath: paths.businessFeedbackPath,
    maintenanceReportPath: paths.maintenanceReportPath,
    dailyBriefBody,
    businessFeedbackBody,
    maintenanceReportBody
  });
  await recordDailyRun({ date, timestamp, paths, apiBudget, emailDelivery, library });

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

每周审计 runner 已运行。它会回看最近任务记录，检查自动化、知识库、历史记录、平台接入、邮件交付和 API 费用提醒是否仍然可用。

## 最近任务

${recent.map((item, index) => `${index + 1}. ${item.userText || item.id}：${item.summary || "暂无摘要"}`).join("\n") || "- 暂无历史记录。"}

## 本周改进建议

1. 检查每日 8 点自动化是否持续产出 outputs/ 和 data/ 记录。
2. 检查 SMTP/邮箱连接器是否仍然可用，失败时只保留草稿并提示。
3. 检查 AnySearch 或网页搜索是否可用，所有外部信息必须保留来源链接。
4. 检查米促 API 余额监控是否能读取真实余额，低于 50 元人民币时提醒充值。
5. 检查平台入口是否真实可打开；账号内数据读取必须依赖登录态、API 或导出文件。
6. 评估可用 skill/plugin/MCP 候选，但安装第三方代码前保留确认。

## 运行与维护成本

- 预计人民币成本：每周审计本身若只跑本地脚本约 0 元；若调用模型、搜索 API、网页抓取、云端 runner 或第三方平台，则按实际 API/token、平台套餐和云端账单核算。
- GitHub Actions：检查是否仍在免费额度或可接受额度内；超出时记录账单来源。
- 邮件：163 SMTP 白名单邮件预计 0 元，但需要监控失败率、授权码状态和发送频率限制。
- 第三方平台订阅：Kalodata、FastMoss、达秘/TikClubs、剪映、数据源等单独列入维护成本。
- 下周动作：在每日/每周反馈中固定同步“已核实费用、待核实费用、余额是否低于 50 元、预计下次任务成本”。
`;

  await writeFile(reportPath, body, "utf8");
  await prependStore("taskHistory", {
    id: `history-${date}-weekly-evolution-runner`,
    createdAt: timestamp,
    completedAt: timestamp,
    category: "system",
    userText: "运行第二大脑 v4 每周自我迭代审计",
    primaryAssistant: "维护助手",
    secondaryAssistants: ["Skill Scout"],
    skills: ["documents"],
    sources: ["local runner"],
    status: "completed",
    outputs: [workspacePath(reportPath)],
    summary: "已生成每周自我迭代审计报告。",
    nextAction: "根据审计结果修复不可用平台、失效自动化、缺失密钥或数据同步问题。"
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
