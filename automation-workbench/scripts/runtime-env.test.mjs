import assert from "node:assert/strict";
import test from "node:test";
import { loadRuntimeEnv, mergeRuntimeEnv, parseWindowsUserEnvRegistry } from "./runtime-env.mjs";

test("runtime env fills missing values from user-level fallback", () => {
  const result = mergeRuntimeEnv({
    env: {
      SMTP_HOST: "",
      SMTP_PORT: "465",
      SEND_EMAIL: "false"
    },
    fallbackEnv: {
      SMTP_HOST: "smtp.163.com",
      SMTP_PORT: "25",
      SMTP_USER: "jacky060911@163.com",
      SEND_EMAIL: "true"
    }
  });

  assert.equal(result.SMTP_HOST, "smtp.163.com");
  assert.equal(result.SMTP_PORT, "465");
  assert.equal(result.SMTP_USER, "jacky060911@163.com");
  assert.equal(result.SEND_EMAIL, "false");
});

test("runtime env can read fallback values from a JSON override", () => {
  const result = loadRuntimeEnv({
    env: {
      WORKBENCH_USER_ENV_JSON: JSON.stringify({
        MAIL_FROM: "jacky060911@163.com",
        MAIL_TO: "jacky060911@163.com,liu13922830178@outlook.com"
      })
    }
  });

  assert.equal(result.MAIL_FROM, "jacky060911@163.com");
  assert.equal(result.MAIL_TO, "jacky060911@163.com,liu13922830178@outlook.com");
});

test("runtime env can be disabled for isolated tests", () => {
  const result = loadRuntimeEnv({
    env: {
      WORKBENCH_DISABLE_USER_ENV_FALLBACK: "true",
      WORKBENCH_USER_ENV_JSON: JSON.stringify({
        SMTP_HOST: "smtp.163.com"
      })
    }
  });

  assert.equal(result.SMTP_HOST, undefined);
});

test("Windows registry parser extracts configured user env values", () => {
  const parsed = parseWindowsUserEnvRegistry(`
HKEY_CURRENT_USER\\Environment
    SMTP_HOST    REG_SZ    smtp.163.com
    MAIL_TO    REG_SZ    jacky060911@163.com,liu13922830178@outlook.com
    Path    REG_EXPAND_SZ    %USERPROFILE%\\bin
`);

  assert.equal(parsed.SMTP_HOST, "smtp.163.com");
  assert.equal(parsed.MAIL_TO, "jacky060911@163.com,liu13922830178@outlook.com");
  assert.equal(parsed.Path, undefined);
});
