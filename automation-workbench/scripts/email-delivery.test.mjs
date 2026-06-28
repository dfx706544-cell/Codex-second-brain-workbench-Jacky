import assert from "node:assert/strict";
import test from "node:test";
import { deliverDraftEmails, getEmailDeliveryStatus, getMailRecipients, sendSmtpMail } from "./email-delivery.mjs";

const MOJIBAKE_PATTERN = /鏈|閭|绋|俙|€|�/;

test("email delivery is draft-only when SMTP secrets are missing", () => {
  const result = getEmailDeliveryStatus({ env: {} });

  assert.equal(result.status, "draft_only");
  assert.equal(result.configured, false);
  assert.match(result.message, /SMTP 未配置/);
  assert.doesNotMatch(result.message, MOJIBAKE_PATTERN);
});

test("email delivery stays draft-only until SEND_EMAIL is enabled", () => {
  const result = getEmailDeliveryStatus({
    env: {
      SMTP_HOST: "smtp.163.com",
      SMTP_PORT: "465",
      SMTP_USER: "jacky060911@163.com",
      SMTP_PASS: "secret",
      MAIL_TO: "jacky060911@163.com",
      MAIL_FROM: "jacky060911@163.com",
      SEND_EMAIL: "false"
    }
  });

  assert.equal(result.status, "draft_only");
  assert.equal(result.configured, true);
  assert.match(result.message, /SEND_EMAIL 未开启/);
  assert.doesNotMatch(result.message, MOJIBAKE_PATTERN);
});

test("email delivery becomes ready when SMTP is configured and sending is enabled", () => {
  const result = getEmailDeliveryStatus({
    env: {
      SMTP_HOST: "smtp.163.com",
      SMTP_PORT: "465",
      SMTP_USER: "jacky060911@163.com",
      SMTP_PASS: "secret",
      MAIL_TO: "jacky060911@163.com",
      MAIL_FROM: "jacky060911@163.com",
      SEND_EMAIL: "true"
    }
  });

  assert.equal(result.status, "ready_to_send");
  assert.equal(result.configured, true);
  assert.equal(result.sendEnabled, true);
  assert.match(result.message, /准备发送/);
  assert.doesNotMatch(result.message, MOJIBAKE_PATTERN);
});

test("email delivery supports multiple recipients", () => {
  const recipients = getMailRecipients({
    MAIL_TO: "jacky060911@163.com, liu13922830178@outlook.com"
  });

  assert.deepEqual(recipients, [
    "jacky060911@163.com",
    "liu13922830178@outlook.com"
  ]);
});

test("email delivery accepts fallback recipients for cloud automation", () => {
  const result = getEmailDeliveryStatus({
    env: {
      SMTP_HOST: "smtp.163.com",
      SMTP_PORT: "465",
      SMTP_USER: "jacky060911@163.com",
      SMTP_PASS: "secret",
      MAIL_TO_FALLBACK: "jacky060911@163.com,liu13922830178@outlook.com",
      MAIL_FROM: "jacky060911@163.com",
      SEND_EMAIL: "true"
    }
  });

  assert.equal(result.status, "ready_to_send");
  assert.deepEqual(getMailRecipients({
    MAIL_TO_FALLBACK: "jacky060911@163.com,liu13922830178@outlook.com"
  }), [
    "jacky060911@163.com",
    "liu13922830178@outlook.com"
  ]);
});

test("email delivery strips hidden characters before SMTP auth", async () => {
  const writes = [];
  const responses = [
    "220 smtp.test ESMTP ready\r\n",
    "250 smtp.test\r\n",
    "334 VXNlcm5hbWU6\r\n",
    "334 UGFzc3dvcmQ6\r\n",
    "235 Authentication successful\r\n",
    "250 Mail OK\r\n",
    "250 Recipient OK\r\n",
    "354 End data with <CR><LF>.<CR><LF>\r\n",
    "250 Message accepted\r\n",
    "221 Bye\r\n"
  ];

  const fakeSocket = {
    write(text) {
      writes.push(text);
      queueMicrotask(() => this.handlers.data?.(Buffer.from(responses.shift(), "utf8")));
    },
    on(event, handler) {
      this.handlers[event] = handler;
      if (event === "data" && writes.length === 0) {
        queueMicrotask(() => this.handlers.data?.(Buffer.from(responses.shift(), "utf8")));
      }
      return this;
    },
    once(event, handler) {
      this.handlers[event] = handler;
      return this;
    },
    off(event) {
      delete this.handlers[event];
      return this;
    },
    end() {},
    handlers: {}
  };

  await sendSmtpMail({
    env: {
      SMTP_HOST: "smtp.test",
      SMTP_PORT: "465",
      SMTP_USER: "\uFEFFjacky060911@163.com\n",
      SMTP_PASS: "\uFEFFauth-code\r\n",
      MAIL_TO: "jacky060911@163.com",
      MAIL_FROM: "\uFEFFjacky060911@163.com\n",
      SMTP_SECURE: "true"
    },
    subject: "测试",
    body: "测试内容",
    connectImpl: async () => fakeSocket
  });

  assert.ok(writes.includes(`${Buffer.from("jacky060911@163.com", "utf8").toString("base64")}\r\n`));
  assert.ok(writes.includes(`${Buffer.from("auth-code", "utf8").toString("base64")}\r\n`));
  assert.ok(writes.includes("MAIL FROM:<jacky060911@163.com>\r\n"));
});

test("email delivery reports useful error text for empty SMTP failures", async () => {
  const result = await deliverDraftEmails({
    env: {
      SMTP_HOST: "smtp.163.com",
      SMTP_PORT: "465",
      SMTP_USER: "jacky060911@163.com",
      SMTP_PASS: "secret",
      MAIL_TO: "jacky060911@163.com",
      MAIL_FROM: "jacky060911@163.com",
      SEND_EMAIL: "true"
    },
    drafts: [
      { kind: "daily brief", subject: "测试", body: "测试" }
    ],
    sendImpl: async () => {
      throw new Error("");
    }
  });

  assert.equal(result.status, "send_error");
  assert.match(result.failed[0].error, /Unknown SMTP delivery error/);
  assert.match(result.message, /Unknown SMTP delivery error/);
});
