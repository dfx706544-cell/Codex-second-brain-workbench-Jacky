import { cp, mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const WORKBENCH_ROOT = path.dirname(SCRIPT_DIR);
const WORKSPACE_ROOT = path.dirname(WORKBENCH_ROOT);
const DEFAULT_OUTPUT_ROOT = path.join(WORKSPACE_ROOT, ".pages-site");

function parseArgs(argv) {
  const options = { out: DEFAULT_OUTPUT_ROOT };
  for (let index = 0; index < argv.length; index += 1) {
    if (argv[index] === "--out") {
      options.out = path.resolve(argv[index + 1]);
      index += 1;
    }
  }
  return options;
}

async function copyPublicApp(outputRoot) {
  const sourceApp = path.join(WORKBENCH_ROOT, "app");
  const targetApp = path.join(outputRoot, "automation-workbench", "app");
  await mkdir(targetApp, { recursive: true });

  for (const fileName of [
    "index.html",
    "styles.css",
    "modules.js",
    "queue-state.js",
    "app.js",
    "hover-translate.js"
  ]) {
    await cp(path.join(sourceApp, fileName), path.join(targetApp, fileName));
  }
}

async function writeRootRedirect(outputRoot) {
  await writeFile(path.join(outputRoot, "index.html"), `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>第二大脑自动化工作台</title>
  <meta http-equiv="refresh" content="0; url=automation-workbench/app/">
  <link rel="canonical" href="automation-workbench/app/">
</head>
<body>
  <p><a href="automation-workbench/app/">打开第二大脑自动化工作台</a></p>
</body>
</html>
`, "utf8");
}

const { out } = parseArgs(process.argv.slice(2));
await rm(out, { recursive: true, force: true });
await mkdir(out, { recursive: true });
await writeRootRedirect(out);
await copyPublicApp(out);

console.log(`Cloud share site built at ${out}`);
