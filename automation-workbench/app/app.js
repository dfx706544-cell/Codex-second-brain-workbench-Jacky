const STORAGE_KEY = "automationWorkbench.taskQueue.v3";

const assistantSelect = document.querySelector("#assistantSelect");
const clearQueueButton = document.querySelector("#clearQueueButton");
const copyAllTasksButton = document.querySelector("#copyAllTasksButton");
const copyAnalyticsPromptButton = document.querySelector("#copyAnalyticsPromptButton");
const copyBriefPromptButton = document.querySelector("#copyBriefPromptButton");
const copyCreatorPromptButton = document.querySelector("#copyCreatorPromptButton");
const copyInboxPromptButton = document.querySelector("#copyInboxPromptButton");
const copyKnowledgePromptButton = document.querySelector("#copyKnowledgePromptButton");
const copyLatestTaskButton = document.querySelector("#copyLatestTaskButton");
const copyQueueCommandButton = document.querySelector("#copyQueueCommandButton");
const deliveryGrid = document.querySelector("#deliveryGrid");
const bridgeStatus = document.querySelector("#bridgeStatus");
const dailyDeliveryBoard = document.querySelector("#dailyDeliveryBoard");
const historyFilter = document.querySelector("#historyFilter");
const historyList = document.querySelector("#historyList");
const knowledgeFilter = document.querySelector("#knowledgeFilter");
const knowledgeList = document.querySelector("#knowledgeList");
const moduleGrid = document.querySelector("#moduleGrid");
const openWorkspaceButton = document.querySelector("#openWorkspaceButton");
const outputSelect = document.querySelector("#outputSelect");
const profileBoard = document.querySelector("#profileBoard");
const previewTaskButton = document.querySelector("#previewTaskButton");
const queueList = document.querySelector("#queueList");
const queueMeta = document.querySelector("#queueMeta");
const sampleButton = document.querySelector("#sampleButton");
const skillGrid = document.querySelector("#skillGrid");
const sourceGrid = document.querySelector("#sourceGrid");
const taskForm = document.querySelector("#taskForm");
const taskPreview = document.querySelector("#taskPreview");
const toast = document.querySelector("#toast");
const tabs = Array.from(document.querySelectorAll(".tab"));
const userInput = document.querySelector("#userInput");
const views = Array.from(document.querySelectorAll(".view"));

let queue = loadLocalQueue();
let latestTaskText = "";
let bridgeConnected = false;
let bridgeBaseUrl = "";
const dataHub = {
  knowledge: [],
  history: [],
  dailyBriefs: [],
  businessFeedback: [],
  profile: {}
};

function loadLocalQueue() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveLocalQueue() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
}

function bridgeCandidates() {
  const candidates = [];
  if (window.location.protocol === "http:" || window.location.protocol === "https:") {
    candidates.push(window.location.origin);
  }
  candidates.push("http://127.0.0.1:8787", "http://127.0.0.1:8788", "http://127.0.0.1:8789");
  return Array.from(new Set(candidates));
}

function setBridgeStatus(state, text) {
  if (!bridgeStatus) return;
  bridgeStatus.dataset.state = state;
  bridgeStatus.textContent = text;
}

async function fetchSharedQueue() {
  const response = await fetch(`${bridgeBaseUrl}/api/queue`, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Queue read failed: ${response.status}`);
  }
  const tasks = await response.json();
  return Array.isArray(tasks) ? tasks : [];
}

async function saveSharedQueue() {
  if (!bridgeConnected) return false;
  const response = await fetch(`${bridgeBaseUrl}/api/queue`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(queue)
  });
  if (!response.ok) {
    throw new Error(`Queue write failed: ${response.status}`);
  }
  return true;
}

async function saveQueue() {
  saveLocalQueue();
  if (!bridgeConnected) return false;

  try {
    await saveSharedQueue();
    return true;
  } catch {
    bridgeConnected = false;
    setBridgeStatus("local", "共享队列暂时不可用：当前任务已保存在本浏览器，建议重新用 open-workbench.ps1 打开工作台。");
    return false;
  }
}

function mergeQueues(sharedQueue, localQueue) {
  const byId = new Map();
  [...localQueue, ...sharedQueue].forEach((task) => {
    if (task?.id) byId.set(task.id, task);
  });
  return Array.from(byId.values()).sort((a, b) => {
    const left = Date.parse(a.createdAt || "") || 0;
    const right = Date.parse(b.createdAt || "") || 0;
    return right - left;
  });
}

async function findBridge() {
  for (const candidate of bridgeCandidates()) {
    try {
      const response = await fetch(`${candidate}/api/health`, { cache: "no-store" });
      if (response.ok) return candidate;
    } catch {
      // Try the next local bridge candidate.
    }
  }
  return "";
}

async function fetchDataStore(name, fallback) {
  if (!bridgeBaseUrl) return fallback;
  try {
    const response = await fetch(`${bridgeBaseUrl}/api/data/${name}`, { cache: "no-store" });
    if (!response.ok) return fallback;
    return await response.json();
  } catch {
    return fallback;
  }
}

function setActiveView(viewId) {
  tabs.forEach((tab) => {
    tab.classList.toggle("active", tab.dataset.view === viewId);
  });
  views.forEach((view) => {
    view.classList.toggle("active", view.id === viewId);
  });
}

function optionList(values) {
  return ["all", ...Array.from(new Set(values.filter(Boolean)))];
}

function renderKnowledge() {
  if (!knowledgeList || !knowledgeFilter) return;
  const currentValue = knowledgeFilter.value || "all";
  const domains = optionList(dataHub.knowledge.map((item) => item.domain));
  knowledgeFilter.innerHTML = domains
    .map((domain) => `<option value="${domain}">${domain === "all" ? "全部主题" : domain}</option>`)
    .join("");
  knowledgeFilter.value = domains.includes(currentValue) ? currentValue : "all";
  const selected = knowledgeFilter.value || "all";
  const items = selected === "all" ? dataHub.knowledge : dataHub.knowledge.filter((item) => item.domain === selected);

  knowledgeList.innerHTML = items.length ? items.map((item) => `
    <article class="library-card">
      <h3>${item.title || "未命名资料"}</h3>
      <p>${item.summaryZh || "暂无摘要"}</p>
      <div class="meta-line">收录：${item.createdAt || "-"} · 发行：${item.publishedAt || "-"} · 可信度：${item.credibility || "-"}</div>
      <div class="meta-line">主题：${item.domain || "-"} · 标签：${(item.tags || []).join("、") || "-"}</div>
      <div class="meta-line">影响：${item.impact || "-"}</div>
      <div class="meta-line">下一步：${item.nextAction || "-"}</div>
      ${item.sourceUrl ? `<a class="source-link" href="${item.sourceUrl}" target="_blank" rel="noopener">查看来源</a>` : ""}
    </article>
  `).join("") : `<div class="empty-state">暂无知识条目。</div>`;
}

function renderHistory() {
  if (!historyList || !historyFilter) return;
  const currentValue = historyFilter.value || "all";
  const categories = optionList(dataHub.history.map((item) => item.category));
  historyFilter.innerHTML = categories
    .map((category) => `<option value="${category}">${category === "all" ? "全部分类" : category}</option>`)
    .join("");
  historyFilter.value = categories.includes(currentValue) ? currentValue : "all";
  const selected = historyFilter.value || "all";
  const items = selected === "all" ? dataHub.history : dataHub.history.filter((item) => item.category === selected);

  historyList.innerHTML = items.length ? items.map((item) => `
    <article class="history-card">
      <h3>${item.userText || "未命名任务"}</h3>
      <p>${item.summary || "暂无总结"}</p>
      <div class="meta-line">分类：${item.category || "-"} · 助手：${item.primaryAssistant || "-"} · 状态：${item.status || "-"}</div>
      <div class="meta-line">创建：${item.createdAt || "-"} · 完成：${item.completedAt || "-"}</div>
      <div class="meta-line">输出：${(item.outputs || []).join("；") || "-"}</div>
      <div class="meta-line">下一步：${item.nextAction || "-"}</div>
    </article>
  `).join("") : `<div class="empty-state">暂无历史记录。</div>`;
}

function renderDailyDelivery() {
  if (!dailyDeliveryBoard) return;
  dailyDeliveryBoard.innerHTML = `
    <article class="delivery-card">
      <h3>信息简报</h3>
      <p>已归档 ${dataHub.dailyBriefs.length} 条。覆盖金融、宏观、AI、平台、学术、社会热点和创作者经济。</p>
      <div class="meta-line">默认交付：中文解读、真实来源链接、结构化报表、邮件草稿。</div>
    </article>
    <article class="delivery-card">
      <h3>业务反馈</h3>
      <p>已归档 ${dataHub.businessFeedback.length} 条。覆盖账号复盘、达人沟通、内容表现、跨境机会和明日动作。</p>
      <div class="meta-line">默认交付：业务建议、跟进清单、数据报表、邮件草稿。</div>
    </article>
  `;
}

function renderProfile() {
  if (!profileBoard) return;
  const profileSections = [
    ["goals", "长期目标"],
    ["preferences", "偏好"],
    ["constraints", "约束"],
    ["workingStyle", "工作方式"]
  ];
  profileBoard.innerHTML = profileSections.map(([key, label]) => `
    <article class="profile-card">
      <h3>${label}</h3>
      <p>${(dataHub.profile[key] || []).join("；") || "暂无记录"}</p>
    </article>
  `).join("");
}

async function loadDataHub() {
  dataHub.knowledge = await fetchDataStore("knowledge-items", []);
  dataHub.history = await fetchDataStore("task-history", []);
  dataHub.dailyBriefs = await fetchDataStore("daily-briefs", []);
  dataHub.businessFeedback = await fetchDataStore("business-feedback", []);
  dataHub.profile = await fetchDataStore("personal-profile", {});
  renderKnowledge();
  renderHistory();
  renderDailyDelivery();
  renderProfile();
}

async function initSharedQueue() {
  try {
    bridgeBaseUrl = await findBridge();
    if (!bridgeBaseUrl) {
      setBridgeStatus("local", "本地备份模式：未连接到共享队列服务。请使用 open-workbench.ps1 打开工作台。");
      return;
    }

    const sharedQueue = await fetchSharedQueue();
    const localQueue = loadLocalQueue();
    bridgeConnected = true;
    queue = mergeQueues(sharedQueue, localQueue);

    if (queue.length !== sharedQueue.length || localQueue.length) {
      await saveSharedQueue();
    }

    saveLocalQueue();
    setBridgeStatus("connected", "共享队列已连接：加入队列后会写入 automation-workbench/queue/tasks.json，Codex 可直接读取。");
    renderQueue();
    await loadDataHub();
  } catch {
    bridgeConnected = false;
    setBridgeStatus("local", "本地备份模式：未连接到共享队列服务。请使用 open-workbench.ps1 打开工作台。");
  }
}

function showToast(text) {
  toast.textContent = text;
  toast.classList.add("visible");
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => {
    toast.classList.remove("visible");
  }, 1800);
}

async function copyText(text, label = "已复制") {
  if (!text) return;
  if (navigator.clipboard) {
    await navigator.clipboard.writeText(text);
  } else {
    const area = document.createElement("textarea");
    area.value = text;
    document.body.appendChild(area);
    area.select();
    document.execCommand("copy");
    area.remove();
  }
  showToast(label);
}

function getModule(id) {
  return window.WORKBENCH_MODULES.find((item) => item.id === id);
}

function getCheckedValues(containerSelector) {
  return Array.from(document.querySelectorAll(`${containerSelector} input:checked`)).map((input) => input.value);
}

function scoreAssistant(text, moduleId) {
  const lowered = text.toLowerCase();
  const words = window.ASSISTANT_ROUTING[moduleId] || [];
  return words.reduce((score, word) => lowered.includes(word.toLowerCase()) ? score + 1 : score, 0);
}

function routeAssistant(text) {
  const chosen = assistantSelect.value;
  if (chosen !== "auto") return chosen;

  const scores = window.WORKBENCH_MODULES
    .filter((module) => module.id !== "auto")
    .map((module) => ({ id: module.id, score: scoreAssistant(text, module.id) }))
    .sort((a, b) => b.score - a.score);

  return scores[0]?.score ? scores[0].id : "news";
}

function detectSecondaryModules(text, primaryId) {
  return window.WORKBENCH_MODULES
    .filter((module) => !["auto", primaryId].includes(module.id))
    .filter((module) => scoreAssistant(text, module.id) > 0)
    .map((module) => module.id);
}

function getDefaultsForModule(moduleId, list) {
  return list
    .filter((item) => item.defaultModules.includes(moduleId))
    .map((item) => item.id);
}

function syncDefaultsForAssistant() {
  const selected = assistantSelect.value;
  if (selected === "auto") return;

  const sourceDefaults = getDefaultsForModule(selected, window.WORKBENCH_SOURCES);
  const skillDefaults = getDefaultsForModule(selected, window.WORKBENCH_SKILLS);
  const deliveryDefaults = getDefaultsForModule(selected, window.WORKBENCH_DELIVERY);

  document.querySelectorAll("#sourceGrid input").forEach((input) => {
    input.checked = sourceDefaults.includes(input.value);
  });
  document.querySelectorAll("#skillGrid input").forEach((input) => {
    input.checked = skillDefaults.includes(input.value);
  });
  document.querySelectorAll("#deliveryGrid input").forEach((input) => {
    input.checked = deliveryDefaults.includes(input.value);
  });
}

function selectedSourceObjects(ids) {
  return ids.map((id) => window.WORKBENCH_SOURCES.find((source) => source.id === id)).filter(Boolean);
}

function selectedSkillNames(ids) {
  return ids.map((id) => window.WORKBENCH_SKILLS.find((skill) => skill.id === id)?.name || id);
}

function selectedDeliveryNames(ids) {
  return ids.map((id) => window.WORKBENCH_DELIVERY.find((item) => item.id === id)?.name || id);
}

function buildTaskObject() {
  const userText = userInput.value.trim();
  if (!userText) return null;

  const primaryId = routeAssistant(userText);
  const primary = getModule(primaryId);
  const secondaryIds = detectSecondaryModules(userText, primaryId);
  const secondaries = secondaryIds.map(getModule).filter(Boolean);
  const sourceIds = getCheckedValues("#sourceGrid");
  const skillIds = getCheckedValues("#skillGrid");
  const deliveryIds = getCheckedValues("#deliveryGrid");
  const sources = selectedSourceObjects(sourceIds);
  const skills = Array.from(new Set([
    ...selectedSkillNames(skillIds),
    ...(primary.skills || []),
    ...secondaries.flatMap((module) => module.skills || [])
  ]));
  const deliveries = Array.from(new Set(selectedDeliveryNames(deliveryIds)));
  const workflows = Array.from(new Set([
    primary.workflow,
    ...secondaries.map((module) => module.workflow)
  ].filter(Boolean)));

  return {
    id: `task-${Date.now()}`,
    createdAt: new Date().toISOString(),
    userText,
    primary,
    secondaries,
    sources,
    skills,
    deliveries,
    workflows,
    output: outputSelect.value
  };
}

function formatTask(task) {
  const secondaryText = task.secondaries.length
    ? task.secondaries.map((module) => `- ${module.title}`).join("\n")
    : "- 暂无";
  const sourceText = task.sources.length
    ? task.sources.map((source) => `- ${source.name}: ${source.url}\n  用途：${source.note}`).join("\n")
    : "- 未指定，按任务需要自行判断";
  const workflowText = task.workflows.length
    ? task.workflows.map((workflow) => `- ${workflow}`).join("\n")
    : "- 按当前项目已有工作流判断";
  const skillText = task.skills.length
    ? task.skills.map((skill) => `- ${skill}`).join("\n")
    : "- 按任务需要自行判断";
  const deliveryText = task.deliveries.length
    ? task.deliveries.map((delivery) => `- ${delivery}`).join("\n")
    : "- 保存到 outputs/，必要时生成草稿";

  return `使用自动化工作台执行以下需求。

用户原始需求：
${task.userText}

主助手：
${task.primary.title}

协同助手：
${secondaryText}

指定平台、网站或信息源：
${sourceText}

期望输出：
${task.output}

交付方式：
${deliveryText}

应使用的能力或 skill：
${skillText}

参考工作流：
${workflowText}

执行要求：
1. 先理解需求并判断是否需要读取 inputs/、templates/、automation-workbench/config/、automation-workbench/workflows/ 或 workflows/。
2. 如果涉及实时信息，优先使用 AnySearch 或可用网页搜索，覆盖中国大陆和海外来源，并保留真实可查询的网址。
3. 不管来源是中文还是英文，最终解读必须使用通俗易懂的中文。
4. 如果涉及 Office 文件，生成或编辑 Word、PPT、Excel，并把最终文件保存到 outputs/。
5. 如果涉及飞书、微信、邮箱、社交私信或客户沟通，只能先读取用户授权页面中的可见内容并生成回复草稿；真正发送、提交、上传或外发前必须等待用户确认。
6. 如果涉及账号作品数据、达人沟通数据或转化数据，只读取用户已登录且授权可见的页面，或读取 inputs/ 中用户导出的文件；无法读取时列出需要用户导出的字段。
7. 如果涉及金融交易，只做资讯、信号提醒、纸面交易、风险清单和人工确认前检查，不执行真实下单。
8. 如果涉及 Skill 安装，先评估候选和风险；即使用户开放权限，也必须针对具体候选等待确认后再安装。
9. 最后用简洁中文说明完成了什么、文件在哪里、来源链接有哪些、哪些草稿等待发送确认、还有哪些需要用户补充。

建议任务拆解：
1. ${task.primary.title}：${task.primary.prompt}
${task.secondaries.map((module, index) => `${index + 2}. ${module.title}：${module.prompt}`).join("\n") || "2. 如需要，调用相关协同助手补充执行。"}`;
}

function renderAssistants() {
  assistantSelect.innerHTML = window.WORKBENCH_MODULES
    .map((module) => `<option value="${module.id}">${module.title}</option>`)
    .join("");
}

function renderSources() {
  sourceGrid.innerHTML = window.WORKBENCH_SOURCES
    .map((source) => `
      <label class="check-card" title="${source.note}">
        <input type="checkbox" value="${source.id}">
        <span>
          <strong>${source.name}</strong>
          <small>${source.group}</small>
        </span>
      </label>
    `)
    .join("");
}

function renderSkills() {
  skillGrid.innerHTML = window.WORKBENCH_SKILLS
    .map((skill) => `
      <label class="chip">
        <input type="checkbox" value="${skill.id}">
        <span>${skill.name}</span>
      </label>
    `)
    .join("");
}

function renderDeliveries() {
  deliveryGrid.innerHTML = window.WORKBENCH_DELIVERY
    .map((delivery) => `
      <label class="chip">
        <input type="checkbox" value="${delivery.id}">
        <span>${delivery.name}</span>
      </label>
    `)
    .join("");
}

function renderModules() {
  moduleGrid.innerHTML = window.WORKBENCH_MODULES
    .filter((module) => module.id !== "auto")
    .map((module) => `
      <article class="module-card">
        <div class="module-mark">${module.shortTitle}</div>
        <h3>${module.title}</h3>
        <p class="tag">${module.tag}</p>
        <p>${module.description}</p>
        <div class="module-actions">
          <button class="small" data-module-prompt="${module.id}" type="button">复制启动任务</button>
          <button class="small ghost" data-module-select="${module.id}" type="button">选择此助手</button>
        </div>
      </article>
    `)
    .join("");
}

function renderQueue() {
  queueMeta.textContent = queue.length ? `${queue.length} 个任务待处理，最新任务在最上方。` : "暂无任务。";
  queueList.innerHTML = "";

  if (!queue.length) {
    queueList.innerHTML = `<div class="empty-state">把需求加入队列后，你可以在 Codex 聊天里说“处理工作台任务队列”。</div>`;
    return;
  }

  for (const task of queue) {
    const item = document.createElement("article");
    item.className = "queue-item";
    item.innerHTML = `
      <div>
        <strong>${task.primary.title}</strong>
        <time>${new Date(task.createdAt).toLocaleString("zh-CN")}</time>
      </div>
      <p></p>
      <div class="queue-item-actions">
        <button class="small" data-copy-task="${task.id}" type="button">复制</button>
        <button class="small ghost" data-preview-task="${task.id}" type="button">预览</button>
        <button class="small danger" data-delete-task="${task.id}" type="button">删除</button>
      </div>
    `;
    item.querySelector("p").textContent = task.userText;
    queueList.appendChild(item);
  }
}

function previewCurrentTask() {
  const task = buildTaskObject();
  if (!task) {
    showToast("请先输入需求");
    return null;
  }
  latestTaskText = formatTask(task);
  taskPreview.textContent = latestTaskText;
  return task;
}

async function addTaskToQueue() {
  const task = previewCurrentTask();
  if (!task) return;
  queue.unshift(task);
  await saveQueue();
  renderQueue();
  showToast(bridgeConnected ? "已加入共享执行队列" : "已加入本地队列");
}

function allTasksText() {
  if (!queue.length) return "";
  return [
    window.WORKBENCH_PROMPTS.queueCommand,
    "",
    "当前队列任务：",
    ...queue.map((task, index) => `\n---\n任务 ${index + 1}\n${formatTask(task)}`)
  ].join("\n");
}

taskForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  await addTaskToQueue();
});

previewTaskButton.addEventListener("click", previewCurrentTask);
assistantSelect.addEventListener("change", syncDefaultsForAssistant);
tabs.forEach((tab) => {
  tab.addEventListener("click", () => setActiveView(tab.dataset.view));
});
knowledgeFilter?.addEventListener("change", renderKnowledge);
historyFilter?.addEventListener("change", renderHistory);

sampleButton.addEventListener("click", () => {
  userInput.value = "打开飞书、微信和 163 邮箱，帮我整理今天未回复的信息，先生成回复草稿；再读取我提供的达人沟通记录和作品数据，分析沟通成功率、流量、转化，并输出明天的自媒体/IP 和电商 BD 优化建议。";
  assistantSelect.value = "inbox";
  outputSelect.value = "dashboard";
  syncDefaultsForAssistant();
  userInput.focus();
});

copyLatestTaskButton.addEventListener("click", async () => {
  const text = queue.length ? formatTask(queue[0]) : latestTaskText;
  await copyText(text, "已复制最新任务");
});

copyAllTasksButton.addEventListener("click", async () => {
  await copyText(allTasksText(), "已复制全部任务");
});

copyQueueCommandButton.addEventListener("click", async () => {
  await copyText(window.WORKBENCH_PROMPTS.queueCommand, "已复制队列执行口令");
});

copyInboxPromptButton.addEventListener("click", async () => {
  await copyText(window.WORKBENCH_PROMPTS.inbox, "已复制信息助手任务");
});

copyAnalyticsPromptButton.addEventListener("click", async () => {
  await copyText(window.WORKBENCH_PROMPTS.analytics, "已复制复盘任务");
});

copyCreatorPromptButton.addEventListener("click", async () => {
  await copyText(window.WORKBENCH_PROMPTS.creator, "已复制自媒体/IP 任务");
});

copyBriefPromptButton.addEventListener("click", async () => {
  await copyText(window.WORKBENCH_PROMPTS.dailyBrief, "已复制 8 点简报任务");
});

copyKnowledgePromptButton.addEventListener("click", async () => {
  await copyText(window.WORKBENCH_PROMPTS.knowledgeUpdate, "已复制知识库更新任务");
});

clearQueueButton.addEventListener("click", async () => {
  queue = [];
  await saveQueue();
  renderQueue();
  showToast("队列已清空");
});

queueList.addEventListener("click", async (event) => {
  const copyId = event.target.getAttribute("data-copy-task");
  const previewId = event.target.getAttribute("data-preview-task");
  const deleteId = event.target.getAttribute("data-delete-task");

  if (copyId) {
    const task = queue.find((item) => item.id === copyId);
    await copyText(task ? formatTask(task) : "", "已复制任务");
  }

  if (previewId) {
    const task = queue.find((item) => item.id === previewId);
    if (task) {
      latestTaskText = formatTask(task);
      taskPreview.textContent = latestTaskText;
      showToast("已预览任务");
    }
  }

  if (deleteId) {
    queue = queue.filter((item) => item.id !== deleteId);
    await saveQueue();
    renderQueue();
    showToast("任务已删除");
  }
});

moduleGrid.addEventListener("click", async (event) => {
  const promptId = event.target.getAttribute("data-module-prompt");
  const selectId = event.target.getAttribute("data-module-select");

  if (promptId) {
    const module = getModule(promptId);
    await copyText(module?.prompt || "", "已复制启动任务");
  }

  if (selectId) {
    assistantSelect.value = selectId;
    syncDefaultsForAssistant();
    userInput.focus();
    showToast("已选择助手");
  }
});

openWorkspaceButton.addEventListener("click", () => {
  window.open("../", "_blank", "noopener");
});

renderAssistants();
renderSources();
renderSkills();
renderDeliveries();
renderModules();
renderQueue();
assistantSelect.value = "auto";
taskPreview.textContent = "还没有生成任务。你可以先写需求并点击“预览任务”。";
initSharedQueue();
