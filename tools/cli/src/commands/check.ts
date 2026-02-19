import chalk from "chalk";

const API_BASE = "https://toolindex-api-production.up.railway.app";

export async function check(origin?: string): Promise<void> {
  if (!origin) {
    console.error(chalk.red("\u2718 Usage: webmcp check <origin>"));
    console.error(chalk.dim("  Example: webmcp check https://example.com"));
    process.exit(1);
  }

  console.log(chalk.dim(`Checking ${origin}...`));

  try {
    const res = await fetch(`${API_BASE}/verify?origin=${encodeURIComponent(origin)}`);

    if (res.status === 404) {
      console.error(chalk.yellow(`\u2718 Origin not found in registry: ${origin}`));
      process.exit(1);
    }

    const data = (await res.json()) as Record<string, any>;

    const status = data.status ?? "unknown";
    const statusColor = status === "verified" ? chalk.green : status === "invalid" ? chalk.red : chalk.yellow;

    console.log(`  Status:       ${statusColor(status)}`);

    if (data.last_checked) {
      console.log(`  Last checked: ${chalk.dim(data.last_checked)}`);
    }

    if (data.tool_count != null) {
      console.log(`  Tools:        ${data.tool_count}`);
    }

    if (data.attested != null) {
      console.log(`  Attested:     ${data.attested ? chalk.green("yes") : chalk.dim("no")}`);
    }

    process.exit(status === "verified" ? 0 : 1);
  } catch (err: any) {
    console.error(chalk.red(`\u2718 Network error: ${err.message}`));
    process.exit(1);
  }
}
