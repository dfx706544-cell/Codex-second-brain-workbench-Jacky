import assert from "node:assert/strict";
import test from "node:test";
import { getEmailDeliveryStatus } from "./email-delivery.mjs";

test("email delivery is draft-only when SMTP secrets are missing", () => {
  const result = getEmailDeliveryStatus({ env: {} });

  assert.equal(result.status, "draft_only");
  assert.equal(result.configured, false);
  assert.match(result.message, /SMTP 未配置/);
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
});
