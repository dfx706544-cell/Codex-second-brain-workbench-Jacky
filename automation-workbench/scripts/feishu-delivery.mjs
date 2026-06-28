import crypto from "node:crypto";

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
  if (error?.code) return `${error.name || "FeishuError"} ${error.code}`;
  const text = String(error || "").trim();
  return text && text !== "Error" ? text : "Unknown Feishu delivery error";
}

export function buildFeishuSignature(timestamp, secret) {
  const stringToSign = `${timestamp}\n${secret}`;
  return crypto.createHmac("sha256", stringToSign).update("").digest("base64");
}

export function getFeishuDeliveryStatus({ env = process.env } = {}) {
  if (!enabled(env.SEND_FEISHU, true)) {
    return {
      configured: Boolean(cleanEnvString(env.FEISHU_WEBHOOK_URL)),
      sendEnabled: false,
      status: "disabled",
      message: "飞书备用交付已被 SEND_FEISHU=false 关闭。"
    };
  }

  const webhookUrl = cleanEnvString(env.FEISHU_WEBHOOK_URL);
  if (!webhookUrl) {
    return {
      configured: false,
      sendEnabled: true,
      status: "not_configured",
      message: "飞书备用交付未配置：缺少 FEISHU_WEBHOOK_URL。"
    };
  }

  return {
    configured: true,
    sendEnabled: true,
    status: "ready_to_send",
    message: "飞书备用交付已配置，SMTP 失败时会尝试推送飞书机器人。"
  };
}

function makePayload({ env, message, nowSeconds }) {
  const payload = {
    msg_type: "text",
    content: {
      text: message
    }
  };

  const secret = cleanEnvString(env.FEISHU_WEBHOOK_SECRET);
  if (secret) {
    const timestamp = String(nowSeconds());
    payload.timestamp = timestamp;
    payload.sign = buildFeishuSignature(timestamp, secret);
  }

  return payload;
}

function isFeishuSuccess(json) {
  return json?.code === 0 || json?.StatusCode === 0;
}

export async function sendFeishuMessage({
  env = process.env,
  message,
  fetchImpl = globalThis.fetch,
  nowSeconds = () => Math.floor(Date.now() / 1000)
} = {}) {
  const webhookUrl = cleanEnvString(env.FEISHU_WEBHOOK_URL);
  if (webhookUrl === "mock://feishu-success") {
    return { code: 0, msg: "mock success" };
  }

  if (typeof fetchImpl !== "function") {
    throw new Error("当前 Node 环境没有 fetch，无法推送飞书机器人。");
  }

  const response = await fetchImpl(webhookUrl, {
    method: "POST",
    headers: { "content-type": "application/json; charset=utf-8" },
    body: JSON.stringify(makePayload({ env, message, nowSeconds }))
  });

  if (!response.ok) {
    throw new Error(`Feishu webhook returned HTTP ${response.status}`);
  }

  const json = await response.json().catch(() => ({}));
  if (!isFeishuSuccess(json)) {
    throw new Error(`Feishu webhook rejected message: ${json?.msg || json?.StatusMessage || JSON.stringify(json)}`);
  }

  return json;
}

export async function deliverFeishuFallback({
  env = process.env,
  emailDelivery,
  message,
  fetchImpl = globalThis.fetch,
  nowSeconds
} = {}) {
  const status = getFeishuDeliveryStatus({ env });
  if (status.status !== "ready_to_send") {
    return { ...status, sent: false };
  }

  if (emailDelivery?.status === "sent") {
    return {
      ...status,
      status: "skipped",
      sent: false,
      message: "邮件已发送成功，飞书备用交付本次跳过。"
    };
  }

  try {
    await sendFeishuMessage({ env, message, fetchImpl, nowSeconds });
    return {
      ...status,
      status: "sent",
      sent: true,
      message: "飞书备用交付已发送。"
    };
  } catch (error) {
    return {
      ...status,
      status: "send_error",
      sent: false,
      message: `飞书备用交付失败：${formatDeliveryError(error)}`
    };
  }
}
