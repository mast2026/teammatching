import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");

function loadEnv() {
  for (const file of [".env.local", ".env"]) {
    const envPath = path.join(root, file);
    if (!fs.existsSync(envPath)) continue;
    for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq < 1) continue;
      const key = trimmed.slice(0, eq).trim();
      let value = trimmed.slice(eq + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      if (!process.env[key]) process.env[key] = value;
    }
  }
}

function runPsql(args, label) {
  return new Promise((resolve, reject) => {
    const child = spawn("psql", args, {
      cwd: root,
      env: {
        ...process.env,
        PSQLRC: "/dev/null"
      },
      stdio: ["ignore", "pipe", "pipe"]
    });

    child.stdout.on("data", (chunk) => process.stdout.write(chunk));
    child.stderr.on("data", (chunk) => process.stderr.write(chunk));
    child.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${label} failed with exit code ${code}`));
    });
  });
}

loadEnv();

const dbUrl = process.env.SUPABASE_DB_URL || process.env.DATABASE_URL;
if (!dbUrl) {
  console.error("Missing SUPABASE_DB_URL in .env.local");
  process.exit(1);
}

const schemaPath = path.join(root, "supabase_team_matching_schema.sql");
const importPath = path.join(root, "supabase_team_matching_import.sql");
if (!fs.existsSync(schemaPath)) {
  console.error("Missing supabase_team_matching_schema.sql");
  process.exit(1);
}
if (!fs.existsSync(importPath)) {
  console.error("Missing supabase_team_matching_import.sql. Run npm run import:sql first.");
  process.exit(1);
}

console.log("Applying team matching schema...");
await runPsql([dbUrl, "-v", "ON_ERROR_STOP=1", "-f", schemaPath], "schema");

console.log("Importing Replit team matching data...");
await runPsql([dbUrl, "-v", "ON_ERROR_STOP=1", "-f", importPath], "import");

console.log("Reloading PostgREST schema cache and verifying counts...");
await runPsql(
  [
    dbUrl,
    "-v",
    "ON_ERROR_STOP=1",
    "-c",
    "notify pgrst, 'reload schema';",
    "-c",
    `
select 'team_matching_members' as table_name, count(*) from public.team_matching_members
union all select 'team_matching_contests', count(*) from public.team_matching_contests
union all select 'team_matching_teams', count(*) from public.team_matching_teams
union all select 'team_matching_team_members', count(*) from public.team_matching_team_members
union all select 'team_matching_applications', count(*) from public.team_matching_applications
union all select 'team_matching_leader_applications', count(*) from public.team_matching_leader_applications
union all select 'team_matching_awards', count(*) from public.team_matching_awards
order by table_name;
    `
  ],
  "verify"
);

console.log("Done.");
