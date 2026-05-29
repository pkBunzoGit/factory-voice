/**
 * Manual brain regeneration for local debugging.
 * Usage: npx tsx scripts/regen-brain.ts [factory-id]
 */
import fs from "fs";
import path from "path";
import { createClient } from "@supabase/supabase-js";

const content = fs.readFileSync(path.resolve(".env.local"), "utf-8");
for (const line of content.split("\n")) {
  const eq = line.indexOf("=");
  if (eq > 0) {
    const k = line.slice(0, eq).trim();
    const v = line.slice(eq + 1).trim();
    if (!process.env[k]) process.env[k] = v;
  }
}

const FACTORY_ID = process.argv[2] || "fa478f8b-7960-4134-a9c5-1dfde89e68a4";

async function run() {
  const { regenerateBrain } = await import("../src/lib/regenerate-brain");

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  console.log("Regenerating brain for factory:", FACTORY_ID);
  const brain = await regenerateBrain(supabase, FACTORY_ID);

  if (!brain.ok) {
    console.error("Failed:", brain.error);
    process.exit(1);
  }

  console.log("Brain saved. updated_at:", brain.updated_at);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
