import assert from "node:assert/strict";
import test from "node:test";
import { checkApiBudget } from "./api-budget-monitor.mjs";

const MOJIBAKE_PATTERN = /鏈|閭|绋|俙|€|�/;

test("Micu API budget monitor stays unverified when no source is configured", async () => {
  const result = await checkApiBudget({
    env: {}
  });

  assert.equal(result.provider, "米促 API");
  assert.equal(result.status, "not_configured");
  assert.equal(result.verified, false);
  assert.match(result.message, /余额监控未配置\/待授权/);
  assert.doesNotMatch(result.message, MOJIBAKE_PATTERN);
});

test("Micu API budget monitor flags direct verified balance below threshold", async () => {
  const result = await checkApiBudget({
    env: {
      MICU_API_BALANCE_CNY: "49.99"
    }
  });

  assert.equal(result.status, "low_balance");
  assert.equal(result.verified, true);
  assert.equal(result.remainingCny, 49.99);
  assert.match(result.message, /请尽快充值/);
  assert.doesNotMatch(result.message, MOJIBAKE_PATTERN);
});

test("Micu API budget monitor reads balance from configured JSON path", async () => {
  const result = await checkApiBudget({
    env: {
      MICU_API_BALANCE_URL: "https://example.test/api/balance",
      MICU_API_KEY: "secret",
      MICU_API_BALANCE_JSON_PATH: "data.remaining_cny"
    },
    fetchImpl: async () => ({
      ok: true,
      json: async () => ({ data: { remaining_cny: "88.8" } })
    })
  });

  assert.equal(result.status, "ok");
  assert.equal(result.verified, true);
  assert.equal(result.remainingCny, 88.8);
  assert.match(result.sources[0], /data\.remaining_cny/);
  assert.match(result.message, /高于 50 元人民币提醒线/);
});

test("Micu API budget monitor strips hidden characters from URL and auth header", async () => {
  let requestedUrl = "";
  let requestedHeaders = {};

  const result = await checkApiBudget({
    env: {
      MICU_API_BALANCE_URL: "\uFEFFhttps://example.test/api/balance\n",
      MICU_API_KEY: "\uFEFFsecret-key\r\n",
      MICU_API_AUTH_HEADER: "\uFEFFAuthorization\n",
      MICU_API_AUTH_SCHEME: "\uFEFFBearer\n",
      MICU_API_BALANCE_JSON_PATH: "data.total_available"
    },
    fetchImpl: async (url, options) => {
      requestedUrl = url;
      requestedHeaders = options.headers;
      return {
        ok: true,
        json: async () => ({ data: { total_available: "188.8" } })
      };
    }
  });

  assert.equal(requestedUrl, "https://example.test/api/balance");
  assert.equal(requestedHeaders.Authorization, "Bearer secret-key");
  assert.equal(result.status, "ok");
  assert.equal(result.remainingCny, 188.8);
});

test("Micu API budget monitor treats implausible balance values as unverified", async () => {
  const result = await checkApiBudget({
    env: {
      MICU_API_BALANCE_URL: "https://example.test/api/balance",
      MICU_API_KEY: "secret",
      MICU_API_BALANCE_JSON_PATH: "data.total_available"
    },
    fetchImpl: async () => ({
      ok: true,
      json: async () => ({ data: { total_available: "-656253962" } })
    })
  });

  assert.equal(result.status, "error");
  assert.equal(result.verified, false);
  assert.match(result.message, /余额字段异常/);
  assert.doesNotMatch(result.message, /请尽快充值/);
});

test("Micu API budget monitor recognizes New API token usage as quota, not RMB balance", async () => {
  const result = await checkApiBudget({
    env: {
      MICU_API_PROVIDER_NAME: "米醋 API",
      MICU_API_BALANCE_URL: "https://www.micuapi.ai/api/usage/token",
      MICU_API_KEY: "secret",
      MICU_API_BALANCE_JSON_PATH: "data.total_available"
    },
    fetchImpl: async () => ({
      ok: true,
      json: async () => ({
        data: {
          object: "token_usage",
          total_granted: 1000000,
          total_used: 420000,
          total_available: 580000,
          unlimited_quota: false
        }
      })
    })
  });

  assert.equal(result.status, "quota_ok");
  assert.equal(result.verified, true);
  assert.equal(result.currencyVerified, false);
  assert.equal(result.quotaAvailable, 580000);
  assert.match(result.message, /New API token_usage/);
  assert.match(result.message, /不是钱包人民币余额/);
  assert.doesNotMatch(result.message, /请尽快充值/);
});

test("Micu API budget monitor flags exhausted New API token usage without treating it as low RMB balance", async () => {
  const result = await checkApiBudget({
    env: {
      MICU_API_PROVIDER_NAME: "米醋 API",
      MICU_API_BALANCE_URL: "https://www.micuapi.ai/api/usage/token",
      MICU_API_KEY: "secret",
      MICU_API_BALANCE_JSON_PATH: "data.total_available"
    },
    fetchImpl: async () => ({
      ok: true,
      json: async () => ({
        data: {
          object: "token_usage",
          total_granted: 1000000,
          total_used: 1200000,
          total_available: -200000,
          unlimited_quota: false
        }
      })
    })
  });

  assert.equal(result.status, "quota_exhausted");
  assert.equal(result.verified, true);
  assert.equal(result.currencyVerified, false);
  assert.equal(result.quotaAvailable, -200000);
  assert.match(result.message, /key 配额已不足或为负/);
  assert.doesNotMatch(result.message, /低于 50 元人民币，请尽快充值/);
});
