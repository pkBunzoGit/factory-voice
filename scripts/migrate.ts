/**
 * Database migration runner.
 *
 * Reads all .sql files from supabase/migrations/ in alphabetical order,
 * tracks which have been applied in a _migrations table, and runs any
 * pending ones inside a transaction.
 *
 * Usage:
 *   npx tsx scripts/migrate.ts          (uses DATABASE_URL from .env.local)
 *   DATABASE_URL=postgres://... npx tsx scripts/migrate.ts
 */

import fs from "fs";
import path from "path";
import postgres from "postgres";

function getConnectionString(): string {
  // Try loading .env.local manually (no dotenv dependency needed)
  const envPath = path.resolve(process.cwd(), ".env.local");
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, "utf-8");
    for (const line of content.split("\n")) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith("#")) {
        const eqIdx = trimmed.indexOf("=");
        if (eqIdx > 0) {
          const key = trimmed.slice(0, eqIdx).trim();
          const val = trimmed.slice(eqIdx + 1).trim();
          if (!process.env[key]) {
            process.env[key] = val;
          }
        }
      }
    }
  }

  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error(
      "ERROR: DATABASE_URL not found.\n" +
        "Add it to .env.local:\n" +
        "  DATABASE_URL=postgresql://postgres.[project-ref]:[password]@aws-0-ap-south-1.pooler.supabase.com:6543/postgres\n" +
        "Get it from: Supabase Dashboard → Project Settings → Database → Connection string (URI)\n"
    );
    process.exit(1);
  }
  return url;
}

async function migrate() {
  const connectionString = getConnectionString();
  const sql = postgres(connectionString, {
    ssl: "require",
    onnotice: () => {},
  });

  console.log("Connecting to database...");

  // Ensure _migrations tracking table exists
  await sql`
    CREATE TABLE IF NOT EXISTS _migrations (
      id serial PRIMARY KEY,
      name text UNIQUE NOT NULL,
      applied_at timestamptz DEFAULT now()
    )
  `;

  // Read migration files
  const migrationsDir = path.resolve(process.cwd(), "supabase/migrations");
  if (!fs.existsSync(migrationsDir)) {
    console.log("No migrations directory found at supabase/migrations/");
    await sql.end();
    return;
  }

  const files = fs
    .readdirSync(migrationsDir)
    .filter((f) => f.endsWith(".sql"))
    .sort();

  if (files.length === 0) {
    console.log("No migration files found.");
    await sql.end();
    return;
  }

  // Get already-applied migrations
  const applied = await sql`SELECT name FROM _migrations ORDER BY name`;
  const appliedSet = new Set(applied.map((r) => r.name));

  const pending = files.filter((f) => !appliedSet.has(f));

  if (pending.length === 0) {
    console.log(`All ${files.length} migrations already applied.`);
    await sql.end();
    return;
  }

  console.log(
    `Found ${pending.length} pending migration(s) out of ${files.length} total.\n`
  );

  for (const file of pending) {
    const filePath = path.join(migrationsDir, file);
    const content = fs.readFileSync(filePath, "utf-8");

    console.log(`Applying: ${file}...`);

    try {
      await sql.begin(async (tx) => {
        await tx.unsafe(content);
        await tx`INSERT INTO _migrations (name) VALUES (${file})`;
      });
      console.log(`  ✓ ${file} applied successfully`);
    } catch (err) {
      console.error(`  ✗ ${file} FAILED:`);
      console.error(`    ${(err as Error).message}`);
      console.error("\nAborting. Fix the migration and re-run.");
      await sql.end();
      process.exit(1);
    }
  }

  console.log(`\nDone. ${pending.length} migration(s) applied.`);
  await sql.end();

  // Ensure Supabase Storage buckets exist
  await ensureStorageBuckets();
}

async function ensureStorageBuckets() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) return;

  const buckets = [{ id: "combo-images", public: true }];

  for (const bucket of buckets) {
    try {
      const res = await fetch(`${supabaseUrl}/storage/v1/bucket/${bucket.id}`, {
        headers: {
          apikey: serviceKey,
          Authorization: `Bearer ${serviceKey}`,
        },
      });

      if (res.status === 404) {
        const createRes = await fetch(`${supabaseUrl}/storage/v1/bucket`, {
          method: "POST",
          headers: {
            apikey: serviceKey,
            Authorization: `Bearer ${serviceKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            id: bucket.id,
            name: bucket.id,
            public: bucket.public,
          }),
        });
        if (createRes.ok) {
          console.log(`Storage bucket '${bucket.id}' created.`);
        }
      }
    } catch {
      // Storage bucket check is best-effort
    }
  }
}

migrate().catch((err) => {
  console.error("Migration runner error:", err);
  process.exit(1);
});
