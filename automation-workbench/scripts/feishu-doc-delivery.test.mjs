import assert from "node:assert/strict";
import test from "node:test";

import {
  deliverFeishuDoc,
  getFeishuDocDeliveryStatus
} from "./feishu-doc-delivery.mjs";

test("Feishu doc delivery stays explicit when app credentials are not configured", async () => {
  const result = await deliverFeishuDoc({
    env: {},
    title: "daily brief",
    markdown: "# daily brief"
  });

  assert.equal(result.status, "not_configured");
  assert.equal(result.sent, false);
  assert.match(result.message, /FEISHU_APP_ID/);
  assert.match(result.message, /FEISHU_DOC_ID/);
});

test("Feishu doc delivery can be disabled explicitly", () => {
  const result = getFeishuDocDeliveryStatus({
    env: {
      FEISHU_APP_ID: "app",
      FEISHU_APP_SECRET: "secret",
      FEISHU_DOC_ID: "doc",
      SEND_FEISHU_DOC: "false"
    }
  });

  assert.equal(result.status, "disabled");
});

test("Feishu doc delivery gets tenant token and appends today's markdown to a cloud doc", async () => {
  const calls = [];

  const result = await deliverFeishuDoc({
    env: {
      FEISHU_APP_ID: "cli_xxx",
      FEISHU_APP_SECRET: "secret",
      FEISHU_DOC_ID: "doc_token"
    },
    title: "2026-06-29 无垠每日简报",
    markdown: "# 2026-06-29 无垠每日简报\n\n正文",
    fetchImpl: async (url, options) => {
      calls.push({ url, options, body: options?.body ? JSON.parse(options.body) : null });
      if (url.endsWith("/auth/v3/tenant_access_token/internal")) {
        return {
          ok: true,
          json: async () => ({ code: 0, tenant_access_token: "tenant-token" })
        };
      }
      return {
        ok: true,
        json: async () => ({ code: 0, data: { document_id: "doc_token" } })
      };
    }
  });

  assert.equal(result.status, "sent");
  assert.equal(result.sent, true);
  assert.equal(calls.length, 2);
  assert.match(calls[0].url, /tenant_access_token/);
  assert.deepEqual(calls[0].body, { app_id: "cli_xxx", app_secret: "secret" });
  assert.match(calls[1].url, /documents\/doc_token\/blocks\/doc_token\/children/);
  assert.equal(calls[1].options.headers.Authorization, "Bearer tenant-token");
  assert.equal(calls[1].body.children[0].block_type, 2);
  assert.match(calls[1].body.children[0].text.elements[0].text_run.content, /2026-06-29/);
});
