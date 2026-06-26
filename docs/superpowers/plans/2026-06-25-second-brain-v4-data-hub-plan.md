# Second Brain Workbench v4 Data Hub Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the local v4 data hub for the automation workbench so it can browse knowledge, track task history, prepare two daily email deliverables, and support personal growth, health, and personal profile assistants.

**Architecture:** Add a focused `automation-workbench/data/` store with JSON files and bridge API routes. The workbench UI reads these local JSON stores through the bridge and renders tabbed views for task hub, knowledge, history, daily delivery, assistants, and personal profile. Existing queue behavior remains intact.

**Tech Stack:** Vanilla HTML/CSS/JS, Node.js HTTP bridge, JSON data stores, existing Codex skill/workflow files, PowerShell launcher.

---

## File Structure

- Create `automation-workbench/data/knowledge-items.json`: source-backed knowledge records.
- Create `automation-workbench/data/task-history.json`: completed workbench task history.
- Create `automation-workbench/data/daily-briefs.json`: information brief metadata.
- Create `automation-workbench/data/business-feedback.json`: business feedback metadata.
- Create `automation-workbench/data/personal-profile.json`: user goals, preferences, and working style.
- Create `automation-workbench/data/health-log.json`: health and body-management records.
- Create `automation-workbench/data/growth-library.json`: personal growth library entries.
- Create `automation-workbench/data/README.md`: human-readable schema documentation.
- Modify `automation-workbench/scripts/workbench-bridge.mjs`: add data API routes and history helper.
- Modify `automation-workbench/scripts/workbench-bridge.test.mjs`: add data API tests.
- Modify `automation-workbench/app/index.html`: add navigation shell and new view containers.
- Modify `automation-workbench/app/app.js`: load and render data hub views, filters, and summary counts.
- Modify `automation-workbench/app/styles.css`: style v4 navigation, library, history, delivery, profile views.
- Modify `automation-workbench/app/modules.js`: add personal growth, health, and personal profile assistants.
- Create `automation-workbench/workflows/personal-growth-workflow.md`.
- Create `automation-workbench/workflows/health-assistant-workflow.md`.
- Create `automation-workbench/workflows/personal-profile-workflow.md`.
- Create `templates/delivery/business_feedback_email_template.md`.
- Modify `automation-workbench/README.md` and `outputs/automation-workbench-newbie-guide.md`.

---

### Task 1: Data Store And Bridge API

**Files:**
- Create: `automation-workbench/data/knowledge-items.json`
- Create: `automation-workbench/data/task-history.json`
- Create: `automation-workbench/data/daily-briefs.json`
- Create: `automation-workbench/data/business-feedback.json`
- Create: `automation-workbench/data/personal-profile.json`
- Create: `automation-workbench/data/health-log.json`
- Create: `automation-workbench/data/growth-library.json`
- Create: `automation-workbench/data/README.md`
- Modify: `automation-workbench/scripts/workbench-bridge.mjs`
- Modify: `automation-workbench/scripts/workbench-bridge.test.mjs`

- [ ] **Step 1: Write failing bridge data API tests**

Add these tests to `automation-workbench/scripts/workbench-bridge.test.mjs`:

```js
test("bridge reads data hub JSON stores", async () => {
  const fixture = await makeFixture();
  await mkdir(path.join(fixture.workbenchRoot, "data"), { recursive: true });
  await writeFile(
    path.join(fixture.workbenchRoot, "data", "knowledge-items.json"),
    JSON.stringify([{ id: "k1", title: "测试知识" }], null, 2),
    "utf8"
  );
  const bridge = createWorkbenchBridge({
    workspaceRoot: fixture.workspaceRoot,
    workbenchRoot: fixture.workbenchRoot,
    host: "127.0.0.1",
    port: 0
  });

  try {
    const { baseUrl } = await bridge.start();
    const response = await fetch(`${baseUrl}/api/data/knowledge-items`);
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), [{ id: "k1", title: "测试知识" }]);
  } finally {
    await bridge.stop();
    await rm(fixture.workspaceRoot, { recursive: true, force: true });
  }
});

test("bridge appends task history records", async () => {
  const fixture = await makeFixture();
  const bridge = createWorkbenchBridge({
    workspaceRoot: fixture.workspaceRoot,
    workbenchRoot: fixture.workbenchRoot,
    host: "127.0.0.1",
    port: 0
  });

  try {
    const { baseUrl } = await bridge.start();
    const response = await fetch(`${baseUrl}/api/data/task-history`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id: "task-1", category: "system", userText: "记录测试" })
    });
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { ok: true, count: 1 });

    const stored = JSON.parse(await readFile(path.join(fixture.workbenchRoot, "data", "task-history.json"), "utf8"));
    assert.equal(stored[0].id, "task-1");
    assert.equal(stored[0].category, "system");
  } finally {
    await bridge.stop();
    await rm(fixture.workspaceRoot, { recursive: true, force: true });
  }
});
```

- [ ] **Step 2: Run tests and verify they fail**

Run:

```powershell
& "C:\Users\嘉十一\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe" --test "C:\Users\嘉十一\Documents\Codex\2026-06-24\w\automation-workbench\scripts\workbench-bridge.test.mjs"
```

Expected: the new `/api/data/...` tests fail with 404 or unknown route.

- [ ] **Step 3: Create initial data files**

Create JSON files with these exact initial shapes:

`automation-workbench/data/knowledge-items.json`

```json
[
  {
    "id": "knowledge-2026-06-25-workbench-v4",
    "createdAt": "2026-06-25T00:00:00.000Z",
    "publishedAt": "2026-06-25",
    "title": "第二大脑工作台 v4 数据中枢设计",
    "summaryZh": "工作台将以数据中枢为地基，统一沉淀知识、历史、简报、业务反馈、个人画像、健康和成长资料。",
    "sourceUrl": "docs/superpowers/specs/2026-06-25-second-brain-v4-data-hub-design.md",
    "sourceName": "本地设计文档",
    "domain": "system",
    "tags": ["第二大脑", "工作台", "数据中枢"],
    "credibility": "本地设计",
    "relatedAssistants": ["Skill Scout", "个人画像助手"],
    "impact": "为后续知识库、历史记录和每日交付提供统一数据结构。",
    "nextAction": "实现 v4 数据中枢和页面。"
  }
]
```

`automation-workbench/data/task-history.json`

```json
[
  {
    "id": "history-2026-06-25-skill-install",
    "createdAt": "2026-06-25T00:00:00.000Z",
    "completedAt": "2026-06-25T00:00:00.000Z",
    "category": "system",
    "userText": "安装 10 个常用 skills 并接入工作台",
    "primaryAssistant": "Skill Scout",
    "secondaryAssistants": [],
    "skills": ["skill-installer", "anysearch", "browser"],
    "sources": ["GitHub"],
    "status": "completed",
    "outputs": ["outputs/skill-installation-record-2026-06-25.md"],
    "summary": "已安装并接入 10 个扩展 skills。",
    "nextAction": "重启 Codex 以加载新 skills。"
  }
]
```

Use `[]` as the initial value for:

```text
daily-briefs.json
business-feedback.json
health-log.json
growth-library.json
```

Create `personal-profile.json`:

```json
{
  "updatedAt": "2026-06-25T00:00:00.000Z",
  "goals": [
    "把自动化工作台打造成第二大脑和贴身助手",
    "提升跨境电商 BD、金融资讯、自媒体/IP、个人成长和健康管理能力"
  ],
  "preferences": [
    "中文通俗解读",
    "保留真实来源链接",
    "外发和交易前需要确认",
    "希望工作台持续进化"
  ],
  "constraints": [
    "不在聊天中处理账号密码或验证码",
    "本地电脑关机后无法运行本地工作台"
  ],
  "workingStyle": [
    "希望通过工作台下达自然语言需求",
    "希望结果保存到 outputs/ 并能回溯"
  ],
  "sensitiveNotes": []
}
```

- [ ] **Step 4: Implement bridge data API**

In `automation-workbench/scripts/workbench-bridge.mjs`, add:

```js
const DATA_FILES = new Map([
  ["knowledge-items", "knowledge-items.json"],
  ["task-history", "task-history.json"],
  ["daily-briefs", "daily-briefs.json"],
  ["business-feedback", "business-feedback.json"],
  ["personal-profile", "personal-profile.json"],
  ["health-log", "health-log.json"],
  ["growth-library", "growth-library.json"]
]);
```

Inside `createWorkbenchBridge`, add:

```js
const dataDir = path.join(workbenchRoot, "data");

async function ensureDataFile(name) {
  const fileName = DATA_FILES.get(name);
  if (!fileName) throw new Error("Unknown data store.");
  await mkdir(dataDir, { recursive: true });
  const filePath = path.join(dataDir, fileName);
  if (!(await fileExists(filePath))) {
    const initial = name === "personal-profile" ? "{}\n" : "[]\n";
    await writeFile(filePath, initial, "utf8");
  }
  return filePath;
}

async function readDataStore(name) {
  const filePath = await ensureDataFile(name);
  const raw = await readFile(filePath, "utf8");
  return raw.trim() ? JSON.parse(raw) : [];
}

async function writeDataStore(name, value) {
  const filePath = await ensureDataFile(name);
  const tmpPath = `${filePath}.tmp`;
  await writeFile(tmpPath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
  await rename(tmpPath, filePath);
}
```

Add to `handleApi` before the 404:

```js
const dataMatch = url.pathname.match(/^\/api\/data\/([a-z-]+)$/);
if (dataMatch && req.method === "GET") {
  jsonResponse(res, 200, await readDataStore(dataMatch[1]));
  return;
}

if (dataMatch && req.method === "POST") {
  const name = dataMatch[1];
  const body = await readRequestBody(req);
  const payload = body.trim() ? JSON.parse(body) : {};
  if (name === "personal-profile") {
    await writeDataStore(name, payload);
    jsonResponse(res, 200, { ok: true, count: 1 });
    return;
  }
  const current = await readDataStore(name);
  if (!Array.isArray(current)) throw new Error("Data store is not appendable.");
  const next = Array.isArray(payload) ? [...payload, ...current] : [payload, ...current];
  await writeDataStore(name, next);
  jsonResponse(res, 200, { ok: true, count: next.length });
  return;
}
```

- [ ] **Step 5: Run tests and verify pass**

Run:

```powershell
& "C:\Users\嘉十一\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe" --test "C:\Users\嘉十一\Documents\Codex\2026-06-24\w\automation-workbench\scripts\workbench-bridge.test.mjs"
```

Expected: all bridge tests pass.

---

### Task 2: Workbench Navigation And Data Views

**Files:**
- Modify: `automation-workbench/app/index.html`
- Modify: `automation-workbench/app/app.js`
- Modify: `automation-workbench/app/styles.css`

- [ ] **Step 1: Add navigation markup**

In `index.html`, after the hero band, add:

```html
<nav class="workbench-tabs" aria-label="工作台视图">
  <button class="tab active" data-view="taskHub" type="button">任务中枢</button>
  <button class="tab" data-view="knowledgeView" type="button">知识库</button>
  <button class="tab" data-view="historyView" type="button">历史记录</button>
  <button class="tab" data-view="dailyView" type="button">每日交付</button>
  <button class="tab" data-view="profileView" type="button">个人画像</button>
</nav>
```

Wrap the existing task input, queue, assistant, insight, and preview sections in:

```html
<section class="view active" id="taskHub">...</section>
```

Add new sibling sections:

```html
<section class="view" id="knowledgeView">
  <section class="panel">
    <div class="panel-head">
      <div><h2>知识库</h2><p>按主题、来源、时间和可信度浏览收录资料。</p></div>
      <select id="knowledgeFilter"><option value="all">全部主题</option></select>
    </div>
    <div class="library-grid" id="knowledgeList"></div>
  </section>
</section>

<section class="view" id="historyView">
  <section class="panel">
    <div class="panel-head">
      <div><h2>历史记录</h2><p>查询工作台完成过的任务和输出文件。</p></div>
      <select id="historyFilter"><option value="all">全部分类</option></select>
    </div>
    <div class="history-list" id="historyList"></div>
  </section>
</section>

<section class="view" id="dailyView">
  <section class="panel">
    <div class="panel-head">
      <div><h2>每日交付</h2><p>信息简报和业务反馈分开生成、分开归档。</p></div>
    </div>
    <div class="delivery-board" id="dailyDeliveryBoard"></div>
  </section>
</section>

<section class="view" id="profileView">
  <section class="panel">
    <div class="panel-head">
      <div><h2>个人画像</h2><p>记录目标、偏好、约束和工作方式，可审阅后修改。</p></div>
    </div>
    <div class="profile-board" id="profileBoard"></div>
  </section>
</section>
```

- [ ] **Step 2: Add CSS**

Add to `styles.css`:

```css
.workbench-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin: 16px 0;
}

.tab {
  min-height: 38px;
  border: 1px solid var(--line);
  border-radius: 8px;
  background: #fff;
  color: var(--ink);
  padding: 8px 12px;
}

.tab.active {
  border-color: var(--accent);
  background: var(--accent);
  color: #fff;
  font-weight: 800;
}

.view {
  display: none;
}

.view.active {
  display: block;
}

.library-grid,
.history-list,
.delivery-board,
.profile-board {
  display: grid;
  gap: 10px;
}

.library-card,
.history-card,
.delivery-card,
.profile-card {
  border: 1px solid var(--line);
  border-radius: 8px;
  background: #f8faf9;
  padding: 13px;
}

.library-card h3,
.history-card h3,
.delivery-card h3,
.profile-card h3 {
  margin-bottom: 6px;
}

.meta-line {
  margin-top: 8px;
  color: var(--muted);
  font-size: 13px;
  line-height: 1.5;
}

.source-link {
  display: inline-block;
  margin-top: 8px;
  color: var(--accent);
  overflow-wrap: anywhere;
}
```

- [ ] **Step 3: Add app data loading and rendering**

Add to `app.js` near the top:

```js
const knowledgeFilter = document.querySelector("#knowledgeFilter");
const knowledgeList = document.querySelector("#knowledgeList");
const historyFilter = document.querySelector("#historyFilter");
const historyList = document.querySelector("#historyList");
const dailyDeliveryBoard = document.querySelector("#dailyDeliveryBoard");
const profileBoard = document.querySelector("#profileBoard");
const tabs = Array.from(document.querySelectorAll(".tab"));
const views = Array.from(document.querySelectorAll(".view"));
const dataHub = {
  knowledge: [],
  history: [],
  dailyBriefs: [],
  businessFeedback: [],
  profile: {}
};
```

Add functions:

```js
async function fetchDataStore(name, fallback) {
  if (!bridgeBaseUrl) return fallback;
  const response = await fetch(`${bridgeBaseUrl}/api/data/${name}`, { cache: "no-store" });
  if (!response.ok) return fallback;
  return await response.json();
}

function setActiveView(viewId) {
  tabs.forEach((tab) => tab.classList.toggle("active", tab.dataset.view === viewId));
  views.forEach((view) => view.classList.toggle("active", view.id === viewId));
}

function optionList(values) {
  return ["all", ...Array.from(new Set(values.filter(Boolean)))];
}

function renderKnowledge() {
  const domains = optionList(dataHub.knowledge.map((item) => item.domain));
  knowledgeFilter.innerHTML = domains.map((domain) => `<option value="${domain}">${domain === "all" ? "全部主题" : domain}</option>`).join("");
  const selected = knowledgeFilter.value || "all";
  const items = selected === "all" ? dataHub.knowledge : dataHub.knowledge.filter((item) => item.domain === selected);
  knowledgeList.innerHTML = items.length ? items.map((item) => `
    <article class="library-card">
      <h3>${item.title || "未命名资料"}</h3>
      <p>${item.summaryZh || "暂无摘要"}</p>
      <div class="meta-line">收录：${item.createdAt || "-"} · 发行：${item.publishedAt || "-"} · 可信度：${item.credibility || "-"}</div>
      <div class="meta-line">标签：${(item.tags || []).join("、") || "-"}</div>
      ${item.sourceUrl ? `<a class="source-link" href="${item.sourceUrl}" target="_blank" rel="noopener">查看来源</a>` : ""}
    </article>
  `).join("") : `<div class="empty-state">暂无知识条目。</div>`;
}

function renderHistory() {
  const categories = optionList(dataHub.history.map((item) => item.category));
  historyFilter.innerHTML = categories.map((category) => `<option value="${category}">${category === "all" ? "全部分类" : category}</option>`).join("");
  const selected = historyFilter.value || "all";
  const items = selected === "all" ? dataHub.history : dataHub.history.filter((item) => item.category === selected);
  historyList.innerHTML = items.length ? items.map((item) => `
    <article class="history-card">
      <h3>${item.userText || "未命名任务"}</h3>
      <p>${item.summary || "暂无总结"}</p>
      <div class="meta-line">分类：${item.category || "-"} · 助手：${item.primaryAssistant || "-"} · 状态：${item.status || "-"}</div>
      <div class="meta-line">输出：${(item.outputs || []).join("；") || "-"}</div>
    </article>
  `).join("") : `<div class="empty-state">暂无历史记录。</div>`;
}

function renderDailyDelivery() {
  dailyDeliveryBoard.innerHTML = `
    <article class="delivery-card"><h3>信息简报</h3><p>已归档 ${dataHub.dailyBriefs.length} 条。每日金融、宏观、AI、平台、学术和社会热点。</p></article>
    <article class="delivery-card"><h3>业务反馈</h3><p>已归档 ${dataHub.businessFeedback.length} 条。账号复盘、达人沟通、内容表现和明日动作。</p></article>
  `;
}

function renderProfile() {
  profileBoard.innerHTML = ["goals", "preferences", "constraints", "workingStyle"].map((key) => `
    <article class="profile-card">
      <h3>${key}</h3>
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
```

Add listeners:

```js
tabs.forEach((tab) => tab.addEventListener("click", () => setActiveView(tab.dataset.view)));
knowledgeFilter?.addEventListener("change", renderKnowledge);
historyFilter?.addEventListener("change", renderHistory);
```

Call `loadDataHub()` at the end of successful `initSharedQueue()` after `renderQueue()`.

- [ ] **Step 4: Run JS syntax checks**

Run:

```powershell
& "C:\Users\嘉十一\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe" --check "C:\Users\嘉十一\Documents\Codex\2026-06-24\w\automation-workbench\app\app.js"
& "C:\Users\嘉十一\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe" --check "C:\Users\嘉十一\Documents\Codex\2026-06-24\w\automation-workbench\app\modules.js"
```

Expected: no output and exit code 0.

---

### Task 3: New Assistants And Workflows

**Files:**
- Modify: `automation-workbench/app/modules.js`
- Create: `automation-workbench/workflows/personal-growth-workflow.md`
- Create: `automation-workbench/workflows/health-assistant-workflow.md`
- Create: `automation-workbench/workflows/personal-profile-workflow.md`

- [ ] **Step 1: Add assistant modules**

Add these objects before `skills` in `WORKBENCH_MODULES`:

```js
{
  id: "growth",
  title: "个人成长助手",
  shortTitle: "Growth",
  tag: "认知 / 逻辑 / 财商 / 社交",
  description: "沉淀心理学、逻辑学、经济金融、社交公关、表达和学习方法，形成书单、观点卡和练习计划。",
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
}
```

Update `ASSISTANT_ROUTING`:

```js
growth: ["成长", "心理学", "逻辑", "认知", "财商", "经济学", "金融学", "社交", "公关", "书单", "学习"],
health: ["健康", "训练", "饮食", "作息", "睡眠", "身材", "减脂", "增肌", "体态", "长高"],
profile: ["个人画像", "偏好", "目标", "了解我", "第二大脑", "长期记忆", "个人助手"]
```

Add default skills to `WORKBENCH_SKILLS`:

```js
{ id: "anysearch", name: "anysearch", defaultModules: ["news", "trading", "work", "skills", "creator", "growth", "health"] }
```

Keep existing modules unchanged.

- [ ] **Step 2: Create personal growth workflow**

`automation-workbench/workflows/personal-growth-workflow.md`:

```markdown
# 个人成长助手工作流

目标：帮助用户系统提升认知、心理韧性、逻辑表达、经济金融理解、社交和公共关系能力。

## 输入

- 用户当前目标或困惑。
- 已有知识库和成长资料库。
- 最新书籍、论文、公开课程、访谈、平台讨论和学术热点。

## 输出

- 中文通俗解读。
- 推荐书单或论文清单。
- 概念卡片。
- 7 天可执行练习。
- 来源链接。
- 写入 `automation-workbench/data/growth-library.json` 的建议条目。

## 边界

- 不把心理健康内容包装成诊断。
- 涉及严重焦虑、抑郁、自伤或伤害他人风险时，建议寻求专业帮助。
- 不编造书籍、论文或来源。
```

- [ ] **Step 3: Create health workflow**

`automation-workbench/workflows/health-assistant-workflow.md`:

```markdown
# 健康助手工作流

目标：帮助用户做一般健康管理、训练计划、饮食规划、作息管理和身材管理。

## 输入

- 用户目标、身高体重、训练基础、饮食偏好、作息和限制。
- 用户导出的健康记录或手动记录。

## 输出

- 训练计划。
- 饮食建议。
- 睡眠和作息建议。
- 体态和习惯建议。
- 可记录到 `automation-workbench/data/health-log.json` 的条目。

## 安全边界

- 不做医疗诊断。
- 不替代医生、营养师、康复师。
- 涉及疼痛、疾病、药物、极端节食、未成年人长高、内分泌或发育异常时，建议咨询专业医生。
- 长高建议必须说明生理年龄、骨骺线和遗传因素限制。
```

- [ ] **Step 4: Create personal profile workflow**

`automation-workbench/workflows/personal-profile-workflow.md`:

```markdown
# 个人画像助手工作流

目标：让工作台逐步理解用户的目标、偏好、约束、工作方式和长期计划。

## 可记录内容

- 长期目标。
- 工作偏好。
- 常用平台。
- 输出格式偏好。
- 安全边界。
- 学习与健康目标。

## 不记录内容

- 密码、验证码、支付码、交易密码。
- 身份证、银行卡等敏感身份信息。
- 未经用户确认的敏感私人信息。

## 输出

- 建议写入 `automation-workbench/data/personal-profile.json` 的变更。
- 说明为什么建议记录。
- 用户可选择接受、修改或删除。
```

- [ ] **Step 5: Run syntax checks**

Run:

```powershell
& "C:\Users\嘉十一\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe" --check "C:\Users\嘉十一\Documents\Codex\2026-06-24\w\automation-workbench\app\modules.js"
```

Expected: exit code 0.

---

### Task 4: Daily Delivery Templates And Docs

**Files:**
- Create: `templates/delivery/business_feedback_email_template.md`
- Modify: `automation-workbench/README.md`
- Modify: `outputs/automation-workbench-newbie-guide.md`

- [ ] **Step 1: Create business feedback email template**

`templates/delivery/business_feedback_email_template.md`:

```markdown
# 业务反馈邮件草稿模板

收件人：jacky060911@163.com

主题：每日业务反馈与账号复盘 - {{date}}

## 今日核心反馈

{{summary}}

## 达人沟通与 BD

- 触达：
- 回复：
- 有效回复：
- 成交/意向：
- 话术建议：

## 内容与账号表现

- 高表现内容：
- 低表现内容：
- 流量、互动、转化变化：
- 剪辑和选题建议：

## 跨境电商机会

- 商品/类目：
- 平台信号：
- 达人/竞品：
- 下一步：

## 明日行动清单

1. {{action1}}
2. {{action2}}
3. {{action3}}

## 来源和附件

{{sources}}
```

- [ ] **Step 2: Update README**

Add to `automation-workbench/README.md`:

```markdown
## 第二大脑 v4

v4 采用数据中枢路线。核心数据保存在 `automation-workbench/data/`：

- 知识库：`knowledge-items.json`
- 历史记录：`task-history.json`
- 信息简报：`daily-briefs.json`
- 业务反馈：`business-feedback.json`
- 个人画像：`personal-profile.json`
- 健康记录：`health-log.json`
- 成长资料库：`growth-library.json`

每日交付会拆成两封邮件草稿：

1. 信息简报。
2. 业务反馈与账号复盘。

默认只生成草稿和附件，不直接发送。
```

- [ ] **Step 3: Update newbie guide**

Add a short section:

```markdown
## 第二大脑 v4 怎么用

打开工作台后可以切换：

- 知识库：看收录的资料、来源和行动建议。
- 历史记录：回看通过工作台完成的任务。
- 每日交付：查看信息简报和业务反馈。
- 个人画像：查看工作台对你的目标、偏好和约束的理解。

每天邮件会拆成两份草稿：一份信息简报，一份业务反馈。真正发送前仍需确认。
```

- [ ] **Step 4: Verify docs exist**

Run:

```powershell
Test-Path "C:\Users\嘉十一\Documents\Codex\2026-06-24\w\templates\delivery\business_feedback_email_template.md"
Test-Path "C:\Users\嘉十一\Documents\Codex\2026-06-24\w\automation-workbench\README.md"
Test-Path "C:\Users\嘉十一\Documents\Codex\2026-06-24\w\outputs\automation-workbench-newbie-guide.md"
```

Expected: three `True` values.

---

### Task 5: Verification And Browser QA

**Files:**
- No new files.
- Verify: `automation-workbench/app/index.html`
- Verify: `automation-workbench/app/app.js`
- Verify: `automation-workbench/app/modules.js`
- Verify: `automation-workbench/scripts/workbench-bridge.mjs`

- [ ] **Step 1: Run all JS checks**

Run:

```powershell
& "C:\Users\嘉十一\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe" --check "C:\Users\嘉十一\Documents\Codex\2026-06-24\w\automation-workbench\app\app.js"
& "C:\Users\嘉十一\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe" --check "C:\Users\嘉十一\Documents\Codex\2026-06-24\w\automation-workbench\app\modules.js"
& "C:\Users\嘉十一\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe" --check "C:\Users\嘉十一\Documents\Codex\2026-06-24\w\automation-workbench\app\hover-translate.js"
& "C:\Users\嘉十一\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe" --check "C:\Users\嘉十一\Documents\Codex\2026-06-24\w\automation-workbench\scripts\workbench-bridge.mjs"
```

Expected: no syntax errors.

- [ ] **Step 2: Run bridge tests**

Run:

```powershell
& "C:\Users\嘉十一\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe" --test "C:\Users\嘉十一\Documents\Codex\2026-06-24\w\automation-workbench\scripts\workbench-bridge.test.mjs"
```

Expected: all tests pass.

- [ ] **Step 3: Start workbench**

Run:

```powershell
powershell -ExecutionPolicy Bypass -File "C:\Users\嘉十一\Documents\Codex\2026-06-24\w\automation-workbench\scripts\open-workbench.ps1"
```

Expected: workbench opens on localhost.

- [ ] **Step 4: Browser QA**

In the in-app browser:

1. Open `http://127.0.0.1:8788/automation-workbench/app/`.
2. Confirm tabs appear: 任务中枢、知识库、历史记录、每日交付、个人画像.
3. Click 知识库 and verify at least one seeded record renders.
4. Click 历史记录 and verify the skill installation history renders.
5. Click 每日交付 and verify two cards render.
6. Click 个人画像 and verify goals/preferences render.

- [ ] **Step 5: Completion summary**

Final response should include:

- What was added.
- Data files created.
- How to open the new views.
- Reminder that email sending still requires confirmation.
- Reminder that cloud always-on is future v5.

---

## Self-Review

Spec coverage:

- Knowledge library: Task 1 and Task 2.
- History page: Task 1 and Task 2.
- Daily two-email workflow: Task 1, Task 2, Task 4.
- New assistants: Task 3.
- Data files: Task 1.
- Safety boundaries: Task 3 and Task 4 docs.
- Browser and Node checks: Task 5.

No placeholders remain. Function and file names are consistent across tasks.
