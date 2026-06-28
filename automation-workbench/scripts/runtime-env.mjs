import { execFileSync } from "node:child_process";

const USER_ENV_REGISTRY_KEY = "HKCU\\Environment";

function enabled(value) {
  return /^(1|true|yes|on)$/i.test(String(value || ""));
}

export function parseWindowsUserEnvRegistry(output) {
  const result = {};
  for (const line of String(output || "").split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s+REG_SZ\s+(.+?)\s*$/);
    if (!match) continue;
    result[match[1]] = match[2];
  }
  return result;
}

function readWindowsUserEnv() {
  if (process.platform !== "win32") return {};

  try {
    const output = execFileSync("reg.exe", ["query", USER_ENV_REGISTRY_KEY], {
      encoding: "utf8",
      windowsHide: true,
      stdio: ["ignore", "pipe", "ignore"]
    });
    return parseWindowsUserEnvRegistry(output);
  } catch {
    return {};
  }
}

function readJsonFallback(env) {
  if (!env.WORKBENCH_USER_ENV_JSON) return {};

  try {
    const parsed = JSON.parse(env.WORKBENCH_USER_ENV_JSON);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

export function mergeRuntimeEnv({ env = process.env, fallbackEnv = {} } = {}) {
  const result = { ...env };
  for (const [key, value] of Object.entries(fallbackEnv)) {
    if ((result[key] === undefined || result[key] === "") && value !== undefined && value !== "") {
      result[key] = value;
    }
  }
  return result;
}

export function loadRuntimeEnv({ env = process.env } = {}) {
  if (enabled(env.WORKBENCH_DISABLE_USER_ENV_FALLBACK)) {
    return { ...env };
  }

  return mergeRuntimeEnv({
    env,
    fallbackEnv: {
      ...readWindowsUserEnv(),
      ...readJsonFallback(env)
    }
  });
}
