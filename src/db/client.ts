import fs from "node:fs";
import path from "node:path";

import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";

import { applyPragmas } from "@/db/pragmas";
import { schema } from "@/db/schema";
import { env } from "@/lib/env";

let sqlite: Database.Database | null = null;
let dbInstance: ReturnType<typeof drizzle<typeof schema>> | null = null;
let cachedDatabasePath: string | null = null;

function ensureDataDir() {
  const resolved = path.resolve(env.DATABASE_PATH);
  cachedDatabasePath = resolved;
  fs.mkdirSync(path.dirname(resolved), { recursive: true });
  return resolved;
}

function getSqlite() {
  if (!sqlite) {
    sqlite = new Database(ensureDataDir());
    applyPragmas(sqlite);
  }

  return sqlite;
}

export function getDb() {
  if (!dbInstance) {
    dbInstance = drizzle(getSqlite(), { schema });
  }

  return dbInstance;
}

export function getSqliteClient() {
  return getSqlite();
}

export function getSqliteDatabase() {
  return getSqlite();
}

export function getDatabaseFilePath() {
  return cachedDatabasePath ?? path.resolve(env.DATABASE_PATH);
}

export function closeDb() {
  if (sqlite) {
    sqlite.close();
    sqlite = null;
  }

  dbInstance = null;
}
