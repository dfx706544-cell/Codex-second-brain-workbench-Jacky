import assert from "node:assert/strict";
import test from "node:test";

import {
  buildFeishuSignature,
  deliverFeishuFallback,
  getFeishuDeliveryStatus
} from "./feishu-delivery.mjs";

test("Feishu fallback stays explicit when webhook is not configured", async () => {
  const result = await deliverFeishuFallback({
    env: {},
    emailDelivery: { status: "send_error", message: "SMTP timeout" },
    message: "日报摘要"
  });

  assert.equal(result.status, "not_configured");
  assert.equal(result.sent, false);
  assert.match(result.message, /FEISHU_WEBHOOK_URL/);
});

test("Feishu fallback skips when email was already sent", async () => {
  const result = await deliverFeishuFallback({
    env: { FEISHU_WEBHOOK_URL: "https://open.feishu.cn/open-apis/bot/v2/hook/test" },
    emailDelivery: { status: "sent" },
    message: "日报摘要"
  });

  assert.equal(result.status, "skipped");
  assert.equal(result.sent, false);
});

test("Feishu fallback sends a text message through configured webhook", async () => {
  let requestedUrl = "";
  let requestedBody = {};

  const result = await deliverFeishuFallback({
    env: { FEISHU_WEBHOOK_URL: "https://open.feishu.cn/open-apis/bot/v2/hook/test" },
    emailDelivery: { status: "send_error", message: "SMTP timeout" },
    message: "日报摘要",
    fetchImpl: async (url, options) => {
      requestedUrl = url;
      requestedBody = JSON.parse(options.body);
      return {
        ok: true,
        json: async () => ({ code: 0, msg: "success" })
      };
    }
  });

  assert.equal(requestedUrl, "https://open.feishu.cn/open-apis/bot/v2/hook/test");
  assert.equal(requestedBody.msg_type, "text");
  assert.equal(requestedBody.content.text, "日报摘要");
  assert.equal(result.status, "sent");
  assert.equal(result.sent, true);
});

test("Feishu fallback supports signed custom bots", async () => {
  let requestedBody = {};

  await deliverFeishuFallback({
    env: {
      FEISHU_WEBHOOK_URL: "https://open.feishu.cn/open-apis/bot/v2/hook/test",
      FEISHU_WEBHOOK_SECRET: "secret"
    },
    emailDelivery: { status: "send_error" },
    message: "日报摘要",
    nowSeconds: () => 1700000000,
    fetchImpl: async (_url, options) => {
      requestedBody = JSON.parse(options.body);
      return {
        ok: true,
        json: async () => ({ StatusCode: 0, StatusMessage: "success" })
      };
    }
  });

  assert.equal(requestedBody.timestamp, "1700000000");
  assert.equal(requestedBody.sign, buildFeishuSignature("1700000000", "secret"));
});

test("Feishu status can be disabled explicitly", () => {
  const result = getFeishuDeliveryStatus({
    env: {
      FEISHU_WEBHOOK_URL: "https://open.feishu.cn/open-apis/bot/v2/hook/test",
      SEND_FEISHU: "false"
    }
  });

  assert.equal(result.status, "disabled");
});
