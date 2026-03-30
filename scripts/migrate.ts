import fs from "node:fs";
import path from "node:path";

import { getSqliteClient } from "@/db/client";
import { personasRepo } from "@/lib/repositories/personasRepo";

const sqlite = getSqliteClient();

sqlite.exec(`
  CREATE TABLE IF NOT EXISTS __app_migrations (
    id TEXT PRIMARY KEY,
    applied_at INTEGER NOT NULL
  )
`);

const migrationDir = path.resolve("src/db/migrations");
const migrations = fs
  .readdirSync(migrationDir)
  .filter((file) => file.endsWith(".sql"))
  .sort();

for (const file of migrations) {
  const alreadyApplied = sqlite
    .prepare("SELECT id FROM __app_migrations WHERE id = ?")
    .get(file);

  if (alreadyApplied) {
    continue;
  }

  const sqlText = fs.readFileSync(path.join(migrationDir, file), "utf8");
  sqlite.exec(sqlText);
  sqlite
    .prepare("INSERT INTO __app_migrations (id, applied_at) VALUES (?, ?)")
    .run(file, Date.now());
}

personasRepo.seedDefaultPersonas();
