import fs from "node:fs";
import path from "node:path";

import { getSqliteClient } from "@/db/client";
import { personasRepo } from "@/lib/repositories/personasRepo";

let initialized = false;

export function ensureDatabaseReady() {
  if (initialized) {
    return;
  }

  const sqlite = getSqliteClient();
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS __app_migrations (
      id TEXT PRIMARY KEY,
      applied_at INTEGER NOT NULL
    )
  `);

  const migrationsDir = path.resolve("src/db/migrations");
  const migrationFiles = fs
    .readdirSync(migrationsDir)
    .filter((file) => file.endsWith(".sql"))
    .sort();

  for (const file of migrationFiles) {
    const existing = sqlite
      .prepare("SELECT id FROM __app_migrations WHERE id = ?")
      .get(file);

    if (!existing) {
      const sqlText = fs.readFileSync(path.join(migrationsDir, file), "utf8");
      sqlite.exec(sqlText);
      sqlite
        .prepare("INSERT INTO __app_migrations (id, applied_at) VALUES (?, ?)")
        .run(file, Date.now());
    }
  }

  personasRepo.seedDefaultPersonas();
  initialized = true;
}
