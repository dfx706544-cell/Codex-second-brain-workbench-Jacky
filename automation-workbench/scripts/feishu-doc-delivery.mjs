function enabled(value, defaultValue = true) {
  if (value === undefined || value === null || value === "") return defaultValue;
  return /^(1|true|yes|on)$/i.test(String(value));
}

function cleanEnvString(value) {
  return String(value || "")
    .replace(/\uFEFF/g, "")
    .replace(/[\r\n\t]/g, "")
    .trim();
}

function formatDeliveryError(error) {
  if (error?.message?.trim()) return error.message.trim();
  const text = String(error || "").trim();
  return text && text !== "Error" ? text : "Unknown Feishu doc delivery error";
}

function feishuBaseUrl(env) {
  return cleanEnvString(env.FEISHU_OPEN_API_BASE_URL || "https://open.feishu.cn/open-apis").replace(/\/+$/, "");
}

export function getFeishuDocDeliveryStatus({ env = process.env } = {}) {
  const appId = cleanEnvString(env.FEISHU_APP_ID);
  const appSecret = cleanEnvString(env.FEISHU_APP_SECRET);
  const docId = cleanEnvString(env.FEISHU_DOC_ID);
  const sendEnabled = enabled(env.SEND_FEISHU_DOC, true);
  const missing = [];

  if (!appId) missing.push("FEISHU_APP_ID");
  if (!appSecret) missing.push("FEISHU_APP_SECRET");
  if (!docId) missing.push("FEISHU_DOC_ID");

  if (!sendEnabled) {
    return {
      configured: missing.length === 0,
      sendEnabled: false,
      status: "disabled",
      missing,
      message: "飞书云文档交付已被 SEND_FEISHU_DOC=false 关闭。"
    };
  }

  if (missing.length > 0) {
    return {
      configured: false,
      sendEnabled: true,
      status: "not_configured",
      missing,
      message: `飞书云文档交付未配置：缺少 ${missing.join(", ")}。`
    };
  }

  return {
    configured: true,
    sendEnabled: true,
    status: "ready_to_send",
    missing: [],
    message: "飞书云文档交付已配置，runner 会尝试把每日简报同步到云端文档。"
  };
}

function isFeishuSuccess(json) {
  return json?.code === 0 || json?.StatusCode === 0;
}

async function getTenantAccessToken({ env, fetchImpl }) {
  const response = await fetchImpl(`${feishuBaseUrl(env)}/auth/v3/tenant_access_token/internal`, {
    method: "POST",
    headers: { "content-type": "application/json; charset=utf-8" },
    body: JSON.stringify({
      app_id: cleanEnvString(env.FEISHU_APP_ID),
      app_secret: cleanEnvString(env.FEISHU_APP_SECRET)
    })
  });

  if (!response.ok) {
    throw new Error(`Feishu tenant token returned HTTP ${response.status}`);
  }

  const json = await response.json().catch(() => ({}));
  if (!isFeishuSuccess(json) || !json.tenant_access_token) {
    throw new Error(`Feishu tenant token rejected request: ${json?.msg || json?.message || JSON.stringify(json)}`);
  }

  return json.tenant_access_token;
}

function buildDocBlock({ title, markdown }) {
  return {
    index: -1,
    children: [
      {
        block_type: 2,
        text: {
          elements: [
            {
              text_run: {
                content: `${title}\n\n${markdown}`
              }
            }
          ]
        }
      }
    ]
  };
}

async function appendToFeishuDoc({ env, title, markdown, fetchImpl }) {
  const docId = cleanEnvString(env.FEISHU_DOC_ID);
  const token = await getTenantAccessToken({ env, fetchImpl });
  const response = await fetchImpl(`${feishuBaseUrl(env)}/docx/v1/documents/${docId}/blocks/${docId}/children`, {
    method: "POST",
    headers: {
      authorization: `Bearer ${token}`,
      "content-type": "application/json; charset=utf-8"
    },
    body: JSON.stringify(buildDocBlock({ title, markdown }))
  });

  if (!response.ok) {
    throw new Error(`Feishu document append returned HTTP ${response.status}`);
  }

  const json = await response.json().catch(() => ({}));
  if (!isFeishuSuccess(json)) {
    throw new Error(`Feishu document append rejected request: ${json?.msg || json?.message || JSON.stringify(json)}`);
  }

  return json;
}

export async function deliverFeishuDoc({
  env = process.env,
  title,
  markdown,
  fetchImpl = globalThis.fetch
} = {}) {
  const status = getFeishuDocDeliveryStatus({ env });
  if (status.status !== "ready_to_send") {
    return { ...status, sent: false };
  }

  if (typeof fetchImpl !== "function") {
    return {
      ...status,
      status: "send_error",
      sent: false,
      message: "飞书云文档交付失败：当前 Node 环境没有 fetch，无法调用飞书开放平台。"
    };
  }

  if (cleanEnvString(env.FEISHU_DOC_ID) === "mock://feishu-doc-success") {
    return {
      ...status,
      status: "sent",
      sent: true,
      message: "飞书云文档交付已同步。"
    };
  }

  try {
    await appendToFeishuDoc({ env, title, markdown, fetchImpl });
    return {
      ...status,
      status: "sent",
      sent: true,
      message: "飞书云文档交付已同步。"
    };
  } catch (error) {
    return {
      ...status,
      status: "send_error",
      sent: false,
      message: `飞书云文档交付失败：${formatDeliveryError(error)}`
    };
  }
}
