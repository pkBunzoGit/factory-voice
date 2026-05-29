import fs from "fs";
import path from "path";

const content = fs.readFileSync(path.resolve(".env.local"), "utf-8");
for (const line of content.split("\n")) {
  const eq = line.indexOf("=");
  if (eq > 0) {
    const k = line.slice(0, eq).trim();
    const v = line.slice(eq + 1).trim();
    if (!process.env[k]) process.env[k] = v;
  }
}

const TEST_MESSAGE = process.argv[2] || "Do you have home batteries for sale?";

async function run() {
  const { default: postgres } = await import("postgres");
  const { default: Anthropic } = await import("@anthropic-ai/sdk");
  const { CHAT_STYLE_RULES } = await import("../src/lib/language");

  const sql = postgres(process.env.DATABASE_URL!, { ssl: "require" });
  const f = await sql`SELECT system_prompt FROM factories WHERE id = 'fa478f8b-7960-4134-a9c5-1dfde89e68a4'`;
  const systemPrompt = f[0].system_prompt as string;
  await sql.end();

  const claude = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });
  const response = await claude.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 400,
    system: systemPrompt + CHAT_STYLE_RULES,
    messages: [{ role: "user", content: TEST_MESSAGE }],
  });

  console.log(`\nCustomer: "${TEST_MESSAGE}"\n`);
  console.log("Bot response:");
  console.log("─────────────────────────────────────");
  console.log(response.content[0].type === "text" ? response.content[0].text : "");
  console.log("─────────────────────────────────────");
}

run().catch((err) => { console.error(err); process.exit(1); });
