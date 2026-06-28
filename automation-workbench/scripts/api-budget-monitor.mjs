const DEFAULT_THRESHOLD_CNY = 50;
const DEFAULT_MAX_REASONABLE_BALANCE_CNY = 1_000_000;
const DEFAULT_MAX_REASONABLE_QUOTA = Number.MAX_SAFE_INTEGER;

function toNumber(value) {
  if (value === undefined || value === null || value === "") return null;
  const normalized = String(value).replace(/[,\s￥¥元]/g, "");
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function cleanEnvString(value) {
  return String(value || "")
    .replace(/\uFEFF/g, "")
    .replace(/[\r\n\t]/g, "")
    .trim();
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

function findNewApiTokenUsage(json, sourceUrl = "") {
  const data = json?.data;
  if (!data || typeof data !== "object") return null;

  const urlLooksLikeTokenUsage = /\/api\/usage\/token(?:\?|$)/.test(sourceUrl);
  const isTokenUsage =
    urlLooksLikeTokenUsage ||
    data.object === "token_usage" ||
    ["total_granted", "total_used", "unlimited_quota"].some((key) =>
      Object.prototype.hasOwnProperty.call(data, key)
    );
  if (!isTokenUsage) return null;

  const totalGranted = toNumber(data.total_granted);
  const totalUsed = toNumber(data.total_used);
  const explicitAvailable = toNumber(data.total_available);
  const totalAvailable = explicitAvailable !== null
    ? explicitAvailable
    : totalGranted !== null && totalUsed !== null
      ? totalGranted - totalUsed
      : null;

  if (totalAvailable === null) return null;

  return {
    object: data.object || "token_usage",
    totalGranted,
    totalUsed,
    totalAvailable,
    unlimitedQuota: Boolean(data.unlimited_quota),
    expiresAt: data.expires_at ?? null,
    path: "data.total_available"
  };
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

function isPlausibleBalance(value) {
  return value >= 0 && value <= DEFAULT_MAX_REASONABLE_BALANCE_CNY;
}

function isPlausibleQuota(value) {
  return value >= -DEFAULT_MAX_REASONABLE_QUOTA && value <= DEFAULT_MAX_REASONABLE_QUOTA;
}

function makeTokenUsageStatus({ provider, thresholdCny, tokenUsage, sourceName, checkedAt }) {
  const quotaText = tokenUsage.unlimitedQuota
    ? "不限额/订阅口径"
    : `${tokenUsage.totalAvailable.toLocaleString("zh-CN")} 额度单位`;
  const diagnostics = tokenUsage.unlimitedQuota
    ? "平台同时返回的 total_granted/total_used 仅作为诊断字段，不按人民币余额解读。"
    : `总授予 ${tokenUsage.totalGranted === null ? "未知" : tokenUsage.totalGranted.toLocaleString("zh-CN")}，已用 ${tokenUsage.totalUsed === null ? "未知" : tokenUsage.totalUsed.toLocaleString("zh-CN")}。`;
  const base = `${provider} 当前 API key 剩余额度为 ${quotaText}（New API token_usage，可核实 key 配额，但不是钱包人民币余额）；${diagnostics}人民币余额仍需配置钱包/账单接口或 MICU_API_BALANCE_CNY，低于 ${thresholdCny} 元人民币的充值提醒暂未自动启用。`;

  return {
    provider,
    configured: true,
    verified: true,
    currencyVerified: false,
    status: tokenUsage.unlimitedQuota || tokenUsage.totalAvailable > 0 ? "quota_ok" : "quota_exhausted",
    thresholdCny,
    quotaAvailable: tokenUsage.totalAvailable,
    quotaGranted: tokenUsage.totalGranted,
    quotaUsed: tokenUsage.totalUsed,
    checkedAt,
    sources: [sourceName],
    message: tokenUsage.unlimitedQuota || tokenUsage.totalAvailable > 0
      ? base
      : `${base} 当前 key 配额已不足或为负，请到米醋 API 后台检查令牌额度、模型权限或更换有效 key。`
  };
}

function buildAuthHeader(env) {
  const key = cleanEnvString(env.MICU_API_KEY || env.MICU_API_TOKEN || "");
  if (!key) return {};

  const headerName = cleanEnvString(env.MICU_API_AUTH_HEADER || "Authorization");
  const scheme = cleanEnvString(env.MICU_API_AUTH_SCHEME ?? "Bearer");
  const value = scheme ? `${scheme} ${key}` : key;
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

  const balanceUrl = cleanEnvString(env.MICU_API_BALANCE_URL || env.MICU_API_BILLING_URL || "");
  const hasSecret = Boolean(cleanEnvString(env.MICU_API_KEY || env.MICU_API_TOKEN));
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
    const tokenUsage = findNewApiTokenUsage(json, balanceUrl);
    if (tokenUsage) {
      if (!isPlausibleQuota(tokenUsage.totalAvailable)) {
        return {
          provider,
          configured: true,
          verified: false,
          status: "error",
          thresholdCny,
          checkedAt,
          sources: [`${balanceUrl}#${tokenUsage.path}`],
          message: `API/token 监控失败：读取到的 New API key 配额字段异常（${tokenUsage.path}=${tokenUsage.totalAvailable}），未将其当作真实可用额度。`
        };
      }

      return makeTokenUsageStatus({
        provider,
        thresholdCny,
        tokenUsage,
        sourceName: `${balanceUrl}#${tokenUsage.path}`,
        checkedAt
      });
    }

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

    if (!isPlausibleBalance(found.value)) {
      return {
        provider,
        configured: true,
        verified: false,
        status: "error",
        thresholdCny,
        checkedAt,
        sources: [`${balanceUrl}#${found.path}`],
        message: `余额监控失败：读取到的余额字段异常（${found.path}=${found.value}），未将其当作真实人民币余额；请配置正确的 MICU_API_BALANCE_JSON_PATH。`
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
