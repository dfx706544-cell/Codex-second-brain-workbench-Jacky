const DEFAULT_THRESHOLD_CNY = 50;

function toNumber(value) {
  if (value === undefined || value === null || value === "") return null;
  const normalized = String(value).replace(/[,\s￥¥元]/g, "");
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function getPathValue(object, pathExpression) {
  if (!pathExpression) return undefined;
  return pathExpression.split(".").reduce((current, key) => {
    if (current && Object.prototype.hasOwnProperty.call(current, key)) {
      return current[key];
    }
    return undefined;
  }, object);
}

function findLikelyBalance(json) {
  const candidates = [
    "balance_cny",
    "remaining_cny",
    "available_cny",
    "credit_cny",
    "balance",
    "remaining",
    "available",
    "credit",
    "data.balance_cny",
    "data.remaining_cny",
    "data.available_cny",
    "data.credit_cny",
    "data.balance",
    "data.remaining",
    "data.available",
    "data.credit",
    "result.balance_cny",
    "result.remaining_cny",
    "result.balance",
    "result.remaining"
  ];

  for (const candidate of candidates) {
    const value = toNumber(getPathValue(json, candidate));
    if (value !== null) return { value, path: candidate };
  }

  return null;
}

function makeStatus({ provider, thresholdCny, remainingCny, sourceName, checkedAt }) {
  if (remainingCny < thresholdCny) {
    return {
      provider,
      configured: true,
      verified: true,
      status: "low_balance",
      thresholdCny,
      remainingCny,
      checkedAt,
      sources: [sourceName],
      message: `${provider} 当前可核实余额为 ${remainingCny.toFixed(2)} 元，低于 ${thresholdCny} 元人民币，请尽快充值。`
    };
  }

  return {
    provider,
    configured: true,
    verified: true,
    status: "ok",
    thresholdCny,
    remainingCny,
    checkedAt,
    sources: [sourceName],
    message: `${provider} 当前可核实余额为 ${remainingCny.toFixed(2)} 元，高于 ${thresholdCny} 元人民币提醒线。`
  };
}

function buildAuthHeader(env) {
  const key = env.MICU_API_KEY || env.MICU_API_TOKEN || "";
  if (!key) return {};

  const headerName = env.MICU_API_AUTH_HEADER || "Authorization";
  const scheme = env.MICU_API_AUTH_SCHEME ?? "Bearer";
  const value = scheme.trim() ? `${scheme.trim()} ${key}` : key;
  return { [headerName]: value };
}

export async function checkApiBudget({ env = process.env, fetchImpl = globalThis.fetch } = {}) {
  const provider = env.MICU_API_PROVIDER_NAME || "米促 API";
  const thresholdCny = toNumber(env.MICU_API_LOW_BALANCE_CNY) ?? DEFAULT_THRESHOLD_CNY;
  const checkedAt = new Date().toISOString();

  const directBalance = toNumber(env.MICU_API_BALANCE_CNY);
  if (directBalance !== null) {
    return makeStatus({
      provider,
      thresholdCny,
      remainingCny: directBalance,
      sourceName: "MICU_API_BALANCE_CNY",
      checkedAt
    });
  }

  const balanceUrl = env.MICU_API_BALANCE_URL || env.MICU_API_BILLING_URL || "";
  const hasSecret = Boolean(env.MICU_API_KEY || env.MICU_API_TOKEN);
  if (!balanceUrl || !hasSecret) {
    return {
      provider,
      configured: false,
      verified: false,
      status: "not_configured",
      thresholdCny,
      checkedAt,
      sources: [],
      message: "余额监控未配置/待授权：请配置米促 API 的余额查询地址和密钥；未核实前不编造金额。"
    };
  }

  if (typeof fetchImpl !== "function") {
    return {
      provider,
      configured: true,
      verified: false,
      status: "error",
      thresholdCny,
      checkedAt,
      sources: [balanceUrl],
      message: "余额监控失败：当前 Node 环境没有 fetch，无法查询米促 API 余额。"
    };
  }

  try {
    const response = await fetchImpl(balanceUrl, {
      headers: {
        Accept: "application/json",
        ...buildAuthHeader(env)
      }
    });

    if (!response.ok) {
      return {
        provider,
        configured: true,
        verified: false,
        status: "error",
        thresholdCny,
        checkedAt,
        sources: [balanceUrl],
        message: `余额监控失败：米促 API 返回 HTTP ${response.status}，未读取到可核实余额。`
      };
    }

    const json = await response.json();
    const explicitPath = env.MICU_API_BALANCE_JSON_PATH || "";
    const explicitValue = explicitPath ? toNumber(getPathValue(json, explicitPath)) : null;
    const found = explicitValue !== null ? { value: explicitValue, path: explicitPath } : findLikelyBalance(json);

    if (!found) {
      return {
        provider,
        configured: true,
        verified: false,
        status: "error",
        thresholdCny,
        checkedAt,
        sources: [balanceUrl],
        message: "余额监控失败：米促 API 返回了数据，但没有找到余额字段；请配置 MICU_API_BALANCE_JSON_PATH。"
      };
    }

    return makeStatus({
      provider,
      thresholdCny,
      remainingCny: found.value,
      sourceName: `${balanceUrl}#${found.path}`,
      checkedAt
    });
  } catch (error) {
    return {
      provider,
      configured: true,
      verified: false,
      status: "error",
      thresholdCny,
      checkedAt,
      sources: [balanceUrl],
      message: `余额监控失败：${error.message}`
    };
  }
}
