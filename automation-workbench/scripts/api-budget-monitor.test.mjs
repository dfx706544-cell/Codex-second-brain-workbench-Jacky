import assert from "node:assert/strict";
import test from "node:test";
import { checkApiBudget } from "./api-budget-monitor.mjs";

test("Micu API budget monitor stays unverified when no source is configured", async () => {
  const result = await checkApiBudget({
    env: {}
  });

  assert.equal(result.provider, "米促 API");
  assert.equal(result.status, "not_configured");
  assert.equal(result.verified, false);
  assert.match(result.message, /余额监控未配置\/待授权/);
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
});
