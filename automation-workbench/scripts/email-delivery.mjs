import net from "node:net";
import tls from "node:tls";

const REQUIRED_SMTP_ENV = ["SMTP_HOST", "SMTP_PORT", "SMTP_USER", "SMTP_PASS", "MAIL_TO", "MAIL_FROM"];

function enabled(value) {
  return /^(1|true|yes|on)$/i.test(String(value || ""));
}

function encodeHeader(value) {
  return `=?UTF-8?B?${Buffer.from(value, "utf8").toString("base64")}?=`;
}

function normalizeLines(value) {
  return String(value || "").replace(/\r?\n/g, "\r\n");
}

function makeMimeMessage({ from, to, subject, body }) {
  return [
    `From: ${from}`,
    `To: ${to}`,
    `Subject: ${encodeHeader(subject)}`,
    "MIME-Version: 1.0",
    "Content-Type: text/plain; charset=UTF-8",
    "Content-Transfer-Encoding: base64",
    "",
    Buffer.from(normalizeLines(body), "utf8").toString("base64").replace(/.{1,76}/g, "$&\r\n")
  ].join("\r\n");
}

function readLine(socket) {
  return new Promise((resolve, reject) => {
    let buffer = "";
    const onData = (chunk) => {
      buffer += chunk.toString("utf8");
      const lines = buffer.split(/\r?\n/).filter(Boolean);
      const last = lines.at(-1) || "";
      if (/^\d{3}\s/.test(last)) {
        socket.off("data", onData);
        socket.off("error", reject);
        resolve(buffer);
      }
    };
    socket.on("data", onData);
    socket.once("error", reject);
  });
}

async function command(socket, text, expectedPrefix) {
  if (text) socket.write(`${text}\r\n`);
  const response = await readLine(socket);
  if (!response.startsWith(expectedPrefix)) {
    throw new Error(`SMTP command failed: expected ${expectedPrefix}, got ${response.trim()}`);
  }
  return response;
}

async function connectSmtp({ host, port, secure }) {
  return new Promise((resolve, reject) => {
    const socket = secure
      ? tls.connect({ host, port, servername: host }, () => resolve(socket))
      : net.connect({ host, port }, () => resolve(socket));
    socket.once("error", reject);
  });
}

export function getEmailDeliveryStatus({ env = process.env } = {}) {
  const missing = REQUIRED_SMTP_ENV.filter((name) => !env[name]);
  const sendEnabled = enabled(env.SEND_EMAIL);

  if (missing.length > 0) {
    return {
      configured: false,
      sendEnabled,
      status: "draft_only",
      missing,
      message: `SMTP 未配置，当前为草稿模式；缺少 ${missing.join(", ")}。`
    };
  }

  if (!sendEnabled) {
    return {
      configured: true,
      sendEnabled: false,
      status: "draft_only",
      missing: [],
      message: "SMTP 已配置，但 SEND_EMAIL 未开启，当前为草稿模式。"
    };
  }

  return {
    configured: true,
    sendEnabled: true,
    status: "ready_to_send",
    missing: [],
    message: "SMTP 已配置且 SEND_EMAIL=true，云端 runner 将尝试发送邮件。"
  };
}

export async function sendSmtpMail({ env = process.env, subject, body }) {
  const host = env.SMTP_HOST;
  const port = Number(env.SMTP_PORT || 465);
  const secure = env.SMTP_SECURE ? enabled(env.SMTP_SECURE) : port === 465;
  const from = env.MAIL_FROM;
  const to = env.MAIL_TO;
  const socket = await connectSmtp({ host, port, secure });

  try {
    await command(socket, "", "220");
    await command(socket, `EHLO ${env.SMTP_EHLO_DOMAIN || "second-brain-workbench.local"}`, "250");
    await command(socket, "AUTH LOGIN", "334");
    await command(socket, Buffer.from(env.SMTP_USER, "utf8").toString("base64"), "334");
    await command(socket, Buffer.from(env.SMTP_PASS, "utf8").toString("base64"), "235");
    await command(socket, `MAIL FROM:<${from}>`, "250");
    await command(socket, `RCPT TO:<${to}>`, "250");
    await command(socket, "DATA", "354");
    socket.write(`${makeMimeMessage({ from, to, subject, body })}\r\n.\r\n`);
    await command(socket, "", "250");
    await command(socket, "QUIT", "221");
  } finally {
    socket.end();
  }
}

export async function deliverDraftEmails({ env = process.env, drafts = [] } = {}) {
  const status = getEmailDeliveryStatus({ env });
  if (status.status !== "ready_to_send") {
    return {
      ...status,
      sent: [],
      failed: []
    };
  }

  const sent = [];
  const failed = [];
  for (const draft of drafts) {
    try {
      await sendSmtpMail({ env, subject: draft.subject, body: draft.body });
      sent.push(draft.kind || draft.subject);
    } catch (error) {
      failed.push({
        kind: draft.kind || draft.subject,
        error: error.message
      });
    }
  }

  return {
    ...status,
    status: failed.length ? "send_error" : "sent",
    message: failed.length
      ? `邮件发送遇到错误：${failed.map((item) => `${item.kind}: ${item.error}`).join("; ")}`
      : `已发送 ${sent.length} 封邮件到 ${env.MAIL_TO}。`,
    sent,
    failed
  };
}
