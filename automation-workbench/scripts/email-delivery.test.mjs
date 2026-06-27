import assert from "node:assert/strict";
import test from "node:test";
import { getEmailDeliveryStatus, getMailRecipients } from "./email-delivery.mjs";

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
