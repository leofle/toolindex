import * as fs from "fs";
import * as path from "path";
import chalk from "chalk";
import { validateManifest } from "@toolindex/validator";

export async function validate(target?: string): Promise<void> {
  const filePath = target || path.join(process.cwd(), ".well-known", "webmcp.json");

  let raw: string;

  if (target && target.startsWith("http")) {
    try {
      const res = await fetch(target);
      if (!res.ok) {
        console.error(chalk.red(`\u2718 Failed to fetch ${target}: ${res.status} ${res.statusText}`));
        process.exit(1);
      }
      raw = await res.text();
    } catch (err: any) {
      console.error(chalk.red(`\u2718 Network error: ${err.message}`));
      process.exit(1);
    }
  } else {
    const resolved = path.resolve(filePath);
    if (!fs.existsSync(resolved)) {
      console.error(chalk.red(`\u2718 File not found: ${resolved}`));
      process.exit(1);
    }
    raw = fs.readFileSync(resolved, "utf-8");
  }

  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    console.error(chalk.red("\u2718 Invalid JSON"));
    process.exit(1);
  }

  const result = validateManifest(data);

  if (result.valid) {
    const toolCount = result.manifest?.tools?.length ?? 0;
    console.log(chalk.green(`\u2714 Valid WebMCP manifest (${toolCount} tool${toolCount !== 1 ? "s" : ""})`));
    process.exit(0);
  } else {
    console.error(chalk.red("\u2718 Invalid WebMCP manifest:"));
    for (const err of result.errors) {
      console.error(chalk.red(`  - ${err.path}: ${err.message}`));
    }
    process.exit(1);
  }
}
