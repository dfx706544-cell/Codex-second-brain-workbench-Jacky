window.WORKBENCH_MODULES = [
  {
    id: "auto",
    title: "自动判断",
    shortTitle: "Auto",
    tag: "自动路由",
    description: "根据需求自动选择主助手和协同助手。",
    skills: ["browser", "anysearch", "documents", "presentations", "spreadsheets"],
    workflow: "automation-workbench/workflows/router-workflow.md",
    prompt: "先判断需求属于 Office、资讯、金融、工作询盘、交付、信息处理、账号数据复盘、自媒体/IP 或 Skill Scout，再选择合适助手协同执行。"
  },
  {
    id: "office",
    title: "Office 助手",
    shortTitle: "Office",
    tag: "Word / PPT / Excel",
    description: "把数据、文字材料和模板整理成可交付的 Excel 报表、PPT 汇报和 Word 文档。",
    skills: ["documents", "presentations", "spreadsheets"],
    workflow: "workflows/combined-office-workflow.md",
    prompt: "检查 inputs/、templates/ 和 workflows/，根据资料生成或编辑 Word、PPT、Excel，最终文件保存到 outputs/。"
  },
  {
    id: "news",
    title: "资讯助手",
    shortTitle: "News",
    tag: "中外信息 / 中文解读",
    description: "汇总金融、跨境电商、创作者平台、社会热点、学术和业务机会，保留来源链接。",
    skills: ["anysearch", "web search", "spreadsheets", "documents"],
    workflow: "automation-workbench/workflows/daily-intelligence-brief.md",
    prompt: "使用 AnySearch 或网页搜索查询最新信息，覆盖中国大陆和海外来源，输出通俗中文解读、影响判断、可执行动作、报表文件和来源链接。"
  },
  {
    id: "trading",
    title: "金融助手",
    shortTitle: "Trading",
    tag: "美股 / 港股 / 提醒",
    description: "收集涨跌强相关资讯，生成短线观察、纸面交易、风险清单和长期投资研究框架。",
    skills: ["anysearch", "finance data", "web search"],
    workflow: "automation-workbench/workflows/stock-alert-workflow.md",
    prompt: "关注美股和港股，只做资讯、信号提醒、纸面交易、风险控制和人工确认前检查，不执行真实下单。"
  },
  {
    id: "work",
    title: "电商助手",
    shortTitle: "Ecom",
    tag: "BD / 达人 / 询盘",
    description: "打开或参考跨境电商平台，筛选商品、达人、竞品、视频/直播表现、询盘和跟进清单。",
    skills: ["browser", "anysearch", "spreadsheets"],
    workflow: "automation-workbench/workflows/cross-border-inquiry-workflow.md",
    prompt: "结合 Kalodata、FastMoss、达秘 / TikClubs、社交平台和公开网页信息，整理跨境电商机会、达人、竞品、询盘质量、触达线索、沟通记录和跟进清单。"
  },
  {
    id: "inbox",
    title: "信息助手",
    shortTitle: "Inbox",
    tag: "飞书 / 微信 / 邮箱 / 私信",
    description: "整理社交平台、邮箱和工作平台收到的信息，生成回复草稿和跟进优先级。",
    skills: ["browser", "documents", "spreadsheets"],
    workflow: "automation-workbench/workflows/inbox-assistant-workflow.md",
    prompt: "打开用户指定的信息平台，读取可见信息并分类，生成回复草稿、跟进优先级、风险提醒和待确认外发清单；不要直接发送。"
  },
  {
    id: "delivery",
    title: "交付助手",
    shortTitle: "Deliver",
    tag: "邮件 / 文件 / 外发确认",
    description: "把分析结果整理成邮件、报表、附件和发送前检查清单。",
    skills: ["browser", "documents", "spreadsheets", "presentations"],
    workflow: "automation-workbench/workflows/delivery-workflow.md",
    prompt: "把结果整理成可交付内容，包括邮件草稿、附件、摘要、来源链接和发送前确认清单；真正外发前必须等待用户确认。"
  },
  {
    id: "analytics",
    title: "账号数据复盘",
    shortTitle: "Review",
    tag: "作品 / 沟通 / 转化",
    description: "读取用户授权页面或输入表格里的账号作品、沟通、变现和转化数据，输出每日复盘。",
    skills: ["browser", "spreadsheets", "documents"],
    workflow: "automation-workbench/workflows/account-analytics-workflow.md",
    prompt: "读取用户提供或授权可见的账号数据，分析作品流量、互动、变现、转化、达人沟通成功率和话术效果，输出明日优化建议。"
  },
  {
    id: "creator",
    title: "自媒体/IP 助手",
    shortTitle: "Creator",
    tag: "选题 / 剪辑 / 人设 / 变现",
    description: "由剪辑助手升级而来，覆盖个人 IP 定位、选题、脚本、剪辑、发布、复盘和变现。",
    skills: ["browser", "local app launcher", "video planning", "spreadsheets"],
    workflow: "automation-workbench/workflows/creator-ip-workflow.md",
    prompt: "围绕个人 IP 和自媒体增长，生成选题、脚本、剪辑方案、发布计划、复盘指标和变现优化建议；如需剪映，使用已配置本机路径。"
  },
  {
    id: "growth",
    title: "个人成长助手",
    shortTitle: "Growth",
    tag: "认知 / 逻辑 / 财商 / 社交",
    description: "沉淀心理学、逻辑学、经济金融、社交公共关系、表达和学习方法，形成书单、观点卡和练习计划。",
    skills: ["anysearch", "documents", "spreadsheets"],
    workflow: "automation-workbench/workflows/personal-growth-workflow.md",
    prompt: "围绕认知成长、心理学、逻辑学、经济学、金融学、社交学和公共关系，整理书单、论文、热点观点、练习计划和中文解读，写入成长资料库。"
  },
  {
    id: "health",
    title: "健康助手",
    shortTitle: "Health",
    tag: "训练 / 饮食 / 作息 / 身材",
    description: "帮助安排训练、饮食、睡眠、身材管理和健康习惯；只做一般健康管理，不做医疗诊断。",
    skills: ["anysearch", "documents", "spreadsheets"],
    workflow: "automation-workbench/workflows/health-assistant-workflow.md",
    prompt: "根据用户目标和记录，生成训练、饮食、作息和身材管理建议；涉及疾病、疼痛、药物或长高医学问题时建议咨询专业医生。"
  },
  {
    id: "profile",
    title: "个人画像助手",
    shortTitle: "Profile",
    tag: "偏好 / 目标 / 长期记忆",
    description: "通过用户确认的信息沉淀目标、偏好、约束和工作方式，让工作台更懂用户。",
    skills: ["documents", "spreadsheets"],
    workflow: "automation-workbench/workflows/personal-profile-workflow.md",
    prompt: "从已确认的任务和用户表达中提取偏好、目标、约束和工作方式，更新个人画像；敏感信息不写入公开报告，用户可查看、修改和删除。"
  },
  {
    id: "skills",
    title: "Skill Scout",
    shortTitle: "Skills",
    tag: "GitHub / Skill 评估安装",
    description: "搜索和评估可能有用的 Codex skills，安装前列出用途、来源、风险和本地路径。",
    skills: ["skill-installer", "browser", "anysearch"],
    workflow: "automation-workbench/skills/skill-scout.md",
    prompt: "搜索并评估可能有用的 Codex skills，列出用途、来源、维护状态和风险；安装前必须等待用户针对具体候选确认。"
  }
];

window.WORKBENCH_SOURCES = [
  { id: "feishu", name: "飞书", group: "社交/办公", url: "https://www.feishu.cn/messenger/", defaultModules: ["inbox", "delivery"], note: "工作消息、群聊、文档协作和客户沟通。" },
  { id: "wechat_web", name: "微信网页版/文件传输", group: "社交/办公", url: "https://wx.qq.com/", defaultModules: ["inbox"], note: "微信消息需要用户在页面或桌面端亲自登录和确认。" },
  { id: "email_163", name: "网易邮箱 163", group: "邮件", url: "https://mail.163.com/", defaultModules: ["inbox", "delivery"], note: "邮件读取、草稿和发送前确认；收件邮箱 jacky060911@163.com。" },
  { id: "gmail", name: "Gmail", group: "邮件", url: "https://mail.google.com/", defaultModules: ["inbox", "delivery"], note: "海外邮件来源和商务邮件草稿。" },
  { id: "kalodata", name: "Kalodata", group: "跨境电商", url: "https://www.kalodata.com/", defaultModules: ["work", "analytics"], note: "TikTok Shop 商品、达人、视频、直播和店铺分析。" },
  { id: "fastmoss", name: "FastMoss", group: "跨境电商", url: "https://www.fastmoss.com/", defaultModules: ["work", "analytics"], note: "TikTok 电商选品、竞品、达人、广告和直播数据。" },
  { id: "dami_tikclubs", name: "达秘 / TikClubs", group: "跨境电商", url: "https://www.tikclubs.com/workbench/function_introduction", defaultModules: ["work", "analytics"], note: "TikTok 网红达人自动营销、达人搜索、触达线索和 BD 跟进候选池。" },
  { id: "tiktok", name: "TikTok", group: "创作者平台", url: "https://www.tiktok.com/", defaultModules: ["news", "work", "creator", "analytics"], note: "美区内容趋势、达人表现、私信、作品数据和带货素材。" },
  { id: "youtube", name: "YouTube", group: "创作者平台", url: "https://www.youtube.com/", defaultModules: ["news", "creator", "analytics"], note: "视频趋势、创作者生态、作品数据和平台功能。" },
  { id: "instagram", name: "Instagram", group: "创作者平台", url: "https://www.instagram.com/", defaultModules: ["news", "work", "creator", "analytics"], note: "Reels、私信、达人内容和品牌合作。" },
  { id: "douyin", name: "抖音", group: "创作者平台", url: "https://www.douyin.com/", defaultModules: ["news", "creator", "analytics"], note: "国内短视频趋势、账号作品和电商玩法。" },
  { id: "wechat_channels", name: "微信视频号", group: "创作者平台", url: "https://channels.weixin.qq.com/", defaultModules: ["news", "creator", "analytics"], note: "视频号内容、直播、私域联动和作品数据。" },
  { id: "xiaohongshu", name: "小红书", group: "创作者平台", url: "https://www.xiaohongshu.com/", defaultModules: ["news", "work", "creator", "analytics"], note: "种草内容、搜索趋势、达人合作和账号数据。" },
  { id: "sec", name: "SEC", group: "金融", url: "https://www.sec.gov/edgar/search/", defaultModules: ["trading", "news"], note: "美股公告、财报和监管文件。" },
  { id: "hkexnews", name: "HKEXnews", group: "金融", url: "https://www.hkexnews.hk/", defaultModules: ["trading", "news"], note: "港股公告、财报和公司披露。" },
  { id: "github", name: "GitHub", group: "技能", url: "https://github.com/", defaultModules: ["skills"], note: "搜索 Codex skills、插件和自动化脚本。" },
  { id: "google_scholar", name: "Google Scholar", group: "学术", url: "https://scholar.google.com/", defaultModules: ["news"], note: "市场、AI、营销、消费者行为等学术信息。" }
];

window.WORKBENCH_SKILLS = [
  { id: "browser", name: "browser", defaultModules: ["work", "creator", "skills", "inbox", "delivery", "analytics"] },
  { id: "chrome", name: "chrome", defaultModules: ["work", "creator", "inbox", "delivery", "analytics"] },
  { id: "computer-use", name: "computer-use", defaultModules: ["creator", "inbox", "delivery"] },
  { id: "playwright", name: "playwright", defaultModules: ["work", "inbox", "analytics", "creator"] },
  { id: "playwright-interactive", name: "playwright-interactive", defaultModules: ["work", "creator", "skills"] },
  { id: "anysearch", name: "anysearch", defaultModules: ["news", "trading", "work", "skills", "creator", "growth", "health"] },
  { id: "openai-docs", name: "openai-docs", defaultModules: ["skills"] },
  { id: "documents", name: "documents", defaultModules: ["office", "inbox", "delivery", "analytics", "growth", "health", "profile"] },
  { id: "docx-win", name: "docx-win", defaultModules: ["office"] },
  { id: "presentations", name: "presentations", defaultModules: ["office", "delivery"] },
  { id: "pptx-win", name: "pptx-win", defaultModules: ["office"] },
  { id: "spreadsheets", name: "spreadsheets", defaultModules: ["office", "work", "delivery", "analytics", "creator", "growth", "health", "profile"] },
  { id: "xlsx-win", name: "xlsx-win", defaultModules: ["office", "analytics"] },
  { id: "template-creator", name: "template-creator", defaultModules: ["office"] },
  { id: "office-pdf", name: "office-pdf", defaultModules: ["office", "delivery", "news"] },
  { id: "office-motion", name: "office-motion", defaultModules: ["creator", "office"] },
  { id: "imagegen", name: "imagegen", defaultModules: ["creator", "office"] },
  { id: "email-draft-polish", name: "email-draft-polish", defaultModules: ["inbox", "delivery"] },
  { id: "connect", name: "connect", defaultModules: [] },
  { id: "serenity-alpha", name: "serenity-alpha", defaultModules: ["trading", "news"] },
  { id: "skill-installer", name: "skill-installer", defaultModules: ["skills"] },
  { id: "skill-creator", name: "skill-creator", defaultModules: ["skills"] },
  { id: "plugin-creator", name: "plugin-creator", defaultModules: ["skills"] },
  { id: "pdf", name: "pdf", defaultModules: ["office", "news", "delivery"] }
];

window.WORKBENCH_DELIVERY = [
  { id: "outputs", name: "保存到 outputs/", defaultModules: ["office", "news", "trading", "work", "delivery", "analytics", "creator", "growth", "health", "profile"] },
  { id: "email_draft", name: "生成邮件草稿", defaultModules: ["delivery", "news", "inbox"] },
  { id: "email_send_confirm", name: "邮件发送前确认", defaultModules: ["delivery", "news"] },
  { id: "social_draft", name: "生成社交回复草稿", defaultModules: ["inbox", "work"] },
  { id: "social_send_confirm", name: "社交外发前确认", defaultModules: ["inbox", "work"] },
  { id: "daily_report", name: "生成日报/复盘", defaultModules: ["news", "analytics", "creator"] }
];

window.ASSISTANT_ROUTING = {
  office: ["word", "docx", "ppt", "powerpoint", "excel", "xlsx", "csv", "报表", "文档", "幻灯片", "会议纪要", "表格"],
  news: ["新闻", "资讯", "热点", "时政", "社会", "平台玩法", "算法", "知识库", "简报", "实时", "学术", "论文", "早报", "日报"],
  trading: ["股票", "美股", "港股", "基金", "交易", "短线", "超短线", "涨跌", "财报", "评级", "渣打", "风控", "信号"],
  work: ["询盘", "kalodata", "fastmoss", "达秘", "tikclubs", "跨境", "选品", "达人", "kol", "koc", "ugc", "竞品", "直播", "tiktok shop", "bd", "成交"],
  inbox: ["飞书", "微信", "私信", "消息", "回复", "话术", "邮件", "邮箱", "客户", "社交", "未读"],
  delivery: ["发送", "邮件", "交付", "附件", "发给", "收件人", "草稿", "外发", "汇报给"],
  analytics: ["数据", "复盘", "成功率", "转化", "变现", "流量", "完播", "互动", "账号数据", "作品数据", "成交概率"],
  creator: ["剪映", "剪辑", "视频", "字幕", "转场", "bgm", "素材", "短视频", "镜头", "自媒体", "个人ip", "人设", "选题", "脚本"],
  growth: ["成长", "心理学", "逻辑", "认知", "财商", "经济学", "金融学", "社交", "公关", "书单", "学习"],
  health: ["健康", "训练", "饮食", "作息", "睡眠", "身材", "减脂", "增肌", "体态", "长高"],
  profile: ["个人画像", "偏好", "目标", "了解我", "第二大脑", "长期记忆", "个人助手"],
  skills: ["skill", "skills", "插件", "github", "安装", "自动进化", "自我进化", "扩展能力", "下载", "自主执行", "真正自动化", "关机后运行"]
};

window.WORKBENCH_PROMPTS = {
  queueCommand: "请打开我们制作的自动化工作台，处理里面的执行队列；优先执行最新任务，按任务要求使用对应 skill、平台、交付方式和 workflow，最终把结果保存到 outputs/ 并用中文说明。",
  inbox: `请启动信息助手。
目标：整理飞书、微信、邮箱和社交平台中用户指定范围内的可见消息。
要求：
1. 如需登录或验证码，停下让用户在浏览器里亲自完成。
2. 只读取用户授权页面中可见的信息，不读取密码，不绕过权限。
3. 按紧急度、业务价值、是否需要回复、是否需要跟进分组。
4. 为每条需要回复的信息生成中文或英文草稿，并说明语气、目的和风险。
5. 不要直接发送消息；发送前必须等待用户确认。`,
  analytics: `请启动账号数据复盘。
目标：读取用户授权页面或 inputs/ 中的数据，分析达人沟通、作品流量、变现和转化。
要求：
1. 输出关键指标：回复率、成功率、成交概率、流量、完播、互动、转化、变现。
2. 分析哪些话术、内容、剪辑节奏、标题、封面或选题表现更好。
3. 给出明天可执行的优化建议和 A/B 测试假设。
4. 如涉及 Office 文件，保存 Excel 或 Word 到 outputs/。
5. 无法读取后台时，列出需要用户导出的数据字段。`,
  creator: `请启动自媒体/IP 助手。
目标：围绕个人 IP 和自媒体增长，优化选题、脚本、剪辑、发布、复盘和商业转化。
要求：
1. 结合已有作品数据、平台热点和账号定位。
2. 输出选题库、脚本、剪辑建议、标题封面建议和发布时间建议。
3. 给出变现路径：带货、私域、合作报价、服务产品或内容漏斗。
4. 如需剪映，使用已配置本机路径打开，但具体发布和外发需要用户确认。`,
  dailyBrief: `请生成每日 8 点信息简报并准备邮件交付。
收件邮箱：jacky060911@163.com
要求：
1. 自动联网搜集并整理金融、跨境电商、内容平台、自媒体/IP、AI、社会热点和学术信息。
2. 同时覆盖中国大陆和海外信息源。
3. 无论来源是中文还是英文，解读都必须用通俗易懂的中文。
4. 每条重要信息必须带真实可查询的网址来源，不编造数据。
5. 输出一份中文简报、一份结构化报表，并保存到 outputs/。
6. 邮件正文先生成草稿；真正发送前需要用户确认或配置安全邮件发送方式。`,
  knowledgeUpdate: `请更新 automation-workbench/knowledge/ 下的实时知识库。
要求：
1. 使用 AnySearch 或网页搜索查询最新市场、业务、创作者平台和学术信息。
2. 每条信息记录日期、主题、摘要、对我的影响、下一步动作和来源链接。
3. 覆盖中国大陆与海外信息源，英文资料转成通俗中文解读。
4. 不要编造来源；无法验证的信息标注为待核实。`,
  secondBrainAutonomy: `请启动第二大脑 v4 自主运行工作流。
参考：automation-workbench/workflows/second-brain-autonomy-workflow.md
目标：区分本地工作台、Codex 自动化和云端常久在线层，判断当前需求哪些可以自主执行，哪些必须等待确认。
要求：
1. 可自主执行公开资讯收集、知识库更新、信息简报、业务反馈、邮件草稿和自我迭代候选清单。
2. 邮件发送、社交消息发送、上传、提交、发布、安装、真实交易、支付或下单必须等待用户当次确认。
3. 电脑关机后仍需运行的任务，必须放到 Codex 自动化、远程工作区、VPS、NAS 或云函数，不要承诺本地工作台能在关机后继续运行。
4. 结果尽量写入 outputs/ 和 automation-workbench/data/，并保留来源链接、时间戳和下一步动作。`,
  skillScout: `请启动 Skill Scout。
目标：搜索 GitHub 或官方技能仓库，找出可能提升 Office、搜索、跨境电商、金融资讯、社交交付、邮件、剪辑和自媒体自动化能力的 Codex skills 或插件。
要求：
1. 先列候选，不要直接安装。
2. 对每个候选说明来源链接、用途、维护状态、风险、是否需要网络或账号。
3. 优先可信来源；陌生仓库先读 README 和文件结构。
4. 如建议安装，给出明确安装命令和将新增的本地路径。
5. 即使用户开放权限，也必须针对具体候选等待确认后再安装。`
};
