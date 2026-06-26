import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const WORKBENCH_ROOT = path.dirname(SCRIPT_DIR);
const WORKSPACE_ROOT = path.dirname(WORKBENCH_ROOT);
const DEFAULT_OUTPUT_ROOT = path.join(WORKSPACE_ROOT, ".pages-site");

const PUBLIC_MODULES = [
  {
    id: "auto",
    title: "自动判断",
    shortTitle: "Auto",
    tag: "自动路由",
    description: "根据需求自动选择主助手和协同助手。",
    skills: ["browser", "anysearch", "documents", "presentations", "spreadsheets"],
    workflow: "automation-workbench/workflows/router-workflow.md",
    prompt: "先判断需求属于 Office、资讯、金融、业务、信息处理、账号复盘、内容/IP、成长或系统扩展，再选择合适助手协同执行。"
  },
  {
    id: "office",
    title: "Office 助手",
    shortTitle: "Office",
    tag: "Word / PPT / Excel",
    description: "把数据、文字材料和模板整理成可交付的表格、汇报和文档。",
    skills: ["documents", "presentations", "spreadsheets"],
    workflow: "workflows/combined-office-workflow.md",
    prompt: "检查用户自己的 inputs/、templates/ 和 workflows/，生成或编辑 Word、PPT、Excel，并保存到用户自己的输出目录。"
  },
  {
    id: "news",
    title: "资讯助手",
    shortTitle: "News",
    tag: "中外信息 / 中文解读",
    description: "汇总市场、业务、平台、社会热点、学术和行业机会，并保留来源链接。",
    skills: ["anysearch", "web search", "spreadsheets", "documents"],
    workflow: "automation-workbench/workflows/daily-intelligence-brief.md",
    prompt: "使用实时搜索查询最新信息，覆盖中国大陆和海外来源，输出通俗中文解读、影响判断、可执行动作、报表建议和来源链接。"
  },
  {
    id: "trading",
    title: "金融助手",
    shortTitle: "Finance",
    tag: "市场资讯 / 风险提醒",
    description: "收集市场相关资讯，生成观察清单、纸面交易、风险清单和人工确认前检查。",
    skills: ["anysearch", "finance data", "web search"],
    workflow: "automation-workbench/workflows/stock-alert-workflow.md",
    prompt: "只做资讯、提醒、纸面交易、风险控制和人工确认前检查，不执行真实下单、支付或交易。"
  },
  {
    id: "work",
    title: "业务助手",
    shortTitle: "Biz",
    tag: "客户 / 达人 / 机会筛选",
    description: "参考用户授权的平台和公开网页，筛选机会、对象、竞品、内容表现、询盘质量和跟进清单。",
    skills: ["browser", "anysearch", "spreadsheets"],
    workflow: "automation-workbench/workflows/cross-border-inquiry-workflow.md",
    prompt: "结合用户自己选择的数据平台、社媒平台、CRM 或公开网页，整理业务机会、联系人、数据依据、触达线索和跟进清单。"
  },
  {
    id: "inbox",
    title: "信息助手",
    shortTitle: "Inbox",
    tag: "社交 / 邮件 / 客户消息",
    description: "整理用户授权平台里的可见消息，生成回复草稿、跟进优先级和风险提醒。",
    skills: ["browser", "documents", "spreadsheets"],
    workflow: "automation-workbench/workflows/inbox-assistant-workflow.md",
    prompt: "打开用户指定的信息平台，仅读取用户授权页面中的可见消息，生成回复草稿和跟进清单；真正发送前必须等待用户确认。"
  },
  {
    id: "delivery",
    title: "交付助手",
    shortTitle: "Deliver",
    tag: "邮件 / 文件 / 外发确认",
    description: "把结果整理成邮件、报表、附件、摘要和发送前检查清单。",
    skills: ["browser", "documents", "spreadsheets", "presentations"],
    workflow: "automation-workbench/workflows/delivery-workflow.md",
    prompt: "把结果整理成可交付内容，包括邮件草稿、附件、摘要、来源链接和发送前确认清单；外发前必须等待用户确认。"
  },
  {
    id: "analytics",
    title: "账号数据复盘",
    shortTitle: "Review",
    tag: "作品 / 沟通 / 转化",
    description: "读取用户授权页面或输入表格中的账号、内容、沟通和转化数据，输出复盘建议。",
    skills: ["browser", "spreadsheets", "documents"],
    workflow: "automation-workbench/workflows/account-analytics-workflow.md",
    prompt: "读取用户提供或授权可见的数据，分析流量、互动、变现、转化、沟通成功率和话术效果，输出下一步优化建议。"
  },
  {
    id: "creator",
    title: "内容/IP 助手",
    shortTitle: "Creator",
    tag: "选题 / 脚本 / 剪辑 / 变现",
    description: "覆盖个人 IP 定位、选题、脚本、剪辑、发布、复盘和商业化。",
    skills: ["browser", "local app launcher", "video planning", "spreadsheets"],
    workflow: "automation-workbench/workflows/creator-ip-workflow.md",
    prompt: "围绕个人 IP 和内容增长，生成选题、脚本、剪辑方案、发布计划、复盘指标和变现建议；发布和外发前等待用户确认。"
  },
  {
    id: "growth",
    title: "个人成长助手",
    shortTitle: "Growth",
    tag: "认知 / 逻辑 / 财商 / 社交",
    description: "沉淀心理学、逻辑学、经济金融、社交公共关系、表达和学习方法。",
    skills: ["anysearch", "documents", "spreadsheets"],
    workflow: "automation-workbench/workflows/personal-growth-workflow.md",
    prompt: "围绕认知成长、心理学、逻辑学、经济学、金融学、社交学和公共关系，整理书单、论文、观点卡和练习计划。"
  },
  {
    id: "health",
    title: "健康助手",
    shortTitle: "Health",
    tag: "训练 / 饮食 / 作息 / 身材",
    description: "安排训练、饮食、睡眠、身材管理和健康习惯；只做一般健康管理建议。",
    skills: ["anysearch", "documents", "spreadsheets"],
    workflow: "automation-workbench/workflows/health-assistant-workflow.md",
    prompt: "根据用户目标和记录，生成训练、饮食、作息和身材管理建议；涉及疾病、疼痛、药物或医学问题时建议咨询专业医生。"
  },
  {
    id: "profile",
    title: "个人画像助手",
    shortTitle: "Profile",
    tag: "偏好 / 目标 / 长期记忆",
    description: "通过用户确认的信息沉淀目标、偏好、约束和工作方式，让工作台更懂用户。",
    skills: ["documents", "spreadsheets"],
    workflow: "automation-workbench/workflows/personal-profile-workflow.md",
    prompt: "从用户确认的信息中提取偏好、目标、约束和工作方式，更新用户自己的个人画像；用户可查看、修改和删除。"
  },
  {
    id: "skills",
    title: "Skill Scout",
    shortTitle: "Skills",
    tag: "GitHub / Skill 评估安装",
    description: "搜索和评估可能有用的 Codex skills，安装前列出用途、来源、风险和路径。",
    skills: ["skill-installer", "browser", "anysearch"],
    workflow: "automation-workbench/skills/skill-scout.md",
    prompt: "搜索并评估可能有用的 Codex skills，列出用途、来源、维护状态和风险；安装前必须等待用户针对具体候选确认。"
  }
];

const PUBLIC_SOURCES = [
  { id: "custom_collaboration", name: "自选协作平台", group: "办公/沟通", url: "about:blank", defaultModules: ["inbox", "delivery"], note: "替换为你自己的办公、团队消息或客户沟通平台。" },
  { id: "custom_social", name: "自选社交平台", group: "社交/私信", url: "about:blank", defaultModules: ["inbox", "work", "creator", "analytics"], note: "替换为你自己的社交平台、创作者后台或私信入口。" },
  { id: "custom_email", name: "自选邮箱", group: "邮件", url: "about:blank", defaultModules: ["inbox", "delivery", "news"], note: "替换为你自己的邮箱服务；读取、草稿和发送都需要你的授权。" },
  { id: "custom_ecommerce", name: "自选电商数据平台", group: "电商/业务", url: "about:blank", defaultModules: ["work", "analytics"], note: "替换为你自己的选品、达人、店铺、商品或竞品分析平台。" },
  { id: "custom_creator_platform", name: "自选内容平台", group: "内容/IP", url: "about:blank", defaultModules: ["news", "creator", "analytics"], note: "替换为你自己的短视频、图文、直播或创作者数据平台。" },
  { id: "custom_finance", name: "自选金融数据源", group: "金融", url: "about:blank", defaultModules: ["trading", "news"], note: "替换为你自己的行情、公告、研报或投资研究来源；不自动交易。" },
  { id: "custom_research", name: "自选学术/资料源", group: "学术/知识库", url: "about:blank", defaultModules: ["news", "growth"], note: "替换为你自己的论文、数据库、行业资料或知识来源。" },
  { id: "github", name: "GitHub", group: "技能/扩展", url: "https://github.com/", defaultModules: ["skills"], note: "用于评估开源 skills、插件和自动化脚本；安装前需要确认。" }
];

const PUBLIC_SKILLS = [
  { id: "browser", name: "browser", defaultModules: ["work", "creator", "skills", "inbox", "delivery", "analytics"] },
  { id: "chrome", name: "chrome", defaultModules: ["work", "creator", "inbox", "delivery", "analytics"] },
  { id: "computer-use", name: "computer-use", defaultModules: ["creator", "inbox", "delivery"] },
  { id: "playwright", name: "playwright", defaultModules: ["work", "inbox", "analytics", "creator"] },
  { id: "anysearch", name: "anysearch", defaultModules: ["news", "trading", "work", "skills", "creator", "growth", "health"] },
  { id: "documents", name: "documents", defaultModules: ["office", "inbox", "delivery", "analytics", "growth", "health", "profile"] },
  { id: "presentations", name: "presentations", defaultModules: ["office", "delivery"] },
  { id: "spreadsheets", name: "spreadsheets", defaultModules: ["office", "work", "delivery", "analytics", "creator", "growth", "health", "profile"] },
  { id: "email-draft-polish", name: "email-draft-polish", defaultModules: ["inbox", "delivery"] },
  { id: "skill-installer", name: "skill-installer", defaultModules: ["skills"] },
  { id: "skill-creator", name: "skill-creator", defaultModules: ["skills"] },
  { id: "pdf", name: "pdf", defaultModules: ["office", "news", "delivery"] }
];

const PUBLIC_DELIVERY = [
  { id: "local_outputs", name: "保存到你自己的输出目录", defaultModules: ["office", "news", "trading", "work", "delivery", "analytics", "creator", "growth", "health", "profile"] },
  { id: "email_draft", name: "生成邮件草稿", defaultModules: ["delivery", "news", "inbox"] },
  { id: "email_send_confirm", name: "邮件发送前确认", defaultModules: ["delivery", "news"] },
  { id: "social_draft", name: "生成社交回复草稿", defaultModules: ["inbox", "work"] },
  { id: "social_send_confirm", name: "社交外发前确认", defaultModules: ["inbox", "work"] },
  { id: "daily_report", name: "生成日报/复盘", defaultModules: ["news", "analytics", "creator"] }
];

const PUBLIC_ROUTING = {
  office: ["word", "docx", "ppt", "powerpoint", "excel", "xlsx", "csv", "报表", "文档", "表格", "汇报"],
  news: ["新闻", "资讯", "热点", "时政", "社会", "平台玩法", "算法", "知识库", "简报", "实时", "学术", "论文", "早报", "日报"],
  trading: ["股票", "美股", "港股", "基金", "交易", "短线", "涨跌", "财报", "评级", "风控", "信号", "市场"],
  work: ["询盘", "跨境", "选品", "达人", "kol", "koc", "ugc", "竞品", "直播", "客户", "成交", "bd", "机会"],
  inbox: ["消息", "回复", "话术", "邮件", "邮箱", "客户", "社交", "未读", "私信"],
  delivery: ["发送", "邮件", "交付", "附件", "发给", "收件人", "草稿", "外发"],
  analytics: ["数据", "复盘", "成功率", "转化", "变现", "流量", "完播", "互动", "账号数据", "作品数据"],
  creator: ["剪辑", "视频", "字幕", "bgm", "素材", "短视频", "镜头", "自媒体", "个人ip", "人设", "选题", "脚本"],
  growth: ["成长", "心理学", "逻辑", "认知", "财商", "经济学", "金融学", "社交", "公关", "书单", "学习"],
  health: ["健康", "训练", "饮食", "作息", "睡眠", "身材", "减脂", "增肌", "体态"],
  profile: ["个人画像", "偏好", "目标", "了解我", "第二大脑", "长期记忆", "个人助手"],
  skills: ["skill", "skills", "插件", "github", "安装", "自我进化", "扩展能力", "下载", "自动化"]
};

const PUBLIC_PROMPTS = {
  queueCommand: "请打开我的自动化工作台，处理执行队列；优先执行最新任务，按任务要求使用对应 skill、平台、交付方式和 workflow，最终把结果保存到我自己的输出目录，并用中文说明。",
  inbox: `请启动信息助手。
目标：整理我授权平台中指定范围内的可见消息。
要求：
1. 如需登录或验证码，停下让我在浏览器里亲自完成。
2. 只读取我授权页面中的可见信息，不读取密码，不绕过权限。
3. 按紧急度、业务价值、是否需要回复、是否需要跟进分组。
4. 为每条需要回复的信息生成中文或英文草稿，并说明语气、目的和风险。
5. 不要直接发送消息；发送前必须等待我确认。`,
  analytics: `请启动账号数据复盘。
目标：读取我授权页面或 inputs/ 中的数据，分析沟通、内容、变现和转化。
要求：
1. 输出关键指标：回复率、成功率、成交概率、流量、完播、互动、转化、变现。
2. 分析哪些话术、内容、剪辑节奏、标题、封面或选题表现更好。
3. 给出明天可执行的优化建议和 A/B 测试假设。
4. 涉及 Office 文件时，保存 Excel 或 Word 到我自己的输出目录。
5. 无法读取后台时，列出需要我导出的数据字段。`,
  creator: `请启动内容/IP 助手。
目标：围绕个人 IP 和内容增长，优化选题、脚本、剪辑、发布、复盘和商业转化。
要求：
1. 结合已有作品数据、平台热点和账号定位。
2. 输出选题库、脚本、剪辑建议、标题封面建议和发布时间建议。
3. 给出变现路径：带货、私域、合作报价、服务产品或内容漏斗。
4. 具体发布和外发动作需要我确认。`,
  dailyBrief: `请生成每日信息简报并准备邮件交付。
收件邮箱：your-email@example.com
要求：
1. 自动联网搜集并整理金融、业务、内容平台、AI、社会热点和学术信息。
2. 同时覆盖中国大陆和海外信息源。
3. 无论来源是中文还是英文，解读都必须用通俗易懂的中文。
4. 每条重要信息必须带真实可查询的网址来源，不编造数据。
5. 输出一份中文简报、一份结构化报表，并保存到我自己的输出目录。
6. 邮件正文先生成草稿；真正发送前需要我确认或配置安全邮件发送方式。`,
  knowledgeUpdate: `请更新我的实时知识库。
要求：
1. 使用实时搜索查询最新市场、业务、创作者平台和学术信息。
2. 每条信息记录日期、主题、摘要、对我的影响、下一步动作和来源链接。
3. 覆盖中国大陆与海外信息源，英文资料转成通俗中文解读。
4. 不要编造来源；无法验证的信息标注为待核实。`,
  secondBrainAutonomy: `请启动第二大脑自主运行工作流。
目标：区分本地工作台、Codex 自动化和云端常久在线层，判断哪些任务可自主执行，哪些必须等待确认。
要求：
1. 可自主执行公开资讯收集、知识库更新、信息简报、业务反馈、邮件草稿和自我迭代候选清单。
2. 邮件发送、社交消息发送、上传、提交、发布、安装、真实交易、支付或下单必须等待我确认。
3. 电脑关机后仍需运行的任务，必须放到云端或自动化服务，不承诺本地工作台能在关机后继续运行。
4. 结果尽量写入我自己的输出目录和数据目录，并保留来源链接、时间戳和下一步动作。`,
  skillScout: `请启动 Skill Scout。
目标：搜索 GitHub 或官方技能仓库，找出可能提升 Office、搜索、业务、金融资讯、社交交付、邮件、剪辑和自动化能力的 Codex skills 或插件。
要求：
1. 先列候选，不要直接安装。
2. 对每个候选说明来源链接、用途、维护状态、风险、是否需要网络或账号。
3. 优先可信来源，陌生仓库先读 README 和文件结构。
4. 如建议安装，给出明确安装命令和新增本地路径。
5. 即使我开放权限，也必须针对具体候选等待确认后再安装。`
};

const CLOUD_TEXT_REPLACEMENTS = [
  [/Jacky/g, "模板作者"],
  [/jacky060911@163\.com/g, "your-email@example.com"],
  [/jacky060911/g, "your-email"],
  [/嘉十一/g, "YourName"],
  [/Kalodata/g, "自选数据平台"],
  [/FastMoss/g, "自选电商平台"],
  [/TikClubs/g, "自选达人平台"],
  [/达秘/g, "自选达人平台"],
  [/渣打/g, "你的交易平台"],
  [/Standard Chartered/g, "your brokerage"],
  [/剪映/g, "你的剪辑工具"],
  [/JianyingPro\.exe/g, "video-editor.exe"],
  [/C:\\Users\\嘉十一/g, "C:\\Users\\YourName"],
  [/C:\\\\Users\\\\嘉十一/g, "C:\\\\Users\\\\YourName"],
  [/outputs\/task-\d+/g, "outputs/your-task"],
  [/history-task-\d+/g, "history-task-template"]
];

function parseArgs(argv) {
  const options = { out: DEFAULT_OUTPUT_ROOT };
  for (let index = 0; index < argv.length; index += 1) {
    if (argv[index] === "--out") {
      options.out = path.resolve(argv[index + 1]);
      index += 1;
    }
  }
  return options;
}

function sanitizeCloudText(text) {
  return CLOUD_TEXT_REPLACEMENTS.reduce(
    (current, [pattern, replacement]) => current.replace(pattern, replacement),
    text
  );
}

function buildPublicModulesScript() {
  return [
    `window.WORKBENCH_MODULES = ${JSON.stringify(PUBLIC_MODULES, null, 2)};`,
    `window.WORKBENCH_SOURCES = ${JSON.stringify(PUBLIC_SOURCES, null, 2)};`,
    `window.WORKBENCH_SKILLS = ${JSON.stringify(PUBLIC_SKILLS, null, 2)};`,
    `window.WORKBENCH_DELIVERY = ${JSON.stringify(PUBLIC_DELIVERY, null, 2)};`,
    `window.ASSISTANT_ROUTING = ${JSON.stringify(PUBLIC_ROUTING, null, 2)};`,
    `window.WORKBENCH_PROMPTS = ${JSON.stringify(PUBLIC_PROMPTS, null, 2)};`,
    ""
  ].join("\n\n");
}

async function copySanitizedAppAsset(sourceApp, targetApp, fileName) {
  const text = await readFile(path.join(sourceApp, fileName), "utf8");
  await writeFile(path.join(targetApp, fileName), sanitizeCloudText(text), "utf8");
}

async function copyPublicApp(outputRoot) {
  const sourceApp = path.join(WORKBENCH_ROOT, "app");
  const targetApp = path.join(outputRoot, "automation-workbench", "app");
  await mkdir(targetApp, { recursive: true });

  for (const fileName of [
    "index.html",
    "styles.css",
    "queue-state.js",
    "app.js",
    "hover-translate.js"
  ]) {
    await copySanitizedAppAsset(sourceApp, targetApp, fileName);
  }

  await writeFile(path.join(targetApp, "modules.js"), buildPublicModulesScript(), "utf8");
}

async function writeRootRedirect(outputRoot) {
  await writeFile(path.join(outputRoot, "index.html"), `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Second Brain Workbench Template</title>
  <meta http-equiv="refresh" content="0; url=automation-workbench/app/">
  <link rel="canonical" href="automation-workbench/app/">
</head>
<body>
  <p><a href="automation-workbench/app/">Open Second Brain Workbench Template</a></p>
</body>
</html>
`, "utf8");
}

const { out } = parseArgs(process.argv.slice(2));
await rm(out, { recursive: true, force: true });
await mkdir(out, { recursive: true });
await writeRootRedirect(out);
await copyPublicApp(out);

console.log(`Cloud share site built at ${out}`);
