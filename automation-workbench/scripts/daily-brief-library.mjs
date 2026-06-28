import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

function workspacePath(workspaceRoot, filePath) {
  return path.relative(workspaceRoot, filePath).split(path.sep).join("/");
}

function feishuSyncPack({ date, dailyBriefBody, businessFeedbackBody, maintenanceReportBody }) {
  return `# ${date} 无垠每日信息简报同步包

用途：可复制到飞书、Notion、语雀或共享文档。<br>
说明：这是邮件不可用时的备用交付内容；飞书 API 凭证配置完成后，可自动同步到固定共享文档。

## 信息简报

${dailyBriefBody}

---

## 业务反馈

${businessFeedbackBody}

---

## 维护巡检

${maintenanceReportBody}
`;
}

async function writeObsidianMirror({ workbenchRoot, dailyBriefPath, businessFeedbackPath }) {
  const vaultRoot = path.join(workbenchRoot, "obsidian-vault");
  const dailyDir = path.join(vaultRoot, "Daily Briefs");
  const feedbackDir = path.join(vaultRoot, "Business Feedback");
  await mkdir(dailyDir, { recursive: true });
  await mkdir(feedbackDir, { recursive: true });

  await copyFile(dailyBriefPath, path.join(dailyDir, "最新信息简报.md"));
  await copyFile(businessFeedbackPath, path.join(feedbackDir, "最新业务反馈.md"));
}

async function buildIndex({ outputsDir }) {
  const latestBrief = path.join(outputsDir, "daily-brief-latest.md");
  const latestFeedback = path.join(outputsDir, "business-feedback-latest.md");
  const latestBriefText = await readFile(latestBrief, "utf8");
  const titleMatch = latestBriefText.match(/^#\s+(.+)$/m);
  const title = titleMatch?.[1] || "最新每日信息简报";

  return `# 每日简报库索引

更新时间：${new Date().toISOString()}

## 固定入口

- 最新信息简报：outputs/daily-brief-latest.md
- 最新业务反馈：outputs/business-feedback-latest.md
- 最新飞书/共享文档同步包：outputs/daily-brief-sync-pack-latest.md

## 当前最新

- ${title}
- 本地工作台、Obsidian、GitHub 仓库和飞书镜像可共用这套内容。

## 交付策略

1. 核心存储：outputs/ 与 automation-workbench/data/。
2. 本地阅读：无垠工作台和 Obsidian vault。
3. 外部镜像：飞书、Notion、语雀或共享文档，在授权后同步。
4. 邮件：SMTP 配置可用时发送；不可用时保留草稿和同步包。

## 最新文件状态

- latest brief bytes: ${Buffer.byteLength(await readFile(latestBrief, "utf8"), "utf8")}
- latest feedback bytes: ${Buffer.byteLength(await readFile(latestFeedback, "utf8"), "utf8")}
`;
}

export async function updateDailyBriefLibrary({
  workspaceRoot,
  workbenchRoot,
  outputsDir,
  date,
  dailyBriefPath,
  businessFeedbackPath,
  maintenanceReportPath,
  dailyBriefBody,
  businessFeedbackBody,
  maintenanceReportBody
}) {
  await mkdir(outputsDir, { recursive: true });

  const latestBriefPath = path.join(outputsDir, "daily-brief-latest.md");
  const latestFeedbackPath = path.join(outputsDir, "business-feedback-latest.md");
  const syncPackPath = path.join(outputsDir, `daily-brief-sync-pack-${date}.md`);
  const latestSyncPackPath = path.join(outputsDir, "daily-brief-sync-pack-latest.md");
  const indexPath = path.join(outputsDir, "daily-brief-index.md");

  await copyFile(dailyBriefPath, latestBriefPath);
  await copyFile(businessFeedbackPath, latestFeedbackPath);
  await writeFile(syncPackPath, feishuSyncPack({ date, dailyBriefBody, businessFeedbackBody, maintenanceReportBody }), "utf8");
  await copyFile(syncPackPath, latestSyncPackPath);
  await copyFile(maintenanceReportPath, path.join(outputsDir, "maintenance-report-latest.md"));
  await writeObsidianMirror({ workbenchRoot, dailyBriefPath, businessFeedbackPath });
  await writeFile(indexPath, await buildIndex({ outputsDir }), "utf8");

  return {
    latestBriefPath,
    latestFeedbackPath,
    syncPackPath,
    latestSyncPackPath,
    indexPath,
    outputs: [
      workspacePath(workspaceRoot, latestBriefPath),
      workspacePath(workspaceRoot, latestFeedbackPath),
      workspacePath(workspaceRoot, syncPackPath),
      workspacePath(workspaceRoot, latestSyncPackPath),
      workspacePath(workspaceRoot, indexPath)
    ]
  };
}
