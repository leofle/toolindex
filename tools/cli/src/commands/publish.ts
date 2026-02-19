import chalk from "chalk";

const API_BASE = "https://toolindex-api-production.up.railway.app";

export async function publish(origin?: string): Promise<void> {
  if (!origin) {
    console.error(chalk.red("\u2718 Usage: webmcp publish <origin>"));
    console.error(chalk.dim("  Example: webmcp publish https://example.com"));
    process.exit(1);
  }

  console.log(chalk.dim(`Submitting ${origin} to registry...`));

  try {
    const res = await fetch(`${API_BASE}/submit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ origin }),
    });

    const data = (await res.json()) as Record<string, any>;

    if (data.status === "verified") {
      const toolCount = data.tool_count ?? 0;
      console.log(chalk.green(`\u2714 Verified — ${toolCount} tool${toolCount !== 1 ? "s" : ""} registered`));
      process.exit(0);
    } else if (data.status === "invalid") {
      console.error(chalk.red(`\u2718 Invalid manifest at ${origin}`));
      if (data.errors?.length) {
        for (const err of data.errors) {
          console.error(chalk.red(`  - ${err}`));
        }
      }
      process.exit(1);
    } else {
      console.log(chalk.yellow(`Status: ${data.status}`));
      if (data.errors?.length) {
        for (const err of data.errors) {
          console.error(chalk.red(`  - ${err}`));
        }
      }
      process.exit(data.status === "verified" ? 0 : 1);
    }
  } catch (err: any) {
    console.error(chalk.red(`\u2718 Network error: ${err.message}`));
    process.exit(1);
  }
}
