import { PrismaClient } from "@prisma/client";
import * as fs from "fs";
import * as path from "path";

const prisma = new PrismaClient();

async function seed() {
  const examplesDir = path.resolve(__dirname, "../../../packages/spec/examples");
  const files = ["docs-search.json", "project-tracker.json"];

  for (const file of files) {
    const raw = fs.readFileSync(path.join(examplesDir, file), "utf-8");
    const manifest = JSON.parse(raw);
    const origin = manifest.origin;

    const record = await prisma.origin.upsert({
      where: { origin },
      create: {
        origin,
        status: "verified",
        attested: false,
        manifestJson: raw,
      },
      update: {
        status: "verified",
        manifestJson: raw,
        lastChecked: new Date(),
      },
    });

    // Clear and re-insert tools
    await prisma.tool.deleteMany({ where: { originId: record.id } });
    await prisma.tool.createMany({
      data: manifest.tools.map((t: any) => ({
        originId: record.id,
        name: t.name,
        description: t.description,
        version: t.version,
        tags: JSON.stringify(t.tags),
        riskLevel: t.risk_level,
        requiresUserConfirm: t.requires_user_confirm,
      })),
    });

    console.log(`Seeded: ${origin} (${manifest.tools.length} tools)`);
  }

  await prisma.$disconnect();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
