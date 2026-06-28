import assert from "node:assert/strict";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";

test("open-workbench launcher avoids slow manual desktop port scans", async () => {
  const source = await readFile(new URL("./open-workbench.ps1", import.meta.url), "utf8");

  assert.match(source, /Get-WorkbenchBridgeHealth/);
  assert.match(source, /\$FallbackPorts\s*=\s*@\(8787\)/);
  assert.match(source, /Start-Process -FilePath \$Node/);
  assert.doesNotMatch(source, /8787\.\.8806/);
  assert.doesNotMatch(source, /System\.Net\.Sockets\.TcpClient/);
});

test("desktop launcher records open-workbench timing for visible diagnosis", async () => {
  const source = await readFile(new URL("./start-workbench-desktop.ps1", import.meta.url), "utf8");

  assert.match(source, /Open workbench resolved in/);
  assert.match(source, /\$OpenTimer\s*=\s*\[Diagnostics\.Stopwatch\]::StartNew\(\)/);
});

test("autostart installer keeps the local bridge available for fixed browser bookmarks", async () => {
  const source = await readFile(new URL("./install-workbench-autostart.ps1", import.meta.url), "utf8");

  assert.match(source, /Register-ScheduledTask/);
  assert.match(source, /WuyinSecondBrainWorkbenchBridge/);
  assert.match(source, /New-ScheduledTaskTrigger -AtLogOn/);
  assert.match(source, /GetFolderPath\("Startup"\)/);
  assert.match(source, /CreateShortcut/);
  assert.match(source, /open-workbench\.ps1/);
  assert.match(source, /-NoBrowser/);
  assert.match(source, /PT5M/);
});

test("port alias redirects old fixed browser bookmarks to the current bridge", async () => {
  const workspaceRoot = await mkdtemp(path.join(process.cwd(), "automation-workbench", ".tmp", "port-alias-"));
  const workbenchRoot = path.join(workspaceRoot, "automation-workbench");
  await mkdir(path.join(workbenchRoot, "queue"), { recursive: true });
  await writeFile(
    path.join(workbenchRoot, "queue", "bridge-status.json"),
    JSON.stringify({ baseUrl: "http://127.0.0.1:59999" }, null, 2),
    "utf8"
  );

  const { createWorkbenchPortAlias } = await import("./workbench-port-alias.mjs");
  const alias = createWorkbenchPortAlias({
    workbenchRoot,
    host: "127.0.0.1",
    ports: [0]
  });

  try {
    const started = await alias.start();
    assert.equal(started.length, 1);
    const response = await fetch(`http://127.0.0.1:${started[0].port}/automation-workbench/app/?from=old`, {
      redirect: "manual"
    });

    assert.equal(response.status, 302);
    assert.equal(
      response.headers.get("location"),
      "http://127.0.0.1:59999/automation-workbench/app/?from=old"
    );
  } finally {
    await alias.stop();
    await rm(workspaceRoot, { recursive: true, force: true });
  }
});

test("open-workbench starts the old-port alias helper", async () => {
  const source = await readFile(new URL("./open-workbench.ps1", import.meta.url), "utf8");

  assert.match(source, /workbench-port-alias\.mjs/);
  assert.match(source, /Start-WorkbenchPortAlias/);
  assert.match(source, /8788,8800/);
});

test("codex queue runner launcher supports safe watch mode", async () => {
  const source = await readFile(new URL("./start-codex-queue-runner.ps1", import.meta.url), "utf8");

  assert.match(source, /workbench-codex-runner\.mjs/);
  assert.match(source, /\[switch\]\$Watch/);
  assert.match(source, /\[switch\]\$Execute/);
  assert.match(source, /\[switch\]\$AllowSensitive/);
  assert.match(source, /--queue/);
  assert.match(source, /--workspace/);
});
