const STORAGE_KEY = "automationWorkbench.taskQueue.v3";
const PERSONALIZATION_KEY = "automationWorkbench.personalization.v1";

const assistantSelect = document.querySelector("#assistantSelect");
const clearQueueButton = document.querySelector("#clearQueueButton");
const copyAllTasksButton = document.querySelector("#copyAllTasksButton");
const copyAnalyticsPromptButton = document.querySelector("#copyAnalyticsPromptButton");
const copyBriefPromptButton = document.querySelector("#copyBriefPromptButton");
const copyCreatorPromptButton = document.querySelector("#copyCreatorPromptButton");
const copyInboxPromptButton = document.querySelector("#copyInboxPromptButton");
const copyKnowledgePromptButton = document.querySelector("#copyKnowledgePromptButton");
const copyLatestTaskButton = document.querySelector("#copyLatestTaskButton");
const copyCloudWorkbenchButton = document.querySelector("#copyCloudWorkbenchButton");
const copyPersonalWorkbenchPromptButton = document.querySelector("#copyPersonalWorkbenchPromptButton");
const copyQueueCommandButton = document.querySelector("#copyQueueCommandButton");
const deliveryGrid = document.querySelector("#deliveryGrid");
const downloadPersonalConfigButton = document.querySelector("#downloadPersonalConfigButton");
const bridgeStatus = document.querySelector("#bridgeStatus");
const dailyDeliveryBoard = document.querySelector("#dailyDeliveryBoard");
const historyFilter = document.querySelector("#historyFilter");
const historyList = document.querySelector("#historyList");
const knowledgeFilter = document.querySelector("#knowledgeFilter");
const knowledgeList = document.querySelector("#knowledgeList");
const moduleGrid = document.querySelector("#moduleGrid");
const openWorkspaceButton = document.querySelector("#openWorkspaceButton");
const outputSelect = document.querySelector("#outputSelect");
const personalBoundariesInput = document.querySelector("#personalBoundariesInput");
const personalDeliveryInput = document.querySelector("#personalDeliveryInput");
const personalPlatformsInput = document.querySelector("#personalPlatformsInput");
const personalRoleInput = document.querySelector("#personalRoleInput");
const profileBoard = document.querySelector("#profileBoard");
const previewTaskButton = document.querySelector("#previewTaskButton");
const queueList = document.querySelector("#queueList");
const queueMeta = document.querySelector("#queueMeta");
const opsCloud = document.querySelector("#opsCloud");
const opsConfirmations = document.querySelector("#opsConfirmations");
const opsOutputs = document.querySelector("#opsOutputs");
const opsReminders = document.querySelector("#opsReminders");
const opsSummary = document.querySelector("#opsSummary");
const refreshOpsButton = document.querySelector("#refreshOpsButton");
const sampleButton = document.querySelector("#sampleButton");
const savePersonalWorkbenchButton = document.querySelector("#savePersonalWorkbenchButton");
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
const CLOUD_TEMPLATE_URL = "https://dfx706544-cell.github.io/Codex-second-brain-workbench-Jacky/automation-workbench/app/";
const dataHub = {
  knowledge: [],
  history: [],
  dailyBriefs: [],
  businessFeedback: [],
  profile: {}
};

function isCloudShareMode() {
  return window.location.hostname.endsWith("github.io");
}

function cloudTemplateUrl() {
  return isCloudShareMode() ? window.location.href : CLOUD_TEMPLATE_URL;
}

function loadPersonalWorkbenchConfig() {
  try {
    return JSON.parse(localStorage.getItem(PERSONALIZATION_KEY) || "{}");
  } catch {
    return {};
  }
}

function collectPersonalWorkbenchConfig() {
  return {
    role: personalRoleInput?.value.trim() || "",
    platforms: personalPlatformsInput?.value.trim() || "",
    boundaries: personalBoundariesInput?.value.trim() || "",
    delivery: personalDeliveryInput?.value.trim() || "",
    savedAt: new Date().toISOString()
  };
}

function savePersonalWorkbenchConfig() {
  const config = collectPersonalWorkbenchConfig();
  localStorage.setItem(PERSONALIZATION_KEY, JSON.stringify(config, null, 2));
  return config;
}

function hydratePersonalWorkbenchConfig() {
  const config = loadPersonalWorkbenchConfig();
  if (personalRoleInput) personalRoleInput.value = config.role || "";
  if (personalPlatformsInput) personalPlatformsInput.value = config.platforms || "";
  if (personalBoundariesInput) personalBoundariesInput.value = config.boundaries || "";
  if (personalDeliveryInput) personalDeliveryInput.value = config.delivery || "";
}

function buildPersonalWorkbenchPrompt(config = collectPersonalWorkbenchConfig()) {
  return `请基于 Jacky 的第二大脑自动化工作台公共模板，帮我搭建一个属于我自己的个性化自动化工作台。

我的身份和业务方向：
${config.role || "请先引导我补充身份、业务方向和主要工作流。"}

我希望接入的平台：
${config.platforms || "请先引导我列出需要接入的平台、网站、工具和账号权限。"}

我的安全边界：
${config.boundaries || "默认不处理密码、验证码、支付、交易和未经确认的外发动作。"}

我的交付方式：
${config.delivery || "请帮我设计每日简报、任务队列、文件交付、历史记录和知识库。"}

请注意：
1. 不要连接或复用 Jacky 的本地队列、数据、outputs、GitHub Actions、账号权限或自动化后端。
2. 请为我创建独立配置、独立数据目录、独立队列和独立云端部署方案。
3. 涉及登录、发消息、发邮件、交易、安装第三方代码或授权时，必须先让我确认。
4. 最终用中文告诉我需要安装什么、如何部署、如何日常使用。`;
}

function buildCloudWorkbenchShareText() {
  return `十一第二大脑自动化工作台｜干净独立模板

模板链接：
${cloudTemplateUrl()}

说明：
1. 这是给朋友复制框架和设计的公共模板，不包含 Jacky 的历史记录、outputs、队列、账号权限或后台自动化。
2. 每个人打开后先填写自己的身份、平台、权限边界和交付方式，配置只保存在自己的浏览器。
3. 如果要做成自己的本地工作台，需要用自己的 GitHub 仓库、邮箱授权、API key、平台账号和自动化设置重新部署。
4. 请不要把自己的密码、验证码、支付码或交易密码发给任何助手。`;
}

function downloadPersonalWorkbenchConfig(config = collectPersonalWorkbenchConfig()) {
  const blob = new Blob([JSON.stringify(config, null, 2)], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "my-second-brain-workbench-config.json";
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

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

function clearLocalQueueSyncState() {
  queue = queue.map((task) => {
    const { syncState, ...cleanTask } = task;
    return cleanTask;
  });
  saveLocalQueue();
}

function bridgeCandidates() {
  const candidates = [];
  if (window.location.protocol === "http:" || window.location.protocol === "https:") {
    candidates.push(window.location.origin);
  }
  for (let port = 8787; port <= 8806; port += 1) {
    candidates.push(`http://127.0.0.1:${port}`);
  }
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

async function findBridge() {
  for (const candidate of bridgeCandidates()) {
    try {
      const response = await fetch(`${candidate}/api/health`, { cache: "no-store" });
      if (!response.ok) continue;
      const health = await response.json();
      if (health?.capabilities?.dataHub && health?.capabilities?.operationsCenter && health?.capabilities?.platformOpener) return candidate;
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

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "\"": "&quot;",
    "'": "&#39;"
  })[char]);
}

function formatDateTime(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("zh-CN");
}

function renderOpsCard(title, value, detail, state = "neutral") {
  return `
    <article class="ops-card" data-state="${state}">
      <span>${escapeHtml(title)}</span>
      <strong>${escapeHtml(value)}</strong>
      <p>${escapeHtml(detail)}</p>
    </article>
  `;
}

function renderOpsList(container, items, emptyText, renderItem) {
  if (!container) return;
  container.innerHTML = items?.length
    ? items.map(renderItem).join("")
    : `<div class="empty-state">${escapeHtml(emptyText)}</div>`;
}

function renderOperationsStatus(status) {
  if (!opsSummary) return;
  const cloudStatus = status.cloudReadiness?.status === "ready" ? "ready" : "needs_setup";
  const latestTask = status.latestCompletedTask;
  const latestTaskTitle = latestTask?.userText || latestTask?.summary || "暂无完成记录";

  opsSummary.innerHTML = [
    renderOpsCard("待处理队列", `${status.queue?.pendingCount ?? 0} 个`, "来自共享队列 tasks.json", status.queue?.pendingCount ? "warning" : "ready"),
    renderOpsCard("知识库条目", `${status.dataHub?.knowledgeItems ?? 0} 条`, "市场、系统、平台与学习资料", "neutral"),
    renderOpsCard("历史任务", `${status.dataHub?.taskHistory ?? 0} 条`, "按电商、金融、系统等分类沉淀", "neutral"),
    renderOpsCard("每日简报", `${status.dataHub?.dailyBriefs ?? 0} 份`, "信息简报归档数量", "neutral"),
    renderOpsCard("业务反馈", `${status.dataHub?.businessFeedback ?? 0} 份`, "账号复盘和 BD 反馈归档数量", "neutral"),
    renderOpsCard("云端准备", `${status.cloudReadiness?.passed ?? 0}/${status.cloudReadiness?.total ?? 0}`, cloudStatus === "ready" ? "基础文件已齐" : "仍有云端文件待补齐", cloudStatus === "ready" ? "ready" : "warning")
  ].join("");

  renderOpsList(opsOutputs, status.latestOutputs, "还没有检测到 outputs/ 文件。", (item) => `
    <article class="ops-row">
      <div>
        <strong>${escapeHtml(item.path)}</strong>
        <span>更新时间：${escapeHtml(formatDateTime(item.modifiedAt))} · ${(Number(item.size) / 1024).toFixed(1)} KB</span>
      </div>
    </article>
  `);

  renderOpsList(opsCloud, status.cloudReadiness?.checks || [], "还没有云端准备检查。", (check) => `
    <article class="ops-row">
      <div>
        <strong>${escapeHtml(check.label)}</strong>
        <span>${escapeHtml(check.path)}</span>
      </div>
      <em data-state="${check.ok ? "ready" : "warning"}">${check.ok ? "已具备" : "待补齐"}</em>
    </article>
  `);

  renderOpsList(opsReminders, status.reminders, "还没有周期任务提醒。", (reminder) => `
    <article class="ops-row">
      <div>
        <strong>${escapeHtml(reminder.title)}</strong>
        <span>${escapeHtml(reminder.schedule)} · ${escapeHtml(reminder.delivery)}</span>
      </div>
      <em>${escapeHtml(reminder.status)}</em>
    </article>
  `);

  renderOpsList(opsConfirmations, status.confirmations, "暂无待确认事项。", (confirmation) => `
    <article class="ops-row">
      <div>
        <strong>${escapeHtml(confirmation.title)}</strong>
        <span>${escapeHtml(confirmation.detail)}</span>
      </div>
    </article>
  `);

  if (latestTask) {
    opsSummary.insertAdjacentHTML("beforeend", renderOpsCard(
      "最近完成",
      latestTask.id || "已完成任务",
      `${latestTaskTitle.slice(0, 48)} · ${formatDateTime(latestTask.completedAt || latestTask.createdAt)}`,
      "ready"
    ));
  }
}

function renderOperationsUnavailable(text) {
  if (!opsSummary) return;
  opsSummary.innerHTML = `<div class="empty-state">${escapeHtml(text)}</div>`;
  [opsOutputs, opsCloud, opsReminders, opsConfirmations].forEach((container) => {
    if (container) container.innerHTML = `<div class="empty-state">连接共享队列服务后显示。</div>`;
  });
}

async function loadOperationsStatus() {
  if (!bridgeBaseUrl) {
    renderOperationsUnavailable("尚未连接共享队列服务。请使用 open-workbench.ps1 打开工作台。");
    return;
  }

  try {
    const response = await fetch(`${bridgeBaseUrl}/api/status`, { cache: "no-store" });
    if (!response.ok) throw new Error(`Status read failed: ${response.status}`);
    renderOperationsStatus(await response.json());
  } catch {
    renderOperationsUnavailable("运行中心状态读取失败。请确认工作台桥接服务仍在运行。");
  }
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
    if (isCloudShareMode()) {
      bridgeConnected = false;
      document.querySelector("#cloudPersonalizationPanel")?.removeAttribute("hidden");
      hydratePersonalWorkbenchConfig();
      setBridgeStatus("connected", "云端分享模式：此页面不会连接 Jacky 电脑里的本地队列。你在这里加入的任务只保存在当前浏览器。");
      renderQueue();
      renderOperationsUnavailable("云端分享模式：运行中心不读取 Jacky 的本地数据、outputs、历史记录或账号信息。");
      return;
    }

    bridgeBaseUrl = await findBridge();
    if (!bridgeBaseUrl) {
      setBridgeStatus("local", "本地备份模式：未连接到共享队列服务。请使用 open-workbench.ps1 打开工作台。");
      return;
    }

    const sharedQueue = await fetchSharedQueue();
    const localQueue = loadLocalQueue();
    const merged = window.WorkbenchQueueState.mergeSharedAndLocalQueues(sharedQueue, localQueue);
    bridgeConnected = true;
    queue = merged.queue;

    if (merged.shouldUpload) {
      await saveSharedQueue();
    }

    clearLocalQueueSyncState();
    setBridgeStatus("connected", "共享队列已连接：加入队列后会写入 automation-workbench/queue/tasks.json，Codex 可直接读取。");
    renderQueue();
    await loadDataHub();
    await loadOperationsStatus();
  } catch {
    bridgeConnected = false;
    setBridgeStatus("local", "本地备份模式：未连接到共享队列服务。请使用 open-workbench.ps1 打开工作台。");
    renderOperationsUnavailable("本地备份模式：运行中心需要共享队列服务。请使用 open-workbench.ps1 打开工作台。");
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

async function openWorkbenchSource(sourceId) {
  const source = window.WORKBENCH_SOURCES.find((item) => item.id === sourceId);
  if (!source?.url) {
    showToast("这个平台还没有配置 URL");
    return;
  }

  if (bridgeConnected && !isCloudShareMode()) {
    try {
      const response = await fetch(`${bridgeBaseUrl}/api/platforms/open`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id: sourceId })
      });
      if (!response.ok) throw new Error(`Platform open failed: ${response.status}`);
      showToast(`已打开：${source.name}`);
      return;
    } catch {
      showToast("后端打开失败，改用浏览器打开链接");
    }
  }

  window.open(source.url, "_blank", "noopener");
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
4. 涉及平台、网站或账号后台时，优先在后端使用 browser、chrome、playwright、AnySearch、API、导出文件或已授权可见页面执行；如果无法在后台完成，再请求接管我的电脑并在前台打开对应平台。
5. 需要我登录、验证码、二次验证、支付密码、交易密码或人工确认时，立刻停下让我操作；不要读取、保存或绕过密码。
6. 如果涉及 Office 文件，生成或编辑 Word、PPT、Excel，并把最终文件保存到 outputs/。
7. 如果涉及飞书、微信、邮箱、社交私信或客户沟通，只能先读取用户授权页面中的可见内容并生成回复草稿；真正发送、提交、上传或外发前必须等待用户确认。
8. 如果涉及账号作品数据、达人沟通数据或转化数据，只读取用户已登录且授权可见的页面，或读取 inputs/ 中用户导出的文件；无法读取时列出需要用户导出的字段。
9. 如果涉及金融交易，只做资讯、信号提醒、纸面交易、风险清单和人工确认前检查，不执行真实下单。
10. 如果涉及 API 费用或 token 余额，请检查是否已配置真实账单/余额来源；当可核实余额低于 50 元人民币时提醒充值。无法读取真实余额时标注待授权，不要编造金额。
11. 如果涉及 Skill 安装，先评估候选和风险；即使用户开放权限，也必须针对具体候选等待确认后再安装。
12. 最后用简洁中文说明完成了什么、文件在哪里、来源链接有哪些、哪些草稿等待发送确认、还有哪些需要用户补充。

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
      <div class="check-card source-card" title="${source.note}">
        <label>
          <input type="checkbox" value="${source.id}">
          <span>
            <strong>${source.name}</strong>
            <small>${source.group}</small>
          </span>
        </label>
        <button class="small ghost" data-open-source="${source.id}" type="button">打开</button>
      </div>
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
  let task = previewCurrentTask();
  if (!task) return;
  if (!bridgeConnected) {
    task = window.WorkbenchQueueState.toLocalPendingTask(task);
  }
  queue.unshift(task);
  await saveQueue();
  renderQueue();
  await loadOperationsStatus();
  showToast(bridgeConnected ? "已加入共享执行队列" : "已加入当前浏览器队列");
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
refreshOpsButton?.addEventListener("click", async () => {
  await loadOperationsStatus();
  showToast("运行中心已刷新");
});

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

copyCloudWorkbenchButton?.addEventListener("click", async () => {
  await copyText(buildCloudWorkbenchShareText(), "已复制干净独立模板链接");
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

savePersonalWorkbenchButton?.addEventListener("click", () => {
  savePersonalWorkbenchConfig();
  showToast("个性化配置已保存到当前浏览器");
});

downloadPersonalConfigButton?.addEventListener("click", () => {
  const config = savePersonalWorkbenchConfig();
  downloadPersonalWorkbenchConfig(config);
  showToast("配置 JSON 已导出");
});

copyPersonalWorkbenchPromptButton?.addEventListener("click", async () => {
  const config = savePersonalWorkbenchConfig();
  await copyText(buildPersonalWorkbenchPrompt(config), "已复制个性化搭建提示词");
});

clearQueueButton.addEventListener("click", async () => {
  queue = [];
  await saveQueue();
  renderQueue();
  await loadOperationsStatus();
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
    await loadOperationsStatus();
    showToast("任务已删除");
  }
});

sourceGrid.addEventListener("click", async (event) => {
  const sourceId = event.target.getAttribute("data-open-source");
  if (!sourceId) return;
  event.preventDefault();
  await openWorkbenchSource(sourceId);
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
